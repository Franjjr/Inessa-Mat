/* Skills added to a topic the child may already have mastered live in their own topic, right after (or before) the
   original one in the same stage. The original keeps its skills, so mastery never reopens; the new topic waits its turn
   and its first step comes back in the daily mix. */
import { describe, expect, it } from 'vitest'
import type { MasteryMap, SkillKey } from '@/types'
import { buildPlacement, newMastery, planDailySession } from '@/engine'
import type { PlanInput } from '@/engine/daily'
import type { Syllabus } from '@/content/syllabus'
import {
  GRADE3_STAGES, GRADE3_SYLLABUS, GRADE4_STAGES, GRADE4_SYLLABUS, allTopics, currentTopic, isTopicMastered, stageOfTopic,
  teachingOrder,
} from '@/content/syllabus'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { geoSkill } from '@/engine/skills'

const now = new Date('2026-10-22T10:00:00.000Z')

/** Original topic → the skill added to it, the topic that takes that skill, and where it goes. */
const SPLITS: { course: Syllabus; original: string; added: SkillKey[]; newTopic: string; after: boolean }[] = [
  { course: GRADE4_SYLLABUS, original: 'igualdad', added: ['eq:same'], newTopic: 'igualdad-dos-cuentas', after: true },
  { course: GRADE4_SYLLABUS, original: 'mul-2-cifras', added: ['mul:col:2x2'], newTopic: 'mul-2-cifras-columna', after: true },
  { course: GRADE4_SYLLABUS, original: 'mul-3x2', added: ['mul:col:3x2'], newTopic: 'mul-3x2-columna', after: true },
  { course: GRADE4_SYLLABUS, original: 'div-2-cifras', added: ['div:3x2:round'], newTopic: 'div-2-cifras-redondos', after: false },
  { course: GRADE4_SYLLABUS, original: 'prob-dos-pasos', added: ['bar:three', 'word:sense'], newTopic: 'prob-tres-pasos', after: true },
  { course: GRADE4_SYLLABUS, original: 'cambio-presupuesto', added: ['money:budget'], newTopic: 'presupuesto', after: true },
  { course: GRADE4_SYLLABUS, original: 'longitud-4', added: ['measure:convert:length:all'], newTopic: 'longitud-conversiones', after: true },
  { course: GRADE4_SYLLABUS, original: 'masa-capacidad-4', added: ['measure:convert:mass:all', 'measure:convert:capacity:all'], newTopic: 'masa-capacidad-conversiones', after: true },
  { course: GRADE4_SYLLABUS, original: 'duraciones-4', added: ['time:seconds'], newTopic: 'duraciones-segundos', after: true },
  { course: GRADE4_SYLLABUS, original: 'simetria', added: [geoSkill('translate')], newTopic: 'traslacion', after: true },
  { course: GRADE4_SYLLABUS, original: 'poligonos-cuerpos', added: [geoSkill('solid:count')], newTopic: 'cuerpos-contar', after: true },
  { course: GRADE4_SYLLABUS, original: 'moda', added: ['chart:freq'], newTopic: 'frecuencia', after: true },
  { course: GRADE4_SYLLABUS, original: 'probabilidad', added: ['prob:likely'], newTopic: 'probabilidad-probable', after: true },
  { course: GRADE3_SYLLABUS, original: 'angulos-rectos', added: [geoSkill('angle:class')], newTopic: 'angulos-clase', after: true },
  { course: GRADE3_SYLLABUS, original: 'graficos', added: ['chart:table'], newTopic: 'graficos-tablas', after: true },
]

const topicOf = (course: Syllabus, id: string) => allTopics(course).find((t) => t.id === id)!
const stagesOf = (course: Syllabus) => (course === GRADE4_SYLLABUS ? GRADE4_STAGES : GRADE3_STAGES)

/** Mastery at the mastered box for every skill of the given topics. */
function masteredTopics(course: Syllabus, ids: string[], base: MasteryMap = {}): MasteryMap {
  const out: MasteryMap = { ...base }
  for (const id of ids) for (const s of topicOf(course, id).skills) out[s] = { ...newMastery(s, now), box: 2 }
  return out
}

