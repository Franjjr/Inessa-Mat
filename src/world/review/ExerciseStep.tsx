/* One exercise inside a world-meta session (guardian challenge, daily review): the real ExerciseView, the
   attempt reported to the host, a warm feedback line and an explicit continue button (never auto-advance,
   children need time to read). Feedback is never red: errors are clues. */
import { useRef, useState } from 'react'
import { ExerciseView, useActivityHost } from '@/activities'
import { pickPhrase } from '@/content'
import { Button } from '@/ui'
import type { AttemptInput, Exercise, ExerciseOutcome } from '@/types'
import s from './ExerciseStep.module.css'

export interface ExerciseStepProps {
  exercise: Exercise
  allowHints: boolean
  /** Label of the button after a correct answer. */
  okLabel: string
  /** Label of the button after a wrong answer (defaults to okLabel). */
  wrongLabel?: string
  /** Optional child-facing feedback (a template) replacing the engine phrase. */
  feedbackFor?: (outcome: ExerciseOutcome) => string | undefined
  onContinue: (outcome: ExerciseOutcome) => void
}

export function ExerciseStep({ exercise, allowHints, okLabel, wrongLabel, feedbackFor, onContinue }: ExerciseStepProps) {
  const host = useActivityHost()
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null)
  const [message, setMessage] = useState('')
  const answered = useRef(false)

  const handleAnswered = (o: ExerciseOutcome) => {
    if (answered.current) return // ExerciseView reports once; guard against replays anyway
    answered.current = true
    const attempt: AttemptInput = {
      exercise,
      check: o.check,
      ms: o.ms,
      inputMode: o.inputMode,
      hintsUsed: o.hintsUsed,
      recognitionFixes: o.recognitionFixes,
    }
    host.reportAttempt(attempt)
    host.react(o.check.correct ? 'correct' : 'wrong', { errorType: o.check.errorType })
    const custom = feedbackFor?.(o)
    const phrase = o.check.correct
      ? pickPhrase('correct', host.rng)
      : pickPhrase('wrong', host.rng, o.check.errorType)
    setMessage(host.t(custom ?? phrase))
    setOutcome(o)
  }

  const ok = outcome?.check.correct === true
  return (
    <div className={s.step}>
      <ExerciseView
        exercise={exercise}
        onAnswered={handleAnswered}
        allowHints={allowHints}
        showFeedback={false}
      />
      {outcome && (
        <div className={s.feedback} data-tone={ok ? 'good' : 'clue'} role="status">
          <p className={s.message}>{message}</p>
          <Button
            size="lg"
            variant={ok ? 'success' : 'primary'}
            onClick={() => onContinue(outcome)}
          >
            {ok ? okLabel : (wrongLabel ?? okLabel)}
          </Button>
        </div>
      )}
    </div>
  )
}
