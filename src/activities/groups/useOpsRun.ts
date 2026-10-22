/* Runs the rounds of an operations activity: reports every attempt, reacts through the companion, and ends the
   activity with the star rating after the last round. Views call record() once per exercise. */
import { useCallback, useRef, useState } from 'react'
import type { ActivityConfig, ActivityProps, Exercise, ExerciseOutcome } from '@/types'
import { starsFor } from '@/engine'
import { useActivityHost } from '@/activities/host'

export interface OpsRun {
  index: number
  total: number
  exercise: Exercise | undefined
  correct: number
  record: (outcome: ExerciseOutcome) => void
}

export function useOpsRun(exercises: Exercise[], config: ActivityConfig, onDone: ActivityProps['onDone']): OpsRun {
  const host = useActivityHost()
  const started = useRef(Date.now())
  const state = useRef({ index: 0, correct: 0, done: false })
  const [, force] = useState(0)
  const latest = useRef({ exercises, config, onDone, host })
  latest.current = { exercises, config, onDone, host }

  const record = useCallback((outcome: ExerciseOutcome) => {
    const st = state.current
    const { exercises: list, config: cfg, onDone: done, host: h } = latest.current
    if (st.done || st.index >= list.length) return
    const exercise = list[st.index]
    h.reportAttempt({
      exercise,
      check: outcome.check,
      ms: outcome.ms,
      inputMode: outcome.inputMode,
      hintsUsed: outcome.hintsUsed,
      recognitionFixes: outcome.recognitionFixes,
    })
    h.react(outcome.check.correct ? 'correct' : 'wrong', { errorType: outcome.check.errorType })
    if (outcome.check.correct) st.correct += 1
    st.index += 1
    if (st.index >= list.length) {
      st.done = true
      done({
        correct: st.correct,
        total: list.length,
        stars: starsFor(st.correct, list.length, cfg.starThresholds),
        ms: Date.now() - started.current,
      })
    }
    force((n) => n + 1)
  }, [])

  return {
    index: state.current.index,
    total: exercises.length,
    exercise: exercises[state.current.index],
    correct: state.current.correct,
    record,
  }
}
