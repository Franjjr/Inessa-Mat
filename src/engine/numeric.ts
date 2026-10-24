/* Numbers up to 9 999 (PLAN_DOCENTE §5 and §8, 3.º de Primaria), up to 19 999 (3.º, introduction) and up to 99 999
   (4.º). Pure: generators, makers, checks and hints for place value (blocks → expanded form → words), comparing,
   ordering, rounding and the number line with jumps.
   Hints never contain the answer: level 3 works one step and leaves the final number to the child. */
import type {
  Answer, CheckResult, CompareExercise, Exercise, ExerciseKind, Hint, NumberLineExercise, OrderExercise, PlaceMode,
  PlaceValueExercise, RoundExercise, Rng, SkillKey,
} from '@/types'
import { valueOf } from './diagnose'
import { randInt, shuffle } from './rng'
import { LINE_STEPS, ROUND_TARGETS, compareSkill, lineSkill, orderSkill, parseSkill, placeSkill, roundSkill, type NumberMax, type ParsedSkill } from './skills'

/** Thousands separated by a space, as Spanish children read them: 4325 → '4 325'. */
export const fmt = (n: number): string => String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// ---------------------------------------------------------------- Spanish words

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const TEENS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
const TWENTIES = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function underHundred(n: number): string {
  if (n < 10) return UNITS[n]
  if (n < 20) return TEENS[n - 10]
  if (n < 30) return TWENTIES[n - 20]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? TENS[t] : `${TENS[t]} y ${UNITS[u]}`
}

function underThousand(n: number): string {
  if (n === 100) return 'cien'
  const h = Math.floor(n / 100)
  const r = n % 100
  if (h === 0) return underHundred(r)
  return r === 0 ? HUNDREDS[h] : `${HUNDREDS[h]} ${underHundred(r)}`
}

/** The number written in words, Spanish: 4325 → 'cuatro mil trescientos veinticinco'. Up to 9 999. */
export function numberWords(n: number): string {
  if (n === 0) return 'cero'
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  const parts: string[] = []
  // «mil» is masculine: 21 → «veintiún mil», 31 → «treinta y un mil» (apocope of uno).
  if (thousands > 0) parts.push(thousands === 1 ? 'mil' : `${underThousand(thousands).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')} mil`)
  if (rest > 0) parts.push(underThousand(rest))
  return parts.join(' ')
}

// ---------------------------------------------------------------- place value helpers

const PLACE_NAMES = ['unidades', 'decenas', 'centenas', 'millares', 'decenas de millar'] as const
/** The same places with their article, for sentences: «en las decenas de millar». */
const PLACE_WITH_ARTICLE = ['las unidades', 'las decenas', 'las centenas', 'los millares', 'las decenas de millar'] as const

/** Name of the place of the digit at position `i` (0 = units): 4 → «decenas de millar». */
export function placeName(i: number): string {
  return PLACE_NAMES[i] ?? PLACE_NAMES[PLACE_NAMES.length - 1]
}

/** The place of the leftmost digit of the longest of `values`, with its article: «los millares», «las decenas de millar». */
const topPlaceOf = (values: number[]): string => PLACE_WITH_ARTICLE[Math.max(...values.map((v) => String(v).length)) - 1]

/** The unit that counts each class of place-value blocks, singular and plural (a decena de millar is a pile of cuadros). */
const BLOCK_CLASS: Record<number, [string, string]> = {
  4: ['decena de millar', 'decenas de millar'], 3: ['cuadro de mil', 'cuadros de mil'], 2: ['placa de centena', 'placas de centena'],
  1: ['barra de decena', 'barras de decena'], 0: ['cubito', 'cubitos'],
}

/** The name of the place-value block classes for a hint or a feedback: five digits add the decenas de millar. */
const blockClasses = (five: boolean): string => (five
  ? 'decenas de millar, cuadros de mil, placas de centena, barras de decena y cubitos'
  : 'cuadros de mil, placas de centena, barras de decena y cubitos')

