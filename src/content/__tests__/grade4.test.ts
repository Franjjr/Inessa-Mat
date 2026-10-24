/* Temario de 4.º: eight stages over three trimesters, every skill generates, and the course picks the session and the
   prueba inicial. */
import { describe, expect, it } from 'vitest'
import type { ChildProfile, MasteryMap } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { buildPlacement, generate, isValidSkill, newMastery, planDailySession, PLACEMENT_COUNT } from '@/engine'
import { GRADE4_STAGES, GRADE4_SYLLABUS, allTopics, availableSkills, currentTopic, teachingOrder } from '@/content/syllabus'

const now = new Date('2026-10-22T10:00:00.000Z')

describe('temario de 4.º', () => {
  it('every topic is taught in exactly one stage, three trimesters, no world of the adventure', () => {
    const staged = GRADE4_STAGES.flatMap((st) => st.topics)
    expect(new Set(staged).size).toBe(staged.length)
    expect([...staged].sort()).toEqual(allTopics(GRADE4_SYLLABUS).map((t) => t.id).sort())
    expect(teachingOrder(GRADE4_SYLLABUS).map((t) => t.id)).toEqual(staged)
    expect(GRADE4_STAGES.map((st) => st.term)).toEqual([1, 1, 1, 2, 2, 2, 3, 3])
    expect(GRADE4_SYLLABUS.course).toBe(4)
  })

  it('every skill is known and generates its own exercises', () => {
    for (const s of availableSkills(GRADE4_SYLLABUS)) {
      expect(isValidSkill(s), s).toBe(true)
      for (const ex of generate({ skills: [s] }, 3, { now })) expect(ex.skill, s).toBe(s)
    }
  })

  it('the session starts with the review of numbers and moves on once etapa 1 is learnt', () => {
    expect(currentTopic(GRADE4_SYLLABUS, {})?.id).toBe('repaso-numeros')
    const byId = new Map(allTopics(GRADE4_SYLLABUS).map((t) => [t.id, t]))
    const mastery: MasteryMap = {}
    for (const id of GRADE4_STAGES[0].topics) for (const s of byId.get(id)!.skills) mastery[s] = { ...newMastery(s, now), box: 3 }
    expect(currentTopic(GRADE4_SYLLABUS, mastery)?.id).toBe(GRADE4_STAGES[1].topics[0])
  })

  it('the 4.º prueba inicial has twenty items with 4.º skills', () => {
    const items = buildPlacement('child-4|2026-10-22', now, 4)
    expect(items).toHaveLength(PLACEMENT_COUNT)
    const skills = items.map((i) => i.exercise.skill)
    for (const s of ['mul:2dx2d', 'div:4x1:exact', 'num:round:1000', 'mental:romanos', 'geo:area']) expect(skills).toContain(s)
  })

  it('an ordered step waits its turn: with mul:2dx2d at box 2, the plan teaches the column step mul:col:2x2', () => {
    const byId = new Map(allTopics(GRADE4_SYLLABUS).map((t) => [t.id, t]))
    const mastery: MasteryMap = {}
    const before = GRADE4_STAGES.slice(0, 3).flatMap((st) => st.topics)
    for (const id of before) for (const s of byId.get(id)!.skills) mastery[s] = { ...newMastery(s, now), box: 3 }
    mastery['mul:2dx2d'] = { ...newMastery('mul:2dx2d', now), box: 2 }
    expect(currentTopic(GRADE4_SYLLABUS, mastery)?.id).toBe('mul-2-cifras')
    const child: ChildProfile = {
      id: 'child-4', orgId: null, nickname: 'Leo', gender: 'm', grade: 4,
      companion: { species: 'dog', name: 'Toby', gender: 'm', colorway: 'default', equipped: [] },
      settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
    }
    const plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE4_SYLLABUS, now })
    const fresh = plan.blocks.find((b) => b.id === 'new')!.items.map((i) => i.exercise.skill)
    expect(fresh.length).toBeGreaterThan(0)
    expect(fresh.every((sk) => sk === 'mul:col:2x2')).toBe(true)

    // Before the by-parts step is learnt, the plan teaches only that step, not the column one.
    const earlier: MasteryMap = { ...mastery }
    delete earlier['mul:2dx2d']
    const first = planDailySession({ child, mastery: earlier, attempts: [], syllabus: GRADE4_SYLLABUS, now })
    const newFirst = first.blocks.find((b) => b.id === 'new')!.items.map((i) => i.exercise.skill)
    expect(newFirst.length).toBeGreaterThan(0)
    expect(newFirst.every((sk) => sk === 'mul:2dx2d')).toBe(true)
  })

  it('the daily session of a 4.º child only asks what its temario has', () => {
    const child: ChildProfile = {
      id: 'child-4', orgId: null, nickname: 'Leo', gender: 'm', grade: 4,
      companion: { species: 'dog', name: 'Toby', gender: 'm', colorway: 'default', equipped: [] },
      settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
    }
    const allowed = new Set(availableSkills(GRADE4_SYLLABUS))
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE4_SYLLABUS, now })
    expect(plan.topic?.id).toBe('repaso-numeros')
    for (const b of plan.blocks) for (const i of b.items) expect(allowed.has(i.exercise.skill), `${b.id} ${i.exercise.skill}`).toBe(true)
  })
})
