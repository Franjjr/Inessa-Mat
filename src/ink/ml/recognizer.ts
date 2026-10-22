/* PUBLIC API of the digit recogniser (agent: ml). Pure TS (no React): preprocessing strokes → 28×28,
   CNN inference from /models/digits/model.json, personalised kNN blending.
   Contract:
     createRecognizer(): DigitRecognizer           — singleton-friendly, call load() once
     setPersonalSamples(samples: {digit, embedding}[]) — child's calibration / confirmed samples
   The ink agent builds UI on top of this; it must not reimplement preprocessing or inference.

   Notes for callers
   - The model file is fetched once per URL and shared by every recogniser instance.
   - recognize() is synchronous (≈1–3 ms). Before load() resolves it returns digit null (reason 'not-ready').
   - digit is null for empty ink, ink smaller than the zone's tiny threshold, scribbles/symbols (reject class)
     or low confidence (< minConfidence). `alternatives` is always the top 3 digits, sorted (first = best guess),
     whenever the model ran (also for scribbles / unsure) — the UI decides which chips to show.
   - Embeddings are tied to the model version (`modelId`). Prefer passing `image28` (InkSample.image28 base64)
     in personal samples: the recogniser then recomputes embeddings with the current model, so stored samples
     survive model updates. */
import type { DigitRecognition, DigitRecognizer, InkStroke } from '@/types'
import { Cnn, fetchCnn, type ModelSpec } from './cnn'
import { DEFAULT_PERSONALIZATION, PersonalIndex, type IndexedSample, type PersonalizationConfig } from './personalize'
import { decodeImage28, encodeImage28, preprocessStrokes, type PreprocessReason } from './preprocess'

export { encodeImage28, decodeImage28 }

export interface PersonalSample {
  digit: number
  embedding: number[]
  /** Optional 28×28 image (InkSample.image28 base64, or 784 values 0..1). When present the embedding is
      recomputed with the loaded model, so samples survive model updates. */
  image28?: string | ArrayLike<number>
  /** Model that produced `embedding`; samples from another model without image28 are ignored. */
  modelId?: string
}

export type RecognitionReason = 'ok' | 'empty' | 'tiny' | 'scribble' | 'unsure' | 'not-ready'

/** DigitRecognition plus diagnostics (extra fields are optional to read). */
export interface NumeriaRecognition extends DigitRecognition {
  reason: RecognitionReason
  /** Probability that the ink is not a digit at all (scribble, symbol...). */
  rejectProb: number
  /** Probability mass moved by the child's personal samples (0 = pure CNN). */
  personalWeight: number
  /** Inference time in ms (preprocessing + CNN + blending). */
  ms: number
}

export interface RecognizerOptions {
  /** URL of model.json. Default `${BASE_URL}models/digits/model.json`. */
  modelUrl?: string
  fetchImpl?: typeof fetch
  /** Provide an already-built model (tests / workers). */
  model?: Cnn | Promise<Cnn>
  /** Below this probability the digit is reported as null. Default 0.35. */
  minConfidence?: number
  personalization?: Partial<PersonalizationConfig>
}

export interface NumeriaRecognizer extends DigitRecognizer {
  setPersonalSamples(samples: PersonalSample[]): void
  recognize(strokes: InkStroke[], zoneSize: { width: number; height: number }): NumeriaRecognition
  /** Runs the CNN on an already preprocessed 28×28 image. */
  recognizeImage(image28: ArrayLike<number>): NumeriaRecognition
  /** Model id of the loaded model (null until loaded). Store it with embeddings. */
  readonly modelId: string | null
  /** Number of personal samples currently in use, per digit. */
  personalCounts(): number[]
}

export const DEFAULT_MODEL_URL = `${import.meta.env?.BASE_URL ?? '/'}models/digits/model.json`
export const MIN_CONFIDENCE = 0.35

const modelCache = new Map<string, Promise<Cnn>>()
/** Embeddings of stored base64 samples, keyed by `${modelId}:${image28}` (avoids recomputing on every update). */
const embedCache = new Map<string, Float32Array>()

/** Loads (once per URL) and caches the CNN. A failed load is not cached, so callers may retry. */
export function loadDigitModel(url = DEFAULT_MODEL_URL, fetchImpl?: typeof fetch): Promise<Cnn> {
  let p = modelCache.get(url)
  if (!p) {
    p = fetchCnn(url, fetchImpl ?? fetch)
    modelCache.set(url, p)
    p.catch(() => modelCache.delete(url))
  }
  return p
}

/** Build a model from in-memory JSON + weights (tests, workers, tooling). */
export function modelFromBuffers(spec: ModelSpec, weights: ArrayBuffer): Cnn {
  return new Cnn(spec, weights)
}

const EMPTY_IMAGE = () => new Float32Array(784)
const uniform = () => Array(10).fill(0.1) as number[]

function emptyResult(reason: RecognitionReason, image28: Float32Array, ms = 0): NumeriaRecognition {
  return { digit: null, confidence: 0, probs: uniform(), alternatives: [], embedding: [], image28, reason, rejectProb: 0, personalWeight: 0, ms }
}

