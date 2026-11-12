/* Operaciones de 4.º: multiplicar 3 cifras por 1 (en columna), dividir 4 cifras entre 1 y entre un número de 2 cifras
   (la galera), y multiplicar por dos cifras por partes (23 × 14 = 23 × 4 + 23 × 10, the step before the standard
   algorithm). Pure: generators, the mul-parts check, hints and statement. Hints never give a partial product or the result. */
import type { Answer, CheckResult, ColumnMulExercise, DivisionExercise, ErrorType, Hint, MulPartsExercise, Rng } from '@/types'
import { makeColumnMul } from './make'
import { fmt } from './numeric'
import { pick, randInt } from './rng'
import { galeraShowsAnswer } from './divParts'

/** 3-digit × 1-digit: c0 = no column carries; c1 = at least one carry. */
export function genMul3x1(rng: Rng, carry: boolean): ColumnMulExercise {
  for (let attempt = 0; attempt < 400; attempt++) {
    const d = randInt(rng, 2, 9)
    const top = randInt(rng, 100, carry ? 999 : 444)
    const digits = String(top).split('').map(Number)
    const carries = digits.some((x) => x * d >= 10)
    if (carries !== carry || top * d > 9999) continue
    return { ...makeColumnMul(top, d), skill: `mul:3x1:c${carry ? 1 : 0}`, difficulty: carry ? 4 : 3 }
  }
  return { ...makeColumnMul(213, 3), skill: 'mul:3x1:c0', difficulty: 3 }
}

/** A 4-digit dividend (1000..9999) by a 1-digit divisor, exact or with a remainder. */
/** `divisors` (optional): the one-digit divisors to pick from (the table asked); any of 2..9 when not given. */
export function genDivision4(rng: Rng, withRemainder: boolean, divisors?: number[]): DivisionExercise {
  for (let attempt = 0; attempt < 200; attempt++) {
    // Without divisors the draw is the same as before (randInt 2..9), so the seeded items do not change.
    const d = divisors && divisors.length ? pick(rng, divisors) : randInt(rng, 2, 9)
    const r = withRemainder ? randInt(rng, 1, d - 1) : 0
    const q = randInt(rng, Math.ceil((1000 - r) / d), Math.floor((9999 - r) / d))
    const dividend = d * q + r
    if (dividend < 1000 || dividend > 9999) continue
    if (galeraShowsAnswer(dividend, d, q, r, withRemainder)) continue
    const variant = withRemainder ? 'rem' : 'exact'
    return {
      id: `division:${dividend}/${d}`, kind: 'division', skill: `div:4x1:${variant}`, difficulty: withRemainder ? 5 : 4,
      dividend, divisor: d, quotient: q, remainder: r, variant,
    }
  }
  return { id: 'division:2468/2', kind: 'division', skill: 'div:4x1:exact', difficulty: 4, dividend: 2468, divisor: 2, quotient: 1234, remainder: 0, variant: 'exact' }
}

/** A dividend of 2 or 3 digits by a 2-digit divisor (12..39, not a round ten): half the time a one-digit quotient
    («¿cuántas veces cabe 23 en 96?»), otherwise a two-digit one. Exact or with a remainder. `round`: the divisor is a
    round ten (20, 30… 90), always exact: the first step before the other divisors. */
export function genDivision2d(rng: Rng, withRemainder: boolean, round = false): DivisionExercise {
  const variant = withRemainder && !round ? 'rem' : 'exact'
  for (let attempt = 0; attempt < 200; attempt++) {
    const d = round ? 10 * randInt(rng, 2, 9) : randInt(rng, 12, 39)
    if (!round && d % 10 === 0) continue
    const r = variant === 'rem' ? randInt(rng, 1, d - 1) : 0
    const q = rng() < 0.5 ? randInt(rng, 2, 9) : randInt(rng, 10, Math.floor((999 - r) / d))
    const dividend = d * q + r
    // The hints name the divisor and its round ten: the quotient is never one of them.
    if (dividend < 24 || dividend > 999 || q === d || q === Math.round(d / 10) * 10) continue
    return {
      id: `division:${dividend}/${d}`, kind: 'division', skill: round ? 'div:3x2:round' : `div:3x2:${variant}`,
      difficulty: round ? 4 : withRemainder ? 6 : 5, dividend, divisor: d, quotient: q, remainder: r, variant,
    }
  }
  return { id: 'division:96/24', kind: 'division', skill: 'div:3x2:exact', difficulty: 5, dividend: 96, divisor: 24, quotient: 4, remainder: 0, variant: 'exact' }
}

