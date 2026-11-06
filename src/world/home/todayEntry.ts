/* «Hoy» (the big button on the child's home), pure: the class of the topic taught today when the child has not done it yet,
   otherwise the session of the subject. The classes are for 3.º (see classForTopic). With both subjects on, the home opens on
   maths until today's maths session is done, then on Lengua (homeSubject). */
import { classForTopic, isClassDone } from '@/content/classes'
import { syllabusFor, topicTitle, type Syllabus } from '@/content/syllabus'
import { topicOfToday, masteryOf, subjectOffered, teachableCourse, teachableEnglishCourse, type LessonSubject } from '@/engine'
import { sessionDoneKey } from '@/world/session/logic'
import { SUBJECTS, type MasteryMap, type ProgressState, type SubjectId } from '@/types'

export type TodayEntry =
  | { kind: 'clase'; topicId: string; title: string; to: string }
  | { kind: 'sesion'; title: string; to: string }

const FALLBACK_TITLE: Partial<Record<SubjectId, string>> = { math: 'Matemáticas de hoy', language: 'Lengua de hoy', english: 'Inglés de hoy' }
const SESSION_TO: Partial<Record<SubjectId, string>> = { math: '/play/sesion', language: '/play/lengua', english: '/play/ingles' }
/** The view of a subject's syllabus that its planner teaches, with the sound on or off (the dictation and the listening items need it). */
const TEACHABLE: Partial<Record<SubjectId, (course: Syllabus, sound: boolean) => Syllabus>> = { language: teachableCourse, english: teachableEnglishCourse }

/** The route of a subject's daily session (after a class too). */
export function sessionRouteOf(subject: SubjectId): string {
  return SESSION_TO[subject] ?? '/play/sesion'
}

/** The order the home opens the subjects in: maths, then Lengua, then English. */
const HOME_ORDER: LessonSubject[] = ['math', 'language', 'english']
/** The subjects shown as a disabled chip to a child whose course does not get them: Lengua always, the others only when on. */
const ADVERTISED_OUTSIDE_COURSE: SubjectId[] = ['language']

/** The placement banner (the thin bar above «Hoy») for a home view, or null. A subject's banner shows on its own view while
    its test is pending; on another view only the next pending subject after it in HOME_ORDER shows, and never maths (its
    banner is only on the maths view). `pending` is each subject's test still to do; `enabled` the subjects on for the child. */
export function placementBannerOf(view: SubjectId, pending: Partial<Record<LessonSubject, boolean>>, enabled: SubjectId[]): LessonSubject | null {
  const isPending = (id: SubjectId): boolean => enabled.includes(id) && !!pending[id as LessonSubject]
  if (isPending(view) && HOME_ORDER.includes(view as LessonSubject)) return view as LessonSubject
  const next = HOME_ORDER.find((id) => isPending(id))
  return next && next !== 'math' && HOME_ORDER.indexOf(next) > HOME_ORDER.indexOf(view as LessonSubject) ? next : null
}

export function todayEntry({ grade, mastery, progress, subject = 'math', sound = true, now = new Date() }: {
  grade?: number; mastery: MasteryMap; progress: ProgressState; subject?: SubjectId
  /** The dictation can be heard (sound setting on and a voice): without it a dictation is not taught (teachableCourse), as in the planner. */
  sound?: boolean
  now?: Date
}): TodayEntry {
  const course = syllabusFor(subject, grade)
  // Lengua and English name the topic their planner teaches (the same teachable view); maths reads its whole temario. Every
  // subject keeps the topic of today's class (topicOfToday), as its session does.
  const teachable = TEACHABLE[subject]
  const view = teachable ? teachable(course, sound) : course
  const topic = topicOfToday(view, masteryOf(mastery, subject), progress, now)
  const title = topic ? topicTitle(topic) : FALLBACK_TITLE[subject] ?? 'Hoy'
  const cls = topic ? classForTopic(topic.id, grade, subject) : undefined
  if (topic && cls && !isClassDone(progress, cls)) {
    return { kind: 'clase', topicId: topic.id, title, to: `/play/clase/${topic.id}` }
  }
  return { kind: 'sesion', title, to: sessionRouteOf(subject) }
}

/** The subjects of the home for a child: `subjects` are the ones on and offered to the course (maths is always offered, so a
    child left with none gets maths); `chips` are the picker's: those subjects, and Lengua as a disabled chip for a child outside 3.º. */
export function homeSubjects(enabled: SubjectId[], grade?: number): { subjects: SubjectId[]; chips: SubjectId[] } {
  const owned = SUBJECTS.map((sub) => sub.id).filter((id) => enabled.includes(id) && subjectOffered(id, grade))
  const subjects: SubjectId[] = owned.length ? owned : ['math']
  const chips = SUBJECTS.map((sub) => sub.id).filter((id) => subjects.includes(id)
    || (!subjectOffered(id, grade) && (enabled.includes(id) || ADVERTISED_OUTSIDE_COURSE.includes(id))))
  return { subjects, chips }
}

/** The subject the home opens on: the first subject on (in HOME_ORDER) whose session has no answers yet today; when all are
    done, the last one on. */
export function homeSubject(enabled: SubjectId[], progress: ProgressState, now: Date = new Date()): SubjectId {
  const on = HOME_ORDER.filter((id) => enabled.includes(id))
  if (on.length === 0) return enabled[0] ?? 'math'
  return on.find((id) => !progress.flags?.[sessionDoneKey(now, id)]) ?? on[on.length - 1]!
}
