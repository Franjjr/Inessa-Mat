# Matemáticas: completar el temario de 3.º y 4.º — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a 3.º y 4.º los temas de Matemáticas que faltan según el temario de referencia, cada uno en pasos de menos a más y con pistas, y que el plan diario no abra un paso hasta dominar el anterior.

**Architecture:** Cada tema nuevo es una o varias *skill keys* del motor (`src/engine/skills.ts`) con su generador, corrección, pistas, descripción para el adulto y vista, y un tema del temario (`src/content/syllabus/grade3.ts`, `grade4.ts`) colocado en una etapa. Siempre que se pueda se reutiliza un tipo de ejercicio existente (`shape-choice`, `mental`, `chart`, `chance`, `money`, `measure`, `place-value`…); hay tipos nuevos solo para la multiplicación larga en columna, los ordinales y los decimales. Un indicador nuevo `ordered` en el tema hace que sus *skills* se enseñen de una en una, en orden.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest (jsdom), Playwright (proyectos `ipad`, `ipad-portrait`, `android`, `desktop`).

**Spec:** `docs/superpowers/specs/2026-10-24-matematicas-temario-completo-design.md` (léelo antes de empezar; la tabla de pasos de cada tema está allí).

## Global Constraints

- Textos para el niño y el adulto en español de España, sin lenguaje inclusivo (nada de «niñ@s», «les niñes»); comentarios y nombres de código en inglés, como el código que los rodea.
- Las pistas **nunca dan la respuesta** ni la dejan a un paso trivial (regla del proyecto). Cada ejercicio nuevo tiene 3 pistas, de la estrategia (nivel 1) al paso trabajado (nivel 3).
- Nada de números negativos ni contenidos de cursos superiores en los ejercicios.
- Lo ya dominado por un niño sigue dominado: no se renombra ni se borra ninguna *skill key* existente.
- Tests: `npx tsc -b`, `npx vitest run`, `npx playwright test` (Chromium siempre con `--mute-audio`, ya está en la configuración; nunca se reproduce audio en los tests).
- Commits en inglés, terminados en `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, a la rama `dev`.
- Subagentes sin el parámetro `model` (heredan el de la sesión).

## Receta de una *skill* nueva (se usa en casi todas las tareas)

Sigue el commit `2985c2d` (fracciones de igual denominador y división entre 2 cifras), que toca exactamente estos sitios:

1. `src/types/exercise.ts`: documentar la *key* en el comentario de cabecera; si hay tipo nuevo, añadirlo a `ExerciseKind`, su interfaz y la unión `Exercise`.
2. `src/engine/skills.ts`: comentario de cabecera, `ParsedSkill`, el constructor (`xxxSkill(...)`), `parseSkill`, `kindsForSkill` y, si es un tipo de bloque, `blockSkillsOf`.
3. `src/engine/generate.ts`: `ALL_KINDS` (tipo nuevo), `kindUniverse`, y `buildExercise`/`buildBlock`; los generadores puros viven en su módulo temático.
4. `src/engine/check.ts`: el `case` de corrección.
5. `src/engine/hints.ts`: el `case` de pistas (o `hints` dentro del ejercicio, como `shape-choice`).
6. `src/engine/describe.ts`: el texto del adulto en `describeSkill`.
7. `src/engine/daily.ts`: `ITEM_SECONDS` (tipo nuevo) y `statementOf`.
8. `src/engine/index.ts`: exportar lo que usen las vistas y la galería.
9. `src/activities/registry.ts` y la vista en `src/activities/views/` (tipo nuevo); la galería del curso (`grade4.gallery.tsx` o la de 3.º) con un ejemplo.
10. Tests del motor en `src/engine/__tests__/` (generador: rango, sin negativos, respuesta coherente; `check`: acierto y fallo; pistas: ninguna contiene la respuesta) y de la vista si es nueva.

Cada tarea dice qué *keys*, qué tipo y qué generador; la receta dice dónde va cada pieza.

## Review Focus

1. **Un niño de 4.º que ya dominó «Multiplicar por un número de 2 cifras (por partes)»** al entrar la etapa con los pasos en columna debe ver solo los pasos nuevos, no el tema entero otra vez → test en la Tarea 1 (`currentTopic` con `mul:2dx2d` dominado).
2. **Respuestas decimales en un móvil** (teclado en pantalla, sin tecla de coma): el niño escribe la parte entera y la decimal en dos casillas, y 0,5 frente a 0,50 se acepta igual → test en la Tarea 5.
3. **Pistas que delatan la respuesta** en los tipos que reutilizan `shape-choice` (las opciones están a la vista) → test genérico en la Tarea 10: ninguna pista contiene el texto de la opción correcta.
4. **La prueba inicial no crece**: sigue en `PLACEMENT_COUNT` (20) ítems por curso aunque haya temas nuevos → test en la Tarea 10.
5. **Temas `ordered` con una *skill* que no se puede generar** (`parseSkill` nulo o generador que falla) no deben bloquear el curso → test en la Tarea 0.

---

### Task 0: Temas en orden (`ordered`)

**Files:**
- Modify: `src/content/syllabus/model.ts` (campo nuevo en `SyllabusTopic`)
- Modify: `src/engine/daily.ts:280-300` (bloque «2. Lo nuevo»)
- Test: `src/engine/__tests__/daily.test.ts` (o el archivo de tests del plan diario que ya exista)

**Interfaces:**
- Produces: `SyllabusTopic.ordered?: true` — «sus *skills* son pasos: solo se enseña como nuevo el primero sin dominar (box < 2) que se pueda generar; los anteriores van al repaso mezclado».

- [ ] **Step 1: Tests que fallan** en el archivo de tests del plan diario:
  - `it('an ordered topic teaches only its first unmastered step')`: tema `{ ordered: true, skills: ['mul:2x1:c0', 'mul:2x1:c1'] }` sin dominio → todos los ítems `block: 'new'` son `mul:2x1:c0`.
  - `it('an ordered topic moves to the next step once the first is mastered')`: con `mul:2x1:c0` en box 2 → los nuevos son `mul:2x1:c1`.
  - `it('an ordered topic skips a step that cannot be generated')`: `skills: ['xx:nope', 'mul:2x1:c0']` → los nuevos son `mul:2x1:c0`.
- [ ] **Step 2:** `npx vitest run src/engine/__tests__/daily` → FAIL.
- [ ] **Step 3:** En `planDailySession`, si `topic.ordered`, `candidates` se queda con el primer elemento (tras filtrar `parseSkill !== null` y box < 2). Documentar el campo en `model.ts`.
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `Syllabus topics can be ordered steps: the daily plan teaches one step at a time`.

### Task 1: Multiplicar de menos a más (columna 2 × 2, 3 × 2, 3 × 3; doble y triple)

**Files:**
- Create: `src/engine/longmul.ts`, `src/activities/views/LongMulView.tsx` (+ `.module.css`), `src/engine/__tests__/longmul.test.ts`, `src/activities/views/LongMulView.test.tsx`
- Modify: los de la receta; `src/engine/calc.ts` (familia `triples`); `src/content/syllabus/grade3.ts`, `grade4.ts`

**Interfaces:**
- Produces: tipo `'long-mul'`; `interface LongMulExercise { kind: 'long-mul'; top: number; bottom: number; partials: number[] /* top × each digit of bottom, units first, already shifted (23 × 14 → [92, 230]) */; answer: number }`.
- Produces: *keys* `mul:col:2x2`, `mul:col:3x2`, `mul:col:3x3`; `ParsedSkill` `{ type: 'mulCol'; top: 2 | 3; bottom: 2 | 3 }`; `mulColSkill(top, bottom)`.
- Produces: `genLongMul(rng: Rng, top: 2 | 3, bottom: 2 | 3): LongMulExercise` en `longmul.ts`; `checkLongMul`, `hintsLongMul`.
- Produces: `MentalFamily` gana `'triples'` (*key* `mental:triples`), triple de 2–30 y de decenas hasta 90.

- [ ] **Step 1: Tests del motor que fallan** (`longmul.test.ts`): `genLongMul` con 200 semillas → `top` tiene 2 o 3 cifras y `bottom` 2 o 3 según los parámetros, `partials` suman `answer`, `answer === top * bottom`; `check` acepta la respuesta final aunque las filas parciales vengan vacías si el total es correcto, y marca fallo con un total erróneo; ninguna pista contiene `String(answer)` ni ningún parcial completo. `mental:triples`: `answer === 3 * a`, sin pasar de 270.
- [ ] **Step 2:** `npx vitest run src/engine/__tests__/longmul` → FAIL.
- [ ] **Step 3:** Implementar según la receta. Pistas: (1) «Multiplica el de arriba por las unidades de abajo, como en 2 × 1»; (2) «En la segunda fila multiplicas por las decenas: empieza dejando un 0 en las unidades»; (3) «Cuando tengas las filas, súmalas en columna». La vista: `CellGroup` con una fila de casillas por parcial y la fila del total, orden de escritura de derecha a izquierda fila a fila (como `column-mul`), el 0 de desplazamiento ya escrito en gris.
- [ ] **Step 4: Test de la vista** (`LongMulView.test.tsx`): renderiza 23 × 14, escribir 92, 230 y 322 con el teclado en pantalla y comprobar → `onAnswered` con `correct: true`.
- [ ] **Step 5: Temario.**
  - 3.º: tema nuevo `doble-triple` («Doble y triple», `mental:dobles`, `mental:triples`, `ordered`) en la etapa de las tablas, y tema `mul-2-cifras-intro` («Multiplicar por un número de 2 cifras (por partes)», `['mul:2dx2d']`) en la última etapa del 3.er trimestre.
  - 4.º: `mul-2-cifras` pasa a `ordered` con `['mul:2dx2d', 'mul:col:2x2']`; `mul-3x2` pasa a `ordered` con `['mul:3dx2d', 'mul:col:3x2']`; tema nuevo `mul-3-cifras` («Multiplicar por un número de 3 cifras», `['mul:col:3x3']`) en la etapa 8.
  - Test en el archivo de tests del temario: `currentTopic` de 4.º con `mul:2dx2d` en box 2 y `mul:col:2x2` sin ver → el plan enseña `mul:col:2x2` (Review Focus 1).
- [ ] **Step 6:** `npx tsc -b && npx vitest run` → PASS.
- [ ] **Step 7:** Commit `Multiplying from easy to hard: long multiplication in columns (2×2, 3×2, 3×3) after the by-parts step, doble y triple in 3.º`.

### Task 2: Números hasta 99 999 (y su introducción en 3.º)

**Files:**
- Modify: `src/engine/skills.ts` (el sufijo de rango), `src/engine/numeric.ts` (generadores de `place-value`, `compare`, `order`, `round`, `number-line`), `src/activities/views/PlaceValueView.tsx` (bloque de decenas de millar), `NumberLineView.tsx`, `describe.ts`, temarios
- Test: `src/engine/__tests__/numeric.test.ts` (o el de números que exista)

**Interfaces:**
- Produces: el campo `max` de `ParsedSkill` para `place`, `compare`, `order`, `line` pasa de `999` a `999 | 19999 | 99999`; las *keys* llevan el sufijo `:19999` o `:99999` (`num:place:words:99999`, `num:compare:19999`…). Sin sufijo sigue siendo hasta 9 999.
- Produces: `num:round:1000:99999` (redondear a millares números de 5 cifras) y `num:line:10000` (saltos de 10 000, siempre hasta 99 999).
- Produces: `placeName(4) === 'decenas de millar'`; `PlaceValueExercise.parts` tiene 5 elementos con 5 cifras.

- [ ] **Step 1: Tests que fallan:** `parseSkill('num:place:words:99999')` → `{ type: 'place', mode: 'words', max: 99999 }`; con 300 semillas, `num:place:*:99999` da valores entre 10 000 y 99 999 y `parts.length === 5`; `:19999` da valores entre 10 000 y 19 999; `numberWords(45 300) === 'cuarenta y cinco mil trescientos'`; `num:line:10000` no baja de 0 ni pasa de 99 999.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar. La vista de bloques dibuja la decena de millar como una pila de 10 bloques de millar con su etiqueta. Pistas: las mismas que hasta 9 999, con «decenas de millar».
- [ ] **Step 4: Temario.**
  - 3.º: tema `numeros-5-cifras` («Números de 5 cifras (introducción)», `ordered`, `['num:place:blocks:19999', 'num:place:words:19999', 'num:compare:19999']`) en el 3.er trimestre.
  - 4.º: el bloque `numeros` pasa a llamarse «Números hasta 99 999»; tema `numeros-99999` (`ordered`, `['num:place:blocks:99999', 'num:place:expanded:99999', 'num:place:words:99999', 'num:compare:99999', 'num:order:99999', 'num:round:1000:99999', 'num:line:10000']`) en la etapa 1, después de `repaso-numeros`.
- [ ] **Step 5:** `npx tsc -b && npx vitest run` → PASS.
- [ ] **Step 6:** Commit `Numbers up to 99 999 in 4.º (and up to 19 999 as an introduction in 3.º): decenas de millar in blocks, words, comparing, ordering, rounding and jumps of 10 000`.

### Task 3: Ordinales hasta el 30 (3.º)

**Files:**
- Create: `src/engine/ordinals.ts`, `src/activities/views/OrdinalView.tsx`, tests
- Modify: los de la receta; `grade3.ts`

**Interfaces:**
- Produces: tipo `'ordinal'`; `interface OrdinalExercise { kind: 'ordinal'; mode: 'row' | 'read' | 'write'; n: number; items: string[] /* row: emojis in a queue */; options: string[]; answer: number /* index in options, or the position tapped in row */ }`.
- Produces: *keys* `num:ordinal:10`, `num:ordinal:20`, `num:ordinal:30`; `ordinalSkill(max)`; `ordinalWord(n: number): string` (1 → 'primero', 11 → 'undécimo', 12 → 'duodécimo', 13 → 'decimotercero', 20 → 'vigésimo', 21 → 'vigésimo primero', 30 → 'trigésimo').
- Modos: `row` (una fila de objetos con la flecha de salida: «Toca el séptimo»; de menos a más, solo hasta 10), `read` (11.º → elegir la palabra), `write` (la palabra → elegir 11.º).

- [ ] **Step 1: Tests que fallan:** `ordinalWord` para 1, 3, 10, 11, 12, 13, 19, 20, 21, 30; con `num:ordinal:10` solo sale el modo `row` y `n <= 10`; `:30` nunca pasa de 30; `check` en `row` acepta la posición correcta.
- [ ] **Step 2–4:** FAIL → implementar → PASS. Pistas: «Cuenta desde el principio de la fila: primero, segundo, tercero…» / «Los ordinales del 11 al 19 empiezan por décimo» (sin decir cuál).
- [ ] **Step 5:** Temario 3.º: tema `ordinales` («Ordinales hasta el 30», `ordered`, las tres *keys*) en la etapa 1 o 2, junto a los números.
- [ ] **Step 6:** Commit `Ordinales hasta el 30 in 3.º: tap the n-th in a queue, then read and write them`.

### Task 4: Geometría que falta

**Files:**
- Modify: `src/engine/geometry.ts` (generadores nuevos), `src/engine/skills.ts` (`GeoOp`), `src/activities/views/FigureSvg.tsx` o el componente que dibuja `Figure` (semirrecta, segmento, elementos de la circunferencia, traslación), los de la receta, temarios
- Test: `src/engine/__tests__/geometry.test.ts`

**Interfaces:**
- Produces: `GeoOp` gana `'line:kind'` (recta / semirrecta / segmento), `'angle:class'` (agudo / recto / obtuso), `'tri:sides'` (equilátero / isósceles / escaleno, con las medidas escritas), `'tri:angles'` (acutángulo / rectángulo / obtusángulo), `'quad:name'` (cuadrado / rectángulo / rombo / romboide / trapecio), `'circle:parts'` (radio / diámetro / cuerda / arco: «¿Qué es la línea roja?»), `'translate'` (una figura en cuadrícula y su copia movida: «¿Cuántas casillas y hacia dónde se ha movido?», opciones tipo «3 a la derecha»), `'solid:count'` (caras, vértices o aristas de cubo, prismas y pirámides, respuesta con opciones numéricas).
- Todos son `shape-choice`; `LineFigure.kind` gana `'ray' | 'segment'` con sus extremos (punto o flecha); `CircleFigure` gana `highlight?: 'radius' | 'diameter' | 'chord' | 'arc'`; la traslación usa `GridFigure` con dos formas.

- [ ] **Step 1: Tests que fallan:** cada op nueva genera con 200 semillas una respuesta dentro de `options`; `angle:class` agudo < 90, obtuso entre 91 y 179; `tri:sides` con medidas coherentes (desigualdad triangular); ninguna pista contiene `options[answer]` (Review Focus 3, ver Tarea 10).
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Temario.**
  - 3.º: tema `rectas-segmentos` («Rectas, semirrectas y segmentos», `['geo:line:type', 'geo:line:kind']`, `ordered`); el tema de ángulos rectos pasa a `ordered` con `['geo:angle:tap', 'geo:angle:type', 'geo:angle:class']` y nombre «Ángulos: recto, agudo y obtuso».
  - 4.º: tema `triangulos-cuadrilateros` (`ordered`, `['geo:tri:sides', 'geo:tri:angles', 'geo:quad:name']`); tema `circunferencia-elementos` (`['geo:circle', 'geo:circle:parts']`, `ordered`); `simetria` pasa a «Simetría y traslación» con `geo:translate` después; `poligonos-cuerpos` gana `geo:solid:count`.
- [ ] **Step 6:** Commit `Geometry: rays and segments, acute and obtuse angles (3.º); classifying triangles and quadrilaterals, parts of the circle, translation, faces, vertices and edges (4.º)`.

### Task 5: Décimas y centésimas; sumar y restar decimales (4.º)

**Files:**
- Create: `src/engine/decimals.ts`, `src/activities/views/DecimalView.tsx`, `src/activities/views/DecimalOpView.tsx`, tests
- Modify: los de la receta; `grade4.ts`

**Interfaces:**
- Produces: los números decimales se guardan como **enteros en centésimas** (`2,45 → 245`) para no tener errores de coma flotante; `fmtDecimal(hundredths: number, places: 1 | 2): string` → `'2,45'`.
- Produces: tipo `'decimal'`; `interface DecimalExercise { kind: 'decimal'; mode: 'shade' | 'read' | 'compare' | 'money'; places: 1 | 2; value: number; other?: number; answer: number | '<' | '>' | '=' }` — `shade`: barra de 10 o cuadrícula de 100 coloreada → escribir el número; `read`: «tres décimas» → escribir 0,3; `compare`: dos decimales y < > =; `money`: 2,45 € ↔ 2 euros y 45 céntimos.
- Produces: tipo `'decimal-op'`; `interface DecimalOpExercise { kind: 'decimal-op'; op: 'add' | 'sub'; places: 1 | 2; left: number; right: number; answer: number }` en columna con la coma alineada; el resultado nunca es negativo.
- Produces: *keys* `dec:shade:1`, `dec:shade:2`, `dec:read:1`, `dec:read:2`, `dec:compare`, `dec:money`, `dec:add:1`, `dec:add:2`, `dec:sub:1`, `dec:sub:2`.
- Entrada: dos casillas, parte entera y parte decimal, con una coma fija entre ellas (como euros y céntimos); con `places: 2`, escribir 5 en la parte decimal se lee como 0,50 (la casilla tiene dos cifras y se rellena a la derecha) — se documenta en la vista.

- [ ] **Step 1: Tests que fallan:** `fmtDecimal(245, 2) === '2,45'`, `fmtDecimal(30, 1) === '0,3'`; `dec:sub:2` con 300 semillas nunca da negativo; `check` acepta 0,5 escrito como `0` y `5` y como `0` y `50` cuando `places` es 2 (Review Focus 2); las pistas de `dec:compare` no contienen el signo correcto.
- [ ] **Step 2–4:** FAIL → implementar → PASS. Pistas: «Mira primero la parte entera; si es igual, compara las décimas»; «Una décima es una de las 10 partes de la unidad»; en columna, «pon las comas una debajo de otra».
- [ ] **Step 5: Test de la vista:** `DecimalOpView` con 1,25 + 2,5 → escribir 3 y 75 con el teclado en pantalla → correcto.
- [ ] **Step 6: Temario 4.º:** bloque «Fracciones y decimales» (renombrar `fracciones`) con tema `decimales` (`ordered`: `dec:shade:1`, `dec:read:1`, `dec:shade:2`, `dec:read:2`, `dec:compare`, `dec:money`) en el 2.º trimestre después de `fracciones-12`, y tema `decimales-operar` (`ordered`: `dec:add:1`, `dec:sub:1`, `dec:add:2`, `dec:sub:2`) en el 3.er trimestre.
- [ ] **Step 7:** Commit `Decimals in 4.º: décimas and centésimas with bars and grids, reading, comparing, euros, adding and subtracting in columns`.

### Task 6: Operaciones combinadas, orden de las operaciones, propiedades, estimar y ≠

**Files:**
- Modify: `src/engine/calc.ts` (familias de `mental` y modo de `equation`), `src/activities/views/MentalView.tsx` si necesita paréntesis, `EquationView.tsx`, los de la receta, temarios
- Test: `src/engine/__tests__/calc.test.ts`

**Interfaces:**
- Produces: `MentalFamily` gana `'combinadas'` (`a + b − c`, de izquierda a derecha, hasta 1 000), `'jerarquia'` (`a + b × c`, `a − b ÷ c`), `'parentesis'` (`(a + b) × c`), `'asociativa'` (`2 × 7 × 5`: agrupar para que sea fácil), `'distributiva'` (`6 × 12 = 6 × 10 + 6 × __`), `'estimar'` (redondear los dos números a la decena o centena y operar; la respuesta es el resultado estimado). *Keys* `mental:<family>`.
- Produces: *key* `eq:same`: dos expresiones; el niño elige = o ≠ (`EquationExercise` gana `mode?: 'fill' | 'same'`; `answer` es `'=' | '≠'` en ese modo).
- Ningún resultado intermedio es negativo; `jerarquia` y `parentesis` dan resultados ≤ 200.

- [ ] **Step 1: Tests que fallan:** para cada familia nueva, 300 semillas → `answer` coincide con evaluar la expresión con la jerarquía correcta, nunca negativo; `estimar` acepta solo el estimado; `eq:same` responde `≠` en aproximadamente la mitad de los casos; las pistas no contienen `String(answer)`.
- [ ] **Step 2–4:** FAIL → implementar → PASS. Pistas de `jerarquia`: «Primero se multiplica y se divide; después se suma y se resta».
- [ ] **Step 5: Temario.**
  - 4.º: tema `combinadas` (`ordered`: `mental:combinadas`, `mental:jerarquia`, `mental:parentesis`) junto a `suma-resta-4d`; `estimar` (`['mental:estimar']`) en la etapa 1; `propiedades` («Propiedades conmutativa, asociativa y distributiva», `ordered`: `concept:commutative`, `mental:asociativa`, `mental:distributiva`) antes de `mul-2-cifras`; `igualdad` gana `eq:same`.
- [ ] **Step 6:** Commit `Combined operations and their order, associative and distributive properties, estimating and the ≠ sign (4.º)`.

### Task 7: Medida: múltiplos y submúltiplos; segundos

**Files:**
- Modify: `src/engine/measure.ts`, `src/engine/time.ts` (o `clock.ts`, donde viva `time:units`), los de la receta, `grade4.ts`
- Test: `src/engine/__tests__/measure.test.ts`, el de tiempo

**Interfaces:**
- Produces: *keys* `measure:convert:length:all`, `measure:convert:mass:all`, `measure:convert:capacity:all` — todas las unidades (km, hm, dam, m, dm, cm, mm; kg, hg, dag, g, dg, cg, mg; kl… ml); `ParsedSkill` de `measure` gana `all?: true`. Primero un salto (m → dm), luego varios (km → m); nunca decimales (los números siempre se convierten en enteros).
- Produces: *key* `time:seconds` (1 min = 60 s; pasar de min a s y al revés; duraciones con segundos), del tipo `calendar` (como `time:units`).

- [ ] **Step 1: Tests que fallan:** con 300 semillas, `:all` da siempre conversiones enteras y una sola unidad de destino; `time:seconds` respeta 60 s por minuto y no pasa de 10 min.
- [ ] **Step 2–4:** FAIL → implementar → PASS. Pistas: la escalera de unidades dibujada como texto («km hm dam m dm cm mm: cada escalón ×10»).
- [ ] **Step 5: Temario 4.º:** `longitud-4` y `masa-capacidad-4` ganan su `:all` al final (`ordered`); `duraciones-4` gana `time:seconds`.
- [ ] **Step 6:** Commit `Measure in 4.º: all multiples and submultiples (mm to km, mg to kg, ml to kl) and seconds`.

### Task 8: Tablas de datos, frecuencia y probable

**Files:**
- Modify: `src/engine/data.ts`, `src/activities/views/ChartView.tsx`, `ChanceView.tsx`, los de la receta, temarios
- Test: `src/engine/__tests__/data.test.ts`

**Interfaces:**
- Produces: `ChartExercise.mode` gana `'table'` (tabla de doble entrada: «¿Cuántos niños de 3.º B prefieren fútbol?») y `'tally'` (una lista de valores → cuántas veces sale uno: la frecuencia). *Keys* `chart:table`, `chart:freq`.
- Produces: *key* `prob:likely`: una bolsa con cantidades distintas; «¿Qué es más probable sacar?» con las opciones de los colores (`ChanceExercise.options` deja de ser fijo en ese modo).

- [ ] **Step 1: Tests que fallan:** `chart:table` con respuesta igual al valor de la celda; `chart:freq` cuenta bien; `prob:likely` nunca tiene empate en el más probable.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Temario:** 3.º, `graficos` gana `chart:table` delante (`ordered`); 4.º, `moda` pasa a «Frecuencia y moda» con `chart:freq` delante; `probabilidad` gana `prob:likely` al final (`ordered`).
- [ ] **Step 6:** Commit `Data tables (3.º), frequency and «más probable» (4.º)`.

### Task 9: Presupuesto, problemas de varios pasos y «¿tiene sentido?»

**Files:**
- Modify: `src/engine/money.ts`, `src/engine/bars.ts`, `src/engine/wordProblems.ts`, los de la receta, `grade4.ts`
- Test: los de dinero y problemas

**Interfaces:**
- Produces: `MoneyMode` gana `'budget'` (*key* `money:budget`): un presupuesto y una lista de precios; preguntas «¿Te llega?» (Sí / No), «¿Cuánto te falta?» o «¿Cuánto te sobra?», «¿Qué compra no pasa del presupuesto?».
- Produces: *key* `bar:three` (tres pasos con barra; mismo tipo `bar-problem`).
- Produces: *key* `word:sense`: un problema con una solución propuesta; el niño decide si tiene sentido (`shape-choice` con `figures: []`; comprobar que `ShapeChoiceView` funciona sin figuras y, si no, admitirlo).

- [ ] **Step 1: Tests que fallan:** `money:budget` nunca da un «te falta» negativo; `bar:three` da un resultado entero no negativo y usa tres operaciones; `word:sense` propone una solución absurda (×10, negativa no: mayor que el total, etc.) aproximadamente la mitad de las veces.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Temario 4.º:** `cambio-presupuesto` gana `money:budget`; `prob-dos-pasos` pasa a «Problemas de varios pasos» con `bar:three` y `word:sense` después (`ordered`).
- [ ] **Step 6:** Commit `Budget and saving, three-step problems and «does this answer make sense?» (4.º)`.

### Task 10: Pruebas de la resta y la división, programación pendiente, prueba inicial y comprobación final

**Files:**
- Modify: `grade3.ts` (tema de la prueba), `grade4.ts` (tema pendiente), `src/engine/placement.ts`, `docs/curriculum/PLAN_DOCENTE.md`, `tests/e2e/` (un recorrido)
- Test: `src/engine/__tests__/placement.test.ts`, un test genérico de pistas, el test de temario

**Interfaces:**
- Consumes: todas las *keys* de las tareas 1–9.

- [ ] **Step 1: Tests que fallan:**
  - Pistas: `it('no hint gives the answer away')` recorre todas las *keys* de los temarios de 3.º y 4.º, genera 30 ejercicios de cada una y comprueba que ninguna pista contiene la respuesta (número formateado o texto de la opción correcta en `shape-choice`) (Review Focus 3).
  - Prueba inicial: `buildPlacement` de 3.º y 4.º sigue teniendo `PLACEMENT_COUNT` ítems (Review Focus 4) y 4.º incluye un ítem de `num:place:words:99999` y uno de `dec:read:1`.
  - Temario: toda *key* de los temarios se puede generar (`generate` devuelve un ejercicio) salvo los temas `pendiente`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:**
  - 3.º: tema `prueba-resta-division` («La prueba de la resta y de la división», `ordered`, `['check:sub', 'check:div']`) en el 2.º trimestre.
  - 4.º: `div-2-cifras` pasa a `ordered` con una *key* nueva delante, `div:3x2:round` (divisores redondos 20, 30… 90; `ParsedSkill` `div3x2` gana la variante `'round'`, mismo `genDivision2d` con un parámetro), y un test de que esa variante solo da divisores múltiplos de 10.
  - 4.º: tema `programacion` («Primeros pasos en programación por bloques», `status: 'pendiente'`, `pendingNote: 'Necesita una herramienta de bloques; no hay ejercicios todavía'`).
  - Prueba inicial de 4.º: cambiar `num:place:words` por `num:place:words:99999` y `frac:of:4` por `dec:read:1`, sin cambiar el total.
  - `PLAN_DOCENTE.md`: una línea por tema nuevo en la sección de tipos de ejercicio.
- [ ] **Step 4:** `npx tsc -b && npx vitest run` → PASS.
- [ ] **Step 5: e2e:** un recorrido en `tests/e2e/journeys/` que abre la galería de 4.º (o una sesión con un tema forzado) y resuelve una multiplicación en columna 23 × 14 y una suma de decimales con el teclado en pantalla. `npx playwright test` → todo en verde en los cuatro proyectos.
- [ ] **Step 6:** Commit `Prueba de la resta y de la división (3.º), block programming as a pending topic (4.º), placement items for 99 999 and decimals, a hint check over every skill of both courses`, y `git push origin dev`.
