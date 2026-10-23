/* Problemas con barras (docs/curriculum/PLAN_DOCENTE.md §5). A story is drawn as a bar diagram: each number goes on
   the piece of the bar that it is (lo que tiene, lo que cambia, el total, una parte, cada grupo), and the unknown
   piece is the «?». Then the child chooses the operation and writes the result. The same problem can be asked
   without the drawing: that is the second rung of the ladder (withBar false).
   Kinds (PLAN §5): cambio (change), comparación (compare), combinación (combine), reparto (share and groups), and
   two-step problems (dos pasos). Pure: no React. Numbers are generated so that no result equals an operand, which
   keeps the hints free of the answer. */
import type {
  Answer, BarOp, BarProblemExercise, BarProblemKind, BarSlot, BarStep, CheckResult, Hint, Rng,
} from '@/types'
import { pick, randInt, shuffle } from './rng'
import type { BarSkillOp } from './skills'
import { barSkill } from './skills'

interface Built {
  text: string
  bar: BarSlot[]
  steps: BarStep[]
  unit: string
}

interface Variant {
  id: string
  problem: BarProblemKind
  build: (rng: Rng) => Built | null
}

const cell = (id: string, name: string, row: number, kind: BarSlot['kind'], value: number | null): BarSlot =>
  ({ id, name, row, kind, value })

const stepOf = (op: BarOp, a: number, b: number): BarStep => {
  const result = op === 'add' ? a + b : op === 'sub' ? a - b : op === 'mul' ? a * b : Math.floor(a / b)
  return { op, a, b, result }
}

/** A result that a child can meet on its own: positive and not one of the numbers of the story. */
const fine = (result: number, given: number[]) => result >= 1 && !given.includes(result)

/** Tries `make` a few times; the builders return null when the numbers do not read well. */
function tries(make: () => Built | null, n = 25): Built | null {
  for (let i = 0; i < n; i++) {
    const b = make()
    if (b) return b
  }
  return null
}

