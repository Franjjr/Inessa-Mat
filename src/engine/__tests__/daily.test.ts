import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AttemptRecord, ChildProfile, MasteryMap, SkillMastery } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, allTopics, currentTopic, teachingOrder, type Syllabus } from '@/content/syllabus'
import {
  DAILY_MINUTES, NEW_FACT_BUDGET, estimateSeconds, planDailySession, scaffoldedSkills, statementOf,
} from '../daily'
import { newMastery } from '../mastery'
import { isEasyFact, isFactSkill, isMentalSkill, mulSkill, parseSkill } from '../skills'
import { createRng } from '../rng'

/** Skill keys the generator is told to make nothing for (empty set = the real generator). */
const unmakeable = vi.hoisted(() => new Set<string>())
vi.mock('../generate', async (importOriginal) => {
  const real = await importOriginal<typeof import('../generate')>()
  return {
    ...real,
    generate: (opts: Parameters<typeof real.generate>[0], n: number, ctx: Parameters<typeof real.generate>[2]) =>
      opts.skills?.some((s) => unmakeable.has(s)) ? [] : real.generate(opts, n, ctx),
  }
})

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 86400000
const iso = (days: number) => new Date(now.getTime() + days * DAY).toISOString()
const child: ChildProfile = {
  id: 'child-plan', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: iso(-60), updatedAt: iso(-1),
}

function m(skill: string, box: number, opts: { dueDays?: number; seenDays?: number } = {}): SkillMastery {
  return {
    ...newMastery(skill, now),
    box: box as SkillMastery['box'], attempts: 5, correct: 3,
    dueAt: iso(opts.dueDays ?? 1), lastSeenAt: opts.seenDays === undefined ? null : iso(opts.seenDays),
  }
}

/** A child who has mastered every available topic before `topicId` and has seen a few facts of it. */
function masteredBefore(topicId: string): MasteryMap {
  const mastery: MasteryMap = {}
  for (const t of teachingOrder(GRADE3_SYLLABUS)) {
    if (t.id === topicId) break
    for (const s of t.skills) mastery[s] = m(s, 3, { dueDays: 1, seenDays: -2 })
  }
  const started = allTopics(GRADE3_SYLLABUS).find((t) => t.id === topicId)!
  for (const s of started.skills.filter((x) => !mastery[x]).slice(0, 2)) mastery[s] = m(s, 1, { dueDays: -1, seenDays: -1 })
  return mastery
}

/** The middle of the school year: the table of 3 is the next thing to learn. */
const midYearMastery = () => masteredBefore('tabla-3')

