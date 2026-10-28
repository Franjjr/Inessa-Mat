/* The measure ruler (30 cm to scale) drawn with the styles of MeasureView.module.css: the same picture in the ruler exercise
   and in the lesson visual. The caller picks the stretch to draw (from → to) and the object (start → end, optional emoji). */
import r from './MeasureView.module.css'

/** Pixels per centimetre in the drawing's own units. */
export const RULER_CM_PX = 24
/** Left and right margin of the drawing, in its own units. */
export const RULER_PAD_PX = 14

export function MeasureRuler({ start, end, from, to, label, every = 5, emoji }: {
  /** Where the object starts and ends, in cm. */
  start: number
  end: number
  /** The stretch of ruler drawn, in cm. */
  from: number
  to: number
  label: string
  /** A number is written under every `every` cm. */
  every?: number
  /** Emoji drawn on the object (lesson visual). */
  emoji?: string
}) {
  const cm = RULER_CM_PX
  const pad = RULER_PAD_PX
  const width = (to - from) * cm + pad * 2
  const top = 14
  const bodyH = 58
  const x = (v: number) => pad + (v - from) * cm
  return (
    <svg className={r.ruler} viewBox={`0 0 ${width} ${top + bodyH + 46}`} role="img" aria-label={label}>
      <rect x={0} y={top} width={width} height={bodyH} rx={10} className={r.rulerBody} />
      {Array.from({ length: to - from + 1 }, (_, k) => {
        const i = from + k
        const len = i % 10 === 0 ? 26 : i % 5 === 0 ? 20 : 12
        return (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={top + bodyH} y2={top + bodyH - len} className={r.tick} />
            {i % every === 0 && (
              <text x={x(i)} y={top + bodyH + 34} textAnchor="middle" className={r.label}>{i}</text>
            )}
          </g>
        )
      })}
      <rect x={x(start)} y={top + 14} width={Math.max(4, (end - start) * cm)} height={bodyH - 28} rx={8} className={r.thing} />
      {emoji && (
        <text x={(x(start) + x(end)) / 2} y={top + bodyH / 2} textAnchor="middle" dominantBaseline="central" className={r.thingEmoji}>{emoji}</text>
      )}
      <line x1={x(start)} x2={x(start)} y1={top - 4} y2={top + bodyH + 2} className={r.startMark} />
    </svg>
  )
}
