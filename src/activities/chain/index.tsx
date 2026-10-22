import { useState } from 'react'
/* "Cadena de dobles": doubling chains (3 → 6 → 12 → 24). Each link is the double of the one before. */
import type { ActivityProps, ExerciseOutcome } from '@/types'
import { useActivityHost } from '../host'
import DoubleChainView from '../views/DoubleChainView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { itemCount, useItems } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import { requeueWrong, startQueue } from '../shared/requeue'
import shared from '../facts/shared/shared.module.css'
import s from './chain.module.css'

const ADVANCE_OK_MS = 800
const ADVANCE_WRONG_MS = 1200

export default function ChainActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const total = itemCount(config, 4)
  const items = useItems(config, total, host)
  const session = useSession({ total: items.length, thresholds: config.starThresholds })
  // Wrong answers come back 2–4 items later in the same run (PEDAGOGY 4); re-asks are not reported or scored.
  const [run, setRun] = useState(() => startQueue(items))

  if (session.result) {
    return (
      <div className={s.center}>
        <ResultCard result={session.result} onContinue={() => onDone(session.result!)} />
      </div>
    )
  }

  const slot = run.slots[session.index]
  const ex = slot?.item

  const handle = (o: ExerciseOutcome) => {
    if (!ex) return
    if (!slot?.retry) host.reportAttempt({ exercise: ex, check: o.check, ms: o.ms, inputMode: o.inputMode, hintsUsed: o.hintsUsed, recognitionFixes: o.recognitionFixes })
    const ok = o.check.correct
    host.react(ok ? 'correct' : 'wrong', { errorType: o.check.errorType })
    const requeued = ok || slot?.retry ? null : requeueWrong(run, session.index)
    if (requeued) setRun(requeued)
    window.setTimeout(() => session.answered(ok && !slot?.retry, !!requeued), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={run.slots.length}
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
