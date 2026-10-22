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
   num:place:blocks|expanded|words, num:compare, num:order, num:round:10|100, num:line:10|100|1000   (numbers up to 9 999)
   mental:dobles|mitades|completar10|completar100|completar1000|decenas|centenas|compensar           (cálculo mental)
   eq:flex                                                                                          (signo igual flexible)
   bar:add|sub|mul|div|two  bar-diagram problems (two = two steps); the ladder with/without the bar is in bars.ts
   hunt:add|sub|mul         encuentra el error (column calculation that may be wrong)
   check:add|sub|div        comprobar (claim + the check operation)
   div:3x1:exact|rem        3-digit dividend ÷ 1-digit divisor
   money:<mode>             dinero: recognise|pay|change|add|compare|convert (src/engine/money.ts)
   measure:unit:<dim>       medida: unit of a real object, dim = length|mass|capacity
   measure:convert:<dim>    simple conversions (1 m = 100 cm, medio kilo = 500 g)
   measure:ruler | measure:add | measure:estimate            (src/engine/measure.ts)
*/
import type {
  BarOp, DivisionExercise, ExerciseKind, MeasureDimension, MeasureMode, MentalFamily, MoneyMode, PlaceMode, SkillKey,
} from '@/types'

export type DivisionVariant = DivisionExercise['variant']
export type ConceptName = 'groups' | 'array' | 'commutative' | 'share' | 'family' | 'placevalue'
export type WordOp = 'add' | 'sub' | 'mul' | 'div'
export type BarSkillOp = BarOp | 'two'
export type HuntOp = 'add' | 'sub' | 'mul'
export type CheckOp = 'add' | 'sub' | 'div'

export const CONCEPTS: ConceptName[] = ['groups', 'array', 'commutative', 'share', 'family', 'placevalue']
export const WORD_OPS: WordOp[] = ['add', 'sub', 'mul', 'div']
export const BAR_SKILL_OPS: BarSkillOp[] = ['add', 'sub', 'mul', 'div', 'two']
export const HUNT_OPS: HuntOp[] = ['add', 'sub', 'mul']
export const CHECK_OPS: CheckOp[] = ['add', 'sub', 'div']
export const DIVISION_VARIANTS: DivisionVariant[] = ['exact', 'rem', 'long']
export const PLACE_MODES: PlaceMode[] = ['blocks', 'expanded', 'words']
export const MENTAL_FAMILIES: MentalFamily[] = ['dobles', 'mitades', 'completar10', 'completar100', 'completar1000', 'decenas', 'centenas', 'compensar']
export const ROUND_TARGETS = [10, 100] as const
export const LINE_STEPS = [10, 100, 1000] as const

