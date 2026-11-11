/* The 15-minute daily session (docs/curriculum/PLAN_DOCENTE.md §3, DIDACTICA §4.2). Pure: no React, no I/O.
     Calentamiento (0–2 min)  3–4 facts from earlier days, mental, no hints
     Lo nuevo (2–7 min)       the current topic of the syllabus: worked example if needed, 4–6 items,
                              at most NEW_FACT_BUDGET brand-new hard facts per session (E6)
     Mezcla (7–12 min)        6–8 items from different skills, most urgent first, interleaved (E5)
     Problema (12–14 min)     one word problem
   Failed items come back later in the same run (src/activities/shared/requeue.ts) and on later days (mastery).
   Scaffolding: a multiplication fact failed twice in the last days is shown as an array (dibujo) until answered
   correctly without hints. The planner only decides WHAT is asked; the runner in src/world/session shows it. */
import type { AttemptRecord, ChildProfile, Exercise, ExerciseKind, MasteryMap, ProgressState, ReadingDef, Rng, SkillKey, SkillMastery } from '@/types'
import { availableSkills, behindTopics, isTopicMastered, teachingOrder, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
import { classForTopic, isClassDone } from '@/content/classes'
import { topicOfToday } from './topicOfToday'
import { makeArray } from './make'
import { statementClock } from './clock'
import { generate } from './generate'
import { lenguaStatement } from './lengua/exercises'
import { statementEnglish } from './ingles/exercises'
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
  'lng-copy': 40, 'lng-guided': 90,
  'eng-listen-pick': 25, 'eng-match': 45, 'eng-write-word': 25, 'eng-complete': 20,
  'eng-num-write': 20, 'eng-num-listen': 25, 'eng-op-listen': 30, 'eng-memory': 90, 'eng-scramble': 35,
  'eng-speak': 25,
}
/** One «encuentra el error» in every mix (PLAN_DOCENTE §3): the column operations of the temario, the weakest one first. */
const HUNT_OPS: HuntOp[] = ['add', 'sub', 'mul']
/** Reading the feedback and pressing «Siguiente», per item. */
export const ITEM_OVERHEAD_SECONDS = 5
export const EXAMPLE_SECONDS = 60

export type DailyBlockId = 'warmup' | 'new' | 'story' | 'mix' | 'problem' | 'game'

