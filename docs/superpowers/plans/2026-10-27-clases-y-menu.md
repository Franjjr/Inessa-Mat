# Clases y menú — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real lessons («clases») for the four 3.º operations (sumar, restar, multiplicar, dividir), each from easy to hard,, opened from a big «Hoy» button when a new topic starts, plus a home menu with order and «Ahora no» / «Ya lo sé» skips.

**Architecture:** A class is a `LessonDef` played by the existing `LessonPlayer`, built from five phases by a `clase()` builder and linked to one syllabus topic in a new registry (`src/content/classes/`). «Clase hecha» is derived: a progress flag `clase:<topicId>` or the class's map lesson node already done. A new route `/play/clase/:topicId` plays it; the home picks «Hoy» = the class of `currentTopic` when not done, else the session.

**Tech Stack:** React 18 + TypeScript, Vite, Dexie, Vitest + Testing Library, Playwright (4 projects: ipad, ipad-portrait, android, desktop).

**Spec:** `docs/superpowers/specs/2026-10-27-clases-y-menu-design.md`

## Global Constraints

- All child-facing text in Spanish; no inclusive language (masculine generic); only two genders.
- Hints and practice steps **never** give the answer or leave it one trivial step away (project rule).
- Never play audio in tests or screenshots (Playwright already launches with `--mute-audio`).
- Clases only for 3.º (`syllabusForGrade(3)` topics); grade 2 and 4 children see no change except the menu.
- Division is taught first with the written subtractions (`DEFAULT_METHOD.div = 'galera'`); subtraction first with «pido prestado arriba» (`'borrow'`).
- Do not change map unlock rules, node stars, or progress of lessons already played.
- Commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Work on branch `dev`.
- Verification per task: `npx tsc -b` (the root tsconfig has `files: []`, so `tsc -p .` checks nothing; Vercel runs `tsc -b && vite build`), the task's vitest files, and the named Playwright specs. Timing tests in `src/ink/ml/*` are flaky under load; rerun alone before treating them as failures.

## Review Focus

1. A child already half-way through the course whose current topic's map lesson is done: «Hoy» must open the session, not the class (Task 1 `isClassDone` test, Task 6 e2e).
2. A class left half-way: «Hoy» still offers the class and it starts from the first step (Task 5 test).
3. «Ahora no» on the last item, or twice on the same item: the run ends or drops it, never loops (Task 7 test).
4. «Ya lo sé» with one wrong answer: the class starts and the three answers were reported as normal attempts (Task 5 test).
5. Phone 390 × 844: the «Hoy» button is on screen without scrolling; a 2.º or 4.º child gets the session card (Task 6 tests).

---

### Task 1: Class model, registry and helpers

**Files:**
- Modify: `src/types/content.ts` (LessonStep), `src/activities/lesson/TrySlot.tsx`, `src/activities/lesson/LessonPlayer.tsx`
- Create: `src/content/classes/dsl.ts`, `src/content/classes/index.ts`, `src/content/classes/grade3.ts` (empty list for now)
- Modify: `src/content/syllabus/helpers.ts` (or `index.ts`) for `topicTitle`, `src/content/index.ts` (re-exports)
- Test: `src/content/classes/classes.test.ts`, `src/activities/lesson/LessonPlayer.test.tsx`

