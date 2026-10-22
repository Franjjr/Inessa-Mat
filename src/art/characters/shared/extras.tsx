/* Pose decorations drawn around a character's head: sparkles, sweat, zzz, thought bubble, surprise
   lines and shiver marks. They are rendered OUTSIDE the mirrored group (positions are mirrored in JS)
   so letters such as "Z" and "?" never appear backwards. */
import type { ReactNode } from 'react'
import s from './anim.module.css'
import type { ExtraKind } from './pose'

export interface HeadBox {
  cx: number
  cy: number
  r: number
}

const SPARKLE = 'M0 -10 C1.2 -3 3 -1.2 10 0 C3 1.2 1.2 3 0 10 C-1.2 3 -3 1.2 -10 0 C-3 -1.2 -1.2 -3 0 -10 Z'

export function Sparkle({ x, y, size = 1, color = '#fbbf24', animated, delay = 0 }: { x: number; y: number; size?: number; color?: string; animated: boolean; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d={SPARKLE} fill={color} className={animated ? `${s.self} ${s.twinkle}` : undefined} style={{ animationDelay: `${delay}s` }} />
    </g>
  )
}

function Z({ x, y, k }: { x: number; y: number; k: number }) {
  const w = 9 * k
  return (
    <path
      d={`M${x - w / 2} ${y - w / 2} h${w} l${-w} ${w} h${w}`}
      fill="none"
      stroke="#7c3aed"
      strokeWidth={3.2 * Math.min(1.2, k)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

export function Extras({ kinds, head, flip, animated }: { kinds: ExtraKind[]; head: HeadBox; flip: boolean; animated: boolean }) {
  const { cx, cy, r } = head
  // Mirror helper: positions are authored for a character facing/placed normally.
  const X = (x: number) => (flip ? 200 - x : x)
  const dir = flip ? -1 : 1
  const out: ReactNode[] = []

  if (kinds.includes('sparkles') || kinds.includes('bigSparkles')) {
    const big = kinds.includes('bigSparkles')
    const pts: Array<[number, number, number, string]> = [
      [cx - r - 10, cy - r * 0.55, 0.95, '#fbbf24'],
      [cx + r + 10, cy - r * 0.75, 1.15, '#f472b6'],
      [cx + r * 0.45, cy - r - 16, 0.7, '#a78bfa'],
    ]
    if (big) {
      pts.push([cx - r * 0.55, cy - r - 14, 0.85, '#34d399'], [cx + r + 16, cy + r * 0.25, 0.75, '#60a5fa'], [cx - r - 16, cy + r * 0.35, 0.7, '#f472b6'])
    }
    pts.forEach(([x, y, k, c], i) => {
      out.push(<Sparkle key={`sp${i}`} x={X(x)} y={y} size={k * (big ? 1.1 : 0.95)} color={c} animated={animated} delay={i * 0.27} />)
    })
  }

  if (kinds.includes('sweat')) {
    const x = X(cx + r * 0.88)
    const y = cy - r * 0.5
    out.push(
      <g key="sweat" transform={`translate(${x} ${y}) rotate(${dir * 18})`}>
        <g className={animated ? s.drip : undefined}>
          <path d="M0 -8 C4 -2 7 2 7 5.5 A7 7 0 0 1 -7 5.5 C-7 2 -4 -2 0 -8 Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={-2.2} cy={4.4} r={1.7} fill="#fff" />
        </g>
      </g>,
    )
  }

  if (kinds.includes('zzz')) {
    const x0 = cx + r * 0.72
    const y0 = cy - r * 0.95
    out.push(
      <g key="zzz" className={s.rise}>
        <g className={s.self}><Z x={X(x0)} y={y0} k={0.8} /></g>
        <g className={s.self}><Z x={X(x0 + 12)} y={y0 - 14} k={1} /></g>
        <g className={s.self}><Z x={X(x0 + 26)} y={y0 - 30} k={1.25} /></g>
      </g>,
    )
  }

  if (kinds.includes('think')) {
    const bx = cx + r * 0.95
    const by = cy - r * 0.75
    out.push(
      <g key="think" className={animated ? s.bob : undefined} style={{ transformOrigin: `${X(bx + 18)}px ${by - 24}px` }}>
        <circle cx={X(bx)} cy={by} r={3.2} fill="#ede9fe" stroke="#7c3aed" strokeWidth={2} />
        <circle cx={X(bx + 8)} cy={by - 9} r={4.6} fill="#ede9fe" stroke="#7c3aed" strokeWidth={2} />
        <circle cx={X(bx + 21)} cy={by - 26} r={11.5} fill="#ede9fe" stroke="#7c3aed" strokeWidth={2.4} />
        <path
          d={`M${X(bx + 21) - 3.8} ${by - 29.5} q0 -4.6 3.8 -4.6 q4.2 0 4.2 4 q0 2.8 -3.2 4 q-1 .5 -1 2.4`}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={X(bx + 21) - 0.1} cy={by - 18.6} r={1.6} fill="#7c3aed" />
      </g>,
    )
  }

  if (kinds.includes('surprise')) {
    const y = cy - r - 8
    out.push(
      <g key="surprise" stroke="#f59e0b" strokeWidth={3.4} strokeLinecap="round" className={animated ? s.jolt : undefined}>
        <path d={`M${X(cx - 22)} ${y + 2} l${-dir * 7} ${-9}`} />
        <path d={`M${X(cx)} ${y - 4} l0 ${-11}`} />
        <path d={`M${X(cx + 22)} ${y + 2} l${dir * 7} ${-9}`} />
      </g>,
    )
  }

  if (kinds.includes('shiver')) {
    const y = cy + r * 0.35
    out.push(
      <g key="shiver" stroke="#60a5fa" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.9}>
        <path d={`M${cx - r - 8} ${y - 8} q-5 4 0 8 q5 4 0 8`} />
        <path d={`M${cx - r - 16} ${y - 4} q-4 3 0 6 q4 3 0 6`} />
        <path d={`M${cx + r + 8} ${y - 8} q5 4 0 8 q-5 4 0 8`} />
        <path d={`M${cx + r + 16} ${y - 4} q4 3 0 6 q-4 3 0 6`} />
      </g>,
    )
  }

  return <g>{out}</g>
}
