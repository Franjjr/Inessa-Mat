/* Runs the rounds of an operations activity: reports every attempt, reacts through the companion, and ends the
   activity with the star rating after the last round. Views call record() once per exercise.
   A wrong first answer brings the same exercise back 2–4 rounds later (see shared/requeue.ts). The re-ask is
   practice only: it is not reported to mastery and not counted in the stars or in the round total. */
import { useCallback, useRef, useState } from 'react'
import type { ActivityConfig, ActivityProps, Exercise, ExerciseOutcome } from '@/types'
import { starsFor } from '@/engine'
import { useActivityHost } from '@/activities/host'
import { plannedCount, requeueWrong, startQueue, type RunQueue } from '../shared/requeue'

export interface OpsRun {
  /** 0-based position in the run (re-asks included). */
  index: number
  /** Planned rounds (re-asks not included). */
  total: number
  exercise: Exercise | undefined
  /** True when the current round is a re-ask of an exercise answered wrongly earlier in this run. */
  retry: boolean
  correct: number
  record: (outcome: ExerciseOutcome) => void
}

interface RunState {
  index: number
  correct: number
  done: boolean
  queue: RunQueue<Exercise>
}

export function useOpsRun(exercises: Exercise[], config: ActivityConfig, onDone: ActivityProps['onDone']): OpsRun {
  const host = useActivityHost()
  const started = useRef(Date.now())
  const state = useRef<RunState | null>(null)
  if (state.current === null) state.current = { index: 0, correct: 0, done: false, queue: startQueue(exercises) }
  const [, force] = useState(0)
  const latest = useRef({ config, onDone, host })
  latest.current = { config, onDone, host }

  const record = useCallback((outcome: ExerciseOutcome) => {
    const st = state.current!
    const { config: cfg, onDone: done, host: h } = latest.current
    const slots = st.queue.slots
    if (st.done || st.index >= slots.length) return
    const slot = slots[st.index]
    const exercise = slot.item
    const ok = outcome.check.correct
    if (!slot.retry) {
      h.reportAttempt({
        exercise,
        check: outcome.check,
        ms: outcome.ms,
        inputMode: outcome.inputMode,
        hintsUsed: outcome.hintsUsed,
        recognitionFixes: outcome.recognitionFixes,
      })
      if (ok) st.correct += 1
    }
    h.react(ok ? 'correct' : 'wrong', { errorType: outcome.check.errorType })
    if (!slot.retry && !ok) st.queue = requeueWrong(st.queue, st.index) ?? st.queue
    st.index += 1
    if (st.index >= st.queue.slots.length) {
      st.done = true
      const total = plannedCount(st.queue)
      done({
        correct: st.correct,
        total,
        stars: starsFor(st.correct, total, cfg.starThresholds),
        ms: Date.now() - started.current,
      })
    }
    force((n) => n + 1)
  }, [])

  const current = state.current
  const slot = current.queue.slots[current.index]
  return {
    index: current.index,
    total: plannedCount(current.queue),
    exercise: slot?.item,
    retry: !!slot?.retry,
    correct: current.correct,
    record,
  }
}
