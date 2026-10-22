# Numeria · handwritten digit recogniser (ml)

On-device recognition of one handwritten digit (Apple Pencil, S Pen, finger or mouse) for the Numeria PWA.
Everything runs in the browser in pure TypeScript (no dependencies, no network after the first load):

```
strokes (zone px) ──► src/ink/ml/preprocess.ts ──► 28×28 image ──► src/ink/ml/cnn.ts ──► 11 probabilities
                         (== ml/preprocess.py)                     (public/models/digits)    0..9 + "reject"
                                                                         │
                                         64-d embedding ──► src/ink/ml/personalize.ts (child's own samples, kNN)
                                                                         │
                                                         src/ink/ml/recognizer.ts ──► DigitRecognition
```

## Public API (for the ink module)

`src/ink/ml/recognizer.ts` — the only entry point other modules should use.

```ts
import { createRecognizer, encodeImage28 } from '@/ink/ml/recognizer'

const rec = createRecognizer()          // cheap; the model is fetched once per URL and shared
await rec.load()                        // fetches /models/digits/model.json + model.bin (~245 KB)
const r = rec.recognize(strokes, { width, height })   // synchronous, ~1-2 ms
r.digit          // 0..9 or null (empty, tiny, scribble/symbol, or confidence < 0.35)
r.confidence     // 0..1 for r.digit (0 when null)
r.probs          // 10 probabilities (after personalisation), sum 1
r.alternatives   // top 3 [{digit, p}] sorted, for "¿Querías escribir…?" chips (first = best guess)
r.embedding      // 64 numbers: store with the sample for personalisation
r.image28        // Float32Array(784) 0..1 — store as InkSample.image28 via encodeImage28()
r.reason         // 'ok' | 'empty' | 'tiny' | 'scribble' | 'unsure' | 'not-ready'  (extra field)
r.rejectProb, r.personalWeight, r.ms  // diagnostics (extra fields)

rec.setPersonalSamples([{ digit, embedding, image28 /* base64 from InkSample */ }, ...])
rec.modelId      // e.g. "digits-1a2b3c4d5e" — embeddings are only valid for this model
```

Notes:

* Pass `image28` (the `InkSample.image28` base64) in personal samples whenever you have it: embeddings are
  then recomputed with the current model, so stored samples survive model updates. Samples that only carry an
  `embedding` from another `modelId` are ignored.
* `recognize()` never throws: before `load()` resolves it returns `digit: null, reason: 'not-ready'`.
* Stray taps (a tiny stroke far away from the digit, e.g. tapping the cell before writing) are ignored.
* The on-screen pen width/pressure is irrelevant: the recogniser re-renders strokes with its own uniform pen.
* Only `zoneSize` is used to decide what is "too tiny" (`max(3 px, 6 % of min(width, height))`).

## Preprocessing (identical in Python and TypeScript)

`ml/preprocess.py` and `src/ink/ml/preprocess.ts` implement the same algorithm, checked to < 1e-5 per pixel on
shared fixtures (`src/ink/ml/__fixtures__/cases.json`, test `preprocess.test.ts`):

