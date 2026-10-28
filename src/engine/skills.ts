/* Skill keys: the unit of mastery tracking. This file owns the format documented in src/types/exercise.ts.

   mul:AxB              multiplication fact, A <= B, 1..10 ('mul:6x7' covers 6×7 and 7×6)
   div:P/D              division fact P ÷ D, P = D×Q, D,Q in 1..10
   skip:N               skip counting by N (2..10)
   add:Nd:cK            column addition, N = 2|3|4 digits, K carries (2d: 0..2, 3d: 0..3, 4d: 0..4)
   sub:Nd:bK | sub:Nd:z column subtraction, K borrows (0..N-1) or z = borrowing across a zero (N >= 3)
   mul:2x1:c0|c1        2-digit × 1-digit without / with carry from the units
   div:2x1:exact|rem|long
   concept:groups|array|commutative|share|family|placevalue
   word:add|sub|mul|div word problems (engine extension: story problems resolving to one operation)
   word:sense                ¿tiene sentido?: a story with a proposed answer, yes or no (4.º, src/engine/wordProblems.ts)
   num:place:blocks|expanded|words, num:compare, num:order, num:round:10|100, num:line:10|100|1000   (numbers up to 9 999)
   <key>:999            numbers up to 999 (2.º): num:place:*, num:compare, num:order, num:line:10|100, add:3d:cK
   <key>:19999|:99999   numbers up to 19 999 (3.º intro) or 99 999 (4.º): num:place:*, num:compare, num:order;
                        num:round:1000:99999 (round to millares); num:line:10000 (jumps of 10 000, always up to 99 999)
   mental:dobles|triples|mitades|completar10|completar100|completar1000|decenas|centenas|compensar   (cálculo mental)
   mental:combinadas|jerarquia|parentesis|asociativa|distributiva|estimar                          (4.º: operaciones combinadas, propiedades, estimar)
   eq:flex                                                                                          (signo igual flexible)
   eq:same                                                                                          (signo igual o distinto: = o ≠)
   bar:add|sub|mul|div|two|three  bar-diagram problems (two, three = two or three steps); the ladder with/without the bar is in bars.ts
   bar:mul:small            the 2.º groups problem: groups of 2, 3, 4, 5 or 10 (the tables of 2.º)
   hunt:add|sub|mul         encuentra el error (column calculation that may be wrong)
   check:add|sub|div        comprobar (claim + the check operation)
   div:3x1:exact|rem        3-digit dividend ÷ 1-digit divisor
   clock:read:30|15|5   reloj de agujas: leer (30 = en punto y media, 15 = cuartos, 5 = cada 5 minutos)
   clock:set:30|5       reloj de agujas: poner la hora (30 = cuartos, 5 = cada 5 minutos)
   clock:convert:day    reloj digital de 24 h ↔ frase con mañana, tarde o noche
   time:end | time:elapsed   duraciones: hora de llegada, o minutos que pasan (recta de horas)
   time:units | cal:weekday | cal:month   unidades de tiempo, días de la semana, días de un mes
   time:seconds             minutos a segundos y al revés, y duraciones con segundos (up to 10 min; src/engine/clock.ts)
   frac:shade|read|name|of:D  fractions with denominator D (FRACTION_DENOMINATORS): colour, read, name, of a quantity
   frac:equal | frac:compare  figures not split in equal parts; comparing two fractions (block E, fracciones)
   frac:add | frac:sub        adding and subtracting fractions with the same denominator (4.º)
   dec:shade|read:D          décimas (D = 1) and centésimas (D = 2): colour a bar or a grid, read the words (4.º, src/engine/decimals.ts)
   dec:compare | dec:money   comparing two decimals; euros with céntimos written as a decimal
   dec:add:D | dec:sub:D     adding and subtracting decimals in columns (4.º)
   geo:poly:name|sides, geo:line:type|rel|kind, geo:angle:type|tap|class, geo:circle|circle:parts, geo:solid:name|roll|faces|count,
   geo:perimeter, geo:tri:sides|angles, geo:quad:name, geo:translate
                              geometry (block E, geometría): see src/engine/geometry.ts
   money:<mode>             dinero: recognise|pay|change|add|compare|convert (src/engine/money.ts)
   money:pay:e | money:add:e   whole euros, no céntimos (2.º)
   money:budget             presupuesto (4.º): ¿te llega?, ¿cuánto te falta o te sobra?, ¿qué compra cabe? (src/engine/money.ts)
   chart:pict|pict:x|bars|table|freq|mode   gráficos: pictogram (an icon is 1, or 2/5/10), bar chart, double-entry table, frequency, moda (src/engine/data.ts)
   prob:chance|likely       seguro, posible o imposible; the most (or least) likely colour of a bag
   pattern:shapes|numbers|predict   series: next figure, missing number, a term further on (src/engine/patterns.ts)
   pos:relative|next|route  posición en una cuadrícula y recorridos (src/engine/position.ts)
   mul:3x1:c0|c1            3-digit × 1-digit in columns, without / with carries (4.º, src/engine/bigops.ts)
   div:4x1:exact|rem        4-digit dividend ÷ 1-digit divisor (4.º)
   div:3x2:exact|rem|round  2- or 3-digit dividend ÷ 2-digit divisor, quotient of 1 or 2 digits (4.º); round: the divisor
                            is a round ten (20, 30… 90), exact (the first step of the family)
   mul:2dx2d | mul:3dx2d    multiplying by a two-digit number by parts (4.º)
   mul:col:2x2|3x2|3x3      multiplying in columns, with partial rows: 2- or 3-digit top × 2- or 3-digit bottom (4.º, src/engine/longmul.ts)
   measure:unit:<dim>       medida: unit of a real object, dim = length|mass|capacity
   measure:convert:<dim>    simple conversions (1 m = 100 cm, medio kilo = 500 g)
   measure:convert:<dim>:all  every unit of the dimension (km … mm, kg … mg, kl … ml): one step first, then several; whole numbers only
   measure:ruler | measure:add | measure:estimate            (src/engine/measure.ts)
   num:ordinal:10|20|30     ordinales (3.º): the n-.º of a row (10), or reading and writing 1.º–20.º / 1.º–30.º (src/engine/ordinals.ts)
*/
import type {
  BarOp, DecimalMode, DecimalPlaces, DivisionExercise, ExerciseKind, MeasureDimension, MeasureMode, MentalFamily, MoneyMode, PlaceMode,
  SkillKey,
} from '@/types'

