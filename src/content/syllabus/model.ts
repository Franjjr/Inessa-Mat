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
  /** Its skills are steps: «Lo nuevo» teaches only the first unmastered one that can be generated; the rest wait their turn
   *  and come back in the mix. Without it the skills are taught together, as a set. */
  ordered?: true
  /** Added after children started the course: a child who is already past it practises it in the mix instead of going
   *  back to it in «Lo nuevo». Only the topics split out of an existing one carry it. */
  late?: true
}

export interface SyllabusBlock {
  id: string
  name: string
  topics: SyllabusTopic[]
}

/**
 * A stage of the teaching order: the topics taught together, in order, in one world of the adventure. Stages run in
 * sequence and mix blocks (a spiral: numbers and sums with coins and the clock, then tables with shapes…), so the
 * blocks stay for the adult report and the stages decide what comes next.
 */
export interface SyllabusStage {
  id: string
  /** Trimester of the stage (the app's own progressive order, not a school's). */
  term: 1 | 2 | 3
  /** The world of the adventure that goes with this stage (its guardian is the stage test). 2.º has none yet. */
  worldId?: string
  /** Topic ids in teaching order. */
  topics: string[]
}

export interface Syllabus {
  id: string
  /** Primary school year (1..6). */
  course: number
  blocks: SyllabusBlock[]
  /** Teaching order. Topics missing from every stage are taught after the stages, in block order. */
  stages?: SyllabusStage[]
}
