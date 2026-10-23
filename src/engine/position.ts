/* Posición y recorridos (sentido espacial, docs/curriculum/MATEMATICAS_PRIMARIA.md): on a grid of pictures, where one
   thing is from another (a la izquierda, a la derecha, encima, debajo), what is right beside a thing, and where a walk
   with arrows ends (itinerarios). Left and right are the child's own, as the grid is seen. Pure: generators, checks,
   hints and statements. */
import type { Answer, CheckResult, Exercise, Hint, PositionCell, PositionExercise, Rng } from '@/types'
import { pick, randInt, shuffle } from './rng'

export type PositionSkill = 'relative' | 'next' | 'route'
export const POSITION_SKILLS: PositionSkill[] = ['relative', 'next', 'route']
type Dir = PositionExercise['moves'][number]['dir']

const THINGS = [
  { emoji: '🐱', name: 'el gato' }, { emoji: '🐶', name: 'el perro' }, { emoji: '⚽', name: 'la pelota' },
  { emoji: '🌳', name: 'el árbol' }, { emoji: '🏠', name: 'la casa' }, { emoji: '🌸', name: 'la flor' },
  { emoji: '🚗', name: 'el coche' }, { emoji: '⭐', name: 'la estrella' }, { emoji: '🐟', name: 'el pez' },
  { emoji: '🍎', name: 'la manzana' }, { emoji: '🎈', name: 'el globo' }, { emoji: '🐢', name: 'la tortuga' },
]

/** The four places of «relative», in the order of the options. */
export const SIDES = ['A su izquierda', 'A su derecha', 'Encima', 'Debajo']
const DELTA: Record<Dir, [number, number]> = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }
const DIR_WORD: Record<Dir, string> = { left: 'a la izquierda', right: 'a la derecha', up: 'hacia arriba', down: 'hacia abajo' }
const OPPOSITE: Record<Dir, Dir> = { left: 'right', right: 'left', up: 'down', down: 'up' }
export const ARROW: Record<Dir, string> = { left: '←', right: '→', up: '↑', down: '↓' }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const bare = (name: string) => cap(name.replace(/^(el|la) /, ''))
const at = (cells: PositionCell[], r: number, c: number) => cells.findIndex((x) => x.row === r && x.col === c)

/** A grid with `n` things on distinct cells. */
function scatter(rng: Rng, rows: number, cols: number, n: number): PositionCell[] {
  const spots = shuffle(rng, Array.from({ length: rows * cols }, (_, k) => k)).slice(0, n)
  return shuffle(rng, THINGS).slice(0, n).map((t, k) => ({ row: Math.floor(spots[k] / cols), col: spots[k] % cols, ...t }))
}

function base(mode: PositionExercise['mode'], rows: number, cols: number, cells: PositionCell[]) {
  return { kind: 'position' as const, skill: `pos:${mode}`, mode, rows, cols, cells: cells.map((c) => ({ ...c })) }
}

/** Where `a` is, seen from `b` (same row or same column). */
export function makeRelative(rows: number, cols: number, cells: PositionCell[], a: number, b: number): PositionExercise {
  const A = cells[a]
  const B = cells[b]
  const side = A.row === B.row ? (A.col < B.col ? 0 : 1) : (A.row < B.row ? 2 : 3)
  return {
    id: `position:relative:${cells.map((c) => `${c.emoji}${c.row}${c.col}`).join('')}:${a}:${b}`, ...base('relative', rows, cols, cells),
    difficulty: side < 2 ? 2 : 1, question: `Mira ${B.name}. ¿Dónde está ${A.name}?`, moves: [], start: null,
    options: [...SIDES], answer: side,
  }
}

/** What is right beside thing `b` on side `dir` (that cell is never empty). */
export function makeNext(rows: number, cols: number, cells: PositionCell[], b: number, dir: Dir, others: number[]): PositionExercise {
  const B = cells[b]
  const [dr, dc] = DELTA[dir]
  const target = at(cells, B.row + dr, B.col + dc)
  const where = dir === 'up' ? 'justo encima de' : dir === 'down' ? 'justo debajo de' : `justo ${DIR_WORD[dir]} de`
  const opts = [...new Set([target, ...others.filter((o) => o !== target && o !== b)])].slice(0, 4)
  const order = [...opts].sort((x, y) => cells[x].name.localeCompare(cells[y].name))
  return {
    id: `position:next:${cells.map((c) => `${c.emoji}${c.row}${c.col}`).join('')}:${b}:${dir}`, ...base('next', rows, cols, cells),
    difficulty: dir === 'left' || dir === 'right' ? 2 : 1, question: `¿Qué hay ${where} ${B.name}?`.replace(' de el ', ' del '),
    moves: [], start: null, options: order.map((i) => bare(cells[i].name)), answer: order.indexOf(target),
  }
}

/** A walk from thing `start` with `moves`; it ends on a thing. */
export function makeRoute(rows: number, cols: number, cells: PositionCell[], start: number, moves: PositionExercise['moves'], others: number[]): PositionExercise {
  let r = cells[start].row
  let c = cells[start].col
  for (const m of moves) { r += DELTA[m.dir][0] * m.n; c += DELTA[m.dir][1] * m.n }
  const target = at(cells, r, c)
  const opts = [...new Set([target, ...others.filter((o) => o !== target && o !== start)])].slice(0, 4)
  const order = [...opts].sort((x, y) => cells[x].name.localeCompare(cells[y].name))
  const words = moves.map((m) => `${m.n} ${m.n === 1 ? 'casilla' : 'casillas'} ${DIR_WORD[m.dir]}`).join(' y luego ')
  return {
    id: `position:route:${cells.map((x) => `${x.emoji}${x.row}${x.col}`).join('')}:${start}:${moves.map((m) => `${m.dir}${m.n}`).join('.')}`,
    ...base('route', rows, cols, cells), difficulty: moves.length > 2 ? 3 : 2,
    question: `Empieza en ${cells[start].name} y camina ${words}. ¿A qué llegas?`,
    moves: moves.map((m) => ({ ...m })), start, options: order.map((i) => bare(cells[i].name)), answer: order.indexOf(target),
  }
}