/* ---- fracciones and geometría (block E). Builders and the parser live here with the rest of the keys. */
export const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12] as const
export type FractionDenominator = (typeof FRACTION_DENOMINATORS)[number]
export type FractionOp = 'shade' | 'read' | 'name' | 'of' | 'equal' | 'compare' | 'add' | 'sub'
export type GeoOp =
  | 'poly:name' | 'poly:sides' | 'line:type' | 'line:rel' | 'angle:type' | 'angle:tap' | 'circle'
  | 'solid:name' | 'solid:roll' | 'solid:faces' | 'perimeter' | 'area' | 'symmetry'
  | 'line:kind' | 'angle:class' | 'tri:sides' | 'tri:angles' | 'quad:name' | 'circle:parts' | 'translate' | 'solid:count'
export const GEO_OPS: GeoOp[] = [
  'poly:name', 'poly:sides', 'line:type', 'line:rel', 'angle:type', 'angle:tap', 'circle',
  'solid:name', 'solid:roll', 'solid:faces', 'perimeter', 'area', 'symmetry',
  'line:kind', 'angle:class', 'tri:sides', 'tri:angles', 'quad:name', 'circle:parts', 'translate', 'solid:count',
]

export type DivisionVariant = DivisionExercise['variant']
/** The top of an ordinal skill: 10 (the row), 20 or 30 (reading and writing the ordinals). */
export type OrdinalMax = 10 | 20 | 30
export type ConceptName = 'groups' | 'array' | 'commutative' | 'share' | 'family' | 'placevalue'
export type WordOp = 'add' | 'sub' | 'mul' | 'div'
export type BarSkillOp = BarOp | 'two' | 'three'
export type HuntOp = 'add' | 'sub' | 'mul'
export type CheckOp = 'add' | 'sub' | 'div'

export const CONCEPTS: ConceptName[] = ['groups', 'array', 'commutative', 'share', 'family', 'placevalue']
export const WORD_OPS: WordOp[] = ['add', 'sub', 'mul', 'div']
export const BAR_SKILL_OPS: BarSkillOp[] = ['add', 'sub', 'mul', 'div', 'two', 'three']
export const HUNT_OPS: HuntOp[] = ['add', 'sub', 'mul']
export const CHECK_OPS: CheckOp[] = ['add', 'sub', 'div']
export const DIVISION_VARIANTS: DivisionVariant[] = ['exact', 'rem', 'long']
export const PLACE_MODES: PlaceMode[] = ['blocks', 'expanded', 'words']
export const MENTAL_FAMILIES: MentalFamily[] = [
  'dobles', 'triples', 'mitades', 'completar10', 'completar100', 'completar1000', 'decenas', 'centenas', 'compensar', 'por10', 'romanos',
  'combinadas', 'jerarquia', 'parentesis', 'asociativa', 'distributiva', 'estimar',
]
export const ROUND_TARGETS = [10, 100] as const
export const LINE_STEPS = [10, 100, 1000, 10000] as const
/** The range suffix of the number skills: absent = up to 9 999, 999 = up to 999 (2.º), 19999 / 99999 = 5 digits. */
export type NumberMax = 999 | 19999 | 99999

/** The areas of Lengua: grammar, spelling, vocabulary, reading, literature and writing (`lng:<area>:<item>[:<level>]`). */
export type LenguaArea = 'gram' | 'orto' | 'voc' | 'lect' | 'lit' | 'escr'

