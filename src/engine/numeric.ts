/* Numbers up to 9 999 (PLAN_DOCENTE §5 and §8, 3.º de Primaria). Pure: generators, makers, checks and hints for
   place value (blocks → expanded form → words), comparing, ordering, rounding and the number line with jumps.
   Hints never contain the answer: level 3 works one step and leaves the final number to the child. */
import type {
  Answer, CheckResult, CompareExercise, Exercise, ExerciseKind, Hint, NumberLineExercise, OrderExercise, PlaceMode,
  PlaceValueExercise, RoundExercise, Rng, SkillKey,
} from '@/types'
import { valueOf } from './diagnose'
import { randInt, shuffle } from './rng'
import { LINE_STEPS, ROUND_TARGETS, compareSkill, lineSkill, orderSkill, parseSkill, placeSkill, roundSkill, type ParsedSkill } from './skills'

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
  if (thousands > 0) parts.push(thousands === 1 ? 'mil' : `${UNITS[thousands]} mil`)
  if (rest > 0) parts.push(underThousand(rest))
  return parts.join(' ')
}

// ---------------------------------------------------------------- place value helpers

const PLACE_NAMES = ['unidades', 'decenas', 'centenas', 'millares'] as const

/** Name of the place of the digit at position `i` (0 = units) for a number with `len` digits. */
export function placeName(i: number): string {
  return PLACE_NAMES[i] ?? 'millares'
}

/** Expanded form with zeros inside, from the most significant digit: 4025 → [4000, 0, 20, 5]. */
export function expandedParts(n: number): number[] {
  const len = String(n).length
  const out: number[] = []
  for (let i = len - 1; i >= 0; i--) out.push(Math.floor(n / 10 ** i) % 10 * 10 ** i)
  return out
}

/** Digit of the place `i` (0 = units). */
const digitAtPlace = (n: number, i: number) => Math.floor(n / 10 ** i) % 10

const NUMBER_RANGE: Record<2 | 3 | 4, [number, number]> = { 2: [10, 99], 3: [100, 999], 4: [1000, 9999] }

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

/** `max` 999: the 2.º skill (numbers up to 999); the exercise is the same. */
export function makePlaceValue(value: number, mode: PlaceMode, max?: 999): PlaceValueExercise {
  const parts = expandedParts(value)
  return {
    id: `place-value:${mode}:${value}`, kind: 'place-value', skill: placeSkill(mode, max),
    difficulty: mode === 'blocks' ? 1 : mode === 'expanded' ? 2 : 3,
    mode, value, parts, answer: mode === 'expanded' ? parts : value,
  }
}

export function makeCompare(left: number, right: number, max?: 999): CompareExercise {
  return {
    id: `compare:${left}:${right}`, kind: 'compare', skill: compareSkill(max), difficulty: 2,
    left, right, answer: left > right ? '>' : left < right ? '<' : '=',
  }
}

export function makeOrder(values: number[], direction: 'asc' | 'desc', max?: 999): OrderExercise {
  const answer = [...values].sort((x, y) => (direction === 'asc' ? x - y : y - x))
  return {
    id: `order:${values.join('.')}:${direction}`, kind: 'order', skill: orderSkill(max), difficulty: values.length > 3 ? 3 : 2,
    values: [...values], direction, answer,
  }
}

export function makeRound(value: number, to: 10 | 100 | 1000): RoundExercise {
  return {
    id: `round:${value}:${to}`, kind: 'round', skill: roundSkill(to), difficulty: to === 10 ? 2 : to === 100 ? 3 : 4,
    value, to, answer: roundTo(value, to),
  }
}

/** Tick mode: five labelled marks, the one at `blank` is hidden. */
export function makeLineTick(step: 10 | 100 | 1000, ticks: number[], blank: number, max?: 999): NumberLineExercise {
  return {
    id: `number-line:tick:${step}:${ticks[0]}:${blank}`, kind: 'number-line', skill: lineSkill(step, max),
    difficulty: step === 10 ? 2 : 3, mode: 'tick', step, ticks: [...ticks], blank,
    start: null, jump: 0, answer: ticks[blank],
  }
}