export const DAILY_BLOCK_LABEL: Record<DailyBlockId, string> = {
  warmup: 'Calentamiento',
  new: 'Lo nuevo',
  story: 'Lectura',
  mix: 'Mezcla',
  problem: 'Problema',
  game: 'Juego',
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
  example: { exercise: Exercise; statement: string; steps: string[]; answer?: string | null } | null
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
    case 'skip-count': return `Cuenta de ${ex.step} en ${ex.step}: ${ex.values.map((v, i) => (ex.hiddenIndexes.includes(i) ? '__' : fmt(v))).join(', ')}`
    case 'groups': return `${ex.groups} ${ex.groups === 1 ? 'grupo' : 'grupos'} de ${ex.perGroup}: ¿cuántos hay?`
    case 'array': return `${ex.rows} filas de ${ex.cols}: ¿cuántos hay?`
    case 'double-chain': return `El doble del ${ex.start}${ex.steps > 1 ? `, y su doble${ex.steps > 2 ? ', y su doble'.repeat(ex.steps - 2) : ''}` : ''}`
    case 'fact-family': return `Con ${ex.a}, ${ex.b} y ${ex.product} escribe 4 operaciones`
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
    case 'lng-read-choice': case 'lng-read-text': case 'lng-read-order': case 'lng-copy': case 'lng-guided':
      return lenguaStatement(ex)
    case 'eng-listen-pick': case 'eng-match': case 'eng-write-word': case 'eng-complete':
    case 'eng-num-write': case 'eng-num-listen': case 'eng-op-listen': case 'eng-memory': case 'eng-scramble': case 'eng-speak':
      return statementEnglish(ex)
    case 'check-calc': return ex.op === 'add'
      ? `${ex.left} + ${ex.right} = ${ex.claimed}`
      : ex.op === 'sub' ? `${ex.left} − ${ex.right} = ${ex.claimed}` : `${ex.left} : ${ex.right} = ${ex.claimed} resto ${ex.remainder ?? 0}`
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

/** The final answer of an exercise as the child would write it, for the worked example (null when it has no single one). */
function workedAnswer(ex: Exercise): string | null {
  switch (ex.kind) {
    case 'fact-mul': case 'fact-div': case 'missing-factor': case 'column-add': case 'column-sub': case 'column-mul':
    case 'long-mul': case 'round': case 'mental': case 'groups': case 'array': case 'number-line':
      return fmt(ex.answer)
    case 'word-problem': case 'bar-problem': return `${fmt(ex.answer)} ${ex.unit}`.trim()
    case 'division': return ex.remainder > 0 ? `${fmt(ex.quotient)} y sobran ${fmt(ex.remainder)}` : fmt(ex.quotient)
    case 'place-value':
      return Array.isArray(ex.answer) ? ex.parts.filter((p) => p !== 0).map(fmt).join(' + ') : fmt(ex.answer)
    case 'skip-count': return ex.answer.map(fmt).join(', ')
    case 'double-chain': return ex.answer.map(fmt).join(', ')
    case 'compare': return ex.answer
    default: return null
  }
}

/** Worked example for the new topic: a fresh exercise of the skill (its own seed), with the hints as steps and, last, the
    answer, so the child sees the whole cuenta finished and never a «= ?» left open. */
function exampleFor(skill: SkillKey, rng: Rng, now: Date): DailyPlan['example'] {
  const [ex] = generate({ skills: [skill] }, 1, { rng: createRng(hashString(`example:${skill}:${rng()}`)), now })
  if (!ex) return null
  const answer = workedAnswer(ex)
  const steps = hintsFor(ex).map((h) => h.text)
  if (answer) steps.push(`Resultado: ${answer}.`)
  return { exercise: ex, statement: statementOf(ex).replace(/ = \?$/, ''), steps, answer }
}

/** The operations from the simplest to the most advanced. */
const OP_LEVEL: readonly WordOp[] = ['add', 'sub', 'mul', 'div']

/** The operation of a word problem: the one the topic teaches; a topic without one (clock, money, shapes) gets the most
    advanced operation the child practises, so a child with no practice gets an addition. */
function wordOpFor(topic: SyllabusTopic | null, mastery: MasteryMap): WordOp {
  const first = topic?.skills[0] ? parseSkill(topic.skills[0]) : null
  if (first) {
    if (first.type === 'word') return first.op
    if (first.type === 'bar' && (first.op === 'add' || first.op === 'sub' || first.op === 'mul' || first.op === 'div')) return first.op
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
  const practised = OP_LEVEL.filter((op) => count[op] > 0)
  return practised[practised.length - 1] ?? 'add'
}

/** The operation of the problem block: the two-step topic asks two-step bars, the others the operation of the topic. */
function barOpFor(topic: SyllabusTopic | null, mastery: MasteryMap): BarSkillOp {
  if (topic?.id === 'prob-dos-pasos') return 'two'
  if (topic?.id === 'prob-tres-pasos') return 'three'
  return wordOpFor(topic, mastery)
}

/** The topic whose class teaches each word-problem operation, and the one for «Encuentra el error» and each column operation. */
const PROBLEM_CLASS: Record<BarSkillOp, string> = {
  add: 'prob-sumar', sub: 'prob-restar', mul: 'prob-multiplicar', div: 'prob-dividir', two: 'prob-dos-pasos', three: 'prob-dos-pasos',
}
const HUNT_CLASS_TOPIC = 'encuentra-error'
const HUNT_OP_TOPIC: Record<HuntOp, string> = { add: 'suma-3d-llevando', sub: 'resta-3d-prestando', mul: 'mul-2x1-llevando' }

export interface PlanInput {
  child: ChildProfile
  mastery: MasteryMap
  /** Recent attempts of this child, newest first (for scaffolding). May be empty. */
  attempts?: readonly AttemptRecord[]
  syllabus: Syllabus
  now: Date
  /** Trimester, when the school's programme is set. */
  term?: number
  /** The child's progress: a class finished today keeps its topic as today's topic (topicOfToday). */
  progress?: ProgressState
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

  // What has been taught: nothing is asked (in the mix, the hunts, the problem) before the class of its topic has been given.
  // A topic counts as taught when its class is done (the map lesson too) or the child masters it (older progress, tests); a
  // topic without a class (other courses) has nothing to wait for.
  const order = teachingOrder(syllabus)
  const topicIndex = new Map(order.map((t, i) => [t.id, i]))
  const firstTopicOfSkill = new Map<SkillKey, number>()
  order.forEach((t, i) => { if (t.status === 'disponible') for (const sk of t.skills) if (!firstTopicOfSkill.has(sk)) firstTopicOfSkill.set(sk, i) })
  const progressNow = input.progress
  const taughtTopic = (id: string): boolean => {
    const cls = classForTopic(id, child.grade)
    if (!cls) return true
    if (progressNow && isClassDone(progressNow, cls)) return true
    const t = order.find((x) => x.id === id)
    return !!t && isTopicMastered(t, mastery)
  }

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

  // 2. Lo nuevo: today's topic (topicOfToday: the topic of today's class, else the current one), unmastered skills first
  // (seen before, then unseen), within the new-fact budget.
  const topic = topicOfToday(syllabus, mastery, input.progress, now, input.term)
  let example: DailyPlan['example'] = null
  const newItems: DailyItem[] = []
  if (topic) {
    // A topic its class has already mastered (today's topic) still practises its own skills, so «Lo nuevo» is not empty.
    const unmastered = topic.skills.filter((s) => parseSkill(s) !== null && (mastery[s]?.box ?? -1) < 2)
    const open = unmastered.length ? unmastered : topic.skills.filter((s) => parseSkill(s) !== null)
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
  // Skills the mix may fill up with when the child has few: those of today's topic or earlier ones, or of a topic whose
  // class has been given. A later topic is never asked before its class.
  const todayIdx = topic ? topicIndex.get(topic.id) ?? -1 : order.length
  const mixable = (sk: SkillKey) => {
    const i = firstTopicOfSkill.get(sk)
    return i !== undefined && (i <= todayIdx || taughtTopic(order[i].id))
  }

  // A topic behind (not met, before one the child has started) is not taught in «Lo nuevo»: its first step is practised
  // once in the mix, so the child meets it without being pulled back (its own budget rule applies).
  // «Encuentra el error» is a check, not a class: its answers never make a later topic look met.
  const masteryNoHunt = Object.fromEntries(Object.entries(mastery).filter(([k]) => !k.startsWith('hunt:'))) as MasteryMap
  const repaso = behindTopics(syllabus, masteryNoHunt, input.term).find((t) => t.id !== topic?.id)
  const repasoSkill = repaso?.skills.find((s) => parseSkill(s) !== null && canMake(s))

  // 3. Mezcla: most urgent skills, interleaved by family. Falls back to available non-new skills.
  const urgent = urgencyOrder(mastery, now).map((m) => m.skill)
  let pool = interleavedPick(urgent, MIX_MAX, newSkills)
  if (pool.length < MIX_MIN) {
    const fallback = availableSkills(syllabus, input.term).filter((s) => !isNewHard(s) && !pool.includes(s) && parseSkill(s) !== null && mixable(s))
    pool = [...pool, ...interleavedPick(fallback, MIX_MAX - pool.length, newSkills)]
  }
  // Nothing taught to mix yet: a shorter mix (even none) is better than asking what was not taught.
  if (pool.length === 0) pool = interleavedPick(availableSkills(syllabus, input.term).filter((s) => !isNewHard(s) && mixable(s)), MIX_MAX, new Set())
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
  // Only after the class of «Encuentra el error» and the class of the operation itself; among the allowed ones, the weakest
  // the child has seen (an operation never practised is not «the weakest», it is just not known yet).
  const huntOk = (op: HuntOp) => taughtTopic(HUNT_OP_TOPIC[op]) && (taughtTopic(HUNT_CLASS_TOPIC) || !!mastery[huntSkill(op)])
  const huntable = HUNT_OPS.filter(huntOk).map((op) => huntSkill(op)).filter((sk) => inSyllabus.has(sk))
  const huntSeen = huntable.filter((sk) => mastery[sk] !== undefined)
  const huntNow = (huntSeen.length ? huntSeen : huntable)
    .sort((x, y) => (mastery[x]?.box ?? 0) - (mastery[y]?.box ?? 0) || x.localeCompare(y))[0]
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
  // Not before the class «Problemas de juntar», and then only the operations whose problems class has been given.
  const probOp = (): BarSkillOp | null => {
    if (!taughtTopic(PROBLEM_CLASS.add)) return null
    const want = barOpFor(topic, mastery)
    if (taughtTopic(PROBLEM_CLASS[want])) return want
    return (['add', 'sub', 'mul', 'div'] as const).filter((op) => taughtTopic(PROBLEM_CLASS[op])).find((op) => (mastery[barSkill(op)] ?? mastery[barSkill(op, true)]) !== undefined) ?? 'add'
  }
  const op = probOp()
  if (op) {
    const barNow = barOf(op)
    const barAny = (['add', 'sub', 'mul', 'div', 'two'] as const).map(barOf).find((sk) => inSyllabus.has(sk)) ?? barSkill('add')
    const bex = make(inSyllabus.has(barNow) ? barNow : barAny, rng, ['bar-problem'])
    if (bex) problem.push({ exercise: bex, block: 'problem', scaffold: false, isNew: false })
  }

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
  // The class of today's topic comes before «Lo nuevo» when the child has not done it.
  const cls = topic ? classForTopic(topic.id, child.grade) : undefined
  const classTopicId = topic && cls && !(progressNow && isClassDone(progressNow, cls)) ? topic.id : null
  return { topic, example, blocks, practiceSeconds, newFactCount: newFacts.size, classTopicId }
}
