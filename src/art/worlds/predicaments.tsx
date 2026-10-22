/* Art for every PredicamentKind, drawn in the companion's 0..200 box (overlay viewBox -28 -28 256 256).
   Each kind draws `back` (behind the companion) and `front` (over it) for a rescue progress r (0..1), and its
   release variant (pieces fly / pop / drop away) while `releasing`. */
import clsx from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
import type { PredicamentKind } from '@/types'
import { shade } from './color'
import { seeded } from './kit'
import { starPoints } from './shapes'
import s from './Predicament.module.css'

export interface KindProps {
  r: number
  releasing: boolean
  id: (name: string) => string
}

export interface KindArt {
  back?: (p: KindProps) => ReactNode
  front?: (p: KindProps) => ReactNode
  /** Companion wrapper while trapped / releasing (filters, squeeze, struggle). */
  companion?: (p: KindProps) => { className?: string; style?: CSSProperties }
  /** Wrapper of companion + overlays while trapped (float, hang). */
  stage?: (p: KindProps) => { className?: string; style?: CSSProperties }
  /** Burst colours at the release. */
  burst: string[]
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const vars = (o: Record<string, string | number>) => o as CSSProperties

/* ------------------------------------------------------------------ shared burst ---- */

function heartPath(cx: number, cy: number, k: number) {
  return `M ${cx} ${cy + 6 * k} C ${cx - 10 * k} ${cy - 2 * k} ${cx - 7 * k} ${cy - 10 * k} ${cx} ${cy - 5 * k} C ${cx + 7 * k} ${cy - 10 * k} ${cx + 10 * k} ${cy - 2 * k} ${cx} ${cy + 6 * k} Z`
}

export function ReleaseBurst({ colors }: { colors: string[] }) {
  const n = 12
  return (
    <g data-part="burst">
      <circle className={clsx(s.fb, s.ring)} cx={100} cy={110} r={110} fill="none" stroke={colors[0]} strokeWidth={8} />
      <circle className={clsx(s.fb, s.ring)} cx={100} cy={110} r={80} fill="none" stroke="#ffffff" strokeWidth={6} style={{ animationDelay: '120ms' }} />
      {Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        const dist = 120 + (i % 3) * 22
        const c = colors[i % colors.length]
        const style = vars({ '--tx': `${Math.cos(ang) * dist}px`, '--ty': `${Math.sin(ang) * dist}px`, animationDelay: `${(i % 4) * 40}ms` })
        return (
          <g key={i} className={s.burst} style={style}>
            {i % 3 === 0
              ? <path d={heartPath(100, 110, 1.4)} fill={c} stroke={shade(c, 0.25)} strokeWidth={1.5} />
              : <polygon points={starPoints(100, 110, i % 2 ? 11 : 8)} fill={c} stroke={shade(c, 0.25)} strokeWidth={1.5} strokeLinejoin="round" />}
          </g>
        )
      })}
    </g>
  )
}

/* ------------------------------------------------------------------ bubble ---- */

const bubble: KindArt = {
  burst: ['#7dd3fc', '#f9a8d4', '#c4b5fd', '#fde68a'],
  stage: ({ r, releasing }) => ({
    className: releasing ? undefined : s.float,
    style: vars({ translate: releasing ? '0 0' : `0 ${-(1 - r) * 12}%`, '--amp': `${-(1 - r) * 6 - 1.5}%`, transition: 'translate 900ms ease' }),
  }),
  companion: ({ releasing }) => ({ className: releasing ? s.hop : undefined }),
  front: ({ r, releasing }) => {
    const R = 120 - 12 * r
    return (
      <g>
        <g className={clsx(s.fb, releasing ? s.popOut : s.wobble)}>
          <circle cx={100} cy={102} r={R} fill="#e0f2fe" fillOpacity={0.2} stroke="#7dd3fc" strokeWidth={4} strokeOpacity={0.9} />
          <path d={`M ${100 - R * 0.72} ${102 - R * 0.38} A ${R * 0.82} ${R * 0.82} 0 0 1 ${100 - R * 0.2} ${102 - R * 0.8}`} fill="none" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
          <circle cx={100 - R * 0.46} cy={102 - R * 0.62} r={6} fill="#ffffff" opacity={0.9} />
          <path d={`M ${100 + R * 0.86} ${102 + R * 0.2} A ${R * 0.88} ${R * 0.88} 0 0 1 ${100 + R * 0.3} ${102 + R * 0.82}`} fill="none" stroke="#f9a8d4" strokeWidth={5} strokeLinecap="round" opacity={0.65} />
          <path d={`M ${100 + R * 0.92} ${102 - R * 0.1} A ${R * 0.93} ${R * 0.93} 0 0 1 ${100 + R * 0.8} ${102 + R * 0.4}`} fill="none" stroke="#c4b5fd" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </g>
        {releasing && Array.from({ length: 8 }, (_, i) => {
          const ang = (i / 8) * Math.PI * 2
          return <circle key={i} className={s.fly} cx={100 + Math.cos(ang) * R} cy={102 + Math.sin(ang) * R} r={6} fill="#bae6fd" stroke="#7dd3fc" strokeWidth={2} style={vars({ '--tx': `${Math.cos(ang) * 40}px`, '--ty': `${Math.sin(ang) * 40 + 30}px` })} />
        })}
      </g>
    )
  },
}

