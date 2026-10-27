/* One exercise inside a world-meta session (guardian challenge, daily review, the daily session, a class): the real
   ExerciseView, a warm feedback line and an explicit continue button (never auto-advance, children need time to read).
   Feedback is never red: errors are clues.
   - «Inténtalo otra vez» (allowRetry): after a wrong first answer the same exercise comes back once, input cleared. The
     first answer is the graded one (mastery, the run's requeue); the attempt is reported once, at the end, with the
     retries it took.
   - «No lo sé» (allowDontKnow): before any answer. It records one wrong attempt with errorType 'dont-know', then shows
     every hint («Así se hace»), which never give the final answer. Nothing else is graded. */
import { useEffect, useRef, useState } from 'react'
import { ExerciseView, useActivityHost } from '@/activities'
import { HintVisual } from '@/activities/facts/shared/HintPanel'
import { pickPhrase } from '@/content'
import { hintsFor } from '@/engine'
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
  /** false for a re-ask inside a run: the answer is shown but not logged again (default true). */
  report?: boolean
  onContinue: (outcome: ExerciseOutcome) => void
  /** «Ahora no»: shown only before the child answers; nothing is reported. */
  onSkip?: () => void
  /** Offer «Inténtalo otra vez» after a wrong first answer (default false). */
  allowRetry?: boolean
  /** Offer «No lo sé» before the child answers: records a dont-know attempt and shows the hints (default false). */
  allowDontKnow?: boolean
}

/**
 * asking: the child answers (first try). offered: wrong first try, «Inténtalo otra vez» on screen. retrying: the same
 * exercise again. dontknow: «No lo sé», the hints are shown. final: answered for good.
 */
