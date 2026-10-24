/* Décimas y centésimas (4.º, dec:*): the numbers are whole hundredths (2,45 → 245), so no floating-point error creeps in.
   Generators, the reading of the two writing boxes, grading and hints. A centésima box holds two digits that fill from
   the left, so a single digit is read as tenths (5 → 0,50): the generators never ask 0,01 to 0,09 in a box. */
import type { Answer, CheckResult, DecimalExercise, DecimalMode, DecimalOpExercise, DecimalPlaces, Hint, Rng } from '@/types'
import { numberWords } from './numeric'
import { randInt } from './rng'
import { decimalSkill } from './skills'

/** Hundredths → the Spanish written form: 245 at 2 places is '2,45', 3 at 1 place is '0,3'. */
export function fmtDecimal(hundredths: number, places: DecimalPlaces): string {
  const whole = Math.floor(hundredths / 100)
  if (places === 1) return `${whole},${Math.floor((hundredths % 100) / 10)}`
  return `${whole},${String(hundredths % 100).padStart(2, '0')}`
}

/** The two boxes of a decimal answer (whole part, decimal part) in hundredths, or null while a box is empty. Places 1:
    the decimal box is one tenth. Places 2: the decimal box fills from the left, so 5 and 50 both mean 0,50. */
export function decimalFromBoxes(whole: number | null, decimal: number | null, places: DecimalPlaces): number | null {
  if (whole === null || decimal === null) return null
  const hundredthsPart = places === 1 || decimal < 10 ? decimal * 10 : decimal
  return whole * 100 + hundredthsPart
}

/** A decimal part a centésima box can hold: 0, or 10 or more (0,01 to 0,09 would be read as 0,10 to 0,90). */
const boxable = (hundredths: number) => hundredths % 100 === 0 || hundredths % 100 >= 10

/** The number in words for the read exercise: «tres décimas», «veintiuna centésimas». */
export function decimalWords(ex: DecimalExercise): string {
  const n = Math.floor(ex.value / (ex.places === 1 ? 10 : 1))
  if (ex.places === 1) return n === 1 ? 'una décima' : `${numberWords(n)} décimas`
  return `${numberWords(n).replace(/uno$/, 'una')} centésimas`
}

// ---------------------------------------------------------------- generators

/** shade and read: 0,n in décimas or 0,nn in centésimas. Compare: any two numbers of the same places. Money: euros and
    céntimos, shown as a decimal. */
export function genDecimal(rng: Rng, mode: DecimalMode, places: DecimalPlaces = 2): DecimalExercise {
  if (mode === 'compare') return genDecimalCompare(rng)
  if (mode === 'money') return genDecimalMoney(rng)
  const value = places === 1 ? randInt(rng, 1, 9) * 10 : randInt(rng, 10, 99)
  return {
    id: `decimal:${mode}:${places}:${value}`, kind: 'decimal', skill: decimalSkill(mode, places), difficulty: mode === 'shade' ? 2 : 3,
    mode, places, value, answer: value,
  }
}

function genDecimalCompare(rng: Rng): DecimalExercise {
  const places: DecimalPlaces = rng() < 0.5 ? 1 : 2
  const unit = places === 1 ? 10 : 1
  const value = randInt(rng, 1, Math.floor(999 / unit)) * unit
  const roll = rng()
  // Same whole part half the time, so the décimas (or centésimas) decide; equal now and then.
  const other = roll < 0.2 ? value
    : roll < 0.6 ? Math.floor(value / 100) * 100 + randInt(rng, 0, Math.floor(99 / unit)) * unit
      : randInt(rng, 1, Math.floor(999 / unit)) * unit
  const answer = value < other ? '<' : value > other ? '>' : '='
  return {
    id: `decimal:compare:${places}:${value}:${other}`, kind: 'decimal', skill: decimalSkill('compare'), difficulty: 3,
    mode: 'compare', places, value, other, answer,
  }
}

function genDecimalMoney(rng: Rng): DecimalExercise {
  const value = randInt(rng, 1, 9) * 100 + randInt(rng, 1, 99)
  return {
    id: `decimal:money:2:${value}`, kind: 'decimal', skill: decimalSkill('money'), difficulty: 3, mode: 'money', places: 2, value, answer: value,
  }
}

/** Sums and differences of decimals with the same places. The result of a sum stays under 10; a difference is never
    negative. */
export function genDecimalOp(rng: Rng, op: 'add' | 'sub', places: DecimalPlaces): DecimalOpExercise {
  const unit = places === 1 ? 10 : 1
  for (let attempt = 0; attempt < 200; attempt++) {
    let left: number
    let right: number
    if (op === 'add') {
      left = randInt(rng, 1, Math.floor(499 / unit)) * unit
      right = randInt(rng, 1, Math.floor(499 / unit)) * unit
    } else {
      left = randInt(rng, 2, Math.floor(999 / unit)) * unit
      right = randInt(rng, 1, left / unit - 1) * unit
    }
    const answer = op === 'add' ? left + right : left - right
    if (places === 2 && !boxable(answer)) continue
    return decimalOpExercise(op, places, left, right, answer)
  }
  // Unreachable in practice (most draws are fine); a fixed pair keeps the generator total.
  return places === 1 ? decimalOpExercise(op, 1, op === 'add' ? 120 : 430, op === 'add' ? 250 : 180, op === 'add' ? 370 : 250)
    : decimalOpExercise(op, 2, op === 'add' ? 125 : 430, op === 'add' ? 250 : 158, op === 'add' ? 375 : 272)
}