/* ------------------------------------------------------------------ net ---- */

const SACK = 'M 100 -8 C 36 8 2 70 6 142 C 8 196 50 216 100 216 C 150 216 192 196 194 142 C 198 70 164 8 100 -8 Z'
const NET_LINES = (() => {
  const lines: { d: string; k: number }[] = []
  const rnd = seeded(8)
  for (let c = -236; c <= 220; c += 34) lines.push({ d: `M ${c} -20 L ${c + 240} 220`, k: rnd() })
  for (let c = -16; c <= 440; c += 34) lines.push({ d: `M ${c} -20 L ${c - 240} 220`, k: rnd() })
  return lines
})()

const net: KindArt = {
  burst: ['#fbbf24', '#f9a8d4', '#86efac', '#c4b5fd'],
  stage: ({ r, releasing }) => ({ className: releasing ? undefined : s.hang, style: vars({ '--sw': `${(1 - r) * 3.5}deg` }) }),
  companion: ({ r, releasing }) => ({ className: releasing ? s.hop : r > 0.25 ? s.struggle : undefined }),
  back: ({ r, releasing, id }) => (
    <g className={clsx(s.smooth, releasing && s.dropOut)} style={releasing ? vars({ '--ty': '150px', '--rot': '6deg' }) : { transform: `translateY(${r * 28}px)` }}>
      <clipPath id={id('sack')}><path d={SACK} /></clipPath>
      <g clipPath={`url(#${id('sack')})`} stroke="#8a5a2b" strokeWidth={3} opacity={0.45}>
        {NET_LINES.filter((_, i) => i % 2 === 0).map((l, i) => <path key={i} d={l.d} className={s.smooth} style={{ opacity: l.k < r * 0.9 ? 0 : 1 }} />)}
      </g>
    </g>
  ),
  front: ({ r, releasing, id }) => (
    <g className={clsx(s.smooth, releasing && s.dropOut)} style={releasing ? vars({ '--ty': '160px', '--rot': '-5deg' }) : { transform: `translateY(${r * 28}px)` }}>
      <path d="M 100 -8 L 100 -70" stroke="#7c4a1e" strokeWidth={7} strokeLinecap="round" />
      <path d="M 100 -8 L 100 -70" stroke="#d6a064" strokeWidth={3.5} strokeLinecap="round" />
      <clipPath id={id('sackF')}><path d={SACK} /></clipPath>
      <g clipPath={`url(#${id('sackF')})`}>
        {NET_LINES.map((l, i) => (
          <g key={i} className={s.smooth} style={{ opacity: l.k < r * 0.9 ? 0 : 1 }}>
            <path d={l.d} stroke="#7c4a1e" strokeWidth={5.5} strokeLinecap="round" />
            <path d={l.d} stroke="#e7b47a" strokeWidth={2.6} strokeLinecap="round" />
          </g>
        ))}
      </g>
      <path d={SACK} fill="none" stroke="#7c4a1e" strokeWidth={8} />
      <path d={SACK} fill="none" stroke="#d6a064" strokeWidth={4} />
      <ellipse cx={100} cy={-6} rx={16} ry={11} fill="#c98a4b" stroke="#7c4a1e" strokeWidth={3.5} />
      <path d="M 90 -4 Q 100 4 110 -4" fill="none" stroke="#7c4a1e" strokeWidth={2.5} />
    </g>
  ),
}

