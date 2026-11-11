import { describe, expect, it } from 'vitest'
import { GRADE2_SYLLABUS, GRADE3_SYLLABUS, GRADE4_SYLLABUS, allTopics, blockIdOfTopic, isTopicMastered, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
import { initialProgress } from '@/content'
import { isStuckTopic, markTopicPracticeDay, planDailySession, STUCK_TOPIC_DAYS, syllabusReport, topicOfToday, topicPracticeDays, updateMastery } from '@/engine'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type MasteryMap, type ProgressState } from '@/types'

const day = (n: number) => new Date(Date.UTC(2026, 10, n, 10))
const box = (skill: string, b: number) => ({ skill, box: b, attempts: 9, correct: 9, streak: 5, avgMs: 1000, lastSeenAt: null, dueAt: null, updatedAt: '' })
const masteredMap = (skills: string[]): MasteryMap => Object.fromEntries(skills.map((s) => [s, box(s, 3)])) as MasteryMap
/** Practises the topic on `days` days, with `doneAt(d)` skills at the mastered box on day d. */
const practise = (p: ProgressState, topic: SyllabusTopic, days: number, doneAt: (d: number) => number = () => 0): ProgressState => {
  for (let d = 1; d <= days; d++) p = markTopicPracticeDay(p, topic, masteredMap(topic.skills.slice(0, doneAt(d))), day(d))
  return p
}

describe('tema atascado', () => {
  const base = initialProgress('c1', day(1))
  const first = topicOfToday(GRADE3_SYLLABUS, {}, base, day(20))!

  it('counts one day once and different days apart', () => {
    let p = markTopicPracticeDay(base, first, {}, day(1))
    p = markTopicPracticeDay(p, first, {}, day(1))
    expect(topicPracticeDays(p.flags, first.id)).toBe(1)
    p = markTopicPracticeDay(p, first, {}, day(2))
    expect(topicPracticeDays(p.flags, first.id)).toBe(2)
    expect(topicPracticeDays(p.flags, 'otro-tema')).toBe(0)
  })

  it('is stuck after 5 days with no progress, never when mastered', () => {
    expect(isStuckTopic(first, {}, practise(base, first, STUCK_TOPIC_DAYS - 1).flags)).toBe(false)
    const five = practise(base, first, STUCK_TOPIC_DAYS).flags
    expect(isStuckTopic(first, {}, five)).toBe(true)
    expect(isStuckTopic(first, masteredMap(first.skills), five)).toBe(false)
  })

  it('is not stuck while the child advances, however many days it takes', () => {
    const big = { ...first, skills: Array.from({ length: 30 }, (_, i) => `add:2d:big${i}`) } as SyllabusTopic
    const slow = practise(base, big, 12, (d) => Math.floor(d / 2))
    expect(isStuckTopic(big, masteredMap(big.skills.slice(0, 6)), slow.flags)).toBe(false)
    // Progress made after the last practice day also counts.
    const flat = practise(base, first, STUCK_TOPIC_DAYS)
    expect(isStuckTopic(first, masteredMap(first.skills.slice(0, 1)), flat.flags)).toBe(false)
  })

  it('keeps only the latest days, and a mastered topic that opens again starts a new count', () => {
    expect(topicPracticeDays(practise(base, first, 20).flags, first.id)).toBeLessThanOrEqual(8)
    let p = practise(base, first, 6, (d) => (d >= 4 ? first.skills.length : 0))
    p = markTopicPracticeDay(p, first, {}, day(7))
    expect(topicPracticeDays(p.flags, first.id)).toBe(1)
    expect(isStuckTopic(first, {}, p.flags)).toBe(false)
  })

  it('today moves to a topic of another block after 5 days; the stuck one is not mastered and the report says «le cuesta»', () => {
    const p = practise(base, first, STUCK_TOPIC_DAYS)
    const after = topicOfToday(GRADE3_SYLLABUS, {}, p, day(20))!
    expect(after.id).not.toBe(first.id)
    expect(blockIdOfTopic(GRADE3_SYLLABUS, after.id)).not.toBe(blockIdOfTopic(GRADE3_SYLLABUS, first.id))
    const report = syllabusReport(GRADE3_SYLLABUS, {}, 'math', undefined, { progress: p, now: day(20) })
    const topics = report.blocks.flatMap((b) => b.topics)
    expect(topics.find((t) => t.id === first.id)?.stuck).toBe(true)
    expect(topics.find((t) => t.id === first.id)?.state).not.toBe('dominado')
    expect(topics.find((t) => t.id === after.id)?.stuck).toBeUndefined()
  })

  it('never moves to a topic of the same block (the divisions need «división con tablas»)', () => {
    const all = allTopics(GRADE3_SYLLABUS)
    const divTables = all.find((t) => t.id === 'div-con-tablas')!
    const block = blockIdOfTopic(GRADE3_SYLLABUS, divTables.id)
    // Everything before the divisions is mastered, so «división con tablas» is the current topic.
    const mastery = masteredMap(all.slice(0, all.indexOf(divTables)).flatMap((t) => t.skills))
    const today = topicOfToday(GRADE3_SYLLABUS, mastery, practise(base, divTables, STUCK_TOPIC_DAYS), day(20))!
    expect(blockIdOfTopic(GRADE3_SYLLABUS, today.id)).not.toBe(block)
    expect(all.indexOf(today)).toBeGreaterThan(all.indexOf(divTables))
    expect(isTopicMastered(today, mastery)).toBe(false)
  })

  it('stays on the current topic when every other one is stuck', () => {
    const open = allTopics(GRADE3_SYLLABUS).filter((t) => t.status === 'disponible')
    const stuckAll = open.reduce((p, t) => practise(p, t, STUCK_TOPIC_DAYS), base)
    expect(topicOfToday(GRADE3_SYLLABUS, {}, stuckAll, day(20))!.id).toBe(first.id)
  })

  it('a class finished today still wins over the stuck rule', () => {
    const p = practise(base, first, STUCK_TOPIC_DAYS)
    expect(topicOfToday(GRADE3_SYLLABUS, {}, { ...p, flags: { ...p.flags, [`clase-hoy:2026-11-20:${first.id}`]: true } }, day(20))!.id).toBe(first.id)
  })
})

