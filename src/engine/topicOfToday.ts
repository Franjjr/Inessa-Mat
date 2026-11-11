/* Today's topic, for every subject (the session, the home «Hoy» and the report's «ahora»). The practice of a class reports
   normal attempts, so a class can master its topic (every topic of one skill does) and the current topic would move on to the
   next one, whose class nobody has given. A finished class dates its topic with a flag, and that topic stays today's topic
   until the day ends. Pure: no React, no I/O. */
import { availableTopics, currentTopic, isTopicMastered, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
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

/** Days of practice in the same unmastered topic after which the session moves on to the next topic. */
export const STUCK_TOPIC_DAYS = 5
const PRACTICE_DAY_PREFIX = 'tema-dia:'
/** The dated flag of a day the topic was practised in «Lo nuevo» (flags merge with OR across devices, so days never get lost). */
const practiceDayKey = (topicId: string, now: Date) => `${PRACTICE_DAY_PREFIX}${topicId}:${dayKey(now)}`

/** Records that the topic was practised in «Lo nuevo» on `now`'s day. Idempotent: the same day counts once. */
export function markTopicPracticeDay(progress: ProgressState, topicId: string, now: Date): ProgressState {
  const key = practiceDayKey(topicId, now)
  if (progress.flags?.[key]) return progress
  return { ...progress, flags: { ...progress.flags, [key]: true }, updatedAt: now.toISOString() }
}

/** How many different days the topic has been practised in «Lo nuevo». */
export function topicPracticeDays(flags: Record<string, boolean> | undefined, topicId: string): number {
  const prefix = `${PRACTICE_DAY_PREFIX}${topicId}:`
  return Object.keys(flags ?? {}).filter((k) => k.startsWith(prefix) && flags?.[k]).length
}

/** A topic is stuck when it was practised on STUCK_TOPIC_DAYS days or more and is still not mastered. */
export function isStuckTopic(topic: SyllabusTopic, mastery: MasteryMap, flags: Record<string, boolean> | undefined): boolean {
  return !isTopicMastered(topic, mastery) && topicPracticeDays(flags, topic.id) >= STUCK_TOPIC_DAYS
}

/** The current topic, moving past stuck ones: the first open topic in teaching order that is not stuck. A stuck topic is not
    mastered, so its skills still come back in the spaced review and the report flags it. When every open topic is stuck,
    the current one stays (there is nothing else to teach). */
function currentUnstuckTopic(course: Syllabus, mastery: MasteryMap, flags: Record<string, boolean> | undefined, term?: number): SyllabusTopic | null {
  const current = currentTopic(course, mastery, term)
  if (!current || !isStuckTopic(current, mastery, flags)) return current
  const open = availableTopics(course, term).filter((t) => !isTopicMastered(t, mastery))
  const from = open.findIndex((t) => t.id === current.id)
  const next = [...open.slice(from + 1), ...open.slice(0, Math.max(from, 0))].find((t) => !isStuckTopic(t, mastery, flags))
  return next ?? current
}

/** Today's topic: the last one in teaching order whose class was finished today, else the current topic (past stuck ones). */
export function topicOfToday(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, now: Date, term?: number): SyllabusTopic | null {
  const flags = progress?.flags ?? {}
  const taught = availableTopics(course, term).filter((t) => flags[classTodayKey(t.id, now)] || flags[legacyEnglishKey(t.id, now)])
  return taught[taught.length - 1] ?? currentUnstuckTopic(course, mastery, flags, term)
}
