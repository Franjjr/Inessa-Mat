/* Shared answer flow for the ops views (columns, galera, groups, arrays, word problems, shares).
   - Grades through @/engine check(). The graded outcome is the first submission, unless the child rewrote the
     answer after a wrong first check: then the answer they settled on counts (shared/recognition.ts).
   - Later re-checks update the feedback and the graded outcome only until the child presses Siguiente.
   - Feeds the handwriting learning store: confirm() after a correct answer, discard() otherwise.
   - The app grades what the child meant to write. Before grading it asks (and grades nothing, counts no try):
     · "¿Querías escribir 625?" when a number typed in reading order into a units-first row would be right reversed;
     · "He leído 47. ¿Es lo que has escrito?" when one handwritten digit, read as one of its alternatives, would make a
       wrong answer right (and now and then about a doubtful read that changes nothing, so the question never gives
       the answer away). A right answer after the child said "No" is logged with errorType 'recognition'.
   - onAnswered fires exactly once: right away when feedback is off, otherwise when the child presses Siguiente. */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Answer, CheckResult, Exercise, ExerciseOutcome, Hint } from '@/types'
import { check, hintsFor } from '@/engine'
import { useInkLearning, useInputMode } from '@/ink'
import { useInkStore } from '@/ink/hooks'
import { askMisread, askReversed, inkReadingOf } from '@/ink/questions'
import { leaveInkReading, type InkReading } from '@/ink/readLog'
import { answerKey, gradeFromSubmissions, misreadToAsk, oneDigitSwaps, reversedAnswer, shownAnswer, type ReadDigit, type Submitted } from '../shared/recognition'

export interface AnswerFlowOptions {
  onAnswered: (outcome: ExerciseOutcome) => void
  /** Show feedback and wait for "Siguiente" (default true). Off: report on the first submission. */
  showFeedback?: boolean
  /** Offer the hint button (default true). */
  allowHints?: boolean
  /** Hints of a specific method (e.g. subtraction by parts). Default: the hints of the exercise. */
  hints?: Hint[]
  /** Method the child is using; it goes into the graded outcome and the attempt log. */
  method?: string
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
  /** A clue the child took that is not a hint button (a wrong operation in a word problem): it counts as a hint used. */
  countClue: () => void
  submit: (answer: Answer) => CheckResult
  /** Child pressed Siguiente: reports the graded outcome exactly once. */
  finish: () => void
  showFeedback: boolean
  allowHints: boolean
  /** The exercise being answered (for a solution panel next to the bar). */
  exercise?: Exercise
  /** Wrong checks so far (a solution panel shows after the second one). */
  wrongTries?: number
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
/** Returned by a submit that was held back: not correct, so views show nothing as a result. */
const NOT_GRADED: CheckResult = { correct: false, given: '', expected: '' }

export function useAnswerFlow(exercise: Exercise, opts: AnswerFlowOptions): AnswerFlow {
  const { mode } = useInputMode()
  const learning = useInkLearning()
  const store = useInkStore()
  const showFeedback = opts.showFeedback ?? true
  const allowHints = opts.allowHints ?? true

  const startedAt = useRef(now())
  const hints = useMemo(() => opts.hints ?? hintsFor(exercise), [exercise, opts.hints])
  const hintsRef = useRef(0)
  /** Clues taken without the hint button (countClue): counted as hints used, never shown as hints. */
  const cluesRef = useRef(0)
  const [hintsShown, setHintsShown] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const subs = useRef<Submitted[]>([])
  const fixes = useRef(0)
  const graded = useRef<ExerciseOutcome | null>(null)
  const reading = useRef<InkReading | null>(null)
  const reported = useRef(false)
  /** The reversed-number question is asked once per exercise. */
  const reversedAsked = useRef(false)
  /** The child said the app misread her writing. */
  const misread = useRef(false)
  const onAnswered = useRef(opts.onAnswered)
  onAnswered.current = opts.onAnswered

  const report = useCallback(() => {
    if (reported.current || !graded.current) return
    reported.current = true
    if (!graded.current.check.correct && reading.current) leaveInkReading(reading.current)
    onAnswered.current(graded.current)
  }, [])

  const showNextHint = useCallback((): Hint | null => {
    const next = hints[hintsRef.current]
    if (!next) return null
    hintsRef.current += 1
    setHintsShown(hintsRef.current)
    return next
  }, [hints])

  const countClue = useCallback(() => { cluesRef.current += 1 }, [])

  const submitRef = useRef<(answer: Answer) => CheckResult>(() => NOT_GRADED)
  const submit = useCallback((answer: Answer): CheckResult => {
    // A digit still in doubt (low-confidence read), unread ink or an open question: nothing is graded yet.
    if (learning.requestConfirm()) return NOT_GRADED
    const grade = (a: Answer) => check(exercise, a, { hintsUsed: hintsRef.current, method: opts.method })
    let c = grade(answer)

    if (store.canAsk() && !reported.current) {
      // «625» typed as read into a row that fills units first became 526: ask, do not grade.
      if (!c.correct && !reversedAsked.current && store.wasTyped()) {
        const rev = reversedAnswer(answer)
        if (rev && grade(rev).correct) {
          reversedAsked.current = true
          askReversed(store, shownAnswer(rev) ?? c.expected)
          return NOT_GRADED
        }
      }
      // A handwritten digit that may be misread: the child says what she wrote before anything is graded.
      const reads: ReadDigit[] = store.liveReads().filter(({ read }) => !read.confirmed)
        .map(({ key, read }) => ({ key, digit: read.digit, confidence: read.confidence, alternatives: read.alternatives }))
      const ask = misreadToAsk(answer, c.correct, reads, (a) => grade(a).correct, store.random)
      if (ask) {
        askMisread(store, {
          shown: shownAnswer(answer) ?? c.given,
          key: ask.key,
          onYes: () => { submitRef.current(answer) },
          onNo: () => { misread.current = true },
        })
        return NOT_GRADED
      }
    }

    // A right answer after the child told the app it misread her: a recognition slip, not a maths one.
    if (c.correct && misread.current) c = { ...c, errorType: 'recognition' }
    // Fixes are counted per submission: a discard after a wrong check forgets the pending recognitions.
    fixes.current += learning.recognitionFixes()
    if (!c.correct) {
      const reads = store.liveReads()
      const oneDigitFix = reads.some(({ read }) => read.alternatives.some((alt) =>
        oneDigitSwaps(answer, read.digit, alt).some((a) => grade(a).correct)))
      reading.current = inkReadingOf(store, {
        kind: exercise.kind, given: c.given, recognitionFixes: fixes.current, oneDigitFix,
        ...(opts.method ? { method: opts.method } : {}),
      })
    } else reading.current = null
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
        hintsUsed: hintsRef.current + cluesRef.current,
        recognitionFixes: fixes.current,
        ...(opts.method ? { method: opts.method } : {}),
      }
    }
    setSubmitted(true)
    if (!showFeedback) report()
    return c
  }, [exercise, learning, store, mode, report, showFeedback, opts.method])
  submitRef.current = submit

  const finish = useCallback(() => report(), [report])

  const wrongTries = subs.current.filter((x) => !x.check.correct).length
  return {
    result, graded: graded.current, submitted, hints, hintsShown, showNextHint, countClue, submit, finish, showFeedback, allowHints,
    exercise, wrongTries,
  }
}