/* ------------------------------------------------------------------ ice ---- */

const ICE_CRACKS = [
  'M -2 60 L 30 72 L 44 64 L 70 86',
  'M 204 40 L 176 58 L 182 76 L 150 92',
  'M 120 6 L 112 34 L 128 46 L 116 74',
  'M 206 170 L 172 160 L 160 176 L 130 168',
  'M 0 176 L 30 162 L 36 178 L 66 170 L 84 150',
]
const ICE_PTS: [number, number][] = [[-6, 4], [100, 4], [206, 4], [206, 110], [206, 208], [100, 208], [-6, 208], [-6, 110]]

const ice: KindArt = {
  burst: ['#67e8f9', '#ffffff', '#a5f3fc', '#c4b5fd'],
  companion: ({ r, releasing }) => ({
    className: releasing ? s.hop : r > 0.3 ? s.struggle : undefined,
    style: { filter: releasing ? 'none' : `saturate(${0.55 + 0.45 * r}) brightness(${1.06 - 0.06 * r})` },
  }),
  back: ({ r }) => (
    <g>
      <ellipse cx={100} cy={210} rx={70 + 60 * r} ry={10 + 5 * r} fill="#a5f3fc" opacity={0.25 + 0.4 * r} className={s.smooth} />
    </g>
  ),
  front: ({ r, releasing }) => {
    if (releasing) {
      return (
        <g>
          {ICE_PTS.map((p, i) => {
            const q = ICE_PTS[(i + 1) % ICE_PTS.length]
            const cx = (100 + p[0] + q[0]) / 3
            const cy = (110 + p[1] + q[1]) / 3
            const dx = cx - 100
            const dy = cy - 110
            const len = Math.hypot(dx, dy) || 1
            return (
              <polygon
                key={i}
                className={clsx(s.fb, s.fly)}
                points={`100,110 ${p[0]},${p[1]} ${q[0]},${q[1]}`}
                fill="#cffafe"
                fillOpacity={0.75}
                stroke="#67e8f9"
                strokeWidth={4}
                strokeLinejoin="round"
                style={vars({ '--tx': `${(dx / len) * 130}px`, '--ty': `${(dy / len) * 130 + 40}px`, '--rot': `${i % 2 ? 50 : -60}deg`, '--sc': 0.6 })}
              />
            )
          })}
        </g>
      )
    }
    return (
      <g className={clsx(s.fbBottom, s.smooth)} style={{ transform: `scale(${1 - r * 0.05}, ${1 - r * 0.28})` }}>
        <rect x={-6} y={4} width={212} height={204} rx={26} fill="#cffafe" fillOpacity={0.55} stroke="#22d3ee" strokeWidth={5} />
        <rect x={6} y={16} width={188} height={180} rx={18} fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.55} />
        <path d="M 22 40 L 52 22 M 20 70 L 76 34 M 168 182 L 186 168" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
        <path d="M -4 22 Q 20 -2 50 8 Q 70 -4 100 8 Q 130 -4 156 8 Q 186 -2 204 22 L 204 30 Q 180 16 160 24 Q 130 12 100 22 Q 70 12 40 24 Q 16 16 -4 30 Z" fill="#ffffff" stroke="#a5f3fc" strokeWidth={2.5} strokeLinejoin="round" />
        {ICE_CRACKS.map((d, i) => {
          const p = clamp01((r - i * 0.13) / 0.32)
          return (
            <g key={i}>
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} className={s.smooth} fill="none" stroke="#0891b2" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} className={s.smooth} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )
        })}
        {r > 0.05 && [36, 100, 164].map((x, i) => (
          <path key={x} className={s.drip} style={{ animationDelay: `${i * 0.7}s`, opacity: clamp01(r * 2) }} d={`M ${x} 204 Q ${x - 6} 214 ${x} 218 Q ${x + 6} 214 ${x} 204 Z`} fill="#67e8f9" />
        ))}
      </g>
    )
  },
}

/* ------------------------------------------------------------------ fog ---- */

function spiral(cx: number, cy: number, rad: number) {
  const pts: string[] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const a = t * Math.PI * 4
    const rr = rad * (0.15 + 0.85 * t)
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return 'M ' + pts.join(' L ')
}

