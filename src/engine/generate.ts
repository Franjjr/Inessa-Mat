/* Exercise generation. Pipeline:
     selector → resolved context → skill universe (per kind, or the explicit skills)
     → plan which skills to practise (uniform, or adaptive with mastery: due/weak first, ~70% known / ~30% new,
       at most 3 brand-new hard facts per call)
     → order (no skill twice in a row, start with something familiar)
     → build concrete exercises (deterministic ids, avoiding avoidIds and duplicates when possible). */
import type { Exercise, ExerciseKind, MasteryMap, Rng, SkillKey, SkillSelector } from '@/types'
import { digitCount } from './arith'
import {
  makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeDivision3, makeDoubleChain, makeFactDiv,
  makeFactFamily, makeFactMul, makeGroups, makeMissingFactor, makeSkipCount, makeWordProblem,
} from './make'
import { BAR_OPS, genBarProblem } from './bars'
import { genCheckCalc, genErrorHunt } from './bugs'
import { genAddOperands, genDivision, genMul2x1, genSubPair, maxCarries } from './numbers'
import { buildEquation, buildMental, mentalSkillsOf } from './calc'
import { buildNumericExercise, numericSkillsOf } from './numeric'
import { buildClock, clockSkillsOf } from './clock'
import { genFractionAdd, genFractionCompare, genFractionEqual, genFractionName, genFractionOf, genFractionRead, genFractionShade } from './fractions'
import { genGeometry } from './geometry'
import { buildMoney, MONEY_MODES } from './money'
import { buildMeasure } from './measure'
import { CHART_SKILLS, buildChance, buildChart, buildLikely } from './data'
import { genDivision2d, genDivision4, genMul3x1, genMulParts } from './bigops'
import { genLongMul } from './longmul'
import { genOrdinal } from './ordinals'
import { genDecimal, genDecimalOp } from './decimals'
import { PATTERN_SKILLS, buildPattern } from './patterns'
import { POSITION_SKILLS, buildPosition } from './position'
import { moneySkill, measureSkill } from './skills'
import { clamp, createRng, hashString, pick, randInt, range, shuffle, weightedIndex } from './rng'
import {
  CHECK_OPS, DIVISION_VARIANTS, HUNT_OPS, NUMERIC_KINDS, addSkill, barSkill, blockSkillsOf, checkSkill, conceptSkill, div2x1Skill,
  divSkill, huntSkill, isEasyFact, isFactSkill, kindsForSkill, mul2x1Skill, mulColSkill, mulSkill, ordinalSkill, parseSkill, skipSkill, subSkill, wordSkill,
  type BarSkillOp, type DivisionVariant, type ParsedSkill, type WordOp,
} from './skills'
import type { GenerateOptions } from './types'
import { fillTemplate, templatesFor } from './wordProblems'

export const ALL_KINDS: ExerciseKind[] = [
  'fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'groups', 'array', 'double-chain', 'fact-family',
  'column-add', 'column-sub', 'column-mul', 'division', 'word-problem', 'bar-problem', 'error-hunt', 'check-calc',
  'place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation',
  // tiempo (block D, src/engine/clock.ts)
  'clock-read', 'clock-set', 'time-convert', 'time-duration', 'calendar',
  'fraction-shade', 'fraction-read', 'fraction-of', 'fraction-equal', 'shape-choice', 'angle-tap', 'perimeter', 'shape-count',
  'place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation', 'money', 'measure',
  'chart', 'chance', 'pattern', 'position', 'mul-parts', 'area', 'fraction-add', 'long-mul', 'ordinal',
  'decimal', 'decimal-op',
]

export const EMOJIS = ['🍄', '🌸', '⭐', '🍎', '🐞', '🦋', '🐟', '💎', '🧁', '🍓', '🐚', '🌈']

type Regroup = NonNullable<SkillSelector['regroup']>

export interface Ctx {
  /** Mastery of the child: a bar problem the child has mastered comes without the drawing (the ladder). */
  mastery?: MasteryMap
  tables?: number[]
  range: [number, number]
  rangeExplicit: boolean
  digits?: 2 | 3 | 4
  regroup: Regroup
  regroupExplicit: boolean
  zeros?: boolean
  variants: DivisionVariant[]
  variantsExplicit: boolean
}

interface UniverseItem {
  skill: SkillKey
  kinds: ExerciseKind[]
  weight: number
}

interface Planned {
  skill: SkillKey
  kind: ExerciseKind
  isNew: boolean
}

// ---------------------------------------------------------------- selector resolution

export function resolveContext(sel: SkillSelector): Ctx {
  const tables = sel.tables?.filter((t) => Number.isInteger(t) && t >= 1 && t <= 10)
  let lo = 1
  let hi = 10
  if (sel.factorRange) {
    lo = clamp(Math.round(Math.min(sel.factorRange[0], sel.factorRange[1])), 1, 10)
    hi = clamp(Math.round(Math.max(sel.factorRange[0], sel.factorRange[1])), 1, 10)
  }
  const variants = sel.divisionVariants?.filter((v) => DIVISION_VARIANTS.includes(v)) ?? []
  return {
    tables: tables && tables.length ? [...new Set(tables)] : undefined,
    range: [lo, hi],
    rangeExplicit: !!sel.factorRange,
    digits: sel.digits === 2 || sel.digits === 3 || sel.digits === 4 ? sel.digits : undefined,
    regroup: sel.regroup ?? 'any',
    regroupExplicit: !!sel.regroup,
    zeros: sel.zeros,
    variants: variants.length ? [...new Set(variants)] : ['exact', 'rem'],
    variantsExplicit: variants.length > 0,
  }
}