function decimalOpExercise(op: 'add' | 'sub', places: DecimalPlaces, left: number, right: number, answer: number): DecimalOpExercise {
  return {
    id: `decimal-op:${op}:${places}:${left}:${right}`, kind: 'decimal-op', skill: decimalSkill(op, places),
    difficulty: (op === 'add' ? 2 : 3) + (places === 2 ? 1 : 0), op, places, left, right, answer,
  }
}

// ---------------------------------------------------------------- grading

const FB = {
  incomplete: 'Escribe el número de las dos casillas.',
  whole: 'Revisa la parte entera, la que va antes de la coma.',
  decimal: 'Revisa las décimas y las centésimas, las que van después de la coma.',
  right: '¡Muy bien! Ese es el número.',
  money: '¡Muy bien! Ya sabes cuántos euros y céntimos son.',
  moneyWrong: 'Recuerda: un euro son cien céntimos. Los céntimos son las cifras que van después de la coma.',
  compare: '¡Casi! Compara primero la parte entera; si es igual, las décimas, y después las centésimas.',
  opWhole: 'Revisa la columna de las unidades. Pon las comas una debajo de otra.',
  opDecimal: 'Revisa las columnas de las décimas. Pon las comas una debajo de otra y empieza por la derecha.',
}

function wrongShape(expected: string): CheckResult {
  return { correct: false, given: '', expected, errorType: 'other', feedback: FB.incomplete }
}

