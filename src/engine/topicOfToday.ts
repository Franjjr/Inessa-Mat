/* Today's topic, for every subject (the session, the home «Hoy» and the report's «ahora»). The practice of a class reports
   normal attempts, so a class can master its topic (every topic of one skill does) and the current topic would move on to the
   next one, whose class nobody has given. A finished class dates its topic with a flag, and that topic stays today's topic
   until the day ends. Pure: no React, no I/O. */
import { availableTopics, currentTopic, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
import type { MasteryMap, ProgressState } from '@/types'

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

/** The dated flag of a class finished on `now`'s day (ProgressState.flags). */
const classTodayKey = (topicId: string, now: Date) => `clase-hoy:${dayKey(now)}:${topicId}`
/** The same flag as the first English release wrote it (English classes only); still read so today's mark is kept. */
const legacyEnglishKey = (topicId: string, now: Date) => `ingles-clase-hoy:${dayKey(now)}:${topicId}`

/** Records that the class of a topic was finished today (with the class flag, see markClassDone). */
export function markClassToday(progress: ProgressState, topicId: string, now: Date): ProgressState {
  return { ...progress, flags: { ...progress.flags, [classTodayKey(topicId, now)]: true } }
}

/** Today's topic: the last one in teaching order whose class was finished today, else the current topic. */
export function topicOfToday(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, now: Date, term?: number): SyllabusTopic | null {
  const flags = progress?.flags ?? {}
  const taught = availableTopics(course, term).filter((t) => flags[classTodayKey(t.id, now)] || flags[legacyEnglishKey(t.id, now)])
  return taught[taught.length - 1] ?? currentTopic(course, mastery, term)
}