/** Kinds to generate when the selector does not list them. */
export function inferKinds(sel: SkillSelector): ExerciseKind[] {
  if (sel.kinds && sel.kinds.length) return [...new Set(sel.kinds.filter((k) => ALL_KINDS.includes(k)))]
  if (sel.skills && sel.skills.length) {
    const kinds = new Set<ExerciseKind>()
    for (const s of sel.skills) {
      const k = kindsForSkill(s)[0]
      if (k) kinds.add(k)
    }
    if (kinds.size) return [...kinds]
  }
  if (sel.divisionVariants && sel.divisionVariants.length) return ['division']
  if (sel.zeros !== undefined) return ['column-sub']
  if (sel.digits !== undefined || sel.regroup !== undefined) return ['column-add']
  return ['fact-mul']
}

/** Exact carry/borrow counts allowed by a regroup setting: none = 0, one = 1, many = >= 2, any = all. */
export function regroupCounts(regroup: Regroup, max: number): number[] {
  switch (regroup) {
    case 'none': return [0]
    case 'one': return max >= 1 ? [1] : [0]
    case 'many': return max >= 2 ? range(2, max) : [max]
    case 'any': return range(0, max)
  }
}

const factTables = (ctx: Ctx) => ctx.tables ?? range(2, 10)

function factWeight(t: number, n: number, ctx: Ctx): number {
  const tables = ctx.tables ?? []
  const asked = (x: number) => tables.includes(x) || (ctx.rangeExplicit && ctx.range[0] === x && ctx.range[1] === x)
  if ((t === 1 || n === 1) && !(asked(1))) return 0.25
  if ((t === 10 || n === 10) && !(asked(10))) return 0.4
  return 1
}

// ---------------------------------------------------------------- universe

function addItem(map: Map<SkillKey, UniverseItem>, skill: SkillKey, kind: ExerciseKind, weight: number) {
  const cur = map.get(skill)
  if (cur) {
    if (!cur.kinds.includes(kind)) cur.kinds.push(kind)
    cur.weight = Math.max(cur.weight, weight)
  } else map.set(skill, { skill, kinds: [kind], weight })
}

function kindUniverse(kind: ExerciseKind, ctx: Ctx): UniverseItem[] {
  const map = new Map<SkillKey, UniverseItem>()
  const [lo, hi] = ctx.range
  switch (kind) {
    case 'fact-mul':
    case 'missing-factor':
      for (const t of factTables(ctx)) for (let n = lo; n <= hi; n++) addItem(map, mulSkill(t, n), kind, factWeight(t, n, ctx))
      break
    case 'fact-div':
      for (const t of factTables(ctx)) {
        for (let n = lo; n <= hi; n++) {
          const p = t * n
          for (const d of new Set([t, n])) {
            const q = p / d
            if (d === 1 && !(ctx.tables?.length === 1 && ctx.tables[0] === 1)) continue
            const w = q === 1 ? 0.3 : d === 10 || q === 10 ? 0.5 : 1
            addItem(map, divSkill(p, d), kind, w)
          }
        }
      }
      break
    case 'double-chain':
      for (const t of factTables(ctx)) {
        if (t === 4 || t === 8) {
          for (let n = Math.max(2, lo); n <= hi; n++) addItem(map, mulSkill(t, n), kind, n === 10 ? 0.4 : 1)
        } else if (t >= 2) {
          addItem(map, mulSkill(t, 4), kind, 1)
          addItem(map, mulSkill(t, 8), kind, 1)
        }
      }
      if (map.size === 0) for (let n = 2; n <= 9; n++) addItem(map, mulSkill(8, n), kind, 1)
      break
    case 'skip-count': {
      const steps = (ctx.tables ?? []).filter((t) => t >= 2)
      for (const n of steps.length ? steps : range(2, 10)) addItem(map, skipSkill(n), kind, 1)
      break
    }
    case 'groups': addItem(map, conceptSkill('groups'), kind, 1); break
    case 'array': addItem(map, conceptSkill('array'), kind, 1); break
    case 'fact-family': addItem(map, conceptSkill('family'), kind, 1); break
    case 'column-add': {
      const d = ctx.digits ?? 3
      for (const k of regroupCounts(ctx.regroup, maxCarries(d))) addItem(map, addSkill(d, k), kind, k === 0 && ctx.regroup === 'any' ? 0.6 : 1)
      break
    }
    case 'column-sub': {
      if (ctx.zeros === true) {
        addItem(map, subSkill(Math.max(3, ctx.digits ?? 3), 0, true), kind, 1)
        break
      }
      const d = ctx.digits ?? 3
      for (const k of regroupCounts(ctx.regroup, d - 1)) addItem(map, subSkill(d, k), kind, k === 0 && ctx.regroup === 'any' ? 0.6 : 1)
      if (ctx.zeros === undefined && d >= 3 && (ctx.regroup === 'many' || ctx.regroup === 'any')) {
        addItem(map, subSkill(d, 0, true), kind, ctx.regroup === 'many' ? 0.5 : 0.6)
      }
      break
    }
    case 'column-mul':
      if (ctx.regroup !== 'one' && ctx.regroup !== 'many') addItem(map, mul2x1Skill(false), kind, ctx.regroup === 'any' ? 0.6 : 1)
      if (ctx.regroup !== 'none') addItem(map, mul2x1Skill(true), kind, 1)
      break
    case 'division':
      for (const v of ctx.variants) addItem(map, div2x1Skill(v), kind, 1)
      break
    case 'bar-problem':
      for (const op of BAR_OPS) addItem(map, barSkill(op), kind, 1)
      break
    case 'error-hunt':
      for (const op of HUNT_OPS) addItem(map, huntSkill(op), kind, 1)
      break
    case 'check-calc':
      for (const op of CHECK_OPS) addItem(map, checkSkill(op), kind, 1)
      break
    case 'word-problem':
      for (const op of wordOps(ctx)) addItem(map, wordSkill(op), kind, 1)
      break
    case 'clock-read': case 'clock-set': case 'time-convert': case 'time-duration': case 'calendar':
      for (const skill of clockSkillsOf(kind)) addItem(map, skill, kind, 1)
      break
    case 'fraction-shade': case 'fraction-read': case 'fraction-of': case 'fraction-equal': case 'fraction-add':
    case 'shape-choice': case 'angle-tap': case 'perimeter': case 'shape-count':
      for (const skill of blockSkillsOf(kind)) addItem(map, skill, kind, 1)
      break
    case 'money':
      for (const mode of MONEY_MODES) addItem(map, moneySkill(mode), kind, 1)
      break
    case 'measure':
      for (const dim of ['length', 'mass', 'capacity'] as const) {
        addItem(map, measureSkill('unit', dim), kind, 1)
        addItem(map, measureSkill('convert', dim), kind, 1)
        addItem(map, measureSkill('convert', dim, true), kind, 1)
      }
      for (const skill of ['measure:ruler', 'measure:add', 'measure:estimate']) addItem(map, skill, kind, 1)
      break
    case 'chart':
      for (const v of CHART_SKILLS) addItem(map, `chart:${v}`, kind, 1)
      break
    case 'chance':
      addItem(map, 'prob:chance', kind, 1)
      addItem(map, 'prob:likely', kind, 1)
      break
    case 'mul-parts':
      addItem(map, 'mul:2dx2d', kind, 1)
      addItem(map, 'mul:3dx2d', kind, 1)
      break
    case 'long-mul':
      for (const [t, b] of [[2, 2], [3, 2], [3, 3]] as const) addItem(map, mulColSkill(t, b), kind, 1)
      break
    case 'ordinal':
      for (const max of [10, 20, 30] as const) addItem(map, ordinalSkill(max), kind, 1)
      break
    case 'decimal': case 'decimal-op':
      for (const skill of blockSkillsOf(kind)) addItem(map, skill, kind, 1)
      break
    case 'area':
      addItem(map, 'geo:area', kind, 1)
      break
    case 'pattern':
      for (const v of PATTERN_SKILLS) addItem(map, `pattern:${v}`, kind, 1)
      break
    case 'position':
      for (const v of POSITION_SKILLS) addItem(map, `pos:${v}`, kind, 1)
      break
    default: {
      const skills = kind === 'mental' ? mentalSkillsOf() : kind === 'equation' ? ['eq:flex', 'eq:same'] : numericSkillsOf(kind)
      for (const skill of skills) addItem(map, skill, kind, 1)
    }
  }
  return [...map.values()]
}

