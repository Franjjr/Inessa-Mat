/* Block E (fracciones and geometría) in the syllabus, the daily session and the placement test. */
import { describe, expect, it } from 'vitest'
import type { ChildProfile, MasteryMap, SkillMastery } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, allTopics, availableSkills } from '@/content/syllabus'
import { buildPlacement, newMastery, parseSkill, PLACEMENT_COUNT, placementBlockOf, planDailySession, isValidSkill } from '@/engine'

const now = new Date('2026-10-22T10:00:00.000Z')
const child: ChildProfile = {
  id: 'child-block-e', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-10-21T10:00:00.000Z',
}

/** Every topic before `topicId` mastered (box 3), the rest unseen. */
function masteredBefore(topicId: string): MasteryMap {
  const mastery: MasteryMap = {}
  for (const t of allTopics(GRADE3_SYLLABUS)) {
    if (t.id === topicId) break
    for (const s of t.skills) {
      const m: SkillMastery = { ...newMastery(s, now), box: 3, attempts: 5, correct: 5, lastSeenAt: '2026-10-20T10:00:00.000Z', dueAt: '2026-10-29T10:00:00.000Z' }
      mastery[s] = m
    }
  }
  return mastery
}

const BLOCK_E = ['fracciones', 'geometria']

describe('block E in the syllabus', () => {
  it('the fraction and geometry blocks are available: no pending topic, every skill valid', () => {
    for (const block of GRADE3_SYLLABUS.blocks.filter((b) => BLOCK_E.includes(b.id))) {
      for (const topic of block.topics) {
        expect(topic.status, topic.id).toBe('disponible')
        expect(topic.skills.length, topic.id).toBeGreaterThan(0)
        for (const s of topic.skills) expect(isValidSkill(s), `${topic.id} ${s}`).toBe(true)
      }
    }
    const skills = availableSkills(GRADE3_SYLLABUS)
    expect(skills).toEqual(expect.arrayContaining(['frac:shade:2', 'frac:of:4', 'frac:compare', 'geo:poly:name', 'geo:perimeter']))
  })

  it('the topics keep the curricular order: fractions and then geometry, after the topics before them', () => {
    const ids = allTopics(GRADE3_SYLLABUS).map((t) => t.id)
    const at = (id: string) => ids.indexOf(id)
    expect(at('fracciones-mitad-cuarto')).toBeGreaterThan(at('comprobar-resultado'))
    expect(at('poligonos')).toBeGreaterThan(at('fracciones-mas-partes'))
  })
})

describe('the daily session uses the new topics', () => {
  it('a child who has the earlier topics gets the fraction topic, with fraction items in the plan', () => {
    const plan = planDailySession({ child, mastery: masteredBefore('fracciones-mitad-cuarto'), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic?.id).toBe('fracciones-mitad-cuarto')
    const kinds = plan.blocks.flatMap((b) => b.items.map((i) => i.exercise.kind))
    expect(kinds.some((k) => k.startsWith('fraction') || k === 'shape-choice')).toBe(true)
    expect(plan.practiceSeconds).toBeGreaterThan(0)
  })

  it('after the fractions, the geometry topic comes next', () => {
    const plan = planDailySession({ child, mastery: masteredBefore('poligonos'), attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan.topic?.id).toBe('poligonos')
    const kinds = plan.blocks.flatMap((b) => b.items.map((i) => i.exercise.kind))
    expect(kinds.some((k) => k === 'shape-choice' || k === 'shape-count' || k === 'angle-tap')).toBe(true)
  })
})

describe('the placement test reaches fractions and geometry', () => {
  it('one fraction item in its own block (one item per newer block keeps it about ten minutes)', () => {
    const items = buildPlacement('child-block-e|2026-10-22', now)
    expect(items).toHaveLength(PLACEMENT_COUNT)
    const fg = items.filter((i) => i.block === 'fracciones-geometria')
    expect(fg.map((i) => i.exercise.kind).sort()).toEqual(['fraction-read'])
  })

  it('the new skills belong to that block', () => {
    expect(placementBlockOf('frac:read:4')).toBe('fracciones-geometria')
    expect(placementBlockOf('geo:perimeter')).toBe('fracciones-geometria')
    expect(parseSkill('geo:poly:name')).toEqual({ type: 'geo', op: 'poly:name' })
  })
})
