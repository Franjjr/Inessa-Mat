/* World-map node medallions: story (book), lesson (light bulb of Lumi's tricks), activity (puzzle piece),
   guardian (shield with crown), review (star). done = gold ring + check badge; locked = grey + padlock. */
import clsx from 'clsx'
import type { NodeKind } from '@/types'
import { derive } from './color'
import { starPoints } from './shapes'
import s from './items.module.css'

export interface NodeIconProps {
  kind: NodeKind
  size?: number
  done?: boolean
  locked?: boolean
  /** World colour (hex or token var such as 'var(--w1)'). */
  color?: string
  /** Accessible name; without it the icon is decorative (the map button carries the label). */
  label?: string
  className?: string
}

const CREAM = '#fffbf2'

function Glyph({ kind, ink }: { kind: NodeKind; ink: string }) {
  const st = { stroke: ink }
  switch (kind) {
    case 'story':
      return (
        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth={4} style={st}>
          <path d="M 50 40 Q 38 32 24 34 L 24 68 Q 38 66 50 74 Z" fill={CREAM} />
          <path d="M 50 40 Q 62 32 76 34 L 76 68 Q 62 66 50 74 Z" fill={CREAM} />
          <path d="M 31 44 Q 38 43 44 46 M 31 52 Q 38 51 44 54 M 56 46 Q 62 43 69 44" fill="none" strokeWidth={2.6} opacity={0.6} />
          <polygon points={starPoints(62, 56, 7, 3.2)} fill="#fbbf24" strokeWidth={2} />
        </g>
      )
    case 'lesson':
      return (
        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth={4} style={st}>
          <path d="M 50 26 C 36 26 30 36 30 45 C 30 54 38 58 40 66 L 60 66 C 62 58 70 54 70 45 C 70 36 64 26 50 26 Z" fill="#fde68a" />
          <path d="M 40 66 L 60 66 L 58 74 L 42 74 Z" fill={CREAM} />
          <path d="M 44 79 L 56 79" fill="none" />
          <path d="M 40 40 Q 42 33 49 32" fill="none" stroke="#ffffff" strokeWidth={4} />
          <path d="M 22 30 L 27 34 M 78 30 L 73 34 M 50 14 L 50 19" fill="none" strokeWidth={3.5} />
        </g>
      )
    case 'activity':
      return (
        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth={4} style={st}>
          <path
            d="M 28 36 L 42 36 Q 40 24 50 24 Q 60 24 58 36 L 72 36 L 72 50 Q 84 48 84 58 Q 84 68 72 66 L 72 78 L 28 78 L 28 64 Q 38 66 38 57 Q 38 48 28 50 Z"
            fill={CREAM}
          />
          <circle cx={52} cy={58} r={4} fill="#f9a8d4" strokeWidth={2} />
        </g>
      )
    case 'guardian':
      return (
        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth={4} style={st}>
          <path d="M 50 24 L 74 32 L 72 54 Q 68 70 50 80 Q 32 70 28 54 L 26 32 Z" fill={CREAM} />
          <path d="M 38 56 L 38 44 L 44 50 L 50 40 L 56 50 L 62 44 L 62 56 Z" fill="#fbbf24" strokeWidth={3} />
          <path d="M 38 62 L 62 62" fill="none" strokeWidth={3} />
        </g>
      )
    case 'review':
    default:
      return (
        <g strokeLinejoin="round" style={st}>
          <polygon points={starPoints(50, 53, 27, 12.5)} fill="#fde68a" strokeWidth={4} />
          <path d="M 41 44 L 45 42" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
          <path d="M 24 74 Q 16 60 22 46" fill="none" strokeWidth={3.5} strokeLinecap="round" />
          <path d="M 18 70 L 24 75 L 30 70" fill="none" strokeWidth={3.5} strokeLinecap="round" />
        </g>
      )
  }
}

export function NodeIcon({ kind, size = 56, done = false, locked = false, color = '#7c3aed', label, className }: NodeIconProps) {
  const d = locked ? { base: '#d4d4dc', pale: '#f4f4f7', soft: '#e6e6ec', dark: '#a1a1b0', deep: '#7c7c8f' } : derive(color)
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg className={clsx(s.svg, className)} width={size} height={size} viewBox="0 0 100 100" data-kind={kind} data-done={done ? 'true' : 'false'} data-locked={locked ? 'true' : 'false'} {...a11y}>
      <ellipse cx={50} cy={94} rx={30} ry={5} fill="#2e1a47" opacity={0.12} />
      {done && !locked && <circle cx={50} cy={50} r={47} fill="#fde68a" stroke="#d97706" strokeWidth={3.5} />}
      <circle cx={50} cy={50} r={done && !locked ? 40 : 44} style={{ fill: d.base, stroke: d.deep }} strokeWidth={4.5} />
      <circle cx={50} cy={50} r={done && !locked ? 32 : 35} fill="none" style={{ stroke: d.soft }} strokeWidth={3} opacity={0.7} />
      <path d={done && !locked ? 'M 20 38 A 32 32 0 0 1 38 18' : 'M 16 38 A 36 36 0 0 1 36 15'} fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
      <g opacity={locked ? 0.55 : 1} transform={done && !locked ? 'translate(50 50) scale(0.9) translate(-50 -50)' : undefined}>
        <Glyph kind={kind} ink={locked ? '#6b6b80' : d.deep} />
      </g>
      {done && !locked && (
        <g>
          <circle cx={80} cy={78} r={14} fill="#22c55e" stroke="#14532d" strokeWidth={3.5} />
          <path d="M 73 78 L 78 83 L 87 73" fill="none" stroke="#ffffff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {locked && (
        <g transform="translate(66 62)">
          <path d="M 8 14 L 8 8 Q 8 0 15 0 Q 22 0 22 8 L 22 14" fill="none" stroke="#5b4a75" strokeWidth={4.5} strokeLinecap="round" />
          <rect x={1} y={12} width={28} height={23} rx={6} fill="#c4b5fd" stroke="#4c1d95" strokeWidth={3.5} />
          <circle cx={15} cy={22} r={3.2} fill="#4c1d95" />
          <rect x={13.6} y={23} width={2.8} height={6} rx={1.4} fill="#4c1d95" />
        </g>
      )}
    </svg>
  )
}
