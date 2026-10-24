/* Gráficos y probabilidad (sentido estocástico, docs/curriculum/MATEMATICAS_PRIMARIA.md): read a pictogram or a bar
   chart (how many, how many more, how many in all, which has the most or the fewest), read a double-entry table, count
   how many times a value comes out in a list (the frequency) and find the moda, and say whether drawing something from a
   bag is seguro, posible o imposible, or which colour is the most (or the least) likely. Pure: generators, checks, hints,
   statements. Hints guide the reading and never give the answer. */
import type { Answer, ChanceExercise, ChartCategory, ChartExercise, CheckResult, Exercise, Hint, Rng } from '@/types'
import { pick, randInt, shuffle } from './rng'

/** chart:pict (an icon is one), chart:pict:x (an icon is 2, 5 or 10), chart:bars, chart:table, chart:freq, chart:mode. */
export type ChartSkill = 'pict' | 'pict:x' | 'bars' | 'table' | 'freq' | 'mode'
export const CHART_SKILLS: ChartSkill[] = ['pict', 'pict:x', 'bars', 'table', 'freq', 'mode']

interface Theme { title: string; unit: string; items: { label: string; emoji: string }[] }

/** What a class votes or counts. Labels carry their article: «la fresa», «el fútbol». */
const THEMES: Theme[] = [
  { title: 'La fruta favorita de la clase', unit: 'votos', items: [
    { label: 'la manzana', emoji: '🍎' }, { label: 'el plátano', emoji: '🍌' }, { label: 'la fresa', emoji: '🍓' },
    { label: 'la naranja', emoji: '🍊' }, { label: 'la uva', emoji: '🍇' },
  ] },
  { title: 'El deporte favorito', unit: 'votos', items: [
    { label: 'el fútbol', emoji: '⚽' }, { label: 'el baloncesto', emoji: '🏀' }, { label: 'el tenis', emoji: '🎾' },
    { label: 'la natación', emoji: '🏊' },
  ] },
  { title: 'Los animales que vimos en la granja', unit: 'animales', items: [
    { label: 'las vacas', emoji: '🐄' }, { label: 'las gallinas', emoji: '🐔' }, { label: 'los cerdos', emoji: '🐖' },
    { label: 'las ovejas', emoji: '🐑' },
  ] },
  { title: 'Los libros que leímos este mes', unit: 'libros', items: [
    { label: 'los cuentos', emoji: '📕' }, { label: 'los cómics', emoji: '📗' }, { label: 'los de animales', emoji: '📘' },
    { label: 'los de misterio', emoji: '📙' },
  ] },
  { title: 'El tiempo que hizo en el mes', unit: 'días', items: [
    { label: 'el sol', emoji: '☀️' }, { label: 'las nubes', emoji: '☁️' }, { label: 'la lluvia', emoji: '🌧️' },
  ] },
]

/** The themes a class votes on: a table of groups by option needs options a group can prefer. */
const TABLE_THEMES = THEMES.filter((t) => t.unit === 'votos')

const MODE_THEMES = [
  { title: 'Las notas de un examen', unit: 'nota', lo: 4, hi: 10 },
  { title: 'Los números de zapato de un grupo', unit: 'número', lo: 28, hi: 35 },
  { title: 'Los años de los niños del equipo', unit: 'años', lo: 7, hi: 11 },
  { title: 'Los goles de cada partido', unit: 'goles', lo: 0, hi: 6 },
]

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
/** «la fresa» → «Fresa» for an option button. */
export const bare = (label: string): string => cap(label.replace(/^(el|la|los|las) /, ''))

/** n distinct values in [lo, hi] (multiples of `step`); with a unique largest and a unique smallest when n >= 2. */
function distinctValues(rng: Rng, n: number, lo: number, hi: number, step: number): number[] {
  const pool = []
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) pool.push(v)
  return shuffle(rng, pool).slice(0, n)
}

function chartId(mode: string, ask: string, cats: ChartCategory[], per: number): string {
  return `chart:${mode}:${ask}:${per}:${cats.map((c) => `${c.emoji}${c.value}`).join('.')}`
}

