/* Subjects: which school subject a skill key belongs to. Lengua skills start with `lng:`; every other key is maths.
   Maths readers filter first (masteryOf / attemptsOf), so Lengua rows never reach a maths plan, count or report.
   Flags are OR-merged forever (src/data/merge.ts), so Lengua flags and keys never reuse a maths name. */
import type { MasteryMap, SessionRecord, SkillKey, SubjectId } from '@/types'

/** The subjects that have their own sessions and placement today. */
export type LessonSubject = Extract<SubjectId, 'math' | 'language'>

const LANGUAGE_PREFIX = 'lng:'
/* Handwriting keys start with `calig:`. Maths keeps `cal:weekday` and `cal:month` (the calendar), so the prefix is not `cal:`. */
const HANDWRITING_PREFIX = 'calig:'

export function subjectOfSkill(skill: SkillKey): SubjectId {
  return skill.startsWith(LANGUAGE_PREFIX) ? 'language' : 'math'
}

/** Caligrafía con lápiz (`calig:…`): not a subject. Its rows are kept apart from maths and Lengua readers. */
export function isHandwritingSkill(skill: SkillKey): boolean {
  return skill.startsWith(HANDWRITING_PREFIX)
}

/** The mastery rows of one subject (a copy: the input is not changed). */
export function masteryOf(mastery: MasteryMap, subject: SubjectId): MasteryMap {
  const out: MasteryMap = {}
  for (const [skill, m] of Object.entries(mastery)) {
    if (m && !isHandwritingSkill(skill) && subjectOfSkill(skill) === subject) out[skill] = m
  }
  return out
}

/** The attempts of one subject, in their order. */
export function attemptsOf<T extends { skill: SkillKey }>(list: readonly T[], subject: SubjectId): T[] {
  return list.filter((a) => !isHandwritingSkill(a.skill) && subjectOfSkill(a.skill) === subject)
}

/** The handwriting (calig:) rows of a mastery map (a copy). */
export function handwritingMastery(mastery: MasteryMap): MasteryMap {
  const out: MasteryMap = {}
  for (const [skill, m] of Object.entries(mastery)) {
    if (m && isHandwritingSkill(skill)) out[skill] = m
  }
  return out
}

/** The handwriting (calig:) attempts, in their order. */
export function handwritingAttempts<T extends { skill: SkillKey }>(list: readonly T[]): T[] {
  return list.filter((a) => isHandwritingSkill(a.skill))
}

/** Progress flags of the placement test of each subject (the maths names are the original ones). */
export function placementFlags(subject: LessonSubject): { done: 'placement' | 'placementLengua'; requested: 'placementRequested' | 'placementLenguaRequested' } {
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

/** Minutes of play of one subject in the sessions given (a session with no minutes counts as zero). */
export function minutesOfSubject(sessions: readonly Pick<SessionRecord, 'summary' | 'minutes'>[], subject: SubjectId): number {
  return sessions.filter((s) => subjectOfSession(s) === subject).reduce((sum, s) => sum + (Number(s.minutes) || 0), 0)
}
