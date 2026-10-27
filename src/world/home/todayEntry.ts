/* «Hoy» (the big button on the child's home), pure: the class of the topic taught today when the child has not done
   it yet, otherwise the daily session. The class is only for 3.º (see classForTopic). */
import { classForTopic, isClassDone } from '@/content/classes'
import { currentTopic, syllabusForGrade, topicTitle } from '@/content/syllabus'
import type { MasteryMap, ProgressState } from '@/types'

export type TodayEntry =
  | { kind: 'clase'; topicId: string; title: string; to: string }
  | { kind: 'sesion'; title: string; to: '/play/sesion' }

export function todayEntry({ grade, mastery, progress }: { grade?: number; mastery: MasteryMap; progress: ProgressState }): TodayEntry {
  const topic = currentTopic(syllabusForGrade(grade), mastery)
  const title = topic ? topicTitle(topic) : 'Matemáticas de hoy'
  const cls = topic ? classForTopic(topic.id, grade) : undefined
  if (topic && cls && !isClassDone(progress, cls)) {
    return { kind: 'clase', topicId: topic.id, title, to: `/play/clase/${topic.id}` }
  }
  return { kind: 'sesion', title, to: '/play/sesion' }
}
