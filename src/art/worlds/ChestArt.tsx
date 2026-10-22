/* El Gran Cofre: closed with a golden padlock (gently wiggling), or open with warm light rays and sparkles.
   Switching open=true plays the opening (lid swings up, rays bloom). */
import clsx from 'clsx'
import { useEffect, useId, useRef, useState } from 'react'
import { SparklePath } from './shapes'
import s from './items.module.css'

export interface ChestArtProps {
  open?: boolean
  size?: number
  /** Accessible name (e.g. "El Gran Cofre"). Without it the chest is decorative. */
  label?: string
  className?: string
}

const INK = '#4c1d95'
const BODY = '#a855f7'
const LID = '#c084fc'
const GOLD = '#fbbf24'
const GOLD_DARK = '#a16207'

const RAY_ANGLES = [-80, -58, -36, -14, 8, 30, 52, 74]

export function ChestArt({ open = false, size = 160, label, className }: ChestArtProps) {
  const raw = useId()
  const id = (n: string) => `ch${raw.replace(/[^a-zA-Z0-9]/g, '')}-${n}`
  const wasOpen = useRef(open)
  const [animKey, setAnimKey] = useState(0)
  useEffect(() => {
    if (open && !wasOpen.current) setAnimKey((k) => k + 1)
    wasOpen.current = open
  }, [open])
  const animating = animKey > 0
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

  return (
    <svg className={clsx(s.svg, className)} width={size} height={size} viewBox="0 0 200 200" data-open={open ? 'true' : 'false'} {...a11y}>
      <defs>
        <radialGradient id={id('ray')} cx={100} cy={112} r={110} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity={1} />
          <stop offset="45%" stopColor="#fde68a" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0%" stopColor="#fff7d6" stopOpacity={1} />
          <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={100} cy={186} rx={78} ry={9} fill="#2e1a47" opacity={0.14} />

      {open && (
        <g key={`rays${animKey}`} className={animating ? s.rays : undefined}>
          <g className={s.raysSpin}>
            {RAY_ANGLES.map((deg, i) => {
              const a = ((deg - 90) * Math.PI) / 180
              const w = (i % 2 ? 7 : 10) * (Math.PI / 180)
              const R = 112
              const p1 = [100 + Math.cos(a - w) * R, 112 + Math.sin(a - w) * R]
              const p2 = [100 + Math.cos(a + w) * R, 112 + Math.sin(a + w) * R]
              return <polygon key={deg} points={`100,112 ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`} fill={`url(#${id('ray')})`} />
            })}
          </g>
          <circle cx={100} cy={112} r={62} fill={`url(#${id('glow')})`} />
        </g>
      )}

      {/* open lid (inside face, tilted back) */}
      {open && (
        <g key={`lid${animKey}`} className={animating ? s.lidOn : undefined}>
          <path d="M 34 110 L 44 46 Q 100 30 156 46 L 166 110 Z" fill="#7e22ce" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M 46 104 L 54 56 Q 100 44 146 56 L 154 104 Z" fill="#9333ea" />
          <path d="M 88 108 L 92 38 L 108 38 L 112 108 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth={3.5} strokeLinejoin="round" />
        </g>
      )}

      {/* body */}
      <g className={!open ? s.shake : undefined}>
        <rect x={26} y={106} width={148} height={74} rx={10} fill={BODY} stroke={INK} strokeWidth={5} />
        <rect x={36} y={116} width={128} height={54} rx={6} fill="#b26ef7" />
        <path d="M 30 172 L 170 172" stroke="#9333ea" strokeWidth={4} strokeLinecap="round" />
        <rect x={88} y={106} width={24} height={74} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3.5} />
        <rect x={20} y={100} width={160} height={14} rx={6} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3.5} />
        <rect x={34} y={176} width={22} height={10} rx={4} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3} />
        <rect x={144} y={176} width={22} height={10} rx={4} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3} />
        {[[52, 140], [148, 140]].map(([x, y]) => (
          <g key={x}>
            <polygon points={`${x},${y - 10} ${x + 9},${y} ${x},${y + 10} ${x - 9},${y}`} fill="#f9a8d4" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <circle cx={x - 2} cy={y - 3} r={2} fill="#ffffff" />
          </g>
        ))}
        {open && <ellipse cx={100} cy={108} rx={64} ry={8} fill="#fff7d6" opacity={0.95} />}

        {!open && (
          <g key={`lidc${animKey}`}>
            <path d="M 26 104 Q 26 58 100 56 Q 174 58 174 104 Z" fill={LID} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M 40 96 Q 44 68 100 66" fill="none" stroke="#e9d5ff" strokeWidth={6} strokeLinecap="round" />
            <path d="M 88 104 L 88 57 Q 100 56 112 57 L 112 104 Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth={3.5} strokeLinejoin="round" />
            <rect x={20} y={98} width={160} height={14} rx={6} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3.5} />
          </g>
        )}

        {/* padlock */}
        {!open ? (
          <g>
            <path d="M 88 112 L 88 100 Q 88 86 100 86 Q 112 86 112 100 L 112 112" fill="none" stroke="#6b7280" strokeWidth={6} strokeLinecap="round" />
            <rect x={80} y={106} width={40} height={34} rx={8} fill={GOLD} stroke={GOLD_DARK} strokeWidth={4} />
            <circle cx={100} cy={119} r={5} fill={INK} />
            <path d="M 98 121 L 96 132 L 104 132 L 102 121 Z" fill={INK} />
            <path d="M 85 111 L 85 124" stroke="#fde68a" strokeWidth={3} strokeLinecap="round" />
          </g>
        ) : (
          <g transform="rotate(-24 150 150)">
            <path d="M 142 146 L 142 136 Q 142 124 152 124 Q 162 124 162 132" fill="none" stroke="#6b7280" strokeWidth={5} strokeLinecap="round" />
            <rect x={136} y={142} width={32} height={26} rx={7} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3.5} />
          </g>
        )}
      </g>

      {open ? (
        <>
          <g className={s.twinkle}><SparklePath x={40} y={56} r={9} fill="#fde68a" /></g>
          <g className={s.twinkle} style={{ animationDelay: '0.5s' }}><SparklePath x={166} y={44} r={11} fill="#ffffff" /></g>
          <g className={s.twinkle} style={{ animationDelay: '0.9s' }}><SparklePath x={120} y={18} r={8} fill="#fde68a" /></g>
          <g className={s.twinkle} style={{ animationDelay: '1.3s' }}><SparklePath x={70} y={24} r={7} fill="#ffffff" /></g>
        </>
      ) : (
        <g className={s.twinkle} style={{ animationDuration: '2.8s' }}><SparklePath x={160} y={70} r={8} fill="#ffffff" /></g>
      )}
    </svg>
  )
}
