/* «Hoy» (the big button on the child's home), pure: the class of the topic taught today when the child has not done it yet,
   otherwise the session of the subject. The classes are for 3.º (see classForTopic). With both subjects on, the home opens on
   maths until today's maths session is done, then on Lengua (homeSubject). */
import { classForTopic, isClassDone } from '@/content/classes'
import { currentTopic, syllabusFor, topicTitle } from '@/content/syllabus'
import { masteryOf, subjectOffered } from '@/engine'
import { sessionDoneKey } from '@/world/session/logic'
import { SUBJECTS, type MasteryMap, type ProgressState, type SubjectId } from '@/types'

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

/** The subjects of the home for a child: `subjects` are the ones on and offered to the course (maths is always offered, so a
    child left with none gets maths); `chips` are the picker's: those subjects, and Lengua as a disabled chip for a child outside 3.º. */
export function homeSubjects(enabled: SubjectId[], grade?: number): { subjects: SubjectId[]; chips: SubjectId[] } {
  const owned = SUBJECTS.map((sub) => sub.id).filter((id) => enabled.includes(id) && subjectOffered(id, grade))
  const subjects: SubjectId[] = owned.length ? owned : ['math']
  const chips = SUBJECTS.map((sub) => sub.id).filter((id) => subjects.includes(id) || (id === 'language' && !subjectOffered(id, grade)))
  return { subjects, chips }
}

/** The subject the home opens on: maths while it is on and today's maths session has no answers yet; Lengua once maths is
    done (or when it is the only one on). */
export function homeSubject(enabled: SubjectId[], progress: ProgressState, now: Date = new Date()): SubjectId {
  const mathDone = !!progress.flags?.[sessionDoneKey(now)]
  if (enabled.includes('language') && (!enabled.includes('math') || mathDone)) return 'language'
  return enabled.includes('math') ? 'math' : (enabled[0] ?? 'math')
}