/** Digits of each range: the usual 2, 3 or 4 digits, and 5 for the numbers of 19 999 and 99 999. */
const NUMBER_RANGE: Record<2 | 3 | 4 | 5, [number, number]> = { 2: [10, 99], 3: [100, 999], 4: [1000, 9999], 5: [10000, 99999] }

/** Expanded form with zeros inside, from the most significant digit: 4025 → [4000, 0, 20, 5]. */
export function expandedParts(n: number): number[] {
  const len = String(n).length
  const out: number[] = []
  for (let i = len - 1; i >= 0; i--) out.push(Math.floor(n / 10 ** i) % 10 * 10 ** i)
  return out
}

/** Digit of the place `i` (0 = units). */
const digitAtPlace = (n: number, i: number) => Math.floor(n / 10 ** i) % 10

/** The words of a rounding: «decenas» and the digit to look at, «las unidades». */
export function roundWords(to: 10 | 100 | 1000): { plural: string; one: string; look: string } {
  if (to === 10) return { plural: 'decenas', one: 'decena', look: 'las unidades' }
  if (to === 100) return { plural: 'centenas', one: 'centena', look: 'las decenas' }
  return { plural: 'millares', one: 'unidad de millar', look: 'las centenas' }
}

/** Rounds half up to the nearest decena, centena or millar: 3745 → 3750 (to 10), 3700 (to 100), 4000 (to 1000). */
export function roundTo(value: number, to: 10 | 100 | 1000): number {
  return Math.floor((value + to / 2) / to) * to
}

// ---------------------------------------------------------------- makers

/** `max`: the range of the skill (999 for 2.º; 19 999 and 99 999 for the 5-digit numbers); the exercise is the same. */
export function makePlaceValue(value: number, mode: PlaceMode, max?: NumberMax): PlaceValueExercise {
  const parts = expandedParts(value)
  return {
    id: `place-value:${mode}:${value}`, kind: 'place-value', skill: placeSkill(mode, max),
    difficulty: mode === 'blocks' ? 1 : mode === 'expanded' ? 2 : 3,
    mode, value, parts, answer: mode === 'expanded' ? parts : value,
  }
}

export function makeCompare(left: number, right: number, max?: NumberMax): CompareExercise {
  return {
    id: `compare:${left}:${right}`, kind: 'compare', skill: compareSkill(max), difficulty: 2,
    left, right, answer: left > right ? '>' : left < right ? '<' : '=',
  }
}

export function makeOrder(values: number[], direction: 'asc' | 'desc', max?: NumberMax): OrderExercise {
  const answer = [...values].sort((x, y) => (direction === 'asc' ? x - y : y - x))
  return {
    id: `order:${values.join('.')}:${direction}`, kind: 'order', skill: orderSkill(max), difficulty: values.length > 3 ? 3 : 2,
    values: [...values], direction, answer,
  }
}

export function makeRound(value: number, to: 10 | 100 | 1000, max?: NumberMax): RoundExercise {
  return {
    id: `round:${value}:${to}`, kind: 'round', skill: roundSkill(to, max), difficulty: to === 10 ? 2 : to === 100 ? 3 : 4,
    value, to, answer: roundTo(value, to),
  }
}

/** Tick mode: five labelled marks, the one at `blank` is hidden. */
export function makeLineTick(step: 10 | 100 | 1000 | 10000, ticks: number[], blank: number, max?: 999): NumberLineExercise {
  return {
    id: `number-line:tick:${step}:${ticks[0]}:${blank}`, kind: 'number-line', skill: lineSkill(step, max),
    difficulty: step === 10 ? 2 : 3, mode: 'tick', step, ticks: [...ticks], blank,
    start: null, jump: 0, answer: ticks[blank],
  }
}