/** A pictogram or a bar chart and its question. */
export function makeChart(
  skill: string, mode: 'pictogram' | 'bars', title: string, unit: string, categories: ChartCategory[], per: number,
  ask: ChartExercise['ask'], pair: [number, number] | null,
): ChartExercise {
  const [i, j] = pair ?? [0, 1]
  const a = categories[i]
  const b = categories[j]
  let question = ''
  let options: string[] = []
  let answer = 0
  switch (ask) {
    case 'count':
      question = `¿Cuántos ${unit} tiene ${a.label}?`
      answer = a.value
      break
    case 'difference':
      question = `¿Cuántos ${unit} más tiene ${a.label} que ${b.label}?`
      answer = a.value - b.value
      break
    case 'total':
      question = `¿Cuántos ${unit} hay en total?`
      answer = categories.reduce((s, c) => s + c.value, 0)
      break
    case 'most':
    case 'least': {
      question = ask === 'most' ? `¿Qué tiene más ${unit}?` : `¿Qué tiene menos ${unit}?`
      options = categories.map((c) => bare(c.label))
      const values = categories.map((c) => c.value)
      const target = ask === 'most' ? Math.max(...values) : Math.min(...values)
      answer = values.indexOf(target)
      break
    }
    case 'mode':
      throw new Error('data.makeChart: the moda is asked with makeModeList')
  }
  return {
    id: chartId(mode, ask, categories, per) + (pair ? `:${i}-${j}` : ''),
    kind: 'chart', skill, difficulty: ask === 'count' || ask === 'most' || ask === 'least' ? 1 : 2, mode, title,
    categories: categories.map((c) => ({ ...c })), per, data: [], ask, question, options, answer,
  }
}

/** A list of values and «¿cuál es la moda?»: one value repeats more than every other one. */
export function makeModeList(title: string, data: number[]): ChartExercise {
  const counts = new Map<number, number>()
  for (const v of data) counts.set(v, (counts.get(v) ?? 0) + 1)
  const best = [...counts.entries()].sort((x, y) => y[1] - x[1])[0][0]
  return {
    id: `chart:data:mode:${data.join('.')}`, kind: 'chart', skill: 'chart:mode', difficulty: 3, mode: 'data', title,
    categories: [], per: 1, data: [...data], ask: 'mode',
    question: '¿Cuál es la moda? Es el dato que más se repite.', options: [], answer: best,
  }
}

/** A double-entry table: 2 or 3 groups (rows) by 3 or 4 options (columns), each cell a count from 1 to 9. */
export function makeTable(title: string, rows: string[], cols: { label: string; emoji: string }[], cells: number[][], at: [number, number]): ChartExercise {
  const [r, c] = at
  return {
    id: `chart:table:${title}:${cells.map((row) => row.join('.')).join('|')}:${r}${c}`, kind: 'chart', skill: 'chart:table',
    difficulty: 2, mode: 'table', title, categories: [], per: 1, data: [],
    table: { rows: [...rows], cols: cols.map((x) => ({ ...x })), cells: cells.map((row) => [...row]), at: [r, c] },
    ask: 'cell', question: `¿Cuántos niños de ${rows[r]} prefieren ${cols[c].label}?`, options: [], answer: cells[r][c],
  }
}

export function buildTable(rng: Rng): ChartExercise {
  const theme = pick(rng, TABLE_THEMES)
  const rows = ['3.º A', '3.º B', '3.º C'].slice(0, rng() < 0.5 ? 2 : 3)
  const cols = shuffle(rng, theme.items).slice(0, rng() < 0.5 ? 3 : 4)
  const cells = rows.map(() => cols.map(() => randInt(rng, 1, 9)))
  return makeTable(theme.title, rows, cols, cells, [randInt(rng, 0, rows.length - 1), randInt(rng, 0, cols.length - 1)])
}

/** A list of values and «¿cuántas veces sale el 4?»: the frequency of one value. */
export function makeFreq(title: string, data: number[], target: number): ChartExercise {
  return {
    id: `chart:data:freq:${data.join('.')}:${target}`, kind: 'chart', skill: 'chart:freq', difficulty: 2, mode: 'tally', title,
    categories: [], per: 1, data: [...data], ask: 'freq', question: `¿Cuántas veces sale el ${target}?`, options: [],
    answer: data.filter((v) => v === target).length,
  }
}