function toImage(img: string | ArrayLike<number>): Float32Array | null {
  if (typeof img === 'string') return decodeImage28(img)
  if (img.length !== 784) return null
  return Float32Array.from(img)
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function createRecognizer(options: RecognizerOptions = {}): NumeriaRecognizer {
  const minConfidence = options.minConfidence ?? MIN_CONFIDENCE
  let model: Cnn | null = options.model instanceof Cnn ? options.model : null
  let loading: Promise<void> | null = null
  let pending: PersonalSample[] = []
  let index: PersonalIndex | null = null

  const buildIndex = () => {
    if (!model) return
    const personalCfg = (model.spec as ModelSpec & { personalization?: Partial<PersonalizationConfig> }).personalization
    index = new PersonalIndex(10, { ...DEFAULT_PERSONALIZATION, ...personalCfg, ...options.personalization })
    const dim = model.embeddingSize
    // only the newest maxPerClass samples per digit matter: skip older ones before any CNN work
    const perClass = new Map<number, number>()
    const recent: PersonalSample[] = []
    for (let i = pending.length - 1; i >= 0; i--) {
      const s = pending[i]
      const n = perClass.get(s.digit) ?? 0
      if (n >= index.config.maxPerClass) continue
      perClass.set(s.digit, n + 1)
      recent.push(s)
    }
    recent.reverse()
    const ready = recent.flatMap((s): IndexedSample[] => {
      if (s.image28 != null) {
        const key = typeof s.image28 === 'string' ? `${model!.modelId}:${s.image28}` : null
        const cached = key ? embedCache.get(key) : undefined
        if (cached) return [{ digit: s.digit, embedding: cached }]
        const img = toImage(s.image28)
        if (img) {
          const e = model!.run(img).embedding
          if (e) {
            const copy = Float32Array.from(e)
            if (key) {
              if (embedCache.size > 2000) embedCache.clear()
              embedCache.set(key, copy)
            }
            return [{ digit: s.digit, embedding: copy }]
          }
        }
      }
      if (s.modelId && s.modelId !== model!.modelId) return []
      return s.embedding?.length === dim ? [{ digit: s.digit, embedding: s.embedding }] : []
    })
    index.set(ready, dim)
  }

  const classify = (image: Float32Array, t0: number): NumeriaRecognition => {
    const m = model!
    const { output, embedding } = m.run(image)
    const emb = embedding ? Array.from(embedding) : []
    const rejectIndex = m.spec.rejectIndex ?? null
    let blended: Float64Array
    let personalWeight = 0
    if (index && index.size > 0 && embedding) {
      const r = index.blend(output, embedding)
      blended = r.probs
      personalWeight = r.personalWeight
    } else {
      blended = Float64Array.from(output)
    }
    const rejectProb = rejectIndex != null && rejectIndex < blended.length ? blended[rejectIndex] : 0
    let digitMass = 0
    for (let d = 0; d < 10; d++) digitMass += blended[d]
    const probs = Array.from({ length: 10 }, (_, d) => (digitMass > 0 ? blended[d] / digitMass : 0.1))
    const order = probs.map((p, d) => ({ digit: d, p })).sort((a, b) => b.p - a.p)
    const top = order[0]
    const confidence = blended[top.digit]
    let reason: RecognitionReason = 'ok'
    if (rejectProb >= confidence) reason = 'scribble'
    else if (confidence < minConfidence) reason = 'unsure'
    return {
      digit: reason === 'ok' ? top.digit : null,
      confidence: reason === 'ok' ? confidence : 0,
      probs,
      alternatives: order.slice(0, 3),
      embedding: emb,
      image28: image,
      reason,
      rejectProb,
      personalWeight,
      ms: now() - t0,
    }
  }

  const rec: NumeriaRecognizer = {
    get ready() {
      return model != null
    },
    get modelId() {
      return model?.modelId ?? null
    },
    load() {
      if (model) return Promise.resolve()
      if (!loading) {
        const src = options.model ?? loadDigitModel(options.modelUrl ?? DEFAULT_MODEL_URL, options.fetchImpl)
        loading = Promise.resolve(src).then(
          (m) => {
            model = m
            // warm-up: let the JIT compile the hot loops now, so the child's first digit is answered fast
            m.run(new Float32Array(m.inputSize))
            buildIndex()
          },
          (err: unknown) => {
            loading = null
            throw err
          },
        )
      }
      return loading
    },
    recognize(strokes, zoneSize) {
      const t0 = now()
      const pre = preprocessStrokes(strokes ?? [], zoneSize)
      if (!pre.image) return emptyResult(pre.reason as Exclude<PreprocessReason, 'ok'>, EMPTY_IMAGE(), now() - t0)
      if (!model) return emptyResult('not-ready', pre.image, now() - t0)
      return classify(pre.image, t0)
    },
    recognizeImage(image28) {
      const t0 = now()
      const img = Float32Array.from(image28)
      if (img.length !== 784) return emptyResult('empty', EMPTY_IMAGE())
      if (!model) return emptyResult('not-ready', img)
      return classify(img, t0)
    },
    setPersonalSamples(samples) {
      pending = Array.isArray(samples) ? samples.slice() : []
      if (model) buildIndex()
    },
    personalCounts() {
      return index ? index.counts() : Array(10).fill(0)
    },
  }
  if (model) buildIndex()
  return rec
}