/** Jump mode: start from a point on the line and jump +step or −step; the child writes where it lands. */
export function makeLineJump(step: 10 | 100 | 1000 | 10000, ticks: number[], start: number, jump: number, max?: 999): NumberLineExercise {
  return {
    id: `number-line:jump:${step}:${start}:${jump > 0 ? '+' : '-'}`, kind: 'number-line', skill: lineSkill(step, max),
    difficulty: 3, mode: 'jump', step, ticks: [...ticks], blank: -1, start, jump, answer: start + jump,
  }
}

// ---------------------------------------------------------------- skills of the kinds

/** The skill keys practised by one of the numeric kinds (for free play and universe building). */
export function numericSkillsOf(kind: ExerciseKind): SkillKey[] {
  switch (kind) {
    case 'place-value': return (['blocks', 'expanded', 'words'] as PlaceMode[]).map((m) => placeSkill(m))
    case 'compare': return ['num:compare']
    case 'order': return ['num:order']
    case 'round': return ROUND_TARGETS.map((to) => roundSkill(to))
    case 'number-line': return LINE_STEPS.map((s) => lineSkill(s))
    default: return []
  }
}

// ---------------------------------------------------------------- generation

/** Try `make` until it yields an exercise whose id is not used yet (a few tries, then the last one). */
function fresh<T extends Exercise>(make: () => T, used: Set<string>, tries = 12): T {
  let last = make()
  for (let i = 0; i < tries && used.has(last.id); i++) last = make()
  return last
}

