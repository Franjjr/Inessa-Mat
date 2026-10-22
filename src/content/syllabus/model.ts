/* Syllabus model: a school year as data (blocks → topics → rungs of the ladder). Pure types, no React.
   A topic is a teaching unit whose mastery is measured through engine skill keys (see src/engine/skills.ts).
   Topics without exercises yet are 'pendiente': they show in the adult report and are skipped by the planner. */
import type { SkillKey } from '@/types'

/** The four rungs of the ladder (docs/curriculum/PLAN_DOCENTE.md §2): objects, drawings, numbers, use. */
export type SyllabusRung = 'concreto' | 'dibujo' | 'numeros' | 'uso'

export const SYLLABUS_RUNGS: SyllabusRung[] = ['concreto', 'dibujo', 'numeros', 'uso']

export interface SyllabusTopic {
  id: string
  name: string
  /** Skill keys that measure this topic. Empty while the exercises do not exist. */
  skills: SkillKey[]
  status: 'disponible' | 'pendiente'
  /** Trimester where the school teaches it. Undefined = any trimester (to confirm with the school's programme). */
  term?: 1 | 2 | 3
  /** What the child does on each rung (child-facing wording lives in the view layer; these are for adults). */
  rungs: Partial<Record<SyllabusRung, string>>
  /** For pending topics: what is still missing. */
  pendingNote?: string
}

export interface SyllabusBlock {
  id: string
  name: string
  topics: SyllabusTopic[]
}

export interface Syllabus {
  id: string
  /** Primary school year (1..6). */
  course: number
  blocks: SyllabusBlock[]
}
