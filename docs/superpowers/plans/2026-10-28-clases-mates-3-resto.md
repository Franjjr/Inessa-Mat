# Clases de Matemáticas de 3.º (temas que faltan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a five-phase class to every 3.º maths topic of `syllabusFor('math', 3)` that has none today (56 topics), with the new lesson drawings they need.

**Architecture:** Classes are data built with `clase()` (`src/content/classes/dsl.ts`) from `show()` / `tryIt()` steps (`src/content/lessons/dsl.ts`), played by the existing `LessonPlayer`. New drawings are new `LessonVisualId`s (`src/types/content.ts`) with a component registered in `src/activities/lesson/visuals/index.tsx`. `tryIt` steps generate exercises from the topic's own skills, so no exercise code changes. One class file per block keeps files focused.

**Tech Stack:** React 18 + TS + Vite, motion/react, inline SVG, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-clases-mates-3-resto-design.md`

## Global Constraints

- Five phases per class: `para`, `ejemplo`, `guiada` (2 tries with hints), `sola` (3–4 tries, each a bit harder; hints removed by `clase()`), `cierre` (one sentence with the rule), as in `src/content/classes/grade3.ts`.
- Every `tryIt` selector uses only skills of the class's own topic (the existing test in `classes.test.ts:134` must keep passing for every class).
- Spanish copy: correct, short, for 8-year-olds; masculino genérico, never inclusive language («niños y niñas», «-e», «@», «x»).
- No hint or Lumi line gives the answer of the try it introduces.
- Real euro money only: coins 1, 2, 5, 10, 20, 50 céntimos, 1 €, 2 €; notes 5, 10, 20, 50, 100, 200 €.
- Correct content: times, angle names (recto 90°, agudo < 90°, obtuso > 90°), polygon names (triángulo, cuadrilátero, pentágono, hexágono, heptágono, octógono), solids (cubo, prisma, pirámide, cilindro, cono, esfera), units (mm, cm, m, km; g, kg; ml, l).
- Drawings are inline SVG components, scale to their box, readable at 360×740 portrait and on tablet; colours from the existing CSS tokens; `reduced` (prefers-reduced-motion) shows the end state.
- A map lesson is reused only as the `ejemplo` phase (its steps spread in); `mapLessonId` is set only when that lesson teaches exactly this topic, and no two classes share a `mapLessonId` (existing test `classes.test.ts:85`).
- Do not change the 18 existing classes, the map lessons, the syllabus order, the planner or the exercise generator.
- Never play audio in tests. Type check with `npx tsc -b` (never `tsc -p`). Commit trailer: `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. A class whose `tryIt` skill has no generator for the class's visual context (e.g. a clock try with a clock skill the generator cannot make at box 0) → the try step must still produce an exercise: covered by the per-block test «every try generates an exercise» in each task.
2. Phone portrait 360×740: a new SVG drawing taller than its box squeezes Lumi's bubble or the board → Task 11 screenshots every new visual at 360×740 and asserts no horizontal overflow.
3. Visuals with params missing or odd (0 parts, 13:60, empty coin list) → each visual task adds its params to the `visuals.test.tsx` sample map; the existing «renders with params missing» test covers defaults.
4. A text that reveals the answer of the next try (e.g. «¿Cuánto es 3 × 7? Es 21» before a 3 × 7 try) → each block test asserts that no `guiada`/`sola` step text contains the digits of a fixed answer it states; the reviewer reads every class text.
5. Classes reachable from «Hoy»: the topic order must still open the right class → Task 11 test: for every topic of `syllabusFor('math', 3)`, `classForTopic(id, 3)` is defined.

---

### Task 1: Generic visuals and the number classes

**Files:**
- Create: `src/content/classes/grade3-numeros.ts`
- Create: `src/activities/lesson/visuals/numbers.tsx`
- Modify: `src/types/content.ts` (LessonVisualId), `src/activities/lesson/visuals/index.tsx`, `src/activities/lesson/visuals/visuals.test.tsx` (sample params), `src/content/classes/index.ts` (CLASSES concatenates the block arrays)
- Test: `src/content/classes/grade3-numeros.test.ts`

