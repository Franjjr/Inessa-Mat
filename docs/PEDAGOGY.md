# Numeria — Pedagogy (shared by engine, content, activities, lessons)

Source material: the printed workbook in `docs/reference/` (PDF + `build.py` with all texts and exercises).
The app must teach like the best primary teacher: understanding → strategies → fluency, with joy and no anxiety.

## Principles

1. **Meaning before memorising.** Multiplication = equal groups / arrays; division = fair sharing and the inverse
   of multiplication (fact families). Place value houses (UM, C, D, U) before column algorithms.
2. **Strategies, not rote.** Every fact has a trick (below). Hints recall the trick first, then show a visual,
   then a worked step.
3. **The mirror rule** (commutativity) halves the work. Mastery of `mul:6x7` covers 7×6.
4. **Success rate ≈ 80%.** Mix ~70% known items with ~30% new/weak ones. Never more than 3 brand-new facts in a
   session. A failed item comes back 2–4 items later in the same session, then again in later sessions.
5. **Spacing and interleaving.** Short daily sessions (default 15 min): warm-up → adventure → mixed review → game.
6. **Errors are clues.** Feedback names the strategy ("¡Casi! Prueba con doble, doble, doble"), never shames.
   Column-op errors are diagnosed (forgot carry, smaller-from-larger, borrow across zero…) and highlighted gently.
7. **Recognition ≠ maths.** If the handwriting was misread, the child can fix the digit; it is logged as
   `recognition` and NEVER lowers mastery.
8. **Time pressure is optional** and only against oneself (race activity, personal records). Parents can disable it.
9. **Say the whole fact** ("seis por siete, cuarenta y dos"): speech/TTS reads facts aloud when voice is on.
10. **Praise effort and strategy**, not intelligence ("¡Qué bien has usado el truco del doble!").

## Season 1 curriculum (matches the workbook)

| World | Focus | Key skills |
|---|---|---|
| w1 Bosque de los Grupos | what multiplication is, arrays, mirror rule, easy tables ×1 ×2 ×5 ×10 (+ review ×3 ×4) | concept:groups, concept:array, concept:commutative, mul facts with 1,2,5,10, skip:2..5 |
| w2 Río de las Sumas | column addition 3 and 4 digits with carries, place value | concept:placevalue, add:3d:c0..c3, add:4d:c0..c4 |
| w3 Cueva del Seis | table of 6 | mul:6x1..6x10, skip:6, missing factor |
| w4 Montaña de las Restas | column subtraction 3 and 4 digits, borrowing, zeros, checking with addition | sub:3d:b0..b2, sub:3d:z, sub:4d:b0..b3, sub:4d:z |
| w5 Lago del Ocho | table of 8 (+ mix with 6) | mul:8x…, skip:8 |
| w6 Jardín del Arcoíris | table of 7 + mixed 6/7/8 | mul:7x…, race, pixel |
| w7 Forja del Dragón | 2-digit × 1-digit (split, column, carry) | mul:2x1:c0, mul:2x1:c1 |
| w8 Castillo del Reparto | division: sharing, fact families, galera, remainder | concept:share, concept:family, div facts, div:2x1:exact, div:2x1:rem, div:2x1:long (optional "experta") |

## Strategies per multiplication fact (a × b, 1..10)

- ×1 "se queda igual"; ×2 "el doble"; ×5 "acaba en 0 o en 5 / mitad de ×10"; ×10 "pon un 0".
- ×4 "doble y doble" (7×4: 7→14→28).
- ×6 "el 5 y uno más" (6×7 = 5×7 + 7 = 35 + 7). Even factor: "los pares que riman" (6×8 → acaba en 8, delante su mitad 4 → 48).
- ×8 "doble, doble y doble" (8×7: 7→14→28→56).
- ×9 "uno menos y suman 9" (7×9 → 6_, 6+3=9 → 63) or ×10 − n.
- 7×7 "¡Siete por siete, cuarenta y nueve, y el arcoíris llueve!" (square rhyme). 6×6, 8×8 squares.
- 7×8 "5, 6, 7, 8 → 56 = 7 × 8". 7×3 "tres semanas = 21 días".
- Anything already learned: "espejo" (mirror) → e.g. 7×6 is 6×7 from the Cave.

## Mastery model (engine)

Leitner boxes 0–5 per skill; intervals: box0 now/same session, 1 → 1 day, 2 → 2 days, 3 → 4 days, 4 → 8 days,
5 → 16 days. Correct + fluent (below threshold, no hints) → box+1. Correct but slow or with hints → stays
(but box 0 → 1). Wrong → box = max(0, box−2), due now. Recognition errors ignored.
Fluency thresholds (facts): keyboard 4 s, keypad 5 s, pen/touch 7 s (writing two digits is slow at 7–8 years).
Column ops are judged on accuracy only (no speed).

## Column algorithms (Spain)

