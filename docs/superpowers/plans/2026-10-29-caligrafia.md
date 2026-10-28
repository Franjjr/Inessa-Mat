# Caligrafía con lápiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An optional 5-minute cursive-handwriting practice with the pen, offered at the end of the Lengua session, that models each letter, lets the child trace and then write it on a two-line pauta, and grades shape, line, size and start strictly.

**Architecture:** Cursive letter models are centerline strokes (like `src/ink/digitModels.ts`) in a new `src/ink/cursive/` module, with a joiner that builds words. A pure scorer compares the child's strokes with the fitted model and returns four criteria, stars and one tip; its thresholds live in one config file. Handwriting skills use the `cal:` prefix, kept out of maths and Lengua readers. A planner picks 2–3 items; a new screen at `/play/caligrafia` runs mirar → repasar → escribir sola, reusing the ink capture, palm guard and stroke tools of `TraceDigit`.

**Tech Stack:** React 18 + TS + Vite, Dexie, Supabase sync, inline SVG, Pointer Events, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-29-caligrafia-design.md`

## Global Constraints

- Pen only: the practice is offered only when `readPenSeen()` is true or the input mode is `'pen'`, and the child's `settings.handwriting` is not `false`. It never shows on a device where the pen was never used.
- Letra ligada; two-line pauta (baseline and x-height line, with ascender/descender room).
- Strict grading: three stars only when all four criteria pass; a near miss (any one criterion just failed) gets at most two stars. Every result shows exactly one concrete Spanish tip about the worst criterion.
- The 5 minutes are after the 15-minute Lengua session: `src/engine/lengua/daily.ts` does not change.
- Skill keys start with `cal:`; maths and Lengua readers (`masteryOf`, `attemptsOf`, `subjectOfSession`, server `child_stats`) never count them.
- Strokes are scored on the device and never stored or sent; only the attempt (skill, correct, errorType, context with the four criteria) and mastery are saved.
- Caligrafía stars go to the shared wallet, once a day (own reward key), and do not affect the Lengua session stars.
- Spanish copy: correct, short, masculino genérico (no inclusive language). Never play audio in tests.
- Do not break the existing pen digit writing in `src/ink/` (TraceDigit, DigitCell, calibration).
- Type check `npx tsc -b`. Commit trailer `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. A child who writes the right letter but slightly too big, or a bit above the line → must not get three stars and must get the size/line tip: Task 3 tests «almost good» fixtures per criterion.
2. Palm resting on the screen while writing → ignored, as in TraceDigit: Task 5 test replays a touch stroke during a pen stroke and asserts it is not scored.
3. A letter written in several strokes or in the wrong order/direction (e.g. the o clockwise) → the start/direction criterion fails: Task 3 test.
4. A device that has never seen the pen, or the adult switch off → no offer at the end of Lengua: Task 6 tests.
5. Caligrafía attempts must not move maths accuracy (local or cloud) or the Lengua report: Task 1 tests on readers and migration 0004.

---

### Task 1: The `cal:` skills, the setting and the cloud stats

**Files:**
- Modify: `src/engine/subjects.ts`, `src/engine/skills.ts` (isValidSkill), `src/types/child.ts` (ChildSettings.handwriting, DEFAULT_CHILD_SETTINGS), `src/data/merge.ts` if settings merge needs the new key
- Create: `supabase/migrations/0004_caligrafia_stats.sql`
- Test: `src/engine/__tests__/subjects.test.ts` (extend), `src/engine/__tests__/skills.test.ts` (extend)

**Interfaces:**
- Produces: `export function isHandwritingSkill(skill: SkillKey): boolean` (prefix `cal:`); `masteryOf(m, 'math' | 'language')` and `attemptsOf(list, 'math' | 'language')` exclude `cal:` keys; `export function handwritingMastery(m: MasteryMap): MasteryMap` and `handwritingAttempts<T>(list: T[]): T[]`.
- Produces: `ChildSettings.handwriting: boolean` (default `true`).
- Produces: skill key grammar `cal:letra:<l>`, `cal:mayus:<L>`, `cal:enlace:<ab>`, `cal:palabra:<word>`, `cal:frase:<id>`; `isValidSkill` true for keys of the curriculum of Task 4 (until Task 4 exists, for any key matching that grammar).
- Migration 0004: `public.child_stats` as in 0003 plus `and t.skill not like 'cal:%'` in the `a` and `e` CTEs (same signature, security invoker, grants, header «HOW TO APPLY» like 0003; idempotent `create or replace`).