**Interfaces:**
- Produces: visuals `'big-text'` (params `{ text, sub? }`: one or two lines of large text, e.g. «4 325 = 4 000 + 300 + 20 + 5»; later tasks reuse it for rules and equalities) and `'number-line'` (params `{ from, to, step, mark?, jump? }`: a ruler-like line with ticks; `mark` highlights a number; `jump` draws an arc from `mark` to `mark + jump`, used for rounding and mental maths).
- Produces: `export const NUMEROS_CLASSES: ClassDef[]` in `grade3-numeros.ts`; `CLASSES` becomes `[...GRADE3_CLASSES, ...NUMEROS_CLASSES, …]` (later tasks append their arrays the same way).
- Topics: `descomponer-9999`, `leer-escribir-9999`, `comparar-ordenar-9999`, `redondear`, `ordinales`, `numeros-5-cifras`, `igualdad`. Reuse `'place-value'` (now UM C D U; for 5 digits pass `n` up to 99 999 only if place-value supports it, else use `'big-text'`) and `'bar-model'`/`'big-text'` for `igualdad`.

- [ ] **Step 1: Write the failing test** `grade3-numeros.test.ts`:
  - `it('every number topic has its class')`: for each of the 7 topic ids, `classForTopic(id, 3)` is defined and its `topicId` matches.
  - `it('each class has the five phases with 2 guided tries and 3–4 solo tries')`: `phases.guiada === 2`, `phases.sola` in 3..4, `phases.cierre === 1`, `phases.para >= 1`, `phases.ejemplo >= 2`.
  - `it('every try generates an exercise of its topic')`: for each try step, `generate(step.trySelector, 1, { rng: createRng(1) })` has length 1 and its skill is in the topic's skills.
  - `it('redondear: 3 456 rounds to 3 460 and 3 500')` — the ejemplo text contains «3 460» and «3 500» for the shown number 3 456 (pins the content).
- [ ] **Step 2:** `npx vitest run src/content/classes/grade3-numeros.test.ts` → FAIL (no classes).
- [ ] **Step 3:** Add the two visuals (+ sample params `{ text: '4 325 = 4 000 + 300 + 20 + 5' }`, `{ from: 3400, to: 3500, step: 10, mark: 3456 }`), write the 7 classes, register `NUMEROS_CLASSES`.
- [ ] **Step 4:** Run the new test, `src/content/classes/classes.test.ts` and `src/activities/lesson/visuals/visuals.test.tsx` → PASS; `npx tsc -b` → exit 0.
- [ ] **Step 5:** Commit «Clases de 3.º: números y signo igual».

### Task 2: Las tablas (map lessons as their example)

**Files:**
- Create: `src/content/classes/grade3-tablas.ts`, `src/content/classes/grade3-tablas.test.ts`
- Modify: `src/content/classes/index.ts`

**Interfaces:**
- Consumes: map lessons exported from `src/content/lessons/w1.ts`, `w3.ts`, `w5.ts`, `w6.ts` (export them if they are not exported yet).
- Produces: `TABLAS_CLASSES: ClassDef[]` for `tabla-2`, `tabla-5`, `tabla-10`, `tabla-3`, `tabla-4`, `tabla-6`, `tabla-8`, `tabla-7`, `tabla-9`.
- Map lessons used as `ejemplo` (steps spread in) and `mapLessonId` (only these, one class each): `tabla-6` ← `w3-five`; `tabla-8` ← `w5-pattern`; `tabla-7` ← `w6-seven`; `tabla-9` ← `w6-nine`. `tabla-2`, `tabla-5`, `tabla-10` use the steps of `w1-easy` as example without `mapLessonId`; `tabla-3` and `tabla-4` use `'groups'`/`'array-rotate'`/`'double-chain'` steps (tabla-4 = doble del doble) without a map lesson.
- Tries: `tryIt` with the table's own `mul:axb` skills; guided tries use the easy half of the table, solo tries the hard half.