/** A child who answers everything right and fast, day after day: no topic of the course may ever be stuck. */
describe('un niño perfecto no se atasca nunca', () => {
  const simulate = (syllabus: Syllabus, grade: number, days: number) => {
    const child: ChildProfile = {
      id: `perfect-${grade}`, orgId: null, nickname: 'Ana', gender: 'f', grade,
      companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
      settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: day(1).toISOString(), updatedAt: day(1).toISOString(),
    }
    let mastery: MasteryMap = {}
    let progress = initialProgress(child.id, day(1))
    const start = Date.UTC(2026, 9, 1, 10)
    const stuck: string[] = []
    for (let d = 0; d < days; d++) {
      const now = new Date(start + d * 86_400_000)
      const plan = planDailySession({ child, mastery, syllabus, now, attempts: [], progress })
      for (const block of plan.blocks) {
        for (const item of block.items) {
          const skill = item.exercise.skill
          mastery = { ...mastery, [skill]: updateMastery(mastery[skill], { skill, correct: true, ms: 1500, inputMode: 'keypad', hintsUsed: 0 }, now) }
        }
      }
      if (plan.topic && plan.blocks.find((b) => b.id === 'new')?.items.length) progress = markTopicPracticeDay(progress, plan.topic, mastery, now)
      for (const t of allTopics(syllabus)) if (isStuckTopic(t, mastery, progress.flags)) stuck.push(`${t.id}@${d}`)
    }
    return stuck
  }

  it.each([[2, GRADE2_SYLLABUS], [3, GRADE3_SYLLABUS], [4, GRADE4_SYLLABUS]] as const)('curso %i', (grade, syllabus) => {
    expect(simulate(syllabus, grade, 60)).toEqual([])
  }, 120_000)
})