function wordOps(ctx: Ctx): WordOp[] {
  const ops = new Set<WordOp>()
  if (ctx.tables) { ops.add('mul'); ops.add('div') }
  if (ctx.zeros) ops.add('sub')
  else if (ctx.digits !== undefined && ctx.digits >= 3) { ops.add('add'); ops.add('sub') }
  else if (ctx.regroupExplicit) { ops.add('add'); ops.add('sub') }
  if (ctx.variantsExplicit) ops.add('div')
  if (ctx.digits === 2 && !ctx.tables) { ops.add('mul'); ops.add('div') }
  return ops.size ? [...ops] : ['add', 'sub', 'mul', 'div']
}

interface Group {
  items: UniverseItem[]
}

function buildGroups(sel: SkillSelector, ctx: Ctx): Group[] {
  const kinds = inferKinds(sel)
  if (sel.skills && sel.skills.length) {
    const explicitKinds = sel.kinds && sel.kinds.length ? kinds : null
    const map = new Map<SkillKey, UniverseItem>()
    for (const skill of sel.skills) {
      const all = kindsForSkill(skill)
      if (all.length === 0) continue
      const allowed = explicitKinds ? all.filter((k) => explicitKinds.includes(k)) : [all[0]]
      for (const k of allowed) addItem(map, skill, k, 1)
    }
    if (map.size === 0) {
      for (const skill of sel.skills) { const k = kindsForSkill(skill)[0]; if (k) addItem(map, skill, k, 1) }
    }
    if (map.size > 0) return [{ items: [...map.values()] }]
  }
  return kinds.map((k) => ({ items: kindUniverse(k, ctx) })).filter((g) => g.items.length > 0)
}

// ---------------------------------------------------------------- planning

/** The kinds a planned skill may be built as (its own group's kinds, else its natural kind). */
function kindsOf(skill: SkillKey, groups: Group[]): ExerciseKind[] {
  const found = groups.flatMap((g) => g.items.filter((it) => it.skill === skill).flatMap((it) => it.kinds))
  return found.length ? found : kindsForSkill(skill)
}

/** Ids an item can produce (only enumerable for fact kinds) — used to steer away from avoidIds. */
function possibleIds(skill: SkillKey, kind: ExerciseKind): string[] | null {
  const p = parseSkill(skill)
  if (!p) return null
  if (p.type === 'mul' && kind === 'fact-mul') return [...new Set([`fact-mul:${p.a}x${p.b}`, `fact-mul:${p.b}x${p.a}`])]
  if (p.type === 'div' && kind === 'fact-div') return [`fact-div:${p.p}/${p.d}`]
  if (p.type === 'mul' && kind === 'missing-factor') {
    const prod = p.a * p.b
    return [...new Set([`missing-factor:?x${p.b}=${prod}`, `missing-factor:${p.a}x?=${prod}`, `missing-factor:?x${p.a}=${prod}`, `missing-factor:${p.b}x?=${prod}`])]
  }
  return null
}