- [ ] **Step 1: Failing test:** the 9 topics have classes; five-phase shape as in Task 1; every try generates an exercise of its topic; `it('only tabla-6/7/8/9 link a map lesson')` asserts the four `mapLessonId`s above and none on the others.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Write the classes and register them.
- [ ] **Step 4:** Run the test + `classes.test.ts` (one map lesson per class) → PASS; `npx tsc -b`.
- [ ] **Step 5:** Commit «Clases de 3.º: las tablas».

### Task 3: Problemas y comprobar

**Files:** Create `src/content/classes/grade3-problemas.ts` and its test; modify `index.ts`.

**Interfaces:**
- Produces: `PROBLEMAS_CLASSES` for `prob-sumar`, `prob-restar`, `prob-multiplicar`, `prob-dividir`, `prob-dos-pasos`, `encuentra-error`, `comprobar-resultado`.
- Reuse `'bar-model'` (see its params in `src/types/content.ts`), `'sub-check'`, `'division-check'`, `'big-text'`. Each problem class teaches the same three questions: «¿Qué sé? ¿Qué me preguntan? ¿Qué operación?».

- [ ] **Step 1: Failing test:** the 7 topics have classes; shape; tries generate; `it('two-step class solves its example in two lines')` — the ejemplo has at least two steps whose text holds an operation sign.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: problemas y comprobar».

### Task 4: Cálculo mental

**Files:** Create `src/content/classes/grade3-mental.ts` and its test; modify `index.ts`.

**Interfaces:**
- Produces: `MENTAL_CLASSES` for `dobles-mitades`, `doble-triple`, `completar`, `decenas-centenas`, `compensar`.
- Reuse `'double-chain'`, `'number-line'` (with `jump`) and `'big-text'`. `compensar` example: 46 + 9 = 46 + 10 − 1 = 55.

- [ ] **Step 1: Failing test:** the 5 topics have classes; shape; tries generate; `it('compensar shows +10 − 1')` — some ejemplo text contains «+ 10» and «− 1».
- [ ] **Steps 2–5:** as above; commit «Clases de 3.º: cálculo mental».

### Task 5: Fracciones

**Files:** Create `src/activities/lesson/visuals/fractions.tsx`, `src/content/classes/grade3-fracciones.ts` and its test; modify `content.ts`, visuals `index.tsx`, `visuals.test.tsx`, classes `index.ts`.

**Interfaces:**
- Produces visuals: `'fraction-shape'` (params `{ parts, shaded, shape: 'circle' | 'bar' }`: equal parts, `shaded` of them coloured, the fraction written under it); `'fraction-groups'` (params `{ total, parts, take }`: `total` dots dealt into `parts` equal groups, `take` groups highlighted, e.g. ¼ de 20 = 5).
- Produces `FRACCIONES_CLASSES` for `fracciones-mitad-cuarto`, `fraccion-cantidad`, `fracciones-comparar`, `fracciones-mas-partes`.

- [ ] **Step 1: Failing tests:**
  - in `visuals.test.tsx` sample map: `'fraction-shape': { parts: 4, shaded: 1, shape: 'circle' }`, `'fraction-groups': { total: 20, parts: 4, take: 1 }`; add `it('fraction-shape draws parts slices and shades shaded of them')` — render with `{ parts: 3, shaded: 2, shape: 'bar' }`, assert 3 elements with `data-part` and 2 with `data-shaded="true"`; `it('fraction-groups deals total dots into parts groups')` — `{ total: 12, parts: 3, take: 1 }` renders 3 `data-group` with 4 `data-dot` each.
  - class test: 4 topics, shape, tries generate.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: fracciones».

### Task 6: Dinero

**Files:** Create `src/activities/lesson/visuals/money.tsx`, `src/content/classes/grade3-dinero.ts` and its test; modify the same registries.

