/* Bottom answer bar shared by the ops views: hint, friendly feedback, Comprobar and Siguiente.
   The one «Comprobar» of the screen: while the bar is mounted, the writing pads hide their own ✓. A tap on Comprobar
   right after writing first reads the pending ink, shows it for a moment («Leyendo…») and only then grades it, so the
   last digit written always counts.
   One message at a time (P3PE-13): after a check the bar shows its feedback (which names the column), not the hint
   that was open before it; a hint the child asks for after the check takes its place.
   After the second wrong check (and outside a lesson, whose slot owns its result) the exercise is taught solved step
   by step under the bar (SolutionPanel, P4): plain content in its own scroll box, so it covers nothing. */
import clsx from 'clsx'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/ui'
import { useActivityHost } from '@/activities/host'
import { useInkStoreState } from '@/ink/hooks'
import { isDivMethod, isSubMethod, normaliseDivMethod, normaliseSubMethod, normaliseTableMethod } from '@/engine'
import { SolutionPanel } from '@/activities/shared/SolutionPanel'
import type { CheckResult } from '@/types'
import type { AnswerFlow } from './flow'
import s from './AnswerBar.module.css'

/** How long the freshly read digits stay on screen before they are graded. */
export const READ_PAUSE_MS = 400
/** Wrong checks after which the solution is shown under the bar. */
export const SOLUTION_AFTER_WRONG = 2

export interface AnswerBarProps {
  flow: AnswerFlow
  /** Runs the view's own check (the same path as Enter). */
  onCheck: () => void
  canCheck: boolean
  /** Label of the forward button (default Siguiente). */
  nextLabel?: string
  /** The view submits by itself (the memory game): no Comprobar and no Revisar, only the hint and the forward button. */
  selfChecking?: boolean
}

export function AnswerBar({ flow, onCheck, canCheck, nextLabel, selfChecking = false }: AnswerBarProps) {
  const host = useActivityHost()
  const store = useInkStoreState()
  useEffect(() => store.mountBar(), [store])
  const [reading, setReading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  // The view's check of the latest render: after reading the ink, the digits just read are in its state.
  const checkRef = useRef(onCheck)
  useLayoutEffect(() => { checkRef.current = onCheck })

  const busy = store.isBusy()
  const runCheck = () => {
    if (reading) return
    if (!store.flushInk()) { onCheck(); return }
    setReading(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setReading(false)
      checkRef.current()
    }, READ_PAUSE_MS)
  }
  // Pending ink counts as an answer: the button reads it before grading.
  const checkable = canCheck || busy

  const r = flow.result
  const lastHint = flow.hintsShown > 0 ? flow.hints[flow.hintsShown - 1] : null
  // With feedback off (guardian, daily review) the host shows its own result and forward button.
  const hostOwnsResult = !flow.showFeedback && flow.submitted
  // The feedback and the revealed hint are separate panels: a check never hides a hint the child asked for.
  const feedback = r && !hostOwnsResult
    ? { tone: r.correct ? 'ok' : 'clue', text: host.t(r.feedback ?? (r.correct ? '¡Muy bien, {child}!' : 'Revisa tu respuesta.')) }
    : null
  // Hints revealed when the latest result came: a hint asked for after it is newer than the feedback.
  const [seen, setSeen] = useState<{ r: CheckResult | null; hints: number }>({ r, hints: flow.hintsShown })
  if (seen.r !== r) setSeen({ r, hints: flow.hintsShown })
  const hintAfterCheck = seen.r === r ? flow.hintsShown > seen.hints : false
  const hint = lastHint && (!feedback || hintAfterCheck) ? { tone: 'hint', text: host.t(lastHint.text) } : null
  const message = hint ?? feedback
  const showSolution = !!flow.exercise && !!r && !r.correct && !hostOwnsResult && flow.showFeedback && !selfChecking
    && (flow.wrongTries ?? 0) >= SOLUTION_AFTER_WRONG
  const solutionOpts = useMemo(() => ({
    subMethod: normaliseSubMethod(isSubMethod(flow.method) ? flow.method : host.prefs.subMethod),
    divMethod: normaliseDivMethod(isDivMethod(flow.method) ? flow.method : host.prefs.divMethod),
    tableMethod: normaliseTableMethod(host.prefs.tableMethod),
  }), [flow.method, host.prefs.subMethod, host.prefs.divMethod, host.prefs.tableMethod])
  const hasHint = flow.allowHints && flow.hints.length > 0 && flow.hintsShown < flow.hints.length
  const checkLabel = reading || busy ? 'Leyendo…' : '✓ Comprobar'

  return (
    <>
    <div className={s.bar} role="group" aria-label="Respuesta">
      <div className={s.side}>
        {flow.allowHints && (
          <Button variant="secondary" size="md" onClick={() => flow.showNextHint()} disabled={!hasHint} aria-label="Pista">
            💡 Pista
          </Button>
        )}
      </div>
      <div className={s.message} aria-live="polite">
        {message && (
          <p key={message.tone} className={clsx(s.bubble, s[message.tone])} role={message === hint ? 'note' : undefined}>
            {message.text}
          </p>
        )}
      </div>
      <div className={s.side}>
        {!flow.submitted && !selfChecking && (
          <Button
            variant="success" size="lg" onClick={runCheck} disabled={!checkable || reading}
            aria-busy={reading || busy || undefined}
          >
            {checkLabel}
          </Button>
        )}
        {flow.submitted && !hostOwnsResult && (
          <>
            {!r?.correct && !selfChecking && (
              <Button variant="secondary" size="md" onClick={runCheck} disabled={!checkable || reading}>
                {reading ? 'Leyendo…' : 'Revisar'}
              </Button>
            )}
            <Button variant="magic" size="lg" onClick={flow.finish}>
              {nextLabel ?? 'Siguiente →'}
            </Button>
          </>
        )}
      </div>
    </div>
    {showSolution && flow.exercise && <SolutionPanel exercise={flow.exercise} opts={solutionOpts} className={s.solution} />}
    </>
  )
}