function isFullyAvoided(item: UniverseItem, avoid: Set<string>): boolean {
  if (avoid.size === 0) return false
  return item.kinds.every((k) => {
    const ids = possibleIds(item.skill, k)
    return ids !== null && ids.every((id) => avoid.has(id))
  })
}

function weightedOrder(rng: Rng, items: UniverseItem[]): UniverseItem[] {
  const rest = items.slice()
  const out: UniverseItem[] = []
  while (rest.length) {
    const i = weightedIndex(rng, rest.map((x) => x.weight))
    out.push(rest.splice(i, 1)[0])
  }
  return out
}

function planUniform(rng: Rng, items: UniverseItem[], n: number): UniverseItem[] {
  const out: UniverseItem[] = []
  while (out.length < n) {
    const order = weightedOrder(rng, items)
    for (const it of order) {
      if (out.length >= n) break
      // When cycling, don't repeat the previous pick immediately.
      if (out.length && out[out.length - 1].skill === it.skill && items.length > 1) continue
      out.push(it)
    }
  }
  return out
}

/** Per call: how many brand-new hard facts may still be introduced, and which ones were introduced by any kind. */
interface NewBudget { hardFacts: number; introduced: Set<SkillKey> }

function isBudgeted(skill: SkillKey): boolean {
  return isFactSkill(skill) && !isEasyFact(skill)
}

function planAdaptive(
  rng: Rng, items: UniverseItem[], n: number, mastery: MasteryMap, now: Date, budget: NewBudget,
): { item: UniverseItem; isNew: boolean }[] {
  const nowMs = now.getTime()
  const seen: { item: UniverseItem; due: boolean; weak: boolean; box: number; dueMs: number }[] = []
  const fresh: UniverseItem[] = []
  for (const it of items) {
    const m = mastery[it.skill]
    if (!m) { fresh.push(it); continue }
    const dueMs = m.dueAt ? Date.parse(m.dueAt) : -Infinity
    seen.push({ item: it, due: dueMs <= nowMs, weak: m.box <= 1, box: m.box, dueMs })
  }
  // Due & weak first, then due, then weak, then the rest (soonest due first). Ties broken randomly-but-seeded.
  const tieBreak = new Map(seen.map((s) => [s.item.skill, rng()]))
  const rank = (s: (typeof seen)[number]) => (s.due && s.weak ? 0 : s.due ? 1 : s.weak ? 2 : 3)
  seen.sort((x, y) => rank(x) - rank(y) || x.box - y.box || x.dueMs - y.dueMs || tieBreak.get(x.item.skill)! - tieBreak.get(y.item.skill)!)

  const freshOrdered = weightedOrder(rng, fresh)
  const target = fresh.length === 0 ? 0 : Math.max(seen.length === 0 ? n : n >= 3 ? 1 : 0, Math.round(n * 0.3), n - seen.length * 2)
  const chosenNew: UniverseItem[] = []
  for (const it of freshOrdered) {
    if (chosenNew.length >= Math.min(target, n)) break
    if (isBudgeted(it.skill)) {
      if (budget.hardFacts <= 0) continue
      budget.hardFacts--
      budget.introduced.add(it.skill)
    }
    chosenNew.push(it)
  }
  // First pass: every chosen new item once, then the seen items in priority order (due/weak first).
  const out: { item: UniverseItem; isNew: boolean }[] = chosenNew.map((item) => ({ item, isNew: true }))
  for (const s of seen) {
    if (out.length >= n) break
    out.push({ item: s.item, isNew: false })
  }
  // Repeats (small pools): share them between the most urgent seen items and the new ones (hard new facts first,
  // they need the extra exposure), instead of hammering the same two known facts.
  if (out.length < n && out.length > 0) {
    const repeatNew = chosenNew
      .map((item, k) => ({ item, k }))
      .sort((x, y) => Number(isBudgeted(y.item.skill)) - Number(isBudgeted(x.item.skill)) || y.item.weight - x.item.weight || x.k - y.k)
      .map(({ item }) => ({ item, isNew: true }))
    const repeatSeen = seen.map((s) => ({ item: s.item, isNew: false }))
    const cycle: { item: UniverseItem; isNew: boolean }[] = []
    for (let k = 0; k < Math.max(repeatSeen.length, repeatNew.length); k++) {
      if (k < repeatSeen.length) cycle.push(repeatSeen[k])
      if (k < repeatNew.length) cycle.push(repeatNew[k])
    }
    for (let k = 0; out.length < n; k++) out.push(cycle[k % cycle.length])
  }
  if (out.length < n) {
    // Nothing seen and no new item allowed by the budget: practise what is allowed (easy facts, or hard facts
    // already introduced by another kind in this call). Never a new hard fact beyond the budget.
    const reachable = items.filter((it) => !isBudgeted(it.skill) || !!mastery[it.skill] || budget.introduced.has(it.skill))
    if (reachable.length) {
      for (const item of planUniform(rng, reachable, n - out.length)) out.push({ item, isNew: !mastery[item.skill] })
    }
  }
  return out
}

/** Order the plan: no skill twice in a row (when possible) and a familiar item first. Greedy: after a random
    shuffle, always continue with the most frequent remaining skill that differs from the previous one. */