**Interfaces:**
- Produces visual `'money'` (params `{ items: string, price?: number }`: `items` is a comma list of values in céntimos, e.g. `'200,50,20'`; each drawn as a real euro coin or note; with `price` (céntimos) a price tag and, when the items pay more, the change line «Te devuelven X»).
- Produces `DINERO_CLASSES` for `monedas-billetes`, `pagar-cambio`, `sumar-precios`, `euros-centimos`.
- `export function moneyLabel(cents: number): string` in `money.tsx` («2 €», «50 cént.», «1,25 €»).

- [ ] **Step 1: Failing tests:** `it('money draws only real euro coins and notes')` — `items: '200,50,20,3'` renders 3 pieces (3 is not a coin and is skipped); `it('moneyLabel writes euros with a comma')` — `moneyLabel(125) === '1,25 €'`, `moneyLabel(50) === '50 cént.'`, `moneyLabel(500) === '5 €'`; `it('money with price shows the change')` — `{ items: '500', price: 320 }` shows text «1,80 €»; class test: 4 topics, shape, tries generate.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: dinero».

### Task 7: Tiempo (reloj, duraciones, calendario)

**Files:** Create `src/activities/lesson/visuals/time.tsx`, `src/content/classes/grade3-tiempo.ts` and its test; modify registries.

**Interfaces:**
- Produces visuals: `'clock'` (params `{ h, m, digital?: 0 | 1 }`: analogue clock with hour hand at `h + m/60` and minute hand at `m`; with `digital: 1`, the digital time «hh:mm» next to it); `'timeline'` (params `{ start, end }` in minutes from midnight: a bar from start to end with both times and the duration).
- `export function handAngles(h: number, m: number): { hour: number; minute: number }` in `time.tsx`.
- Produces `TIEMPO_CLASSES` for `reloj-en-punto-media-cuarto`, `reloj-5-minutos`, `reloj-digital`, `duraciones`, `calendario` (calendario uses `'big-text'` for the weekdays and months).

- [ ] **Step 1: Failing tests:** `handAngles(3, 0)` → `{ hour: 90, minute: 0 }`; `handAngles(9, 30)` → `{ hour: 285, minute: 180 }`; `handAngles(15, 15)` → hour 97.5 (24 h folds to 12); `it('clock digital writes 07:05')` for `{ h: 7, m: 5, digital: 1 }`; `it('timeline shows the duration')` for `{ start: 600, end: 645 }` shows «45 minutos»; class test: 5 topics, shape, tries generate.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: el reloj y el tiempo».

### Task 8: Medida

**Files:** Create `src/activities/lesson/visuals/measure.tsx`, `src/content/classes/grade3-medida.ts` and its test; modify registries.

**Interfaces:**
- Produces visuals: `'ruler'` (params `{ cm, object?: string }`: a centimetre ruler with an emoji object lying from 0 to `cm`); `'units'` (params `{ kind: 'length' | 'mass' | 'capacity' }`: the units of that kind with a reference object each, e.g. 1 kg ↔ un paquete de harina, 1 l ↔ una botella de agua).
- Produces `MEDIDA_CLASSES` for `unidades-longitud`, `regla`, `unidades-masa-capacidad`, `medir-problemas`.

- [ ] **Step 1: Failing tests:** `it('ruler draws cm + 1 numbered ticks')` for `{ cm: 8 }` → labels 0..8 at least; `it('units lists g and kg for mass')`; class test: 4 topics, shape, tries generate; `it('the conversions said are right')` — ejemplo texts contain «1 m = 100 cm», «1 km = 1 000 m», «1 kg = 1 000 g», «1 l = 1 000 ml» across the medida classes.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: medida».

### Task 9: Geometría

**Files:** Create `src/activities/lesson/visuals/geometry.tsx`, `src/content/classes/grade3-geometria.ts` and its test; modify registries.

