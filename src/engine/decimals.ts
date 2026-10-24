/* Décimas y centésimas (4.º, dec:*): the numbers are whole hundredths (2,45 → 245), so no floating-point error creeps in.
   Generators, the reading of the writing cells, grading and hints. The decimal part is written one digit per place: a
   décimas cell and, with places 2, a centésimas cell. An empty centésimas cell counts as 0 (5 in the décimas alone is 0,5). */
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

/** The writing cells of a decimal answer in hundredths: the whole part, the décimas and, with places 2, the centésimas
    (an empty centésimas cell is 0). null while the whole part or the décimas cell is empty. */
export function decimalFromCells(whole: number | null, tenths: number | null, hundredths: number | null, places: DecimalPlaces): number | null {
  if (whole === null || tenths === null) return null
  return whole * 100 + tenths * 10 + (places === 2 ? (hundredths ?? 0) : 0)
}

/** The number in words for the read exercise: «tres décimas», «una centésima», «veintiuna centésimas». */
export function decimalWords(ex: DecimalExercise): string {
  if (ex.places === 1) {
    const n = Math.floor(ex.value / 10)
    return n === 1 ? 'una décima' : `${numberWords(n)} décimas`
  }
  if (ex.value === 1) return 'una centésima'
  return `${numberWords(ex.value).replace(/uno$/, 'una')} centésimas`
}

// ---------------------------------------------------------------- generators

/** shade and read: 0,n in décimas, or 0,nn in centésimas (0,01 to 0,99). Compare: two numbers of the same places. Money:
    euros and céntimos, shown as a decimal. */
