/* Subjects: which school subject a skill key belongs to. Lengua skills start with `lng:`, English with `eng:`; every other key is maths.
   Maths readers filter first (masteryOf / attemptsOf), so Lengua and English rows never reach a maths plan, count or report.
   Flags are OR-merged forever (src/data/merge.ts), so the Lengua and English flags and keys never reuse a maths name. */
import type { MasteryMap, SessionRecord, SessionSubject, SkillKey, SubjectId } from '@/types'

/** The subjects that have their own sessions and placement. */
export type LessonSubject = Extract<SubjectId, 'math' | 'language' | 'english'>

/** The English session lasts this many minutes (the maths and Lengua ones use DAILY_MINUTES). */
export const ENGLISH_SESSION_MINUTES = 10

/** The skill-key prefix of each subject that is not maths. A key with no listed prefix is maths. */
const SUBJECT_OF_PREFIX: [prefix: string, subject: LessonSubject][] = [['lng:', 'language'], ['eng:', 'english']]
/* Handwriting keys start with `calig:`. Maths keeps `cal:weekday` and `cal:month` (the calendar), so the prefix is not `cal:`. */
const HANDWRITING_PREFIX = 'calig:'

export function subjectOfSkill(skill: SkillKey): LessonSubject {
  return SUBJECT_OF_PREFIX.find(([prefix]) => skill.startsWith(prefix))?.[1] ?? 'math'
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
const PLACEMENT_FLAGS = {
  math: { done: 'placement', requested: 'placementRequested' },
  language: { done: 'placementLengua', requested: 'placementLenguaRequested' },
  english: { done: 'placementIngles', requested: 'placementInglesRequested' },
} as const satisfies Record<LessonSubject, { done: string; requested: string }>

export function placementFlags(subject: LessonSubject): (typeof PLACEMENT_FLAGS)[LessonSubject] {
  return PLACEMENT_FLAGS[subject]
}

/** The subject of a play session: the Lengua, English and Caligrafía sessions carry their mark in the summary, every
    other session is maths. */
export function subjectOfSession(session: Pick<SessionRecord, 'summary'>): SessionSubject {
  const marked = session.summary?.subject
  return marked === 'language' || marked === 'english' || marked === 'handwriting' ? marked : 'math'
}

/** The grades a subject is offered to, for the subjects that are not for every course (every other one is offered to all). */
const offeredFor3 = (grade?: number) => grade === undefined || grade === 3
const OFFERED_TO: Partial<Record<SubjectId, (grade?: number) => boolean>> = { language: offeredFor3, english: offeredFor3 }

/** Whether a child of this course is offered a subject. Lengua and English are the 3.º ones (a child without a course follows 3.º). */
export function subjectOffered(subject: SubjectId, grade?: number): boolean {
  const offered = OFFERED_TO[subject]
  return offered ? offered(grade) : true
}

/** Minutes of play of one subject in the sessions given (a session with no minutes counts as zero). */
export function minutesOfSubject(sessions: readonly Pick<SessionRecord, 'summary' | 'minutes'>[], subject: SubjectId): number {
  return sessions.filter((s) => subjectOfSession(s) === subject).reduce((sum, s) => sum + (Number(s.minutes) || 0), 0)
}
