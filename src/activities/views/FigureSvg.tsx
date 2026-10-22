/* Draws the figures of the fraction and geometry exercises from their data (src/types/exercise.ts Figure). Pure SVG,
   no images. Fractions: the parts can be tapped (onPartTap) and shown as coloured (chosen or colored in the data).
   Polygons: side labels, and corners that can be tapped (corners.onTap) for the right-angle exercise. */
import type { CSSProperties, ReactNode } from 'react'
import type { AngleFigure, CircleFigure, FractionFigure, Figure, LineFigure, LinesFigure, PolygonFigure, SolidFigure } from '@/types'
import s from './FractionsGeometry.module.css'

const VB = 200

type Pt = [number, number]

/** Fits the points inside the viewBox, keeping their proportions. */
function fit(points: readonly Pt[], pad = 26): Pt[] {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const w = Math.max(...xs) - minX || 1
  const h = Math.max(...ys) - minY || 1
  const k = (VB - 2 * pad) / Math.max(w, h)
  const ox = (VB - w * k) / 2 - minX * k
  const oy = (VB - h * k) / 2 - minY * k
  return points.map(([x, y]) => [x * k + ox, y * k + oy])
}

const r1 = (n: number) => Math.round(n * 10) / 10

type PartShape = { kind: 'sector'; d: string } | { kind: 'box'; x: number; y: number; w: number; h: number }

/** Parts of a fraction figure as boxes (rect and bar) or sectors (circle), in the viewBox. */
function partShapes(f: FractionFigure): PartShape[] {
  const total = f.weights.reduce((a, b) => a + b, 0)
  let acc = 0
  if (f.shape === 'circle') {
    const cx = 100
    const cy = 100
    const rad = 80
    return f.weights.map((w): PartShape => {
      const a0 = -Math.PI / 2 + (acc / total) * 2 * Math.PI
      acc += w
      const a1 = -Math.PI / 2 + (acc / total) * 2 * Math.PI
      const p0 = [cx + rad * Math.cos(a0), cy + rad * Math.sin(a0)]
      const p1 = [cx + rad * Math.cos(a1), cy + rad * Math.sin(a1)]
      const large = a1 - a0 > Math.PI ? 1 : 0
      return { kind: 'sector', d: `M ${cx} ${cy} L ${r1(p0[0])} ${r1(p0[1])} A ${rad} ${rad} 0 ${large} 1 ${r1(p1[0])} ${r1(p1[1])} Z` }
    })
  }
  const box = f.shape === 'bar' && f.axis === 'y' ? { x: 62, y: 20, w: 76, h: 160 }
    : f.shape === 'bar' ? { x: 10, y: 70, w: 180, h: 60 }
      : { x: 28, y: 36, w: 144, h: 128 }
  return f.weights.map((w): PartShape => {
    const start = acc / total
    const size = w / total
    acc += w
    return f.axis === 'x'
      ? { kind: 'box', x: box.x + start * box.w, y: box.y, w: size * box.w, h: box.h }
      : { kind: 'box', x: box.x, y: box.y + start * box.h, w: box.w, h: size * box.h }
  })
}

export interface FigureSvgProps {
  figure: Figure
  /** Accessible name of the figure. */
  label: string
  /** Fraction figures: the parts shown as coloured (overrides figure.colored while the child colours). */
  chosen?: number[]
  /** Fraction figures: a part was tapped. The parts are buttons when this is given. */
  onPartTap?: (index: number) => void
  /** Polygons: the corners marked (right angles tapped) and the tap handler; the corners are buttons when given. */
  corners?: { marked: number[]; onTap?: (index: number) => void }
  className?: string
  style?: CSSProperties
}

export function FigureSvg({ figure, label, chosen, onPartTap, corners, className, style }: FigureSvgProps) {
  let body: ReactNode
  switch (figure.type) {
    case 'fraction': body = <FractionBody f={figure} chosen={chosen} onPartTap={onPartTap} />; break
    case 'polygon': body = <PolygonBody f={figure} corners={corners} />; break
    case 'circle': body = <CircleBody f={figure} />; break
    case 'line': body = <LineBody f={figure} />; break
    case 'lines': body = <LinesBody f={figure} />; break
    case 'angle': body = <AngleBody f={figure} />; break
    case 'solid': body = <SolidBody f={figure} />; break
  }
  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      role="img"
      aria-label={label}
      className={className ?? s.figure}
      style={style}
      data-figure={figure.type}
    >
      {body}
    </svg>
  )
}