export function buildNumericExercise(kind: ExerciseKind, skill: SkillKey, rng: Rng, used: Set<string>, digits?: number): Exercise | null {
  const p: ParsedSkill | null = parseSkill(skill)
  if (!p) return null
  // The range of the key: 999 (2.º, mostly 3 digits, some 2-digit ones); 19 999 or 99 999 (five digits only).
  const max: NumberMax | undefined = 'max' in p ? p.max : undefined
  const small = max === 999
  const top5 = max === 19999 || max === 99999 ? max : undefined
  const wide = top5 !== undefined
  const d = small ? 3 : digits === 2 || digits === 3 || digits === 4 ? digits : 4
  const randomNumber = (dd: 2 | 3 | 4 = d as 2 | 3 | 4) => randInt(rng, NUMBER_RANGE[dd][0], NUMBER_RANGE[dd][1])
  const randomWide = () => randInt(rng, NUMBER_RANGE[5][0], top5 ?? NUMBER_RANGE[5][1])
  // A number of the range: five digits when wide, the usual digits otherwise.
  const draw = () => (wide ? randomWide() : randomNumber())
  switch (kind) {
    case 'place-value': {
      if (p.type !== 'place') return null
      return fresh(() => makePlaceValue(wide ? randomWide() : small && rng() < 0.25 ? randomNumber(2) : randomNumber(), p.mode, max), used)
    }
    case 'compare': {
      if (small) {
        return fresh(() => {
          const a = rng() < 0.2 ? randomNumber(2) : randomNumber()
          const roll = rng()
          let b: number
          if (roll < 0.1) b = a
          else if (roll < 0.45) b = Math.floor(a / 100) * 100 + randInt(rng, 0, 99) // same centenas: the decenas decide
          else if (roll < 0.7) b = Math.floor(a / 10) * 10 + randInt(rng, 0, 9) // same decenas: the unidades decide
          else b = randomNumber()
          b = Math.min(999, Math.max(10, b))
          return rng() < 0.5 ? makeCompare(a, b, max) : makeCompare(b, a, max)
        }, used)
      }
      return fresh(() => {
        const a = draw()
        const roll = rng()
        let b: number
        if (roll < 0.1) b = a
        else if (roll < 0.45) b = Math.floor(a / 1000) * 1000 + randInt(rng, 0, 999) // same millares: the centenas decide
        else if (roll < 0.7) b = Math.floor(a / 100) * 100 + randInt(rng, 0, 99) // same centenas: the decenas decide
        else b = draw()
        b = wide ? Math.min(top5!, Math.max(NUMBER_RANGE[5][0], b)) : Math.min(9999, Math.max(10, b))
        return rng() < 0.5 ? makeCompare(a, b, max) : makeCompare(b, a, max)
      }, used)
    }
    case 'order': {
      if (small) {
        return fresh(() => {
          const n = rng() < 0.5 ? 3 : 4
          const base = randInt(rng, 1, 8) * 100
          const values: number[] = []
          while (values.length < n) {
            const v = rng() < 0.5 ? randomNumber() : base + randInt(rng, 0, 99)
            if (!values.includes(v)) values.push(v)
          }
          return makeOrder(shuffle(rng, values), rng() < 0.5 ? 'asc' : 'desc', max)
        }, used)
      }
      // The base thousands: 1 000..8 000 for the usual numbers, 10 000..98 000 when wide.
      const firstThousand = wide ? 10 : 1
      const lastThousand = wide ? Math.floor(top5! / 1000) - 1 : 8
      return fresh(() => {
        const n = rng() < 0.5 ? 3 : 4
        const base = randInt(rng, firstThousand, lastThousand) * 1000
        const values: number[] = []
        while (values.length < n) {
          const v = rng() < 0.5 ? draw() : base + randInt(rng, 0, 999)
          if (!values.includes(v)) values.push(v)
        }
        return makeOrder(shuffle(rng, values), rng() < 0.5 ? 'asc' : 'desc', max)
      }, used)
    }
    case 'round': {
      if (p.type !== 'round') return null
      return fresh(() => {
        const exact = rng() < 0.2
        let v = wide ? randomWide() : randomNumber(p.to === 1000 || rng() < 0.7 ? 4 : 3)
        if (exact) v = Math.round(v / p.to) * p.to
        // A millar never rounds up to 10 000 (nor to 100 000 when wide): the numbers keep their digits.
        const lo = wide ? 10000 : p.to === 1000 ? 1000 : 10
        const hi = wide ? 99499 : p.to === 1000 ? 9499 : 9999
        v = Math.min(hi, Math.max(lo, v))
        return makeRound(v, p.to, max)
      }, used)
    }
    case 'number-line': {
      if (p.type !== 'line') return null
      const step = p.step
      if (step === 10000) {
        // Always five digits: the marks stay between 10 000 and 99 999.
        if (rng() < 0.5) {
          const lowest = randInt(rng, 1, Math.floor(99999 / step) - 4)
          return fresh(() => makeLineTick(step, [0, 1, 2, 3, 4].map((k) => (lowest + k) * step), randInt(rng, 1, 3)), used)
        }
        return fresh(() => {
          const lo = randInt(rng, 1, Math.floor(99999 / step) - 4) * step
          const start = lo + step + randInt(rng, 1, step - 1)
          const jump = rng() < 0.5 ? step : -step
          return makeLineJump(step, [0, 1, 2, 3, 4].map((k) => lo + k * step), start, jump)
        }, used)
      }
      if (small) {
        // Five marks that stay within 0..999.
        const topK = Math.floor((999 - 4 * step) / step)
        if (rng() < 0.5) {
          return fresh(() => {
            const base = randInt(rng, 0, topK) * step
            return makeLineTick(step, [0, 1, 2, 3, 4].map((k) => base + k * step), randInt(rng, 1, 3), max)
          }, used)
        }
        return fresh(() => {
          const lo = randInt(rng, 0, topK) * step
          const start = lo + step + randInt(rng, 0, step - 1)
          const jump = rng() < 0.5 ? step : -step
          return makeLineJump(step, [0, 1, 2, 3, 4].map((k) => lo + k * step), start, jump, max)
        }, used)
      }
      if (rng() < 0.5) {
        return fresh(() => {
          const maxK = Math.floor(9000 / step) - 5
          const base = randInt(rng, 1, Math.max(1, maxK)) * step
          const ticks = [0, 1, 2, 3, 4].map((k) => base + k * step)
          return makeLineTick(step, ticks, randInt(rng, 1, 3))
        }, used)
      }
      return fresh(() => {
        const start = randInt(rng, step, 9999 - 2 * step)
        const lo = Math.floor(start / step) * step - step
        const ticks = [0, 1, 2, 3, 4].map((k) => lo + k * step)
        const jump = rng() < 0.5 ? step : -step
        return makeLineJump(step, ticks, start, jump)
      }, used)
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------- checks

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function singleNumber(answer: Answer): number | null | undefined {
  if (answer.type === 'number') return isNum(answer.value) ? answer.value : null
  if (answer.type === 'numbers' && answer.values.length === 1) return isNum(answer.values[0]) ? answer.values[0] : null
  if (answer.type === 'digits') {
    const d = answer.digits
    if (d.every((x) => x === null || x === undefined)) return null
    if (d.some((x) => !isNum(x))) return null
    return valueOf(d as number[])
  }
  return undefined
}

const res = (correct: boolean, given: string, expected: string, extra: Partial<CheckResult> = {}): CheckResult =>
  ({ correct, given, expected, ...extra })

const OK = {
  place: ['¡Muy bien! Las cifras están en su sitio.', '¡Muy bien! Has leído bien cada clase.'],
  compare: '¡Muy bien! Lo has comparado casa por casa.',
  order: '¡Muy bien! Ya están en orden.',
  round: '¡Muy bien! Has mirado la cifra de al lado.',
  line: '¡Muy bien! Has dado el salto bien.',
}

/** Check of the numeric kinds. Pure and deterministic. */
export function checkNumeric(ex: Exercise, answer: Answer): CheckResult {
  switch (ex.kind) {
    case 'place-value': return checkPlaceValue(ex, answer)
    case 'compare': return checkCompare(ex, answer)
    case 'order': return checkOrder(ex, answer)
    case 'round': return checkSingle(ex.answer, answer, (v) => (v === ex.answer
      ? { correct: true, given: String(v), expected: String(ex.answer), feedback: OK.round }
      : wrongRound(ex, v)))
    case 'number-line': return checkSingle(ex.answer, answer, (v) => (v === ex.answer
      ? { correct: true, given: String(v), expected: String(ex.answer), feedback: OK.line }
      : wrongLine(ex, v)))
    default: return res(false, '', '', { errorType: 'other', feedback: 'Revisa tu respuesta.' })
  }
}

function checkSingle(expected: number, answer: Answer, judge: (v: number) => CheckResult): CheckResult {
  const v = singleNumber(answer)
  if (v === undefined) return res(false, '', String(expected), { errorType: 'other', feedback: 'Escribe solo el número.' })
  if (v === null) return res(false, '?', String(expected), { errorType: 'incomplete', feedback: 'Escribe el número que falta.' })
  return judge(v)
}

function wrongRound(ex: RoundExercise, v: number): CheckResult {
  const given = String(v)
  const expected = String(ex.answer)
  const other = ex.value - (ex.value % ex.to)
  const w = roundWords(ex.to)
  const feedback = v === other && other !== ex.answer
    ? `¡Casi! Ese es el número cortado, sin redondear. Mira la cifra de ${w.look}: ¿es 5 o más?`
    : `¡Casi! Redondea ${ex.to === 1000 ? 'a los millares más cercanos' : `a las ${w.plural} más cercanas`}: mira la cifra de al lado.`
  return res(false, given, expected, { errorType: 'other', feedback })
}

function wrongLine(ex: NumberLineExercise, v: number): CheckResult {
  const given = String(v)
  const expected = String(ex.answer)
  const word = SIGN_WORD[ex.step]
  const feedback = ex.mode === 'jump'
    ? `¡Casi! Un salto de ${fmt(ex.step)} cambia solo ${word}. El resto de cifras se queda igual.`
    : `¡Casi! Las marcas van de ${fmt(ex.step)} en ${fmt(ex.step)}. Mira la marca de al lado.`
  return res(false, given, expected, { errorType: 'fact', feedback })
}

function checkCompare(ex: CompareExercise, answer: Answer): CheckResult {
  const expected = ex.answer
  if (answer.type !== 'sign') return res(false, '', expected, { errorType: 'other', feedback: 'Toca <, > o =.' })
  if (answer.sign === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Elige un signo: <, > o =.' })
  const given = answer.sign
  if (given === expected) {
    const word = expected === '=' ? 'son iguales' : expected === '>' ? `es mayor que ${fmt(ex.right)}` : `es menor que ${fmt(ex.right)}`
    return res(true, given, expected, { feedback: expected === '=' ? OK.compare : `¡Muy bien! ${fmt(ex.left)} ${word}.` })
  }
  const feedback = given === '=' ? '¡Casi! No son iguales: mira la primera casa donde cambian las cifras.' : '¡Casi! Compara casa por casa, empezando por la de más a la izquierda.'
  return res(false, given, expected, { errorType: 'other', feedback })
}

function checkOrder(ex: OrderExercise, answer: Answer): CheckResult {
  const expected = ex.answer.map(fmt).join(ex.direction === 'asc' ? ' < ' : ' > ')
  if (answer.type !== 'numbers') return res(false, '', expected, { errorType: 'other', feedback: 'Escribe los números en orden.' })
  const values = answer.values
  const given = values.map((v) => (isNum(v) ? fmt(v) : '?')).join(', ')
  if (values.length < ex.answer.length || values.slice(0, ex.answer.length).some((v) => !isNum(v))) {
    return res(false, given, expected, { errorType: 'incomplete', feedback: 'Escribe todos los números.' })
  }
  const wrong = ex.answer.flatMap((v, i) => (values[i] !== v ? [i] : []))
  if (wrong.length === 0) return res(true, given, expected, { feedback: OK.order })
  const top = topPlaceOf(ex.answer)
  const feedback = ex.direction === 'asc'
    ? `¡Casi! Empieza por el más pequeño: mira ${top} y, si empatan, sigue hacia la derecha.`
    : `¡Casi! Empieza por el más grande: mira ${top} y, si empatan, sigue hacia la derecha.`
  return res(false, given, expected, { errorType: 'other', wrongColumns: wrong, feedback })
}

function checkPlaceValue(ex: PlaceValueExercise, answer: Answer): CheckResult {
  if (ex.mode === 'expanded') {
    const expected = ex.parts.map(fmt).join(' + ')
    if (answer.type !== 'numbers') return res(false, '', expected, { errorType: 'other', feedback: 'Escribe cada parte en su casilla.' })
    const values = ex.parts.map((_, i) => (isNum(answer.values[i]) ? (answer.values[i] as number) : null))
    const given = values.map((v) => (v === null ? '?' : fmt(v))).join(' + ')
    if (values.some((v) => v === null)) return res(false, given, expected, { errorType: 'incomplete', feedback: 'Rellena todas las casillas (si una cifra es 0, escribe 0).' })
    const wrong = ex.parts.flatMap((v, i) => (values[i] !== v ? [i] : []))
    if (wrong.length === 0) return res(true, given, expected, { feedback: OK.place[0] })
    const names = wrong.map((i) => placeName(ex.parts.length - 1 - i))
    return res(false, given, expected, {
      errorType: 'other', wrongColumns: wrong,
      feedback: `¡Casi! Revisa ${names.length > 1 ? 'las casillas' : 'la casilla'} de ${names.join(' y ')}: cada cifra vale según el lugar donde está.`,
    })
  }
  const expected = String(ex.value)
  const v = singleNumber(answer)
  if (v === undefined) return res(false, '', expected, { errorType: 'other', feedback: 'Escribe el número con cifras.' })
  if (v === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe el número.' })
  const given = String(v)
  if (v === ex.value) return res(true, given, expected, { feedback: OK.place[1] })
  const sameDigits = [...String(v)].sort().join('') === [...String(ex.value)].sort().join('')
  if (sameDigits) return res(false, given, expected, { errorType: 'misaligned', feedback: '¡Casi! Tienes las mismas cifras: revisa en qué lugar va cada una.' })
  const five = ex.value >= 10000
  const feedback = ex.mode === 'words'
    ? `¡Casi! Lee despacio: primero ${five ? 'las decenas de millar y los miles' : 'los miles'}, luego las centenas, las decenas y las unidades.`
    : `¡Casi! Cuenta cada clase de bloque: ${blockClasses(five)}.`
  return res(false, given, expected, { errorType: 'other', feedback })
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'], params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

/** The place a jump of `step` changes, with its article: «las decenas», «los millares». */
const SIGN_WORD: Record<number, string> = { 10: 'las decenas', 100: 'las centenas', 1000: 'los millares', 10000: 'las decenas de millar' }


/** Progressive hints for the numeric kinds. Level 3 never contains the answer. */
export function hintsNumeric(ex: Exercise): Hint[] | null {
  switch (ex.kind) {
    case 'place-value': {
      const params = { value: ex.value, parts: [...ex.parts], digits: ex.parts.length }
      if (ex.mode === 'blocks') {
        const top = ex.parts.length - 1
        const topDigit = digitAtPlace(ex.value, top)
        const [one, many] = BLOCK_CLASS[top]
        const five = top === 4
        return [
          hint(1, `Cuenta cada clase de bloque por separado: ${blockClasses(five)}.`, 'place-value', params),
          hint(2, five
            ? 'Cada decena de millar son diez cuadros de mil apilados y vale 10 000. Un cuadro de mil vale 1 000, una placa 100, una barra 10 y un cubito 1.'
            : 'Cada cuadro de mil vale 1 000, cada placa 100, cada barra 10 y cada cubito 1.', 'place-value', params),
          hint(3, `Empieza por la clase más grande: hay ${topDigit} ${topDigit === 1 ? one : many}. Ahora mira las demás clases.`, 'place-value', params),
        ]
      }
      if (ex.mode === 'expanded') {
        const top = ex.parts.length - 1
        const digit0 = digitAtPlace(ex.value, top)
        return [
          hint(1, 'Cada cifra vale según el lugar donde está: no es lo mismo un 3 de las decenas que un 3 de las centenas.', 'place-value', params),
          hint(2, `El número tiene ${ex.parts.length} casillas, de la más grande a la más pequeña: ${[...ex.parts].map((_, i) => placeName(top - i)).join(', ')}.`, 'place-value', params),
          hint(3, `Mira la primera cifra, el ${digit0}: ¿cuánto vale en las ${placeName(top)}?`, 'place-value', params),
        ]
      }
      return [
        hint(1, 'Lee de izquierda a derecha: primero los miles (si hay «mil»), luego las centenas, las decenas y las unidades.', 'place-value', params),
        hint(2, 'La palabra «mil» marca los miles: lo que va delante de «mil» dice cuántos miles hay.', 'place-value', params),
        hint(3, ex.value >= 1000 ? 'Escribe primero las cifras de los miles y luego las del resto, sin olvidar los ceros.' : 'Sin la palabra «mil» el número tiene 3 cifras o menos: lee las centenas primero.', 'place-value', params),
      ]
    }
    case 'compare': {
      const width = Math.max(String(ex.left).length, String(ex.right).length)
      const s = String(ex.left).padStart(width, '0')
      const t = String(ex.right).padStart(width, '0')
      const i = [...s].findIndex((c, k) => c !== t[k])
      const where = i < 0 ? 'todas las casas son iguales' : `en ${PLACE_WITH_ARTICLE[width - 1 - i]} cambian las cifras`
      return [
        hint(1, `Mira primero la cifra de más a la izquierda: la de ${PLACE_WITH_ARTICLE[width - 1]}.`, 'place-value', { left: ex.left, right: ex.right }),
        hint(2, 'Escribe los dos números en columnas (millares, centenas, decenas, unidades) y compara casa por casa.', 'place-value', { left: ex.left, right: ex.right }),
        hint(3, i < 0 ? 'Compara casa por casa: ¿hay alguna casa distinta?' : `Empieza por la primera casa donde cambian: ${where}.`, 'place-value', { left: ex.left, right: ex.right }),
      ]
    }
    case 'order': {
      const top = topPlaceOf(ex.values)
      const dir = ex.direction === 'asc' ? 'el que tiene menos va primero' : 'el que tiene más va primero'
      return [
        hint(1, `Compara primero ${top}: ${dir}.`, 'none'),
        hint(2, 'Si empatan en esa cifra, sigue hacia la derecha, casa por casa: centenas, decenas y unidades.', 'place-value', { values: [...ex.values] }),
        hint(3, `Mira ${top} de todos los números. ¿Cuál tiene ${ex.direction === 'asc' ? 'menos' : 'más'}? Ese va primero.`, 'place-value', { values: [...ex.values] }),
      ]
    }
    case 'round': {
      const digit = digitAtPlace(ex.value, Math.log10(ex.to) - 1)
      const w = roundWords(ex.to)
      return [
        hint(1, `Redondear es buscar la ${w.one} más cercana.`, 'none'),
        hint(2, `Mira la cifra de ${w.look}: es un ${digit}. ¿Es 5 o más?`, 'place-value', { value: ex.value, to: ex.to }),
        hint(3, digit >= 5
          ? `Como es 5 o más, la ${w.one} sube una vez. Las cifras de la derecha se quedan en 0.`
          : `Como es menos de 5, la ${w.one} se queda igual. Las cifras de la derecha pasan a 0.`, 'place-value', { value: ex.value, to: ex.to }),
      ]
    }
    case 'number-line': {
      const word = SIGN_WORD[ex.step]
      if (ex.mode === 'jump') {
        const dir = ex.jump > 0 ? 'hacia la derecha' : 'hacia la izquierda'
        const d = digitAtPlace(ex.start ?? 0, Math.log10(ex.step))
        return [
          hint(1, `Empieza en ${fmt(ex.start ?? 0)} y da un salto de ${fmt(ex.step)} ${dir}.`, 'none'),
          hint(2, `Un salto de ${fmt(ex.step)} cambia solo ${word}. ¿Qué cifras se quedan igual?`, 'none'),
          hint(3, ex.jump > 0 && d <= 8
            ? `La cifra de ${word} de ${fmt(ex.start ?? 0)} es ${d}. ¿Cuánto es ${d} + 1?`
            : `Cuenta ${fmt(ex.step)} en ${fmt(ex.step)} desde ${fmt(ex.start ?? 0)} y mira qué cifra cambia.`, 'none'),
        ]
      }
      const neighbour = ex.blank > 0 ? ex.ticks[ex.blank - 1] : ex.ticks[ex.blank + 1]
      const dir = ex.blank > 0 ? 'hacia la derecha' : 'hacia la izquierda'
      return [
        hint(1, `Las marcas van de ${fmt(ex.step)} en ${fmt(ex.step)}. Mira cuánto sube de una a otra.`, 'none'),
        hint(2, `Mira la marca de al lado: ${fmt(neighbour)}. ¿Cuántos ${fmt(ex.step)} hay de una marca a otra?`, 'none'),
        hint(3, `Desde ${fmt(neighbour)} da saltos de ${fmt(ex.step)} ${dir}: ¿cuántos saltos hasta la marca vacía?`, 'none'),
      ]
    }
    default:
      return null
  }
}