**Interfaces:**
- Produces visuals: `'polygon'` (params `{ sides, mark?: 'sides' | 'corners' }`: a regular polygon, numbering its sides or corners); `'lines'` (params `{ kind: 'recta' | 'curva' | 'poligonal' | 'paralelas' | 'perpendiculares' | 'segmento' | 'semirrecta' }`); `'angle'` (params `{ deg }`: two rays with the arc, a square mark at 90°); `'solid'` (params `{ name: 'cubo' | 'prisma' | 'piramide' | 'cilindro' | 'cono' | 'esfera' }`); `'perimeter'` (params `{ sides: string }`: comma list of side lengths in cm, drawn as a polygon with each length on its side and the sum below); `'grid-route'` (params `{ route: string }`: a 5×5 grid with a path like `'R,R,U,U,L'` from a start star).
- Produces `GEOMETRIA_CLASSES` for `poligonos`, `rectas`, `rectas-segmentos`, `angulos-rectos`, `angulos-clase`, `circulo-cuerpos`, `perimetro`, `recorridos`.

- [ ] **Step 1: Failing tests:** `'polygon'` with `{ sides: 5, mark: 'sides' }` renders labels 1..5; `'angle'` `{ deg: 90 }` renders the right-angle mark and `{ deg: 45 }` does not; `'perimeter'` `{ sides: '3,4,3,4' }` shows «14 cm»; `'grid-route'` `{ route: 'R,R,U' }` draws 3 path segments; class test: 8 topics, shape, tries generate; `it('names are right')` — the poligonos class names «pentágono» and «hexágono», the angulos-clase class says agudo is smaller and obtuso bigger than a right angle.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: geometría».

### Task 10: Gráficos y probabilidad

**Files:** Create `src/activities/lesson/visuals/data.tsx`, `src/content/classes/grade3-datos.ts` and its test; modify registries.

**Interfaces:**
- Produces visuals: `'pictogram'` (params `{ rows: string, unit?: number }`: `rows` like `'Gatos:3,Perros:5'`, each drawn with icons, `unit` = how many each icon is worth); `'bar-chart'` (same `rows`, vertical bars with a numbered axis); `'chance-bag'` (params `{ balls: string }`: e.g. `'red:3,blue:0'` drawn as a bag of coloured balls).
- Produces `DATOS_CLASSES` for `graficos`, `graficos-tablas`, `probabilidad`.

- [ ] **Step 1: Failing tests:** `'pictogram'` `{ rows: 'Gatos:3,Perros:5' }` renders 8 icons; with `unit: 2` and `'Gatos:4'` renders 2; `'bar-chart'` renders one bar per row with its label; class test: 3 topics, shape, tries generate; `it('probabilidad uses seguro, posible and imposible')`.
- [ ] **Steps 2–5:** run → FAIL, write, run + `npx tsc -b` → PASS, commit «Clases de 3.º: gráficos y probabilidad».

### Task 11: Coverage, docs and check on screens

**Files:**
- Modify: `src/content/classes/classes.test.ts`, `docs/curriculum/PLAN_DOCENTE.md` (§10 Clases: the full list by block, and which map lessons serve as examples)
- Create: `tests/e2e/journeys/q-clases-3.spec.ts`

- [ ] **Step 1: Failing/guard test** in `classes.test.ts`: `it('every 3.º maths topic has a class')` — for every topic of `syllabusFor('math', 3)`, `classForTopic(t.id, 3)` is defined.
- [ ] **Step 2:** Run → PASS (all blocks done); if any topic is missing, add its class to its block file.
- [ ] **Step 3: e2e** `q-clases-3.spec.ts`: for one class per new visual block (redondear, tabla-7, prob-dos-pasos, compensar, fracciones-mitad-cuarto, pagar-cambio, reloj-5-minutos, regla, angulos-clase, graficos), open `/play/clase/<topicId>` (use the route the existing class e2e uses), step through the `para` and `ejemplo` phases, and assert: the visual is visible, `document.documentElement.scrollWidth <= innerWidth` and the board is at least 200 px tall. Runs on all four projects (android is 360×740-ish).
- [ ] **Step 4:** `npm run build`, `npx vitest run`, `npx playwright test tests/e2e/journeys/q-clases-3.spec.ts` → all pass (rerun a load flake alone).
- [ ] **Step 5:** Commit «Clases de 3.º: todos los temas tienen clase; plan docente».