const FOG_PUFFS: [number, number, number, number, number][] = [[-6, 150, 52, 40, -1], [206, 140, 50, 38, 1], [40, 40, 50, 36, -1], [170, 50, 46, 34, 1], [100, 206, 80, 30, 0], [100, 0, 60, 28, 0]]

const fog: KindArt = {
  burst: ['#f9a8d4', '#fde68a', '#86efac', '#93c5fd', '#c4b5fd', '#fdba74'],
  companion: ({ r, releasing }) => ({
    className: releasing ? s.hop : undefined,
    style: { filter: releasing ? 'none' : `grayscale(${1 - r}) brightness(${1 + (1 - r) * 0.06})` },
  }),
  back: ({ r, releasing }) => (
    <g className={clsx(s.fb, s.smooth, releasing && s.popOut)} style={{ opacity: (1 - r) * 0.9 }}>
      {[[30, 120, 70], [100, 80, 92], [170, 120, 70], [100, 160, 80]].map(([x, y, rad], i) => <circle key={i} cx={x} cy={y} r={rad} fill="#d7dae3" />)}
    </g>
  ),
  front: ({ r, releasing, id }) => (
    <g className={clsx(s.fb, releasing && s.popOut)}>
      <defs>
        <radialGradient id={id('wisp')}>
          <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.95} />
          <stop offset="60%" stopColor="#d1d5db" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#d1d5db" stopOpacity={0} />
        </radialGradient>
      </defs>
      {FOG_PUFFS.map(([x, y, rx, ry, dir], i) => (
        <g key={i} className={s.smooth} style={{ transform: `translate(${dir * r * 40}px, ${(y > 100 ? 1 : -1) * r * 16}px)`, opacity: (1 - r) * 0.9 }}>
          <ellipse className={clsx(s.fb, s.puffDrift)} style={{ animationDelay: `${-i * 1.1}s` }} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id('wisp')})`} />
        </g>
      ))}
      <g className={s.smooth} style={{ opacity: (1 - r) * 0.8 }}>
        <g className={clsx(s.fb, s.swirl)}><path d={spiral(36, 70, 26)} fill="none" stroke="#9ca3af" strokeWidth={4} strokeLinecap="round" /></g>
        <g className={clsx(s.fb, s.swirl)} style={{ animationDirection: 'reverse' }}><path d={spiral(168, 120, 22)} fill="none" stroke="#9ca3af" strokeWidth={4} strokeLinecap="round" /></g>
        <g className={clsx(s.fb, s.swirl)}><path d={spiral(110, 190, 18)} fill="none" stroke="#b6bac6" strokeWidth={3.5} strokeLinecap="round" /></g>
      </g>
    </g>
  ),
}

/* ------------------------------------------------------------------ vines ---- */

type Seg = [number, number, number, number, number, number]
interface Vine { start: [number, number]; segs: Seg[]; leaves: number[]; flower?: string; behind?: boolean }

const VINES: Vine[] = [
  { start: [-22, 208], segs: [[8, 150, 40, 150, 60, 160], [92, 174, 150, 162, 168, 130], [186, 100, 176, 70, 156, 62], [146, 58, 146, 44, 158, 40]], leaves: [0.1, 0.22, 0.36, 0.5, 0.64, 0.8], flower: '#f9a8d4' },
  { start: [222, 204], segs: [[198, 160, 172, 150, 150, 160], [112, 178, 52, 142, 40, 112], [22, 84, 30, 62, 50, 58], [60, 56, 58, 42, 46, 38]], leaves: [0.12, 0.26, 0.4, 0.54, 0.68, 0.84], flower: '#fde68a' },
  { start: [26, 218], segs: [[60, 196, 140, 216, 176, 196], [196, 184, 198, 164, 184, 158]], leaves: [0.25, 0.5, 0.75] },
  { start: [46, 132], segs: [[70, 104, 130, 102, 156, 124]], leaves: [], behind: true },
]

function vinePath(v: Vine) {
  return `M ${v.start[0]} ${v.start[1]} ` + v.segs.map((g) => `C ${g.join(' ')}`).join(' ')
}

function bezierAt(v: Vine, t: number): [number, number, number] {
  const n = v.segs.length
  const k = Math.min(n - 1, Math.floor(t * n))
  const u = t * n - k
  const p0 = k === 0 ? v.start : [v.segs[k - 1][4], v.segs[k - 1][5]]
  const [c1x, c1y, c2x, c2y, px, py] = v.segs[k]
  const b = (a: number, b1: number, c: number, d: number) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b1 + 3 * (1 - u) * u * u * c + u ** 3 * d
  const db = (a: number, b1: number, c: number, d: number) => 3 * (1 - u) ** 2 * (b1 - a) + 6 * (1 - u) * u * (c - b1) + 3 * u * u * (d - c)
  const ang = Math.atan2(db(p0[1], c1y, c2y, py), db(p0[0], c1x, c2x, px))
  return [b(p0[0], c1x, c2x, px), b(p0[1], c1y, c2y, py), (ang * 180) / Math.PI]
}

const arcCache = new WeakMap<Vine, { pts: [number, number, number][]; cum: number[] }>()

/** Point at a fraction of the vine's LENGTH (matches pathLength-normalised dash offsets). */
function vinePoint(v: Vine, f: number): [number, number, number] {
  let tab = arcCache.get(v)
  if (!tab) {
    const N = 240
    const pts = Array.from({ length: N + 1 }, (_, i) => bezierAt(v, Math.min(0.99999, i / N)))
    const cum = [0]
    for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    tab = { pts, cum }
    arcCache.set(v, tab)
  }
  const total = tab.cum[tab.cum.length - 1]
  const target = Math.max(0, Math.min(1, f)) * total
  let i = 0
  while (i < tab.cum.length - 1 && tab.cum[i + 1] < target) i++
  return tab.pts[i]
}

function VineStroke({ v, visible, behind }: { v: Vine; visible: number; behind?: boolean }) {
  const d = vinePath(v)
  const dash = { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - visible, className: s.smooth }
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} {...dash} stroke={behind ? '#14532d' : '#166534'} strokeWidth={12} />
      <path d={d} {...dash} stroke={behind ? '#15803d' : '#4ade80'} strokeWidth={7} />
      {!behind && <path d={d} {...dash} stroke="#bbf7d0" strokeWidth={2.2} transform="translate(-1 -1.5)" />}
    </g>
  )
}

const vines: KindArt = {
  burst: ['#86efac', '#f9a8d4', '#fde68a', '#bbf7d0'],
  companion: ({ r, releasing }) => ({ className: releasing ? s.hop : r > 0.2 ? s.struggle : undefined }),
  back: ({ r, releasing }) => <>{VINES.filter((v) => v.behind).map((v, i) => <VineStroke key={i} v={v} visible={releasing ? 0 : 1 - r * 0.9} behind />)}</>,
  front: ({ r, releasing }) => {
    const visible = releasing ? 0 : 1 - r * 0.82
    return (
      <g>
        {VINES.filter((v) => !v.behind).map((v, vi) => (
          <g key={vi}>
            <VineStroke v={v} visible={visible} />
            {v.leaves.map((lt, li) => {
              const [x, y, ang] = vinePoint(v, lt)
              const side = li % 2 ? 1 : -1
              const shown = lt < visible - 0.04
              const leaf = (
                <g transform={`translate(${x} ${y}) rotate(${ang + side * 60})`}>
                  <path d="M 0 0 C 6 -12 24 -14 32 -4 C 22 8 6 9 0 0 Z" fill={li % 3 === 1 ? '#a7f3d0' : '#86efac'} stroke="#166534" strokeWidth={2.5} strokeLinejoin="round" />
                  <path d="M 3 -1 L 24 -4" stroke="#166534" strokeWidth={1.5} strokeLinecap="round" />
                </g>
              )
              if (releasing) {
                return <g key={li} className={s.fly} style={vars({ '--tx': `${side * 50}px`, '--ty': '90px', '--rot': `${side * 120}deg` })}>{leaf}</g>
              }
              return <g key={li} className={clsx(s.fb, s.smooth)} style={{ transform: `scale(${shown ? 1 : 0})`, opacity: shown ? 1 : 0 }}>{leaf}</g>
            })}
            {v.flower && (() => {
              const [x, y] = vinePoint(v, 0.999)
              const shown = visible > 0.97
              return (
                <g className={clsx(s.fb, s.smooth)} style={{ transform: `scale(${shown ? 1 : 0})` }}>
                  {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 7} cy={y + Math.sin((a * Math.PI) / 180) * 7} r={6} fill={v.flower} stroke={shade(v.flower!, 0.3)} strokeWidth={2} />)}
                  <circle cx={x} cy={y} r={4.5} fill="#fff7d6" />
                </g>
              )
            })()}
          </g>
        ))}
      </g>
    )
  },
}

/* ------------------------------------------------------------------ cage ---- */

const METAL = '#d4a017'
const METAL_DARK = '#7c4a1e'

const cage: KindArt = {
  burst: ['#fbbf24', '#fdba74', '#f9a8d4', '#fde68a'],
  companion: ({ r, releasing }) => ({ className: releasing ? s.hop : r > 0.4 ? s.struggle : undefined }),
  back: ({ id }) => (
    <g>
      <defs>
        <radialGradient id={id('warm')}>
          <stop offset="0%" stopColor="#fde68a" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={100} cy={110} r={110} fill={`url(#${id('warm')})`} />
      <g stroke="#a16207" strokeWidth={4} opacity={0.5} strokeLinecap="round">
        {[30, 65, 100, 135, 170].map((x) => <path key={x} d={`M ${x} 44 L ${x} 198`} />)}
        <path d="M 30 44 Q 100 -14 170 44" fill="none" />
      </g>
      <ellipse cx={100} cy={200} rx={98} ry={12} fill="#a16207" opacity={0.35} />
    </g>
  ),
  front: ({ r, releasing }) => {
    const angle = releasing ? 165 : r * 42
    const shackleOpen = releasing || r > 0.6
    return (
      <g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* dome */}
          {['M 4 46 Q 4 -20 100 -24 Q 196 -20 196 46', 'M 46 46 Q 52 -6 100 -24', 'M 154 46 Q 148 -6 100 -24'].map((d) => (
            <g key={d}>
              <path d={d} stroke={METAL_DARK} strokeWidth={10} />
              <path d={d} stroke={METAL} strokeWidth={5} />
            </g>
          ))}
          {/* side bars */}
          {[6, 34, 166, 194].map((x) => (
            <g key={x}>
              <path d={`M ${x} 46 L ${x} 198`} stroke={METAL_DARK} strokeWidth={10} />
              <path d={`M ${x} 46 L ${x} 198`} stroke={METAL} strokeWidth={5} />
            </g>
          ))}
        </g>
        <rect x={-4} y={38} width={208} height={14} rx={7} fill={METAL} stroke={METAL_DARK} strokeWidth={4} />
        <rect x={-10} y={194} width={220} height={22} rx={9} fill={METAL} stroke={METAL_DARK} strokeWidth={4} />
        <path d="M -2 200 L 202 200" stroke="#fde68a" strokeWidth={3} strokeLinecap="round" />
        <circle cx={100} cy={-30} r={9} fill={METAL} stroke={METAL_DARK} strokeWidth={4} />
        <circle cx={100} cy={-48} r={11} fill="none" stroke={METAL_DARK} strokeWidth={8} />
        <circle cx={100} cy={-48} r={11} fill="none" stroke={METAL} strokeWidth={4} />
        {/* door (hinged on its left edge) */}
        <g className={clsx(s.fbLeft, s.smooth)} style={{ transform: `scaleX(${Math.cos((angle * Math.PI) / 180).toFixed(3)})`, transitionDuration: releasing ? '650ms' : undefined }}>
          <rect x={60} y={56} width={80} height={134} rx={8} fill="none" stroke={METAL_DARK} strokeWidth={10} />
          <rect x={60} y={56} width={80} height={134} rx={8} fill="none" stroke={METAL} strokeWidth={5} />
          {[80, 100, 120].map((x) => (
            <g key={x}>
              <path d={`M ${x} 58 L ${x} 188`} stroke={METAL_DARK} strokeWidth={9} strokeLinecap="round" />
              <path d={`M ${x} 58 L ${x} 188`} stroke="#eab308" strokeWidth={4.5} strokeLinecap="round" />
            </g>
          ))}
        </g>
        {/* padlock */}
        <g className={clsx(s.fbTop, releasing ? s.dropOut : r > 0.25 ? s.jiggle : undefined)} style={vars({ '--ty': '120px', '--rot': '50deg' })}>
          <path d={shackleOpen ? 'M 132 116 L 132 98 Q 132 84 146 84 Q 160 84 160 98' : 'M 132 116 L 132 102 Q 132 88 146 88 Q 160 88 160 102 L 160 116'} fill="none" stroke="#6b7280" strokeWidth={6} strokeLinecap="round" />
          <rect x={124} y={112} width={44} height={36} rx={8} fill="#fbbf24" stroke={METAL_DARK} strokeWidth={4} />
          <circle cx={146} cy={126} r={5} fill={METAL_DARK} />
          <rect x={144} y={128} width={4} height={10} rx={2} fill={METAL_DARK} />
        </g>
      </g>
    )
  },
}

