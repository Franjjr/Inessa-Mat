/* A «clase» is a lesson in five phases (para, ejemplo, guiada, sola, cierre) linked to a syllabus topic. The phases
   are concatenated into one LessonDef; the counts stay in `phases` so tests and the class screen can find each one. */
import type { LessonDef, LessonStep } from '@/types'

export interface ClassDef {
  /** The syllabus topic the class teaches (src/content/syllabus). */
  topicId: string
  lesson: LessonDef
  /** The map lesson (LessonDef id) that this class also completes, when the topic has one on the map. */
  mapLessonId?: string
  /** Step count of each phase, in lesson order. */
  phases: { para: number; ejemplo: number; guiada: number; sola: number; cierre: number }
}

export interface ClassInput {
  id: string
  topicId: string
  title: string
  mapLessonId?: string
  para: LessonStep[]
  ejemplo: LessonStep[]
  guiada: LessonStep[]
  /** The child solves these alone: their tries come without the hint button. */
  sola: LessonStep[]
  cierre: LessonStep
}

export function clase(input: ClassInput): ClassDef {
  const sola = input.sola.map((step) => (step.interaction === 'try' ? { ...step, hints: false as const } : step))
  const steps = [...input.para, ...input.ejemplo, ...input.guiada, ...sola, input.cierre]
  return {
    topicId: input.topicId,
    mapLessonId: input.mapLessonId,
    lesson: { id: input.id, title: input.title, steps },
    phases: {
      para: input.para.length,
      ejemplo: input.ejemplo.length,
      guiada: input.guiada.length,
      sola: sola.length,
      cierre: 1,
    },
  }
}
