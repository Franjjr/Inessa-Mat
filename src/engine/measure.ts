/* Medida (docs/curriculum/PLAN_DOCENTE.md §1.9 and §5.9, 3.º de Primaria). Pure: generators, checks and hints for
   length (cm, m, km), mass (g, kg) and capacity (ml, l): choose the unit of a real object, simple conversions
   (1 m = 100 cm, medio kilo = 500 g), read a measure on a ruler, add measures in mixed units, and estimate
   whether a claim is reasonable. Hints guide the strategy and never give the number of the answer.
   4.º adds the `:all` conversions: every unit of the dimension (km … mm, kg … mg, kl … ml) on the ladder of units,
   one step first, then up to three steps, always whole numbers. */
import type {
  Answer, CheckResult, Exercise, Hint, MeasureAddExercise, MeasureConvertExercise, MeasureDimension, MeasureEstimateExercise,
  MeasureMode, MeasureRulerExercise, MeasureUnitExercise, Rng,
} from '@/types'
import { fmt } from './numeric'
import { pick, randInt, shuffle } from './rng'
import { measureSkill } from './skills'

/** Units of each dimension, smallest first. */
export const UNITS: Record<MeasureDimension, string[]> = {
  length: ['cm', 'm', 'km'],
  mass: ['g', 'kg'],
  capacity: ['ml', 'l'],
}

/** Every unit of each dimension, biggest first: each step down is ×10 (the `:all` conversions and their hints). */
const LADDER: Record<MeasureDimension, string[]> = {
  length: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'],
  mass: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'],
  capacity: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'],
}

/** Size of each unit in its smallest unit of the dimension (cm, g, ml): used to say «demasiado grande» or «pequeño». */
const SIZE: Record<string, number> = { cm: 1, m: 100, km: 100_000, g: 1, kg: 1000, ml: 1, l: 1000 }

export const DIMENSION_NAME: Record<MeasureDimension, string> = { length: 'longitud', mass: 'masa', capacity: 'capacidad' }

/** Real objects with a realistic measure: the object, its emoji, the verb of its measure, the value and the unit. */
export interface MeasureThing { object: string; emoji: string; dimension: MeasureDimension; value: number; unit: string }

export const THINGS: MeasureThing[] = [
  { object: 'un lápiz', emoji: '✏️', dimension: 'length', value: 15, unit: 'cm' },
  { object: 'una goma', emoji: '🧽', dimension: 'length', value: 4, unit: 'cm' },
  { object: 'una mesa', emoji: '🪑', dimension: 'length', value: 120, unit: 'cm' },
  { object: 'la puerta de clase', emoji: '🚪', dimension: 'length', value: 2, unit: 'm' },
  { object: 'la clase de tu colegio', emoji: '🏫', dimension: 'length', value: 8, unit: 'm' },
  { object: 'la distancia de tu casa al colegio', emoji: '🏠', dimension: 'length', value: 2, unit: 'km' },
  { object: 'un sobre de galletas', emoji: '🍪', dimension: 'mass', value: 200, unit: 'g' },
  { object: 'una manzana', emoji: '🍎', dimension: 'mass', value: 150, unit: 'g' },
  { object: 'tu mochila llena', emoji: '🎒', dimension: 'mass', value: 6, unit: 'kg' },
  { object: 'un perro pequeño', emoji: '🐶', dimension: 'mass', value: 5, unit: 'kg' },
  { object: 'un vaso de agua', emoji: '🥛', dimension: 'capacity', value: 200, unit: 'ml' },
  { object: 'un zumo en cartón', emoji: '🧃', dimension: 'capacity', value: 200, unit: 'ml' },
  { object: 'una botella de agua', emoji: '🧴', dimension: 'capacity', value: 2, unit: 'l' },
  { object: 'un cubo de agua', emoji: '🪣', dimension: 'capacity', value: 5, unit: 'l' },
]

