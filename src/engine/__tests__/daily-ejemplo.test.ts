/* The worked example of «Lo nuevo» ends with the answer, never with an open «= ?» (audit p4-pistas-mensajes P4-01). */
import { describe, expect, it } from 'vitest'
import type { ChildProfile, MasteryMap } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, teachingOrder } from '@/content/syllabus'
import { planDailySession, workedAnswer } from '../daily'
import { generate } from '../generate'
import { createRng } from '../rng'
import { fmt } from '../numeric'
import { newMastery } from '../mastery'

const now = new Date('2026-10-22T10:00:00.000Z')
const child: ChildProfile = {
  id: 'child-ejemplo', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
}

/** A child who has mastered every topic before `topicId`, so that it is today's topic. */
function masteredBefore(topicId: string): MasteryMap {
  const mastery: MasteryMap = {}
  for (const t of teachingOrder(GRADE3_SYLLABUS)) {
    if (t.id === topicId) break
    for (const s of t.skills) mastery[s] = { ...newMastery(s, now), box: 3, attempts: 5, correct: 5, dueAt: new Date(now.getTime() + 86400000).toISOString(), lastSeenAt: new Date(now.getTime() - 2 * 86400000).toISOString() }
  }
  return mastery
}

describe('daily-ejemplo', () => {
  it('the example of a subtraction ends with the numeric answer, not with «= ?»', () => {
    const plan = planDailySession({ child, mastery: masteredBefore('resta-3d-prestando'), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic?.id).toBe('resta-3d-prestando')
    const ex = plan.example!
    expect(ex.exercise.kind).toBe('column-sub')
    const answer = (ex.exercise as { answer: number }).answer
    const last = ex.steps[ex.steps.length - 1]
    expect(last).toContain(String(answer).replace(/\B(?=(\d{3})+(?!\d))/g, ' '))
    expect(last).not.toMatch(/\?/)
    expect(ex.statement).not.toMatch(/= \?$/)
  })

  it('the example of a multiplication fact finishes the cuenta too', () => {
    const plan = planDailySession({ child, mastery: masteredBefore('tabla-3'), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const ex = plan.example!
    expect(ex.exercise.kind).toBe('fact-mul')
    expect(ex.statement).toMatch(/^\d+ × \d+$/)
    expect(ex.steps[ex.steps.length - 1]).toContain(String((ex.exercise as { answer: number }).answer))
  })

  it('the answer of descomponer is the parts added up, thousands first, without the zeros', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const [ex] = generate({ skills: ['num:place:expanded'] }, 1, { rng: createRng(seed), now })
      if (ex.kind !== 'place-value') throw new Error('expected a place-value exercise')
      expect(workedAnswer(ex)).toBe(ex.parts.filter((p) => p !== 0).map(fmt).join(' + '))
    }
  })

  it('every kind of the daily plan with a single answer gets it', () => {
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.example!.steps.length).toBeGreaterThan(0)
    expect(plan.example!.steps[plan.example!.steps.length - 1]).toMatch(/^Resultado: /)
  })
})