const VARIANTS: Record<BarSkillOp, Variant[]> = {
  add: [
    {
      id: 'change-add', problem: 'change',
      build: (rng) => tries(() => {
        const a = randInt(rng, 12, 60)
        const b = randInt(rng, 4, 30)
        const s = stepOf('add', a, b)
        if (!fine(s.result, [a, b])) return null
        return {
          text: `{child} tenía ${a} cromos. Su hermano le da ${b} más. ¿Cuántos cromos tiene ahora?`,
          bar: [cell('start', 'Tenía', 0, 'segment', a), cell('change', 'Le dan', 0, 'segment', b), cell('end', 'Ahora', 0, 'total', null)],
          steps: [s], unit: 'cromos',
        }
      }),
    },
    {
      id: 'combine-total', problem: 'combine',
      build: (rng) => tries(() => {
        const p = randInt(rng, 8, 40)
        const q = randInt(rng, 5, 35)
        const s = stepOf('add', p, q)
        if (!fine(s.result, [p, q])) return null
        return {
          text: `En la clase hay ${p} niñas y ${q} niños. ¿Cuántos alumnos hay?`,
          bar: [cell('girls', 'Niñas', 0, 'segment', p), cell('boys', 'Niños', 0, 'segment', q), cell('all', 'Alumnos', 0, 'total', null)],
          steps: [s], unit: 'alumnos',
        }
      }),
    },
  ],
  sub: [
    {
      id: 'change-sub-end', problem: 'change',
      build: (rng) => tries(() => {
        const a = randInt(rng, 20, 80)
        const b = randInt(rng, 3, a - 5)
        const s = stepOf('sub', a, b)
        if (!fine(s.result, [a, b])) return null
        return {
          text: `{child} tenía ${a} canicas y en el recreo pierde ${b}. ¿Cuántas le quedan?`,
          bar: [cell('start', 'Tenía', 0, 'segment', a), cell('change', 'Pierde', 0, 'segment', b), cell('end', 'Le quedan', 0, 'total', null)],
          steps: [s], unit: 'canicas',
        }
      }),
    },
    {
      id: 'change-unknown', problem: 'change',
      build: (rng) => tries(() => {
        const a = randInt(rng, 10, 50)
        const k = randInt(rng, 4, 30)
        const c = a + k
        const s = stepOf('sub', c, a)
        if (!fine(s.result, [a, c])) return null
        return {
          text: `Al principio había ${a} estrellas en el cielo. Ahora hay ${c}. ¿Cuántas estrellas han salido?`,
          bar: [cell('before', 'Antes', 0, 'segment', a), cell('came', 'Han salido', 0, 'segment', null), cell('now', 'Ahora', 0, 'total', c)],
          steps: [s], unit: 'estrellas',
        }
      }),
    },
    {
      id: 'combine-part', problem: 'combine',
      build: (rng) => tries(() => {
        const t = randInt(rng, 30, 90)
        const p = randInt(rng, 8, t - 8)
        const s = stepOf('sub', t, p)
        if (!fine(s.result, [p, t])) return null
        return {
          text: `En la clase hay ${t} alumnos. ${p} son niñas. ¿Cuántos son niños?`,
          bar: [cell('girls', 'Niñas', 0, 'segment', p), cell('boys', 'Niños', 0, 'segment', null), cell('all', 'Alumnos', 0, 'total', t)],
          steps: [s], unit: 'niños',
        }
      }),
    },
    {
      id: 'compare-diff', problem: 'compare',
      build: (rng) => tries(() => {
        const a = randInt(rng, 20, 70)
        const b = randInt(rng, 5, a - 5)
        const s = stepOf('sub', a, b)
        if (!fine(s.result, [a, b])) return null
        return {
          text: `{child} tiene ${a} canicas y su amigo tiene ${b}. ¿Cuántas canicas más tiene {child}?`,
          bar: [cell('me', 'Tú', 0, 'segment', a), cell('friend', 'Amigo', 1, 'segment', b), cell('more', 'Diferencia', 2, 'segment', null)],
          steps: [s], unit: 'canicas',
        }
      }),
    },
    {
      id: 'compare-small', problem: 'compare',
      build: (rng) => tries(() => {
        const a = randInt(rng, 20, 70)
        const d = randInt(rng, 3, a - 5)
        const s = stepOf('sub', a, d)
        if (!fine(s.result, [a, d])) return null
        return {
          text: `Ana tiene ${a} canicas, que son ${d} más que las de Luis. ¿Cuántas canicas tiene Luis?`,
          bar: [cell('ana', 'Ana', 0, 'segment', a), cell('luis', 'Luis', 1, 'segment', null), cell('more', 'Diferencia', 2, 'segment', d)],
          steps: [s], unit: 'canicas',
        }
      }),
    },
  ],
  mul: [
    {
      id: 'groups-total', problem: 'share',
      build: (rng) => tries(() => {
        const n = randInt(rng, 3, 6)
        const p = randInt(rng, 3, 9)
        const s = stepOf('mul', n, p)
        if (!fine(s.result, [n, p])) return null
        return {
          text: `En la tienda hay ${n} cajas con ${p} lápices en cada una. ¿Cuántos lápices hay en total?`,
          bar: [cell('boxes', 'Cajas', 0, 'count', n), cell('each', 'Cada una', 0, 'segment', p), cell('all', 'Total', 0, 'total', null)],
          steps: [s], unit: 'lápices',
        }
      }),
    },
  ],
  div: [
    {
      id: 'share-each', problem: 'share',
      build: (rng) => tries(() => {
        const n = randInt(rng, 2, 6)
        const k = randInt(rng, 2, 9)
        const t = n * k
        const s = stepOf('div', t, n)
        if (k === n || !fine(s.result, [t, n])) return null
        return {
          text: `Hay ${t} caramelos para repartir entre ${n} amigos, todos con la misma cantidad. ¿Cuántos caramelos le tocan a cada uno?`,
          bar: [cell('all', 'Caramelos', 0, 'total', t), cell('friends', 'Amigos', 0, 'count', n), cell('each', 'Cada uno', 0, 'segment', null)],
          steps: [s], unit: 'caramelos',
        }
      }),
    },
  ],
  two: [
    {
      id: 'two-groups-sub', problem: 'two-step',
      build: (rng) => tries(() => {
        const n = randInt(rng, 2, 5)
        const p = randInt(rng, 4, 9)
        const total = n * p
        const g = randInt(rng, 3, total - 3)
        const s1 = stepOf('mul', n, p)
        const s2 = stepOf('sub', total, g)
        if (!fine(total, [n, p]) || !fine(s2.result, [n, p, g])) return null
        return {
          text: `{child} compra ${n} paquetes de ${p} cromos y luego regala ${g}. ¿Cuántos cromos le quedan?`,
          bar: [
            cell('packs', 'Paquetes', 0, 'count', n), cell('per', 'Cada paquete', 0, 'segment', p), cell('bought', 'Cromos', 0, 'total', null),
            cell('gave', 'Regala', 1, 'segment', g), cell('left', 'Le quedan', 1, 'segment', null), cell('had', 'Tenía', 1, 'total', null),
          ],
          steps: [s1, s2], unit: 'cromos',
        }
      }),
    },
    {
      id: 'two-add-share', problem: 'two-step',
      build: (rng) => tries(() => {
        const a = randInt(rng, 8, 30)
        const b = randInt(rng, 4, 20)
        const total = a + b
        const ns = [2, 3, 4, 5].filter((n) => total % n === 0 && total / n !== n && total / n >= 2)
        if (ns.length === 0) return null
        const n = pick(rng, ns)
        const s1 = stepOf('add', a, b)
        const s2 = stepOf('div', total, n)
        if (!fine(s2.result, [a, b, n, total])) return null
        return {
          text: `{child} tiene ${a} cromos y su amiga le da ${b}. Lo reparte entre ${n} amigos, todos con la misma cantidad. ¿Cuántos cromos le tocan a cada amigo?`,
          bar: [
            cell('has', 'Tiene', 0, 'segment', a), cell('gives', 'Le da', 0, 'segment', b), cell('now', 'Ahora tiene', 0, 'total', null),
            cell('friends', 'Amigos', 1, 'count', n), cell('share', 'Cada uno', 1, 'segment', null), cell('shared', 'Lo reparte', 1, 'total', null),
          ],
          steps: [s1, s2], unit: 'cromos',
        }
      }),
    },
  ],
}

