/* «Hoy» (the big button on the child's home), pure: the class of the topic taught today when the child has not done it yet,
   otherwise the session of the subject. The classes are for 3.º (see classForTopic). With both subjects on, the home opens on
   maths until today's maths session is done, then on Lengua (homeSubject). */
import { classForTopic, isClassDone } from '@/content/classes'
import { currentTopic, syllabusFor, topicTitle } from '@/content/syllabus'
import { masteryOf } from '@/engine'
import { sessionRewardKey } from '@/world/session/logic'
import type { MasteryMap, ProgressState, SubjectId } from '@/types'

export type TodayEntry =
  | { kind: 'clase'; topicId: string; title: string; to: string }
  | { kind: 'sesion'; title: string; to: string }

const FALLBACK_TITLE: Partial<Record<SubjectId, string>> = { math: 'Matemáticas de hoy', language: 'Lengua de hoy' }
const SESSION_TO: Partial<Record<SubjectId, string>> = { math: '/play/sesion', language: '/play/lengua' }

export function todayEntry({ grade, mastery, progress, subject = 'math' }: {
  grade?: number; mastery: MasteryMap; progress: ProgressState; subject?: SubjectId
}): TodayEntry {
  const topic = currentTopic(syllabusFor(subject, grade), masteryOf(mastery, subject))
  const title = topic ? topicTitle(topic) : FALLBACK_TITLE[subject] ?? 'Hoy'
  const cls = topic ? classForTopic(topic.id, grade, subject) : undefined
  if (topic && cls && !isClassDone(progress, cls)) {
    return { kind: 'clase', topicId: topic.id, title, to: `/play/clase/${topic.id}` }
  }
  return { kind: 'sesion', title, to: SESSION_TO[subject] ?? '/play/sesion' }
}

/** The subject the home opens on: maths while it is on and today's maths session is not done; Lengua once maths is done
    (or when it is the only one on). */
export function homeSubject(enabled: SubjectId[], progress: ProgressState, now: Date = new Date()): SubjectId {
  const mathDone = !!progress.flags?.[sessionRewardKey(now)]
  if (enabled.includes('language') && (!enabled.includes('math') || mathDone)) return 'language'
  return enabled.includes('math') ? 'math' : (enabled[0] ?? 'math')
}