function orderPlan(rng: Rng, plan: Planned[]): Planned[] {
  const rest = shuffle(rng, plan)
  const seq: Planned[] = []
  while (rest.length) {
    const prev = seq.length ? seq[seq.length - 1].skill : null
    const counts = new Map<SkillKey, number>()
    for (const p of rest) counts.set(p.skill, (counts.get(p.skill) ?? 0) + 1)
    let best = -1
    for (let i = 0; i < rest.length; i++) {
      const p = rest[i]
      if (p.skill === prev) continue
      if (best < 0) { best = i; continue }
      const b = rest[best]
      const better = seq.length === 0
        ? (b.isNew && !p.isNew) || (b.isNew === p.isNew && counts.get(p.skill)! > counts.get(b.skill)!)
        : counts.get(p.skill)! > counts.get(b.skill)!
      if (better) best = i
    }
    seq.push(rest.splice(best < 0 ? 0 : best, 1)[0])
  }
  return seq
}

// ---------------------------------------------------------------- building

const FACT_RANGE_2_9 = (ctx: Ctx) => {
  const r = range(Math.max(2, ctx.range[0]), Math.min(9, ctx.range[1]))
  return r.length ? r : range(2, 9)
}

const TABLES_2_9 = (ctx: Ctx) => (ctx.tables ?? []).filter((t) => t >= 2 && t <= 9)

function firstUnused<T extends Exercise>(cands: T[], used: Set<string>): T {
  return cands.find((c) => !used.has(c.id)) ?? cands[0]
}

/** Try `make` several times until it yields an id not used yet. */
function retry<T extends Exercise>(make: () => T | null, used: Set<string>, rng: Rng, tries = 16): T | null {
  let first: T | null = null
  for (let i = 0; i < tries; i++) {
    const ex = make()
    if (!ex) continue
    if (!used.has(ex.id)) return ex
    if (!first) first = ex
    // Desynchronise from the sequence that produced the colliding item (e.g. a replay with the same seed).
    for (let k = 0; k <= i; k++) rng()
  }
  return first
}

function buildFact(kind: ExerciseKind, p: Extract<ParsedSkill, { type: 'mul' }>, ctx: Ctx, rng: Rng, used: Set<string>): Exercise {
  const { a, b } = p
  const orient: [number, number][] = a === b ? [[a, b]] : shuffle(rng, [[a, b], [b, a]] as [number, number][])
  if (kind === 'fact-mul') return firstUnused(orient.map(([x, y]) => makeFactMul(x, y)), used)
  if (kind === 'missing-factor') {
    const tables = ctx.tables ?? []
    const cands = orient.flatMap(([x, y]) => {
      // Keep the table factor visible most of the time: "6 × ? = 42".
      const hideY = tables.includes(x) && !tables.includes(y) ? true : tables.includes(y) && !tables.includes(x) ? false : rng() < 0.5
      const preferred = hideY ? 'b' : 'a'
      const other = hideY ? 'a' : 'b'
      return rng() < 0.75 ? [makeMissingFactor(x, y, preferred), makeMissingFactor(x, y, other)] : [makeMissingFactor(x, y, other), makeMissingFactor(x, y, preferred)]
    })
    return firstUnused(cands, used)
  }
  // double-chain
  const opts: [number, number][] = []
  const tables = ctx.tables ?? []
  if (a === 8 || b === 8) opts.push([a === 8 ? b : a, 3])
  if (a === 4 || b === 4) opts.push([a === 4 ? b : a, 2])
  const preferred = opts.filter(([, steps]) => tables.includes(2 ** steps))
  const choice = shuffle(rng, preferred.length ? preferred : opts)
  return firstUnused(choice.map(([start, steps]) => makeDoubleChain(start, steps)), used)
}

function hiddenFor(rng: Rng, length: number, count: number): number[] {
  for (let attempt = 0; attempt < 20; attempt++) {
    const idx = shuffle(rng, range(2, length - 1)).slice(0, count).sort((x, y) => x - y)
    if (idx.every((v, i) => i === 0 || v - idx[i - 1] > 1)) return idx
  }
  return shuffle(rng, range(2, length - 1)).slice(0, count).sort((x, y) => x - y)
}

function buildSkip(n: number, rng: Rng, used: Set<string>): Exercise {
  return retry(() => {
    const full = rng() < 0.65
    const start = full ? 1 : randInt(rng, 2, 4)
    const length = full ? 10 : 7
    const hidden = hiddenFor(rng, length, full ? randInt(rng, 3, 4) : randInt(rng, 2, 3))
    return makeSkipCount(n, start, length, hidden)
  }, used, rng)!
}

/** [groups, perGroup] (or [rows, cols]) for the manipulative kinds. factorRange bounds both numbers (the table, when
    given, is the size of each group / row); otherwise small numbers that are easy to count on screen. */
function smallPair(ctx: Ctx, rng: Rng, maxGroups: number, maxPer: number): [number, number] {
  const tables = (ctx.tables ?? []).filter((t) => t >= 2)
  const r = ctx.rangeExplicit ? range(Math.max(1, ctx.range[0]), ctx.range[1]) : range(2, maxGroups)
  const count = r.length ? r : range(2, maxGroups)
  if (tables.length) return [pick(rng, count), pick(rng, tables)]
  if (ctx.rangeExplicit) return [pick(rng, count), pick(rng, count)]
  return [randInt(rng, 2, maxGroups), randInt(rng, 2, maxPer)]
}

function buildConcept(kind: ExerciseKind, skill: SkillKey, ctx: Ctx, rng: Rng, used: Set<string>): Exercise {
  switch (kind) {
    case 'groups':
      return retry(() => { const [g, k] = smallPair(ctx, rng, 6, 5); return makeGroups(g, k, pick(rng, EMOJIS)) }, used, rng)!
    case 'array':
      return retry(() => { const [r, c] = smallPair(ctx, rng, 5, 6); return makeArray(r, c, pick(rng, EMOJIS), skill) }, used, rng)!
    default: // fact-family
      return retry(() => {
        const tables = TABLES_2_9(ctx)
        const a = pick(rng, tables.length ? tables : range(2, 9))
        const bs = FACT_RANGE_2_9(ctx).filter((x) => x !== a)
        const b = pick(rng, bs.length ? bs : range(2, 9).filter((x) => x !== a))
        return rng() < 0.5 ? makeFactFamily(a, b) : makeFactFamily(b, a)
      }, used, rng)!
  }
}

