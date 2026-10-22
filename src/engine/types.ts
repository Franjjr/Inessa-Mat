/* Engine-level option/result types. Re-exported unchanged from src/engine/index.ts (the public contract). */
import type { ActivityKind, ErrorType, InputMode, MasteryMap, Rng, SkillKey } from '@/types'

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
  errorType?: ErrorType | null
}

export interface SessionPlan {
  minutes: number
  /** Short oral-style warm-up: due facts first. */
  warmup: SkillKey[]
  /** Next story node to continue, if any. */
  next: { worldId: string; nodeId: string } | null
  /** Mixed review of weak/due skills (spaced repetition). */
  review: SkillKey[]
  /** Fun closing game. */
  game: ActivityKind
}
