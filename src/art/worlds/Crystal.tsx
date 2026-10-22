/* Magic crystal (one per world). States: locked (grey + padlock), empty (dashed socket still to win),
   glow (just earned: full colour, pulsing halo, twinkles), collected (full colour, calm). */
import clsx from 'clsx'
import { useId } from 'react'
import { derive } from './color'
import { SparklePath } from './shapes'
import s from './items.module.css'

export type CrystalState = 'locked' | 'empty' | 'glow' | 'collected'

export interface CrystalProps {
  color?: string
  state?: CrystalState
  size?: number
  /** Accessible name (e.g. "Cristal verde"). Without it the crystal is decorative. */
  label?: string
  className?: string
}

const OUTER = '25,12 75,12 94,36 50,92 6,36'
const LOCKED = { base: '#cbd5e1', pale: '#f1f5f9', soft: '#e2e8f0', dark: '#94a3b8', deep: '#64748b' }

export function Crystal({ color = '#7c3aed', state = 'empty', size = 48, label, className }: CrystalProps) {
  const raw = useId()
  const gid = 'cr' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const d = state === 'locked' ? LOCKED : derive(color)
  const lit = state === 'glow' || state === 'collected'
  const empty = state === 'empty'
  const f = (c: string) => ({ style: { fill: c } })
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg className={clsx(s.svg, className)} width={size} height={size} viewBox="0 0 100 100" data-state={state} {...a11y}>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0%" style={{ stopColor: d.soft, stopOpacity: 0.95 }} />
          <stop offset="55%" style={{ stopColor: d.soft, stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: d.soft, stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {lit && <circle cx={50} cy={50} r={50} fill={`url(#${gid})`} className={state === 'glow' ? s.halo : undefined} opacity={state === 'glow' ? 1 : 0.6} />}
      <g className={state === 'glow' ? s.gemFloat : undefined}>
        {empty ? (
          <>
            <polygon points={OUTER} style={{ fill: d.pale, stroke: d.base, opacity: 0.9 }} strokeWidth={4} strokeLinejoin="round" strokeDasharray="7 6" />
            <g fill="none" style={{ stroke: d.soft }} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
              <polyline points="6,36 94,36" />
              <polyline points="25,12 35,36 50,12 65,36 75,12" />
              <polyline points="35,36 50,92 65,36" />
            </g>
          </>
        ) : (
          <>
            <polygon points="25,12 35,36 6,36" {...f(d.soft)} />
            <polygon points="25,12 50,12 35,36" {...f(d.pale)} />
            <polygon points="50,12 65,36 35,36" {...f(d.soft)} />
            <polygon points="50,12 75,12 65,36" {...f(d.pale)} />
            <polygon points="75,12 94,36 65,36" {...f(d.base)} />
            <polygon points="6,36 35,36 50,92" {...f(d.soft)} />
            <polygon points="35,36 65,36 50,92" {...f(d.base)} />
            <polygon points="65,36 94,36 50,92" {...f(d.dark)} />
            <g fill="none" style={{ stroke: d.dark }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.8}>
              <polyline points="6,36 94,36" />
              <polyline points="25,12 35,36 50,12 65,36 75,12" />
              <polyline points="35,36 50,92 65,36" />
            </g>
            <polygon points={OUTER} fill="none" style={{ stroke: d.deep }} strokeWidth={4.5} strokeLinejoin="round" />
            <path d="M 16 38 L 34 62" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
            <path d="M 30 17 L 40 17" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
          </>
        )}
      </g>
      {lit && <SparklePath x={78} y={16} r={9} fill="#ffffff" />}
      {state === 'glow' && (
        <>
          <g className={s.twinkle}><SparklePath x={14} y={70} r={7} fill="#fff7d6" /></g>
          <g className={s.twinkle} style={{ animationDelay: '0.6s' }}><SparklePath x={88} y={64} r={6} fill="#ffffff" /></g>
          <g className={s.twinkle} style={{ animationDelay: '1.1s' }}><SparklePath x={50} y={4} r={6} fill="#fff7d6" /></g>
        </>
      )}
      {state === 'locked' && (
        <g transform="translate(64 60)">
          <path d="M 8 14 L 8 8 Q 8 0 16 0 Q 24 0 24 8 L 24 14" fill="none" stroke="#64748b" strokeWidth={4.5} strokeLinecap="round" />
          <rect x={2} y={12} width={28} height={22} rx={6} fill="#a78bfa" stroke="#4c1d95" strokeWidth={3.5} />
          <circle cx={16} cy={22} r={3.2} fill="#4c1d95" />
        </g>
      )}
    </svg>
  )
}
