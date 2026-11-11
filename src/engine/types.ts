/* Engine-level option/result types. Re-exported unchanged from src/engine/index.ts (the public contract). */
import type { ErrorType, InputMode, MasteryMap, Rng, SkillKey } from '@/types'

export interface GenerateOptions {
  rng?: Rng
  /** With selector.adaptive, weights toward due/weak skills. */
  mastery?: MasteryMap
  /** Avoid repeating these exact items (ids are deterministic from content, e.g. 'fact-mul:7x6'). */
  avoidIds?: string[]
  now?: Date
}

export interface AttemptForMastery {
  skill: SkillKey
  correct: boolean
  ms: number
  inputMode: InputMode
  hintsUsed: number
  /** Wrong tries before this answer (the facts views allow one more try): a right answer after one is not fluent. */
  retries?: number
  errorType?: ErrorType | null
  /** The exercise is answered by picking from options (isChoiceExercise): its right answers cannot climb past CHOICE_MAX_BOX. */
  choice?: boolean
}

export interface SessionPlan {
  minutes: number
  /** Next story node to continue, if any. */
  next: { worldId: string; nodeId: string } | null
  /** Mixed review of weak/due skills (spaced repetition). */
  review: SkillKey[]
}