/** Skill keys of the bar problems, for the planner and the syllabus. */
export const BAR_OPS: BarSkillOp[] = ['add', 'sub', 'mul', 'div', 'two']

function difficultyOf(skill: BarSkillOp, steps: number): number {
  if (steps > 1) return 4
  return skill === 'add' || skill === 'sub' ? 2 : 3
}

/**
 * A bar problem of the skill. `withBar` false is the second rung (the same story without the drawing).
 * Deterministic for a given rng.
 */
export function genBarProblem(skill: BarSkillOp, rng: Rng, withBar = true): BarProblemExercise {
  const list = VARIANTS[skill]
  for (let attempt = 0; attempt < 60; attempt++) {
    const v = pick(rng, list)
    const built = v.build(rng)
    if (built) return makeBarProblem(skill, v, built, withBar)
  }
  throw new Error(`bars: no ${skill} problem could be built`)
}

function makeBarProblem(skill: BarSkillOp, v: Variant, built: Built, withBar: boolean): BarProblemExercise {
  const rows = Math.max(...built.bar.map((b) => b.row)) + 1
  const last = built.steps[built.steps.length - 1]
  const nums = built.steps.map((s) => `${s.a}.${s.b}`).join('-')
  return {
    id: `bar-problem:${v.id}:${nums}:${withBar ? 'bar' : 'plain'}`,
    kind: 'bar-problem',
    skill: barSkill(skill),
    difficulty: difficultyOf(skill, built.steps.length),
    text: built.text,
    problem: v.problem,
    withBar,
    bar: built.bar,
    rows,
    steps: built.steps,
    answer: last.result,
    unit: built.unit,
  }
}

const OP_NAME: Record<BarOp, string> = { add: 'sumar', sub: 'restar', mul: 'multiplicar', div: 'dividir' }
const SYMBOL: Record<BarOp, string> = { add: '+', sub: '−', mul: '×', div: '÷' }

/** Strategy for the bar (hint level 1): the same for every problem of the kind, never the number. */
const STRATEGY: Record<BarProblemKind, string> = {
  change: 'Dibuja una barra para lo que tenía y otra para lo que cambia: la barra entera es lo que tiene al final.',
  compare: 'Dibuja las dos barras una debajo de otra, empezando igual: la parte que sobra de la larga es la diferencia.',
  combine: 'Dibuja una barra con sus partes: el total es la barra entera.',
  share: 'Dibuja la barra entera y repártela en partes iguales: ¿cuánto cabe en cada parte?',
  'two-step': 'Hazlo por pasos: primero la barra de la primera parte de la historia, después la de la segunda.',
}

/** Hints for a bar problem: strategy → the drawing → the operation of the first step (the numbers, not the result). */
export function barHints(ex: BarProblemExercise): Hint[] {
  const first = ex.steps[0]
  const l2 = ex.withBar
    ? 'Pon cada número en la parte de la barra que le toca. El ? es lo que tienes que averiguar.'
    : 'Imagina la barra: cada número es una parte, y el ? el total o la parte que falta.'
  const l3 = `Lo que hay que hacer es ${OP_NAME[first.op]}: calcula ${first.a} ${SYMBOL[first.op]} ${first.b} = ?`
  return [
    { level: 1, text: STRATEGY[ex.problem], visual: 'none' },
    { level: 2, text: l2, visual: 'none' },
    { level: 3, text: l3, visual: 'none' },
  ]
}

