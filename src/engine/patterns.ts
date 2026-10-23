/* Series y patrones (sentido algebraico, docs/curriculum/MATEMATICAS_PRIMARIA.md): the next figure of a repeating
   pattern (AB, ABC, AAB, ABB, AABB), the missing number of a series that goes up or down by the same amount, and,
   for 4.º, the number a series will reach further on. Pure: generators, checks, hints and statements. */
import type { Answer, CheckResult, Exercise, Hint, PatternExercise, Rng } from '@/types'
import { pick, randInt, shuffle } from './rng'

export type PatternSkill = 'shapes' | 'numbers' | 'predict'
export const PATTERN_SKILLS: PatternSkill[] = ['shapes', 'numbers', 'predict']

const FIGURES = ['🔴', '🔵', '🟡', '🟢', '⭐', '🔺', '🟦', '❤️']
/** Cores of the repeating patterns, as indexes of the figures picked. */
const CORES = [[0, 1], [0, 1, 2], [0, 0, 1], [0, 1, 1], [0, 0, 1, 1]]

export function makeShapePattern(core: string[], shown: number, options: string[]): PatternExercise {
  const items: (string | null)[] = Array.from({ length: shown }, (_, k) => core[k % core.length])
  const next = core[shown % core.length]
  items.push(null)
  return {
    id: `pattern:shapes:${core.join('')}:${shown}:${options.join('')}`, kind: 'pattern', skill: 'pattern:shapes',
    difficulty: core.length > 2 ? 2 : 1, mode: 'shapes', items, step: 0, position: null,
    options: [...options], answer: options.indexOf(next),
  }
}

export function makeNumberSeries(start: number, step: number, length: number, gap: number): PatternExercise {
  const values = Array.from({ length }, (_, k) => start + k * step)
  return {
    id: `pattern:numbers:${start}:${step}:${length}:${gap}`, kind: 'pattern', skill: 'pattern:numbers',
    difficulty: Math.abs(step) >= 5 && step % 5 !== 0 ? 3 : step < 0 ? 2 : 1, mode: 'numbers',
    items: values.map((v, k) => (k === gap ? null : v)), step, position: null, options: [], answer: values[gap],
  }
}

/** The first `shown` terms and «¿qué número estará en el puesto N?». */
export function makePredict(start: number, step: number, shown: number, position: number): PatternExercise {
  return {
    id: `pattern:predict:${start}:${step}:${shown}:${position}`, kind: 'pattern', skill: 'pattern:predict', difficulty: 3,
    mode: 'predict', items: Array.from({ length: shown }, (_, k) => start + k * step), step, position, options: [],
    answer: start + (position - 1) * step,
  }
}

export function buildPattern(variant: PatternSkill, rng: Rng): PatternExercise {
  if (variant === 'shapes') {
    const core = pick(rng, CORES)
    const figs = shuffle(rng, FIGURES)
    const used = figs.slice(0, Math.max(...core) + 1)
    const coreFigs = core.map((i) => used[i])
    const extra = figs[used.length]
    const shown = randInt(rng, 2, 3) * core.length + randInt(rng, 0, core.length - 1)
    return makeShapePattern(coreFigs, shown, shuffle(rng, [...used, extra]).slice(0, 4))
  }
  if (variant === 'numbers') {
    const up = rng() < 0.65
    const step = pick(rng, [2, 3, 5, 10, 10, 4])
    const length = 6
    const start = up ? randInt(rng, 0, 40) : randInt(rng, step * (length - 1), 100)
    const gap = randInt(rng, 2, length - 1)
    return makeNumberSeries(start, up ? step : -step, length, gap)
  }
  const step = pick(rng, [3, 4, 5, 6, 25, 50, 100])
  const start = step >= 25 ? step * randInt(rng, 1, 8) : randInt(rng, 1, 20)
  return makePredict(start, step, 4, randInt(rng, 8, 12))
}

// ---------------------------------------------------------------- checks and hints

export function checkPattern(ex: PatternExercise, answer: Answer): CheckResult {
  if (ex.mode === 'shapes') {
    const expected = ex.options[ex.answer]
    if (answer.type !== 'choice') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Elige una figura.' }
    if (answer.index === null || answer.index === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Elige una figura.' }
    const given = ex.options[answer.index] ?? '?'
    if (answer.index === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Has encontrado cómo se repite.' }
    return { correct: false, given, expected, errorType: 'other', feedback: '¡Casi! Busca el trozo que se repite y sigue desde el principio.' }
  }
  const expected = String(ex.answer)
  const v = answer.type === 'number' ? answer.value : answer.type === 'numbers' && answer.values.length === 1 ? answer.values[0] : undefined
  if (v === undefined) return { correct: false, given: '', expected, errorType: 'other', feedback: 'Escribe un número.' }
  if (v === null || !Number.isFinite(v)) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Escribe el número.' }
  if (v === ex.answer) return { correct: true, given: String(v), expected, feedback: '¡Muy bien! Has encontrado la regla de la serie.' }
  const feedback = ex.mode === 'predict'
    ? '¡Casi! Sigue la serie de salto en salto, contando los puestos con los dedos.'
    : ex.step < 0 ? '¡Casi! Esta serie baja: cada número es más pequeño que el anterior.' : '¡Casi! Mira cuánto sube de un número al siguiente.'
  return { correct: false, given: String(v), expected, errorType: 'other', feedback }
}

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

export function hintsPattern(ex: PatternExercise): Hint[] {
  if (ex.mode === 'shapes') return [
    hint(1, 'Di las figuras en voz alta, una detrás de otra.'),
    hint(2, 'Busca el trozo que se repite una y otra vez.'),
    hint(3, 'Mira con qué figura empieza el trozo que se repite y cuál le toca después de la última.'),
  ]
  if (ex.mode === 'predict') return [
    hint(1, 'Mira cuánto cambia de un número al siguiente: siempre lo mismo.'),
    hint(2, `Escribe la serie hasta llegar al puesto ${ex.position}.`),
    hint(3, 'Cuenta cuántos saltos hay desde el primer número hasta ese puesto y súmalos.'),
  ]
  return [
    hint(1, 'Mira dos números seguidos: ¿cuánto sube o cuánto baja?'),
    hint(2, 'Comprueba que cambia siempre lo mismo entre todos los números.'),
    hint(3, 'Desde el número de antes del hueco, da ese mismo salto.'),
  ]
}

export function patternStatement(ex: Exercise): string | null {
  if (ex.kind !== 'pattern') return null
  const row = ex.items.map((v) => (v === null ? '__' : String(v))).join(', ')
  if (ex.mode === 'shapes') return `¿Qué figura va después? ${row}`
  if (ex.mode === 'predict') return `${row}… ¿Qué número estará en el puesto ${ex.position}?`
  return `Completa la serie: ${row}`
}