/** Twelve throws of a die; the value asked about comes out at least twice, so the child has something to count. */
export function buildFreq(rng: Rng): ChartExercise {
  const data = Array.from({ length: 12 }, () => randInt(rng, 1, 6))
  const repeated = [1, 2, 3, 4, 5, 6].filter((v) => data.filter((x) => x === v).length >= 2)
  const target = repeated.length ? pick(rng, repeated) : data[0]
  return makeFreq('Tiradas de un dado', shuffle(rng, data), target)
}

export function buildChart(variant: ChartSkill, rng: Rng): ChartExercise {
  if (variant === 'table') return buildTable(rng)
  if (variant === 'freq') return buildFreq(rng)
  if (variant === 'mode') {
    const t = pick(rng, MODE_THEMES)
    const best = randInt(rng, t.lo, t.hi)
    const others = shuffle(rng, Array.from({ length: t.hi - t.lo + 1 }, (_, k) => t.lo + k).filter((v) => v !== best))
    // The moda appears 3 times; two other values twice at most, the rest once.
    const data = [best, best, best, others[0], others[0], others[1], others[2], ...(rng() < 0.5 ? [others[3]] : [])]
    return makeModeList(t.title, shuffle(rng, data))
  }
  const theme = pick(rng, THEMES)
  const n = Math.min(theme.items.length, rng() < 0.5 ? 3 : 4)
  const items = shuffle(rng, theme.items).slice(0, n)
  const skill = `chart:${variant}`
  const per = variant === 'pict:x' ? pick(rng, [2, 5, 10]) : 1
  const max = variant === 'bars' ? 10 : 8
  const values = distinctValues(rng, n, 1 * per, max * per, per)
  const categories = items.map((it, k) => ({ ...it, value: values[k] }))
  const mode = variant === 'bars' ? 'bars' : 'pictogram'
  const asks: ChartExercise['ask'][] = variant === 'pict' ? ['count', 'count', 'most', 'least'] : ['count', 'difference', 'total', 'most']
  const ask = pick(rng, asks)
  let pair: [number, number] | null = null
  if (ask === 'count') pair = [randInt(rng, 0, n - 1), 0]
  if (ask === 'difference') {
    const [x, y] = shuffle(rng, Array.from({ length: n }, (_, k) => k)).slice(0, 2)
    pair = categories[x].value > categories[y].value ? [x, y] : [y, x]
  }
  return makeChart(skill, mode, theme.title, theme.unit, categories, per, ask, pair)
}

// ---------------------------------------------------------------- probabilidad

const BALLS = [
  { label: 'roja', emoji: '🔴' }, { label: 'azul', emoji: '🔵' }, { label: 'verde', emoji: '🟢' }, { label: 'amarilla', emoji: '🟡' },
]
export const CHANCE_OPTIONS = ['Seguro', 'Posible', 'Imposible']
const LIKELY_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8]

export function makeChance(bag: ChanceExercise['bag'], ask: { label: string }): ChanceExercise {
  const inBag = bag.find((b) => b.label === ask.label && b.count > 0)
  const total = bag.reduce((s, b) => s + b.count, 0)
  const answer = !inBag ? 2 : inBag.count === total ? 0 : 1
  return {
    id: `chance:${bag.map((b) => `${b.emoji}${b.count}`).join('.')}:${ask.label}`, kind: 'chance', skill: 'prob:chance',
    difficulty: 2, bag: bag.map((b) => ({ ...b })),
    question: `Sacas una bola sin mirar. ¿Es seguro, posible o imposible que sea ${ask.label}?`,
    options: [...CHANCE_OPTIONS], answer,
  }
}

/** prob:likely: a bag with distinct amounts of each colour; «¿Qué es más probable sacar?» (or menos), the colours as options. */
export function makeLikely(bag: ChanceExercise['bag'], ask: 'more' | 'less'): ChanceExercise {
  const counts = bag.map((b) => b.count)
  const target = ask === 'more' ? Math.max(...counts) : Math.min(...counts)
  return {
    id: `likely:${ask}:${bag.map((b) => `${b.emoji}${b.count}`).join('.')}`, kind: 'chance', skill: 'prob:likely', difficulty: 2,
    bag: bag.map((b) => ({ ...b })), ask,
    question: ask === 'more' ? '¿Qué es más probable sacar?' : '¿Qué es menos probable sacar?',
    options: bag.map((b) => cap(b.label)), answer: counts.indexOf(target),
  }
}

