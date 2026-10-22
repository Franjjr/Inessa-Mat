/* Reward star. Pops (bounce + little rays) whenever `filled` turns true after mounting. */
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { starPoints } from './shapes'
import s from './items.module.css'

export interface StarIconProps {
  filled?: boolean
  size?: number
  /** Accessible name (e.g. "Estrella conseguida"). Without it the star is decorative. */
  label?: string
  className?: string
}

const OUTER = starPoints(50, 53, 44, 21)
const INNER = starPoints(48, 50, 26, 12.5)
const RAYS = [0, 72, 144, 216, 288].map((deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return { x: 50 + Math.cos(a) * 30, y: 53 + Math.sin(a) * 30, tx: `${Math.cos(a) * 24}px`, ty: `${Math.sin(a) * 24}px` }
})

export function StarIcon({ filled = false, size = 32, label, className }: StarIconProps) {
  const prev = useRef(filled)
  const [popKey, setPopKey] = useState(0)
  useEffect(() => {
    if (filled && !prev.current) setPopKey((k) => k + 1)
    prev.current = filled
  }, [filled])
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg className={clsx(s.svg, className)} width={size} height={size} viewBox="0 0 100 100" data-filled={filled ? 'true' : 'false'} {...a11y}>
      <g key={popKey} className={popKey > 0 ? s.pop : undefined}>
        {filled ? (
          <>
            <polygon points={OUTER} fill="#fbbf24" stroke="#b45309" strokeWidth={7} strokeLinejoin="round" />
            <polygon points={INNER} fill="#fde68a" />
            <ellipse cx={35} cy={36} rx={7} ry={4.5} fill="#ffffff" opacity={0.9} transform="rotate(-35 35 36)" />
          </>
        ) : (
          <>
            <polygon points={OUTER} fill="#f5f3ff" stroke="#c4b5fd" strokeWidth={7} strokeLinejoin="round" />
            <polygon points={INNER} fill="#ede9fe" />
          </>
        )}
      </g>
      {popKey > 0 && (
        <g key={`r${popKey}`}>
          {RAYS.map((r, i) => (
            <circle key={i} className={s.ray} cx={r.x} cy={r.y} r={4} fill="#fbbf24" style={{ ['--tx' as string]: r.tx, ['--ty' as string]: r.ty }} />
          ))}
        </g>
      )}
    </svg>
  )
}
