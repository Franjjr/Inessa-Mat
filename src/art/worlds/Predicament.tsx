/* Wraps the companion in its world predicament (bubble, net, ice, fog, vines, cage, ink, stuck).
   `rescue` 0..1 progressively frees it (smooth transitions between steps). When rescue reaches 1 a release
   animation plays (pieces fly away, burst of stars and hearts, the companion hops), then only the companion
   remains. Mounting directly at rescue = 1 also plays the release once (rescue scenes). */
import clsx from 'clsx'
import { useEffect, useId, useState } from 'react'
import type { PredicamentProps } from '@/types'
import { KINDS, ReleaseBurst } from './predicaments'
import s from './Predicament.module.css'
import { useReducedMotion } from './useReducedMotion'

export const RELEASE_MS = 1300

type Phase = 'trapped' | 'releasing' | 'free'

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0)

function usePhase(done: boolean, reduced: boolean): Phase {
  const [phase, setPhase] = useState<Phase>(done ? 'releasing' : 'trapped')
  useEffect(() => {
    if (!done) {
      setPhase('trapped')
      return
    }
    setPhase('releasing')
    const id = setTimeout(() => setPhase('free'), reduced ? 350 : RELEASE_MS)
    return () => clearTimeout(id)
  }, [done, reduced])
  return phase
}

export function Predicament({ kind, rescue = 0, children }: PredicamentProps) {
  const r = clamp01(rescue)
  const reduced = useReducedMotion()
  const phase = usePhase(r >= 1, reduced)
  const raw = useId()
  const prefix = 'pr' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const id = (name: string) => `${prefix}-${name}`
  const art = kind !== 'none' ? KINDS[kind] : undefined

  // One stable tree for every phase, so the companion never remounts (its own idle animation keeps running).
  const active = art && phase !== 'free' ? art : undefined
  const releasing = phase === 'releasing'
  const p = { r: releasing ? 1 : r, releasing, id }
  const stage = active?.stage?.(p)
  const comp = active?.companion?.(p)

  return (
    <span className={s.root} data-predicament={kind} data-phase={art ? phase : 'none'} data-rescue={r.toFixed(2)}>
      <span className={clsx(s.stage, stage?.className)} style={stage?.style}>
        {active?.back && (
          <svg className={clsx(s.layer, s.back)} viewBox="-28 -28 256 256" aria-hidden="true" focusable="false" data-layer="back">
            {active.back(p)}
          </svg>
        )}
        <span className={clsx(s.companion, comp?.className)} style={comp?.style}>
          {children}
        </span>
        {active?.front && (
          <svg className={clsx(s.layer, s.front)} viewBox="-28 -28 256 256" aria-hidden="true" focusable="false" data-layer="front">
            {active.front(p)}
            {releasing && <ReleaseBurst colors={active.burst} />}
          </svg>
        )}
      </span>
    </span>
  )
}
