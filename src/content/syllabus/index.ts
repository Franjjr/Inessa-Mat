/* Syllabus public API: the 3.º de Primaria temario as data plus pure queries over it. Extensible to other courses
   by adding another Syllabus object (same model). */
import type { MasteryMap, SkillKey } from '@/types'
import type { Syllabus, SyllabusTopic } from './model'

export type { Syllabus, SyllabusBlock, SyllabusRung, SyllabusTopic } from './model'
export { SYLLABUS_RUNGS } from './model'
export { GRADE3_SYLLABUS, divisionFactSkills, tableSkills } from './grade3'

/** A skill counts as mastered at this Leitner box (two fluent answers). */
export const MASTERED_BOX = 2
/** A topic counts as mastered when this share of its skills is mastered: one lapse on a big table does not reopen it. */
export const MASTERED_SHARE = 0.8

export function allTopics(syllabus: Syllabus): SyllabusTopic[] {
  return syllabus.blocks.flatMap((b) => b.topics)
}

/** Topics that can be taught now (exercises exist) for a trimester; undefined term = all topics. */
export function availableTopics(syllabus: Syllabus, term?: number): SyllabusTopic[] {
  return allTopics(syllabus).filter((t) => t.status === 'disponible' && t.skills.length > 0 && (term === undefined || t.term === undefined || t.term === term))
}

export function blockIdOfTopic(syllabus: Syllabus, topicId: string): string | undefined {
  return syllabus.blocks.find((b) => b.topics.some((t) => t.id === topicId))?.id
}

export function isTopicMastered(topic: SyllabusTopic, mastery: MasteryMap): boolean {
  return topic.skills.length > 0 && topicProgress(topic, mastery) >= MASTERED_SHARE
}

/** The topic the child is working on: the first available one in curricular order that is not mastered yet. */
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
