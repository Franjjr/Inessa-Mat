/* <CursiveModel> — a letra ligada model word as SVG on a two-line pauta: dotted guide to trace or solid model to
   copy, green start dots, direction arrows, and an optional "watch how" drawing animation. Same look as ModelDigit. */
import clsx from 'clsx'
import { pointAt, svgPath, modelPathLength, type ModelStroke } from '../digitModels'
import { TRACE_PAD } from '../trace'
import { BASELINE, DESCENDER, WORD_SPACE, XHEIGHT, ASCENDER } from './models'
import { joinWord } from './join'
import s from './CursiveModel.module.css'

export interface CursiveModelProps {
  text: string
  /** 'dotted' = trace guide, 'solid' = model to copy, 'ghost' = very light outline. */
  look?: 'dotted' | 'solid' | 'ghost'
  showStart?: boolean
  showArrows?: boolean
  /** Draw the two-line pauta (baseline and x-height, with room for ascenders and descenders). */
  pauta?: boolean
  /** Changing this number replays the drawing animation (0 = no animation). */
  play?: number
  className?: string
  height?: number
}

const PAD_Y = 6

/** Strokes of the whole text, with the start of every word (where the pen starts writing it). */
function layout(text: string): { strokes: ModelStroke[]; bodies: boolean[]; starts: { x: number; y: number }[]; width: number } {
  const strokes: ModelStroke[] = []
  const bodies: boolean[] = []
  const starts: { x: number; y: number }[] = []
  let offset = 0
  for (const word of text.split(' ')) {
    if (!word) continue
    const w = joinWord(word)
    if (!w.strokes.length) continue
    w.strokes.forEach((st, k) => {
      strokes.push(st.map((p) => ({ x: p.x + offset, y: p.y })))
      bodies.push(k < w.body)
    })
    starts.push({ x: w.strokes[0][0].x + offset, y: w.strokes[0][0].y })
    offset += w.width + WORD_SPACE
  }
  return { strokes, bodies, starts, width: Math.max(0, offset - WORD_SPACE) }
}

export function CursiveModel({ text, look = 'dotted', showStart = true, showArrows = true, pauta = true, play = 0, className, height = 120 }: CursiveModelProps) {
  const { strokes, bodies, starts, width } = layout(text)
  const W = Math.max(width, 10)
  const vbX = -TRACE_PAD.x
  const vbY = ASCENDER - PAD_Y - 8
  const vbW = W + TRACE_PAD.x * 2
  const vbH = DESCENDER - vbY + PAD_Y
  const lengths = strokes.map(modelPathLength)
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  let acc = 0
  const viewW = vbW
  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className={clsx(s.svg, s[look], className)}
      style={{ height, width: (height * viewW) / vbH }}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {pauta && (
        <g className={s.pauta}>
          <line x1={vbX} x2={vbX + vbW} y1={BASELINE} y2={BASELINE} className={s.base} />
          <line x1={vbX} x2={vbX + vbW} y1={XHEIGHT} y2={XHEIGHT} className={s.xline} />
          <line x1={vbX} x2={vbX + vbW} y1={ASCENDER + 15} y2={ASCENDER + 15} className={s.aux} />
          <line x1={vbX} x2={vbX + vbW} y1={BASELINE + 30} y2={BASELINE + 30} className={s.aux} />
        </g>
      )}

      {strokes.map((st, i) => <path key={`g${i}`} d={svgPath(st)} className={s.guide} />)}

      {play > 0 && strokes.map((st, i) => {
        const delay = (acc / total) * 2.4 + i * 0.1
        const dur = Math.max(0.35, (lengths[i] / total) * 2.4)
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

      {showArrows && strokes.flatMap((st, i) => {
        // Arrows only on body strokes long enough to show a direction (not on dots, bars, tildes or accents).
        if (!bodies[i] || lengths[i] < 20) return []
        const count = Math.min(4, Math.max(1, Math.round(lengths[i] / 50)))
        return Array.from({ length: count }, (_, k) => {
          const f = (k + 0.5) / count
          const p = pointAt(st, f)
          const angle = (Math.atan2(p.dy, p.dx) * 180) / Math.PI
          return (
            <path
              key={`a${i}-${k}`}
              d="M-3.4 -4.6 L4.8 0 L-3.4 4.6 Z"
              className={s.arrow}
              transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`}
            />
          )
        })
      })}

      {showStart && starts.map((p, i) => (
        <g key={`s${i}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} className={s.start}>
          <circle r={7} />
        </g>
      ))}
    </svg>
  )
}
