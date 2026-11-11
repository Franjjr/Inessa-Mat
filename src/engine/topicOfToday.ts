/* Today's topic, for every subject (the session, the home «Hoy» and the report's «ahora»). The practice of a class reports
   normal attempts, so a class can master its topic (every topic of one skill does) and the current topic would move on to the
   next one, whose class nobody has given. A finished class dates its topic with a flag, and that topic stays today's topic
   until the day ends.
   One path for the child: in a temario whose stages go with the worlds of the adventure (2.º and 3.º maths), today's topic is
   taken from the stage of the world the map sends the child to (nextNode), so «Hoy» and «Mi aventura» point to the same
   place. Only when that stage has nothing left to learn does the topic come from the rest of the temario, in teaching order.
   Topics the placement test showed the child already knows (placementKnownKey) wait after the others of their stage, until a
   wrong answer on one of their skills brings them back. Pure: no React, no I/O. */
import { availableTopics, behindTopics, isTopicMastered, type Syllabus, type SyllabusStage, type SyllabusTopic } from '@/content/syllabus'
import { nextNode } from '@/content/progression'
import { getSeason, seasonIdForGrade } from '@/content/season'
import type { MasteryMap, ProgressState } from '@/types'

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

/** The dated flag of a class finished on `now`'s day (ProgressState.flags). */
const classTodayKey = (topicId: string, now: Date) => `clase-hoy:${dayKey(now)}:${topicId}`
/** The same flag as the first English release wrote it (English classes only); still read so today's mark is kept. */
const legacyEnglishKey = (topicId: string, now: Date) => `ingles-clase-hoy:${dayKey(now)}:${topicId}`

/** The flag of a topic the placement test showed the child already knows, to be confirmed (ProgressState.flags). */
export const PLACEMENT_KNOWN_PREFIX = 'prueba-sabe:'
export const placementKnownKey = (topicId: string) => `${PLACEMENT_KNOWN_PREFIX}${topicId}`

/** Records that the class of a topic was finished today (with the class flag, see markClassDone). */
export function markClassToday(progress: ProgressState, topicId: string, now: Date): ProgressState {
  return { ...progress, flags: { ...progress.flags, [classTodayKey(topicId, now)]: true } }
}

/** A topic the placement marked as known that is still waiting to be confirmed: flagged, and none of its skills has been
    answered wrong (or «No lo sé») since the child started. One wrong answer brings it back to normal practice for good. */
export function isPlacedTopic(topic: SyllabusTopic, mastery: MasteryMap, progress: ProgressState | undefined): boolean {
  if (!progress?.flags?.[placementKnownKey(topic.id)]) return false
  return topic.skills.every((s) => {
    const m = mastery[s]
    return !m || m.correct >= m.attempts
  })
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
  const stage = stageOfCurrentWorld(course, progress)
  const rank = (t: SyllabusTopic) =>
    (stage && !stage.topics.includes(t.id) ? 2 : 0) + (behind.has(t.id) || isPlacedTopic(t, mastery, progress) ? 1 : 0)
  return open.reduce((best, t) => (rank(t) < rank(best) ? t : best))
}

/** Today's topic: the last one in teaching order whose class was finished today, else the topic to learn now. */
export function topicOfToday(course: Syllabus, mastery: MasteryMap, progress: ProgressState | undefined, now: Date, term?: number): SyllabusTopic | null {
  const flags = progress?.flags ?? {}
  const taught = availableTopics(course, term).filter((t) => flags[classTodayKey(t.id, now)] || flags[legacyEnglishKey(t.id, now)])
  return taught[taught.length - 1] ?? topicToLearn(course, mastery, progress, term)
}
