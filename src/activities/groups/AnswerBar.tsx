/* Bottom answer bar shared by the ops views: hint, friendly feedback, Comprobar and Siguiente. */
import clsx from 'clsx'
import { Button } from '@/ui'
import { useActivityHost } from '@/activities/host'
import type { AnswerFlow } from './flow'
import s from './AnswerBar.module.css'

export interface AnswerBarProps {
  flow: AnswerFlow
  /** Runs the view's own check (the same path as Enter). */
  onCheck: () => void
  canCheck: boolean
  /** Label of the forward button (default Siguiente). */
  nextLabel?: string
}

export function AnswerBar({ flow, onCheck, canCheck, nextLabel }: AnswerBarProps) {
  const host = useActivityHost()
  const r = flow.result
  const lastHint = flow.hintsShown > 0 ? flow.hints[flow.hintsShown - 1] : null
  // With feedback off (guardian, daily review) the host shows its own result and forward button.
  const hostOwnsResult = !flow.showFeedback && flow.submitted
  const message = r && !hostOwnsResult
    ? { tone: r.correct ? 'ok' : 'clue', text: host.t(r.feedback ?? (r.correct ? '¡Muy bien, {child}!' : 'Revisa tu respuesta.')) }
    : lastHint
      ? { tone: 'hint', text: host.t(lastHint.text) }
      : null
  const hasHint = flow.allowHints && flow.hints.length > 0 && flow.hintsShown < flow.hints.length

  return (
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
          <p className={clsx(s.bubble, s[message.tone])}>{message.text}</p>
        )}
      </div>
      <div className={s.side}>
        {!flow.submitted && (
          <Button variant="success" size="lg" onClick={onCheck} disabled={!canCheck}>
            ✓ Comprobar
          </Button>
        )}
        {flow.submitted && !hostOwnsResult && (
          <>
            {!r?.correct && (
              <Button variant="secondary" size="md" onClick={onCheck} disabled={!canCheck}>
                Revisar
              </Button>
            )}
            <Button variant="magic" size="lg" onClick={flow.finish}>
              {nextLabel ?? 'Siguiente →'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