export function buildLikely(rng: Rng): ChanceExercise {
  const colours = shuffle(rng, BALLS).slice(0, randInt(rng, 2, 4))
  const counts = shuffle(rng, LIKELY_COUNTS).slice(0, colours.length)
  return makeLikely(colours.map((c, k) => ({ ...c, count: counts[k] })), rng() < 0.3 ? 'less' : 'more')
}

export function buildChance(rng: Rng): ChanceExercise {
  const kind = pick(rng, ['seguro', 'posible', 'posible', 'imposible'] as const)
  const colours = shuffle(rng, BALLS)
  if (kind === 'seguro') return makeChance([{ ...colours[0], count: randInt(rng, 3, 7) }], colours[0])
  const n = randInt(rng, 2, 3)
  const bag = colours.slice(0, n).map((c) => ({ ...c, count: randInt(rng, 1, 5) }))
  return makeChance(bag, kind === 'posible' ? pick(rng, bag) : colours[n])
}

// ---------------------------------------------------------------- checks

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function judgeChoice(options: string[], expected: number, answer: Answer, wrongFeedback: string): CheckResult {
  const exp = options[expected]
  if (answer.type !== 'choice') return { correct: false, given: '', expected: exp, errorType: 'other', feedback: 'Elige una de las respuestas.' }
  if (answer.index === null || answer.index === undefined) return { correct: false, given: '?', expected: exp, errorType: 'incomplete', feedback: 'Elige una respuesta.' }
  const given = options[answer.index] ?? '?'
  if (answer.index === expected) return { correct: true, given, expected: exp, feedback: '¡Muy bien! Lo has leído bien.' }
  return { correct: false, given, expected: exp, errorType: 'other', feedback: wrongFeedback }
}

export function checkChart(ex: ChartExercise, answer: Answer): CheckResult {
  if (ex.ask === 'most' || ex.ask === 'least') {
    return judgeChoice(ex.options, ex.answer, answer, ex.ask === 'most'
      ? '¡Casi! Busca la fila o la barra más larga.'
      : '¡Casi! Busca la fila o la barra más corta.')
  }
  const expected = String(ex.answer)
  const v = answer.type === 'number' ? answer.value : answer.type === 'numbers' && answer.values.length === 1 ? answer.values[0] : undefined
  if (v === undefined) return { correct: false, given: '', expected, errorType: 'other', feedback: 'Escribe un número.' }
  if (!isNum(v)) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Escribe el número.' }
  if (v === ex.answer) return { correct: true, given: String(v), expected, feedback: '¡Muy bien! Has leído bien el gráfico.' }
  let feedback = '¡Casi! Vuelve a contar con el dedo.'
  if (ex.ask === 'mode') feedback = '¡Casi! Cuenta cuántas veces sale cada número: la moda es el que más veces aparece.'
  else if (ex.ask === 'freq') feedback = '¡Casi! Cuenta solo las veces que sale ese número, una a una.'
  else if (ex.ask === 'cell') feedback = '¡Casi! Busca la fila del grupo y la columna de la opción: el número donde se cruzan.'
  else if (ex.mode === 'pictogram' && ex.per > 1) feedback = `¡Casi! Recuerda que cada dibujo vale ${ex.per}.`
  else if (ex.ask === 'difference') feedback = '¡Casi! Busca cuánto le falta a la más corta para llegar a la más larga.'
  else if (ex.ask === 'total') feedback = '¡Casi! Suma lo que tiene cada una, sin dejarte ninguna.'
  return { correct: false, given: String(v), expected, errorType: 'other', feedback }
}

