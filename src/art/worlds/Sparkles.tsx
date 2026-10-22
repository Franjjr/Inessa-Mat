/* Lightweight twinkling sparkles that overlay their (position: relative) parent. Decorative only. */
import { memo, type CSSProperties } from 'react'
import { light } from './color'
import { seeded } from './kit'
import s from './items.module.css'

export interface SparklesProps {
  /** Show or hide the sparkles (default true). */
  active?: boolean
  /** Sparkle colour (hex or any CSS colour). Default gold. */
  color?: string
  /** Number of sparkles (1..40, default 8). */
  count?: number
}

const SHAPE = 'M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0 Z'

export const Sparkles = memo(function Sparkles({ active = true, color = '#fbbf24', count = 8 }: SparklesProps) {
  if (!active) return null
  const n = Math.max(1, Math.min(40, Math.round(count)))
  const rnd = seeded(n * 97 + 13)
  const alt = color.startsWith('#') ? light(color, 0.55) : '#ffffff'
  const items = Array.from({ length: n }, (_, i) => {
    // Spread around the box edges more than the centre so the content stays readable.
    const ang = (i / n) * Math.PI * 2 + rnd() * 0.8
    const rad = 0.32 + rnd() * 0.2
    return {
      left: 50 + Math.cos(ang) * rad * 100,
      top: 50 + Math.sin(ang) * rad * 100,
      size: 9 + rnd() * 11,
      d: 1.4 + rnd() * 1.4,
      dl: -rnd() * 2.4,
      fill: i % 3 === 2 ? alt : color,
    }
  })
  return (
    <span className={s.sparkles} aria-hidden="true" data-sparkles={n}>
      {items.map((p, i) => (
        <span
          key={i}
          className={s.spark}
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: `clamp(8px, ${p.size}%, 28px)`, '--d': `${p.d.toFixed(2)}s`, '--dl': `${p.dl.toFixed(2)}s` } as CSSProperties}
        >
          <svg viewBox="0 0 100 100" focusable="false">
            <path d={SHAPE} style={{ fill: p.fill }} />
          </svg>
        </span>
      ))}
    </span>
  )
})
