/* "Carrera contra tu récord": answer facts as fast as you can. You only race against your own best time:
   a ghost unicorn runs at the pace of your record. Untimed when the family turned timers off. */
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { ActivityProps, ExerciseOutcome } from '@/types'
import { useActivityHost } from '../host'
import FactView from '../views/FactView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { formatClock, itemCount, useItems } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import s from './race.module.css'

const ADVANCE_OK_MS = 420
const ADVANCE_WRONG_MS = 1000

/** Personal records in ms, fastest first (kept by progression; the world host may pass them in params.records). */
function recordsFrom(params: Record<string, unknown> | undefined): number[] {
  const r = params?.records
  return Array.isArray(r) ? r.filter((x): x is number => typeof x === 'number' && x > 0).sort((a, b) => a - b) : []
}

export default function RaceActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const timed = host.prefs.timedActivities
  const records = recordsFrom(config.params)
  const best = records[0]
  const total = itemCount(config, 10)
  const items = useItems(config, total, host)
  const session = useSession({ total: items.length, thresholds: config.starThresholds })
  const [clock, setClock] = useState(0)

  // Tick the clock only while the race runs and the family wants timers.
  useEffect(() => {
    if (!timed || session.result) return
    const id = window.setInterval(() => setClock(session.elapsed()), 250)
    return () => window.clearInterval(id)
    // session.elapsed is stable enough for a ticking clock; the interval is recreated when the run ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, session.result])

  if (session.result) {
    const result = { ...session.result, recordMs: session.result.ms }
    const beat = best !== undefined && result.ms < best && result.correct === result.total
    return (
      <div className={s.center}>
        <ResultCard
          result={result}
          untimed={!timed}
          onContinue={() => onDone(result)}
          extra={
            timed && (
              <p className={s.record}>
                {beat ? '¡Nuevo récord personal!' : best !== undefined ? `Tu récord: ${formatClock(best)}` : 'Este es tu primer tiempo. ¡A batirlo!'}
              </p>
            )
          }
        />
      </div>
    )
  }

  const ex = items[session.index]
  const progress = items.length ? session.index / items.length : 0
  // Ghost: where you would be if you kept the pace of your best time.
  const ghost = best !== undefined && timed ? Math.min(1, clock / best) : null

  const handle = (o: ExerciseOutcome) => {
    if (!ex) return
    host.reportAttempt({ exercise: ex, check: o.check, ms: o.ms, inputMode: o.inputMode, hintsUsed: o.hintsUsed, recognitionFixes: o.recognitionFixes })
    host.react(o.check.correct ? 'correct' : 'wrong', { errorType: o.check.errorType })
    window.setTimeout(() => session.answered(o.check.correct), o.check.correct ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={items.length}
      accent="var(--c-gold)"
      accentSoft="var(--c-gold-soft)"
      onExit={onExit}
      badge={
        timed ? <span className={s.clock} aria-live="off">⏱ {formatClock(clock)}</span> : <span className={shared.statPill}>Sin prisa</span>
      }
    >
      <div className={s.track} aria-hidden>
        <div className={s.lane}>
          {ghost !== null && (
            <motion.span
              className={s.ghost}
              animate={{ left: `${Math.min(96, ghost * 96)}%` }}
              transition={{ duration: 0.25, ease: 'linear' }}
              title="Tu récord"
            >
              👻
            </motion.span>
          )}
          <motion.span className={s.runner} animate={{ left: `${Math.min(96, progress * 96 + 1)}%` }} transition={{ type: 'spring', stiffness: 180, damping: 22 }}>
            🦄
          </motion.span>
          <span className={s.finish}>🏁</span>
        </div>
      </div>
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          <FactView exercise={ex} onAnswered={handle} allowHints compact />
        </div>
      )}
    </ActivityFrame>
  )
}