**Interfaces:**
- Produces:
  - `LessonStep.hints?: false` — on a `try` step, the exercise is shown without the hint button.
  - `interface ClassDef { topicId: string; lesson: LessonDef; mapLessonId?: string; phases: { para: number; ejemplo: number; guiada: number; sola: number; cierre: number } }` (phases = step counts, so tests can find each phase).
  - `clase(input: { id: string; topicId: string; title: string; mapLessonId?: string; para: LessonStep[]; ejemplo: LessonStep[]; guiada: LessonStep[]; sola: LessonStep[]; cierre: LessonStep }): ClassDef` — concatenates the phases into `lesson.steps`; sets `hints: false` on every `sola` try step.
  - `CLASSES: ClassDef[]`, `classForTopic(topicId: string): ClassDef | undefined`
  - `findLessonNode(seasonId: string, lessonId: string): { worldId: string; nodeId: string } | undefined`
  - `isClassDone(progress: ProgressState, cls: ClassDef): boolean` — `progress.flags['clase:' + topicId]` or the `mapLessonId` node of the progress's season is done.
  - `markClassDone(progress: ProgressState, cls: ClassDef): ProgressState` — sets the flag; if the map lesson node exists in the season, is unlocked and not done, also applies `applyNodeResult(p, worldId, nodeId, { stars: COMPLETION_STARS, passed: true })`.
  - `topicTitle(topic: SyllabusTopic): string` — the name without a trailing parenthesis (`'Descomponer (4 325 = …)'` → `'Descomponer'`).

- [ ] **Step 1: Write the failing tests**

`classes.test.ts` (with a fixture class built by `clase()` from `w4Borrow` steps, `mapLessonId: 'w4-borrow'`, topic `'resta-3d-prestando'`):
```ts
it('clase() puts the phases in order and takes the hints off the «sola» tries', ...)
  // lesson.steps.length === para+ejemplo+guiada+sola+1; every sola step has interaction 'try' && hints === false;
  // guiada steps have no `hints` field
it('a class is done by its flag or by its map lesson already played', ...)
  // initialProgress(...) → false; flags['clase:resta-3d-prestando'] → true;
  // progress with worlds.w4.nodes['lesson-borrow'].done = true → true
it('markClassDone sets the flag and marks the unlocked map lesson, never a locked one', ...)
  // locked: only the flag changes, worlds untouched; unlocked: node done with COMPLETION_STARS
it('topicTitle drops the example in brackets', ...)
  // topicTitle({ name: 'Descomponer (4 325 = 4 000 + 300 + 20 + 5)' }) === 'Descomponer'; plain names unchanged
```
`LessonPlayer.test.tsx`: `it('a try step with hints: false shows no «Pista» button')`.

- [ ] **Step 2: Run them, expect FAIL** — `npx vitest run src/content/classes src/activities/lesson`
- [ ] **Step 3: Implement** the interfaces above; `TrySlot` gets `allowHints?: boolean` (default true) passed to `ExerciseView`; `LessonPlayer` passes `step.hints !== false`.
- [ ] **Step 4: Run, expect PASS**, plus `npx tsc -b`
- [ ] **Step 5: Commit** — "Classes: a lesson in five phases linked to a syllabus topic, done by its flag or its map lesson"

### Task 2: Clases de sumar y de restar

**Files:** Modify `src/content/classes/grade3.ts`; Test: `src/content/classes/classes.test.ts`

**Interfaces:** Consumes `clase`, `show`, `tryIt` (Task 1, `src/content/lessons/dsl.ts`).

Classes (topic id → class id, map lesson, worked example). The owner asked for sums «cada vez más complejas» so the child moves through the four operations, each one from easy to hard:

| Topic | Class id | mapLessonId | Ejemplo resuelto |
|---|---|---|---|
| `suma-2d` | `c3-suma-2d` | — | 34 + 25 = 59, then 38 + 25 = 63 (the first carry, with tens and units blocks) |
| `suma-3d-sin-llevar` | `c3-suma-3d` | — | 342 + 215 = 557 (column, units first) |
| `suma-3d-llevando` | `c3-suma-llevando` | `w2-carry` | reuse `w2-carry` example |
| `suma-4d` | `c3-suma-4d` | — | 2 475 + 1 368 = 3 843 (carries in several columns) |
| `resta-3d-sin-llevar` | `c3-resta-sin-llevar` | — | 586 − 243 = 343 (`visual: 'borrow'`, params a, b) |
| `resta-3d-prestando` | `c3-resta-prestando` | `w4-borrow` | 352 − 127 = 225 |
| `resta-con-ceros` | `c3-resta-ceros` | `w4-zero` | 503 − 128 = 375 |

