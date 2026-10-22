import type { ID, ISODate, InputMode } from './common'
import type { ErrorType, ExerciseKind, SkillKey } from './exercise'

/**
 * Spaced-repetition state for one skill (Leitner boxes 0..5).
 * box 0 = new / just failed (see again this session), 5 = mastered (review every ~2 weeks).
 * "fluent" = correct AND faster than the engine's fluency threshold for the input mode.
 */
export interface SkillMastery {
  skill: SkillKey
  box: 0 | 1 | 2 | 3 | 4 | 5
  attempts: number
  correct: number
  /** Consecutive correct answers. */
  streak: number
  /** Exponential moving average of response time in ms (correct answers only). */
  avgMs: number | null
  lastSeenAt: ISODate | null
  dueAt: ISODate | null
  /** Most frequent recent error type, for parent dashboards. */
  lastError?: ErrorType | null
  updatedAt: ISODate
}

export type MasteryMap = Record<SkillKey, SkillMastery>

export interface AttemptRecord {
  id: ID
  childId: ID
  sessionId: ID | null
  skill: SkillKey
  kind: ExerciseKind
  correct: boolean
  given: string
  expected: string
  ms: number
  inputMode: InputMode
  hintsUsed: number
  errorType?: ErrorType | null
  recognitionFixes?: number
  /** Where the attempt happened. */
  /** method: the method used when the operation has several (e.g. 'borrow', 'parts'); see src/engine/methods.ts. */
  context: { worldId?: string; nodeId?: string; activity?: string; free?: boolean; method?: string }
  createdAt: ISODate
}

export interface SessionRecord {
  id: ID
  childId: ID
  startedAt: ISODate
  endedAt: ISODate | null
  /** Active minutes (idle time excluded). */
  minutes: number
  summary: { attempts: number; correct: number; starsEarned: number; nodesCompleted: string[] } | null
}

export interface NodeProgress {
  done: boolean
  /** 0..3 stars; best result kept. */
  stars: number
  bestMs?: number
  completedAt?: ISODate
  /** For race activities: personal records (ms) so the child competes only against herself. */
  records?: number[]
}

export interface WorldProgress {
  unlocked: boolean
  nodes: Record<string, NodeProgress>
  /** Guardian beaten → crystal collected and companion rescued. */
  crystal: boolean
  /** Secret-word letter earned in this world (e.g. 'V'). */
  letter?: string
  completedAt?: ISODate
}

/** Whole game progress for one child. Merges are monotonic (see data/sync): unlocks/stars/crystals only grow. */
export interface ProgressState {
  childId: ID
  seasonId: string
  worlds: Record<string, WorldProgress>
  /** Currency earned with stars; spent in the accessory shop. */
  stars: number
  starsSpent: number
  stickers: string[]
  accessoriesOwned: string[]
  chestOpened: boolean
  diplomaEarnedAt?: ISODate
  /** Days played (YYYY-MM-DD) — for gentle streak display, never punishment. */
  daysPlayed: string[]
  /** Last node the child was in, to resume. */
  lastNode?: { worldId: string; nodeId: string }
  /** Onboarding steps completed (e.g. 'calibration'). */
  flags: Record<string, boolean>
  updatedAt: ISODate
}

/** Handwriting sample collected during calibration or confirmed answers; used for personalised recognition. */
export interface InkSample {
  id: ID
  childId: ID
  digit: number
  /** CNN embedding vector (see src/ink/ml/recognizer.ts). */
  embedding: number[]
  /** 28×28 grayscale, 0..255, row-major, base64 — optional, for retraining later. */
  image28?: string
  source: 'calibration' | 'confirmed' | 'corrected'
  createdAt: ISODate
}
