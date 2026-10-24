/* The teaching order: eight stages, one per world, three trimesters. The adventure and the daily session follow it. */
import { describe, expect, it } from 'vitest'
import type { MasteryMap } from '@/types'
import { generate, newMastery } from '@/engine'
import { GRADE3_STAGES, GRADE3_SYLLABUS, allTopics, availableSkills, currentTopic, stageOfTopic, teachingOrder } from '@/content/syllabus'
import { guardians } from '../guardians'
import { season1 } from '../season'

/** Skills taught up to (and including) a stage. */
function skillsUpTo(stageIndex: number): Set<string> {
  const byId = new Map(allTopics(GRADE3_SYLLABUS).map((t) => [t.id, t]))
  return new Set(GRADE3_STAGES.slice(0, stageIndex + 1).flatMap((st) => st.topics.flatMap((id) => byId.get(id)!.skills)))
}

/** Skills of the new topic families (the ones each world's stage adds to its own operations). */
const isStageSkill = (s: string) => /^(num:|mental:|eq:|money:|measure:|clock:|time:|cal:|frac:|geo:)/.test(s)

describe('stages of the temario', () => {
  it('every topic is taught in exactly one stage, and the order covers the whole syllabus', () => {
    const staged = GRADE3_STAGES.flatMap((st) => st.topics)
    expect(new Set(staged).size).toBe(staged.length)
    expect([...staged].sort()).toEqual(allTopics(GRADE3_SYLLABUS).map((t) => t.id).sort())
    expect(teachingOrder(GRADE3_SYLLABUS).map((t) => t.id)).toEqual(staged)
  })

  it('one stage per world, in the order of the adventure, over three trimesters', () => {
    expect(GRADE3_STAGES.map((st) => st.worldId)).toEqual(season1.worlds.map((w) => w.id))
    expect(GRADE3_STAGES.map((st) => st.term)).toEqual([1, 1, 1, 2, 2, 2, 3, 3])
    for (const t of allTopics(GRADE3_SYLLABUS)) expect(t.term, t.id).toBe(stageOfTopic(GRADE3_SYLLABUS, t.id)!.term)
  })

  it('a world only asks the new topics of its own stage or earlier ones (its stops and its guardian)', () => {
    season1.worlds.forEach((w, i) => {
      const allowed = skillsUpTo(i)
      const stops = w.nodes.filter((n) => n.activity?.kind === 'exercises').flatMap((n) => n.activity!.selector.skills ?? [])
      const guardian = guardians.find((g) => g.id === `${w.id}-guardian`)!
      const asked = [...stops, ...guardian.rounds.flatMap((r) => r.selector.skills ?? [])].filter(isStageSkill)
      for (const s of asked) expect(allowed.has(s), `${w.id} asks ${s}`).toBe(true)
    })
  })

  it('every guardian ends with a round on its stage, and stays 6–8 items long', () => {
    for (const g of guardians) {
      const last = g.rounds[g.rounds.length - 1]
      expect((last.selector.skills ?? []).every(isStageSkill), g.id).toBe(true)
      const total = g.rounds.reduce((n, r) => n + r.count, 0)
      expect(total, g.id).toBeGreaterThanOrEqual(6)
      expect(total, g.id).toBeLessThanOrEqual(8)
    }
  })

  it('every skill of the temario generates its own exercises, and the proof of the subtraction and division is one topic (etapa 8)', () => {
    for (const s of availableSkills(GRADE3_SYLLABUS)) {
      expect(generate({ skills: [s] }, 1, { now: new Date('2026-10-22T10:00:00.000Z') }), s).toHaveLength(1)
    }
    expect(stageOfTopic(GRADE3_SYLLABUS, 'comprobar-resultado')?.id).toBe('etapa-8')
    expect(allTopics(GRADE3_SYLLABUS).filter((t) => t.skills.includes('check:sub')).map((t) => t.id)).toEqual(['comprobar-resultado'])
  })

  it('the session starts at etapa 1 and moves on to etapa 2 once it is learnt', () => {
    expect(currentTopic(GRADE3_SYLLABUS, {})?.id).toBe('descomponer-9999')
    const now = new Date('2026-10-22T10:00:00.000Z')
    const mastery: MasteryMap = {}
    for (const s of skillsUpTo(0)) mastery[s] = { ...newMastery(s, now), box: 3 }
    expect(currentTopic(GRADE3_SYLLABUS, mastery)?.id).toBe(GRADE3_STAGES[1].topics[0])
  })
})