const INK = 'var(--c-ink)'
const PART_OFF = 'var(--c-surface)'
const PART_ON = 'var(--c-magic-soft)'
const PART_ON_STRONG = 'var(--c-magic)'

function FractionBody({ f, chosen, onPartTap }: { f: FractionFigure; chosen?: number[]; onPartTap?: (i: number) => void }) {
  const on = new Set(chosen ?? f.colored)
  const shapes = partShapes(f)
  return (
    <g>
      {shapes.map((sh, i) => {
        const colored = on.has(i)
        const fill = colored ? PART_ON : PART_OFF
        const common = {
          fill,
          stroke: INK,
          strokeWidth: 3,
          strokeLinejoin: 'round' as const,
          className: onPartTap ? s.part : undefined,
        }
        const interactive = onPartTap
          ? { role: 'button' as const, tabIndex: 0, 'aria-label': `Parte ${i + 1}`, 'aria-pressed': colored, onClick: () => onPartTap(i), onKeyDown: (e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPartTap(i) } } }
          : {}
        if (sh.kind === 'sector') {
          return <path key={i} d={sh.d} {...common} {...interactive} data-colored={colored ? 'yes' : 'no'} />
        }
        return <rect key={i} x={r1(sh.x)} y={r1(sh.y)} width={r1(sh.w)} height={r1(sh.h)} {...common} {...interactive} data-colored={colored ? 'yes' : 'no'} />
      })}
    </g>
  )
}

function PolygonBody({ f, corners }: { f: PolygonFigure; corners?: { marked: number[]; onTap?: (i: number) => void } }) {
  const pts = fit(f.points, f.labels ? 40 : 26)
  const centroid = pts.reduce<Pt>((acc, p) => [acc[0] + p[0] / pts.length, acc[1] + p[1] / pts.length], [0, 0])
  const path = pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ')
  return (
    <g>
      <polygon points={path} fill="var(--c-surface)" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {f.labels?.map((text, i) => {
        const a = pts[i]
        const b = pts[(i + 1) % pts.length]
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        const dx = mid[0] - centroid[0]
        const dy = mid[1] - centroid[1]
        const len = Math.hypot(dx, dy) || 1
        const lx = mid[0] + (dx / len) * 22
        const ly = mid[1] + (dy / len) * 22
        return (
          <text key={i} x={r1(lx)} y={r1(ly)} textAnchor="middle" dominantBaseline="middle" className={s.label}>{text}</text>
        )
      })}
      {corners && pts.map((p, i) => {
        const marked = corners.marked.includes(i)
        const hit = corners.onTap
          ? { role: 'button' as const, tabIndex: 0, 'aria-label': `Esquina ${i + 1}`, 'aria-pressed': marked, onClick: () => corners.onTap?.(i), onKeyDown: (e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); corners.onTap?.(i) } } }
          : {}
        return (
          <g key={i} className={corners.onTap ? s.corner : undefined} {...hit}>
            <circle cx={r1(p[0])} cy={r1(p[1])} r={corners.onTap ? 22 : 6} fill="transparent" />
            <circle cx={r1(p[0])} cy={r1(p[1])} r={marked ? 11 : 6} fill={marked ? PART_ON_STRONG : INK} opacity={marked ? 0.9 : 0.75} />
            {marked && <path d={rightMark(p, centroid)} fill="none" stroke="var(--c-surface)" strokeWidth={3} />}
          </g>
        )
      })}
    </g>
  )
}

/** A small square in the corner, the way a right angle is drawn on a mark (used only when the child has tapped it). */
function rightMark(p: Pt, c: Pt): string {
  const dx = c[0] - p[0]
  const dy = c[1] - p[1]
  const len = Math.hypot(dx, dy) || 1
  const ux = (dx / len) * 12
  const uy = (dy / len) * 12
  return `M ${r1(p[0] + ux)} ${r1(p[1] + uy)} L ${r1(p[0] + ux + uy)} ${r1(p[1] - ux)} L ${r1(p[0] + uy)} ${r1(p[1] - ux + uy)}`
}