- Addition: units first, carry written small above the next column ("me llevo una").
- Subtraction: one method, the one of the child's school, see «Un método por operación» below. The default is
  «pedir prestado arriba» (the neighbour gives a ten: its digit is crossed and goes down by one, this column reads
  +10). «Me llevo una abajo» (compensation: +10 on top, +1 on the next subtrahend digit) is the other school
  method, when the grown-up says so. Both accept the correct RESULT; a written step (the lender's new digit, the +1)
  only gives a gentle tip where the child writes it, and an empty step is never wrong.
- Multiplication 2×1: units first, carry above tens, added after multiplying.
- Division "galera" (Spanish layout): dividend left, divisor right inside the bracket, quotient below the divisor,
  remainder below the dividend. Check: cociente × divisor + resto = dividendo; resto < divisor.

## Feedback copy (child-facing)

Short, warm, concrete, in Spanish, and through the companion/Lumi. Examples:
- correct: "¡Bien hecho, {child}!", "¡Toma ya!", "¡Lo has clavado!"
- wrong (fact): "¡Casi! Prueba el truco: {strategy}"
- carry-forgot: "¡Ojo con la mochila! Te has dejado la llevada en las {column}."
- smaller-from-larger: "Arriba hay un número más pequeño: ¡pide ayuda a la vecina!"
- remainder-too-big: "El resto tiene que ser más pequeño que {divisor}. ¡Cabe una vez más!"

## Un método por operación: el del colegio, que elige el adulto

Un método por operación, el del colegio del niño, que elige el adulto. Por defecto, pedir prestado y la galera con
restas. La respuesta final correcta siempre vale. Otros caminos solo como pista o curiosidad opcional, nunca como
elección del niño.

Por qué: a un niño de 7-8 años varias formas de hacer la misma cuenta le confunden, y la que usa en casa tiene que
ser la de su cuaderno. Por eso se retiraron la resta por partes, los saltos en la recta, repartir por partes y
multiplicar hacia arriba (noviembre de 2026).

1. **Registro** (`src/engine/methods.ts`): una lista por operación. Resta (`SUB_METHODS`): «pedir prestado
   arriba» (`borrow`, por defecto) y «me llevo una abajo» (`carry`). División (`DIV_METHODS`): «la galera con
   restas» (`galera`, por defecto) y «la galera sin restas» (`galera-short`). Cada uno lleva su nombre, una frase
   para el adulto y su ejemplo de cuaderno (52 − 27, 96 ÷ 4), que los ajustes dibujan siempre a la vista.
2. **Quién elige**: solo el adulto. La primera vez (desde 2.º; la galera desde 3.º) la zona de adultos pregunta
   «¿Cómo resta tu hijo en el colegio cuando arriba hay menos?» con los dos dibujos. Mientras no conteste no se
   bloquea nada: se usan los métodos por defecto. Con «Otro» o «No lo sé» también, y se le explica que la
   respuesta correcta siempre vale. Se guarda en `ChildSettings.subMethod`, `divMethod` y `schoolMethodAsked`.
   Una lección nunca cambia el método (`setPreference` ignora `subMethod` y `divMethod`).
3. **Datos antiguos**: los ids retirados siguen en los tipos (`SubMethod`, `DivMethod`) para que los perfiles y
   los intentos guardados carguen. `normaliseSubMethod`/`normaliseDivMethod` y `methodFor(op, prefs)` los
   convierten en el método por defecto; la zona de adultos avisa una sola vez («Hemos quitado los saltos: ahora
   resta como en el cole») y, al leerlo, guarda el método del colegio.
4. **Vista**: todas las pantallas piden el método con `methodFor`. La resta es siempre la columna
   (`SubtractionView` → `ColumnView`) y la división siempre la galera (`DivisionView`).
5. **Comprobación** (`src/engine/check.ts`): la respuesta final siempre cuenta. Los pasos escritos (marcas, restos
   intermedios) solo dan un consejo amable; un paso vacío nunca es un error y nunca impide comprobar.
6. **Pistas** (`src/engine/hints.ts`, `hintsFor(ex, method)`): tres niveles por método. Nivel 1, la estrategia;
   nivel 2, el apoyo visual; nivel 3, un paso intermedio. Ninguna pista dice el resultado final. La galera sin
   restas no pide escribir restas. La idea de multiplicar hacia arriba («¿qué número por 7 se acerca a 63 sin
   pasarse?») queda como pista de la galera.
7. **Registro**: cada intento lleva el método en `context.method` (sin cambiar el esquema de la base de datos).
   El informe del adulto lo resume; los intentos antiguos con un método retirado conservan su nombre.

Los trucos de las tablas (`TABLE_METHODS`: el doble, el 5 y uno más, el 9…) no cambian la pantalla: son pistas.
El adulto puede fijar uno o dejar «La app decide» (`tableMethod: null`). Multiplicar por dos cifras se practica
en columna; «por partes» solo explica por qué funciona, y en ella también decide el total.
