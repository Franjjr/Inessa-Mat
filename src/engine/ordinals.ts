/* Ordinales hasta el 30 (3.º). Three modes: row (num:ordinal:10: tap the n-th object of a queue, counting from its start),
   read (the child reads 11.º and picks its word) and write (the word is shown and the child picks the number). Words are
   the masculine ones (1.º primero … 30.º trigésimo) and the numerals keep the masculine indicator («7.º»).
   Pure: generator, check and hints. Hints never give the word or the number asked, nor a whole row. */
import type { Answer, CheckResult, Hint, OrdinalExercise, Rng } from '@/types'
import { ordinalSkill, type OrdinalMax } from './skills'
import { pick, randInt, shuffle } from './rng'

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

/** The masculine ordinal words, indexed by the number (index 0 unused). */
const WORDS: readonly string[] = [
  '', 'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo',
  'undécimo', 'duodécimo', 'decimotercero', 'decimocuarto', 'decimoquinto', 'decimosexto', 'decimoséptimo',
  'decimoctavo', 'decimonoveno', 'vigésimo', 'vigésimo primero', 'vigésimo segundo', 'vigésimo tercero',
  'vigésimo cuarto', 'vigésimo quinto', 'vigésimo sexto', 'vigésimo séptimo', 'vigésimo octavo', 'vigésimo noveno',
  'trigésimo',
]

/** The word of an ordinal from 1 to 30: ordinalWord(7) = 'séptimo', ordinalWord(21) = 'vigésimo primero'. */
export function ordinalWord(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n >= WORDS.length) throw new Error(`ordinalWord: ${n} is outside 1..30`)
  return WORDS[n]
}

/** The numeral with the masculine indicator: «7.º». */
export function ordinalNumeral(n: number): string {
  return `${n}.º`
}

/** What the child is asked, as the view and the daily plan say it. */
export function ordinalPrompt(ex: OrdinalExercise): string {
  if (ex.mode === 'row') return `Toca el ${ordinalWord(ex.n)}`
  if (ex.mode === 'read') return `¿Cómo se dice el ${ordinalNumeral(ex.n)}?`
  return `¿Qué número es «${ordinalWord(ex.n)}»?`
}

const ROW_EMOJIS = ['🍎', '🍄', '⭐', '🌸', '🐞', '🧁']

/** One item of the skill with top `max`: a row of alike objects (max 10, only the count tells the n-th), or a read or
    write item with an ordinal from 1 to max. */
export function genOrdinal(rng: Rng, max: OrdinalMax): OrdinalExercise {
  if (max === 10) return makeRow(rng, randInt(rng, 1, 10))
  return makeChoice(rng, pick(rng, ['read', 'write'] as const), randInt(rng, 1, max), max)
}

function makeRow(rng: Rng, n: number): OrdinalExercise {
  const length = randInt(rng, Math.max(n, 5), 10)
  const emoji = pick(rng, ROW_EMOJIS)
  return {
    id: `ordinal:row:${n}:${length}`, kind: 'ordinal', skill: ordinalSkill(10), difficulty: 1,
    mode: 'row', n, items: Array.from({ length }, () => emoji), options: [], answer: n - 1,
  }
}

/** Four options: the right ordinal and three near it (one or two places away, or ten away), so the child must count. */
function makeChoice(rng: Rng, mode: 'read' | 'write', n: number, max: OrdinalMax): OrdinalExercise {
  const others = Array.from({ length: max }, (_, i) => i + 1).filter((x) => x !== n)
  const near = others.filter((x) => Math.abs(x - n) <= 2 || Math.abs(x - n) === 10)
  const numbers = shuffle(rng, [n, ...shuffle(rng, near.length >= 3 ? near : others).slice(0, 3)])
  return {
    id: `ordinal:${mode}:${n}`, kind: 'ordinal', skill: ordinalSkill(max), difficulty: mode === 'read' ? 2 : 3,
    mode, n, items: [],
    options: numbers.map((x) => (mode === 'read' ? ordinalWord(x) : ordinalNumeral(x))),
    answer: numbers.indexOf(n),
  }
}

/** The position tapped (row) or the option picked (read, write) is graded. */
export function checkOrdinal(ex: OrdinalExercise, answer: Answer): CheckResult {
  const expected = ex.mode === 'read' ? ordinalWord(ex.n) : ordinalNumeral(ex.n)
  if (answer.type !== 'choice') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Toca tu respuesta.' }
  if (answer.index === null || answer.index === undefined) {
    return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Elige una respuesta.' }
  }
  if (ex.mode === 'row') {
    const given = ordinalNumeral(answer.index + 1)
    if (answer.index === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Has contado desde el principio.' }
    return { correct: false, given, expected, errorType: 'other', feedback: `¡Casi! Has tocado el ${given}. Cuenta desde el principio de la fila.` }
  }
  const given = ex.options[answer.index] ?? '?'
  if (answer.index === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Ese es el número del ordinal.' }
  return { correct: false, given, expected, errorType: 'other', feedback: `¡Casi! Cuenta hasta el ${ordinalNumeral(ex.n)} y mira qué palabra o número le toca.` }
}

/** A different number of the same family, for the worked example (never the one asked). */
function otherNumber(n: number, family: number[]): number {
  return family.find((x) => x !== n) ?? family[0]
}

export function hintsOrdinal(ex: OrdinalExercise): Hint[] {
  if (ex.mode === 'row') {
    const e = otherNumber(ex.n, [4, 2])
    return [
      hint(1, 'Cuenta desde el principio de la fila, uno a uno, sin saltarte ninguno.'),
      hint(2, 'Señala cada objeto con el dedo mientras cuentas en voz alta, sin saltarte ninguno, y para en el lugar que pide la pregunta.'),
      hint(3, `Ejemplo con otra fila: el ${ordinalWord(e)} es el que tiene delante ${e - 1} ${e - 1 === 1 ? 'objeto' : 'objetos'}.`),
    ]
  }
  // The clue depends on the family of the number: units, the teens or the twenties and thirties.
  const family = ex.n <= 10 ? 'units' : ex.n <= 19 ? 'teens' : 'tens'
  const example = family === 'units' ? otherNumber(ex.n, [2, 4, 6, 8]) : family === 'teens' ? otherNumber(ex.n, [13, 15, 17]) : otherNumber(ex.n, [30, 20])
  const first = {
    units: 'Un ordinal dice el lugar que ocupa en una serie, no cuántos hay.',
    teens: 'Los ordinales del 11 al 19 empiezan por décimo.',
    tens: 'Las decenas tienen palabra propia, que acaba en -ésimo.',
  }[family]
  const second = {
    units: 'Cuenta en voz baja hasta el número de la pregunta y fíjate en la palabra del último lugar que dices.',
    teens: 'Mira la cifra de la unidad y piensa en su palabra en la lista del 1 al 9. El 11 y el 12 tienen palabra propia.',
    tens: ex.n % 10 === 0
      ? 'Los números redondos, 20 y 30, tienen una sola palabra: no hay unidad que añadir.'
      : 'Mira primero la decena y después la unidad: la palabra se dice en ese orden.',
  }[family]
  return [
    hint(1, first),
    hint(2, second),
    hint(3, `Ejemplo con otro número: el ${ordinalNumeral(example)} se dice ${ordinalWord(example)}.`),
  ]
}