function CircleBody({ f }: { f: CircleFigure }) {
  return <circle cx={100} cy={100} r={80} fill={f.filled ? PART_ON : 'none'} stroke={INK} strokeWidth={4} />
}

function LineBody({ f }: { f: LineFigure }) {
  const pts = fit(f.points, 22)
  if (f.kind === 'curve' && pts.length === 3) {
    return <path d={`M ${r1(pts[0][0])} ${r1(pts[0][1])} Q ${r1(pts[1][0])} ${r1(pts[1][1])} ${r1(pts[2][0])} ${r1(pts[2][1])}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  }
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${r1(p[0])} ${r1(p[1])}`).join(' ')
  return <path d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
}

function LinesBody({ f }: { f: LinesFigure }) {
  const all = fit(f.segments.flat(), 22)
  return (
    <g fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round">
      {f.segments.map((_, i) => {
        const a = all[i * 2]
        const b = all[i * 2 + 1]
        return <line key={i} x1={r1(a[0])} y1={r1(a[1])} x2={r1(b[0])} y2={r1(b[1])} />
      })}
    </g>
  )
}

function AngleBody({ f }: { f: AngleFigure }) {
  const cx = 100
  const cy = 100
  const len = 78
  const rad = (f.deg * Math.PI) / 180
  const ex = cx + len * Math.cos(-rad)
  const ey = cy + len * Math.sin(-rad)
  const arc = 30
  const ax = cx + arc * Math.cos(-rad)
  const ay = cy + arc * Math.sin(-rad)
  return (
    <g transform={`rotate(${f.rotation} ${cx} ${cy})`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round">
      <line x1={cx} y1={cy} x2={cx + len} y2={cy} />
      <line x1={cx} y1={cy} x2={r1(ex)} y2={r1(ey)} />
      <path d={`M ${cx + arc} ${cy} A ${arc} ${arc} 0 0 0 ${r1(ax)} ${r1(ay)}`} strokeWidth={3} />
    </g>
  )
}

function SolidBody({ f }: { f: SolidFigure }) {
  const face = { fill: 'var(--c-surface)', stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const }
  const back = { fill: PART_ON, stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const }
  switch (f.name) {
    case 'cubo':
      return (
        <g>
          <polygon points="58,84 128,84 128,154 58,154" {...face} />
          <polygon points="58,84 88,54 158,54 128,84" {...back} />
          <polygon points="128,84 158,54 158,124 128,154" {...back} />
        </g>
      )
    case 'prisma':
      return (
        <g>
          <polygon points="82,114 142,114 112,56" {...back} />
          <line x1={46} y1={150} x2={82} y2={114} stroke={INK} strokeWidth={4} />
          <line x1={106} y1={150} x2={142} y2={114} stroke={INK} strokeWidth={4} />
          <line x1={76} y1={92} x2={112} y2={56} stroke={INK} strokeWidth={4} />
          <polygon points="46,150 106,150 76,92" {...face} />
        </g>
      )
    case 'piramide':
      return (
        <g>
          <polygon points="56,150 124,150 158,124 90,124" {...back} />
          <polygon points="56,150 124,150 104,50" {...face} />
          <polygon points="124,150 158,124 104,50" fill="var(--c-surface)" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      )
    case 'cilindro':
      return (
        <g>
          <path d="M 50 62 L 50 136 A 50 16 0 0 0 150 136 L 150 62" {...face} />
          <ellipse cx={100} cy={62} rx={50} ry={16} {...back} />
        </g>
      )
    case 'cono':
      return (
        <g>
          <path d="M 100 38 L 46 136 A 54 16 0 0 0 154 136 Z" {...face} />
          <ellipse cx={100} cy={136} rx={54} ry={16} {...back} />
        </g>
      )
    case 'esfera':
      return (
        <g>
          <circle cx={100} cy={100} r={70} {...face} />
          <path d="M 62 84 Q 70 58 96 52" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
        </g>
      )
  }
}