/** Jump mode: start from a point on the line and jump +step or −step; the child writes where it lands. */
export function makeLineJump(step: 10 | 100 | 1000, ticks: number[], start: number, jump: number, max?: 999): NumberLineExercise {
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
    case 'round': return ROUND_TARGETS.map(roundSkill)
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
  // Numbers up to 999 (2.º): mostly 3 digits, some 2-digit ones.
  const small = 'max' in p && p.max === 999
  const d = small ? 3 : digits === 2 || digits === 3 || digits === 4 ? digits : 4
  const randomNumber = (dd: 2 | 3 | 4 = d as 2 | 3 | 4) => randInt(rng, NUMBER_RANGE[dd][0], NUMBER_RANGE[dd][1])
  const max = small ? 999 as const : undefined
  switch (kind) {
    case 'place-value': {
      if (p.type !== 'place') return null
      return fresh(() => makePlaceValue(small && rng() < 0.25 ? randomNumber(2) : randomNumber(), p.mode, max), used)
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
        const a = randomNumber()
        const roll = rng()
        let b: number
        if (roll < 0.1) b = a
        else if (roll < 0.45) b = Math.floor(a / 1000) * 1000 + randInt(rng, 0, 999) // same millares: the centenas decide
        else if (roll < 0.7) b = Math.floor(a / 100) * 100 + randInt(rng, 0, 99) // same centenas: the decenas decide
        else b = randomNumber()
        b = Math.min(9999, Math.max(10, b))
        return rng() < 0.5 ? makeCompare(a, b) : makeCompare(b, a)
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
      return fresh(() => {
        const n = rng() < 0.5 ? 3 : 4
        const base = randInt(rng, 1, 8) * 1000
        const values: number[] = []
        while (values.length < n) {
          const v = rng() < 0.5 ? randomNumber() : base + randInt(rng, 0, 999)
          if (!values.includes(v)) values.push(v)
        }
        return makeOrder(shuffle(rng, values), rng() < 0.5 ? 'asc' : 'desc')
      }, used)
    }
    case 'round': {
      if (p.type !== 'round') return null
      return fresh(() => {
        const exact = rng() < 0.2
        let v = randomNumber(p.to === 1000 || rng() < 0.7 ? 4 : 3)
        if (exact) v = Math.round(v / p.to) * p.to
        // A millar never rounds up to 10 000: the numbers stay in 4 digits.
        v = Math.min(p.to === 1000 ? 9499 : 9999, Math.max(p.to === 1000 ? 1000 : 10, v))
        return makeRound(v, p.to)
      }, used)
    }
    case 'number-line': {
      if (p.type !== 'line') return null
      const step = p.step
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
  const word = ex.step === 10 ? 'las decenas' : ex.step === 100 ? 'las centenas' : 'los millares'
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
  const feedback = given === '=' ? '¡Casi! No son iguales: mira la primera casa donde cambian las cifras.' : '¡Casi! Mira primero los millares, después las centenas, las decenas y las unidades.'
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
  const feedback = ex.direction === 'asc'
    ? '¡Casi! Empieza por el más pequeño: el que tiene menos millares, y si empatan, mira las centenas.'
    : '¡Casi! Empieza por el más grande: el que tiene más millares, y si empatan, mira las centenas.'
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
  const feedback = ex.mode === 'words'
    ? '¡Casi! Lee despacio: primero los miles, luego las centenas, las decenas y las unidades.'
    : '¡Casi! Cuenta cada clase de bloque: cuadros de mil, placas de cien, barras de diez y cubitos.'
  return res(false, given, expected, { errorType: 'other', feedback })
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'], params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

const SIGN_WORD = (step: number) => (step === 10 ? 'las decenas' : step === 100 ? 'las centenas' : 'los millares')

/** Progressive hints for the numeric kinds. Level 3 never contains the answer. */
export function hintsNumeric(ex: Exercise): Hint[] | null {
  switch (ex.kind) {
    case 'place-value': {
      const params = { value: ex.value, parts: [...ex.parts], digits: ex.parts.length }
      if (ex.mode === 'blocks') {
        const top = ex.parts.length - 1
        const topDigit = digitAtPlace(ex.value, top)
        const unit = top === 3 ? 'cuadros de mil' : top === 2 ? 'placas de centena' : top === 1 ? 'barras de decena' : 'cubitos'
        return [
          hint(1, 'Cuenta cada clase de bloque por separado: cuadros de mil, placas de centena, barras de decena y cubitos.', 'place-value', params),
          hint(2, 'Cada cuadro de mil vale 1 000, cada placa 100, cada barra 10 y cada cubito 1.', 'place-value', params),
          hint(3, `Empieza por la clase más grande: hay ${topDigit} ${unit}. Ahora mira las demás clases.`, 'place-value', params),
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
      const s = String(ex.left).padStart(4, '0')
      const t = String(ex.right).padStart(4, '0')
      const i = [...s].findIndex((c, k) => c !== t[k])
      const names = ['los millares', 'las centenas', 'las decenas', 'las unidades']
      const where = i < 0 ? 'todas las casas son iguales' : `en ${names[i]} cambian las cifras`
      return [
        hint(1, 'Mira primero la cifra de más a la izquierda: la de los millares.', 'place-value', { left: ex.left, right: ex.right }),
        hint(2, 'Escribe los dos números en columnas (millares, centenas, decenas, unidades) y compara casa por casa.', 'place-value', { left: ex.left, right: ex.right }),
        hint(3, i < 0 ? 'Compara casa por casa: ¿hay alguna casa distinta?' : `Empieza por la primera casa donde cambian: ${where}.`, 'place-value', { left: ex.left, right: ex.right }),
      ]
    }
    case 'order': {
      const dir = ex.direction === 'asc' ? 'el que tiene menos millares va primero' : 'el que tiene más millares va primero'
      return [
        hint(1, `Compara primero los millares: ${dir}.`, 'none'),
        hint(2, 'Si tienen los mismos millares, mira las centenas. Después las decenas y, por último, las unidades.', 'place-value', { values: [...ex.values] }),
        hint(3, `Mira los millares de todos los números. ¿Cuál tiene ${ex.direction === 'asc' ? 'menos' : 'más'}? Ese va primero.`, 'place-value', { values: [...ex.values] }),
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
      const word = SIGN_WORD(ex.step)
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
