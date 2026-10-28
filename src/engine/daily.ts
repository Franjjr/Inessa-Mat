/* The 15-minute daily session (docs/curriculum/PLAN_DOCENTE.md §3, DIDACTICA §4.2). Pure: no React, no I/O.
     Calentamiento (0–2 min)  3–4 facts from earlier days, mental, no hints
     Lo nuevo (2–7 min)       the current topic of the syllabus: worked example if needed, 4–6 items,
                              at most NEW_FACT_BUDGET brand-new hard facts per session (E6)
     Mezcla (7–12 min)        6–8 items from different skills, most urgent first, interleaved (E5)
     Problema (12–14 min)     one word problem
   Failed items come back later in the same run (src/activities/shared/requeue.ts) and on later days (mastery).
   Scaffolding: a multiplication fact failed twice in the last days is shown as an array (dibujo) until answered
   correctly without hints. The planner only decides WHAT is asked; the runner in src/world/session shows it. */
import type { AttemptRecord, ChildProfile, Exercise, ExerciseKind, MasteryMap, ReadingDef, Rng, SkillKey, SkillMastery } from '@/types'
import { availableSkills, behindTopics, currentTopic, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
import { makeArray } from './make'
import { statementClock } from './clock'
import { generate } from './generate'
import { lenguaStatement } from './lengua/exercises'
import { hintsFor } from './hints'
import { fmt, numberWords, roundWords } from './numeric'
import { moneyStatement } from './money'
import { measureStatement } from './measure'
import { dataStatement } from './data'
import { patternStatement } from './patterns'
import { positionStatement } from './position'
import { mulPartsStatement } from './bigops'
import { ordinalPrompt } from './ordinals'
import { decimalWords, fmtDecimal } from './decimals'
import { createRng, hashString } from './rng'
import { barSkill, huntSkill, isEasyFact, isFactSkill, isMentalSkill, parseSkill, type BarSkillOp, type HuntOp, type WordOp } from './skills'
import { attemptsOf, masteryOf } from './subjects'

export const DAILY_MINUTES = 15
/** Most brand-new hard facts (not in the easy 1/2/5/10 set) introduced in one session (PEDAGOGY 4, E6). */
export const NEW_FACT_BUDGET = 3
export const WARMUP_MAX = 4
/** Most cálculo mental items in the warm-up (learnt skills only; PLAN_DOCENTE §5, item 12). */
export const MENTAL_WARMUP_MAX = 2
export const NEW_MAX = 6
export const NEW_MIN = 4
export const MIX_MAX = 8
export const MIX_MIN = 6
/** The items must fill this much of the session (PLAN_DOCENTE §3: at least 12 of 15 minutes are exercises). */
export const PRACTICE_TARGET_SECONDS = 12 * 60
/** Most extra mix items added to reach PRACTICE_TARGET_SECONDS when the items are short. */
export const FILL_MAX = 8
/** Days a failure keeps asking for the visual support. */
export const SCAFFOLD_WINDOW_DAYS = 7
/** Estimated seconds per item, realistic for an 8-year-old writing the answer (used to check the 12-minute rule). */
export const ITEM_SECONDS: Record<ExerciseKind, number> = {
  'fact-mul': 12, 'fact-div': 15, 'missing-factor': 12, 'skip-count': 20, groups: 20, array: 20,
  'double-chain': 20, 'fact-family': 25, 'column-add': 50, 'column-sub': 55, 'column-mul': 45,
  division: 60, 'word-problem': 60, 'bar-problem': 75, 'error-hunt': 50, 'check-calc': 45,
  'place-value': 30, compare: 15, order: 35, round: 20, 'number-line': 25, mental: 15, equation: 20,
  'clock-read': 25, 'clock-set': 60, 'time-convert': 30, 'time-duration': 60, calendar: 25,
  'fraction-shade': 40, 'fraction-read': 35, 'fraction-of': 35, 'fraction-equal': 35, 'shape-choice': 20,
  'angle-tap': 35, perimeter: 45, 'shape-count': 20,
  money: 40, measure: 35, chart: 35, chance: 25, pattern: 30, position: 35, 'mul-parts': 90, area: 30, 'fraction-add': 35,
  'long-mul': 90, ordinal: 20, decimal: 40, 'decimal-op': 60,
  'lng-tap-words': 25, 'lng-sentence-parts': 30, 'lng-classify': 15, 'lng-transform': 30,
  'lng-missing-letter': 20, 'lng-punctuation': 40, 'lng-stress': 15, 'lng-syllables': 20, 'lng-dictation': 35,
  'lng-alphabet': 30, 'lng-pair-words': 20, 'lng-read-choice': 30, 'lng-read-text': 25, 'lng-read-order': 40,
}
/** One «encuentra el error» in every mix (PLAN_DOCENTE §3): the column operations of the temario, the weakest one first. */
const HUNT_OPS: HuntOp[] = ['add', 'sub', 'mul']
/** Reading the feedback and pressing «Siguiente», per item. */
export const ITEM_OVERHEAD_SECONDS = 5
export const EXAMPLE_SECONDS = 60

export type DailyBlockId = 'warmup' | 'new' | 'story' | 'mix' | 'problem'

export const DAILY_BLOCK_LABEL: Record<DailyBlockId, string> = {
  warmup: 'Calentamiento',
  new: 'Lo nuevo',
  story: 'Lectura',
  mix: 'Mezcla',
  problem: 'Problema',
}

export interface DailyItem {
  exercise: Exercise
  block: DailyBlockId
  /** Shown with a visual support (array) because the child failed this fact twice recently. */
  scaffold: boolean
  /** A fact the child has never met: counts against NEW_FACT_BUDGET. */
  isNew: boolean
  /** Extra mix item added so that the practice fills the session (short items, known facts). */
  filler?: boolean
  /** Lengua: the text of the story is shown before this (its first) question. */
  passage?: ReadingDef
  /** Lengua: the last question of this story; answering it marks the story read. */
  finishesReading?: string
}

export interface DailyPlan {
  /** The topic taught in «Lo nuevo» (null when every available topic is mastered). */
  topic: SyllabusTopic | null
  /** Worked example for «Lo nuevo»: not graded and not counted as practice. */
  example: { exercise: Exercise; statement: string; steps: string[] } | null
  blocks: { id: DailyBlockId; items: DailyItem[] }[]
  /** Estimated seconds of items (the example and the transitions are not counted). */
  practiceSeconds: number
  /** Brand-new hard facts introduced in this session (never above NEW_FACT_BUDGET). */
  newFactCount: number
  /** Lengua: the topic whose class comes before «Lo nuevo», when it has one and the child has not done it. */
  classTopicId?: string | null
}

const dayKey = (now: Date) => now.toISOString().slice(0, 10)
const DAY_MS = 24 * 60 * 60 * 1000

/** The prompt of a decimal exercise: the drawing is the question, or the words, the two numbers, the euros. */
function decimalStatement(ex: Extract<Exercise, { kind: 'decimal' }>): string {
  switch (ex.mode) {
    case 'shade': return '¿Qué número está coloreado? Escríbelo con coma.'
    case 'read': return `Escribe con cifras: ${decimalWords(ex)}`
    case 'compare': return `${fmtDecimal(ex.value, ex.places)} y ${fmtDecimal(ex.other ?? 0, ex.places)}: ¿qué signo va entre ellos?`
    case 'money': return `${fmtDecimal(ex.value, 2)} €: ¿cuántos euros y cuántos céntimos son?`
  }
}

/** Human statement of an exercise, for the worked example and for adults' reports. */
export function statementOf(ex: Exercise): string {
  switch (ex.kind) {
    case 'fact-mul': return `${ex.a} × ${ex.b} = ?`
    case 'fact-div': return `${ex.dividend} : ${ex.divisor} = ?`
    case 'missing-factor': return ex.missing === 'a' ? `? × ${ex.b} = ${ex.product}` : `${ex.a} × ? = ${ex.product}`
    case 'column-add': return ex.operands.join(' + ')
    case 'column-sub': return `${ex.minuend} − ${ex.subtrahend}`
    case 'column-mul': return `${ex.top} × ${ex.bottom}`
    case 'division': return `${ex.dividend} : ${ex.divisor} = ?`
    case 'word-problem': return ex.text
    case 'mental': return ex.prompt
    // The statements below name the question, never the answer (a blocks item shows no digits to read).
    case 'place-value':
      return ex.mode === 'blocks' ? 'Cuenta los bloques y escribe el número'
        : ex.mode === 'expanded' ? `Descompón ${fmt(ex.value)} en partes`
          : `Escribe con cifras: ${numberWords(ex.value)}`
    case 'compare': return `Compara ${fmt(ex.left)} y ${fmt(ex.right)}`
    case 'order': return `Ordena ${ex.values.map(fmt).join(', ')}`
    case 'round': return `Redondea ${fmt(ex.value)} a ${ex.to === 1000 ? 'los millares' : `las ${roundWords(ex.to).plural}`}`
    case 'number-line': return ex.mode === 'jump' ? `Salta ${fmt(ex.step)} desde ${fmt(ex.start ?? 0)}` : 'Mira la recta y busca la marca que falta'
    case 'equation': return `${ex.left.map((t) => (t === null ? '__' : String(t))).join(' ')} ${ex.mode === 'same' ? '?' : '='} ${ex.right.map((t) => (t === null ? '__' : String(t))).join(' ')}`
    case 'bar-problem': return ex.text
    case 'fraction-shade': return `Colorea ${ex.numerator} de ${ex.denominator} partes`
    case 'fraction-read': return 'Escribe la fracción que está coloreada'
    case 'fraction-of': return ex.story ?? `Calcula ${ex.numerator}/${ex.denominator} de ${fmt(ex.total)}`
    case 'fraction-equal': return 'Toca las figuras que no están partidas en partes iguales'
    case 'shape-choice': return ex.question
    case 'angle-tap': return 'Toca las esquinas que son ángulos rectos'
    case 'perimeter': return ex.text ?? 'Suma los lados para hallar el contorno'
    case 'shape-count': return ex.ask === 'sides' ? '¿Cuántos lados tiene?' : '¿Cuántas esquinas tiene?'
    case 'error-hunt': return `${ex.top} ${ex.op === 'add' ? '+' : ex.op === 'sub' ? '−' : '×'} ${ex.bottom} = ${ex.shown}`
    case 'money': return moneyStatement(ex)
    case 'measure': return measureStatement(ex)
    case 'chart': case 'chance': return dataStatement(ex) ?? ex.skill
    case 'pattern': return patternStatement(ex) ?? ex.skill
    case 'position': return positionStatement(ex) ?? ex.skill
    case 'mul-parts': return mulPartsStatement(ex)
    case 'long-mul': return `${fmt(ex.top)} × ${fmt(ex.bottom)} = ?`
    case 'ordinal': return ordinalPrompt(ex)
    case 'area': return '¿Cuántos cuadraditos ocupa la figura?'
    case 'fraction-add': return `${ex.a}/${ex.denominator} ${ex.op === 'add' ? '+' : '−'} ${ex.b}/${ex.denominator} = ?`
    case 'decimal': return decimalStatement(ex)
    case 'decimal-op': return `${fmtDecimal(ex.left, ex.places)} ${ex.op === 'add' ? '+' : '−'} ${fmtDecimal(ex.right, ex.places)} = ?`
    case 'lng-tap-words': case 'lng-sentence-parts': case 'lng-classify': case 'lng-transform': case 'lng-missing-letter':
    case 'lng-punctuation': case 'lng-stress': case 'lng-syllables': case 'lng-dictation': case 'lng-alphabet': case 'lng-pair-words':
    case 'lng-read-choice': case 'lng-read-text': case 'lng-read-order':
      return lenguaStatement(ex)
    case 'check-calc': return ex.op === 'add'
      ? `${ex.left} + ${ex.right} = ${ex.claimed}`
      : ex.op === 'sub' ? `${ex.left} − ${ex.right} = ${ex.claimed}` : `${ex.left} ÷ ${ex.right} = ${ex.claimed} resto ${ex.remainder ?? 0}`
    default: return statementClock(ex) ?? ex.skill
  }
}

/** Estimated seconds for one exercise as the session shows it. */
export function estimateSeconds(item: Pick<DailyItem, 'exercise' | 'scaffold'>): number {
  return (item.scaffold ? 20 : ITEM_SECONDS[item.exercise.kind] ?? 30) + ITEM_OVERHEAD_SECONDS
}

/** Skills the child should see with a visual support: the last two answers on the fact were wrong (recognition
    misreads excluded). A correct answer without hints ends the support; a correct answer with hints keeps it. */
export function scaffoldedSkills(attempts: readonly AttemptRecord[], now: Date): Set<SkillKey> {
  const since = now.getTime() - SCAFFOLD_WINDOW_DAYS * DAY_MS
  const out = new Set<SkillKey>()
  const bySkill = new Map<SkillKey, AttemptRecord[]>()
  for (const a of attempts) {
    if (Date.parse(a.createdAt) < since || !isFactSkill(a.skill)) continue
    const list = bySkill.get(a.skill) ?? []
    list.push(a) // attempts come newest first
    bySkill.set(a.skill, list)
  }
  for (const [skill, list] of bySkill) {
    let wrong = 0
    for (const a of list) {
      if (a.correct && a.hintsUsed === 0) break
      if (!a.correct && a.errorType !== 'recognition') {
        wrong += 1
        if (wrong >= 2) { out.add(skill); break }
      }
    }
  }
  return out
}

function familyOf(skill: SkillKey): string {
  return parseSkill(skill)?.type ?? 'other'
}

/** Mastery entries in urgency order: due and weak first, then due, then weak, then the rest. */
export function urgencyOrder(mastery: MasteryMap, now: Date): SkillMastery[] {
  const t = now.getTime()
  const rank = (m: SkillMastery) => {
    const due = m.dueAt === null || Date.parse(m.dueAt) <= t
    const weak = m.box <= 1
    return due && weak ? 0 : due ? 1 : weak ? 2 : 3
  }
  return Object.values(mastery)
    .filter((m): m is SkillMastery => !!m && parseSkill(m.skill) !== null && !['concept', 'word', 'bar'].includes(familyOf(m.skill)))
    .sort((x, y) =>
      rank(x) - rank(y) || x.box - y.box
      || (x.dueAt ?? '').localeCompare(y.dueAt ?? '') || x.skill.localeCompare(y.skill))
}

/** Picks up to `n` distinct skills, round-robin over families so that neighbours in the session differ. */
function interleavedPick(skills: SkillKey[], n: number, exclude: Set<SkillKey>): SkillKey[] {
  const buckets = new Map<string, SkillKey[]>()
  for (const s of skills) {
    if (exclude.has(s)) continue
    const f = familyOf(s)
    buckets.set(f, [...(buckets.get(f) ?? []), s])
  }
  const out: SkillKey[] = []
  const queues = [...buckets.values()]
  for (let i = 0; out.length < n && queues.some((q) => q.length); i++) {
    const q = queues[i % queues.length]
    if (q.length) out.push(q.shift()!)
  }
  return out
}

/** Worked example for the new topic: a fresh exercise of the skill (its own seed), with the hints as steps. */
function exampleFor(skill: SkillKey, rng: Rng, now: Date): DailyPlan['example'] {
  const [ex] = generate({ skills: [skill] }, 1, { rng: createRng(hashString(`example:${skill}:${rng()}`)), now })
  if (!ex) return null
  return { exercise: ex, statement: statementOf(ex), steps: hintsFor(ex).map((h) => h.text) }
}

function wordOpFor(topic: SyllabusTopic | null, mastery: MasteryMap): WordOp {
  const first = topic?.skills[0] ? parseSkill(topic.skills[0]) : null
  if (first) {
    if (first.type === 'word') return first.op
    if (first.type === 'add') return 'add'
    if (first.type === 'sub') return 'sub'
    if (first.type === 'mul' || first.type === 'mul2x1' || first.type === 'mul3x1' || first.type === 'mulParts') return 'mul'
    if (first.type === 'div' || first.type === 'div2x1' || first.type === 'div4x1' || first.type === 'div3x2') return 'div'
  }
  const count: Record<WordOp, number> = { add: 0, sub: 0, mul: 0, div: 0 }
  for (const m of Object.values(mastery)) {
    const p = parseSkill(m.skill)
    if (!p) continue
    if (p.type === 'add') count.add += m.box
    if (p.type === 'sub') count.sub += m.box
    if (p.type === 'mul' || p.type === 'mul2x1') count.mul += m.box
    if (p.type === 'div' || p.type === 'div2x1') count.div += m.box
  }
  return (Object.keys(count) as WordOp[]).sort((a, b) => count[b] - count[a] || a.localeCompare(b))[0]
}

/** The operation of the problem block: the two-step topic asks two-step bars, the others the operation of the topic. */
function barOpFor(topic: SyllabusTopic | null, mastery: MasteryMap): BarSkillOp {
  if (topic?.id === 'prob-dos-pasos') return 'two'
  if (topic?.id === 'prob-tres-pasos') return 'three'
  return wordOpFor(topic, mastery)
}

export interface PlanInput {
  child: ChildProfile
  mastery: MasteryMap
  /** Recent attempts of this child, newest first (for scaffolding). May be empty. */
  attempts?: readonly AttemptRecord[]
  syllabus: Syllabus
  now: Date
  /** Trimester, when the school's programme is set. */
  term?: number
  rng?: Rng
}

/** Builds today's session. Same child and day give the same plan (seeded), so a reload does not reshuffle it. */
export function planDailySession(input: PlanInput): DailyPlan {
  const { child, syllabus, now } = input
  // Maths only: the Lengua rows of the child never change a maths plan.
  const mastery = masteryOf(input.mastery, 'math')
  const rng = input.rng ?? createRng(hashString(`daily:${child.id}:${dayKey(now)}`))
  const scaffold = scaffoldedSkills(attemptsOf(input.attempts ?? [], 'math'), now)
  const today = dayKey(now)
  const newFacts = new Set<SkillKey>()
  const isNewHard = (s: SkillKey) => isFactSkill(s) && !isEasyFact(s) && !mastery[s]
  const used: string[] = []
  const make = (skill: SkillKey, seedRng: Rng, kinds?: ExerciseKind[]): Exercise | null => {
    const [ex] = generate(kinds ? { skills: [skill], kinds } : { skills: [skill] }, 1, { rng: seedRng, now, mastery, avoidIds: used })
    if (ex) used.push(ex.id)
    return ex ?? null
  }
  // Same generator as make(), with its own seed per (day, skill) so probing does not move the session's rng.
  const canMake = (s: SkillKey) => generate({ skills: [s] }, 1, { rng: createRng(hashString(`step:${today}:${s}`)), now, mastery }).length > 0

  // 1. Calentamiento: learnt cálculo mental and facts not seen today, the most urgent first. Never introduces a skill.
  const seenBeforeToday = (m: SkillMastery) => m.box >= 1 && (m.lastSeenAt ?? '').slice(0, 10) < today
  const dueWarm = urgencyOrder(mastery, now).filter(seenBeforeToday)
  const mentalWarm = dueWarm.filter((m) => isMentalSkill(m.skill)).slice(0, MENTAL_WARMUP_MAX).map((m) => m.skill)
  const warmSkills = [...mentalWarm, ...dueWarm.filter((m) => isFactSkill(m.skill)).map((m) => m.skill)].slice(0, WARMUP_MAX)
  const warmup: DailyItem[] = []
  for (const s of warmSkills) {
    const ex = make(s, rng)
    if (ex) warmup.push({ exercise: ex, block: 'warmup', scaffold: false, isNew: false })
  }

  // 2. Lo nuevo: the current topic, unmastered skills first (seen before, then unseen), within the new-fact budget.
  const topic = currentTopic(syllabus, mastery, input.term)
  let example: DailyPlan['example'] = null
  const newItems: DailyItem[] = []
  if (topic) {
    const open = topic.skills.filter((s) => parseSkill(s) !== null && (mastery[s]?.box ?? -1) < 2)
    // An ordered topic's skills are steps: only the first open one the generator can make is new, the next waits until it
    // is mastered. A step it cannot make is skipped, or the topic would stay stuck on it.
    const step = topic.ordered ? open.find(canMake) : undefined
    const candidates = topic.ordered
      ? (step ? [step] : [])
      : open.sort((x, y) => Number(!mastery[x]) - Number(!mastery[y]) || (mastery[x]?.box ?? 0) - (mastery[y]?.box ?? 0))
    const allowed: SkillKey[] = []
    for (const s of candidates) {
      if (isNewHard(s)) {
        if (newFacts.size >= NEW_FACT_BUDGET) continue
        newFacts.add(s)
      }
      allowed.push(s)
    }
    if (allowed.length) {
      const target = Math.max(NEW_MIN, Math.min(NEW_MAX, allowed.length * 2))
      const seq: SkillKey[] = []
      for (let i = 0; seq.length < target; i++) seq.push(allowed[i % allowed.length])
      example = exampleFor(allowed[0], rng, now)
      for (const s of seq) {
        const ex = make(s, rng)
        if (ex) newItems.push({ exercise: ex, block: 'new', scaffold: scaffold.has(s), isNew: !mastery[s] })
      }
    }
  }
  const newSkills = new Set(newItems.map((i) => i.exercise.skill))

  // A topic behind (not met, before one the child has started) is not taught in «Lo nuevo»: its first step is practised
  // once in the mix, so the child meets it without being pulled back (its own budget rule applies).
  const repaso = behindTopics(syllabus, mastery, input.term).find((t) => t.id !== topic?.id)
  const repasoSkill = repaso?.skills.find((s) => parseSkill(s) !== null && canMake(s))

  // 3. Mezcla: most urgent skills, interleaved by family. Falls back to available non-new skills.
  const urgent = urgencyOrder(mastery, now).map((m) => m.skill)
  let pool = interleavedPick(urgent, MIX_MAX, newSkills)
  if (pool.length < MIX_MIN) {
    const fallback = availableSkills(syllabus, input.term).filter((s) => !isNewHard(s) && !pool.includes(s) && parseSkill(s) !== null)
    pool = [...pool, ...interleavedPick(fallback, MIX_MAX - pool.length, newSkills)]
  }
  if (pool.length === 0) pool = interleavedPick(availableSkills(syllabus, input.term).filter((s) => !isNewHard(s)), MIX_MAX, new Set())
  const mixItems: DailyItem[] = []
  const mixCap = repasoSkill ? MIX_MAX - 1 : MIX_MAX
  for (const s of pool.slice(0, mixCap)) {
    const ex = make(s, rng)
    if (ex) mixItems.push({ exercise: ex, block: 'mix', scaffold: scaffold.has(s) && isFactSkill(s), isNew: false })
  }
  // Keep the mix at least MIX_MIN long by cycling the picked skills (small histories).
  for (let k = 0; mixItems.length > 0 && mixItems.length < MIX_MIN && k < 16; k++) {
    const base = mixItems[k % mixItems.length]
    const ex = make(base.exercise.skill, rng)
    if (ex) mixItems.push({ exercise: ex, block: 'mix', scaffold: base.scaffold, isNew: false })
  }
  // The «encuentra el error» of the mix: the column operation the child is weakest at (never seen counts as weakest).
  // Only what the child's temario has: 2.º finds errors in sums and subtractions, not in multiplications.
  const inSyllabus = new Set(availableSkills(syllabus))
  const huntNow = HUNT_OPS.map((op) => huntSkill(op)).filter((s) => inSyllabus.has(s))
    .sort((x, y) => (mastery[x]?.box ?? -1) - (mastery[y]?.box ?? -1) || x.localeCompare(y))[0]
  const hunt = huntNow ? make(huntNow, rng, ['error-hunt']) : null
  if (hunt) {
    if (mixItems.length >= mixCap) mixItems.pop()
    mixItems.push({ exercise: hunt, block: 'mix', scaffold: false, isNew: false })
  }
  if (repasoSkill && (!isNewHard(repasoSkill) || newFacts.size < NEW_FACT_BUDGET)) {
    const ex = make(repasoSkill, rng)
    if (ex) {
      const isNew = isNewHard(repasoSkill)
      if (isNew) newFacts.add(repasoSkill)
      mixItems.push({ exercise: ex, block: 'mix', scaffold: false, isNew })
    }
  }

  // Fill: when the items are short (facts), the mix goes on with the same urgent skills until the practice fills
  // the session. Fillers never introduce a new fact (they come from the mix pool).
  const secondsOf = (items: DailyItem[]) => items.reduce((sum, i) => sum + estimateSeconds(i), 0)
  const fixedSeconds = secondsOf(warmup) + secondsOf(newItems) + secondsOf(mixItems) + ITEM_SECONDS['bar-problem'] + ITEM_OVERHEAD_SECONDS
  let fillSeconds = fixedSeconds
  for (let k = 0; pool.length > 0 && fillSeconds < PRACTICE_TARGET_SECONDS && k < FILL_MAX; k++) {
    const s = pool[k % pool.length]
    const ex = make(s, rng)
    if (!ex) continue
    const item: DailyItem = { exercise: ex, block: 'mix', scaffold: scaffold.has(s) && isFactSkill(s), isNew: false, filler: true }
    mixItems.push(item)
    fillSeconds += estimateSeconds(item)
  }

  // 4. Problema: one word problem of the operation the child is working on.
  const problem: DailyItem[] = []
  // 2.º has its own groups problem (bar:mul:small): the bar of the temario wins over the generic one.
  const barOf = (op: BarSkillOp) => [barSkill(op), barSkill(op, true)].find((s) => inSyllabus.has(s)) ?? barSkill(op)
  const barNow = barOf(barOpFor(topic, mastery))
  const barAny = (['add', 'sub', 'mul', 'div', 'two'] as const).map(barOf).find((s) => inSyllabus.has(s)) ?? barSkill('add')
  const bex = make(inSyllabus.has(barNow) ? barNow : barAny, rng, ['bar-problem'])
  if (bex) problem.push({ exercise: bex, block: 'problem', scaffold: false, isNew: false })

  const blocks: DailyPlan['blocks'] = [
    { id: 'warmup', items: warmup },
    { id: 'new', items: newItems },
    { id: 'mix', items: mixItems },
    { id: 'problem', items: problem },
  ]
  // Scaffolded items are arrays: swap the exercise for its visual (same fact, same skill for mastery).
  for (const block of blocks) {
    block.items = block.items.map((item) => {
      if (!item.scaffold) return item
      const p = parseSkill(item.exercise.skill)
      if (p?.type !== 'mul') return { ...item, scaffold: false }
      return { ...item, exercise: makeArray(p.a, p.b, '🍄', item.exercise.skill) }
    })
  }
  const practiceSeconds = blocks.reduce((sum, b) => sum + b.items.reduce((s, i) => s + estimateSeconds(i), 0), 0)
  return { topic, example, blocks, practiceSeconds, newFactCount: newFacts.size }
}
