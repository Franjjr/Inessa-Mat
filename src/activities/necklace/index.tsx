/* "Collar de perlas": skip counting. Each necklace has `beads` beads; the hidden beads are written one by one. */
import { useState } from 'react'
import { makeSkipCount } from '@/engine'
import type { ActivityProps, ExerciseOutcome, SkipCountExercise } from '@/types'
import { useActivityHost } from '../host'
import SkipCountView from '../views/SkipCountView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { itemCount, useItems } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import s from './necklace.module.css'

const ADVANCE_OK_MS = 900
const ADVANCE_WRONG_MS = 1200

/** Re-builds a skip-count exercise with the requested number of beads (same step, hidden beads spread out). */
function necklaceOf(ex: SkipCountExercise | undefined, beads: number, pick: () => number): SkipCountExercise | undefined {
  if (!ex) return undefined
  const size = Math.max(4, Math.min(beads, 14))
  const step = ex.step
  const want = Math.max(1, Math.min(ex.hiddenIndexes.length || 3, size - 2))
  const hidden = new Set<number>()
  while (hidden.size < want) hidden.add(1 + Math.floor(pick() * (size - 1)))
  return makeSkipCount(step, 1, size, [...hidden])
}

export default function NecklaceActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const beads = typeof config.params?.beads === 'number' ? (config.params.beads as number) : 10
  const total = itemCount(config, 3)
  const generated = useItems(config, total, host)
  const [items] = useState<SkipCountExercise[]>(() =>
    generated.flatMap((ex) => (ex.kind === 'skip-count' ? [necklaceOf(ex, beads, host.rng)!] : [])),
  )
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
      accent="var(--w3)"
      accentSoft="var(--w3-soft)"
      onExit={onExit}
    >
      <div className={s.string} aria-hidden />
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          <SkipCountView exercise={ex} onAnswered={handle} allowHints />
        </div>
      )}
    </ActivityFrame>
  )
}