export type ParsedSkill =
  | { type: 'mul'; a: number; b: number }
  | { type: 'div'; p: number; d: number; q: number }
  | { type: 'skip'; n: number }
  | { type: 'add'; digits: 2 | 3 | 4; carries: number; max?: 999 }
  | { type: 'sub'; digits: 2 | 3 | 4; borrows: number | null; zero: boolean }
  | { type: 'mul2x1'; carry: boolean }
  | { type: 'div2x1'; variant: DivisionVariant }
  | { type: 'div3x1'; variant: 'exact' | 'rem' }
  | { type: 'concept'; name: ConceptName }
  | { type: 'word'; op: WordOp }
  | { type: 'word-sense' }
  | { type: 'place'; mode: PlaceMode; max?: NumberMax }
  | { type: 'compare'; max?: NumberMax }
  | { type: 'order'; max?: NumberMax }
  | { type: 'round'; to: 10 | 100 | 1000; max?: 99999 }
  | { type: 'line'; step: 10 | 100 | 1000 | 10000; max?: 999 }
  | { type: 'mental'; family: MentalFamily }
  | { type: 'equation'; mode: 'fill' | 'same' }
  | { type: 'bar'; op: BarSkillOp; small?: true }
  | { type: 'hunt'; op: HuntOp }
  | { type: 'check'; op: CheckOp }
  | { type: 'clock-read'; step: 30 | 15 | 5 }
  | { type: 'clock-set'; step: 30 | 5 }
  | { type: 'clock-convert' }
  | { type: 'time-duration'; ask: 'end' | 'elapsed' }
  | { type: 'calendar'; topic: 'units' | 'weekday' | 'month' | 'seconds' }
  | { type: 'fraction'; op: 'shade' | 'read' | 'name' | 'of'; d: number }
  | { type: 'fraction'; op: 'equal' | 'compare' | 'add' | 'sub' }
  | { type: 'geo'; op: GeoOp }
  | { type: 'money'; mode: MoneyMode; whole?: true }
  | { type: 'measure'; mode: MeasureMode; dimension: MeasureDimension | null; all?: true }
  | { type: 'mul3x1'; carry: boolean }
  | { type: 'div4x1'; variant: 'exact' | 'rem' }
  | { type: 'decimal'; mode: DecimalMode; places?: DecimalPlaces }
  | { type: 'decimal-op'; op: 'add' | 'sub'; places: DecimalPlaces }
  | { type: 'div3x2'; variant: 'exact' | 'rem' | 'round' }
  | { type: 'mulParts'; digits: 2 | 3 }
  | { type: 'mulCol'; top: 2 | 3; bottom: 2 | 3 }
  | { type: 'ordinal'; top: OrdinalMax }
  | { type: 'chart'; variant: 'pict' | 'pict:x' | 'bars' | 'table' | 'freq' | 'mode' }
  | { type: 'chance'; variant: 'chance' | 'likely' }
  | { type: 'pattern'; variant: 'shapes' | 'numbers' | 'predict' }
  | { type: 'position'; variant: 'relative' | 'next' | 'route' }
  | { type: 'lengua'; area: LenguaArea; item: string; level?: string }

// ---------------------------------------------------------------- builders