function carriesFor(ctx: Ctx, digits: number, rng: Rng): number {
  return pick(rng, regroupCounts(ctx.regroup, maxCarries(digits)))
}

function addNumbers(rng: Rng, digits: number, carries: number): [number, number] {
  const second = digits === 4 && rng() < 0.2 ? 3 : digits
  const r = genAddOperands(rng, digits, carries, second) ?? genAddOperands(rng, digits, carries) ?? genAddOperands(rng, digits, Math.min(carries, maxCarries(digits)))
  return r ?? [10 ** (digits - 1) + 1, 10 ** (digits - 1) + 2]
}

function subNumbers(rng: Rng, digits: number, target: number | 'z'): [number, number] {
  const second = digits >= 3 && rng() < 0.3 ? digits - 1 : digits
  const r = genSubPair(rng, digits, target, second) ?? genSubPair(rng, digits, target)
  return r ?? [10 ** digits - 1, 10 ** (digits - 1)]
}

function buildColumn(p: ParsedSkill, skill: SkillKey, ctx: Ctx, rng: Rng, used: Set<string>): Exercise {
  if (p.type === 'add' || (p.type === 'concept' && p.name === 'placevalue')) {
    const digits = p.type === 'add' ? p.digits : 3
    const carries = p.type === 'add' ? p.carries : 0
    const capped = p.type === 'add' && p.max === 999
    return retry(() => {
      const [a, b] = capped
        ? genAddOperands(rng, digits, carries, digits, true) ?? [123, 456]
        : addNumbers(rng, digits, Math.min(carries, maxCarries(digits)))
      const ops = digitCount(a) === digitCount(b) && rng() < 0.5 ? [b, a] : [a, b]
      return makeColumnAdd(ops, p.type === 'concept' || capped ? skill : undefined)
    }, used, rng)!
  }
  if (p.type === 'sub') {
    return retry(() => { const [m, s] = subNumbers(rng, p.digits, p.zero ? 'z' : p.borrows!); return makeColumnSub(m, s) }, used, rng)!
  }
  if (p.type === 'mul2x1') {
    return retry(() => {
      const r = genMul2x1(rng, p.carry, TABLES_2_9(ctx)) ?? genMul2x1(rng, p.carry)
      return r ? makeColumnMul(r[0], r[1]) : null
    }, used, rng)!
  }
  // division
  const variant = p.type === 'div2x1' ? p.variant : 'exact'
  return retry(() => { const [dd, dv] = genDivision(rng, variant, TABLES_2_9(ctx)); return makeDivision(dd, dv) }, used, rng)!
}

/** A bar problem. The ladder: until the child has mastered the bar of the operation, the drawing is shown. */
function buildBar(op: BarSkillOp, skill: SkillKey, ctx: Ctx, rng: Rng, small = false): Exercise {
  const withBar = (ctx.mastery?.[skill]?.box ?? -1) < 2
  return genBarProblem(op, rng, withBar, small)
}

/** A 3-digit dividend (100..999) by a 1-digit divisor: exact (no remainder) or with a remainder. */
export function genDivision3(rng: Rng, withRemainder: boolean): [number, number] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const d = randInt(rng, 2, 9)
    const r = withRemainder ? randInt(rng, 1, d - 1) : 0
    const qMin = Math.ceil((100 - r) / d)
    const qMax = Math.floor((999 - r) / d)
    if (qMax < qMin) continue
    const q = randInt(rng, Math.max(qMin, 11), qMax)
    return [d * q + r, d]
  }
  return [372, 4]
}

