/* Today's topic, for every subject (the session, the home «Hoy» and the report's «ahora»). The practice of a class reports
   normal attempts, so a class can master its topic (every topic of one skill does) and the current topic would move on to the
   next one, whose class nobody has given. A finished class dates its topic with a flag, and that topic stays today's topic
   until the day ends.
   One path for the child: in a temario whose stages go with the worlds of the adventure (2.º and 3.º maths), today's topic is
   taken from the stage of the world the map sends the child to (nextNode), so «Hoy» and «Mi aventura» point to the same
   place. Only when that stage has nothing left to learn does the topic come from the rest of the temario, in teaching order.
   Topics the latest placement test showed the child already knows (placedTopicIds) wait until the other topics are mastered
   (after the others of the stage, and outside a stage after the rest of the temario), until a wrong answer on one of their
   skills brings them back. Only a topic whose every skill was answered clearly right is set aside (placementKnownTopics), so
   nothing the test did not ask is skipped.
   A topic practised STUCK_TOPIC_DAYS days without progress is passed over (isStuckTopic): it stays in the spaced review.
   Pure: no React, no I/O. */
import { availableTopics, behindTopics, blockIdOfTopic, isTopicMastered, MASTERED_BOX, MASTERED_SHARE, subjectOfTopic, type Syllabus, type SyllabusStage, type SyllabusTopic } from '@/content/syllabus'
import { nextNode } from '@/content/progression'
import { getSeason, seasonIdForGrade } from '@/content/season'
import type { MasteryMap, ProgressState } from '@/types'

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

/** The dated flag of a class finished on `now`'s day (ProgressState.flags). */
const classTodayKey = (topicId: string, now: Date) => `clase-hoy:${dayKey(now)}:${topicId}`
/** The same flag as the first English release wrote it (English classes only); still read so today's mark is kept. */
const legacyEnglishKey = (topicId: string, now: Date) => `ingles-clase-hoy:${dayKey(now)}:${topicId}`

/* The placement flags (ProgressState.flags). Flags merge with OR across devices, so a flag of an older run cannot be
   removed for good: every run writes its own keys instead, and only the subject's latest run counts.
   - prueba-ronda:<subject>:<runId>  a run of the subject's test was finished (runId: the time in ms, as text)
   - prueba-sabe:<runId>:<topicId>   that run showed the topic as known, to be confirmed */
const PLACEMENT_RUN_PREFIX = 'prueba-ronda:'
export const PLACEMENT_KNOWN_PREFIX = 'prueba-sabe:'
export const placementRunKey = (subject: string, runId: string) => `${PLACEMENT_RUN_PREFIX}${subject}:${runId}`
export const placementKnownKey = (runId: string, topicId: string) => `${PLACEMENT_KNOWN_PREFIX}${runId}:${topicId}`

/** The flags a finished run of the subject's test adds: its run mark and its known topics. Nothing older is removed. */
export function placementRunFlags(subject: string, runId: string, knownTopicIds: readonly string[]): Record<string, true> {
  return Object.fromEntries([placementRunKey(subject, runId), ...knownTopicIds.map((id) => placementKnownKey(runId, id))].map((k) => [k, true]))
}

/** The topics the latest run of each subject's test showed as known (whatever has been answered since). */
export function placedTopicIds(progress: ProgressState | undefined): Set<string> {
  const flags = progress?.flags ?? {}
  const latest = new Map<string, string>()
  for (const [key, on] of Object.entries(flags)) {
    if (!on || !key.startsWith(PLACEMENT_RUN_PREFIX)) continue
    const [subject, runId] = key.slice(PLACEMENT_RUN_PREFIX.length).split(':')
    if (!subject || !runId) continue
    const best = latest.get(subject)
    if (best === undefined || Number(runId) > Number(best)) latest.set(subject, runId)
  }
  const out = new Set<string>()
  for (const [key, on] of Object.entries(flags)) {
    if (!on || !key.startsWith(PLACEMENT_KNOWN_PREFIX)) continue
    const [runId, topicId] = key.slice(PLACEMENT_KNOWN_PREFIX.length).split(':')
    if (runId && topicId && latest.get(subjectOfTopic(topicId)) === runId) out.add(topicId)
  }
  return out
}