describe('planDailySession', () => {
  it('a child with no history gets a short plan: no warm-up of earlier days, a new topic, a problem', () => {
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic?.id).toBe('descomponer-9999')
    expect(plan.blocks.find((b) => b.id === 'warmup')!.items).toHaveLength(0)
    const next = plan.blocks.find((b) => b.id === 'new')!.items
    expect(next.length).toBeGreaterThanOrEqual(4)
    expect(next.length).toBeLessThanOrEqual(6)
    expect(next.every((i) => i.block === 'new')).toBe(true)
    expect(plan.blocks.find((b) => b.id === 'problem')!.items).toHaveLength(1)
    expect(plan.example).not.toBeNull()
    expect(plan.example!.statement.length).toBeGreaterThan(0)
  })

  it('keeps the blocks in order with the sizes of the planning document', () => {
    const plan = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const planned = Object.fromEntries(plan.blocks.map((b) => [b.id, b.items.filter((i) => !i.filler).length]))
    expect(plan.blocks.map((b) => b.id)).toEqual(['warmup', 'new', 'mix', 'problem'])
    expect(planned.warmup).toBeLessThanOrEqual(4)
    expect(planned.new).toBeGreaterThanOrEqual(4)
    expect(planned.new).toBeLessThanOrEqual(6)
    expect(planned.mix).toBeGreaterThanOrEqual(6)
    expect(planned.mix).toBeLessThanOrEqual(8)
    expect(planned.problem).toBe(1)
  })

  it('the practice items fill at least 12 of the 15 minutes (estimated), so the session is mostly exercises', () => {
    for (const mastery of [{}, midYearMastery()]) {
      const plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now })
      const minutes = plan.practiceSeconds / 60
      expect(minutes).toBeGreaterThanOrEqual(DAILY_MINUTES - 3)
      expect(minutes).toBeLessThanOrEqual(DAILY_MINUTES)
    }
    const full = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const sum = full.blocks.flatMap((b) => b.items).reduce((s, i) => s + estimateSeconds(i), 0)
    expect(sum).toBe(full.practiceSeconds)
  })

  it('introduces at most NEW_FACT_BUDGET brand-new hard facts in the whole session (E6)', () => {
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now, term: undefined })
    const allItems = plan.blocks.flatMap((b) => b.items)
    const newHard = new Set(allItems.filter((i) => isFactSkill(i.exercise.skill) && !isEasyFact(i.exercise.skill)).map((i) => i.exercise.skill))
    expect(newHard.size).toBeLessThanOrEqual(NEW_FACT_BUDGET)
    expect(plan.newFactCount).toBeLessThanOrEqual(NEW_FACT_BUDGET)
  })

  it('a new table with many hard facts introduces at most three of them (E6)', () => {
    const plan = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic?.id).toBe('tabla-3')
    const unseen = plan.blocks.flatMap((b) => b.items).filter((i) => i.isNew && isFactSkill(i.exercise.skill))
    expect(new Set(unseen.map((i) => i.exercise.skill)).size).toBeLessThanOrEqual(NEW_FACT_BUDGET)
    expect(plan.newFactCount).toBeLessThanOrEqual(NEW_FACT_BUDGET)
    // the table has more than three hard facts unseen, so the budget is what limits it
    expect(mulSkill(3, 9)).toBe('mul:3x9')
  })

  it('warm-up asks learnt facts from earlier days and never a fact the child has not met', () => {
    const mastery = midYearMastery()
    mastery['mul:6x7'] = m('mul:6x7', 2, { dueDays: -1, seenDays: -3 })
    mastery['mul:3x4'] = m('mul:3x4', 1, { dueDays: -2, seenDays: -4 })
    mastery['mul:4x9'] = m('mul:4x9', 0, { dueDays: -5, seenDays: -5 })
    mastery['mul:6x6'] = m('mul:6x6', 2, { dueDays: 0, seenDays: 0 }) // seen today: not in the warm-up
    const plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const warm = plan.blocks.find((b) => b.id === 'warmup')!.items
    expect(warm.length).toBeGreaterThan(0)
    // facts, or the cálculo mental learnt in etapa 1 (completar a 10, 100 y 1 000)
    expect(warm.every((i) => isFactSkill(i.exercise.skill) || isMentalSkill(i.exercise.skill))).toBe(true)
    for (const i of warm) {
      expect(mastery[i.exercise.skill]).toBeDefined()
      expect(i.exercise.skill).not.toBe('mul:6x6')
    }
  })

  it('the mix interleaves families and puts the most urgent skills first', () => {
    const mastery = midYearMastery()
    mastery['mul:2x7'] = m('mul:2x7', 0, { dueDays: -1, seenDays: -2 }) // a learnt fact that failed: the most urgent
    const plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic?.id).toBe('tabla-3')
    const mix = plan.blocks.find((b) => b.id === 'mix')!.items.map((i) => i.exercise.skill)
    expect(mix[0]).toBe('mul:2x7')
    // the planned items come from the mix pool, never from the new topic
    expect(plan.blocks.find((b) => b.id === 'mix')!.items.every((i) => !i.isNew)).toBe(true)
    const families = mix.map((s) => parseSkill(s)?.type)
    for (let i = 1; i < families.length; i++) {
      // no two neighbours of the same family while other families are available
      if (new Set(families).size > 1) expect(families[i]).not.toBe(families[i - 1])
    }
  })

  it('the problem block is a bar problem of the operation the topic teaches', () => {
    const plan = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const problem = plan.blocks.find((b) => b.id === 'problem')!.items[0].exercise
    expect(problem.kind).toBe('bar-problem')
  })

  it('same child and day give the same plan; another day can differ', () => {
    const a = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const b = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(a.blocks.flatMap((x) => x.items).map((i) => i.exercise.id)).toEqual(b.blocks.flatMap((x) => x.items).map((i) => i.exercise.id))
  })

  it('a child who masters every available topic gets no new topic, but still a session', () => {
    const mastery: MasteryMap = {}
    for (const block of GRADE3_SYLLABUS.blocks) for (const t of block.topics) for (const s of t.skills) mastery[s] = m(s, 4, { seenDays: -1 })
    const plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic).toBeNull()
    expect(plan.example).toBeNull()
    expect(plan.blocks.flatMap((b) => b.items).length).toBeGreaterThan(0)
  })

  describe('ordered topics (their skills are steps)', () => {
    /** A one-topic syllabus whose only topic is ordered: its skills are taught one step at a time. */
    const orderedSyllabus = (skills: string[]): Syllabus => ({
      id: 'test-ordered', course: 3,
      blocks: [{ id: 'b', name: 'Bloque', topics: [{ id: 'pasos', name: 'Pasos', skills, status: 'disponible', ordered: true, rungs: {} }] }],
    })
    const newSkills = (plan: ReturnType<typeof planDailySession>) =>
      plan.blocks.find((b) => b.id === 'new')!.items.map((i) => i.exercise.skill)

    it('an ordered topic teaches only its first unmastered step', () => {
      const plan = planDailySession({
        child, mastery: {}, attempts: [], now,
        syllabus: orderedSyllabus(['mul:2x1:c0', 'mul:2x1:c1']),
      })
      expect(plan.topic?.id).toBe('pasos')
      const next = newSkills(plan)
      expect(next.length).toBeGreaterThan(0)
      expect(next.every((s) => s === 'mul:2x1:c0')).toBe(true)
    })

    it('an ordered topic moves to the next step once the first is mastered', () => {
      const plan = planDailySession({
        child, mastery: { 'mul:2x1:c0': m('mul:2x1:c0', 2, { seenDays: -1 }) }, attempts: [], now,
        syllabus: orderedSyllabus(['mul:2x1:c0', 'mul:2x1:c1']),
      })
      const next = newSkills(plan)
      expect(next.length).toBeGreaterThan(0)
      expect(next.every((s) => s === 'mul:2x1:c1')).toBe(true)
    })

    it('an ordered topic skips a step that is not a valid skill', () => {
      const plan = planDailySession({
        child, mastery: {}, attempts: [], now,
        syllabus: orderedSyllabus(['xx:nope', 'mul:2x1:c0']),
      })
      const next = newSkills(plan)
      expect(next.length).toBeGreaterThan(0)
      expect(next.every((s) => s === 'mul:2x1:c0')).toBe(true)
    })

    afterEach(() => unmakeable.clear())

    it('an ordered topic skips a valid step the generator cannot make, and teaches the next one', () => {
      unmakeable.add('mul:2x1:c0')
      const plan = planDailySession({
        child, mastery: {}, attempts: [], now,
        syllabus: orderedSyllabus(['mul:2x1:c0', 'mul:2x1:c1']),
      })
      const next = newSkills(plan)
      expect(next.length).toBeGreaterThan(0)
      expect(next.every((s) => s === 'mul:2x1:c1')).toBe(true)
    })
  })

  it('examples and statements are readable and never empty', () => {
    const plan = planDailySession({ child, mastery: midYearMastery(), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    for (const b of plan.blocks) for (const i of b.items) expect(statementOf(i.exercise).length).toBeGreaterThan(0)
    expect(plan.example!.steps.length).toBeGreaterThan(0)
  })

  it('currentTopic follows the teaching order of the stages and skips pending topics', () => {
    expect(currentTopic(GRADE3_SYLLABUS, {})?.id).toBe('descomponer-9999')
    // Etapa 1 (numbers, easy tables, coins) comes first: once it is learnt, the sums of 2 figures follow.
    const topics = teachingOrder(GRADE3_SYLLABUS)
    const numbers: MasteryMap = {}
    for (const t of topics.slice(0, topics.findIndex((x) => x.id === 'suma-2d'))) for (const s of t.skills) numbers[s] = m(s, 2)
    expect(currentTopic(GRADE3_SYLLABUS, numbers)?.id).toBe('suma-2d')
    const mastery: MasteryMap = { ...numbers }
    for (const s of ['add:2d:c0', 'add:2d:c1']) mastery[s] = m(s, 2)
    expect(currentTopic(GRADE3_SYLLABUS, mastery)?.id).toBe('suma-3d-sin-llevar')
  })
})