export function mulSkill(a: number, b: number): SkillKey {
  return a <= b ? `mul:${a}x${b}` : `mul:${b}x${a}`
}
export function divSkill(dividend: number, divisor: number): SkillKey {
  return `div:${dividend}/${divisor}`
}
export function skipSkill(n: number): SkillKey {
  return `skip:${n}`
}
/** `max` 999: the sum stays below 1 000 (2.º). */
export function addSkill(digits: number, carries: number, max?: 999): SkillKey {
  return `add:${digits}d:c${carries}${max ? `:${max}` : ''}`
}
export function subSkill(digits: number, borrows: number, zero = false): SkillKey {
  return zero ? `sub:${digits}d:z` : `sub:${digits}d:b${borrows}`
}
/** Ordinals up to 10 (a row), 20 or 30 (reading and writing). */
export function ordinalSkill(max: OrdinalMax): SkillKey {
  return `num:ordinal:${max}`
}
/** Multiplying in columns with partial rows: the digits of the top and of the bottom (2 or 3 each). */
export function mulColSkill(top: 2 | 3, bottom: 2 | 3): SkillKey {
  return `mul:col:${top}x${bottom}`
}
export function mul2x1Skill(carry: boolean): SkillKey {
  return carry ? 'mul:2x1:c1' : 'mul:2x1:c0'
}
export function div2x1Skill(variant: DivisionVariant): SkillKey {
  return `div:2x1:${variant}`
}
export function conceptSkill(name: ConceptName): SkillKey {
  return `concept:${name}`
}
export function wordSkill(op: WordOp): SkillKey {
  return `word:${op}`
}
/** ¿Tiene sentido? (4.º): a story with a proposed answer that the child judges. */
export const WORD_SENSE_SKILL: SkillKey = 'word:sense'
export function placeSkill(mode: PlaceMode, max?: NumberMax): SkillKey {
  return `num:place:${mode}${max ? `:${max}` : ''}`
}
export function compareSkill(max?: NumberMax): SkillKey {
  return max ? `num:compare:${max}` : 'num:compare'
}
export function orderSkill(max?: NumberMax): SkillKey {
  return max ? `num:order:${max}` : 'num:order'
}
/** `max` 99999: rounding 5-digit numbers to millares (only num:round:1000:99999 exists). */
export function roundSkill(to: 10 | 100 | 1000, max?: NumberMax): SkillKey {
  return `num:round:${to}${max ? `:${max}` : ''}`
}
export function lineSkill(step: 10 | 100 | 1000 | 10000, max?: 999): SkillKey {
  return `num:line:${step}${max ? `:${max}` : ''}`
}
export function mentalSkill(family: MentalFamily): SkillKey {
  return `mental:${family}`
}
/** `small` (only with mul): the 2.º groups problem, groups of 2, 3, 4, 5 or 10. */
export function barSkill(op: BarSkillOp, small = false): SkillKey {
  return small && op === 'mul' ? 'bar:mul:small' : `bar:${op}`
}
export function huntSkill(op: HuntOp): SkillKey {
  return `hunt:${op}`
}
export function checkSkill(op: CheckOp): SkillKey {
  return `check:${op}`
}
export function div3x1Skill(variant: 'exact' | 'rem'): SkillKey {
  return `div:3x1:${variant}`
}
export function clockReadSkill(step: 30 | 15 | 5): SkillKey {
  return `clock:read:${step}`
}
export function clockSetSkill(step: 30 | 5): SkillKey {
  return `clock:set:${step}`
}
export function clockConvertSkill(): SkillKey {
  return 'clock:convert:day'
}
export function timeDurationSkill(ask: 'end' | 'elapsed'): SkillKey {
  return ask === 'end' ? 'time:end' : 'time:elapsed'
}
export function calendarSkill(topic: 'units' | 'weekday' | 'month' | 'seconds'): SkillKey {
  if (topic === 'seconds') return 'time:seconds'
  return topic === 'units' ? 'time:units' : topic === 'weekday' ? 'cal:weekday' : 'cal:month'
}
/** frac:shade|read|name|of with a denominator; frac:equal, frac:compare, frac:add and frac:sub without one. */
export function fractionSkill(op: FractionOp, d?: number): SkillKey {
  return op === 'equal' || op === 'compare' || op === 'add' || op === 'sub' ? `frac:${op}` : `frac:${op}:${d}`
}
/** dec:shade|read:D and dec:add|sub:D take the places (1 or 2); dec:compare and dec:money do not. */
export function decimalSkill(op: DecimalMode | 'add' | 'sub', places?: DecimalPlaces): SkillKey {
  return op === 'compare' || op === 'money' ? `dec:${op}` : `dec:${op}:${places}`
}
/** The decimal keys of each kind: décimas and centésimas (shade, read), comparing, euros; sums and differences. */
export const DECIMAL_SKILLS: SkillKey[] = [
  decimalSkill('shade', 1), decimalSkill('read', 1), decimalSkill('shade', 2), decimalSkill('read', 2), decimalSkill('compare'), decimalSkill('money'),
]
export const DECIMAL_OP_SKILLS: SkillKey[] = [decimalSkill('add', 1), decimalSkill('sub', 1), decimalSkill('add', 2), decimalSkill('sub', 2)]
export function geoSkill(op: GeoOp): SkillKey {
  return `geo:${op}`
}
/** `whole`: prices in whole euros, no céntimos (only pay and add). */
export function moneySkill(mode: MoneyMode, whole = false): SkillKey {
  return whole ? `money:${mode}:e` : `money:${mode}`
}
/** `all` (only convert): every unit of the dimension, `measure:convert:length:all`. */
export function measureSkill(mode: 'unit' | 'convert', dimension: MeasureDimension, all = false): SkillKey {
  return `measure:${mode}:${dimension}${all ? ':all' : ''}`
}

/** A Lengua skill key: `lng:<area>:<item>` or `lng:<area>:<item>:<level>` (lowercase, hyphens allowed). */
export function lenguaSkill(area: LenguaArea, item: string, level?: string): SkillKey {
  return `lng:${area}:${item}${level ? `:${level}` : ''}`
}

// ---------------------------------------------------------------- parser

const MAX_CARRIES: Record<2 | 3 | 4, number> = { 2: 2, 3: 3, 4: 4 }

