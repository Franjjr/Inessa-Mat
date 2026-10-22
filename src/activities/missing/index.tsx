/* "¿Qué número falta?": missing factors. Every right answer lights a crystal in the door's lock. */
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { sfx } from '@/audio'
import type { ActivityProps, ExerciseOutcome } from '@/types'
import { useActivityHost } from '../host'
import MissingFactorView from '../views/MissingFactorView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { itemCount, useItems } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import { requeueWrong, startQueue } from '../shared/requeue'
import shared from '../facts/shared/shared.module.css'
import s from './missing.module.css'

const ADVANCE_OK_MS = 700
const ADVANCE_WRONG_MS = 1100

export default function MissingActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const total = itemCount(config, 6)
  const items = useItems(config, total, host)
  const session = useSession({ total: items.length, thresholds: config.starThresholds })
  // Wrong answers come back 2–4 items later in the same run (PEDAGOGY 4); re-asks are not reported or scored.
  const [run, setRun] = useState(() => startQueue(items))
  const [lit, setLit] = useState<boolean[]>(() => run.slots.map(() => false))

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
    if (ok) {
      sfx.play('star')
      setLit((l) => l.map((v, i) => (i === session.index ? true : v)))
    }
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
      accent="var(--w2)"
      accentSoft="var(--w2-soft)"
      onExit={onExit}
    >
      <div className={s.locks} aria-label="Cerraduras del portón">
        {run.slots.map((_, i) => (
          <motion.span
            key={i}
            className={`${s.gem} ${lit[i] ? s.gemLit : ''} ${i === session.index ? s.gemNow : ''}`}
            animate={lit[i] && !reduce ? { scale: [0.6, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            aria-hidden
          />
        ))}
      </div>
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          <MissingFactorView exercise={ex} onAnswered={handle} allowHints />
        </div>
      )}
    </ActivityFrame>
  )
}