export function buildPosition(variant: PositionSkill, rng: Rng): PositionExercise {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (variant === 'relative') {
      const rows = 3
      const cols = 4
      const cells = scatter(rng, rows, cols, 6)
      const pairs: [number, number][] = []
      cells.forEach((A, a) => cells.forEach((B, b) => { if (a !== b && (A.row === B.row || A.col === B.col)) pairs.push([a, b]) }))
      if (!pairs.length) continue
      const [a, b] = pick(rng, pairs)
      return makeRelative(rows, cols, cells, a, b)
    }
    if (variant === 'next') {
      const rows = 3
      const cols = 4
      const cells = scatter(rng, rows, cols, 7)
      const options: [number, Dir][] = []
      cells.forEach((B, b) => (Object.keys(DELTA) as Dir[]).forEach((d) => {
        const t = at(cells, B.row + DELTA[d][0], B.col + DELTA[d][1])
        if (t >= 0) options.push([b, d])
      }))
      if (!options.length) continue
      const [b, dir] = pick(rng, options)
      // The thing on the other side, when there is one, is among the options: the left–right slip is visible.
      const mirror = at(cells, cells[b].row + DELTA[OPPOSITE[dir]][0], cells[b].col + DELTA[OPPOSITE[dir]][1])
      const rest = shuffle(rng, cells.map((_, k) => k))
      return makeNext(rows, cols, cells, b, dir, mirror >= 0 ? [mirror, ...rest] : rest)
    }
    const rows = 4
    const cols = 5
    const cells = scatter(rng, rows, cols, 7)
    const start = randInt(rng, 0, cells.length - 1)
    const count = rng() < 0.5 ? 2 : 3
    const moves: PositionExercise['moves'] = []
    let r = cells[start].row
    let c = cells[start].col
    let ok = true
    let last: Dir | null = null
    for (let k = 0; k < count; k++) {
      const dirs = (Object.keys(DELTA) as Dir[]).filter((d) => d !== last && (last === null || d !== OPPOSITE[last]))
      const dir = pick(rng, dirs)
      const n = randInt(rng, 1, 3)
      r += DELTA[dir][0] * n
      c += DELTA[dir][1] * n
      if (r < 0 || c < 0 || r >= rows || c >= cols) { ok = false; break }
      moves.push({ dir, n })
      last = dir
    }
    if (!ok) continue
    const target = at(cells, r, c)
    if (target < 0 || target === start) continue
    return makeRoute(rows, cols, cells, start, moves, shuffle(rng, cells.map((_, k) => k)))
  }
  throw new Error(`position: no ${variant} exercise could be built`)
}

// ---------------------------------------------------------------- checks and hints

export function checkPosition(ex: PositionExercise, answer: Answer): CheckResult {
  const expected = ex.options[ex.answer]
  if (answer.type !== 'choice') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Elige una de las respuestas.' }
  if (answer.index === null || answer.index === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Elige una respuesta.' }
  const given = ex.options[answer.index] ?? '?'
  if (answer.index === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Te has orientado muy bien.' }
  if (ex.mode === 'relative') {
    const swapped = (ex.answer ^ 1) === answer.index
    return {
      correct: false, given, expected, errorType: swapped ? 'left-right' : 'other',
      feedback: swapped
        ? (ex.answer < 2 ? '¡Casi! Has cambiado la izquierda y la derecha. Mira las flechas de debajo de la cuadrícula.' : '¡Casi! Has cambiado encima y debajo: mira cuál está más arriba.')
        : '¡Casi! Mira si están en la misma fila (al lado) o en la misma columna (arriba y abajo).',
    }
  }
  return { correct: false, given, expected, errorType: 'other', feedback: ex.mode === 'route'
    ? '¡Casi! Pon el dedo en la salida y muévelo casilla a casilla, siguiendo las flechas.'
    : '¡Casi! Pon el dedo en la casilla y muévelo solo una casilla hacia ese lado.' }
}

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

export function hintsPosition(ex: PositionExercise): Hint[] {
  if (ex.mode === 'route') return [
    hint(1, 'Pon el dedo en la casilla de salida.'),
    hint(2, 'Haz los pasos uno a uno, en el orden de las flechas, contando las casillas.'),
    hint(3, 'Cuando acabes el último paso, mira qué hay debajo de tu dedo.'),
  ]
  if (ex.mode === 'next') return [
    hint(1, 'Busca primero la cosa de la que te preguntan.'),
    hint(2, 'Debajo de la cuadrícula tienes las flechas: ← izquierda y derecha →.'),
    hint(3, 'Mueve el dedo una sola casilla hacia ese lado y mira qué hay.'),
  ]
  return [
    hint(1, 'Busca las dos cosas en la cuadrícula.'),
    hint(2, 'Si están en la misma fila, una está a la izquierda o a la derecha de la otra; si están en la misma columna, una está encima o debajo.'),
    hint(3, 'Pon el dedo en la segunda cosa y mira hacia qué lado tienes que moverlo para llegar a la primera.'),
  ]
}

export function positionStatement(ex: Exercise): string | null {
  return ex.kind === 'position' ? ex.question : null
}
