import type { ActivityConfig } from './content'
import type { AttemptInput, CheckResult, DivMethod, Exercise, ErrorType, SubMethod, TableMethod } from './exercise'
import type { InputMode } from './common'

export interface ActivityResult {
  correct: number
  total: number
  /** 0..3, computed with config.starThresholds (engine/stars.ts → starsFor). */
  stars: 0 | 1 | 2 | 3
  ms: number
  /** For race: time to beat next time. */
  recordMs?: number
}

/** Props every activity component (src/activities/<kind>/index.tsx default export) receives. */
export interface ActivityProps {
  config: ActivityConfig
  /** Called once when the activity ends (finished all items or child pressed "terminar"). */
  onDone: (result: ActivityResult) => void
  /** Called when the child exits early (back button). */
  onExit?: () => void
}

/** Props of a single-exercise view (src/activities/views/*). Used by activities and by the guardian challenge. */
export interface ExerciseViewProps {
  exercise: Exercise
  /** Fired exactly once per exercise when the child submits a final answer. */
  onAnswered: (outcome: ExerciseOutcome) => void
  /** Guided mode: highlights the current column / step and offers hints proactively (lessons, first tries). */
  guided?: boolean
  /** Allow the hint button (default true; false in the guardian challenge). */
  allowHints?: boolean
  /** Show correct/incorrect feedback inside the view (default true). Guardian uses false and shows its own. */
  showFeedback?: boolean
  /** Compact layout for grids of several exercises. */
  compact?: boolean
  /** Column subtraction method (default 'borrow'). Ignored by the other exercise kinds. */
  method?: SubMethod
  /** Division method (default 'galera'). Ignored by the other exercise kinds. */
  divMethod?: DivMethod
  /** Favourite trick for the tables: used by the hint of the fact when it applies (see methods.ts). */
  tableMethod?: TableMethod | null
}

export interface ExerciseOutcome {
  check: CheckResult
  ms: number
  inputMode: InputMode
  hintsUsed: number
  recognitionFixes: number
  /** Extra tries the view itself gave after a wrong try (the facts views allow one more try before they settle). */
  retries?: number
  /** Method used (see AttemptInput.method). */
  method?: string
}

/** Companion / Lumi reactions an activity can request. */
export type ReactionKind = 'correct' | 'wrong' | 'streak' | 'hint' | 'thinking' | 'celebrate' | 'encourage'

/**
 * Services the surrounding game screen provides to activities through React context
 * (src/activities/host.tsx → useActivityHost). Activities NEVER talk to the data layer directly.
 */
export interface ActivityHost {
  /** Log an attempt: the host updates mastery, persists the AttemptRecord and returns the new mastery box. */
  reportAttempt: (attempt: AttemptInput) => void
  /** Ask the companion and Lumi to react (animation + sound + optional spoken phrase). */
  react: (kind: ReactionKind, detail?: { errorType?: ErrorType; streak?: number }) => void
  /** Deterministic RNG for this activity run. */
  rng: () => number
  /** Mastery snapshot for adaptive generation (may be empty). */
  mastery: import('./progress').MasteryMap
  /** Child-facing text rendering (template placeholders). */
  t: (template: string) => string
  /** Child-level preferences relevant to activities. */
  prefs: {
    timedActivities: boolean; bigCells: boolean; voice: boolean; handedness: 'left' | 'right'; subMethod: SubMethod
    divMethod: DivMethod; tableMethod: TableMethod | null
  }
  /** Saves one child setting (used by the lessons where the child picks her favourite method). Optional in tests. */
  setPreference?: (key: 'subMethod' | 'divMethod' | 'tableMethod', value: SubMethod | DivMethod | TableMethod) => void
}

export type { Exercise, CheckResult }