export function parseSkill(key: SkillKey): ParsedSkill | null {
  let m: RegExpMatchArray | null
  if ((m = key.match(/^mul:(\d+)x(\d+)$/))) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a >= 1 && b >= 1 && a <= 10 && b <= 10 && a <= b) return { type: 'mul', a, b }
    return null
  }
  if ((m = key.match(/^div:(\d+)\/(\d+)$/))) {
    const p = Number(m[1])
    const d = Number(m[2])
    if (d < 1 || d > 10 || p % d !== 0) return null
    const q = p / d
    if (q < 1 || q > 10) return null
    return { type: 'div', p, d, q }
  }
  if ((m = key.match(/^skip:(\d+)$/))) {
    const n = Number(m[1])
    return n >= 2 && n <= 10 ? { type: 'skip', n } : null
  }
  if ((m = key.match(/^add:([234])d:c(\d)(:999)?$/))) {
    const digits = Number(m[1]) as 2 | 3 | 4
    const carries = Number(m[2])
    if (m[3]) return digits === 3 && carries <= 2 ? { type: 'add', digits, carries, max: 999 } : null
    return carries <= MAX_CARRIES[digits] ? { type: 'add', digits, carries } : null
  }
  if ((m = key.match(/^sub:([234])d:(b(\d)|z)$/))) {
    const digits = Number(m[1]) as 2 | 3 | 4
    if (m[2] === 'z') return digits >= 3 ? { type: 'sub', digits, borrows: null, zero: true } : null
    const borrows = Number(m[3])
    return borrows <= digits - 1 ? { type: 'sub', digits, borrows, zero: false } : null
  }
  if ((m = key.match(/^mul:2x1:c([01])$/))) return { type: 'mul2x1', carry: m[1] === '1' }
  if ((m = key.match(/^mul:3x1:c([01])$/))) return { type: 'mul3x1', carry: m[1] === '1' }
  if ((m = key.match(/^mul:([23])dx2d$/))) return { type: 'mulParts', digits: Number(m[1]) as 2 | 3 }
  if ((m = key.match(/^num:ordinal:(10|20|30)$/))) return { type: 'ordinal', top: Number(m[1]) as OrdinalMax }
  if ((m = key.match(/^mul:col:([23])x([23])$/))) return { type: 'mulCol', top: Number(m[1]) as 2 | 3, bottom: Number(m[2]) as 2 | 3 }
  if ((m = key.match(/^div:4x1:(exact|rem)$/))) return { type: 'div4x1', variant: m[1] as 'exact' | 'rem' }
  if ((m = key.match(/^dec:(shade|read):([12])$/))) return { type: 'decimal', mode: m[1] as 'shade' | 'read', places: Number(m[2]) as DecimalPlaces }
  if ((m = key.match(/^dec:(compare|money)$/))) return { type: 'decimal', mode: m[1] as 'compare' | 'money' }
  if ((m = key.match(/^dec:(add|sub):([12])$/))) return { type: 'decimal-op', op: m[1] as 'add' | 'sub', places: Number(m[2]) as DecimalPlaces }
  if ((m = key.match(/^div:3x2:(exact|rem|round)$/))) return { type: 'div3x2', variant: m[1] as 'exact' | 'rem' | 'round' }
  if ((m = key.match(/^div:2x1:(exact|rem|long)$/))) return { type: 'div2x1', variant: m[1] as DivisionVariant }
  if ((m = key.match(/^concept:(\w+)$/))) {
    const name = m[1] as ConceptName
    return CONCEPTS.includes(name) ? { type: 'concept', name } : null
  }
  if ((m = key.match(/^word:(add|sub|mul|div)$/))) return { type: 'word', op: m[1] as WordOp }
  if (key === WORD_SENSE_SKILL) return { type: 'word-sense' }
  if ((m = key.match(/^num:place:(blocks|expanded|words)(?::(999|19999|99999))?$/))) {
    return { type: 'place', mode: m[1] as PlaceMode, ...(m[2] ? { max: Number(m[2]) as NumberMax } : {}) }
  }
  if ((m = key.match(/^num:(compare|order)(?::(999|19999|99999))?$/))) {
    const max = m[2] ? (Number(m[2]) as NumberMax) : undefined
    return m[1] === 'compare' ? { type: 'compare', ...(max ? { max } : {}) } : { type: 'order', ...(max ? { max } : {}) }
  }
  if ((m = key.match(/^num:round:(10|100|1000)(?::(99999))?$/))) {
    const to = Number(m[1]) as 10 | 100 | 1000
    if (m[2] && to !== 1000) return null
    return { type: 'round', to, ...(m[2] ? { max: 99999 as const } : {}) }
  }
  if ((m = key.match(/^num:line:(10|100|1000|10000)$/))) return { type: 'line', step: Number(m[1]) as 10 | 100 | 1000 | 10000 }
  if ((m = key.match(/^num:line:(10|100):999$/))) return { type: 'line', step: Number(m[1]) as 10 | 100, max: 999 }
  if ((m = key.match(/^mental:(\w+)$/))) {
    const family = m[1] as MentalFamily
    return MENTAL_FAMILIES.includes(family) ? { type: 'mental', family } : null
  }
  if (key === 'eq:flex') return { type: 'equation', mode: 'fill' }
  if (key === 'eq:same') return { type: 'equation', mode: 'same' }
  if ((m = key.match(/^div:3x1:(exact|rem)$/))) return { type: 'div3x1', variant: m[1] as 'exact' | 'rem' }
  if ((m = key.match(/^bar:(add|sub|mul|div|two|three)$/))) return { type: 'bar', op: m[1] as BarSkillOp }
  if (key === 'bar:mul:small') return { type: 'bar', op: 'mul', small: true }
  if ((m = key.match(/^hunt:(add|sub|mul)$/))) return { type: 'hunt', op: m[1] as HuntOp }
  if ((m = key.match(/^check:(add|sub|div)$/))) return { type: 'check', op: m[1] as CheckOp }
  if ((m = key.match(/^clock:read:(30|15|5)$/))) return { type: 'clock-read', step: Number(m[1]) as 30 | 15 | 5 }
  if ((m = key.match(/^clock:set:(30|5)$/))) return { type: 'clock-set', step: Number(m[1]) as 30 | 5 }
  if (key === 'clock:convert:day') return { type: 'clock-convert' }
  if ((m = key.match(/^time:(end|elapsed)$/))) return { type: 'time-duration', ask: m[1] as 'end' | 'elapsed' }
  if (key === 'time:units') return { type: 'calendar', topic: 'units' }
  if (key === 'time:seconds') return { type: 'calendar', topic: 'seconds' }
  if (key === 'cal:weekday') return { type: 'calendar', topic: 'weekday' }
  if (key === 'cal:month') return { type: 'calendar', topic: 'month' }
  if ((m = key.match(/^frac:(shade|read|name|of):(\d+)$/))) {
    const d = Number(m[2])
    return (FRACTION_DENOMINATORS as readonly number[]).includes(d) ? { type: 'fraction', op: m[1] as 'shade' | 'read' | 'name' | 'of', d } : null
  }
  if ((m = key.match(/^frac:(equal|compare|add|sub)$/))) return { type: 'fraction', op: m[1] as 'equal' | 'compare' | 'add' | 'sub' }
  if ((m = key.match(/^geo:(.+)$/))) return GEO_OPS.includes(m[1] as GeoOp) ? { type: 'geo', op: m[1] as GeoOp } : null
  if ((m = key.match(/^money:(recognise|pay|change|add|compare|convert|budget)$/))) return { type: 'money', mode: m[1] as MoneyMode }
  if ((m = key.match(/^money:(pay|add):e$/))) return { type: 'money', mode: m[1] as MoneyMode, whole: true }
  if ((m = key.match(/^measure:(unit|convert):(length|mass|capacity)(:all)?$/))) {
    if (m[3] && m[1] !== 'convert') return null
    return { type: 'measure', mode: m[1] as MeasureMode, dimension: m[2] as MeasureDimension, ...(m[3] ? { all: true as const } : {}) }
  }
  if (key === 'measure:ruler') return { type: 'measure', mode: 'ruler', dimension: 'length' }
  if (key === 'measure:add') return { type: 'measure', mode: 'add', dimension: null }
  if (key === 'measure:estimate') return { type: 'measure', mode: 'estimate', dimension: null }
  if ((m = key.match(/^chart:(pict|pict:x|bars|table|freq|mode)$/))) return { type: 'chart', variant: m[1] as 'pict' | 'pict:x' | 'bars' | 'table' | 'freq' | 'mode' }
  if ((m = key.match(/^prob:(chance|likely)$/))) return { type: 'chance', variant: m[1] as 'chance' | 'likely' }
  if ((m = key.match(/^pattern:(shapes|numbers|predict)$/))) return { type: 'pattern', variant: m[1] as 'shapes' | 'numbers' | 'predict' }
  if ((m = key.match(/^pos:(relative|next|route)$/))) return { type: 'position', variant: m[1] as 'relative' | 'next' | 'route' }
  if ((m = key.match(/^lng:(gram|orto|voc|lect|lit|escr):([a-z][a-z0-9-]*)(?::([a-z][a-z0-9-]*))?$/))) {
    return { type: 'lengua', area: m[1] as LenguaArea, item: m[2], ...(m[3] ? { level: m[3] } : {}) }
  }
  return null
}

