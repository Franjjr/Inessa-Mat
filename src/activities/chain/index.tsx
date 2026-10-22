/* "Cadena de dobles": doubling chains (3 → 6 → 12 → 24). Each link is the double of the one before. */
import type { ActivityProps, ExerciseOutcome } from '@/types'
import { useActivityHost } from '../host'
import DoubleChainView from '../views/DoubleChainView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { itemCount, useItems } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import s from './chain.module.css'

const ADVANCE_OK_MS = 800
const ADVANCE_WRONG_MS = 1200

export default function ChainActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const total = itemCount(config, 4)
  const items = useItems(config, total, host)
  const session = useSession({ total: items.length, thresholds: config.starThresholds })

  if (session.result) {
    return (
      <div className={s.center}>
        <ResultCard result={session.result} onContinue={() => onDone(session.result!)} />
      </div>
    )
  }

  const ex = items[session.index]

  const handle = (o: ExerciseOutcome) => {
    if (!ex) return
    host.reportAttempt({ exercise: ex, check: o.check, ms: o.ms, inputMode: o.inputMode, hintsUsed: o.hintsUsed, recognitionFixes: o.recognitionFixes })
    const ok = o.check.correct
    host.react(ok ? 'correct' : 'wrong', { errorType: o.check.errorType })
    window.setTimeout(() => session.answered(ok), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={items.length}
      accent="var(--w8)"
      accentSoft="var(--w8-soft)"
      onExit={onExit}
    >
      <p className={s.rule}>Doble, doble y doble: cada eslabón es el doble del anterior.</p>
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          <DoubleChainView exercise={ex} onAnswered={handle} allowHints />
        </div>
      )}
    </ActivityFrame>
  )
}