export const BAR_FEEDBACK = {
  placement: 'Mira la barra: cada número va en la parte que le toca. Revisa los que has colocado.',
  incomplete: 'Te falta colocar algún número en la barra, o escribir una respuesta.',
  step: '¡Casi! El primer paso de la historia no sale. Revisa esa cuenta.',
  result: '¡Casi! La idea es buena: revisa la cuenta con calma.',
  correct: '¡Muy bien! La barra te ha ayudado a ver la historia.',
  correctNoBar: '¡Muy bien! Has leído la historia y has elegido la operación.',
}

/** Operation names for the feedback, shared with the word problems (juntar, quitar…). */
export const BAR_OPERATION_FEEDBACK: Record<BarOp, string> = {
  add: '¡Casi! Lee otra vez: aquí se juntan cosas. ¿Qué operación junta?',
  sub: '¡Casi! Lee otra vez: aquí se quitan o se comparan cosas. ¿Qué operación quita?',
  mul: '¡Casi! Lee otra vez: hay grupos iguales que se repiten. ¿Qué operación es?',
  div: '¡Casi! Lee otra vez: hay que repartir en partes iguales. ¿Qué operación reparte?',
}

const shapeWrong = (expected: string): CheckResult => ({ correct: false, given: '', expected, errorType: 'other', feedback: '¿Me lo escribes otra vez?' })

/** Grades a bar problem: placement (when drawn), the operation of each step, then each result. */
export function checkBar(ex: BarProblemExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'bar') return shapeWrong(expected)
  const given = answer.results.map((r) => (r === null ? '?' : String(r))).join(' · ')
  const lastStep = ex.steps.length - 1

  if (ex.withBar) {
    const given2 = ex.bar.map((_, i) => i).filter((i) => ex.bar[i].value !== null)
    const unknownUsed = ex.bar.map((_, i) => i).filter((i) => ex.bar[i].value === null && answer.placed[i] !== null && answer.placed[i] !== undefined)
    if (given2.some((i) => answer.placed[i] === null || answer.placed[i] === undefined)) {
      return { correct: false, given, expected, errorType: 'incomplete', feedback: BAR_FEEDBACK.incomplete }
    }
    const wrong = given2.filter((i) => answer.placed[i] !== ex.bar[i].value)
    if (wrong.length || unknownUsed.length) {
      return { correct: false, given, expected, errorType: 'bar-placement', wrongColumns: [...wrong, ...unknownUsed].sort((a, b) => a - b), feedback: BAR_FEEDBACK.placement }
    }
  }

  const opsMissing = ex.steps.some((_, k) => !answer.ops[k])
  if (opsMissing) return { correct: false, given, expected, errorType: 'incomplete', feedback: BAR_FEEDBACK.incomplete }
  const opWrong = ex.steps.findIndex((s, k) => answer.ops[k] !== s.op)
  if (opWrong >= 0) {
    return { correct: false, given, expected, errorType: 'operation', feedback: BAR_OPERATION_FEEDBACK[ex.steps[opWrong].op] }
  }

  const resultsMissing = ex.steps.some((_, k) => answer.results[k] === null || answer.results[k] === undefined)
  if (resultsMissing) return { correct: false, given, expected, errorType: 'incomplete', feedback: BAR_FEEDBACK.incomplete }
  for (let k = 0; k < ex.steps.length; k++) {
    if (answer.results[k] !== ex.steps[k].result) {
      if (k < lastStep) return { correct: false, given, expected, errorType: 'step', wrongColumns: [k], feedback: BAR_FEEDBACK.step }
      return { correct: false, given, expected, errorType: 'fact', feedback: BAR_FEEDBACK.result }
    }
  }
  return { correct: true, given, expected, feedback: ex.withBar ? BAR_FEEDBACK.correct : BAR_FEEDBACK.correctNoBar }
}

/** The chips to place: the given numbers, in a stable shuffled order (the same for the same exercise). */
export function barChips(ex: BarProblemExercise, seed: number): { slot: number; value: number }[] {
  const chips = ex.bar.flatMap((b, slot) => (b.value === null ? [] : [{ slot, value: b.value }]))
  let s = seed >>> 0
  const rng: Rng = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return shuffle(rng, chips)
}
