/* One exercise inside a world-meta session (guardian challenge, daily review, the daily session, a class): the real
   ExerciseView, a warm feedback line and an explicit continue button (never auto-advance, children need time to read).
   Feedback is never red: errors are clues.
   - «Inténtalo otra vez» (allowRetry): after a wrong first answer the same exercise comes back once, input cleared. The
     first answer is the graded one (mastery, the run's requeue); the attempt is reported once, at the end, with the
     retries it took.
   - «No lo sé» (allowDontKnow): before any answer. It records one wrong attempt with errorType 'dont-know', then shows
     the exercise solved step by step («Así se resuelve», engine/solution.ts), with its answer. Nothing else is graded.
   - A wrong final answer shows the corrector's own message (what went wrong in this exercise) and the solution too:
     the child never leaves an exercise without seeing how it is done.
   - «Ahora dilo tú» (eng-speak) is never an attempt: nothing is reported (no mastery, no stars in the wallet), it has no
     «Ahora no» nor «No lo sé» (the view has its own «Saltar»), and its message is the view's own (check.feedback). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { ExerciseView, useActivityHost } from '@/activities'
import { SolutionPanel } from '@/activities/shared/SolutionPanel'
import { HintVisual } from '@/activities/facts/shared/HintPanel'
import { pickPhrase } from '@/content'
import { hintsFor, isCompletionOnly, methodFor } from '@/engine'
import { statementFor } from '@/engine/statement'
import { ListenButton } from '@/activities/shared/ListenButton'
import { Button } from '@/ui'
import { FitToScreen } from '@/activities/shared/FitToScreen'
import { guidedOutcome } from '@/activities/shared/guided'
import type { AttemptInput, Exercise, ExerciseOutcome } from '@/types'
import s from './ExerciseStep.module.css'

/** An attempt waiting to be reported: the outcome and the retry facts. graded: false for a retry row (see handleAnswered). */
interface PendingAttempt {
  outcome: ExerciseOutcome
  retries: number
  solvedOnRetry: boolean
  graded: boolean
}

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
  /** Teaching after a wrong multiplication fact (default 'full': the trick, then the drawing and copying the answer);
   *  'clue' only the trick (warm-up), 'none' nothing (a check before a class). See ExerciseViewProps.teach. */
  teach?: 'none' | 'clue' | 'full'
  /** The help is on screen from the start (the daily session's visual support): a right answer counts as a hint used. */
  guided?: boolean
}

/**
 * asking: the child answers (first try). offered: wrong first try, «Inténtalo otra vez» on screen. retrying: the same
 * exercise again. dontknow: «No lo sé», the solution is shown (maths) or the hints (Lengua, English). final: answered for good.
 */
type Stage = 'asking' | 'offered' | 'retrying' | 'dontknow' | 'final'

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** The exercise with its story templates rendered for this child ({child}, {pet}, their genders), so that the «Escuchar»
    button reads the same names the screen shows. Strings without a template are left as they are. */
function renderedForVoice<T>(value: T, t: (template: string) => string): T {
  if (typeof value === 'string') return (value.includes('{') ? t(value) : value) as T
  if (Array.isArray(value)) return value.map((v) => renderedForVoice(v, t)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, renderedForVoice(v, t)])) as T
  }
  return value
}

/** A short cheer in front of the corrector's message, never longer than the message itself. */
const CHEER = 'Casi.'

