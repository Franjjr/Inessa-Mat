/* "Práctica tranquila": calm practice of times-table facts (and divisions) with optional trick cards. */
import { useState } from 'react'
import { motion } from 'motion/react'
import { strategyForFact } from '@/engine'
import type { ActivityProps, ExerciseOutcome } from '@/types'
import { useActivityHost } from '../host'
import FactView from '../views/FactView'
import { ActivityFrame, ResultCard } from './shared/ActivityFrame'
import { itemCount, useItems } from './shared/items'
import { useSession } from './shared/session'
import shared from './shared/shared.module.css'
import s from './facts.module.css'

const ADVANCE_OK_MS = 650
const ADVANCE_WRONG_MS = 1100

export default function FactsActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const params = (config.params ?? {}) as { showTrick?: boolean; helper?: string }
  const total = itemCount(config, 10)
  const items = useItems(config, total, host)
  const session = useSession({ total: items.length, thresholds: config.starThresholds })
  const [streak, setStreak] = useState(0)

  if (session.result) {
    return (
      <div className={s.center}>
        <ResultCard result={session.result} onContinue={() => onDone(session.result!)} />
      </div>
    )
  }

  const ex = items[session.index]
  const trick = params.showTrick && ex?.kind === 'fact-mul' ? strategyForFact(ex.a, ex.b) : null

  const handle = (o: ExerciseOutcome) => {
    if (!ex) return
    host.reportAttempt({
      exercise: ex,
      check: o.check,
      ms: o.ms,
      inputMode: o.inputMode,
      hintsUsed: o.hintsUsed,
      recognitionFixes: o.recognitionFixes,
    })
    const ok = o.check.correct
    const next = ok ? streak + 1 : 0
    setStreak(next)
    host.react(ok ? (next > 0 && next % 3 === 0 ? 'streak' : 'correct') : 'wrong', { errorType: o.check.errorType, streak: next })
    window.setTimeout(() => session.answered(ok), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={items.length}
      accent="var(--w6)"
      accentSoft="var(--w6-soft)"
      onExit={onExit}
      badge={params.helper === 'borron' ? <span className={shared.statPill}>Ayuda a Borrón</span> : undefined}
    >
      {trick && (
        <motion.div key={`trick-${session.index}`} className={s.trick} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <span className={s.trickLabel}>Truco</span>
          <span>{host.t(trick.text)}</span>
        </motion.div>
      )}
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          <FactView exercise={ex} onAnswered={handle} allowHints />
        </div>
      )}
    </ActivityFrame>
  )
}