- [ ] **Step 1: Failing tests:** `masteryOf({ 'cal:letra:a': row, 'add:2d:c0': row, 'lng:gram:articulo': row }, 'math')` has only the `add` key; same for `'language'` → only `lng`; `handwritingMastery` → only `cal`; `attemptsOf` likewise; `isValidSkill('cal:letra:a') === true`, `isValidSkill('cal:') === false`; `DEFAULT_CHILD_SETTINGS.handwriting === true`; a text test that `0004_caligrafia_stats.sql` contains `not like 'cal:%'` twice and `not like 'lng:%'` twice.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run the two test files + `npx tsc -b` → PASS. **Step 5:** Commit «Caligrafía: skills cal:, ajuste del niño y estadísticas de la nube sin caligrafía».

### Task 2: The cursive models and the word joiner

**Files:**
- Create: `src/ink/cursive/models.ts`, `src/ink/cursive/join.ts`, `src/ink/cursive/CursiveModel.tsx` (SVG drawing of a model: dotted or solid, start dot, direction arrows, `play` animation, on a pauta), `src/ink/cursive/cursive.test.ts`, `src/ink/cursive/CursiveModel.test.tsx`

**Interfaces:**
- Produces in `models.ts`: the model box `CURSIVE_EM = 100` units; guide lines `BASELINE = 70`, `XHEIGHT = 40`, `ASCENDER = 5`, `DESCENDER = 100` (y grows downwards); `interface CursiveGlyph { strokes: ModelStroke[]; width: number; entry: ModelPoint; exit: ModelPoint }`; `CURSIVE_LOWER: Record<string, CursiveGlyph>` for a–z plus ñ; `CURSIVE_UPPER: Record<string, CursiveGlyph>` for A–Z plus Ñ. `ModelStroke`/`ModelPoint` reuse the types of `src/ink/digitModels.ts`.
- Produces in `join.ts`: `joinWord(text: string): { strokes: ModelStroke[]; width: number }` — lowercase letters are joined (exit of one to entry of the next with a smooth connector, one pen stroke where the cursive keeps the pen down); a space starts a new word offset; an uppercase letter at the start is not joined to the next only if its glyph has no exit.
- Shapes: a standard Spanish Primaria letra ligada (entry stroke from the baseline; d is round with a tall stem; ascender loops on l, b, h, k, f; descender loops on g, j, y, f; puentes on m, n, ñ, v, w). Points every ≤ 4 units along each stroke, in writing order and direction.

- [ ] **Step 1: Failing tests:** every lowercase and uppercase glyph exists (27 + 27), each stroke has ≥ 2 points and consecutive points ≤ 4 units apart; every x-height letter (a c e m n ñ o r s u v w x z i) stays within `XHEIGHT − 2 … BASELINE + 2` except its entry/exit; ascender letters (b d f h k l t) reach above `XHEIGHT − 15`; descender letters (f g j p q y) reach below `BASELINE + 15`; `o` is drawn counter-clockwise (signed area sign); `joinWord('os').strokes.length === 1` and its x-extent equals the sum of widths; `joinWord('la casa')` has two groups separated by a gap; `CursiveModel` renders a start dot and at least one arrow for `a`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement (write the glyph points as data; helper functions to build loops/arcs are fine). **Step 4:** PASS + `npx tsc -b`. **Step 5:** Commit «Caligrafía: modelos de letra ligada y enlaces».

### Task 3: The scorer (strict) and its thresholds

**Files:**
- Create: `src/ink/cursive/score.ts`, `src/ink/cursive/thresholds.ts`, `src/ink/cursive/tips.ts`, `src/ink/cursive/score.test.ts`, `src/ink/cursive/fixtures.ts` (stroke fixtures built from the models: exact, noisy-good, scaled, shifted, reversed, wrong letter)

**Interfaces:**
- Consumes: Task 2 models and `joinWord`; `InkStroke` from `src/ink`.
- Produces: `interface PautaFit { scale: number; ox: number; oy: number }` and `fitPauta(width: number, height: number, modelWidth: number): PautaFit`; `type Criterion = 'shape' | 'line' | 'size' | 'start'`; `interface CursiveScore { shape: number; line: number; size: number; start: number; passed: Record<Criterion, boolean>; stars: 1 | 2 | 3; worst: Criterion; tip: string }`; `scoreCursive(target: { strokes: ModelStroke[]; width: number }, ink: readonly InkStroke[], fit: PautaFit, text: string): CursiveScore`.
- `thresholds.ts` exports one object `CURSIVE_THRESHOLDS` with the pass value of each criterion and the two star cut-offs — the only place to tune them (owner trial in Task 7).
- Criteria: **shape** = symmetric mean distance child↔model after aligning, normalised by x-height (coverage and precision); **line** = how far the child's baseline points sit from `BASELINE`; **size** = child x-height / model x-height ratio; **start** = first point near the model start and overall direction along the model (dot product of resampled tangents).
- Stars: 3 if all four pass; 2 if exactly one fails and shape passes; else 1. `worst` = the criterion furthest from its pass value. `tip` from `tips.ts`, one per criterion and letter family, e.g. size → «La {l} te ha salido muy grande: que llegue solo hasta la línea de arriba.», line → «Apoya la {l} en la línea de abajo.», start → «Empieza la {l} por el punto verde y sigue la flecha.», shape for `o`/`a` → «Cierra bien la {l} por arriba.».