export function ExerciseStep({
  exercise, allowHints, okLabel, wrongLabel, feedbackFor, report = true, onContinue, onSkip, allowRetry = false, allowDontKnow = false,
  teach = 'full', guided = false,
}: ExerciseStepProps) {
  const host = useActivityHost()
  const [stage, setStage] = useState<Stage>('asking')
  const [view, setView] = useState(0)
  const [message, setMessage] = useState('')
  const [latest, setLatest] = useState<ExerciseOutcome | null>(null)
  const stageRef = useRef<Stage>('asking')
  const first = useRef<ExerciseOutcome | null>(null)
  /** The attempt waiting to be reported: sent once, when the step is finished (or left). */
  const pending = useRef<PendingAttempt | null>(null)
  /** The first answer has been reported as graded: a later retry can only add its own ungraded row. */
  const firstSent = useRef(false)
  const startedAt = useRef(now())
  const hostRef = useRef(host)
  hostRef.current = host
  const exRef = useRef(exercise)
  exRef.current = exercise
  const reportRef = useRef(report)
  reportRef.current = report

  /** A completion-only exercise (escritura guiada) is never graded: its attempt is outside accuracy and the session. */
  const gradedHere = () => !isCompletionOnly(exRef.current.kind)

  const enter = (next: Stage) => {
    stageRef.current = next
    setStage(next)
  }

  /** Reports the pending attempt, once. */
  const send = () => {
    const p = pending.current
    pending.current = null
    if (!p || exRef.current.kind === 'eng-speak') return
    if (p.graded) firstSent.current = true
    if (!reportRef.current) return
    const { outcome: o, retries, solvedOnRetry, graded } = p
    const attempt: AttemptInput = {
      exercise: exRef.current,
      check: o.check,
      ms: o.ms,
      inputMode: o.inputMode,
      hintsUsed: o.hintsUsed,
      recognitionFixes: o.recognitionFixes,
      ...(retries ? { retries } : {}),
      ...(solvedOnRetry ? { solvedOnRetry } : {}),
      ...(graded ? {} : { graded: false }),
      // The method the child used (subtraction, division or the tables trick): the adult report counts it.
      ...(o.method ? { method: o.method } : {}),
    }
    hostRef.current.reportAttempt(attempt)
  }

  // A step left in the middle (pause, exit, the app closed or hidden) still keeps its first answer.
  // The [] deps are intentional: the listeners are installed once, and send() reads only refs, so nothing goes stale.
  useEffect(() => {
    const onHide = () => send()
    const onVisibility = () => { if (document.visibilityState === 'hidden') send() }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      send()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // After «Inténtalo otra vez» the focus goes to the new exercise (its first input), not to the page body.
  const viewRef = useRef<HTMLDivElement>(null)
  // The view already took a wrong try (its own second try, or copying the answer): «Ahora no» and «No lo sé» go away.
  const [tried, setTried] = useState(false)
  useEffect(() => {
    if (view === 0) return
    const root = viewRef.current
    if (!root) return
    // Only focusable controls: a display-only cell (no tabindex) would not take the focus.
    root.querySelector<HTMLElement>('input:not([disabled]), textarea, [role="textbox"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])')?.focus()
    if (!root.contains(document.activeElement)) {
      root.tabIndex = -1
      root.focus()
    }
  }, [view])

  const show = (o: ExerciseOutcome) => {
    const ex = exRef.current
    // A missed multiplication fact the child has just seen worked out: the fact itself, to remember, not a generic phrase.
    const factLine = ex.kind === 'fact-mul' && !o.check.correct && teach !== 'none'
      ? `¡Recuérdalo: ${ex.a} × ${ex.b} = ${ex.answer}!`
      : undefined
    // The corrector's own message says what went wrong in THIS exercise: it is the message (a generic phrase only when
    // the corrector has none).
    const fromCheck = o.check.feedback?.trim()
    const checkLine = fromCheck ? (o.check.correct || /^¡?casi/i.test(fromCheck) ? fromCheck : `${CHEER} ${fromCheck}`) : undefined
    const custom = feedbackFor?.(o) ?? (ex.kind === 'eng-speak' ? o.check.feedback : factLine ?? checkLine)
    const phrase = o.check.correct
      ? pickPhrase('correct', hostRef.current.rng)
      : pickPhrase('wrong', hostRef.current.rng, o.check.errorType)
    setMessage(hostRef.current.t(custom ?? phrase))
    setLatest(o)
    hostRef.current.react(o.check.correct ? 'correct' : 'wrong', { errorType: o.check.errorType })
  }

  const handleAnswered = (raw: ExerciseOutcome) => {
    const o = guided ? guidedOutcome(raw) : raw
    const st = stageRef.current
    if (st === 'asking') {
      first.current = o
      // A view that already gave its own second try (facts) settles the exercise: no further retry here.
      const offer = allowRetry && !o.check.correct && !o.retries
      pending.current = { outcome: o, retries: o.retries ?? 0, solvedOnRetry: false, graded: gradedHere() }
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
      const retries = 1 + (o.retries ?? 0)
      const solvedOnRetry = o.check.correct
      // Normally the retry is folded into the first answer's attempt (the graded one). If that was already reported
      // (the page was hidden during the offer), the retry is its own attempt, not graded again.
      pending.current = firstSent.current
        ? { outcome: o, retries, solvedOnRetry, graded: false }
        : { outcome: first.current, retries, solvedOnRetry, graded: gradedHere() }
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
    pending.current = { outcome: o, retries: 0, solvedOnRetry: false, graded: gradedHere() }
    send()
    setLatest(o)
    setMessage(host.t('No pasa nada. Mira cómo se hace y, cuando lo entiendas, sigue.'))
    enter('dontknow')
  }

  const finish = () => {
    send()
    onContinue(first.current ?? latest!)
  }

  const ok = latest?.check.correct === true
  // The school's method, chosen by the grown-up: a retired one (por partes, saltos, repartir por partes, multiplicar
  // hacia arriba) saved in old settings becomes the school's method here too.
  const subMethod = methodFor('sub', host.prefs)
  const divMethod = methodFor('div', host.prefs)
  const solutionOpts = { subMethod, divMethod, tableMethod: host.prefs.tableMethod }
  // The solution is taught for maths only: Lengua and English keep their hints at «No lo sé» and their own messages at
  // the end (their «solution» would only be «La respuesta es X»). A missed fact with teach 'full' was already worked
  // and copied in its own view: no second solution under it.
  const isMath = !exercise.kind.startsWith('lng-') && !exercise.kind.startsWith('eng-')
  const teaches = isMath && !(exercise.kind === 'fact-mul' && teach === 'full')
  const hints = stage === 'dontknow' && !isMath ? hintsFor(exercise, subMethod, { divMethod, tableMethod: host.prefs.tableMethod }) : []
  const wrongText = wrongLabel ?? okLabel
  const inputLocked = stage === 'offered' || stage === 'dontknow' || stage === 'final'
  // «Escuchar»: every exercise can be heard, also with the automatic reading off. «Ahora dilo tú» has its own voice.
  const statement = useMemo(() => statementFor(renderedForVoice(exercise, host.t)), [exercise, host.t])

  // Shrunk to fit the window (daily session, review, class, guardian, reading): no scrolling to answer or go on.
  return (
    <FitToScreen className={s.stepOuter} innerClassName={s.step}>
      {exercise.kind !== 'eng-speak' && (
        <div className={s.listenRow}>
          <ListenButton text={statement} />
        </div>
      )}
      <div ref={viewRef} className={s.view} inert={inputLocked ? true : undefined}>
        <ExerciseView
          key={view}
          exercise={exercise}
          onAnswered={handleAnswered}
          allowHints={allowHints}
          guided={guided}
          showFeedback={false}
          teach={teach}
          onTry={() => setTried(true)}
          method={subMethod}
          divMethod={divMethod}
          tableMethod={host.prefs.tableMethod}
        />
      </div>
      {stage === 'asking' && !tried && (onSkip || allowDontKnow) && exercise.kind !== 'eng-speak' && (
        <div className={s.skip}>
          {onSkip && <Button size="sm" variant="secondary" onClick={onSkip}>Ahora no</Button>}
          {allowDontKnow && <Button size="sm" variant="secondary" onClick={dontKnow}>No lo sé</Button>}
        </div>
      )}
      {stage === 'dontknow' && (
        <div className={s.feedback} data-tone="clue" role="status">
          <p className={s.message}>{message}</p>
          {isMath ? <SolutionPanel exercise={exercise} opts={solutionOpts} /> : (
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
          )}
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
          {!ok && teaches && <SolutionPanel exercise={exercise} opts={solutionOpts} />}
          <Button
            size="lg"
            variant={ok ? 'success' : 'primary'}
            onClick={finish}
          >
            {ok ? okLabel : wrongText}
          </Button>
        </div>
      )}
    </FitToScreen>
  )
}