Rules for every class (all tasks 2–4):
- `para`: 1–2 `show` steps, a short story reason in the tone of «las lianas de las hadas» (characters, a motive, short sentences).
- `ejemplo`: 3–6 `show` steps, one complete case, each step one move; may reuse the steps of the map lesson.
- `guiada`: exactly 2 `tryIt` steps with hints, the topic's easiest skill.
- `sola`: 3 or 4 `tryIt` steps, each selector a bit harder than the one before, using only the topic's skills or easier ones of the same block.
- `cierre`: 1 `show` step that states the rule in one sentence.

- [ ] **Step 1: Failing test** `it('every class keeps the five-phase shape and its tries generate exercises of its own topic')` over `CLASSES`: phases para 1–2, ejemplo 3–6, guiada 2, sola 3–4, cierre 1; `generate(step.trySelector!, 1)` returns one exercise whose `skill` is in the topic's `skills` or in an earlier topic of the same syllabus block; `topicId` exists in `syllabusForGrade(3)`; `mapLessonId` (when set) is found by `getLesson`; class ids unique. And `it('sumar y restar have their classes')`: `classForTopic` is defined for the eight topics above.
- [ ] **Step 2: Run, expect FAIL** — `npx vitest run src/content/classes`
- [ ] **Step 3: Write the eight classes.**
- [ ] **Step 4: Run, expect PASS**; open `/dev/gallery` lesson gallery or a quick Playwright screenshot of one class at 1180 × 820 and 390 × 844 to see nothing overflows.
- [ ] **Step 5: Commit** — "Clases de sumar y de restar, de menos a más"

### Task 3: Clases de multiplicar

**Files:** Modify `src/content/classes/grade3.ts`; maybe `src/activities/lesson/visuals/*` (only if a visual cannot draw the example). Test: `classes.test.ts`, `src/activities/lesson/visuals/visuals.test.tsx`

| Topic | Class id | mapLessonId | Ejemplo resuelto |
|---|---|---|---|
| `mul-2x1-sin-llevar` | `c3-mul-2x1` | `w7-split` | 23 × 3 = 69 |
| `mul-2x1-llevando` | `c3-mul-2x1-llevando` | `w7-carry` | 47 × 6 = 282 |
| `mul-3x1` | `c3-mul-3x1` | — | 213 × 3 = 639 (por partes: 600 + 30 + 9, then column) |
| `mul-10-100` | `c3-mul-10-100` | — | 34 × 10 = 340, 34 × 100 = 3 400 (add zeros, place-value houses) |
| `mul-2-cifras-intro` | `c3-mul-2x2-partes` | — | 23 × 14 = 23 × 10 + 23 × 4 = 230 + 92 = 322 |

- [ ] **Step 1: Failing test** `it('multiplicar has its classes')` for the five topics (shape test from Task 2 already covers them).
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Write the classes.** If `column-mul` cannot draw a 3-digit top or `split-multiply` cannot draw a two-digit `m`, extend the visual (params stay as in `LessonVisualId` comments) and add a case to `visuals.test.tsx`.
- [ ] **Step 4: Run, expect PASS** (classes + visuals tests).
- [ ] **Step 5: Commit** — "Clases de multiplicar: 2 × 1, con llevadas, 3 × 1, por 10 y 100, y 2 × 2 por partes"

### Task 4: Clases de dividir

**Files:** Modify `src/content/classes/grade3.ts`; maybe `src/activities/lesson/visuals/*`. Test: as Task 3.