export function makeMulParts(top: number, bottom: number): MulPartsExercise {
  const units = bottom % 10
  const tens = bottom - units
  const digits = String(top).length
  return {
    id: `mul-parts:${top}x${bottom}`, kind: 'mul-parts', skill: digits >= 3 ? 'mul:3dx2d' : 'mul:2dx2d',
    difficulty: digits >= 3 ? 5 : 4, top, bottom, units, tens, partials: [top * units, top * tens], answer: top * bottom,
  }
}

/** top with `digits` digits × a two-digit number from 11 to 49 that is not a round ten. */
export function genMulParts(rng: Rng, digits: 2 | 3): MulPartsExercise {
  let bottom = randInt(rng, 11, 49)
  if (bottom % 10 === 0) bottom += 1
  const top = digits === 2 ? randInt(rng, 12, 98) : randInt(rng, 102, 299)
  return makeMulParts(top, bottom)
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Answer: numbers [top × units, top × tens, total]. The total decides: a right total is right whatever the parts say
    (empty, in the other order, the tens product without its zero). The parts only say where the slip is when the total
    is wrong, and a part that is right in the other line is never named as wrong. */
export function checkMulParts(ex: MulPartsExercise, answer: Answer): CheckResult {
  const expected = `${fmt(ex.partials[0])} + ${fmt(ex.partials[1])} = ${fmt(ex.answer)}`
  if (answer.type !== 'numbers') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Escribe las dos partes y la suma.' }
  const [p1, p2, total] = answer.values.map((v) => (isNum(v) ? v : null))
  const show = (v: number | null) => (v === null ? '?' : fmt(v))
  const given = `${show(p1)} + ${show(p2)} = ${show(total)}`
  const [byUnits, byTens] = ex.partials
  const parts = [p1, p2].filter((v): v is number => v !== null)
  const noZero = byTens % 10 === 0 && parts.includes(byTens / 10) && !parts.includes(byTens)
  if (total === ex.answer) {
    const note = noZero ? ` Un consejo: al multiplicar por ${ex.tens}, pon el cero de la derecha: ${fmt(ex.top)} × ${ex.tens} = ${fmt(byTens)}.` : ''
    return { correct: true, given, expected, feedback: `¡Muy bien! Has multiplicado por partes.${note}` }
  }
  if (total === null) {
    if (parts.length === 0) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Rellena las tres casillas.' }
    return { correct: false, given, expected, errorType: 'incomplete', feedback: 'Suma las dos partes y escribe el resultado.' }
  }
  let errorType: ErrorType = 'other'
  let feedback = '¡Casi! Revisa la suma de las dos partes, columna a columna.'
  if (noZero) {
    errorType = 'place-value'
    feedback = `¡Casi! Al multiplicar por ${ex.tens} no olvides el cero de la derecha.`
  } else if (parts.length === 2 && !parts.includes(byUnits)) {
    errorType = 'fact'
    feedback = `¡Casi! Revisa ${fmt(ex.top)} × ${ex.units}.`
  } else if (parts.length === 2 && !parts.includes(byTens)) {
    errorType = 'fact'
    feedback = `¡Casi! Revisa ${fmt(ex.top)} × ${ex.tens}: multiplica por ${ex.tens / 10} y pon un cero detrás.`
  } else if (parts.length < 2) {
    feedback = `¡Casi! Parte el ${ex.bottom} en ${ex.tens} y ${ex.units}, multiplica cada parte y suma.`
  } else if (total === p1! + p2!) {
    feedback = '¡Casi! Revisa la suma de las dos partes.'
  }
  return { correct: false, given, expected, errorType, feedback }
}

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

export function hintsMulParts(ex: MulPartsExercise): Hint[] {
  return [
    hint(1, `Parte el ${ex.bottom} en ${ex.tens} y ${ex.units}.`),
    hint(2, `Multiplica el número de arriba por ${ex.units}. Después, por las decenas: es multiplicar por ${ex.tens / 10} y poner un cero detrás.`),
    hint(3, 'Suma las dos partes en columna, con las unidades debajo de las unidades.'),
  ]
}

export function mulPartsStatement(ex: MulPartsExercise): string {
  return `${fmt(ex.top)} × ${ex.bottom} = ?`
}