/* ------------------------------------------------------------------ ink ---- */

function blobPath(cx: number, cy: number, rad: number, seed: number, bumps = 9, spiky = 0) {
  const rnd = seeded(seed)
  const pts: [number, number][] = []
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2
    const rr = rad * (0.78 + rnd() * 0.36) * (spiky && i % 2 ? 1 + spiky : 1)
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  let d = ''
  for (let i = 0; i < bumps; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % bumps]
    const mx = (p[0] + q[0]) / 2
    const my = (p[1] + q[1]) / 2
    d += i === 0 ? `M ${mx} ${my}` : ` Q ${p[0]} ${p[1]} ${mx} ${my}`
  }
  const p = pts[0]
  const q = pts[1]
  return d + ` Q ${p[0]} ${p[1]} ${(p[0] + q[0]) / 2} ${(p[1] + q[1]) / 2} Z`
}

const INK = '#3b1f5c'
const SPLATS: { x: number; y: number; r: number; until: number; seed: number }[] = [
  { x: 100, y: 72, r: 50, until: 1.08, seed: 3 },
  { x: 40, y: 128, r: 22, until: 0.45, seed: 5 },
  { x: 160, y: 118, r: 24, until: 0.62, seed: 7 },
  { x: 122, y: 168, r: 20, until: 0.35, seed: 11 },
  { x: 62, y: 30, r: 14, until: 0.55, seed: 13 },
  { x: 150, y: 40, r: 12, until: 0.8, seed: 17 },
  { x: 70, y: 186, r: 14, until: 0.28, seed: 19 },
]
const DRIPS: [number, number, number][] = [[74, 104, 36], [104, 112, 50], [132, 100, 30]]