| Topic | Class id | mapLessonId | Ejemplo resuelto |
|---|---|---|---|
| `div-con-tablas` | `c3-div-repartir` | `w8-share` | 12 gemas en 3 cofres: 12 ÷ 3 = 4 |
| `div-exacta` | `c3-div-exacta` | `w8-galera` | 84 ÷ 4 = 21 (galera con restas) |
| `div-resto` | `c3-div-resto` | `w8-galera` | 17 ÷ 5 = 3, sobran 2; prueba 3 × 5 + 2 = 17 |
| `div-larga` | `c3-div-bajar` | — | 72 ÷ 3 = 24 (7 ÷ 3 = 2, resto 1; bajo el 2: 12 ÷ 3 = 4) |
| `div-3x1` | `c3-div-3x1` | — | 384 ÷ 4 = 96, then 387 ÷ 4 = 96, sobran 3; prueba 96 × 4 + 3 = 387 |

- The galera is shown with the subtractions written (the school's way); `galera-short` is not mentioned.
- [ ] **Step 1: Failing test** `it('dividir has its classes')`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Write the classes**; extend `galera` for a 3-digit dividend if it cannot draw 384 ÷ 4, with a `visuals.test.tsx` case.
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — "Clases de dividir: repartir, galera exacta, con resto, bajar cifras y 3 cifras entre 1"

### Task 5: La pantalla de la clase (`/play/clase/:topicId`) con «Ya lo sé»

**Files:**
- Create: `src/world/clase/ClassScreen.tsx` (+ `.module.css` if needed; reuse `../session/session.module.css` classes where they fit)
- Modify: `src/app/routes.tsx`
- Test: `src/world/clase/ClassScreen.test.tsx`

**Interfaces:**
- Consumes: `classForTopic`, `isClassDone`, `markClassDone`, `topicTitle` (Task 1); `LessonPlayer` (`@/activities`); `ExerciseStep` (`src/world/review/ExerciseStep.tsx`); `generate`, `createRng` (`@/engine`); `GameHostProvider activity="clase"`.
- Produces: route `/play/clase/:topicId`; `export const KNOW_IT_COUNT = 3`.

Flow: intro card («Hoy aprendemos: <topicTitle>», buttons «¡Empezar la clase!» and «Ya lo sé») → either the lesson, or 3 exercises from `{ skills: topic.skills }` with `allowHints={false}`, reported as normal attempts. All right → mark done → end card. Any wrong → card «¡Vamos a verlo juntos!» → the lesson from step 1. Lesson done → `updateProgress(child.id, (p) => markClassDone(p, cls))` → end card «¡Clase terminada!» with «Seguir con la sesión» (`/play/sesion`) and «Volver al inicio» (`/play`). Leaving («Salir») goes to `/play` without marking. Unknown topic or no class → `<Navigate to="/play" replace />`.

- [ ] **Step 1: Failing tests** (mock `@/data` as other screen tests do; a fixture topic with a class):
```ts
it('the lesson done marks the class and offers the session')          // updateProgress called; button «Seguir con la sesión»
it('«Ya lo sé» with all three right skips the class')                // 3 reportAttempt calls; class marked; no lesson shown
it('«Ya lo sé» with one wrong starts the class from its first step') // text of lesson step 0 visible; not marked
it('leaving half-way does not mark the class')                        // «Salir» → navigate('/play'); updateProgress not called
it('a topic without class goes back home')
```
- [ ] **Step 2: Run, expect FAIL** — `npx vitest run src/world/clase`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS**, and `npx tsc -b`
- [ ] **Step 5: Commit** — "La clase tiene su pantalla: empezar o «Ya lo sé», y al acabar, seguir con la sesión"

### Task 6: Menú nuevo con «Hoy» y «Mis premios»

**Files:**
- Modify: `src/world/home/ChildHomeScreen.tsx`, `ChildHomeScreen.module.css`
- Create: `src/world/home/todayEntry.ts` (pure), `src/world/prizes/PrizesScreen.tsx`; Modify `src/app/routes.tsx` (`/play/premios`)
- Modify: `tests/e2e/journeys/g-session.spec.ts`, `tests/e2e/journeys/l-phone.spec.ts` and any spec that clicks the old labels
- Test: `src/world/home/todayEntry.test.ts`, new e2e `tests/e2e/journeys/n-hoy.spec.ts`

**Interfaces:**
- Produces: `todayEntry(input: { grade?: number; mastery: MasteryMap; progress: ProgressState }): { kind: 'clase'; topicId: string; title: string; to: string } | { kind: 'sesion'; title: string; to: '/play/sesion' }` — `title` is `topicTitle(currentTopic)` (or `'Matemáticas de hoy'`), `to` for a class is `/play/clase/<topicId>`.

Menu, top to bottom: placement banner (only while `!flags.placement || flags.placementRequested`, a thin bar «Antes de empezar: haz la prueba inicial ›»); **Hoy** big card (kicker «Hoy aprendemos» + cta «¡Empezar la clase!» for a class; «Mi sesión de hoy · 15 min» + «¡Empezar!» for the session); **Mi aventura** medium card (today's «Tu aventura» content); tiles **Repasar · N** (only when `due > 0`, to `/play/review`), **Jugar** (`/play/free`), **Mis premios** (`/play/premios`). `PrizesScreen` shows tiles Álbum, Tienda, Gran Cofre (all crystals) and Diploma (earned) with a back button. The world bar stays unless it pushes «Hoy» below the first screen on a phone.

- [ ] **Step 1: Failing tests**
`todayEntry.test.ts`:
```ts
it('a 3.º child whose current topic has a class not done gets the class')
it('the class done (flag or map lesson) gives the session')
it('a topic without class, or a 2.º / 4.º child, gives the session')
it('the title is the topic name without the example in brackets')
```
`n-hoy.spec.ts` (seeded Lía, all projects): «Hoy» shows; clicking it reaches `/play/clase/…` or `/play/sesion` matching `todayEntry`; after finishing a class with «Ya lo sé» answered via the e2e solvers or the lesson tapped through, home shows «Mi sesión de hoy». Phone (`devices['Pixel 7']`, android project only): the «Hoy» card's bottom ≤ viewport height without scrolling. «Repaso del día» and «Juego libre» no longer appear; «Jugar» and «Mis premios» do.
- [ ] **Step 2: Run, expect FAIL** — `npx vitest run src/world/home` and `npx playwright test tests/e2e/journeys/n-hoy.spec.ts`
- [ ] **Step 3: Implement**; update the old specs' selectors.
- [ ] **Step 4: Run, expect PASS**: vitest home, `n-hoy`, `g-session`, `l-phone`, `a-onboarding`, `b-world-one`, `d-shop` on all projects.
- [ ] **Step 5: Commit** — "Menú con orden: «Hoy» abre la clase o la sesión; Mi aventura, Repasar, Jugar y Mis premios"

### Task 6b: Todo el ancho en las pantallas del niño (petición del dueño)

The owner: «aprovecha todo el ancho disponible para la web». At 1920 × 1080 the map, the lessons and the landing already fill the screen; these do not: home menu (~1 070 px centred), session / placement / class intro and exercise card (`.stage` max 880 px, `.calm/.intro` max 600 px), «Jugar» (`free.module.css` 1 040), album (1 040), shop (1 180), review (880), guardian (880), child picker (560).

**Files:** `src/world/home/ChildHomeScreen.module.css`, `src/world/session/session.module.css`, `src/world/free/free.module.css`, `src/world/album/album.module.css`, `src/world/shop/shop.module.css`, `src/world/review/DailyReview.module.css`, `src/world/guardian/GuardianChallenge.module.css`, `src/world/picker/ChildPickerScreen.module.css`, the new prize and class screens; shared token in `src/styles/tokens.css`. Test: new e2e `tests/e2e/journeys/o-wide.spec.ts`.

Rules:
- A shared page gutter token (`--page-gutter: clamp(16px, 3vw, 48px)`); list/menu screens (home, Jugar, Mis premios, album, shop, picker) use the full width minus the gutter, with grids that add columns as the screen grows (`repeat(auto-fill, minmax(…, 1fr))`), and bigger cards/type on wide screens (`clamp()`).
- Exercise screens (session, placement, class, review, guardian): the card may grow to the full width minus the gutter; the exercise inside scales up on wide screens (font sizes and cells with `clamp()`), never stretched text lines longer than ~70 characters; the intro card of the session lays its four blocks in a row on wide screens.
- Forms stay narrow on purpose (PIN, login, onboarding questions): readable forms are not stretched.
- Phones and tablets look as before or better: no horizontal scroll at 390 px; nothing cut off at 1138 × 640.

- [ ] **Step 1: Failing e2e** `o-wide.spec.ts` at 1920 × 1080 (desktop project only): on /play, /play/sesion (intro and first exercise), /play/free, /play/premios, /play/album, /play/shop and /kids, the main content's width is ≥ 1920 − 2 × 48 − 2 px; at 390 × 844 `document.scrollingElement.scrollWidth` equals the viewport width on the same routes.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement**; screenshots at 1920 × 1080, 1180 × 820, 1138 × 640 and 390 × 844 to check nothing looks stretched or cut.
- [ ] **Step 4: Run, expect PASS**, plus `g-session`, `l-phone`, `d-shop`, `n-hoy` on all projects.
- [ ] **Step 5: Commit** — "Las pantallas del niño aprovechan todo el ancho en pantallas grandes"

### Task 7: «Ahora no» y «Ver la clase otra vez» en la sesión

**Files:**
- Modify: `src/world/session/logic.ts`, `src/world/session/DailySession.tsx`, `src/world/review/ExerciseStep.tsx`
- Test: `src/world/session/logic.test.ts` (create if absent), `src/world/review/ExerciseStep.test.tsx` (if present, else in the session test)

**Interfaces:**
- Produces: `RunItem.postponed?: true`; `postpone(q: RunQueue<RunItem>, pos: number): RunQueue<RunItem>` — moves the slot at `pos` to the end marked `postponed`; if it is already `postponed`, or it is the last slot, removes it. `ExerciseStepProps.onSkip?: () => void` — renders a secondary button «Ahora no» only before the child answers; nothing is reported.

Session: «Ahora no» on every item (warm-up included); after `postpone`, `pos` stays (next slot slides in) or the run closes when no slot is left. `summarizeRun` totals planned slots still in the queue, so a dropped item is not counted. ExampleCard: when `classForTopic(plan.topic.id)` exists, a secondary button «Ver la clase otra vez» navigates to `/play/clase/<topicId>`. Session texts show `topicTitle(topic)`.

- [ ] **Step 1: Failing tests**
```ts
it('postpone moves the item to the end without counting it')       // slots order; results untouched
it('postponing the last item, or an item twice, drops it')          // slots.length - 1; summary.total excludes it
it('ExerciseStep offers «Ahora no» before answering, not after')
```
- [ ] **Step 2: Run, expect FAIL** — `npx vitest run src/world/session src/world/review`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS**; `npx playwright test tests/e2e/journeys/g-session.spec.ts` on all projects.
- [ ] **Step 5: Commit** — "Sesión: «Ahora no» deja un ejercicio para el final sin contarlo, y la clase se puede volver a ver"

### Task 8: Verificación final

- [ ] `npm run build` (the same as Vercel); `npx vitest run` (rerun `src/ink/ml` alone if only its timing tests fail); `npx playwright test` on the four projects.
- [ ] Screenshots of home, a class (each phase) and the session at 1138 × 640 (Android tablet with bars), 1180 × 820 and 390 × 844: nothing cut off, «Hoy» visible.
- [ ] Update `docs/curriculum/PLAN_DOCENTE.md` with a short section «Clases» (format, where they open, skips).
- [ ] Commit — "Plan docente: las clases"