/** Conversions a 3.º child meets: the big unit, the small one, and how many small ones fit. */
const PAIRS: { dimension: MeasureDimension; big: string; small: string; factor: number; bigName: string }[] = [
  { dimension: 'length', big: 'm', small: 'cm', factor: 100, bigName: 'metro' },
  { dimension: 'length', big: 'km', small: 'm', factor: 1000, bigName: 'kilómetro' },
  { dimension: 'mass', big: 'kg', small: 'g', factor: 1000, bigName: 'kilo' },
  { dimension: 'capacity', big: 'l', small: 'ml', factor: 1000, bigName: 'litro' },
]

const VERB: Record<MeasureDimension, string> = { length: 'mide', mass: 'pesa', capacity: 'tiene' }

// ---------------------------------------------------------------- makers

const fresh = <T extends Exercise>(make: () => T, used: Set<string>, tries = 14): T => {
  let last = make()
  for (let i = 0; i < tries && used.has(last.id); i++) last = make()
  return last
}

export function makeUnit(thing: MeasureThing, options: { value: number; unit: string }[]): MeasureUnitExercise {
  return {
    id: `measure:unit:${thing.object}`, kind: 'measure', skill: measureSkill('unit', thing.dimension), difficulty: 2,
    mode: 'unit', dimension: thing.dimension, object: thing.object, emoji: thing.emoji, options: [...options], answer: thing.unit,
  }
}

export function makeConvert(
  dimension: MeasureDimension, given: string, unit: string, factor: number, fraction: 'half' | 'quarter' | null,
  toBig: boolean, answer: number, difficulty: number,
): MeasureConvertExercise {
  return {
    id: `measure:convert:${given}:${unit}`, kind: 'measure', skill: measureSkill('convert', dimension), difficulty,
    mode: 'convert', dimension, given, unit, factor, fraction, toBig, answer,
  }
}

/** A `:all` conversion: `given` is in `from`, the blank is in `unit`, `steps` rungs of the ladder apart (×10 each). */
export function makeConvertAll(
  dimension: MeasureDimension, given: string, from: string, unit: string, steps: number, toBig: boolean, answer: number,
): MeasureConvertExercise {
  return {
    id: `measure:convert:${given}:${unit}`, kind: 'measure', skill: measureSkill('convert', dimension, true),
    difficulty: steps === 1 ? 2 : 3, mode: 'convert', dimension, given, unit, factor: 10 ** steps, fraction: null, toBig, answer,
    ladder: { from, steps },
  }
}

export function makeRuler(start: number, end: number, max = 30): MeasureRulerExercise {
  return {
    id: `measure:ruler:${start}:${end}`, kind: 'measure', skill: 'measure:ruler', difficulty: start === 0 ? 2 : 3,
    mode: 'ruler', start, end, max, answer: end - start,
  }
}

export function makeAddMeasure(dimension: MeasureDimension, text: string, unit: string, answer: number, id: string): MeasureAddExercise {
  return {
    id: `measure:add:${id}`, kind: 'measure', skill: 'measure:add', difficulty: 3, mode: 'add', dimension, text, unit, answer,
  }
}

