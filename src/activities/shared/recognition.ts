/* Recognition-aware grading (PEDAGOGY 7: "Recognition ≠ maths"). A child who sees a misread digit fixes it and
   presses Comprobar again. The answer that was graded first then no longer describes what the child meant, so the
   graded outcome is the answer the child settled on, not the first one. Pure: no React, no ink. */
import type { Answer, CheckResult } from '@/types'

export interface Submitted {
  /** Stable key of the answer as written (see answerKey). */
  key: string
  check: CheckResult
}

/** Stable key of an answer: two submissions with the same digits share it. */
export function answerKey(answer: Answer): string {
  return JSON.stringify(answer)
}

export interface Graded {
  /** The check that counts for mastery and the log. */
  check: CheckResult
  /** True when the child changed what was written after a first check. */
  rewritten: boolean
}

/**
 * The graded check of one exercise, from its submissions in order.
 * - One submission, or the first one was right: the first check counts (a later re-check cannot undo it).
 * - The first one was wrong and the child rewrote the answer: the answer they settled on counts. A misread digit
 *   that was corrected is then not a maths error; a final answer that is still wrong is graded as it is.
 */
export function gradeFromSubmissions(subs: readonly Submitted[]): Graded | null {
  if (subs.length === 0) return null
  const first = subs[0]
  const last = subs[subs.length - 1]
  if (first.check.correct || subs.length === 1) return { check: first.check, rewritten: false }
  const rewritten = subs.some((s) => s.key !== first.key)
  return { check: rewritten ? last.check : first.check, rewritten }
}
