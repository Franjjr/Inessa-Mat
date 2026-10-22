/* A "try it" step: one mini exercise generated from the step's selector. The child answers through ExerciseView;
   a correct answer unlocks "Siguiente". After a second miss the lesson moves on anyway: errors are clues, never a wall. */
import { useEffect, useMemo, useState } from 'react'
import { ExerciseView, useActivityHost } from '@/activities'
import { createRng, generate } from '@/engine'
import type { ExerciseOutcome, SkillSelector } from '@/types'
import { Button } from '@/ui'
import s from './TrySlot.module.css'

/** Misses allowed before the lesson continues on its own. */
export const MAX_MISSES = 2

type Status = 'idle' | 'correct' | 'missed' | 'gaveUp'

interface Props {
  selector: SkillSelector
  /** Stable text that seeds the generated exercise (lesson id + step index). */
  seedKey: string
  /** Called once when the step is settled: solved, or given up after MAX_MISSES misses. */
  onSettled: (solved: boolean) => void
}

/** FNV-1a, so the same lesson step always starts with the same exercise. */
function seedOf(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export default function TrySlot({ selector, seedKey, onSettled }: Props) {
  const host = useActivityHost()
  const [attempt, setAttempt] = useState(0)
  const [misses, setMisses] = useState(0)
  const [status, setStatus] = useState<Status>('idle')

  const exercise = useMemo(
    () => generate(selector, 1, { rng: createRng(seedOf(`${seedKey}:${attempt}`)) })[0],
    [selector, seedKey, attempt],
  )

  // No exercise could be generated for this selector: nothing to check, so the step is settled at once.
  useEffect(() => {
    if (!exercise) onSettled(true)
  }, [exercise, onSettled])

  if (!exercise) return <div className={s.wrap} />

  const answered = (outcome: ExerciseOutcome) => {
    const { check } = outcome
    host.reportAttempt({
      exercise,
      check,
      ms: outcome.ms,
      inputMode: outcome.inputMode,
      hintsUsed: outcome.hintsUsed,
      recognitionFixes: outcome.recognitionFixes,
    })
    if (check.correct) {
      host.react('correct')
      setStatus('correct')
      onSettled(true)
      return
    }
    host.react('wrong', { errorType: check.errorType })
    const nextMisses = misses + 1
    setMisses(nextMisses)
    if (nextMisses >= MAX_MISSES) {
      setStatus('gaveUp')
      onSettled(false)
    } else {
      setStatus('missed')
    }
  }

  const retry = () => {
    setAttempt((a) => a + 1)
    setStatus('idle')
  }

  return (
    <div className={s.wrap} data-status={status}>
      <div className={s.exercise}>
        <ExerciseView key={`${attempt}`} exercise={exercise} onAnswered={answered} guided allowHints showFeedback />
      </div>
      <div className={s.footer} role="status" aria-live="polite">
        {status === 'correct' && <p className={s.good}>{host.t('¡Muy bien, {child}!')}</p>}
        {status === 'missed' && (
          <div className={s.retry}>
            <p className={s.hint}>{host.t('¡Casi! Mira el truco y prueba otra vez.')}</p>
            <Button variant="secondary" onClick={retry}>Otra vez</Button>
          </div>
        )}
        {status === 'gaveUp' && <p className={s.hint}>{host.t('No pasa nada, {child}. Seguimos con la lección.')}</p>}
      </div>
    </div>
  )
}