/** Skill keys practised by one of the fraction and geometry kinds (free play, and the universe of a selector). */
export function blockSkillsOf(kind: ExerciseKind): SkillKey[] {
  switch (kind) {
    case 'fraction-shade': return FRACTION_DENOMINATORS.map((d) => fractionSkill('shade', d))
    case 'fraction-read': return FRACTION_DENOMINATORS.map((d) => fractionSkill('read', d))
    case 'fraction-of': return FRACTION_DENOMINATORS.map((d) => fractionSkill('of', d))
    case 'fraction-equal': return [fractionSkill('equal')]
    case 'shape-choice': return [
      ...FRACTION_DENOMINATORS.map((d) => fractionSkill('name', d)), fractionSkill('compare'),
      ...GEO_OPS.filter((op) => !['poly:sides', 'angle:tap', 'perimeter', 'area'].includes(op)).map(geoSkill),
    ]
    case 'angle-tap': return [geoSkill('angle:tap')]
    case 'perimeter': return [geoSkill('perimeter')]
    case 'shape-count': return [geoSkill('poly:sides')]
    case 'area': return [geoSkill('area')]
    case 'fraction-add': return [fractionSkill('add'), fractionSkill('sub')]
    case 'decimal': return DECIMAL_SKILLS
    case 'decimal-op': return DECIMAL_OP_SKILLS
    default: return []
  }
}