describe('skills added to a stage the child has passed', () => {
  it.each(SPLITS)('$original keeps its own skills; $newTopic teaches the added ones next to it', ({ course, original, added, newTopic, after }) => {
    const orig = topicOf(course, original)
    for (const s of added) expect(orig.skills).not.toContain(s)
    expect(topicOf(course, newTopic).skills).toEqual(added)
    const stage = stagesOf(course).find((st) => st.topics.includes(original))!
    expect(stage.topics).toContain(newTopic)
    expect(stage.topics.indexOf(newTopic) - stage.topics.indexOf(original)).toBe(after ? 1 : -1)
    expect(stageOfTopic(course, newTopic)?.id).toBe(stage.id)
  })

  it.each(SPLITS)('a child who has mastered $original keeps it mastered; $newTopic is ahead (after) or behind (before) it', ({ course, original, newTopic, after }) => {
    const orig = topicOf(course, original)
    const mastery = masteredTopics(course, [original])
    expect(isTopicMastered(orig, mastery)).toBe(true)
    const current = currentTopic(course, mastery)?.id
    expect(current).not.toBe(original)
    if (after) expect(current).toBe(newTopic)
    else expect(current).not.toBe(newTopic)
  })

  it('a fresh child meets the topics in teaching order, new ones included', () => {
    for (const course of [GRADE3_SYLLABUS, GRADE4_SYLLABUS]) {
      const order = teachingOrder(course).filter((t) => t.status === 'disponible' && t.skills.length > 0).map((t) => t.id)
      const met: string[] = []
      const mastery: MasteryMap = {}
      for (let cur = currentTopic(course, mastery); cur; cur = currentTopic(course, mastery)) {
        met.push(cur.id)
        for (const s of cur.skills) mastery[s] = { ...newMastery(s, now), box: 2 }
        if (met.length > order.length) break
      }
      expect(met.map((id) => order.indexOf(id))).toEqual([...met.map((id) => order.indexOf(id))].sort((a, b) => a - b))
      expect(met[0]).toBe(order[0])
      expect(new Set(met).size).toBe(met.length)
    }
  })
})

describe('a topic behind a stage the child has passed (4.º)', () => {
  const child = {
    id: 'child-4', orgId: null, nickname: 'Leo', gender: 'm' as const, grade: 4,
    companion: { species: 'dog' as const, name: 'Toby', gender: 'm' as const, colorway: 'default' as const, equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  }
  const planWith = (mastery: MasteryMap, extra: Partial<PlanInput> = {}) =>
    planDailySession({ child, mastery, attempts: [], syllabus: GRADE4_SYLLABUS, now, ...extra })
  const itemsOf = (plan: ReturnType<typeof planWith>, block: 'new' | 'mix') => plan.blocks.find((b) => b.id === block)!.items

  it('a child who mastered stages 1 to 6 is not pulled back to the new topic of stage 2: its first step comes in the mix', () => {
    const before = GRADE4_STAGES.slice(0, 6).flatMap((st) => st.topics).filter((id) => id !== 'propiedades')
    const mastery = masteredTopics(GRADE4_SYLLABUS, before)
    const plan = planWith(mastery)
    expect(plan.topic?.id).toBe('fracciones-comparar')
    expect(itemsOf(plan, 'new').map((i) => i.exercise.skill)).not.toContain('concept:commutative')
    expect(itemsOf(plan, 'mix').map((i) => i.exercise.skill)).toContain('concept:commutative')
  })

  it('the same holds for a topic added to stage 4 that the child has not met: the column step waits in the mix', () => {
    const before = GRADE4_STAGES.slice(0, 6).flatMap((st) => st.topics).filter((id) => id !== 'mul-2-cifras-columna')
    const mastery = masteredTopics(GRADE4_SYLLABUS, before)
    const plan = planWith(mastery)
    expect(plan.topic?.id).not.toBe('mul-2-cifras-columna')
    expect(itemsOf(plan, 'new').map((i) => i.exercise.skill)).not.toContain('mul:col:2x2')
    expect(itemsOf(plan, 'mix').map((i) => i.exercise.skill)).toContain('mul:col:2x2')
  })

  it('the mix gets one step of the behind topic, and only one', () => {
    const before = GRADE4_STAGES.slice(0, 6).flatMap((st) => st.topics).filter((id) => id !== 'propiedades')
    const plan = planWith(masteredTopics(GRADE4_SYLLABUS, before))
    const mix = itemsOf(plan, 'mix')
    expect(mix.filter((i) => i.exercise.skill === 'concept:commutative')).toHaveLength(1)
  })

  it('a fresh child sees the new topics in order: the stage one topics come before the new numbers topic', () => {
    const plan = planWith({})
    expect(plan.topic?.id).toBe('repaso-numeros')
    expect(stageOfTopic(GRADE4_SYLLABUS, 'numeros-99999')?.id).toBe('etapa-1')
    expect(GRADE4_STAGES[0].topics.indexOf('numeros-99999')).toBe(1)
  })
})

// Keep the placement import used: the 4.º prueba inicial is built from the same syllabus.
void buildPlacement
void teachingOrder
void GRADE3_STAGES