export type ParsedSkill =
  | { type: 'mul'; a: number; b: number }
  | { type: 'div'; p: number; d: number; q: number }
  | { type: 'skip'; n: number }
  | { type: 'add'; digits: 2 | 3 | 4; carries: number }
  | { type: 'sub'; digits: 2 | 3 | 4; borrows: number | null; zero: boolean }
  | { type: 'mul2x1'; carry: boolean }
  | { type: 'div2x1'; variant: DivisionVariant }
  | { type: 'div3x1'; variant: 'exact' | 'rem' }
  | { type: 'concept'; name: ConceptName }
  | { type: 'word'; op: WordOp }
  | { type: 'place'; mode: PlaceMode }
  | { type: 'compare' }
  | { type: 'order' }
  | { type: 'round'; to: 10 | 100 }
  | { type: 'line'; step: 10 | 100 | 1000 }
  | { type: 'mental'; family: MentalFamily }
  | { type: 'equation' }
  | { type: 'bar'; op: BarSkillOp }
  | { type: 'hunt'; op: HuntOp }
  | { type: 'check'; op: CheckOp }
  | { type: 'money'; mode: MoneyMode }
  | { type: 'measure'; mode: MeasureMode; dimension: MeasureDimension | null }

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
export function addSkill(digits: number, carries: number): SkillKey {
  return `add:${digits}d:c${carries}`
}
export function subSkill(digits: number, borrows: number, zero = false): SkillKey {
  return zero ? `sub:${digits}d:z` : `sub:${digits}d:b${borrows}`
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
export function placeSkill(mode: PlaceMode): SkillKey {
  return `num:place:${mode}`
}
export function roundSkill(to: 10 | 100): SkillKey {
  return `num:round:${to}`
}
export function lineSkill(step: 10 | 100 | 1000): SkillKey {
  return `num:line:${step}`
}
export function mentalSkill(family: MentalFamily): SkillKey {
  return `mental:${family}`
}
export function barSkill(op: BarSkillOp): SkillKey {
  return `bar:${op}`
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
export function moneySkill(mode: MoneyMode): SkillKey {
  return `money:${mode}`
}
export function measureSkill(mode: 'unit' | 'convert', dimension: MeasureDimension): SkillKey {
  return `measure:${mode}:${dimension}`
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
  if ((m = key.match(/^add:([234])d:c(\d)$/))) {
    const digits = Number(m[1]) as 2 | 3 | 4
    const carries = Number(m[2])
    return carries <= MAX_CARRIES[digits] ? { type: 'add', digits, carries } : null
  }
  if ((m = key.match(/^sub:([234])d:(b(\d)|z)$/))) {
    const digits = Number(m[1]) as 2 | 3 | 4
    if (m[2] === 'z') return digits >= 3 ? { type: 'sub', digits, borrows: null, zero: true } : null
    const borrows = Number(m[3])
    return borrows <= digits - 1 ? { type: 'sub', digits, borrows, zero: false } : null
  }
  if ((m = key.match(/^mul:2x1:c([01])$/))) return { type: 'mul2x1', carry: m[1] === '1' }
  if ((m = key.match(/^div:2x1:(exact|rem|long)$/))) return { type: 'div2x1', variant: m[1] as DivisionVariant }
  if ((m = key.match(/^concept:(\w+)$/))) {
    const name = m[1] as ConceptName
    return CONCEPTS.includes(name) ? { type: 'concept', name } : null
  }
  if ((m = key.match(/^word:(add|sub|mul|div)$/))) return { type: 'word', op: m[1] as WordOp }
  if ((m = key.match(/^num:place:(blocks|expanded|words)$/))) return { type: 'place', mode: m[1] as PlaceMode }
  if (key === 'num:compare') return { type: 'compare' }
  if (key === 'num:order') return { type: 'order' }
  if ((m = key.match(/^num:round:(10|100)$/))) return { type: 'round', to: Number(m[1]) as 10 | 100 }
  if ((m = key.match(/^num:line:(10|100|1000)$/))) return { type: 'line', step: Number(m[1]) as 10 | 100 | 1000 }
  if ((m = key.match(/^mental:(\w+)$/))) {
    const family = m[1] as MentalFamily
    return MENTAL_FAMILIES.includes(family) ? { type: 'mental', family } : null
  }
  if (key === 'eq:flex') return { type: 'equation' }
  if ((m = key.match(/^div:3x1:(exact|rem)$/))) return { type: 'div3x1', variant: m[1] as 'exact' | 'rem' }
  if ((m = key.match(/^bar:(add|sub|mul|div|two)$/))) return { type: 'bar', op: m[1] as BarSkillOp }
  if ((m = key.match(/^hunt:(add|sub|mul)$/))) return { type: 'hunt', op: m[1] as HuntOp }
  if ((m = key.match(/^check:(add|sub|div)$/))) return { type: 'check', op: m[1] as CheckOp }
  if ((m = key.match(/^money:(recognise|pay|change|add|compare|convert)$/))) return { type: 'money', mode: m[1] as MoneyMode }
  if ((m = key.match(/^measure:(unit|convert):(length|mass|capacity)$/))) {
    return { type: 'measure', mode: m[1] as MeasureMode, dimension: m[2] as MeasureDimension }
  }
  if (key === 'measure:ruler') return { type: 'measure', mode: 'ruler', dimension: 'length' }
  if (key === 'measure:add') return { type: 'measure', mode: 'add', dimension: null }
  if (key === 'measure:estimate') return { type: 'measure', mode: 'estimate', dimension: null }
  return null
}

/** Cálculo mental skills (the warm-up of the daily session takes them). */
export function isMentalSkill(key: SkillKey): boolean {
  return parseSkill(key)?.type === 'mental'
}

/** Skills whose exercises are judged as one short answer (not in columns): the kinds added for 3.º numbers and mental. */
export const NUMERIC_KINDS: ExerciseKind[] = ['place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation']

export function isValidSkill(key: SkillKey): boolean {
  return parseSkill(key) !== null
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
    case 'bar': return ['bar-problem']
    case 'hunt': return ['error-hunt']
    case 'check': return ['check-calc']
    case 'money': return ['money']
    case 'measure': return ['measure']
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
    case 'place': return ['place-value']
    case 'compare': return ['compare']
    case 'order': return ['order']
    case 'round': return ['round']
    case 'line': return ['number-line']
    case 'mental': return ['mental']
    case 'equation': return ['equation']
  }
  /* c8 ignore next */
  return []
}

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