type Stage = 'asking' | 'offered' | 'retrying' | 'dontknow' | 'final'

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function ExerciseStep({
  exercise, allowHints, okLabel, wrongLabel, feedbackFor, report = true, onContinue, onSkip, allowRetry = false, allowDontKnow = false,
}: ExerciseStepProps) {
  const host = useActivityHost()
  const [stage, setStage] = useState<Stage>('asking')
  const [view, setView] = useState(0)
  const [message, setMessage] = useState('')
  const [latest, setLatest] = useState<ExerciseOutcome | null>(null)
  const stageRef = useRef<Stage>('asking')
  const first = useRef<ExerciseOutcome | null>(null)
  /** The attempt waiting to be reported: sent once, when the step is finished (or left). */
  const pending = useRef<{ outcome: ExerciseOutcome; retries: number; solvedOnRetry: boolean } | null>(null)
  const startedAt = useRef(now())
  const hostRef = useRef(host)
  hostRef.current = host
  const exRef = useRef(exercise)
  exRef.current = exercise
  const reportRef = useRef(report)
  reportRef.current = report

  const enter = (next: Stage) => {
    stageRef.current = next
    setStage(next)
  }

  /** Reports the pending attempt, once. */
  const send = () => {
    const p = pending.current
    pending.current = null
    if (!p || !reportRef.current) return
    const { outcome: o, retries, solvedOnRetry } = p
    const attempt: AttemptInput = {
      exercise: exRef.current,
      check: o.check,
      ms: o.ms,
      inputMode: o.inputMode,
      hintsUsed: o.hintsUsed,
      recognitionFixes: o.recognitionFixes,
      ...(retries ? { retries } : {}),
      ...(solvedOnRetry ? { solvedOnRetry } : {}),
      // The method the child used (subtraction, division or the tables trick): the adult report counts it.
      ...(o.method ? { method: o.method } : {}),
    }
    hostRef.current.reportAttempt(attempt)
  }

  // A step left in the middle (pause, exit) still keeps its first answer.
  useEffect(() => () => send(), []) // eslint-disable-line react-hooks/exhaustive-deps

  const show = (o: ExerciseOutcome) => {
    const custom = feedbackFor?.(o)
    const phrase = o.check.correct
      ? pickPhrase('correct', hostRef.current.rng)
      : pickPhrase('wrong', hostRef.current.rng, o.check.errorType)
    setMessage(hostRef.current.t(custom ?? phrase))
    setLatest(o)
    hostRef.current.react(o.check.correct ? 'correct' : 'wrong', { errorType: o.check.errorType })
  }

  const handleAnswered = (o: ExerciseOutcome) => {
    const st = stageRef.current
    if (st === 'asking') {
      first.current = o
      // A view that already gave its own second try (facts) settles the exercise: no further retry here.
      const offer = allowRetry && !o.check.correct && !o.retries
      pending.current = { outcome: o, retries: o.retries ?? 0, solvedOnRetry: false }
      show(o)
      if (offer) {
        enter('offered')
      } else {
        send()
        enter('final')
      }
      return
    }
    if (st === 'retrying' && first.current) {
      // The retry: its result is recorded on the first answer's attempt (the graded one).
      pending.current = {
        outcome: first.current,
        retries: 1 + (o.retries ?? 0),
        solvedOnRetry: o.check.correct,
      }
      show(o)
      send()
      enter('final')
    }
  }

  const retry = () => {
    if (stageRef.current !== 'offered') return
    setLatest(null)
    setMessage('')
    setView((v) => v + 1)
    enter('retrying')
  }

  const dontKnow = () => {
    if (stageRef.current !== 'asking') return
    const o: ExerciseOutcome = {
      check: { correct: false, given: 'No lo sé', expected: '?', errorType: 'dont-know' },
      ms: Math.round(now() - startedAt.current),
      inputMode: 'tap',
      hintsUsed: 0,
      recognitionFixes: 0,
    }
    first.current = o
    pending.current = { outcome: o, retries: 0, solvedOnRetry: false }
    send()
    setLatest(o)
    setMessage(host.t('No pasa nada. Mira cada pista y, cuando lo entiendas, sigue.'))
    enter('dontknow')
  }

  const finish = () => {
    send()
    onContinue(first.current ?? latest!)
  }

  const ok = latest?.check.correct === true
  const hints = stage === 'dontknow'
    ? hintsFor(exercise, host.prefs.subMethod, { divMethod: host.prefs.divMethod, tableMethod: host.prefs.tableMethod })
    : []
  const wrongText = wrongLabel ?? okLabel
  const inputLocked = stage === 'offered' || stage === 'dontknow' || stage === 'final'

  return (
    <div className={s.step}>
      <div className={s.view} inert={inputLocked ? true : undefined}>
        <ExerciseView
          key={view}
          exercise={exercise}
          onAnswered={handleAnswered}
          allowHints={allowHints}
          showFeedback={false}
          method={host.prefs.subMethod}
          divMethod={host.prefs.divMethod}
          tableMethod={host.prefs.tableMethod}
        />
      </div>
      {stage === 'asking' && (onSkip || allowDontKnow) && (
        <div className={s.skip}>
          {onSkip && <Button size="sm" variant="secondary" onClick={onSkip}>Ahora no</Button>}
          {allowDontKnow && <Button size="sm" variant="secondary" onClick={dontKnow}>No lo sé</Button>}
        </div>
      )}
      {stage === 'dontknow' && (
        <div className={s.feedback} data-tone="clue" role="status">
          <p className={s.message}>{message}</p>
          <div className={s.hints}>
            <h3 className={s.hintsTitle}>Así se hace</h3>
            <ol className={s.hintList}>
              {hints.map((h) => (
                <li key={h.level} className={s.hintItem}>
                  <p className={s.hintLevel}>Pista {h.level} de {hints.length}</p>
                  <p className={s.hintText}>{host.t(h.text)}</p>
                  <HintVisual hint={h} />
                </li>
              ))}
            </ol>
          </div>
          <Button size="lg" variant="primary" onClick={finish}>{wrongText}</Button>
        </div>
      )}
      {stage === 'offered' && (
        <div className={s.feedback} data-tone="clue" role="status">
          <p className={s.message}>{message}</p>
          <div className={s.actions}>
            <Button size="lg" variant="primary" onClick={retry}>Inténtalo otra vez</Button>
            <Button size="lg" variant="secondary" onClick={finish}>{wrongText}</Button>
          </div>
        </div>
      )}
      {stage === 'final' && latest && (
        <div className={s.feedback} data-tone={ok ? 'good' : 'clue'} role="status">
          <p className={s.message}>{message}</p>
          <Button
            size="lg"
            variant={ok ? 'success' : 'primary'}
            onClick={finish}
          >
            {ok ? okLabel : wrongText}
          </Button>
        </div>
      )}
    </div>
  )
}
