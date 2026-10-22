/* Shared scene parts: stretched sky gradient, particle fields and deterministic layouts. */
import type { ReactNode } from 'react'
import a from '../ambient.module.css'
import { Art, Lane, seeded, Sprite, Stage, useIds, useTint } from '../kit'
import { Cloud, SparklePath, starPoints } from '../shapes'
import { shade } from '../color'

/** Stretched vertical gradient sky (no shapes, so stretching never distorts anything). */
export function Sky({ stops }: { stops: [number, string][] }) {
  const ids = useIds()
  const t = useTint()
  return (
    <Stage w={100} h={100} anchor="full">
      <Art>
        <defs>
          <linearGradient id={ids('sky')} x1="0" y1="0" x2="0" y2="1">
            {stops.map(([o, c]) => <stop key={o} offset={`${o}%`} stopColor={t(c)} />)}
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={100} height={100} fill={ids.url('sky')} />
      </Art>
    </Stage>
  )
}

/** Rolling silhouette of round tree tops: path from x0..x1 around baseline y, closed down to `bottom`. */
export function bumpLine(x0: number, x1: number, y: number, rMin: number, rMax: number, seed: number, bottom = 1000): string {
  const rnd = seeded(seed)
  let d = `M ${x0} ${bottom} L ${x0} ${y}`
  let x = x0
  let cy = y
  while (x < x1) {
    const r = rMin + rnd() * (rMax - rMin)
    const ny = y + (rnd() - 0.5) * rMin * 0.8
    d += ` A ${r.toFixed(1)} ${(r * 0.92).toFixed(1)} 0 0 1 ${(x + r * 2).toFixed(1)} ${ny.toFixed(1)}`
    x += r * 2
    cy = ny
  }
  return d + ` L ${x.toFixed(1)} ${cy.toFixed(1)} L ${x.toFixed(1)} ${bottom} Z`
}

/** Drifting clouds as composited sprites. */
export function DriftClouds({ clouds, stroke = '#c7d2fe', fill = '#ffffff' }: { clouds: { x: number; y: number; s: number; d: number; dl?: number; flip?: boolean }[]; stroke?: string; fill?: string }) {
  return (
    <>
      {clouds.map((c, i) => (
        <Sprite key={i} x={c.x - 100 * c.s} y={c.y - 90 * c.s} w={200 * c.s} h={100 * c.s} className={a.drift} vars={{ '--d': `${c.d}s`, '--dl': `${c.dl ?? -i * 7}s`, '--dx': '22%' }}>
          <Cloud x={c.x} y={c.y} s={c.s} stroke={stroke} fill={fill} flip={c.flip} />
        </Sprite>
      ))}
    </>
  )
}

export interface FieldOpts {
  count: number
  seed: number
  /** Horizontal range in stage units. */
  x0?: number
  x1?: number
  y?: number
  h?: number
  size?: [number, number]
  dur?: [number, number]
  swayDur?: [number, number]
  dir?: 'fall' | 'rise'
  laneClass?: string
  particleClass?: string
  opacity?: number
  render: (i: number) => ReactNode
}

/** Field of falling / rising particles across a stage (leaves, petals, snow, bubbles, sparks). */
export function ParticleField({ count, seed, x0 = 40, x1 = 1560, y = -60, h = 1120, size = [22, 34], dur = [12, 18], swayDur = [2.6, 4.2], dir = 'fall', laneClass, particleClass, opacity, render }: FieldOpts) {
  const rnd = seeded(seed)
  const items = Array.from({ length: count }, (_, i) => {
    const slot = (x1 - x0) / count
    return {
      i,
      x: x0 + slot * (i + 0.15 + rnd() * 0.7),
      size: size[0] + rnd() * (size[1] - size[0]),
      d: dur[0] + rnd() * (dur[1] - dur[0]),
      sd: swayDur[0] + rnd() * (swayDur[1] - swayDur[0]),
      dl: -rnd() * dur[1],
    }
  })
  return (
    <>
      {items.map((p) => (
        <Lane
          key={p.i}
          x={p.x}
          y={y}
          h={h}
          size={p.size}
          dir={dir}
          laneClass={laneClass ?? (dir === 'fall' ? a.fall : a.rise)}
          particleClass={particleClass ?? a.sway}
          vars={{ '--d': `${p.d.toFixed(1)}s`, '--dl': `${p.dl.toFixed(1)}s`, '--sd': `${p.sd.toFixed(1)}s`, ...(opacity != null ? { '--op': opacity } : null) }}
        >
          {render(p.i)}
        </Lane>
      ))}
    </>
  )
}

/** Twinkling points (stars, fireflies, dust) as tiny sprites. */
export function Twinkles({ points, color, r = 10, kind = 'sparkle', glow, className }: { points: [number, number][]; color: string; r?: number; kind?: 'sparkle' | 'star' | 'dot'; glow?: string; className?: string }) {
  const t = useTint()
  return (
    <>
      {points.map(([x, y], i) => (
        <Sprite key={i} x={x - r * 2} y={y - r * 2} w={r * 4} h={r * 4} className={className ?? a.twinkle} vars={{ '--d': `${2.4 + ((i * 7) % 5) * 0.5}s`, '--dl': `${-((i * 13) % 9) * 0.45}s` }}>
          {glow && <circle cx={x} cy={y} r={r * 1.9} fill={t(glow)} opacity={0.28} />}
          {kind === 'sparkle' && <SparklePath x={x} y={y} r={r} fill={t(color)} />}
          {kind === 'star' && <polygon points={starPoints(x, y, r)} fill={t(color)} stroke={t(shade(color, 0.2))} strokeWidth={r * 0.18} strokeLinejoin="round" />}
          {kind === 'dot' && <circle cx={x} cy={y} r={r * 0.55} fill={t(color)} />}
        </Sprite>
      ))}
    </>
  )
}
