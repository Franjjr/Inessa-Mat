/* Draws the figures of the fraction and geometry exercises from their data (src/types/exercise.ts Figure). Pure SVG,
   no images. Fractions: the parts can be tapped (onPartTap) and shown as coloured (chosen or colored in the data).
   Polygons: side labels, and corners that can be tapped (corners.onTap) for the right-angle exercise. */
import type { CSSProperties, ReactNode } from 'react'
import type { AngleFigure, CircleFigure, FractionFigure, Figure, GridFigure, LineFigure, LinesFigure, PolygonFigure, SolidFigure } from '@/types'
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
    case 'grid': body = <GridBody f={figure} />; break
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

/** Squares on a grid: the coloured ones are the figure; the axis (simetría) is a dashed line on a boundary. */
function GridBody({ f }: { f: GridFigure }) {
  const cell = Math.min((VB - 16) / f.cols, (VB - 16) / f.rows)
  const ox = (VB - cell * f.cols) / 2
  const oy = (VB - cell * f.rows) / 2
  const on = new Set(f.filled.map(([r, c]) => `${r},${c}`))
  return (
    <g>
      {Array.from({ length: f.rows * f.cols }, (_, k) => {
        const r = Math.floor(k / f.cols)
        const c = k % f.cols
        return (
          <rect
            key={k} x={r1(ox + c * cell)} y={r1(oy + r * cell)} width={r1(cell)} height={r1(cell)}
            fill={on.has(`${r},${c}`) ? PART_ON_STRONG : PART_OFF} stroke="var(--c-line)" strokeWidth={1.5}
          />
        )
      })}
      {f.ghost?.map(([r, c]) => (
        <rect
          key={`ghost-${r},${c}`} x={r1(ox + c * cell)} y={r1(oy + r * cell)} width={r1(cell)} height={r1(cell)}
          fill="none" stroke={INK} strokeWidth={3} strokeDasharray="6 5"
        />
      ))}
      {f.axis && (f.axis.dir === 'v'
        ? <line x1={r1(ox + f.axis.at * cell)} x2={r1(ox + f.axis.at * cell)} y1={oy - 6} y2={r1(oy + f.rows * cell + 6)} stroke="var(--c-error)" strokeWidth={4} strokeDasharray="8 6" />
        : <line y1={r1(oy + f.axis.at * cell)} y2={r1(oy + f.axis.at * cell)} x1={ox - 6} x2={r1(ox + f.cols * cell + 6)} stroke="var(--c-error)" strokeWidth={4} strokeDasharray="8 6" />)}
    </g>
  )
}
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
        // Outside the figure, square to the side (an L-shape has sides whose outside faces its own centre), and far
        // enough for the text not to touch the side: half its width on upright sides, half its height on flat ones.
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        let nx = (b[1] - a[1]) / len
        let ny = -(b[0] - a[0]) / len
        if (inside(pts, [mid[0] + nx * 2, mid[1] + ny * 2])) { nx = -nx; ny = -ny }
        const gap = 6 + Math.abs(nx) * text.length * 4.5 + Math.abs(ny) * 8
        const lx = mid[0] + nx * gap
        const ly = mid[1] + ny * gap
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

/** Ray casting: is the point inside the polygon? */
function inside(pts: readonly Pt[], [x, y]: Pt): boolean {
  let hit = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
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

/** The circle; with a highlight, the radio, diámetro, cuerda or arco drawn in red, turned by f.turn degrees. */
function CircleBody({ f }: { f: CircleFigure }) {
  const rim = <circle cx={100} cy={100} r={80} fill={f.filled ? PART_ON : 'none'} stroke={INK} strokeWidth={4} />
  if (!f.highlight) return rim
  const t = ((f.turn ?? 0) * Math.PI) / 180
  const at = (deg: number): Pt => [100 + 80 * Math.cos(t + (deg * Math.PI) / 180), 100 + 80 * Math.sin(t + (deg * Math.PI) / 180)]
  const red = { fill: 'none', stroke: 'var(--c-error)', strokeWidth: 7, strokeLinecap: 'round' as const }
  const line = (a: Pt, b: Pt) => <path d={`M ${r1(a[0])} ${r1(a[1])} L ${r1(b[0])} ${r1(b[1])}`} {...red} />
  const centre = <circle cx={100} cy={100} r={5} fill={INK} />
  switch (f.highlight) {
    case 'radius': return <g>{rim}{line([100, 100], at(0))}{centre}</g>
    case 'diameter': return <g>{rim}{line(at(0), at(180))}{centre}</g>
    case 'chord': return <g>{rim}{line(at(0), at(110))}</g>
    case 'arc': {
      const a = at(0)
      const b = at(100)
      return <g>{rim}<path d={`M ${r1(a[0])} ${r1(a[1])} A 80 80 0 0 1 ${r1(b[0])} ${r1(b[1])}`} {...red} /></g>
    }
  }
}

/** The two short strokes of an arrow head whose tip is `tip`, pointing away from `from`. */
function arrowHead(from: Pt, tip: Pt): string {
  const len = Math.hypot(tip[0] - from[0], tip[1] - from[1]) || 1
  const ux = (tip[0] - from[0]) / len
  const uy = (tip[1] - from[1]) / len
  const bx = tip[0] - ux * 14
  const by = tip[1] - uy * 14
  return `M ${r1(bx - uy * 7)} ${r1(by + ux * 7)} L ${r1(tip[0])} ${r1(tip[1])} L ${r1(bx + uy * 7)} ${r1(by - ux * 7)}`
}

function LineBody({ f }: { f: LineFigure }) {
  const pts = fit(f.points, 22)
  const ink = { fill: 'none', stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (f.kind === 'curve' && pts.length === 3) {
    return <path d={`M ${r1(pts[0][0])} ${r1(pts[0][1])} Q ${r1(pts[1][0])} ${r1(pts[1][1])} ${r1(pts[2][0])} ${r1(pts[2][1])}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  }
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${r1(p[0])} ${r1(p[1])}`).join(' ')
  const first = pts[0]
  const last = pts[pts.length - 1]
  const dot = (p: Pt) => <circle cx={r1(p[0])} cy={r1(p[1])} r={7} fill={INK} />
  switch (f.kind) {
    case 'segment': return <g><path d={d} {...ink} />{dot(first)}{dot(last)}</g>
    case 'ray': return <g><path d={d} {...ink} /><path d={arrowHead(first, last)} {...ink} />{dot(first)}</g>
    case 'straight': return <g><path d={d} {...ink} /><path d={arrowHead(last, first)} {...ink} /><path d={arrowHead(first, last)} {...ink} /></g>
    default: return <path d={d} {...ink} />
  }
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