const ink: KindArt = {
  burst: ['#c4b5fd', '#ffffff', '#fde68a', '#a5f3fc'],
  companion: ({ r, releasing }) => ({ className: releasing ? s.hop : r > 0.3 ? s.struggle : undefined }),
  front: ({ r, releasing }) => (
    <g>
      {SPLATS.map((p, i) => {
        const k = Math.sqrt(clamp01(1 - r / p.until))
        if (releasing && k <= 0.02) return null
        return (
          <g key={i} className={releasing ? clsx(s.fb, s.dropOut) : undefined} style={releasing ? vars({ '--ty': '70px', '--rot': '0deg' }) : undefined}>
            <g className={clsx(s.fb, s.smooth)} style={{ transform: `scale(${k.toFixed(3)})` }}>
              <path d={blobPath(p.x, p.y, p.r, p.seed, i === 0 ? 14 : 10, 0.32)} fill={INK} stroke="#22103a" strokeWidth={2.5} strokeLinejoin="round" />
              <ellipse cx={p.x - p.r * 0.32} cy={p.y - p.r * 0.36} rx={p.r * 0.28} ry={p.r * 0.16} fill="#ffffff" opacity={0.35} transform={`rotate(-25 ${p.x - p.r * 0.32} ${p.y - p.r * 0.36})`} />
              {i < 3 && <circle cx={p.x + p.r * 1.2} cy={p.y - p.r * 0.5} r={p.r * 0.16} fill={INK} />}
            </g>
          </g>
        )
      })}
      {DRIPS.map(([x, y, len], i) => (
        <g key={`d${i}`} className={s.smooth} style={{ transform: `translateY(${r * 24}px)`, opacity: releasing ? 0 : 1 - r }}>
          <path d={`M ${x - 7} ${y} Q ${x - 5} ${y + len * 0.6} ${x - 6} ${y + len} Q ${x - 7} ${y + len + 11} ${x} ${y + len + 11} Q ${x + 7} ${y + len + 11} ${x + 6} ${y + len} Q ${x + 5} ${y + len * 0.6} ${x + 7} ${y} Z`} fill={INK} />
          <ellipse cx={x - 2} cy={y + len + 3} rx={1.8} ry={3} fill="#ffffff" opacity={0.35} />
        </g>
      ))}
      {!releasing && r < 0.95 && [58, 146].map((x, i) => (
        <circle key={`f${i}`} className={s.drip} style={{ animationDelay: `${i * 1.1}s` }} cx={x} cy={150} r={5} fill={INK} />
      ))}
    </g>
  ),
}

