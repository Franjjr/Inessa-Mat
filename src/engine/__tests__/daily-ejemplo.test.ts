/* The worked example of «Lo nuevo» ends with the answer, never with an open «= ?» (audit p4-pistas-mensajes P4-01). */
import { describe, expect, it } from 'vitest'
import type { ChildProfile, MasteryMap } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, teachingOrder } from '@/content/syllabus'
import { additionSteps, multiplicationSteps, planDailySession, subtractionSteps, workedAnswer } from '../daily'
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

  it('no step of the example of any 3.º topic leaves a sum open («= ?»)', () => {
    const open: string[] = []
    for (const t of teachingOrder(GRADE3_SYLLABUS)) {
      for (const day of [1, 2, 3]) {
        const when = new Date(now.getTime() + day * 86400000)
        const plan = planDailySession({ child, mastery: masteredBefore(t.id), attempts: [], syllabus: GRADE3_SYLLABUS, now: when })
        for (const step of plan.example?.steps ?? []) if (/=\s*\?/.test(step)) open.push(`${plan.topic?.id}: ${step}`)
      }
    }
    expect(open).toEqual([])
  })

  it('the example of a subtraction has one step per column of the minuend, then the result', () => {
    const plan = planDailySession({ child, mastery: masteredBefore('resta-3d-prestando'), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const ex = plan.example!.exercise as { minuend: number }
    expect(plan.example!.steps.length).toBe(String(ex.minuend).length + 1)
    expect(plan.example!.steps[0]).toMatch(/unidades/)
  })

  it('a comparison is answered with words, not with the sign', () => {
    let seen = 0
    for (const seed of [1, 2, 3, 4]) {
      const [ex] = generate({ skills: ['num:compare'] }, 1, { rng: createRng(seed), now })
      if (ex?.kind !== 'compare') continue
      seen++
      expect(workedAnswer(ex)).toMatch(/mayor|menor|iguales/)
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('the column walkthroughs are right: 512 − 247 (with a zero lending), 38 + 47 and 47 × 6', () => {
    expect(subtractionSteps(512, 247)).toEqual([
      'En las unidades: 2 − 7 no se puede. Pido 10 a la casa de al lado: 2 + 10 = 12. Ahora 12 − 7 = 5.',
      'En las decenas, el 1 de arriba prestó 1 y ahora es 0: 0 − 4 no se puede. Pido 10 a la casa de al lado: 0 + 10 = 10. Ahora 10 − 4 = 6.',
      'En las centenas, el 5 de arriba prestó 1 y ahora es 4: 4 − 2 = 2.',
    ])
    expect(subtractionSteps(6003, 2178)).toHaveLength(4)
    expect(additionSteps([38, 47])).toEqual([
      'En las unidades: 8 + 7 = 15. Escribo 5 y me llevo 1.',
      'En las decenas: 3 + 4 + 1 que llevaba = 8.',
    ])
    expect(multiplicationSteps(47, 6)).toEqual([
      'En las unidades: 7 × 6 = 42. Escribo 2 y me llevo 4.',
      'En las decenas: 4 × 6 + 4 que llevaba = 28.',
    ])
  })
})