/** None of the topic's skills has been answered wrong (or «No lo sé»): correct still equals attempts. One wrong answer
    brings a placed topic back to normal practice. Known limit: two devices playing offline merge each count to its
    larger value (mergeMastery), so a wrong answer on one device can be hidden by more right answers on the other; the
    topic then stays set aside, its skills still come back in the spaced review, and it is taught after the others. */
const neverWrong = (topic: SyllabusTopic, mastery: MasteryMap) =>
  topic.skills.every((s) => {
    const m = mastery[s]
    return !m || m.correct >= m.attempts
  })

/** Records that the class of a topic was finished today (with the class flag, see markClassDone). */
export function markClassToday(progress: ProgressState, topicId: string, now: Date): ProgressState {
  return { ...progress, flags: { ...progress.flags, [classTodayKey(topicId, now)]: true } }
}

/** A topic the latest placement showed as known that is still waiting to be confirmed: none of its skills has been
    answered wrong since. */
export function isPlacedTopic(topic: SyllabusTopic, mastery: MasteryMap, progress: ProgressState | undefined): boolean {
  return placedTopicIds(progress).has(topic.id) && neverWrong(topic, mastery)
}

/** The stage of the temario that goes with the world the map sends the child to (nextNode). None when the temario has no
    worlds (4.º, Lengua, Inglés), when the progress plays another course's adventure, or when the adventure is won. */
export function stageOfCurrentWorld(course: Syllabus, progress: ProgressState | undefined): SyllabusStage | undefined {
  if (!progress || !course.stages?.some((st) => st.worldId)) return undefined
  if (getSeason(progress.seasonId).id !== seasonIdForGrade(course.course)) return undefined
  let next: ReturnType<typeof nextNode> = null
  try {
    next = nextNode(progress)
  } catch {
    return undefined
  }
  return next ? course.stages.find((st) => st.worldId === next!.worldId) : undefined
}

/** The topic to learn now: the first one not mastered in teaching order, preferring the stage of the current world, and
    within it the topics not set aside (behind, or known from the placement). Without a stage and without placement flags
    it is currentTopic. */
function topicToLearn(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, term?: number): SyllabusTopic | null {
  const open = availableTopics(course, term).filter((t) => !isTopicMastered(t, mastery))
  if (open.length === 0) return null
  const behind = new Set(behindTopics(course, mastery, term).map((t) => t.id))
  const placed = placedTopicIds(progress)
  const stage = stageOfCurrentWorld(course, progress)
  const rank = (t: SyllabusTopic) =>
    (stage && !stage.topics.includes(t.id) ? 2 : 0) + (behind.has(t.id) || (placed.has(t.id) && neverWrong(t, mastery)) ? 1 : 0)
  return open.reduce((best, t) => (rank(t) < rank(best) ? t : best))
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

/** The topic to learn, moving past a stuck one: the first open topic AFTER it, in teaching order, that is in another block
    (blocks are independent areas: geometry, time, money…; inside a block a topic may need the stuck one, like the divisions
    after «división con tablas»), is not behind and is not stuck; one not set aside by the placement test first. A stuck
    topic is not mastered, so its skills still come back in the spaced review and the report flags it. Without such a topic
    the current one stays: the child is never taken backwards, nor to something that needs what he cannot do yet. */
function unstuckTopicToLearn(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, term?: number): SyllabusTopic | null {
  const flags = progress?.flags
  const current = topicToLearn(course, mastery, progress, term)
  if (!current || !isStuckTopic(current, mastery, flags)) return current
  const behind = new Set(behindTopics(course, mastery, term).map((t) => t.id))
  const block = blockIdOfTopic(course, current.id)
  const open = availableTopics(course, term).filter((t) => !isTopicMastered(t, mastery))
  const after = open
    .slice(open.findIndex((t) => t.id === current.id) + 1)
    .filter((t) => blockIdOfTopic(course, t.id) !== block && !behind.has(t.id) && !isStuckTopic(t, mastery, flags))
  return after.find((t) => !isPlacedTopic(t, mastery, progress)) ?? after[0] ?? current
}

/** Today's topic: the last one in teaching order whose class was finished today, else the topic to learn now (past stuck
    ones). */
export function topicOfToday(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, now: Date, term?: number): SyllabusTopic | null {
  const flags = progress?.flags ?? {}
  const taught = availableTopics(course, term).filter((t) => flags[classTodayKey(t.id, now)] || flags[legacyEnglishKey(t.id, now)])
  return taught[taught.length - 1] ?? unstuckTopicToLearn(course, mastery, progress, term)
}
