/* Subjects: which school subject a skill key belongs to. Lengua skills start with `lng:`; every other key is maths.
   Maths readers filter first (masteryOf / attemptsOf), so Lengua rows never reach a maths plan, count or report.
   Flags are OR-merged forever (src/data/merge.ts), so Lengua flags and keys never reuse a maths name. */
import type { MasteryMap, SessionRecord, SkillKey, SubjectId } from '@/types'

/** The subjects that have their own sessions and placement today. */
export type LessonSubject = Extract<SubjectId, 'math' | 'language'>

const LANGUAGE_PREFIX = 'lng:'

export function subjectOfSkill(skill: SkillKey): SubjectId {
  return skill.startsWith(LANGUAGE_PREFIX) ? 'language' : 'math'
}

/** The mastery rows of one subject (a copy: the input is not changed). */
export function masteryOf(mastery: MasteryMap, subject: SubjectId): MasteryMap {
  const out: MasteryMap = {}
  for (const [skill, m] of Object.entries(mastery)) {
    if (m && subjectOfSkill(skill) === subject) out[skill] = m
  }
  return out
}

/** The attempts of one subject, in their order. */
export function attemptsOf<T extends { skill: SkillKey }>(list: readonly T[], subject: SubjectId): T[] {
  return list.filter((a) => subjectOfSkill(a.skill) === subject)
}

/** Progress flags of the placement test of each subject (the maths names are the original ones). */
export function placementFlags(subject: LessonSubject): { done: string; requested: string } {
  return subject === 'language'
    ? { done: 'placementLengua', requested: 'placementLenguaRequested' }
    : { done: 'placement', requested: 'placementRequested' }
}

/** The subject of a play session: the Lengua sessions carry their mark in the summary, every other session is maths. */
export function subjectOfSession(session: Pick<SessionRecord, 'summary'>): SubjectId {
  return session.summary?.subject === 'language' ? 'language' : 'math'
}

/** Whether a child of this course is offered a subject. Lengua is the 3.º one (a child without a course follows 3.º). */
export function subjectOffered(subject: SubjectId, grade?: number): boolean {
  return subject === 'language' ? grade === undefined || grade === 3 : true
}
