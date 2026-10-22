/* Shared answer flow for the ops views (columns, galera, groups, arrays, word problems, shares).
   - Grades through @/engine check() and keeps the FIRST submission as the graded outcome.
   - Later re-checks update the feedback only (the child may fix a cell and press Comprobar again).
   - Feeds the handwriting learning store: confirm() after a correct answer, discard() otherwise.
   - onAnswered fires exactly once: right away when feedback is off, otherwise when the child presses Siguiente. */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Answer, CheckResult, Exercise, ExerciseOutcome, Hint } from '@/types'
import { check, hintsFor } from '@/engine'
import { useInkLearning, useInputMode } from '@/ink'

export interface AnswerFlowOptions {
  onAnswered: (outcome: ExerciseOutcome) => void
  /** Show feedback and wait for "Siguiente" (default true). Off: report on the first submission. */
  showFeedback?: boolean
  /** Offer the hint button (default true). */
  allowHints?: boolean
}

export interface AnswerFlow {
  /** Latest check (re-checks update it). */
  result: CheckResult | null
  /** The graded outcome, set by the first submission. */
  graded: ExerciseOutcome | null
  submitted: boolean
  hints: Hint[]
  hintsShown: number
  /** Reveal the next hint. Returns it, or null when none is left. */
  showNextHint: () => Hint | null
  submit: (answer: Answer) => CheckResult
  /** Child pressed Siguiente: reports the graded outcome exactly once. */
  finish: () => void
  showFeedback: boolean
  allowHints: boolean
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function useAnswerFlow(exercise: Exercise, opts: AnswerFlowOptions): AnswerFlow {
  const { mode } = useInputMode()
  const learning = useInkLearning()
  const showFeedback = opts.showFeedback ?? true
  const allowHints = opts.allowHints ?? true

  const startedAt = useRef(now())
  const hints = useMemo(() => hintsFor(exercise), [exercise])
  const hintsRef = useRef(0)
  const [hintsShown, setHintsShown] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const graded = useRef<ExerciseOutcome | null>(null)
  const reported = useRef(false)
  const onAnswered = useRef(opts.onAnswered)
  onAnswered.current = opts.onAnswered

  const report = useCallback(() => {
    if (reported.current || !graded.current) return
    reported.current = true
    onAnswered.current(graded.current)
  }, [])

  const showNextHint = useCallback((): Hint | null => {
    const next = hints[hintsRef.current]
    if (!next) return null
    hintsRef.current += 1
    setHintsShown(hintsRef.current)
    return next
  }, [hints])

  const submit = useCallback((answer: Answer): CheckResult => {
    const c = check(exercise, answer)
    const fixes = learning.recognitionFixes()
    if (c.correct) learning.confirm()
    else learning.discard()
    setResult(c)
    if (!graded.current) {
      graded.current = {
        check: c,
        ms: Math.round(now() - startedAt.current),
        inputMode: mode,
        hintsUsed: hintsRef.current,
        recognitionFixes: fixes,
      }
      setSubmitted(true)
      if (!showFeedback) report()
    }
    return c
  }, [exercise, learning, mode, report, showFeedback])

  const finish = useCallback(() => report(), [report])

  return { result, graded: graded.current, submitted, hints, hintsShown, showNextHint, submit, finish, showFeedback, allowHints }
}
