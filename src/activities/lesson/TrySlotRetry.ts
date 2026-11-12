/* «Inténtalo otra vez» keeps what the child wrote (P2, P4): the try comes back with her answer in its boxes and the
   boxes the corrector found wrong marked in soft red, so she corrects them instead of writing it all again.
   - useRetryFlow: the answer flow of a view, which also hands the answer the child sent to onAnswered (outcome.answer),
     so the screen around it (TrySlot, ExerciseStep) can pass it back as initialAnswer on the next try.
   - initialOf / retryWrong: what a view reads from initialAnswer and wrongColumns. A wrong box stays marked until the
     child changes it or checks again. */
import { useCallback, useRef, useState } from 'react'
import type { Answer, Exercise, ExerciseOutcome, ExerciseViewProps } from '@/types'
import { useAnswerFlow, type AnswerFlow, type AnswerFlowOptions } from '../groups/flow'
import s from './TrySlotRetry.module.css'

/** The outcome of a view with the answer the child sent (the one graded). */
export type RetryOutcome = ExerciseOutcome & { answer?: Answer }

/** The answer the child sent with this outcome, if the view tells it. */
export function answerOf(outcome: ExerciseOutcome): Answer | undefined {
  return (outcome as RetryOutcome).answer
}

/** What a view needs to start a try again. */
export type RetryProps = Pick<ExerciseViewProps, 'initialAnswer' | 'wrongColumns'>

/** The class of a choice (a sign, an option, a figure) the child picked on the last try and was wrong: soft red. */
export const RETRY_WRONG_CLASS = s.wrongPick

/** useAnswerFlow, and the outcome carries the answer the child sent (outcome.answer). */
export function useRetryFlow(exercise: Exercise, opts: AnswerFlowOptions): AnswerFlow {
  const last = useRef<Answer | undefined>(undefined)
  const onAnswered = useRef(opts.onAnswered)
  onAnswered.current = opts.onAnswered
  const report = useCallback((o: ExerciseOutcome) => {
    const answer = answerOf(o) ?? last.current
    onAnswered.current(answer ? ({ ...o, answer } as RetryOutcome) : o)
  }, [])
  const flow = useAnswerFlow(exercise, { ...opts, onAnswered: report })
  const inner = flow.submit
  const submit = useCallback((answer: Answer) => {
    last.current = answer
    return inner(answer)
  }, [inner])
  return { ...flow, submit }
}

/** The previous answer, when it is of the type the view writes (another type, or none: the view starts empty). */
export function initialOf<T extends Answer['type']>(retry: RetryProps | undefined, type: T): Extract<Answer, { type: T }> | undefined {
  const a = retry?.initialAnswer
  return a && a.type === type ? (a as Extract<Answer, { type: T }>) : undefined
}

/** The boxes to mark on a try again: the corrector's (wrongColumns), or, when it gave none, `derive` (the view compares
    the previous answer with the right one, box by box). Empty without a previous answer. Kept for the whole try. */
export function useRetryWrong(retry: RetryProps | undefined, derive: () => number[]): Set<number> {
  const [wrong] = useState(() => {
    if (!retry?.initialAnswer) return new Set<number>()
    const given = retry.wrongColumns
    return new Set(given && given.length ? given : derive())
  })
  return wrong
}

/** Indexes where the given values differ from the expected ones (an empty box is wrong where a value is expected). */
export function wrongEntries(given: readonly (number | null | undefined)[], expected: readonly (number | null)[]): number[] {
  return expected.flatMap((e, i) => ((given[i] ?? null) !== e ? [i] : []))
}

/** A number split units first into `cols` boxes (null past its last digit): how a row of digit boxes holds it. */
export function digitsOf(n: number | null | undefined, cols: number): (number | null)[] {
  const out: (number | null)[] = Array.from({ length: cols }, () => null)
  if (n === null || n === undefined || !Number.isFinite(n)) return out
  const text = String(Math.trunc(Math.abs(n)))
  for (let i = 0; i < Math.min(cols, text.length); i++) out[i] = Number(text[text.length - 1 - i])
  return out
}

/** A view with one number box: the number written on the last try (null: none) and `marked`, whether the box is soft
    red now: it was wrong, the child has not changed it and has not checked again. `expected` decides when the corrector
    names no box; `read` takes the number out of another type of answer (a division's quotient). */
export function useRetryNumber(
  retry: RetryProps | undefined,
  expected: number | null,
  read: (a: Answer) => number | null | undefined = (a) => (a.type === 'number' ? a.value : undefined),
): { first: number | null; marked: (now: number | null, checked: boolean) => boolean } {
  const [first] = useState<number | null>(() => (retry?.initialAnswer ? read(retry.initialAnswer) ?? null : null))
  const wrong = useRetryWrong(retry, () => (first !== expected ? [0] : []))
  return { first, marked: (now, checked) => !checked && wrong.has(0) && first !== null && now === first }
}

/** A view where the child taps one choice (a sign, an option, «sí» or «no»): the choice of the last try and `marked`,
    whether that option is soft red now (it was wrong, it is still the one picked and nothing was checked again). */
export function useRetryChoice<T>(
  retry: RetryProps | undefined,
  read: (a: Answer) => T | null | undefined,
  expected: T | null | undefined,
): { first: T | null; marked: (option: T, picked: T | null, checked: boolean) => boolean } {
  const [first] = useState<T | null>(() => (retry?.initialAnswer ? read(retry.initialAnswer) ?? null : null))
  const wrong = useRetryWrong(retry, () => (first !== expected ? [0] : []))
  return { first, marked: (option, picked, checked) => !checked && wrong.has(0) && first !== null && option === first && picked === first }
}
