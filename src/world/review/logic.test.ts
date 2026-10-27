import { describe, expect, it } from 'vitest'
import { createRng, newMastery } from '@/engine'
import { initialProgress } from '@/content'
import type { ChildProfile, MasteryMap, SkillMastery } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { buildReviewSession } from './logic'

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const child: ChildProfile = {
  id: 'child-review', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
}

function due(skill: string, box: SkillMastery['box']): SkillMastery {
  return { ...newMastery(skill, now), box, attempts: 3, correct: 2, dueAt: new Date(now.getTime() - DAY).toISOString() }
}

describe('buildReviewSession', () => {
  it('the due count and the review ignore Lengua rows', () => {
    const maths: MasteryMap = { 'mul:6x7': due('mul:6x7', 1), 'mul:3x4': due('mul:3x4', 2) }
    const withLng: MasteryMap = { ...maths, 'lng:ortografia:b-v': due('lng:ortografia:b-v', 0), 'lng:lectura:frase': due('lng:lectura:frase', 1) }
    const progress = initialProgress(child.id, now)
    const run = (mastery: MasteryMap) => buildReviewSession({ child, progress, mastery, now, rng: createRng(7) })
    const a = run(maths)
    const b = run(withLng)
    expect(a.dueCount).toBe(2)
    expect(b.dueCount).toBe(a.dueCount)
    expect(b.exercises.map((e) => e.id)).toEqual(a.exercises.map((e) => e.id))
  })
})
