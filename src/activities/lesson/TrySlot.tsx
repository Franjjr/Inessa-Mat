/* A "try it" step: one mini exercise generated from the step's selector. The child answers through ExerciseView;
   a correct answer unlocks "Siguiente". The slot owns the feedback (showFeedback off), so the child never sees two
   "Siguiente" buttons. After a second miss the lesson moves on anyway: errors are clues, never a wall. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ExerciseView, useActivityHost } from '@/activities'
import { createRng, generate } from '@/engine'
import type { ExerciseOutcome, SkillSelector } from '@/types'
import { Button } from '@/ui'
import s from './TrySlot.module.css'

/** Misses allowed before the lesson continues on its own. */
export const MAX_MISSES = 2

/** Smallest scale the exercise is shrunk to; below this the answer controls would be too small to tap (56px rule). */
export const MIN_FIT_SCALE = 0.8

type Status = 'idle' | 'correct' | 'missed' | 'gaveUp'

interface Props {
  selector: SkillSelector
  /** Stable text that seeds the generated exercise (lesson id + step index). */
  seedKey: string
  /** Called once when the step is settled: solved, or given up after MAX_MISSES misses. */
  onSettled: (solved: boolean) => void
  /** Set when the step was already settled (the child came back to it): shows the outcome, offers no exercise. */
  settled?: boolean
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

/** Scale that fits the exercise (natural height) into the space left next to the footer. Never above 1. */
export function fitScale(available: number, natural: number): number {
  if (natural <= 0 || available >= natural) return 1
  return Math.max(MIN_FIT_SCALE, available / natural)
}

export default function TrySlot({ selector, seedKey, onSettled, settled }: Props) {
  const host = useActivityHost()
  const [attempt, setAttempt] = useState(0)
  const [misses, setMisses] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 1, height: 0 })

  const exercise = useMemo(
    () => generate(selector, 1, { rng: createRng(seedOf(`${seedKey}:${attempt}`)) })[0],
    [selector, seedKey, attempt],
  )

  // No exercise could be generated for this selector: nothing to check, so the step is settled at once.
  useEffect(() => {
    if (!exercise) onSettled(true)
  }, [exercise, onSettled])

  // The exercise is designed for a full screen; on a lesson board it is shrunk to fit, so nothing is clipped.
  const live = settled === undefined && !!exercise
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!live || !wrap || !inner) return
    const measure = () => {
      const cs = getComputedStyle(wrap)
      const gap = parseFloat(cs.rowGap) || 0
      const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      const footer = footerRef.current?.offsetHeight ?? 0
      const available = wrap.clientHeight - padding - footer - gap
      const natural = inner.offsetHeight
      setFit({ scale: fitScale(available, natural), height: natural })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [live, exercise])

  if (settled !== undefined) {
    return (
      <div className={s.wrap} data-status={settled ? 'correct' : 'gaveUp'}>
        <div className={s.footer} role="status">
          {settled
            ? <p className={s.good}>{host.t('¡Muy bien, {child}!')}</p>
            : <p className={s.hint}>{host.t('No pasa nada, {child}. Seguimos con la lección.')}</p>}
        </div>
      </div>
    )
  }

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
    <div ref={wrapRef} className={s.wrap} data-status={status}>
      <div className={s.fit} style={{ height: fit.height ? fit.height * fit.scale : undefined }}>
        <div ref={innerRef} className={s.exercise} style={{ transform: `scale(${fit.scale})` }}>
          <ExerciseView key={`${attempt}`} exercise={exercise} onAnswered={answered} guided allowHints showFeedback={false} />
        </div>
      </div>
      <div ref={footerRef} className={s.footer} role="status" aria-live="polite">
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
