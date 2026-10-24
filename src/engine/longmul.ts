/* Multiplicar en columna de menos a más (4.º): 2 × 2, 3 × 2 and 3 × 3 digits. The partial rows are the top times each
   digit of the bottom, shifted (23 × 14 → 92 and 230); the total is their sum. Pure: generator, check and hints.
   Hints never give the answer nor a whole partial row. */
import type { Answer, CheckResult, Hint, LongMulExercise, Rng } from '@/types'
import { digitAt, fromDigits, toDigits } from './arith'
import { fmt } from './numeric'
import { randInt } from './rng'
import { mulColSkill } from './skills'

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

/** Makes the item from its two numbers: the partial rows and the answer follow from them. */
export function makeLongMul(top: number, bottom: number): LongMulExercise {
  const digits = toDigits(bottom)
  const partials = digits.map((d, j) => top * d * 10 ** j)
  const topDigits = toDigits(top).length as 2 | 3
  const bottomDigits = digits.length as 2 | 3
  return {
    id: `long-mul:${top}x${bottom}`, kind: 'long-mul', skill: mulColSkill(topDigits, bottomDigits),
    difficulty: topDigits + bottomDigits - 1, top, bottom, partials, answer: top * bottom,
  }
}

/** top with `top` digits (2 or 3) × bottom with `bottom` digits, no zero in the bottom: every row is a real partial. */
export function genLongMul(rng: Rng, top: 2 | 3, bottom: 2 | 3): LongMulExercise {
  const range = (digits: 2 | 3): [number, number] => (digits === 2 ? [12, 99] : [102, 999])
  const [topLo, topHi] = range(top)
  const [bottomLo, bottomHi] = range(bottom)
  for (let attempt = 0; attempt < 200; attempt++) {
    const b = randInt(rng, bottomLo, bottomHi)
    if (String(b).includes('0')) continue
    return makeLongMul(randInt(rng, topLo, topHi), b)
  }
  return makeLongMul(top === 2 ? 23 : 213, bottom === 2 ? 14 : 124)
}

/** The value of partial row j (units first). The shift zeros (places below j) are written already and count as 0;
    a row whose own cells are all empty has no value at all (the child did not write it). */
function valueOf(digits: readonly (number | null)[], j: number): number | null {
  if (digits.slice(j).every((d) => d === null)) return null
  return fromDigits(digits.map((d, k) => (k < j ? 0 : d ?? 0)))
}

const ROW_NAMES = ['unidades', 'decenas', 'centenas']

/** The total decides the grade. The written partial rows only say where a slip is, for the feedback. */
export function checkLongMul(ex: LongMulExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'long-mul') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Escribe el resultado en la última fila.' }
  if (answer.total.some((d) => d === null)) {
    return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Rellena todas las casillas del resultado.' }
  }
  const given = String(fromDigits(answer.total as number[]))
  if (given === expected) return { correct: true, given, expected, feedback: '¡Muy bien! Has sumado las filas en columna.' }
  // A wrong row says where the slip is; a shift zero that was left out is named as such.
  for (let j = 0; j < ex.partials.length; j++) {
    const v = valueOf(answer.rows[j] ?? [], j)
    if (v === null || v === ex.partials[j]) continue
    if (j > 0 && v * 10 ** j === ex.partials[j]) {
      return { correct: false, given, expected, errorType: 'place-value', feedback: '¡Casi! Al multiplicar por las decenas no olvides el cero de las unidades.' }
    }
    return {
      correct: false, given, expected, errorType: 'fact',
      feedback: `¡Casi! Revisa la fila de las ${ROW_NAMES[j]}: ${fmt(ex.top)} × ${digitAt(ex.bottom, j)}.`,
    }
  }
  return { correct: false, given, expected, errorType: 'other', feedback: '¡Casi! Revisa la suma de las filas, columna a columna.' }
}

export function hintsLongMul(ex: LongMulExercise): Hint[] {
  const threeRows = ex.partials.length > 2
  return [
    hint(1, 'Multiplica el de arriba por las unidades de abajo, como en 2 × 1.'),
    hint(2, `En la segunda fila multiplicas por las decenas: empieza dejando un 0 en las unidades.${threeRows ? ' La tercera fila va por las centenas: empieza dejando dos ceros.' : ''}`),
    hint(3, 'Pon las filas una debajo de otra y súmalas columna a columna, empezando por las unidades; las llevadas se escriben arriba.'),
  ]
}
