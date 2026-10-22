/* <LumiHorn crystals={[...8 booleans]} size /> — Lumi's golden spiral horn as a HUD element.
   Each recovered crystal lights its socket in the world colour (--w1..--w8); when all 8 are lit
   the horn shimmers. */
import clsx from 'clsx'
import { useId, useRef } from 'react'
import { spiralHorn } from './shared/horn'
import s from './LumiHorn.module.css'

export interface LumiHornProps {
  /** 8 flags, world 1..8. Missing entries count as not collected. */
  crystals: boolean[]
  /** Rendered height in px. */
  size?: number
  /** Default true. Respects prefers-reduced-motion. */
  animated?: boolean
  className?: string
}

const W = 140
const H = 200
const BASE: [number, number] = [70, 190]
const TIP: [number, number] = [70, 8]
const WIDTH = 118
const TWIST = 0.035
const HORN = spiralHorn(BASE, TIP, WIDTH, 0, 4, TWIST)

/** Socket centres, base (world 1) to tip (world 8): two per ring, side by side, following the
    ring's slant; the two in the narrow tip are stacked. */
const SOCKETS = (
  [
    [0.115, -0.46, 12.5], [0.115 + TWIST, 0.46, 12.5],
    [0.345, -0.46, 10.5], [0.345 + TWIST, 0.46, 10.5],
    [0.565, -0.48, 8.4], [0.565 + TWIST, 0.48, 8.4],
    [0.735, 0, 7.2], [0.865, 0, 6],
  ] as const
).map(([t, s, r]) => {
  const hw = (WIDTH * (1 - t) + 0.8) / 2
  return { x: BASE[0] + s * hw, y: BASE[1] + (TIP[1] - BASE[1]) * t, r }
})

/** The workbook's crystal outline (flat top, pointed bottom), centred, radius 1. */
function gemPath(x: number, y: number, r: number): string {
  const k = r / 45
  const pts: Array<[number, number]> = [[-25, -38], [25, -38], [45, -12], [0, 42], [-45, -12]]
  return 'M' + pts.map(([px, py]) => `${(x + px * k).toFixed(2)} ${(y + py * k).toFixed(2)}`).join(' L') + ' Z'
}

function facets(x: number, y: number, r: number): string {
  const k = r / 45
  const P = (px: number, py: number) => `${(x + px * k).toFixed(2)} ${(y + py * k).toFixed(2)}`
  return `M${P(-45, -12)} L${P(45, -12)} M${P(-25, -38)} L${P(-14, -12)} L${P(0, -38)} L${P(14, -12)} L${P(25, -38)} M${P(-14, -12)} L${P(0, 42)} L${P(14, -12)}`
}

const SPARKLE = 'M0 -10 C1.2 -3 3 -1.2 10 0 C3 1.2 1.2 3 0 10 C-1.2 3 -3 1.2 -10 0 C-3 -1.2 -1.2 -3 0 -10 Z'

export function LumiHorn({ crystals, size = 120, animated = true, className }: LumiHornProps) {
  const uid = useId().replace(/:/g, '')
  const lit = Array.from({ length: 8 }, (_, i) => Boolean(crystals?.[i]))
  const count = lit.filter(Boolean).length
  const all = count === 8
  const clip = `lh-${uid}`
  // Crystals already lit when the HUD mounts appear calmly; ones collected later pop in.
  const litAtMount = useRef(lit)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      height={size}
      width={(size * W) / H}
      className={clsx(s.horn, animated && s.animated, className)}
      role="img"
      aria-label={`Cuerno de Lumi: ${count} de 8 cristales`}
      data-lit={count}
      data-complete={all ? 'true' : 'false'}
    >
      <defs>
        <clipPath id={clip}>
          {HORN.rings.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
      </defs>
      {all && (
        <g className={clsx(s.self, s.glow)}>
          <ellipse cx={70} cy={112} rx={70} ry={92} fill="#fef3c7" opacity={0.7} />
          <ellipse cx={70} cy={118} rx={54} ry={72} fill="#fde68a" opacity={0.6} />
        </g>
      )}
      {HORN.rings.map((d, i) => (
        <g key={i}>
          <path d={d} fill={all ? '#fcd34d' : '#fde68a'} stroke="#b45309" strokeWidth={5} strokeLinejoin="round" />
          <path d={HORN.highlights[i].d} stroke="#fef9c3" strokeWidth={HORN.highlights[i].w * 1.3} strokeLinecap="round" />
        </g>
      ))}
      {SOCKETS.map((p, i) => {
        const on = lit[i]
        const color = `var(--w${i + 1})`
        const bezel = (
          <circle cx={p.x} cy={p.y + p.r * 0.06} r={p.r * 1.22} fill={on ? '#fffbeb' : '#f6d77c'} stroke="#b45309" strokeWidth={Math.max(1.6, p.r * 0.2)} />
        )
        return on ? (
          <g key={`on${i}`} data-socket={i + 1} data-lit="true">
            {bezel}
            <g className={clsx(s.self, !litAtMount.current[i] && s.gemIn)}>
              <path d={gemPath(p.x, p.y, p.r * 0.98)} style={{ fill: color }} stroke="#ffffff" strokeWidth={Math.max(1.2, p.r * 0.14)} strokeLinejoin="round" />
              <path d={facets(p.x, p.y, p.r * 0.98)} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={Math.max(0.8, p.r * 0.08)} strokeLinejoin="round" />
              <circle cx={p.x - p.r * 0.32} cy={p.y - p.r * 0.42} r={p.r * 0.16} fill="#ffffff" />
            </g>
          </g>
        ) : (
          <g key={`off${i}`} data-socket={i + 1} data-lit="false">
            {bezel}
            <path d={gemPath(p.x, p.y, p.r * 0.8)} fill="#fde68a" stroke="#d97706" strokeWidth={Math.max(1, p.r * 0.12)} strokeLinejoin="round" strokeDasharray={`${p.r * 0.35} ${p.r * 0.25}`} />
          </g>
        )
      })}
      {all && animated && (
        <g clipPath={`url(#${clip})`}>
          <rect className={s.shimmer} x={-10} y={-20} width={26} height={260} fill="#ffffff" opacity={0.55} transform="rotate(18 70 100)" />
        </g>
      )}
      {all && (
        <g>
          {[[22, 40, 0.9, '#f472b6'], [118, 64, 1.1, '#a78bfa'], [98, 14, 0.7, '#34d399'], [20, 120, 0.7, '#60a5fa']].map(([x, y, k, c], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
              <path d={SPARKLE} fill={String(c)} className={clsx(s.self, s.twinkle)} style={{ animationDelay: `${i * 0.35}s` }} />
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