function buildWord(p: ParsedSkill, ctx: Ctx, rng: Rng, used: Set<string>): Exercise {
  const op: WordOp = p.type === 'word' ? p.op : p.type === 'add' ? 'add' : p.type === 'sub' ? 'sub' : p.type === 'mul2x1' ? 'mul' : 'div'
  const tables = TABLES_2_9(ctx)
  const fixedAllowed = (f: number) => !ctx.tables || ctx.tables.includes(f)
  // Prefer stories not told yet in this call (or recently, via avoidIds).
  const told = new Set([...used].filter((id) => id.startsWith('word-problem:')).map((id) => id.split(':')[1]))
  const pickTpl = <T extends { id: string }>(tpls: T[]): T => {
    const fresh = tpls.filter((t) => !told.has(t.id))
    return pick(rng, fresh.length ? fresh : tpls)
  }
  const make = (): Exercise | null => {
    let a: number
    let b: number
    let digits: number
    if (op === 'add' || op === 'sub') {
      digits = p.type === 'add' || p.type === 'sub' ? p.digits : ctx.digits ?? pick(rng, [3, 3, 4])
      if (op === 'add') {
        const carries = p.type === 'add' ? Math.min(p.carries, maxCarries(digits)) : carriesFor(ctx, digits, rng)
        ;[a, b] = addNumbers(rng, digits, carries)
      } else {
        let target: number | 'z'
        if (p.type === 'sub') target = p.zero ? 'z' : p.borrows!
        else if (ctx.zeros === true && digits >= 3) target = 'z'
        else target = pick(rng, regroupCounts(ctx.regroup, digits - 1))
        ;[a, b] = subNumbers(rng, digits, target)
      }
      const tpls = templatesFor(op, digits, fixedAllowed)
      if (!tpls.length) return null
      const t = pickTpl(tpls)
      return makeWordProblem(t.id, fillTemplate(t.text, a, b), op, a, b, t.unit)
    }
    const big = p.type === 'mul2x1' || p.type === 'div2x1' || (p.type === 'word' && (ctx.digits === 2 || (op === 'div' && ctx.variantsExplicit)))
    if (op === 'mul') {
      if (big) {
        const carry = p.type === 'mul2x1' ? p.carry : ctx.regroup === 'none' ? false : ctx.regroup === 'any' ? rng() < 0.6 : true
        const r = genMul2x1(rng, carry, tables) ?? genMul2x1(rng, carry)
        if (!r) return null
        ;[b, a] = r
        const tpls = templatesFor('mul', 2, fixedAllowed)
        const t = pickTpl(tpls)
        return makeWordProblem(t.id, fillTemplate(t.text, a, b), 'mul', a, b, t.unit)
      }
      const t = pickTpl(templatesFor('mul', 1, fixedAllowed))
      b = t.fixed ?? pick(rng, tables.length ? tables : range(2, 9))
      a = pick(rng, FACT_RANGE_2_9(ctx))
      return makeWordProblem(t.id, fillTemplate(t.text, a, b), 'mul', a, b, t.unit)
    }
    // div
    if (big) {
      const allowed = (p.type === 'div2x1' ? [p.variant] : ctx.variants).filter((v) => v !== 'rem')
      const variant = pick(rng, allowed.length ? allowed : ['exact'] as DivisionVariant[])
      const t = pickTpl(templatesFor('div', 2, fixedAllowed))
      ;[a, b] = genDivision(rng, variant, t.fixed ? [t.fixed] : tables)
      if (t.fixed && b !== t.fixed) return null
      return makeWordProblem(t.id, fillTemplate(t.text, a, b), 'div', a, b, t.unit)
    }
    const t = pickTpl(templatesFor('div', 2, fixedAllowed).concat(templatesFor('div', 1, fixedAllowed)))
    b = t.fixed ?? pick(rng, tables.length ? tables : range(2, 9))
    const q = pick(rng, FACT_RANGE_2_9(ctx))
    a = b * q
    digits = digitCount(a)
    if (digits < t.minDigits || digits > t.maxDigits) return null
    return makeWordProblem(t.id, fillTemplate(t.text, a, b), 'div', a, b, t.unit)
  }
  return retry(make, used, rng, 24) ?? makeWordProblem('add-peces', fillTemplate('En el río nadan {a} peces dorados y {b} peces azules. ¿Cuántos peces hay en total?', 245, 132), 'add', 245, 132, 'peces')
}

/** Fractions and geometry (blocks E). The ladder: fraction of a quantity and perimeter start with the drawing and
    move to the numbers (or the story) once the skill is learnt (mastery box 2 or more). */
function buildBlock(skill: SkillKey, p: ParsedSkill, ctx: Ctx, rng: Rng, used: Set<string>): Exercise {
  const learnt = (ctx.mastery?.[skill]?.box ?? -1) >= 2
  if (p.type === 'fraction') {
    switch (p.op) {
      case 'shade': return retry(() => genFractionShade(rng, p.d), used, rng)!
      case 'read': return retry(() => genFractionRead(rng, p.d), used, rng)!
      case 'name': return retry(() => genFractionName(rng, p.d), used, rng)!
      case 'of': return retry(() => genFractionOf(rng, p.d, learnt ? 'numbers' : 'drawing', pick(rng, ['🍬', '🌸'] as const)), used, rng)!
      case 'equal': return retry(() => genFractionEqual(rng), used, rng)!
      case 'compare': return retry(() => genFractionCompare(rng), used, rng)!
      case 'add': case 'sub': return retry(() => genFractionAdd(rng, p.op as 'add' | 'sub', learnt ? 'numbers' : 'drawing'), used, rng)!
    }
  }
  if (p.type === 'geo') {
    return retry(() => genGeometry(p.op, rng, learnt ? 'story' : 'drawing') as Exercise, used, rng)!
  }
  throw new Error(`engine.generate: '${skill}' is not a fraction or geometry skill`)
}

