/* Temario de 2.º: eight stages over three trimesters, numbers up to 999, whole euros, and the course decides the temario,
   the daily session and the prueba inicial. */
import { describe, expect, it } from 'vitest'
import type { ChildProfile, Exercise, MasteryMap } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { buildPlacement, check, generate, isValidSkill, newMastery, parseSkill, planDailySession, PLACEMENT_COUNT } from '@/engine'
import {
  GRADE2_STAGES, GRADE2_SYLLABUS, GRADE3_SYLLABUS, GRADE4_SYLLABUS, allTopics, availableSkills, currentTopic, syllabusForGrade, teachingOrder,
} from '@/content/syllabus'

const now = new Date('2026-10-22T10:00:00.000Z')

/** Every number a child reads or writes in a numbers, column or money exercise. */
function numbersOf(ex: Exercise): number[] {
  switch (ex.kind) {
    case 'place-value': return [ex.value]
    case 'compare': return [ex.left, ex.right]
    case 'order': return ex.values
    case 'number-line': return [...ex.ticks, ex.start ?? 0, ex.answer]
    case 'column-add': return [...ex.operands, ex.answer]
    case 'column-sub': return [ex.minuend, ex.subtrahend, ex.answer]
    default: return []
  }
}

describe('temario de 2.º', () => {
  it('every topic is taught in exactly one stage, three trimesters, one world of the 2.º adventure each', () => {
    const staged = GRADE2_STAGES.flatMap((st) => st.topics)
    expect(new Set(staged).size).toBe(staged.length)
    expect([...staged].sort()).toEqual(allTopics(GRADE2_SYLLABUS).map((t) => t.id).sort())
    expect(teachingOrder(GRADE2_SYLLABUS).map((t) => t.id)).toEqual(staged)
    expect(GRADE2_STAGES.map((st) => st.term)).toEqual([1, 1, 1, 2, 2, 2, 3, 3])
    expect(GRADE2_STAGES.map((st) => st.worldId)).toEqual(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'])
    expect(GRADE2_SYLLABUS.course).toBe(2)
  })

  it('only known skills, and none of 3.º: no division, fractions, 4 digits or céntimos', () => {
    const skills = availableSkills(GRADE2_SYLLABUS)
    for (const s of skills) expect(isValidSkill(s), s).toBe(true)
    for (const s of skills) {
      const p = parseSkill(s)!
      expect(['div', 'div2x1', 'div3x1', 'fraction', 'round', 'mul2x1', 'check'], s).not.toContain(p.type)
      if (p.type === 'add' || p.type === 'sub') expect(p.digits, s).toBeLessThanOrEqual(3)
      if (p.type === 'place' || p.type === 'compare' || p.type === 'order' || p.type === 'line') expect(p.max, s).toBe(999)
      if (p.type === 'money' && p.mode !== 'recognise') expect(p.whole, s).toBe(true)
      if (p.type === 'mul') expect([2, 3, 4, 5, 10].some((t) => p.a === t || p.b === t), s).toBe(true)
    }
  })

  it('its exercises stay up to 999, and its prices are whole euros', () => {
    for (const s of availableSkills(GRADE2_SYLLABUS)) {
      for (const ex of generate({ skills: [s] }, 12, { now })) {
        expect(ex.skill, s).toBe(s)
        for (const n of numbersOf(ex)) {
          expect(n, `${s} ${ex.id}`).toBeGreaterThanOrEqual(0)
          expect(n, `${s} ${ex.id}`).toBeLessThanOrEqual(999)
        }
        if (ex.kind === 'money' && ex.mode === 'pay') expect(ex.price % 100, ex.id).toBe(0)
        if (ex.kind === 'money' && ex.mode === 'add') expect(ex.items.every((it) => it.price % 100 === 0), ex.id).toBe(true)
      }
    }
  })

  it('a sum in whole euros is answered with the euros alone', () => {
    const [ex] = generate({ skills: ['money:add:e'] }, 1, { now })
    if (ex.kind !== 'money' || ex.mode !== 'add') throw new Error('not a money sum')
    expect(ex.whole).toBe(true)
    expect(check(ex, { type: 'numbers', values: [ex.answer / 100, 0] }).correct).toBe(true)
    const wrong = check(ex, { type: 'numbers', values: [ex.answer / 100 + 1, 0] })
    expect(wrong.correct).toBe(false)
    expect(wrong.feedback).not.toMatch(/céntimos/)
  })

  it('the session starts by counting in steps and moves on to etapa 2 once etapa 1 is learnt', () => {
    expect(currentTopic(GRADE2_SYLLABUS, {})?.id).toBe('contar-saltos')
    const byId = new Map(allTopics(GRADE2_SYLLABUS).map((t) => [t.id, t]))
    const mastery: MasteryMap = {}
    for (const id of GRADE2_STAGES[0].topics) for (const s of byId.get(id)!.skills) mastery[s] = { ...newMastery(s, now), box: 3 }
    expect(currentTopic(GRADE2_SYLLABUS, mastery)?.id).toBe(GRADE2_STAGES[1].topics[0])
  })
})

describe('the course decides the temario', () => {
  it('1.º and 2.º follow 2.º; 3.º, and a child without a course, follow 3.º; 4.º to 6.º follow 4.º', () => {
    expect(syllabusForGrade(1)).toBe(GRADE2_SYLLABUS)
    expect(syllabusForGrade(2)).toBe(GRADE2_SYLLABUS)
    expect(syllabusForGrade(3)).toBe(GRADE3_SYLLABUS)
    for (const g of [4, 5, 6]) expect(syllabusForGrade(g)).toBe(GRADE4_SYLLABUS)
    expect(syllabusForGrade(undefined)).toBe(GRADE3_SYLLABUS)
  })

  it('the 2.º prueba inicial has the same length, its own items and no division', () => {
    const items = buildPlacement('child-2|2026-10-22', now, 2)
    expect(items).toHaveLength(PLACEMENT_COUNT)
    expect(items.map((i) => i.block)).not.toContain('dividir')
    for (const { exercise } of items) {
      for (const n of numbersOf(exercise)) expect(n, exercise.id).toBeLessThanOrEqual(999)
    }
    expect(buildPlacement('child-2|2026-10-22', now, 3).map((i) => i.exercise.skill)).toContain('div:3x1:rem')
  })

  it('the daily session of a 2.º child only asks what its temario has', () => {
    const child: ChildProfile = {
      id: 'child-2', orgId: null, nickname: 'Lía', gender: 'f', grade: 2,
      companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
      settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
    }
    const allowed = new Set(availableSkills(GRADE2_SYLLABUS))
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE2_SYLLABUS, now })
    expect(plan.topic?.id).toBe('contar-saltos')
    for (const b of plan.blocks) for (const i of b.items) expect(allowed.has(i.exercise.skill), `${b.id} ${i.exercise.skill}`).toBe(true)
  })
})