export function genDecimal(rng: Rng, mode: DecimalMode, places: DecimalPlaces = 2): DecimalExercise {
  if (mode === 'compare') return genDecimalCompare(rng)
  if (mode === 'money') return genDecimalMoney(rng)
  const value = places === 1 ? randInt(rng, 1, 9) * 10 : randInt(rng, 1, 99)
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
    negative (the left number is always the larger). */
export function genDecimalOp(rng: Rng, op: 'add' | 'sub', places: DecimalPlaces): DecimalOpExercise {
  const unit = places === 1 ? 10 : 1
  let left: number
  let right: number
  if (op === 'add') {
    left = randInt(rng, 1, Math.floor(499 / unit)) * unit
    right = randInt(rng, 1, Math.floor(499 / unit)) * unit
  } else {
    left = randInt(rng, 2, Math.floor(999 / unit)) * unit
    right = randInt(rng, 1, left / unit - 1) * unit
  }
  return decimalOpExercise(op, places, left, right, op === 'add' ? left + right : left - right)
}

function decimalOpExercise(op: 'add' | 'sub', places: DecimalPlaces, left: number, right: number, answer: number): DecimalOpExercise {
  return {
    id: `decimal-op:${op}:${places}:${left}:${right}`, kind: 'decimal-op', skill: decimalSkill(op, places),
    difficulty: (op === 'add' ? 2 : 3) + (places === 2 ? 1 : 0), op, places, left, right, answer,
  }
}

// ---------------------------------------------------------------- grading

const FB = {
  incomplete: 'Escribe el número en sus casillas.',
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

/** Grades a decimal exercise: the writing cells (whole, décimas, centésimas) or the sign for compare, or the euros and
    céntimos. Pure and deterministic. */
export function checkDecimal(ex: DecimalExercise, answer: Answer): CheckResult {
  if (ex.mode === 'compare') return checkDecimalCompare(ex, answer)
  if (ex.mode === 'money') return checkMoneyAmount(ex, answer)
  const expected = fmtDecimal(ex.value, ex.places)
  if (answer.type !== 'numbers' || answer.values.length !== 3) return wrongShape(expected)
  const [w, t, h] = answer.values
  if (w === null || t === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  const value = decimalFromCells(w, t, h, ex.places) ?? 0
  const given = fmtDecimal(value, ex.places)
  if (value === ex.value) return { correct: true, given, expected, feedback: FB.right }
  const wholeRight = Math.floor(value / 100) === Math.floor(ex.value / 100)
  return { correct: false, given, expected, errorType: 'other', feedback: wholeRight ? FB.decimal : FB.whole }
}

/** Money: the euros and the céntimos in their two boxes (a céntimo is not a decimal place). */
function checkMoneyAmount(ex: DecimalExercise, answer: Answer): CheckResult {
  const expected = `${Math.floor(ex.value / 100)} euros y ${ex.value % 100} céntimos`
  if (answer.type !== 'numbers' || answer.values.length !== 2) return wrongShape(expected)
  const [e, c] = answer.values
  if (e === null || c === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  const given = e * 100 + c
  if (given === ex.value) return { correct: true, given: fmtDecimal(given, 2), expected, feedback: FB.money }
  return { correct: false, given: fmtDecimal(given, 2), expected, errorType: 'other', feedback: FB.moneyWrong }
}

function checkDecimalCompare(ex: DecimalExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'sign') return wrongShape(expected)
  if (answer.sign === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  if (answer.sign === ex.answer) return { correct: true, given: answer.sign, expected, feedback: '¡Muy bien! Has comparado los dos números.' }
  return { correct: false, given: answer.sign, expected, errorType: 'other', feedback: FB.compare }
}

/** Grades a column sum or difference: the writing cells of the result. */
export function checkDecimalOp(ex: DecimalOpExercise, answer: Answer): CheckResult {
  const expected = fmtDecimal(ex.answer, ex.places)
  if (answer.type !== 'numbers' || answer.values.length !== 3) return wrongShape(expected)
  const [w, t, h] = answer.values
  if (w === null || t === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  const value = decimalFromCells(w, t, h, ex.places) ?? 0
  const given = fmtDecimal(value, ex.places)
  if (value === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Has puesto las comas en su sitio y has calculado bien.' }
  const wholeRight = Math.floor(value / 100) === Math.floor(ex.answer / 100)
  return { correct: false, given, expected, errorType: 'other', feedback: wholeRight ? FB.opDecimal : FB.opWhole }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

/** The first of the choices that is not the asked number (level 3 never uses the number asked). */
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
          ? 'Escribe la parte entera y, después, las décimas que cuentas.'
          : 'Escribe la parte entera y, después, las décimas y las centésimas, una cifra en cada casilla.'),
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
        hint(2, ex.places === 1
          ? 'Escribe la parte entera y, después, las décimas.'
          : 'Escribe la parte entera y, después, las décimas y las centésimas en su casilla.'),
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
    case 'compare': return hintsCompare(ex)
  }
}

/** Compare: the strategy names the places asked (décimas, or décimas and centésimas); the worked example uses a pair of
    numbers that neither asked number is part of. */
function hintsCompare(ex: DecimalExercise): Hint[] {
  const centesimas = ex.places === 2
  const pairs: [number, number][] = centesimas
    ? [[462, 427], [308, 305], [271, 279]]
    : [[460, 420], [380, 350], [270, 290]]
  const asked = new Set([ex.value, ex.other ?? 0])
  const [a, b] = pairs.find(([x, y]) => !asked.has(x) && !asked.has(y)) ?? pairs[0]
  const parts = (v: number) => (centesimas ? v % 100 : Math.floor((v % 100) / 10))
  const unitWord = centesimas ? 'centésimas' : 'décimas'
  return [
    hint(1, centesimas
      ? 'Mira primero la parte entera; si es igual, compara las décimas y después las centésimas.'
      : 'Mira primero la parte entera; si es igual, compara las décimas.'),
    hint(2, 'Si las partes enteras son distintas, el número con más unidades es el que vale más.'),
    hint(3, `Ejemplo: ${fmtDecimal(a, ex.places)} y ${fmtDecimal(b, ex.places)}. La parte entera es la misma (${Math.floor(a / 100)}). Como ${parts(a)} ${unitWord} son más que ${parts(b)} ${unitWord}, ${fmtDecimal(a, ex.places)} vale más que ${fmtDecimal(b, ex.places)}.`),
  ]
}

/** Worked examples of the column hints, as [a, b, result] in hundredths. Within a pool no number repeats across the
    candidates, so an asked exercise (three numbers) blocks at most three of the four and one is always left. */
const COLUMN_EXAMPLES: Record<string, [number, number, number][]> = {
  'add:1': [[340, 180, 520], [230, 150, 380], [410, 260, 670], [120, 330, 450]],
  'sub:1': [[430, 180, 250], [580, 320, 260], [640, 290, 350], [750, 440, 310]],
  'add:2': [[340, 185, 525], [310, 205, 515], [427, 136, 563], [162, 213, 375]],
  'sub:2': [[430, 158, 272], [520, 137, 383], [641, 293, 348], [705, 416, 289]],
}

/** Column sums and differences: the comma rule, the zeros that square the columns, and one worked example whose numbers
    are not the asked ones. */
function hintsDecimalOp(ex: DecimalOpExercise): Hint[] {
  const add = ex.op === 'add'
  const asked = [ex.left, ex.right, ex.answer]
  const pool = COLUMN_EXAMPLES[`${ex.op}:${ex.places}`]
  const [a, b, r] = pool.find(([x, y, z]) => ![x, y, z].some((v) => asked.includes(v))) ?? pool[0]
  return [
    hint(1, `En columna, pon las comas una debajo de otra. ${add ? 'Suma' : 'Resta'} desde la derecha.`),
    hint(2, ex.places === 1
      ? 'Si una fila tiene menos cifras después de la coma, escribe un cero para que todas tengan las mismas.'
      : 'Si una fila tiene menos cifras después de la coma, escribe ceros a la derecha para que todas tengan dos.'),
    hint(3, add
      ? `Ejemplo: ${fmtDecimal(a, ex.places)} + ${fmtDecimal(b, ex.places)} = ${fmtDecimal(r, ex.places)}. Se suma cada columna y, si pasa de 9, se lleva 1 a la columna de la izquierda.`
      : `Ejemplo: ${fmtDecimal(a, ex.places)} − ${fmtDecimal(b, ex.places)} = ${fmtDecimal(r, ex.places)}. Si una cifra de arriba es menor, pide una unidad a la columna de la izquierda.`),
  ]
}