export function makeEstimate(thing: MeasureThing, claimUnit: string, reasonable: boolean): MeasureEstimateExercise {
  const claimed = `${thing.value} ${claimUnit}`
  return {
    id: `measure:estimate:${thing.object}:${claimUnit}`, kind: 'measure', skill: 'measure:estimate', difficulty: 3,
    mode: 'estimate', object: thing.object, emoji: thing.emoji,
    claim: `${cap(thing.object)} ${VERB[thing.dimension]} ${claimed}.`, answer: reasonable,
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ---------------------------------------------------------------- generation

/** `all` (only convert): every unit of the dimension, as in `measure:convert:<dim>:all`. */
export function buildMeasure(mode: MeasureMode, dimension: MeasureDimension | null, rng: Rng, used: Set<string>, all = false): Exercise {
  switch (mode) {
    case 'unit': {
      const dim = dimension ?? 'length'
      return fresh(() => {
        const thing = pick(rng, THINGS.filter((t) => t.dimension === dim))
        return makeUnit(thing, shuffle(rng, UNITS[dim].map((unit) => ({ value: thing.value, unit }))))
      }, used)
    }
    case 'convert': {
      const dim = dimension ?? 'length'
      return fresh(() => (all ? buildConvertAll(dim, rng) : buildConvert(dim, rng)), used)
    }
    case 'ruler':
      return fresh(() => {
        const length = randInt(rng, 3, 20)
        const start = rng() < 0.5 ? 0 : randInt(rng, 1, 30 - length)
        return makeRuler(start, start + length)
      }, used)
    case 'add':
      return fresh(() => {
        const choice = pick(rng, [
          { dim: 'length' as const, text: 'Una cinta mide {a} y otra mide {b}. ¿Cuántos centímetros miden las dos juntas?', unit: 'cm', a: [1, 4], b: [10, 95], bUnit: 'cm', aUnit: 'm' },
          { dim: 'mass' as const, text: 'Una caja pesa {a} y un libro pesa {b}. ¿Cuántos gramos pesan los dos juntos?', unit: 'g', a: [1, 4], b: [100, 900], bUnit: 'g', aUnit: 'kg' },
          { dim: 'capacity' as const, text: 'En una jarra hay {a} de agua y en un vaso hay {b} de zumo. ¿Cuántos mililitros hay en total?', unit: 'ml', a: [1, 3], b: [50, 450], bUnit: 'ml', aUnit: 'l' },
        ])
        const a = randInt(rng, choice.a[0], choice.a[1])
        const b = randInt(rng, choice.b[0], choice.b[1])
        const answer = a * (SIZE[choice.aUnit] / SIZE[choice.unit]) + b
        const text = choice.text.replace('{a}', `${a} ${choice.aUnit}`).replace('{b}', `${fmt(b)} ${choice.bUnit}`)
        return makeAddMeasure(choice.dim, text, choice.unit, answer, `${choice.dim}:${a}:${b}`)
      }, used)
    case 'estimate':
      return fresh(() => {
        const thing = pick(rng, THINGS)
        const units = UNITS[thing.dimension]
        const reasonable = rng() < 0.5
        const claimUnit = reasonable ? thing.unit : pick(rng, units.filter((u) => u !== thing.unit))
        return makeEstimate(thing, claimUnit, reasonable)
      }, used)
  }
}

function buildConvert(dim: MeasureDimension, rng: Rng): MeasureConvertExercise {
  const pair = pick(rng, PAIRS.filter((p) => p.dimension === dim))
  const shape = rng()
  if (shape < 0.45) {
    const n = randInt(rng, 1, 5)
    return makeConvert(dim, `${n} ${pair.big}`, pair.small, pair.factor, null, false, n * pair.factor, 1)
  }
  if (shape < 0.75) {
    const fraction = rng() < 0.5 ? 'half' : 'quarter'
    const parts = fraction === 'half' ? 2 : 4
    const given = fraction === 'half' ? `medio ${pair.bigName}` : `un cuarto de ${pair.bigName}`
    return makeConvert(dim, given, pair.small, pair.factor, fraction, false, pair.factor / parts, 3)
  }
  const n = randInt(rng, 2, 9)
  return makeConvert(dim, `${fmt(n * pair.factor)} ${pair.small}`, pair.big, pair.factor, null, true, n, 2)
}

/** Numbers of a `:all` item stay within four digits, the writing pad of the conversion. */
const ALL_MAX = 9999

/** One `:all` conversion: one step or two or three steps of the ladder, up or down; the whole number is always exact. */
function buildConvertAll(dim: MeasureDimension, rng: Rng): MeasureConvertExercise {
  const ladder = LADDER[dim]
  const steps = rng() < 0.5 ? 1 : randInt(rng, 2, 3)
  const i = randInt(rng, 0, ladder.length - 1 - steps)
  const j = i + steps
  const factor = 10 ** steps
  const n = randInt(rng, 1, Math.min(9, Math.floor(ALL_MAX / factor)))
  if (rng() < 0.5) {
    // Down the ladder: the big unit is given and the blank is the small one (3 km = ___ m).
    return makeConvertAll(dim, `${n} ${ladder[i]}`, ladder[i], ladder[j], steps, false, n * factor)
  }
  // Up the ladder: the small unit is given and the blank is the big one (3 000 mm = ___ m).
  return makeConvertAll(dim, `${fmt(n * factor)} ${ladder[j]}`, ladder[j], ladder[i], steps, true, n)
}

// ---------------------------------------------------------------- statements

/** Human statement of a measure exercise: names the question, never the answer. */
export function measureStatement(ex: Exercise): string {
  if (ex.kind !== 'measure') return ex.skill
  switch (ex.mode) {
    case 'unit': return `¿Qué unidad usas para medir ${ex.object}?`
    case 'convert': return `${cap(ex.given)} = ? ${ex.unit}`
    case 'ruler': return 'Mide con la regla'
    case 'add': return ex.text
    case 'estimate': return `¿Es razonable? ${ex.claim}`
  }
}

// ---------------------------------------------------------------- checks

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const res = (correct: boolean, given: string, expected: string, extra: Partial<CheckResult> = {}): CheckResult =>
  ({ correct, given, expected, ...extra })

function numberOf(answer: Answer): number | null | undefined {
  if (answer.type === 'number') return isNum(answer.value) ? answer.value : null
  if (answer.type === 'numbers' && answer.values.length === 1) return isNum(answer.values[0]) ? answer.values[0] : null
  return undefined
}

function checkUnit(ex: MeasureUnitExercise, answer: Answer): CheckResult {
  const expected = ex.answer
  if (answer.type !== 'option') return res(false, '', expected, { errorType: 'other', feedback: 'Elige una unidad.' })
  if (answer.value === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Elige una de las medidas.' })
  if (answer.value === expected) return res(true, answer.value, expected, { feedback: `¡Muy bien! Para ${ex.object} se usa ${expected}.` })
  const shown = ex.options.find((o) => o.unit === answer.value)
  const bigger = shown ? SIZE[shown.unit] > SIZE[expected] : false
  const feedback = `¡Casi! Con ${answer.value} sería ${bigger ? 'demasiado grande' : 'demasiado pequeño'} para ${ex.object}. Piensa en su tamaño real.`
  return res(false, answer.value, expected, { errorType: 'operation', feedback })
}

function checkConvert(ex: MeasureConvertExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = numberOf(answer)
  if (v === undefined) return res(false, '', expected, { errorType: 'other', feedback: 'Escribe solo el número.' })
  if (v === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe el número que falta.' })
  if (v === ex.answer) return res(true, String(v), expected, { feedback: `¡Muy bien! Ya sabes cuántas unidades caben en ${ex.toBig ? 'la grande' : 'una grande'}.` })
  const feedback = ex.ladder
    ? `¡Casi! Revisa cuántos escalones hay entre las dos unidades: cada escalón ${ex.toBig ? 'hacia arriba divide' : 'hacia abajo multiplica'} por diez.`
    : ex.toBig
    ? '¡Casi! Piensa cuántas veces cabe la unidad grande en la cantidad que te dan.'
    : '¡Casi! Recuerda cuántas unidades pequeñas caben en una grande.'
  return res(false, String(v), expected, { errorType: 'other', feedback })
}

function checkRuler(ex: MeasureRulerExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = numberOf(answer)
  if (v === undefined) return res(false, '', expected, { errorType: 'other', feedback: 'Escribe solo el número de centímetros.' })
  if (v === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe cuántos centímetros mide.' })
  if (v === ex.answer) return res(true, String(v), expected, { feedback: '¡Muy bien! Has medido bien.' })
  const feedback = v === ex.end && ex.start !== 0
    ? `¡Casi! Has leído dónde acaba, pero el objeto empieza en ${ex.start} cm. ¿Cuánto mide desde ahí?`
    : '¡Casi! Mira con cuidado la marca donde acaba el objeto.'
  return res(false, String(v), expected, { errorType: 'other', feedback })
}

function checkAdd(ex: MeasureAddExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = numberOf(answer)
  if (v === undefined) return res(false, '', expected, { errorType: 'other', feedback: 'Escribe solo el número.' })
  if (v === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe el número que falta.' })
  if (v === ex.answer) return res(true, String(v), expected, { feedback: `¡Muy bien! Las dos medidas juntas son ${fmt(v)} ${ex.unit}.` })
  return res(false, String(v), expected, { errorType: 'other', feedback: `¡Casi! Antes de sumar, pon las dos medidas en ${ex.unit}.` })
}

function checkEstimate(ex: MeasureEstimateExercise, answer: Answer): CheckResult {
  const expected = ex.answer ? 'sí' : 'no'
  if (answer.type !== 'verdict') return res(false, '', expected, { errorType: 'other', feedback: 'Elige sí o no.' })
  if (answer.ok === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Elige sí o no.' })
  const given = answer.ok ? 'sí' : 'no'
  if (answer.ok === ex.answer) return res(true, given, expected, { feedback: '¡Muy bien! Has pensado en el tamaño real.' })
  return res(false, given, expected, { errorType: 'other', feedback: `¡Casi! Piensa en el tamaño real de ${ex.object}: ¿se parece a ese número?` })
}

/** Grades a measure exercise. Pure and deterministic. */
export function checkMeasure(ex: Exercise, answer: Answer): CheckResult {
  if (ex.kind !== 'measure') return res(false, '', '', { errorType: 'other', feedback: 'Revisa tu respuesta.' })
  switch (ex.mode) {
    case 'unit': return checkUnit(ex, answer)
    case 'convert': return checkConvert(ex, answer)
    case 'ruler': return checkRuler(ex, answer)
    case 'add': return checkAdd(ex, answer)
    case 'estimate': return checkEstimate(ex, answer)
  }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none'): Hint => ({ level, text, visual })

const SIZE_HINT: Record<MeasureDimension, string> = {
  length: 'Los centímetros sirven para cosas pequeñas, los metros para cosas grandes y los kilómetros para distancias.',
  mass: 'Los gramos sirven para cosas ligeras y los kilos para cosas pesadas.',
  capacity: 'Los mililitros sirven para cantidades pequeñas y los litros para botellas y cubos.',
}

/**
 * The three hints of a `:all` conversion. Level 3 works a different example (two rungs apart, other numbers, and none of
 * its numbers is the given amount or the answer), so the child sees the method and still has to count the rungs.
 */
function hintsLadder(ex: MeasureConvertExercise, from: string): Hint[] {
  const names = LADDER[ex.dimension]
  const down = !ex.toBig
  return [
    hint(1, `Escalera de unidades: ${names.join(' ')}. Cada escalón hacia abajo multiplica por diez, y cada escalón hacia arriba divide entre diez.`),
    hint(2, `Ve de ${from} a ${ex.unit} por la escalera y cuenta cuántos escalones ${down ? 'bajas' : 'subes'}. Después aplica ${down ? 'la multiplicación' : 'la división'} por diez en cada escalón.`),
    hint(3, exampleOfLadder(ex, from)),
  ]
}

/** A worked example of two rungs in the same direction, on another pair of units and with other numbers than the exercise. */
function exampleOfLadder(ex: MeasureConvertExercise, from: string): string {
  const names = LADDER[ex.dimension]
  const down = !ex.toBig
  const exNumber = down ? ex.answer / ex.factor : ex.answer
  const givenValue = down ? exNumber : exNumber * ex.factor
  const exFrom = names.indexOf(from)
  const exTo = names.indexOf(ex.unit)
  const exLo = Math.min(exFrom, exTo)
  const exHi = Math.max(exFrom, exTo)
  const pairs = [[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]].filter(([lo, hi]) => !(lo === exLo && hi === exHi))
  const [lo, hi] = pairs[(exLo + exHi) % pairs.length]
  for (const n of [4, 6, 7, 3, 8, 9, 2]) {
    const small = n * 100
    if ([n, small].some((x) => x === givenValue || x === ex.answer)) continue
    return down
      ? `Ejemplo: ${n} ${names[lo]} son ${n} × diez × diez = ${fmt(small)} ${names[hi]}, porque bajas dos escalones.`
      : `Ejemplo: ${fmt(small)} ${names[hi]} son ${n} ${names[lo]}, porque subes dos escalones: ${fmt(small)} ÷ diez ÷ diez = ${n}.`
  }
  throw new Error('measure: no example for a ladder conversion')
}

/** Progressive hints for the measure exercises. Level 3 never gives the answer. */
export function hintsMeasure(ex: Exercise): Hint[] | null {
  if (ex.kind !== 'measure') return null
  switch (ex.mode) {
    case 'unit': return [
      hint(1, 'Piensa en el tamaño real del objeto, no en el número.'),
      hint(2, SIZE_HINT[ex.dimension]),
      hint(3, `Imagina ${ex.object} y compara: ¿cabe en la mano, en la mesa o hay que ir en coche?`),
    ]
    case 'convert': {
      if (ex.ladder) return hintsLadder(ex, ex.ladder.from)
      const pair = PAIRS.find((p) => p.dimension === ex.dimension && p.factor === ex.factor) ?? PAIRS[0]
      const { big, small, bigName } = pair
      if (ex.fraction) {
        return [
          hint(1, 'Medio es la mitad, y un cuarto es una de cuatro partes iguales.'),
          hint(2, `Imagina un ${bigName} dividido en ${ex.fraction === 'half' ? 'dos' : 'cuatro'} partes iguales: una parte es la cantidad que te piden.`),
          hint(3, `Divide ${fmt(ex.factor)} ${small} entre ${ex.fraction === 'half' ? 2 : 4}.`),
        ]
      }
      if (ex.toBig) {
        return [
          hint(1, `Una unidad grande tiene muchas pequeñas dentro. Aquí hay que ver cuántos ${big} caben.`),
          hint(2, `Haz grupos de ${fmt(ex.factor)} ${small} con la cantidad que te dan y cuenta los grupos.`),
          hint(3, `Cada grupo de ${fmt(ex.factor)} ${small} es un ${bigName}: cuenta cuántos grupos hay.`),
        ]
      }
      return [
        hint(1, 'Una unidad grande tiene muchas unidades pequeñas dentro.'),
        hint(2, `Imagina una tira de un ${bigName} marcada con ${small}: ¿cuántas marcas caben?`),
        hint(3, `Cuenta de ${fmt(ex.factor / 10)} en ${fmt(ex.factor / 10)} hasta llegar a un ${bigName} y mira cuántos saltos das.`),
      ]
    }
    case 'ruler': return [
      hint(1, 'Mira dónde empieza el objeto y dónde acaba.'),
      hint(2, ex.start === 0 ? 'Como empieza en 0, basta con leer la marca donde acaba.' : 'Si no empieza en 0, mira cuánto hay desde el principio del objeto hasta el final.'),
      hint(3, 'Al número donde acaba le quitas el número donde empieza.'),
    ]
    case 'add': return [
      hint(1, 'Antes de sumar, pon las dos medidas en la misma unidad.'),
      hint(2, 'Las medidas grandes se pasan a la unidad pequeña: cada unidad grande tiene muchas pequeñas.'),
      hint(3, `Primero cambia la medida grande a ${ex.unit} y después suma las dos.`),
    ]
    case 'estimate': return [
      hint(1, 'Piensa en algo parecido que conozcas.'),
      hint(2, '¿Cabe en la mano, o es tan grande como una clase? Compara el tamaño con la medida.'),
      hint(3, 'Si la cosa es mucho más grande o más pequeña que ese número, no es razonable.'),
    ]
  }
}

export const MEASURE_MODES: MeasureMode[] = ['unit', 'convert', 'ruler', 'add', 'estimate']
