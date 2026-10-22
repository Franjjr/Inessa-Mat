/* Shared answer flow for the ops views (columns, galera, groups, arrays, word problems, shares).
   - Grades through @/engine check(). The graded outcome is the first submission, unless the child rewrote the
     answer after a wrong first check: then the answer they settled on counts (shared/recognition.ts).
   - Later re-checks update the feedback and the graded outcome only until the child presses Siguiente.
   - Feeds the handwriting learning store: confirm() after a correct answer, discard() otherwise.
   - onAnswered fires exactly once: right away when feedback is off, otherwise when the child presses Siguiente. */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Answer, CheckResult, Exercise, ExerciseOutcome, Hint } from '@/types'
import { check, hintsFor } from '@/engine'
import { useInkLearning, useInputMode } from '@/ink'
import { answerKey, gradeFromSubmissions, type Submitted } from '../shared/recognition'

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
  /** The graded outcome (first submission, or the settled answer after a rewrite). */
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
/** Returned by a submit that was held back: not correct, so views show nothing as a result. */
const NOT_GRADED: CheckResult = { correct: false, given: '', expected: '' }

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
  const subs = useRef<Submitted[]>([])
  const fixes = useRef(0)
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
    // A digit still in doubt (low-confidence read): the child confirms or rewrites it first. Nothing is graded.
    if (learning.requestConfirm()) return NOT_GRADED
    const c = check(exercise, answer)
    // Fixes are counted per submission: a discard after a wrong check forgets the pending recognitions.
    fixes.current += learning.recognitionFixes()
    if (c.correct) learning.confirm()
    else learning.discard()
    setResult(c)
    subs.current = [...subs.current, { key: answerKey(answer), check: c }]
    const g = gradeFromSubmissions(subs.current)
    if (g) {
      graded.current = {
        check: g.check,
        ms: Math.round(now() - startedAt.current),
        inputMode: mode,
        hintsUsed: hintsRef.current,
        recognitionFixes: fixes.current,
      }
    }
    setSubmitted(true)
    if (!showFeedback) report()
    return c
  }, [exercise, learning, mode, report, showFeedback])

  const finish = useCallback(() => report(), [report])

  return { result, graded: graded.current, submitted, hints, hintsShown, showNextHint, submit, finish, showFeedback, allowHints }
}
