import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile, MasteryMap, ProgressState, SkillMastery } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'

const nextNodeMock = vi.fn<(p: ProgressState) => { worldId: string; nodeId: string } | null>(() => ({ worldId: 'w3', nodeId: 'n2' }))
vi.mock('@/content', () => ({ nextNode: (p: ProgressState) => nextNodeMock(p) }))

const { planSession, selectorForSkills, generate, createRng, newMastery } = await import('@/engine')

const now = new Date('2026-10-21T10:00:00.000Z')
const DAY = 86400000
const iso = (days: number) => new Date(now.getTime() + days * DAY).toISOString()

const child: ChildProfile = {
  id: 'child-1', orgId: null, nickname: 'Inessa', gender: 'f', grade: 2,
  companion: { species: 'cat', name: 'Bigotes', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: iso(-30), updatedAt: iso(-1),
}
const progress = { childId: 'child-1' } as ProgressState

function m(skill: string, box: number, dueDays: number, seenDays = -1): SkillMastery {
  return { ...newMastery(skill, now), box: box as SkillMastery['box'], attempts: 6, correct: 4, dueAt: iso(dueDays), lastSeenAt: iso(seenDays) }
}

describe('planSession (review list)', () => {
  beforeEach(() => nextNodeMock.mockClear())

  it('a new child has nothing to review and gets the next node', () => {
    const plan = planSession({ child, progress, mastery: {}, now })
    expect(plan.minutes).toBe(15)
    expect(plan.next).toEqual({ worldId: 'w3', nodeId: 'n2' })
    expect(nextNodeMock).toHaveBeenCalledWith(progress)
    expect(plan.review).toEqual([])
  })

  it('review interleaves due and weak skills of every type, without concepts', () => {
    const mastery: MasteryMap = {}
    const put = (s: SkillMastery) => { mastery[s.skill] = s }
    put(m('mul:6x7', 0, -1)); put(m('mul:6x8', 1, -2)); put(m('mul:7x8', 2, -3)); put(m('mul:3x6', 3, -1))
    put(m('add:3d:c2', 1, -1)); put(m('sub:3d:z', 0, -2)); put(m('sub:4d:b2', 2, -1)); put(m('div:2x1:rem', 1, 3))
    put(m('concept:groups', 0, -10)); put(m('mul:9x9', 5, 10))
    const plan = planSession({ child, progress, mastery, now })
    expect(plan.review.length).toBeGreaterThan(0)
    expect(plan.review.length).toBeLessThanOrEqual(8)
    expect(plan.review).not.toContain('concept:groups')
    expect(plan.review).not.toContain('mul:9x9')
    expect(plan.review).toContain('sub:3d:z')
    expect(plan.review).toContain('div:2x1:rem') // weak (box 1) though not due yet
    expect(plan.review[0]).toBe('sub:3d:z')
    const exs = generate(selectorForSkills(plan.review), plan.review.length, { rng: createRng(1) })
    expect(new Set(exs.map((e) => e.skill))).toEqual(new Set(plan.review))
  })

  it('session length follows the child settings, clamped; a null next node is fine', () => {
    nextNodeMock.mockReturnValueOnce(null)
    const plan = planSession({ child: { ...child, settings: { ...child.settings, sessionMinutes: 5 } }, progress, mastery: {}, now })
    expect(plan.minutes).toBe(5)
    expect(plan.next).toBeNull()
    const long = planSession({ child: { ...child, settings: { ...child.settings, sessionMinutes: 300 } }, progress, mastery: {}, now })
    expect(long.minutes).toBe(60)
  })

  it('survives a failing content module', () => {
    nextNodeMock.mockImplementationOnce(() => { throw new Error('content not ready') })
    expect(planSession({ child, progress, mastery: {}, now }).next).toBeNull()
  })
})

describe('selectorForSkills', () => {
  it('targets exactly these skills (deduplicated)', () => {
    expect(selectorForSkills(['mul:6x7', 'mul:6x7', 'sub:3d:z'])).toEqual({ skills: ['mul:6x7', 'sub:3d:z'] })
  })
})
