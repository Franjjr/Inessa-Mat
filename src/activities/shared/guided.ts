/* A guided exercise shows its help from the start (the first hint, a highlighted column, «Cuenta por filas»). That help
   is a hint used, so a right answer under it is not taken as known by heart: mastery does not climb on it (the same
   rule as the guided facts, see facts/shared/flow.ts). Idempotent: an outcome that already counts a hint is kept. */
import type { ExerciseOutcome } from '@/types'

export function guidedOutcome(outcome: ExerciseOutcome): ExerciseOutcome {
  return outcome.hintsUsed > 0 ? outcome : { ...outcome, hintsUsed: 1 }
}
