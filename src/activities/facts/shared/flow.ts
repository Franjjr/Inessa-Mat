/* Shared answer flow for the facts views and minigames.
   - useAnswerFlow: one written answer per exercise (FactView, MissingFactorView, FactFamily blanks use slots).
   - useSlotFlow: a sequence of written answers (skip counting, doubling chains, fact-family blanks).
   Both keep the same rules: a correct answer finishes the exercise; a wrong one gives a gentle engine clue and one
   more try; after MAX_TRIES wrong tries the answer is shown and the exercise finishes. Every finish calls
   onAnswered exactly once with the outcome (check, ms, input mode, hints used, recognition fixes). */
import { useCallback, useMemo, useRef, useState } from 'react'
import { haptics, sfx } from '@/audio'
import { celebrate } from '@/fx'
import { useInkLearning, useInputMode } from '@/ink'
import { check, hintsFor } from '@/engine'
import type { Answer, CheckResult, Exercise, ExerciseOutcome, Hint, InputMode } from '@/types'
import { useActivityHost } from '../../host'

export const MAX_TRIES = 2
export const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())
export const isHandwritten = (m: InputMode): boolean => m === 'pen' || m === 'touch'

export interface FlowOptions {
  exercise: Exercise
  onAnswered: (outcome: ExerciseOutcome) => void
  /** Show the first hint straight away (guided mode). Not counted as a hint used. */
  guided?: boolean
  /** Offer the "Pista" button (default true). */
  allowHints?: boolean
}

/** Shared bookkeeping: hint escalation, learning store and the single final outcome. */
function useCore({ exercise, onAnswered, guided = false, allowHints = true }: FlowOptions) {
  const host = useActivityHost()
  const { mode } = useInputMode()
  const learning = useInkLearning()
  const hints: Hint[] = useMemo(() => hintsFor(exercise), [exercise])
  const [hintsShown, setHintsShown] = useState(guided ? 1 : 0)
  const hintsUsed = useRef(0)
  const fixes = useRef(0)
  const startedAt = useRef(now())
  const done = useRef(false)
  const modeRef = useRef<InputMode>(mode)
  modeRef.current = mode
  const answeredRef = useRef(onAnswered)
  answeredRef.current = onAnswered

  const shownRef = useRef(hintsShown)
  const askHint = useCallback(() => {
    if (!allowHints || done.current || shownRef.current >= hints.length) return
    shownRef.current += 1
    hintsUsed.current += 1
    setHintsShown(shownRef.current)
  }, [allowHints, hints.length])

  /** A wrong try that still leaves a second one: forget the pending recognitions, keep the count. */
  const retry = useCallback(() => {
    fixes.current += learning.recognitionFixes()
    learning.discard()
    sfx.play('wrong')
    haptics.error()
  }, [learning])

  /** Final outcome: happens once per exercise. */
  const settle = useCallback((res: CheckResult) => {
    if (done.current) return
    done.current = true
    const m = modeRef.current
    const total = fixes.current + learning.recognitionFixes()
    if (res.correct) {
      if (isHandwritten(m)) learning.confirm()
      sfx.play('correct')
      haptics.success()
      celebrate('small')
    } else {
      learning.discard()
      sfx.play('wrong')
      haptics.error()
    }
    answeredRef.current({
      check: res,
      ms: Math.round(now() - startedAt.current),
      inputMode: m,
      hintsUsed: hintsUsed.current,
      recognitionFixes: total,
    })
  }, [learning])

  const text = useCallback((s: string | undefined, fallback: string) => host.t(s ?? fallback), [host])

  return {
    hints,
    hintsShown,
    hintsUsed: hintsUsed.current,
    canHint: allowHints && hintsShown < hints.length && !done.current,
    askHint,
    retry,
    settle,
    text,
    isDone: () => done.current,
    mode,
  }
}

export type FlowPhase = 'asking' | 'retry' | 'done'

export interface AnswerFlow {
  hints: Hint[]
  hintsShown: number
  hintsUsed: number
  canHint: boolean
  askHint: () => void
  phase: FlowPhase
  /** Child-facing message for the last try (clue, praise or the revealed answer). */
  clue: string | null
  /** Result of the last submitted answer. */
  last: CheckResult | null
  /** Changes after each wrong try: use as React key so the input clears. */
  attemptKey: number
  submit: (answer: Answer) => void
  mode: InputMode
}