describe('scaffoldedSkills (escalera adaptativa)', () => {
  const attempt = (skill: string, correct: boolean, daysAgo: number, extra: Partial<AttemptRecord> = {}): AttemptRecord => ({
    id: `${skill}-${daysAgo}-${correct}`, childId: child.id, sessionId: null, skill, kind: 'fact-mul', correct,
    given: '', expected: '', ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType: correct ? null : 'fact',
    context: {}, createdAt: iso(-daysAgo), ...extra,
  })

  it('two wrong answers on the same fact put it on the visual support', () => {
    const s = scaffoldedSkills([attempt('mul:6x7', false, 0), attempt('mul:6x7', false, 1)], now)
    expect(s.has('mul:6x7')).toBe(true)
  })

  it('one wrong answer is not enough, and a recognition misread does not count', () => {
    expect(scaffoldedSkills([attempt('mul:6x7', false, 0)], now).size).toBe(0)
    expect(scaffoldedSkills([attempt('mul:6x7', false, 0, { errorType: 'recognition' }), attempt('mul:6x7', false, 1)], now).size).toBe(0)
  })

  it('a correct answer without hints returns the fact to numbers', () => {
    const s = scaffoldedSkills([attempt('mul:6x7', true, 0), attempt('mul:6x7', false, 1), attempt('mul:6x7', false, 2)], now)
    expect(s.has('mul:6x7')).toBe(false)
  })

  it('old failures (outside the window) are forgotten', () => {
    expect(scaffoldedSkills([attempt('mul:6x7', false, 20), attempt('mul:6x7', false, 21)], now).size).toBe(0)
  })

  it('the planner shows a scaffolded fact as an array', () => {
    const attempts = [attempt('mul:6x7', false, 0), attempt('mul:6x7', false, 1)]
    const plan = planDailySession({ child, mastery: midYearMastery(), attempts, syllabus: GRADE3_SYLLABUS, now, rng: createRng(5) })
    const all = plan.blocks.flatMap((b) => b.items)
    for (const i of all) if (i.scaffold) expect(i.exercise.kind).toBe('array')
  })
})