/** Cálculo mental skills (the warm-up of the daily session takes them). */
export function isMentalSkill(key: SkillKey): boolean {
  return parseSkill(key)?.type === 'mental'
}

/** Skills whose exercises are judged as one short answer (not in columns): the kinds added for 3.º numbers and mental. */
export const NUMERIC_KINDS: ExerciseKind[] = ['place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation']

/** The handwriting (Caligrafía) key grammar: calig:letra:<l>, calig:mayus:<L>, calig:enlace:<ab>, calig:palabra:<word>, calig:frase:<id>. */
const HANDWRITING_KEY = /^calig:(?:letra:[a-zñ]|mayus:[A-ZÑ]|enlace:[a-zñ]{2}|palabra:\p{Ll}+|frase:[a-z0-9-]+)$/u

export function isValidSkill(key: SkillKey): boolean {
  return parseSkill(key) !== null || HANDWRITING_KEY.test(key)
}

/** Times-table facts (mul:AxB and div:P/D) — the skills that are judged on speed and shown in the fact grid. */
export function isFactSkill(key: SkillKey): boolean {
  const p = parseSkill(key)
  return p !== null && (p.type === 'mul' || p.type === 'div')
}

export function isMulFactSkill(key: SkillKey): boolean {
  return parseSkill(key)?.type === 'mul'
}

/** Facts with a factor in {1, 2, 5, 10}: learnt in world 1 and never counted as "brand-new" hard facts. */
export function isEasyFact(key: SkillKey): boolean {
  const p = parseSkill(key)
  if (!p) return false
  const easy = (n: number) => n === 1 || n === 2 || n === 5 || n === 10
  if (p.type === 'mul') return easy(p.a) || easy(p.b)
  if (p.type === 'div') return easy(p.d) || easy(p.q)
  return false
}

/** The exercise kinds that can practise a skill, the first one being the natural default. */
export function kindsForSkill(key: SkillKey): ExerciseKind[] {
  const p = parseSkill(key)
  if (!p) return []
  switch (p.type) {
    case 'mul': {
      const kinds: ExerciseKind[] = ['fact-mul', 'missing-factor']
      if (canDoubleChain(p.a, p.b)) kinds.push('double-chain')
      return kinds
    }
    case 'div': return ['fact-div']
    case 'skip': return ['skip-count']
    case 'add': return ['column-add', 'word-problem']
    case 'sub': return ['column-sub', 'word-problem']
    case 'mul2x1': return ['column-mul', 'word-problem']
    case 'div2x1': return ['division', 'word-problem']
    case 'div3x1': return ['division']
    case 'mul3x1': return ['column-mul']
    case 'div4x1': return ['division']
    case 'div3x2': return ['division']
    case 'decimal': return ['decimal']
    case 'decimal-op': return ['decimal-op']
    case 'mulParts': return ['mul-parts']
    case 'mulCol': return ['long-mul']
    case 'ordinal': return ['ordinal']
    case 'bar': return ['bar-problem']
    case 'hunt': return ['error-hunt']
    case 'check': return ['check-calc']
    case 'clock-read': return ['clock-read']
    case 'clock-set': return ['clock-set']
    case 'clock-convert': return ['time-convert']
    case 'time-duration': return ['time-duration']
    case 'calendar': return ['calendar']
    case 'fraction':
      switch (p.op) {
        case 'shade': return ['fraction-shade']
        case 'read': return ['fraction-read']
        case 'name': return ['shape-choice']
        case 'of': return ['fraction-of']
        case 'equal': return ['fraction-equal']
        case 'compare': return ['shape-choice']
        case 'add': case 'sub': return ['fraction-add']
      }
      break
    case 'geo':
      switch (p.op) {
        case 'poly:sides': return ['shape-count']
        case 'angle:tap': return ['angle-tap']
        case 'perimeter': return ['perimeter']
        case 'area': return ['area']
        default: return ['shape-choice']
      }
    case 'money': return ['money']
    case 'measure': return ['measure']
    case 'chart': return ['chart']
    case 'chance': return ['chance']
    case 'pattern': return ['pattern']
    case 'position': return ['position']
    case 'concept':
      switch (p.name) {
        case 'groups': return ['groups']
        case 'array': return ['array']
        case 'commutative': return ['array', 'fact-mul']
        case 'share': return ['fact-div']
        case 'family': return ['fact-family']
        case 'placevalue': return ['column-add']
      }
      break
    case 'word': return ['word-problem']
    case 'word-sense': return ['shape-choice']
    case 'place': return ['place-value']
    case 'compare': return ['compare']
    case 'order': return ['order']
    case 'round': return ['round']
    case 'line': return ['number-line']
    case 'mental': return ['mental']
    case 'equation': return ['equation']
    case 'lengua': return lenguaKinds(p)
  }
  /* c8 ignore next */
  return []
}