- [ ] **Step 1: Failing tests** (fixtures for `a`, `o`, `l`, `g` and the word `os`): exact → 3 stars, all passed; noisy-good (±1.5 units jitter) → 3; scaled ×1.4 → `size` fails, stars ≤ 2, tip mentions «grande»; shifted +8 units down → `line` fails, ≤ 2; `o` drawn clockwise → `start` fails; the letter `e` traced on an `a` target → `shape` fails, 1 star; two criteria failing → 1 star; an empty stroke list → 1 star with the start tip; `scoreCursive` is deterministic.
- [ ] **Steps 2–5:** FAIL, implement, PASS + `npx tsc -b`, commit «Caligrafía: nota exigente con forma, línea, tamaño e inicio».

### Task 4: The curriculum and the planner

**Files:**
- Create: `src/content/caligrafia/curriculum.ts`, `src/engine/caligrafia/plan.ts`, `src/engine/caligrafia/plan.test.ts`

**Interfaces:**
- Produces: `interface CalItem { skill: SkillKey; text: string; kind: 'letra' | 'mayus' | 'enlace' | 'palabra' | 'frase'; family?: 'redondas' | 'bucles' | 'puentes' | 'otras' }`; `CAL_CURRICULUM: CalItem[]` in teaching order: redondas (a o d g q c), bucles (l b h k f), puentes (m n ñ v w), otras (e i j p r s t u x y z), enlaces (br bl os ar la el mo ca), palabras (sol, mamá, casa, gato, libro, perro, árbol, mariposa), frases (`'Mi gato come.'`, `'La luna sale.'`, `'Me gusta leer.'`), mayúsculas (A–Z, Ñ).
- Produces: `planCaligrafia(input: { mastery: MasteryMap; now: Date; rng?: Rng }): CalItem[]` — 2 or 3 items: the weakest learnt item due for review (lowest box, oldest) and the next unlearnt items in order, a new item only if every earlier item has box ≥ 1; never more than one frase. Estimated ≈ 5 min (letra 90 s, enlace 100 s, palabra 120 s, frase 150 s; stop adding when ≥ 240 s).
- `isValidSkill` (Task 1) now checks membership in `CAL_CURRICULUM`.

- [ ] **Step 1: Failing tests:** empty mastery → first items `cal:letra:a`, `cal:letra:o`; with `a` at box 0 and `o` unseen → `a` (review) plus `o`; with every letter learnt → the first enlace appears; never two frases; total estimate between 240 and 360 s; deterministic with the same day; every item's text is drawable by `joinWord` (no missing glyph).
- [ ] **Steps 2–5:** FAIL, implement, PASS + `npx tsc -b`, commit «Caligrafía: temario de letras, enlaces, palabras y frases; plan del día».

### Task 5: The practice screen

**Files:**
- Create: `src/ink/cursive/TraceCursive.tsx` (+ `.module.css`, `.test.tsx`), `src/world/caligrafia/CaligrafiaScreen.tsx` (+ `.module.css`, `.test.tsx`)
- Modify: `src/app/routes.tsx` (route `/play/caligrafia`), the rewards module that grants daily session stars (own key `sesion-caligrafia:` via a helper next to `sessionRewardKey`)

**Interfaces:**
- Consumes: Tasks 2–4; `useInkSurface`, `usePalmGuard`, `pointerRole`, `isScribble` from `src/ink` (as `TraceDigit` does); the data layer that records attempts and mastery (the same calls the Lengua exercises use).
- Produces: `<TraceCursive item={CalItem} onDone={(r: { score: CursiveScore; tries: number }) => void} />` running three steps: **Mirar** (`CursiveModel` with `play`), **Repasar** (dotted model under the ink; live mark: if the pen goes > `CURSIVE_THRESHOLDS.liveOffPath` units off the model or against its direction, the stroke turns orange and a short line says «Te has salido: vuelve a la línea gris» / «Al revés: sigue la flecha»), **Escribir sola** (no model, 2 tries for letters and enlaces, 1 for palabras and frases; the best try counts). After each try: the stars, the four criteria as four small icons (forma, línea, tamaño, inicio) and the tip; buttons «Otra vez» and «Siguiente».
- `CaligrafiaScreen`: plans with `planCaligrafia`, runs the items, records one attempt per item (`skill`, `correct = stars === 3`, `errorType = 'cal-' + worst` when not 3 stars, `context: { shape, line, size, start, stars }`), updates mastery, grants the daily caligrafía stars on the first finish of the day, then «¡Terminado!» and back home. «Salir» at any time.

