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
   nothing the test did not ask is skipped. Pure: no React, no I/O. */
import { availableTopics, behindTopics, isTopicMastered, subjectOfTopic, type Syllabus, type SyllabusStage, type SyllabusTopic } from '@/content/syllabus'
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

/** Today's topic: the last one in teaching order whose class was finished today, else the topic to learn now. */
export function topicOfToday(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, now: Date, term?: number): SyllabusTopic | null {
  const flags = progress?.flags ?? {}
  const taught = availableTopics(course, term).filter((t) => flags[classTodayKey(t.id, now)] || flags[legacyEnglishKey(t.id, now)])
  return taught[taught.length - 1] ?? topicToLearn(course, mastery, progress, term)
}