/** The Lengua kinds of each skill (src/engine/lengua). */
function lenguaKinds(p: Extract<ParsedSkill, { type: 'lengua' }>): ExerciseKind[] {
  switch (p.area) {
    case 'gram':
      switch (p.item) {
        case 'sustantivo':
          if (p.level === 'clase') return ['lng-classify', 'lng-tap-words']
          return ['lng-classify', 'lng-transform', 'lng-tap-words']
        case 'articulo': return ['lng-tap-words']
        case 'adjetivo': return ['lng-tap-words', 'lng-transform']
        case 'verbo': return ['lng-tap-words', 'lng-classify', 'lng-transform']
        case 'oracion': return ['lng-sentence-parts']
        case 'silabas': return ['lng-syllables']
        default: return []
      }
    case 'orto':
      if (p.item === 'tonica') return ['lng-stress']
      if (p.item === 'signos') return ['lng-punctuation']
      if (['c-qu', 'g-gu', 'r-rr', 'mp-mb', 'mayusculas'].includes(p.item)) return ['lng-missing-letter']
      return []
    case 'voc':
      if (p.item === 'abecedario') return ['lng-alphabet']
      if (['sinonimos', 'antonimos', 'familias', 'diminutivos', 'aumentativos', 'compuestas'].includes(p.item)) return ['lng-pair-words']
      return []
    case 'lect':
      if (p.item === 'idea-principal') return ['lng-read-choice']
      if (p.item === 'preguntas') return ['lng-read-choice', 'lng-read-text']
      if (p.item === 'ordenar') return ['lng-read-order']
      return []
    case 'lit':
      if (p.item === 'rima' || p.item === 'fabula' || p.item === 'trabalenguas') return ['lng-read-choice']
      if (p.item === 'adivinanzas') return ['lng-read-text']
      return []
    case 'escr':
      if (p.item === 'copia') return ['lng-copy']
      if (p.item === 'guiada') return ['lng-guided']
      return p.item === 'dictado' ? ['lng-dictation'] : []
    default: return []
  }
}

/** Every Lengua skill of the syllabus that has an exercise kind, for the skill universe of a kind. */
export const LENGUA_SKILLS: SkillKey[] = [
  'lng:gram:sustantivo:clase', 'lng:gram:sustantivo:genero', 'lng:gram:sustantivo:numero', 'lng:gram:articulo',
  'lng:gram:adjetivo', 'lng:gram:verbo:presente', 'lng:gram:verbo:pasado', 'lng:gram:verbo:futuro',
  'lng:gram:oracion:sujeto', 'lng:gram:oracion:predicado', 'lng:gram:silabas',
  'lng:orto:mayusculas', 'lng:orto:c-qu', 'lng:orto:g-gu', 'lng:orto:r-rr', 'lng:orto:mp-mb', 'lng:orto:tonica',
  'lng:orto:signos:punto', 'lng:orto:signos:coma', 'lng:orto:signos:pregunta', 'lng:orto:signos:exclamacion',
  'lng:voc:abecedario', 'lng:voc:sinonimos', 'lng:voc:antonimos', 'lng:voc:familias', 'lng:voc:diminutivos',
  'lng:voc:aumentativos', 'lng:voc:compuestas', 'lng:escr:copia', 'lng:escr:dictado', 'lng:escr:guiada',
  'lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar',
  'lng:lit:rima', 'lng:lit:fabula', 'lng:lit:adivinanzas', 'lng:lit:trabalenguas',
]

/** The grammar skills (lng:gram:…) of the grammar kinds, the first kind of each being its default. */
export const GRAMMAR_SKILLS: SkillKey[] = LENGUA_SKILLS.filter((k) => k.startsWith('lng:gram:'))

/** A multiplication fact can be practised as a doubling chain when one factor is 4 (2 doublings) or 8 (3). */
export function canDoubleChain(a: number, b: number): boolean {
  return (a === 4 || a === 8 || b === 4 || b === 8) && Math.min(a, b) >= 2 && !(a === 1 || b === 1)
}

/** All 55 normalised multiplication fact skills (1..10). */
export function allMulFactSkills(): SkillKey[] {
  const out: SkillKey[] = []
  for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) out.push(mulSkill(a, b))
  return out
}