/* ------------------------------------------------------------------ stuck ---- */

const ROCK = '#b9a7a0'

function Boulder({ cx, cy, rad, seed, flip }: { cx: number; cy: number; rad: number; seed: number; flip?: boolean }) {
  return (
    <g>
      <path d={blobPath(cx, cy, rad, seed, 7)} fill={ROCK} stroke="#6b5552" strokeWidth={5} strokeLinejoin="round" />
      <path d={`M ${cx - rad * 0.5 * (flip ? -1 : 1)} ${cy - rad * 0.45} Q ${cx - rad * 0.1 * (flip ? -1 : 1)} ${cy - rad * 0.7} ${cx + rad * 0.3 * (flip ? -1 : 1)} ${cy - rad * 0.55}`} fill="none" stroke="#e7dcd8" strokeWidth={6} strokeLinecap="round" />
      <path d={`M ${cx + rad * 0.1} ${cy + rad * 0.2} q 10 -6 18 2`} fill="none" stroke="#8b7470" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  )
}

const stuck: KindArt = {
  burst: ['#fbbf24', '#fca5a5', '#f9a8d4', '#fde68a'],
  companion: ({ r, releasing }) => ({
    className: releasing ? s.hop : s.struggle,
    style: { transform: releasing ? undefined : `scale(${0.84 + 0.16 * r}, ${1.05 - 0.05 * r})` },
  }),
  back: ({ r, releasing }) => (
    <g className={releasing ? s.fadeOut : undefined}>
      <path d={blobPath(100, 120, 128, 23, 11)} fill="#cdbdb6" stroke="#6b5552" strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={100} cy={128} rx={70 + r * 18} ry={86 + r * 8} fill="#4a3540" className={s.smooth} />
      <ellipse cx={100} cy={136} rx={50 + r * 14} ry={62 + r * 6} fill="#2f2230" className={s.smooth} />
    </g>
  ),
  front: ({ r, releasing }) => (
    // Rocks are scaled toward the centre so the outer boulders stay inside the 256-unit overlay box.
    <g transform="translate(100 100) scale(0.72) translate(-100 -100)">
      <g className={clsx(s.fb, releasing ? s.fly : s.smooth)} style={releasing ? vars({ '--tx': '-150px', '--ty': '30px', '--rot': '-120deg' }) : { transform: `translateX(${-r * 8}px) rotate(${-r * 12}deg)` }}>
        <Boulder cx={6} cy={150} rad={66} seed={29} />
        <Boulder cx={-26} cy={70} rad={40} seed={31} />
      </g>
      <g className={clsx(s.fb, releasing ? s.fly : s.smooth)} style={releasing ? vars({ '--tx': '150px', '--ty': '30px', '--rot': '120deg' }) : { transform: `translateX(${r * 8}px) rotate(${r * 12}deg)` }}>
        <Boulder cx={196} cy={146} rad={64} seed={37} flip />
        <Boulder cx={222} cy={64} rad={36} seed={41} flip />
      </g>
      <g className={clsx(s.fb, releasing ? s.fly : s.smooth)} style={releasing ? vars({ '--ty': '-120px', '--rot': '30deg' }) : { transform: `translateY(${-r * 20}px)` }}>
        <Boulder cx={100} cy={-14} rad={44} seed={43} />
      </g>
      {!releasing && r > 0.05 && [[40, 214], [160, 214], [100, 218]].map(([x, y], i) => (
        <circle key={i} className={s.drip} style={{ animationDelay: `${i * 0.5}s` }} cx={x} cy={y - 20} r={4} fill="#a8948e" />
      ))}
    </g>
  ),
}

export const KINDS: Record<Exclude<PredicamentKind, 'none'>, KindArt> = { bubble, net, ice, fog, vines, cage, ink, stuck }
