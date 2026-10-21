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
- Subtraction: the app teaches regrouping ("pedir prestado a la vecina": neighbour −1, this column +10),
  shown with crossed digits. Many Spanish schools teach the compensation method ("llevando": add 1 to the
  subtrahend's next column) — the check must accept the correct RESULT regardless of method; borrow cells are
  optional scratch space, never graded.
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