export function buildExercise(kind: ExerciseKind, skill: SkillKey, ctx: Ctx, rng: Rng, used: Set<string>): Exercise {
  const p = parseSkill(skill)
  if (!p) throw new Error(`engine.generate: unknown skill '${skill}'`)
  if (kind === 'word-problem') return buildWord(p, ctx, rng, used)
  // Tiempo (block D): the clock and calendar generators (src/engine/clock.ts). Read items show the phrase while the child learns.
  if (p.type === 'clock-read' || p.type === 'clock-set' || p.type === 'clock-convert' || p.type === 'time-duration' || p.type === 'calendar') {
    const writeMode = p.type === 'clock-read' && (ctx.mastery?.[skill]?.box ?? 0) >= 2
    const built = buildClock(skill, rng, used, writeMode, (ctx.mastery?.[skill]?.box ?? -1) >= 2)
    if (built) return built
  }
  if (NUMERIC_KINDS.includes(kind)) {
    // Numbers up to 9 999 and cálculo mental: their own generators (src/engine/numeric.ts, calc.ts).
    if (p.type === 'mental') return buildMental(p.family, rng, used)
    if (p.type === 'equation') return buildEquation(rng, used, p.mode)
    const built = buildNumericExercise(kind, skill, rng, used, ctx.digits)
    if (built) return built
  }
  if (p.type === 'fraction' || p.type === 'geo') return buildBlock(skill, p, ctx, rng, used)
  if (p.type === 'money') return buildMoney(p.mode, rng, used, p.whole === true)
  if (p.type === 'measure') return buildMeasure(p.mode, p.dimension, rng, used, p.all === true, (ctx.mastery?.[skill]?.box ?? -1) >= 2)
  if (p.type === 'chart') return retry(() => buildChart(p.variant, rng), used, rng)!
  if (p.type === 'chance') return retry(() => (p.variant === 'likely' ? buildLikely(rng) : buildChance(rng)), used, rng)!
  if (p.type === 'pattern') return retry(() => buildPattern(p.variant, rng), used, rng)!
  if (p.type === 'position') return retry(() => buildPosition(p.variant, rng), used, rng)!
  if (p.type === 'bar') return buildBar(p.op, skill, ctx, rng, p.small)
  if (p.type === 'hunt') return genErrorHunt(p.op, rng, rng() < 0.6)
  if (p.type === 'check') return genCheckCalc(p.op, rng, rng() < 0.5)
  if (p.type === 'mul3x1') return retry(() => genMul3x1(rng, p.carry), used, rng)!
  if (p.type === 'div4x1') return retry(() => genDivision4(rng, p.variant === 'rem'), used, rng)!
  if (p.type === 'div3x2') return retry(() => genDivision2d(rng, p.variant === 'rem'), used, rng)!
  if (p.type === 'mulParts') return retry(() => genMulParts(rng, p.digits), used, rng)!
  if (p.type === 'mulCol') return retry(() => genLongMul(rng, p.top, p.bottom), used, rng)!
  if (p.type === 'ordinal') return retry(() => genOrdinal(rng, p.top), used, rng)!
  if (p.type === 'decimal') return retry(() => genDecimal(rng, p.mode, p.places), used, rng)!
  if (p.type === 'decimal-op') return retry(() => genDecimalOp(rng, p.op, p.places), used, rng)!
  if (p.type === 'div3x1') {
    return retry(() => {
      const [dd, dv] = genDivision3(rng, p.variant === 'rem')
      return makeDivision3(dd, dv)
    }, used, rng)!
  }
  switch (p.type) {
    case 'mul':
      return buildFact(kind, p, ctx, rng, used)
    case 'div':
      return makeFactDiv(p.p, p.d)
    case 'skip':
      return buildSkip(p.n, rng, used)
    case 'concept':
      if (p.name === 'share') {
        return retry(() => {
          const tables = TABLES_2_9(ctx)
          const d = pick(rng, tables.length ? tables : range(2, 9))
          const q = pick(rng, FACT_RANGE_2_9(ctx))
          return makeFactDiv(d * q, d, skill)
        }, used, rng)!
      }
      if (p.name === 'commutative' && kind === 'fact-mul') {
        return retry(() => {
          const tables = TABLES_2_9(ctx)
          const x = pick(rng, tables.length ? tables : range(2, 9))
          const y = pick(rng, FACT_RANGE_2_9(ctx))
          const ex = rng() < 0.5 ? makeFactMul(x, y) : makeFactMul(y, x)
          return { ...ex, skill }
        }, used, rng)!
      }
      if (p.name === 'placevalue') return buildColumn(p, skill, ctx, rng, used)
      return buildConcept(kind, skill, ctx, rng, used)
    default:
      return buildColumn(p, skill, ctx, rng, used)
  }
}

// ---------------------------------------------------------------- public

function seedFor(sel: SkillSelector, now?: Date): number {
  const base = hashString(JSON.stringify(sel))
  return (base ^ (now ? now.getTime() : Date.now())) >>> 0
}

/** Generate `count` exercises matching the selector. Never returns duplicates within one call when avoidable. */
export function generate(selector: SkillSelector, count: number, opts: GenerateOptions = {}): Exercise[] {
  const n = Math.max(0, Math.floor(count))
  if (n === 0) return []
  const rng = opts.rng ?? createRng(seedFor(selector, opts.now))
  const now = opts.now ?? new Date()
  const ctx: Ctx = { ...resolveContext(selector), mastery: opts.mastery }
  let groups = buildGroups(selector, ctx)
  if (groups.length === 0) groups = [{ items: kindUniverse('fact-mul', ctx) }]
  const avoid = new Set(opts.avoidIds ?? [])

  // Split the count evenly between groups (kinds); the remainder goes to random groups.
  const shares = groups.map(() => Math.floor(n / groups.length))
  for (const gi of shuffle(rng, range(0, groups.length - 1)).slice(0, n - shares.reduce((s, x) => s + x, 0))) shares[gi]++

  const budget: NewBudget = { hardFacts: 3, introduced: new Set() }
  const planned: Planned[] = []
  groups.forEach((g, gi) => {
    const share = shares[gi]
    if (share === 0) return
    const fresh = g.items.filter((it) => !isFullyAvoided(it, avoid))
    const items = fresh.length ? fresh : g.items
    const chosen = selector.adaptive && opts.mastery
      ? planAdaptive(rng, items, share, opts.mastery, now, budget)
      : planUniform(rng, items, share).map((item) => ({ item, isNew: false }))
    for (const { item, isNew } of chosen) planned.push({ skill: item.skill, kind: pick(rng, item.kinds), isNew })
  })
  // A kind with nothing allowed left still has to deliver its share: repeat what was planned (never a new fact).
  const planCount = planned.length
  for (let k = 0; planCount > 0 && planned.length < n; k++) {
    const again = planned[k % planCount]
    planned.push({ ...again, kind: pick(rng, kindsOf(again.skill, groups)), isNew: false })
  }

  const used = new Set(avoid)
  const out: Exercise[] = []
  for (const p of orderPlan(rng, planned)) {
    const ex = buildExercise(p.kind, p.skill, ctx, rng, used)
    used.add(ex.id)
    out.push(ex)
  }
  return out
}
