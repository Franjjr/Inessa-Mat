/* Daily review planning (pure). Spaced repetition comes from @/engine: skills that are due now plus weak
   skills from planSession's review list. Nothing due → an empty session (the screen shows a friendly message). */
import { dueSkills, generate, planSession, selectorForSkills } from '@/engine'
import type { ChildProfile, Exercise, MasteryMap, ProgressState, Rng } from '@/types'

export const REVIEW_SIZE = 8

export interface ReviewPlan {
  exercises: Exercise[]
  /** Number of skills that were due at the moment the plan was made. */
  dueCount: number
}

export function buildReviewSession(input: {
  child: ChildProfile
  progress: ProgressState
  mastery: MasteryMap
  now: Date
  rng: Rng
  size?: number
}): ReviewPlan {
  const { child, progress, mastery, now, rng } = input
  const due = dueSkills(mastery, now, 12)
  const planned = planSession({ child, progress, mastery, now }).review
  const skills = [...new Set([...due, ...planned])]
  if (skills.length === 0) return { exercises: [], dueCount: 0 }
  // adaptive: due and weak skills first, instead of the same weight for every skill (E5)
  const exercises = generate({ ...selectorForSkills(skills), adaptive: true }, input.size ?? REVIEW_SIZE, { rng, mastery, now })
  return { exercises, dueCount: due.length }
}

/** Small stable seed from a string (child id + local day) so the same day gives the same review. */
export function seedFrom(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
