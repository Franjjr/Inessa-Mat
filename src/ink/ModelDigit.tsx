/* <ModelDigit> — a school model digit as SVG: dotted guide to trace, or solid model to copy; green start dots
   numbered in stroke order, direction arrows, and an optional "watch how" drawing animation. */
import clsx from 'clsx'
import { DIGIT_MODELS, MODEL_H, MODEL_W, pointAt, svgPath, modelPathLength, type ModelStroke } from './digitModels'
import { TRACE_PAD } from './trace'
import s from './ModelDigit.module.css'

export interface ModelDigitProps {
  digit: number
  /** 'dotted' = trace guide, 'solid' = model to copy, 'ghost' = very light outline. */
  look?: 'dotted' | 'solid' | 'ghost'
  showStart?: boolean
  showArrows?: boolean
  /** Changing this number replays the drawing animation (0 = no animation). */
  play?: number
  className?: string
  /** Fill the parent (absolute) instead of an inline box of `height` px. */
  fill?: boolean
  height?: number
}

/** Start dot positions; a dot that would sit on an earlier one is nudged back along its stroke direction. */
function startDots(strokes: ModelStroke[]): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const st of strokes) {
    const p = { x: st[0].x, y: st[0].y }
    if (out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 15)) {
      // stack it just "above" the stroke start (perpendicular to its direction)
      const dir = pointAt(st, 0.02)
      p.x += dir.dy * 16
      p.y -= dir.dx * 16
    }
    out.push(p)
  }
  return out
}

const modelStrokes = (d: number) => DIGIT_MODELS[d] ?? []

export function ModelDigit({ digit, look = 'dotted', showStart = true, showArrows = true, play = 0, className, fill, height = 160 }: ModelDigitProps) {
  const strokes = modelStrokes(digit)
  const vb = `${-TRACE_PAD.x} ${-TRACE_PAD.y} ${MODEL_W + TRACE_PAD.x * 2} ${MODEL_H + TRACE_PAD.y * 2}`
  const lengths = strokes.map(modelPathLength)
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  let acc = 0
  return (
    <svg
      viewBox={vb}
      className={clsx(s.svg, s[look], fill && s.fill, className)}
      style={fill ? undefined : { height, width: (height * (MODEL_W + TRACE_PAD.x * 2)) / (MODEL_H + TRACE_PAD.y * 2) }}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {strokes.map((st, i) => <path key={`g${i}`} d={svgPath(st)} className={s.guide} />)}

      {play > 0 && strokes.map((st, i) => {
        const delay = (acc / total) * 1.6 + i * 0.25
        const dur = Math.max(0.45, (lengths[i] / total) * 1.6)
        acc += lengths[i]
        return (
          <path
            key={`p${play}-${i}`}
            d={svgPath(st)}
            pathLength={1}
            className={s.play}
            style={{ animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
          />
        )
      })}

      {showArrows && strokes.map((st, i) => {
        const fracs = lengths[i] > 120 ? [0.32, 0.72] : [0.4]
        return fracs.map((f) => {
          const p = pointAt(st, f)
          const angle = (Math.atan2(p.dy, p.dx) * 180) / Math.PI
          return <path key={`a${i}-${f}`} d="M-4 -5.2 L5.5 0 L-4 5.2 Z" className={s.arrow} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`} />
        })
      })}

      {showStart && startDots(strokes).map((p, i) => (
        <g key={`s${i}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} className={s.start}>
          <circle r={8} />
          {strokes.length > 1 && <text y={3.6} textAnchor="middle">{i + 1}</text>}
        </g>
      ))}
    </svg>
  )
}