export function checkChance(ex: ChanceExercise, answer: Answer): CheckResult {
  if (ex.ask) return judgeChoice(ex.options, ex.answer, answer, `¡Casi! Cuenta cuántas bolas hay de cada color: gana el que tiene ${ex.ask === 'more' ? 'más' : 'menos'}.`)
  return judgeChoice(ex.options, ex.answer, answer, '¡Casi! Mira qué bolas hay en la bolsa: ¿hay alguna de ese color? ¿Son todas de ese color?')
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

const ROW_WORDS = ['primera', 'segunda', 'tercera']
const COL_WORDS = ['primera', 'segunda', 'tercera', 'cuarta']

/** The example cell is another one (its row and its column both differ), named by position, never by its value. */
function hintsTable(ex: ChartExercise): Hint[] {
  const t = ex.table!
  const [r, c] = t.at
  const r2 = (r + 1) % t.rows.length
  const c2 = (c + 1) % t.cols.length
  return [
    hint(1, 'Busca la fila del grupo que te preguntan y la columna de la opción que te preguntan.'),
    hint(2, 'Sigue con el dedo la columna hasta llegar a la fila: el número donde se cruzan es el que buscas.'),
    hint(3, `Ejemplo con otro cuadro: para la ${ROW_WORDS[r2]} fila y la ${COL_WORDS[c2]} columna, bajas por esa columna hasta esa fila y lees el número del cruce.`),
  ]
}

function hintsFreq(): Hint[] {
  return [
    hint(1, 'Busca en la lista solo los números que son el de la pregunta.'),
    hint(2, 'Recorre la lista de izquierda a derecha y pon una raya cada vez que aparece ese número.'),
    hint(3, 'Ejemplo con otra lista: en «rojo, verde, rojo, rojo», pones una raya en cada rojo y después cuentas las rayas. Haz lo mismo aquí.'),
  ]
}

export function hintsChart(ex: ChartExercise): Hint[] {
  if (ex.mode === 'table') return hintsTable(ex)
  if (ex.ask === 'freq') return hintsFreq()
  if (ex.ask === 'mode') return [
    hint(1, 'La moda es el dato que más se repite.'),
    hint(2, 'Ordena los números de menor a mayor: los iguales quedan juntos.'),
    hint(3, 'Cuenta cuántas veces sale cada número y quédate con el que más veces aparece.'),
  ]
  const read = ex.mode === 'bars'
    ? 'Sigue con el dedo la parte de arriba de la barra hasta los números de la izquierda.'
    : ex.per > 1 ? `Cada dibujo vale ${ex.per}: cuenta de ${ex.per} en ${ex.per}.` : 'Cada dibujo es uno: cuéntalos uno a uno.'
  switch (ex.ask) {
    case 'count': return [hint(1, 'Busca la fila o la barra de la que te preguntan.'), hint(2, read), hint(3, 'Escribe lo que has contado en esa fila o barra.')]
    case 'difference': return [hint(1, 'Lee primero cuánto tiene cada una de las dos.'), hint(2, read), hint(3, 'Resta: la que tiene más menos la que tiene menos.')]
    case 'total': return [hint(1, 'Lee cuánto tiene cada fila o barra.'), hint(2, read), hint(3, 'Suma todas las cantidades, una detrás de otra.')]
    case 'most': return [hint(1, 'Compara el largo de las filas o de las barras.'), hint(2, 'La que llega más lejos es la que tiene más.'), hint(3, read)]
    case 'least': return [hint(1, 'Compara el largo de las filas o de las barras.'), hint(2, 'La más corta es la que tiene menos.'), hint(3, read)]
  }
  return []
}

/** The hints name no colour: an option is never given away, not even one step ahead. */
function hintsLikely(ask: 'more' | 'less'): Hint[] {
  return [
    hint(1, 'Mira cuántas bolas hay de cada color.'),
    ask === 'more'
      ? hint(2, 'Gana el color del que hay más bolas: cuantas más bolas hay de un color, más fácil es sacarlo.')
      : hint(2, 'Gana el color del que hay menos bolas: cuantas menos bolas hay de un color, más difícil es sacarlo.'),
    ask === 'more'
      ? hint(3, 'Ejemplo: si un color tiene pocas bolas y otro tiene muchas, es más probable sacar el de muchas.')
      : hint(3, 'Ejemplo: si un color tiene pocas bolas y otro tiene muchas, es menos probable sacar el de pocas.'),
  ]
}

export function hintsChance(ex: ChanceExercise): Hint[] {
  if (ex.ask) return hintsLikely(ex.ask)
  return [
    hint(1, 'Mira todas las bolas de la bolsa.'),
    hint(2, 'Si todas son de ese color, es seguro. Si no hay ninguna, es imposible.'),
    hint(3, 'Si hay algunas de ese color y también de otros, puede salir o no: es posible.'),
  ]
}

/** Statement for the worked example and the adult reports: names the question, never the answer. */
export function dataStatement(ex: Exercise): string | null {
  if (ex.kind === 'chart') return ex.mode === 'data' || ex.mode === 'tally' ? `${ex.title}: ${ex.data.join(', ')}. ${ex.question}` : `${ex.title}. ${ex.question}`
  if (ex.kind === 'chance') return ex.question
  return null
}
