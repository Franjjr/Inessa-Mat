/* Syllabus public API: the 3.º de Primaria temario as data plus pure queries over it. Extensible to other courses
   by adding another Syllabus object (same model). */
import type { MasteryMap, SkillKey } from '@/types'
import type { Syllabus, SyllabusStage, SyllabusTopic } from './model'

export type { Syllabus, SyllabusBlock, SyllabusRung, SyllabusStage, SyllabusTopic } from './model'
export { SYLLABUS_RUNGS } from './model'
export { GRADE3_STAGES, GRADE3_SYLLABUS, divisionFactSkills, tableSkills } from './grade3'

/** A skill counts as mastered at this Leitner box (two fluent answers). */
export const MASTERED_BOX = 2
/** A topic counts as mastered when this share of its skills is mastered: one lapse on a big table does not reopen it. */
export const MASTERED_SHARE = 0.8

/** Every topic in block order (the adult report groups by block). */
export function allTopics(syllabus: Syllabus): SyllabusTopic[] {
  return syllabus.blocks.flatMap((b) => b.topics)
}

/** Every topic in teaching order: the stages first, then any topic no stage lists, in block order. */
export function teachingOrder(syllabus: Syllabus): SyllabusTopic[] {
  const byId = new Map(allTopics(syllabus).map((t) => [t.id, t]))
  const staged = (syllabus.stages ?? []).flatMap((st) => st.topics).map((id) => byId.get(id)).filter((t): t is SyllabusTopic => !!t)
  const seen = new Set(staged.map((t) => t.id))
  return [...staged, ...allTopics(syllabus).filter((t) => !seen.has(t.id))]
}

/** The stage that teaches a topic, if any. */
export function stageOfTopic(syllabus: Syllabus, topicId: string): SyllabusStage | undefined {
  return syllabus.stages?.find((st) => st.topics.includes(topicId))
}

/** Topics that can be taught now (exercises exist), in teaching order, for a trimester; undefined term = all topics. */
export function availableTopics(syllabus: Syllabus, term?: number): SyllabusTopic[] {
  return teachingOrder(syllabus).filter((t) => t.status === 'disponible' && t.skills.length > 0 && (term === undefined || t.term === undefined || t.term === term))
}

export function blockIdOfTopic(syllabus: Syllabus, topicId: string): string | undefined {
  return syllabus.blocks.find((b) => b.topics.some((t) => t.id === topicId))?.id
}

export function isTopicMastered(topic: SyllabusTopic, mastery: MasteryMap): boolean {
  return topic.skills.length > 0 && topicProgress(topic, mastery) >= MASTERED_SHARE
}

/** The topic the child is working on: the first available one in teaching order that is not mastered yet. */
export function currentTopic(syllabus: Syllabus, mastery: MasteryMap, term?: number): SyllabusTopic | null {
  return availableTopics(syllabus, term).find((t) => !isTopicMastered(t, mastery)) ?? null
}

/** Share of a topic's skills at the mastered box or above, 0..1. */
export function topicProgress(topic: SyllabusTopic, mastery: MasteryMap): number {
  if (topic.skills.length === 0) return 0
  const done = topic.skills.filter((s) => (mastery[s]?.box ?? -1) >= MASTERED_BOX).length
  return done / topic.skills.length
}

/** Every skill of the available topics, in curricular order, without duplicates. */
export function availableSkills(syllabus: Syllabus, term?: number): SkillKey[] {
  return [...new Set(availableTopics(syllabus, term).flatMap((t) => t.skills))]
}