export function useAnswerFlow(opts: FlowOptions): AnswerFlow {
  const core = useCore(opts)
  const { exercise } = opts
  const tries = useRef(0)
  const [phase, setPhase] = useState<FlowPhase>('asking')
  const [clue, setClue] = useState<string | null>(null)
  const [last, setLast] = useState<CheckResult | null>(null)
  const [attemptKey, setAttemptKey] = useState(0)

  const submit = (answer: Answer) => {
    if (core.isDone()) return
    const res = check(exercise, answer)
    setLast(res)
    if (res.correct) {
      setPhase('done')
      setClue(core.text(res.feedback, '¡Lo has clavado!'))
      core.settle(res)
      return
    }
    tries.current += 1
    if (tries.current >= MAX_TRIES) {
      setPhase('done')
      setClue(`La respuesta correcta es ${res.expected}. ¡Seguimos!`)
      core.settle(res)
      return
    }
    setPhase('retry')
    setClue(core.text(res.feedback, '¡Casi! Piénsalo otra vez.'))
    setAttemptKey((k) => k + 1)
    core.retry()
  }

  return {
    hints: core.hints,
    hintsShown: core.hintsShown,
    hintsUsed: core.hintsUsed,
    canHint: core.canHint,
    askHint: core.askHint,
    phase,
    clue,
    last,
    attemptKey,
    submit,
    mode: core.mode,
  }
}

export interface SlotOptions extends FlowOptions {
  /** The expected value of each written slot, in order. */
  expected: number[]
  /** Builds the engine answer from the value of every slot (null = never written). */
  makeAnswer: (values: (number | null)[]) => Answer
  /** Gentle clue for a wrong value in slot i (child-facing text, already in Spanish). */
  clueFor?: (slot: number) => string
}

export interface SlotView {
  /** Index of the slot the child should write now (-1 when finished). */
  current: number
  /** Accepted values (or revealed ones) per slot. */
  values: (number | null)[]
  /** True for slots whose answer was shown after too many wrong tries. */
  revealed: boolean[]
  /** True for slots already finished. */
  closed: boolean[]
  phase: FlowPhase
  clue: string | null
  last: CheckResult | null
  attemptKey: number
  hints: Hint[]
  hintsShown: number
  hintsUsed: number
  canHint: boolean
  askHint: () => void
  submit: (value: number | null) => void
  mode: InputMode
}

interface SlotState {
  current: number
  values: (number | null)[]
  revealed: boolean[]
  closed: boolean[]
  tries: number
  phase: FlowPhase
  clue: string | null
  last: CheckResult | null
  attemptKey: number
}

export function useSlotFlow(opts: SlotOptions): SlotView {
  const core = useCore(opts)
  const { expected, makeAnswer, clueFor, exercise } = opts
  const n = expected.length
  const firstOpen = (closed: boolean[], from: number): number => {
    for (let k = 0; k < n; k++) {
      const j = (from + k) % n
      if (!closed[j]) return j
    }
    return -1
  }
  const [state, setState] = useState<SlotState>(() => ({
    current: n > 0 ? 0 : -1,
    values: Array(n).fill(null),
    revealed: Array(n).fill(false),
    closed: Array(n).fill(false),
    tries: 0,
    phase: 'asking',
    clue: null,
    last: null,
    attemptKey: 0,
  }))
  const s = useRef(state)
  s.current = state

  const commit = (next: SlotState) => {
    s.current = next
    setState(next)
  }

  const submit = (value: number | null) => {
    const cur = s.current
    if (core.isDone() || value === null || cur.current < 0) return
    const i = cur.current
    const values = [...cur.values]
    const closed = [...cur.closed]
    const revealed = [...cur.revealed]
    if (value === expected[i]) {
      values[i] = value
      closed[i] = true
      const nextOpen = firstOpen(closed, i + 1)
      if (nextOpen < 0) {
        const res = check(exercise, makeAnswer(values))
        core.settle(res)
        commit({ ...cur, values, closed, current: -1, tries: 0, phase: 'done', clue: core.text(res.feedback, '¡Lo has clavado!'), last: res })
        return
      }
      commit({ ...cur, values, closed, current: nextOpen, tries: 0, clue: null, attemptKey: cur.attemptKey + 1 })
      return
    }
    const tries = cur.tries + 1
    if (tries >= MAX_TRIES) {
      values[i] = value
      revealed[i] = true
      closed[i] = true
      const nextOpen = firstOpen(closed, i + 1)
      if (nextOpen < 0) {
        const res = check(exercise, makeAnswer(values))
        core.settle(res)
        commit({ ...cur, values, closed, revealed, current: -1, tries: 0, phase: 'done', clue: `Era ${expected[i]}. ¡Seguimos!`, last: res })
        return
      }
      commit({ ...cur, values, closed, revealed, current: nextOpen, tries: 0, clue: `Era ${expected[i]}. ¡Seguimos!`, attemptKey: cur.attemptKey + 1 })
      return
    }
    core.retry()
    commit({
      ...cur,
      tries,
      phase: 'retry',
      clue: clueFor ? clueFor(i) : '¡Casi! Piénsalo otra vez.',
      attemptKey: cur.attemptKey + 1,
    })
  }

  return {
    current: state.current,
    values: state.values,
    revealed: state.revealed,
    closed: state.closed,
    phase: state.phase,
    clue: state.clue,
    last: state.last,
    attemptKey: state.attemptKey,
    hints: core.hints,
    hintsShown: core.hintsShown,
    hintsUsed: core.hintsUsed,
    canHint: core.canHint,
    askHint: core.askHint,
    submit,
    mode: core.mode,
  }
}