0. drop stray strokes (extent < 12 % of all ink and farther than 20 % of the rest's extent from it);
1. bounding box of all points; no ink → `empty`; extent below the tiny threshold → `tiny`;
2. uniform scale (aspect ratio preserved — a thin "1" stays thin) so ink + pen fits a 20×20 box;
3. anti-aliased distance rasteriser on a Float64Array (no DOM canvas): round caps/joins, pen width 2.6 px,
   coverage = clamp(r + 0.5 − distance, 0, 1), union = max;
4. second pass shifted so the centre of mass is at (14, 14) (MNIST convention), values 0..1.

## Training data (all rendered through the same preprocessing)

| source | size | what |
|---|---|---|
| MNIST re-stroked | 180 k | MNIST train → 4× upsample → skeleton (spur pruning) → re-rendered with the app's uniform pen; 1 clean + 2 augmented variants per image |
| MNIST raw | 60 k | original images (robustness to thick, variable ink) |
| handwriting fonts | 150 k | 94 Google Fonts incl. 20 *Playwrite* national school scripts (Spain's among them); glyph → skeleton → uniform pen, 160 augmented variants per digit |
| synthetic strokes | 240 k | `ml/synth.py`: every digit as 1-3 strokes with child-like variants (1 with/without flag and base, Spanish long-flag 1 incl. long flat flags, 7 with/without crossbar, short-bar 7, open/closed 4, 9 with straight/curved/separate tail, 2 with/without loop, round/angular/cusp 3, 5 with joined/detached top bar, 6/9 loop sizes, single-stroke and two-loop 8), wobble, tremor, overshoot, gaps between strokes, tilt, size and aspect variation |
| non-digits ("reject") | ~29 k | scribbles, hatching, spirals, ×, +, =, #, stars, dashes, scattered marks |

Augmentation (stroke level, before rasterising): rotation ±15°, shear ±0.3, aspect 0.72–1.35, smooth elastic
field, per-stroke offsets (gaps), overshoot, wobble, sensor jitter, pen width 1.9–3.5 px (40 % nominal);
plus ±1 px shifts during training.

Held out for testing only: the MNIST test set, 12 handwriting fonts never used in training
(`ml/fonts_list.py: TEST_FONTS`) and a synthetic stroke test set with a different seed.

## Model

`ml/model.py`, arch `v2` (default): conv5×5(1→16) → pool → conv3×3(16→32) → pool → conv3×3(32→64) → pool →
dense 576→64 (**embedding**, post-ReLU) → dense 64→11 → softmax. Batch norm folded at export.
61 k parameters, 245 KB float32, ~2.2 M multiply-adds. AdamW + OneCycle, label smoothing 0.05, 14 epochs.

### Export format (`public/models/digits/model.json` + `model.bin`)

```jsonc
{ "format": "numeria-seq-cnn", "version": 1, "modelId": "digits-<sha>", "input": {"shape": [1,28,28], "layout": "chw"},
  "labels": ["0",…,"9","reject"], "rejectIndex": 10, "embeddingSize": 64, "preprocess": {…constants…},
  "weights": {"file": "model.bin", "byteLength": N, "dtype": "float32", "endianness": "little"},
  "layers": [ {"type": "conv2d", "inShape": [1,28,28], "outShape": [16,28,28], "kernel": [5,5], "padding": 2,
               "activation": "relu", "weight": {"offset": 0, "shape": [16,1,5,5], "dtype": "float32"}, "bias": {…}},
              {"type": "maxpool2d", "size": 2, "stride": 2, …}, …, {"type": "flatten"},
              {"type": "dense", "embedding": true, …}, {"type": "dense", …}, {"type": "softmax"} ],
  "metrics": { …summary of ml/metrics.json… } }
```

Offsets are bytes into `model.bin`. The TS loader also accepts `int8` tensors (`scale` or per-output-channel
`scales`), unused for now because float32 is already far below the 1 MB budget. The loader validates format,
version, byte length and shapes, and re-fetches the `.bin` bypassing caches if its size disagrees with the JSON
(stale PWA cache after an update).

## Personalisation

`src/ink/ml/personalize.ts`: cosine kNN over the 64-d embeddings of the child's own samples (calibration,
confirmed and corrected answers). Per class c with samples: s_c = mean of the top-2 similarities (top-1 if one
sample), q = softmax over {sampled classes} ∪ {"none of them" at threshold 0.9} with T = 0.02, weight
W_c = 0.6·(1 − e^(−n_c/1.5)); p(c) = cnn(c)·(1 − Σ W_k q_k) + W_c q_c. The CNN always keeps ≥ 40 % of the mass:
one wrong sample (W ≈ 0.29) cannot flip a confident CNN, 3+ consistent samples of an odd style can.
Thresholds come from `ml/calibrate_personal.py` (same writer & digit: cosine ≥ 0.97; different digits ≤ 0.43;
an odd mirrored "3" vs the same writer's "8": 0.75–0.85).

Tested in `recognizer.test.ts` with a simulated child who writes a mirrored "3" (Ɛ) that the CNN alone reads as
6/8: with her calibration samples + 3 corrections, her Ɛ is read as 3 while her 8s stay 8.

## Metrics

See `ml/metrics.json` (written by `ml/eval.py` on the exported model, NumPy reference == TS runtime).
"app accuracy" applies the app's decision rule (null if reject wins or confidence < 0.35, counted as wrong).

<!-- metrics:begin -->
| test set | digits | accuracy (0-9) | app accuracy | null (asks again) | wrong digit | scribbles rejected |
|---|---:|---:|---:|---:|---:|---:|
| MNIST test (original images) | 10000 | **99.36 %** | 99.12 % | 0.30 % | 0.58 % | — |
| MNIST test re-stroked with the app pen | 10000 | **98.86 %** | 98.75 % | 0.23 % | 1.02 % | — |
| held-out handwriting fonts (never trained on) | 4800 | **98.90 %** | 98.88 % | 0.02 % | 1.10 % | — |
| synthetic child-like strokes (test seed) | 5287 | **99.96 %** | 99.96 % | 0.00 % | 0.04 % | 99.6 % of 713 |

Confusions between the classic pairs (errors in both directions / digits of both classes, app decision):

| test set | 1↔7 | 4↔9 | 3↔8 | 5↔6 | 2↔7 | top confusions (true→pred) |
|---|---:|---:|---:|---:|---:|---|
| MNIST test (original images) | 12 (0.56 %) | 10 (0.50 %) | 2 (0.10 %) | 3 (0.16 %) | 4 (0.19 %) | 9->4: 10, 7->1: 10, 5->3: 6, 6->0: 5 |
| MNIST test re-stroked with the app pen | 9 (0.42 %) | 11 (0.55 %) | 3 (0.15 %) | 1 (0.05 %) | 7 (0.34 %) | 9->7: 11, 9->4: 7, 7->1: 7, 9->1: 5 |
| held-out handwriting fonts (never trained on) | 50 (5.21 %) | 0 (0.00 %) | 0 (0.00 %) | 0 (0.00 %) | 0 (0.00 %) | 1->7: 40, 7->1: 10, 7->9: 2, 1->9: 1 |
| synthetic child-like strokes (test seed) | 2 (0.19 %) | 0 (0.00 %) | 0 (0.00 %) | 0 (0.00 %) | 0 (0.00 %) | 1->7: 2 |

Per-class accuracy (0-9), %:

| test set | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| MNIST test (original images) | 99.6 | 99.8 | 99.6 | 99.7 | 100.0 | 99.2 | 98.6 | 98.9 | 99.2 | 98.8 |
| MNIST test re-stroked with the app pen | 99.7 | 99.2 | 99.1 | 99.5 | 99.2 | 98.9 | 98.6 | 98.7 | 98.2 | 97.4 |
| held-out handwriting fonts (never trained on) | 100.0 | 91.5 | 100.0 | 100.0 | 100.0 | 100.0 | 100.0 | 97.5 | 100.0 | 100.0 |
| synthetic child-like strokes (test seed) | 100.0 | 99.6 | 100.0 | 100.0 | 100.0 | 100.0 | 100.0 | 100.0 | 100.0 | 100.0 |

Model `digits-bfa3be125a`.
<!-- metrics:end -->

Inference in Node 22 (V8, 4-CPU dev container, single thread), measured by `npx vitest run src/ink/ml`:

<!-- timing:begin -->
<!-- timing:end -->

A 2020+ iPad / Android tablet browser runs V8/JSC at a similar speed, far below the 5 ms budget.

## How to retrain

```bash
python3 -m venv ml/.venv
ml/.venv/bin/pip install numpy scipy scikit-image pillow torch   # torch from PyPI (CPU is fine)
bash ml/release.sh            # fonts + MNIST download, data build (~25 min), training (~30 min on 4 CPUs),
                              # export, eval, re-export with metrics, fixtures, vitest
bash ml/release.sh --quick    # small data + 2 epochs (~10 min) for pipeline checks
```

Steps individually: `fetch_fonts.py`, `get_mnist.sh`, `build_data.py [--quick] [--only mnist,fonts,synth]`,
`train.py --arch v2 --epochs 14`, `export.py`, `eval.py`, `make_fixtures.py`, then `npx vitest run src/ink/ml`.
Dev tools: `contact_sheet.py synth|reject out.png`, `calibrate_personal.py`, and the in-app lab at
`/dev/gallery?only=src/ink/ml` (write with the Pencil and see the 28×28 input, probabilities, timing; tapping an
alternative chip stores a personal sample).

**If you change preprocessing**, change both `ml/preprocess.py` and `src/ink/ml/preprocess.ts`, rebuild the
data, retrain, and re-export the fixtures. Keep the JSON format backwards compatible with `cnn.ts`.

`ml/data/` and `ml/cache/` (datasets, checkpoints) are gitignored; only scripts, the exported model and small
fixtures are committed.

## Known limitations

* No real children's handwriting was available: child-likeness comes from the synthetic stroke generator and
  school-script fonts; personalisation covers individual quirks. Collect consented `InkSample.image28` data to
  retrain later (the format is ready for it).
* Ultra-condensed digits (e.g. the *Amatic SC* font, width/height ≈ 0.25) look like "1" after aspect-preserving
  normalisation — children don't write like that, so that font was removed from the held-out set.
* One digit per call: multi-digit segmentation belongs to the ink module.
