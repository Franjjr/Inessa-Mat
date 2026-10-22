/* Niebla del Olvido overlay: a soft veil, drifting fog banks and slow grey swirls. */
import clsx from 'clsx'
import { memo } from 'react'
import a from './ambient.module.css'
import { IdScope, Sprite, Stage, useIds } from './kit'
import s from './WorldBackground.module.css'

const BANKS: { x: number; y: number; w: number; h: number; d: number; dl: number }[] = [
  { x: -200, y: 120, w: 900, h: 260, d: 46, dl: -10 },
  { x: 900, y: 60, w: 900, h: 240, d: 52, dl: -30 },
  { x: 300, y: 430, w: 1100, h: 300, d: 58, dl: -18 },
  { x: -300, y: 650, w: 1000, h: 360, d: 50, dl: -5 },
  { x: 800, y: 690, w: 1100, h: 340, d: 44, dl: -26 },
]

const SWIRLS: { x: number; y: number; r: number; d: number; rev?: boolean }[] = [
  { x: 330, y: 300, r: 70, d: 34 },
  { x: 1290, y: 240, r: 56, d: 28, rev: true },
  { x: 560, y: 760, r: 60, d: 40, rev: true },
  { x: 1120, y: 640, r: 76, d: 36 },
  { x: 820, y: 180, r: 44, d: 30 },
]

function spiral(cx: number, cy: number, r: number): string {
  // Archimedean spiral, 2.25 turns, as a smooth polyline path.
  const pts: string[] = []
  const turns = 2.25
  const n = 64
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const ang = t * turns * Math.PI * 2
    const rad = r * (0.12 + 0.88 * t)
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)} ${(cy + rad * Math.sin(ang)).toFixed(1)}`)
  }
  return 'M ' + pts.join(' L ')
}

function FogArt() {
  const ids = useIds()
  return (
    <Stage w={1600} h={1000} anchor="cover">
      {BANKS.map((b, i) => (
        <Sprite key={i} x={b.x} y={b.y} w={b.w} h={b.h} className={a.drift} vars={{ '--d': `${b.d}s`, '--dl': `${b.dl}s`, '--dx': '9%' }}>
          <defs>
            <radialGradient id={ids(`bank${i}`)}>
              <stop offset="0%" stopColor="#eef0f5" stopOpacity={0.8} />
              <stop offset="55%" stopColor="#e3e5ee" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#dcdfe9" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={b.x + b.w / 2} cy={b.y + b.h / 2} rx={b.w / 2} ry={b.h / 2} fill={ids.url(`bank${i}`)} />
          <ellipse cx={b.x + b.w * 0.3} cy={b.y + b.h * 0.42} rx={b.w * 0.24} ry={b.h * 0.3} fill={ids.url(`bank${i}`)} />
        </Sprite>
      ))}
      {SWIRLS.map((w, i) => (
        <Sprite
          key={`s${i}`}
          x={w.x - w.r * 1.3}
          y={w.y - w.r * 1.3}
          w={w.r * 2.6}
          h={w.r * 2.6}
          className={a.drift}
          vars={{ '--d': `${w.d * 1.3}s`, '--dx': '35%' }}
          inner={a.spin}
          innerVars={{ '--d': `${w.d}s`, ...(w.rev ? { animationDirection: 'reverse' } : null) }}
        >
          <path d={spiral(w.x, w.y, w.r)} fill="none" stroke="#a7abbb" strokeOpacity={0.55} strokeWidth={w.r * 0.11} strokeLinecap="round" />
          <path d={spiral(w.x, w.y, w.r * 0.62)} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={w.r * 0.07} strokeLinecap="round" transform={`rotate(150 ${w.x} ${w.y})`} />
        </Sprite>
      ))}
    </Stage>
  )
}

/** amount 0..1 (0 = no fog). */
export const Fog = memo(function Fog({ amount }: { amount: number }) {
  const gone = amount <= 0.005
  return (
    <div className={clsx(s.fog, gone && s.fogGone)} style={{ opacity: Math.min(1, amount * 1.05) }} data-fog={amount.toFixed(2)}>
      <div className={s.veil} />
      <IdScope>
        <FogArt />
      </IdScope>
    </div>
  )
})