- [ ] **Step 1: Failing tests** (`replayStrokes` from `src/ink/dev/autoplay` and fixtures from Task 3): TraceCursive shows Mirar → Repasar → Escribir sola; replaying the exact fixture in Escribir sola shows 3 stars; replaying the scaled fixture shows ≤ 2 stars and the size tip; a `touch` stroke during a pen stroke is ignored (palm); a reversed stroke in Repasar shows «Al revés: sigue la flecha»; CaligrafiaScreen records one attempt per item with `cal:` skill and `context.stars`, and grants the stars once per day (second finish the same day grants none).
- [ ] **Steps 2–5:** FAIL, implement, PASS + `npx tsc -b`, commit «Caligrafía: pantalla de práctica con mirar, repasar y escribir sola».

### Task 6: The offer after Lengua, the adult switch and the report

**Files:**
- Modify: the Lengua session end in `src/world/session/DailySessionScreen.tsx` / `DailySession.tsx` (offer card), the adult child card where subjects are switched (handwriting toggle), `src/adult/child/LearningCards.tsx` (Caligrafía section), `src/engine/report.ts` if the report data is built there
- Test: the matching `.test.tsx` files

**Interfaces:**
- Consumes: `readPenSeen()`, input mode, `settings.handwriting`, `handwritingMastery`, `handwritingAttempts`, `CAL_CURRICULUM`.
- Produces: `export function caligrafiaOffered(child: ChildProfile, ink: { penSeen: boolean; mode: InputMode }): boolean` (true when Lengua is enabled for the child, `settings.handwriting !== false`, and `penSeen || mode === 'pen'`).
- Lengua end card (only when offered): «¿Practicamos la letra con el lápiz? Son 5 minutos.» with «Caligrafía (con lápiz)» → `/play/caligrafia` and «Ahora no» → home as today.
- Adult toggle in the child card: «Caligrafía con lápiz» on/off (writes `settings.handwriting`).
- Report section «Caligrafía» (hidden when there is no `cal:` attempt): letters/enlaces dominados, the ones that cost (box 0–1 with attempts), and the most frequent failing criterion in words («Lo que más falla: el tamaño»).

- [ ] **Step 1: Failing tests:** `caligrafiaOffered` false when `penSeen=false` and mode `touch`; false with `handwriting:false`; true with pen seen; the Lengua end shows the card only when offered and «Caligrafía (con lápiz)» navigates to `/play/caligrafia`; the adult toggle writes the setting; the report section lists a learnt `cal:letra:a` and shows «el tamaño» when most attempts have `errorType 'cal-size'`, and is absent with no `cal:` attempts; the maths report numbers do not change when `cal:` attempts are added.
- [ ] **Steps 2–5:** FAIL, implement, PASS + `npx tsc -b`, commit «Caligrafía: oferta al terminar Lengua, interruptor del adulto y ficha».

### Task 7: The trial page, e2e and docs

**Files:**
- Create: `src/world/caligrafia/TrialScreen.tsx` (route `/adultos/caligrafia-ensayo`, behind the adult PIN like the other adult pages), `tests/e2e/journeys/r-caligrafia.spec.ts`
- Modify: `src/app/routes.tsx`, `docs/curriculum/PLAN_DOCENTE.md` (§12 Caligrafía: curriculum, criteria, thresholds file, how to tune)

**Interfaces:**
- TrialScreen: pick any `CAL_CURRICULUM` item, the child writes it, the page shows the four raw criterion values next to their thresholds and the stars, so the owner can judge with his daughter whether the stars are fair. It saves nothing.
- e2e (projects `ipad` and `ipad-portrait` only; skip others): seed a 3.º child with Lengua, set `penSeen`, finish the Lengua session through the existing driver of `p-lengua.spec.ts`, accept the caligrafía card, write each item by dispatching pen pointer events along the model points (exact fixture), see 3 stars and «¡Terminado!»; assert no horizontal overflow and the pauta fully visible at 1180×820 and 820×1180. A second test: with `penSeen` unset, the card does not appear.

- [ ] **Step 1:** Write the e2e and the TrialScreen test (renders raw values and thresholds for a replayed fixture).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** `npm run build`, full `npx vitest run`, `npx playwright test tests/e2e/journeys/r-caligrafia.spec.ts` → pass (rerun a load flake alone). **Step 5:** Commit «Caligrafía: página de ensayo para ajustar la nota, e2e y plan docente».