/** Grades a decimal exercise: the two boxes (or the sign for compare). Pure and deterministic. */
export function checkDecimal(ex: DecimalExercise, answer: Answer): CheckResult {
  if (ex.mode === 'compare') return checkDecimalCompare(ex, answer)
  const expected = ex.mode === 'money' ? `${Math.floor(ex.value / 100)} euros y ${ex.value % 100} céntimos` : fmtDecimal(ex.value, ex.places)
  if (answer.type !== 'numbers' || answer.values.length !== 2) return wrongShape(expected)
  const [w, d] = answer.values
  if (w === null || d === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  if (ex.mode === 'money') {
    const given = w * 100 + d
    if (given === ex.value) return { correct: true, given: String(given), expected, feedback: FB.money }
    return { correct: false, given: `${w},${String(d).padStart(2, '0')}`, expected, errorType: 'other', feedback: FB.moneyWrong }
  }
  const value = decimalFromBoxes(w, d, ex.places) ?? 0
  const given = fmtDecimal(value, ex.places)
  if (value === ex.value) return { correct: true, given, expected, feedback: FB.right }
  const wholeRight = Math.floor(value / 100) === Math.floor(ex.value / 100)
  return { correct: false, given, expected, errorType: 'other', feedback: wholeRight ? FB.decimal : FB.whole }
}

function checkDecimalCompare(ex: DecimalExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'sign') return wrongShape(expected)
  if (answer.sign === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  if (answer.sign === ex.answer) return { correct: true, given: answer.sign, expected, feedback: '¡Muy bien! Has comparado los dos números.' }
  return { correct: false, given: answer.sign, expected, errorType: 'other', feedback: FB.compare }
}

/** Grades a column sum or difference: the two boxes of the result. */
export function checkDecimalOp(ex: DecimalOpExercise, answer: Answer): CheckResult {
  const expected = fmtDecimal(ex.answer, ex.places)
  if (answer.type !== 'numbers' || answer.values.length !== 2) return wrongShape(expected)
  const [w, d] = answer.values
  if (w === null || d === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  const value = decimalFromBoxes(w, d, ex.places) ?? 0
  const given = fmtDecimal(value, ex.places)
  if (value === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Has puesto las comas en su sitio y has calculado bien.' }
  const wholeRight = Math.floor(value / 100) === Math.floor(ex.answer / 100)
  return { correct: false, given, expected, errorType: 'other', feedback: wholeRight ? FB.opDecimal : FB.opWhole }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

/** The first worked example that is not the exercise's own answer (level 3 never uses the number asked). */
function otherValue(avoid: number, choices: number[]): number {
  return choices.find((c) => c !== avoid) ?? choices[0]
}

/** Hints of the decimal exercises: the strategy, the step, then one worked example with other numbers. No hint contains
    the answer, in any written form, nor the sign that compare asks for. */
export function hintsDecimal(ex: DecimalExercise | DecimalOpExercise): Hint[] {
  if (ex.kind === 'decimal-op') return hintsDecimalOp(ex)
  switch (ex.mode) {
    case 'shade': {
      const ex2 = otherValue(ex.value, [40, 70])
      const example = ex.places === 1
        ? `Ejemplo: ${numberWords(ex2 / 10)} partes de color de diez son ${ex2 / 10 === 1 ? 'una décima' : `${numberWords(ex2 / 10)} décimas`}: ${fmtDecimal(ex2, 1)}.`
        : `Ejemplo: ${numberWords(ex2)} partes de color de cien son ${numberWords(ex2)} centésimas: ${fmtDecimal(ex2, 2)}.`
      return [
        hint(1, ex.places === 1
          ? 'Una décima es una de las 10 partes iguales de la unidad. Cuenta las partes de color.'
          : 'Una centésima es una de las 100 partes iguales de la cuadrícula. Cuenta las partes de color.'),
        hint(2, ex.places === 1
          ? 'Antes de la coma va la parte entera, que aquí es cero. Después, escribe las décimas que cuentas.'
          : 'Antes de la coma va la parte entera, que aquí es cero. Después, escribe dos cifras con las centésimas.'),
        hint(3, example),
      ]
    }
    case 'read': {
      const ex2 = otherValue(ex.value, ex.places === 1 ? [70, 20] : [48, 23])
      const example = ex.places === 1
        ? `Ejemplo: ${numberWords(ex2 / 10)} décimas son ${fmtDecimal(ex2, 1)}: el número va después de la coma.`
        : `Ejemplo: ${numberWords(ex2)} centésimas son ${fmtDecimal(ex2, 2)}: la primera cifra va en las décimas y la segunda en las centésimas.`
      return [
        hint(1, ex.places === 1
          ? 'Una décima es una de las 10 partes de la unidad: se escribe después de la coma.'
          : 'Una centésima es una de las 100 partes de la unidad: son dos cifras después de la coma.'),
        hint(2, 'Escribe la parte entera, que es cero si no hay unidades, y después el número de décimas o de centésimas.'),
        hint(3, example),
      ]
    }
    case 'money': {
      const ex2 = otherValue(ex.value, [307, 540])
      return [
        hint(1, 'Un euro son cien céntimos: la coma separa los euros de los céntimos.'),
        hint(2, 'Cuenta primero cuántos euros enteros hay en la cantidad. Lo que sobra son céntimos.'),
        hint(3, `Ejemplo: ${fmtDecimal(ex2, 2)} € son ${Math.floor(ex2 / 100)} euros y ${ex2 % 100} céntimos. Los céntimos van en su casilla.`),
      ]
    }
    case 'compare': {
      const pairs: [string, string][] = [['4,6', '4,2'], ['3,8', '3,5']]
      const asked = [fmtDecimal(ex.value, ex.places), fmtDecimal(ex.other ?? 0, ex.places)]
      const [a, b] = pairs.find(([x, y]) => x !== asked[0] || y !== asked[1]) ?? pairs[0]
      return [
        hint(1, 'Mira primero la parte entera; si es igual, compara las décimas.'),
        hint(2, 'Si las partes enteras son distintas, el número con más unidades es el que vale más.'),
        hint(3, `Ejemplo: ${a} y ${b}. La parte entera es la misma. Como ${a.split(',')[1]} décimas son más que ${b.split(',')[1]} décimas, ${a} vale más que ${b}.`),
      ]
    }
  }
}

/** Column sums and differences: the comma rule, the zeros that square the columns, one worked example with other numbers. */
function hintsDecimalOp(ex: DecimalOpExercise): Hint[] {
  const add = ex.op === 'add'
  const examples = add
    ? [{ a: 340, b: 180, r: 520 }, { a: 230, b: 150, r: 380 }]
    : [{ a: 430, b: 180, r: 250 }, { a: 580, b: 320, r: 260 }]
  const pool = ex.places === 1 ? examples : add
    ? [{ a: 340, b: 185, r: 525 }, { a: 310, b: 205, r: 515 }]
    : [{ a: 430, b: 158, r: 272 }, { a: 520, b: 137, r: 383 }]
  // The example must not show the answer in any of its three numbers (the candidate pairs share no number).
  const answerText = fmtDecimal(ex.answer, ex.places)
  const chosen = pool.find((e) => ![e.a, e.b, e.r].some((v) => fmtDecimal(v, ex.places) === answerText)) ?? pool[0]
  const shownA = fmtDecimal(chosen.a, ex.places)
  const shownB = fmtDecimal(chosen.b, ex.places)
  const shownR = fmtDecimal(chosen.r, ex.places)
  return [
    hint(1, `En columna, pon las comas una debajo de otra. ${add ? 'Suma' : 'Resta'} desde la derecha.`),
    hint(2, ex.places === 1
      ? 'Si una fila tiene menos cifras después de la coma, escribe un cero para que todas tengan las mismas.'
      : 'Si una fila tiene menos cifras después de la coma, escribe ceros a la derecha para que todas tengan dos.'),
    hint(3, add
      ? `Ejemplo: ${shownA} + ${shownB} = ${shownR}. Se suma cada columna y, si pasa de 9, se lleva 1 a la columna de la izquierda.`
      : `Ejemplo: ${shownA} − ${shownB} = ${shownR}. Si una cifra de arriba es menor, pide una unidad a la columna de la izquierda.`),
  ]
}
