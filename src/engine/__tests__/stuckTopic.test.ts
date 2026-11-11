import { describe, expect, it } from 'vitest'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import { initialProgress } from '@/content'
import { isStuckTopic, markTopicPracticeDay, STUCK_TOPIC_DAYS, syllabusReport, topicOfToday, topicPracticeDays } from '@/engine'
import type { MasteryMap, ProgressState } from '@/types'

const day = (n: number) => new Date(Date.UTC(2026, 10, n, 10))
const practise = (p: ProgressState, topicId: string, days: number): ProgressState => {
  for (let d = 1; d <= days; d++) p = markTopicPracticeDay(p, topicId, day(d))
  return p
}
const masteredMap = (skills: string[]): MasteryMap =>
  Object.fromEntries(skills.map((s) => [s, { skill: s, box: 3, attempts: 9, correct: 9, streak: 5, avgMs: 1000, lastSeenAt: null, dueAt: null, updatedAt: '' }])) as MasteryMap

describe('tema atascado', () => {
  const base = initialProgress('c1', day(1))
  const first = topicOfToday(GRADE3_SYLLABUS, {}, base, day(20))!

  it('counts one day once and different days apart', () => {
    let p = markTopicPracticeDay(base, first.id, day(1))
    p = markTopicPracticeDay(p, first.id, day(1))
    expect(topicPracticeDays(p.flags, first.id)).toBe(1)
    p = markTopicPracticeDay(p, first.id, day(2))
    expect(topicPracticeDays(p.flags, first.id)).toBe(2)
    expect(topicPracticeDays(p.flags, 'otro-tema')).toBe(0)
  })

  it('is stuck from 5 days without mastering, never when mastered', () => {
    expect(isStuckTopic(first, {}, practise(base, first.id, STUCK_TOPIC_DAYS - 1).flags)).toBe(false)
    const five = practise(base, first.id, STUCK_TOPIC_DAYS).flags
    expect(isStuckTopic(first, {}, five)).toBe(true)
    expect(isStuckTopic(first, masteredMap(first.skills), five)).toBe(false)
  })

  it('today moves to the next topic after 5 days; the stuck one is not mastered and the report says «le cuesta»', () => {
    const p = practise(base, first.id, STUCK_TOPIC_DAYS)
    const after = topicOfToday(GRADE3_SYLLABUS, {}, p, day(20))!
    expect(after.id).not.toBe(first.id)
    const report = syllabusReport(GRADE3_SYLLABUS, {}, 'math', undefined, { progress: p, now: day(20) })
    const topics = report.blocks.flatMap((b) => b.topics)
    expect(topics.find((t) => t.id === first.id)?.stuck).toBe(true)
    expect(topics.find((t) => t.id === first.id)?.state).not.toBe('dominado')
    expect(topics.find((t) => t.id === after.id)?.stuck).toBeUndefined()
  })

  it('a class finished today still wins over the stuck rule', () => {
    const p = practise(base, first.id, STUCK_TOPIC_DAYS)
    expect(topicOfToday(GRADE3_SYLLABUS, {}, { ...p, flags: { ...p.flags, [`clase-hoy:2026-11-20:${first.id}`]: true } }, day(20))!.id).toBe(first.id)
  })
})
