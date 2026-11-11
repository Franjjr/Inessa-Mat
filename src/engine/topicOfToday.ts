/* Today's topic, for every subject (the session, the home «Hoy» and the report's «ahora»). The practice of a class reports
   normal attempts, so a class can master its topic (every topic of one skill does) and the current topic would move on to the
   next one, whose class nobody has given. A finished class dates its topic with a flag, and that topic stays today's topic
   until the day ends. Pure: no React, no I/O. */
import { availableTopics, behindTopics, blockIdOfTopic, currentTopic, isTopicMastered, MASTERED_BOX, MASTERED_SHARE, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
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

/** Days of practice in a row without any progress after which the session moves on to another topic. */
export const STUCK_TOPIC_DAYS = 5
/** Practice days kept per topic (older ones are dropped so the flags do not grow for ever). */
const KEPT_PRACTICE_DAYS = 8
const PRACTICE_DAY_PREFIX = 'tema-dia:'
/** One flag per day and topic: `tema-dia:<topic>:<date>:<n>`, where n is how many skills of the topic were at the mastered
    box or above at the end of that day. The progress travels in the key because flags are booleans (and merge with OR). */
const practiceDayKey = (topicId: string, date: string, n: number) => `${PRACTICE_DAY_PREFIX}${topicId}:${date}:${n}`

interface PracticeDay { key: string; date: string; n: number }

/** The practice days of a topic, oldest first, one per date. */
function practiceDays(flags: Record<string, boolean> | undefined, topicId: string): PracticeDay[] {
  const prefix = `${PRACTICE_DAY_PREFIX}${topicId}:`
  const byDate = new Map<string, PracticeDay>()
  for (const key of Object.keys(flags ?? {})) {
    if (!key.startsWith(prefix) || !flags?.[key]) continue
    const [date, n] = key.slice(prefix.length).split(':')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) continue
    const day = { key, date, n: Number(n) || 0 }
    // Two devices may have written the same date: keep the one with more progress.
    if (!byDate.has(date) || day.n > byDate.get(date)!.n) byDate.set(date, day)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Skills of the topic at the mastered box or above. */
const doneSkills = (topic: SyllabusTopic, mastery: MasteryMap) => topic.skills.filter((s) => (mastery[s]?.box ?? -1) >= MASTERED_BOX).length

/** Records that the topic was practised in «Lo nuevo» on `now`'s day, with its progress at that moment. Idempotent per day
    (the day keeps the most progress). A topic that was mastered and opens again starts a new count. Old days are dropped. */
export function markTopicPracticeDay(progress: ProgressState, topic: SyllabusTopic, mastery: MasteryMap, now: Date): ProgressState {
  const date = dayKey(now)
  const before = practiceDays(progress.flags, topic.id)
  const last = before.filter((d) => d.date < date).pop()
  const reopened = !!last && topic.skills.length > 0 && last.n / topic.skills.length >= MASTERED_SHARE
  const todays = before.find((d) => d.date === date)
  const kept = (reopened ? [] : before.filter((d) => d.date < date)).slice(-(KEPT_PRACTICE_DAYS - 1))
  const n = Math.max(doneSkills(topic, mastery), reopened ? 0 : todays?.n ?? 0)
  const all = new Set(Object.keys(progress.flags ?? {}).filter((k) => k.startsWith(`${PRACTICE_DAY_PREFIX}${topic.id}:`)))
  const flags: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(progress.flags ?? {})) if (!all.has(k)) flags[k] = v
  for (const d of kept) flags[d.key] = true
  flags[practiceDayKey(topic.id, date, n)] = true
  return { ...progress, flags, updatedAt: now.toISOString() }
}

/** How many different days the topic has been practised in «Lo nuevo» (only the latest ones are kept). */
export function topicPracticeDays(flags: Record<string, boolean> | undefined, topicId: string): number {
  return practiceDays(flags, topicId).length
}

/** A topic is stuck when the last STUCK_TOPIC_DAYS days of practice did not add a single skill at the mastered box (a child
    who keeps advancing is never stuck, however big the topic) and the topic is still not mastered. */
export function isStuckTopic(topic: SyllabusTopic, mastery: MasteryMap, flags: Record<string, boolean> | undefined): boolean {
  if (isTopicMastered(topic, mastery)) return false
  const days = practiceDays(flags, topic.id).slice(-STUCK_TOPIC_DAYS)
  if (days.length < STUCK_TOPIC_DAYS) return false
  return Math.max(doneSkills(topic, mastery), ...days.map((d) => d.n)) <= days[0].n
}

/** The current topic, moving past stuck ones: the first open topic AFTER it, in teaching order, that is in another block
    (blocks are independent areas: geometry, time, money…; inside a block a topic may need the stuck one, like the divisions
    after «división con tablas»), is not behind and is not stuck. A stuck topic is not mastered, so its skills still come back
    in the spaced review and the report flags it. Without such a topic the current one stays: the child is never taken
    backwards, nor to something that needs what he cannot do yet. */
function currentUnstuckTopic(course: Syllabus, mastery: MasteryMap, flags: Record<string, boolean> | undefined, term?: number): SyllabusTopic | null {
  const current = currentTopic(course, mastery, term)
  if (!current || !isStuckTopic(current, mastery, flags)) return current
  const behind = new Set(behindTopics(course, mastery, term).map((t) => t.id))
  const block = blockIdOfTopic(course, current.id)
  const open = availableTopics(course, term).filter((t) => !isTopicMastered(t, mastery))
  const next = open
    .slice(open.findIndex((t) => t.id === current.id) + 1)
    .find((t) => blockIdOfTopic(course, t.id) !== block && !behind.has(t.id) && !isStuckTopic(t, mastery, flags))
  return next ?? current
}

/** Today's topic: the last one in teaching order whose class was finished today, else the current topic (past stuck ones). */
export function topicOfToday(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, now: Date, term?: number): SyllabusTopic | null {
  const flags = progress?.flags ?? {}
  const taught = availableTopics(course, term).filter((t) => flags[classTodayKey(t.id, now)] || flags[legacyEnglishKey(t.id, now)])
  return taught[taught.length - 1] ?? currentUnstuckTopic(course, mastery, flags, term)
}
