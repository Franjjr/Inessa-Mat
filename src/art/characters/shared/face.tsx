/* Shared face renderer: eyes, brows, mouth, cheeks and tears for any character.
   Each character supplies its face geometry; the pose's Expression picks the shapes. */
import type { ReactNode } from 'react'
import s from './anim.module.css'
import type { BrowKind, Expression, EyeKind, MouthKind } from './pose'

export interface FaceGeom {
  /** Eye centres (1 eye for profile characters such as Lumi). */
  eyes: Array<[number, number]>
  /** Eye half-width / half-height. */
  ew: number
  eh: number
  /** Line colour for brows, closed eyes and mouth lines. */
  ink: string
  /** Pupil colour (default ink). */
  pupil?: string
  /** If set, eyes get a sclera of this colour (dark-faced characters). */
  sclera?: string
  /** Colour of line-only eyes (happy/closed). Default ink. */
  lidInk?: string
  lashes?: boolean
  /** 'front' faces the viewer; 'right' is a profile/3-4 view looking to the right. */
  facing?: 'front' | 'right'
  mouth: [number, number]
  /** Mouth half-width. */
  mw: number
  mouthFill?: string
  tongue?: string
  cheeks?: Array<[number, number]>
  cheekR?: [number, number]
  cheekColor?: string
  /** Feature line width. */
  sw?: number
  /** Distance from eye centre to brow (default eh * 1.55). */
  browLift?: number
  /** Brow colour (default ink). */
  browInk?: string
  /** Cat-style "w" mouth for the resting smile. */
  catMouth?: boolean
  /** The character draws its own mouth (e.g. the owl's beak). */
  noMouth?: boolean
}

const WHITE = '#ffffff'

function Eye({ x, y, kind, g, side }: { x: number; y: number; kind: EyeKind; g: FaceGeom; side: -1 | 1 }) {
  const w = g.ew
  const h = g.eh
  const sw = g.sw ?? 3.6
  const lid = g.lidInk ?? g.ink
  const pupil = g.pupil ?? g.ink
  const profile = g.facing === 'right'
  const lashes: ReactNode[] = []

  if (kind === 'happy') {
    if (g.lashes) {
      lashes.push(
        <path key="l" d={`M${x + side * w * 0.95} ${y + h * 0.18} l${side * w * 0.5} ${-h * 0.32}`} stroke={lid} strokeWidth={sw * 0.8} strokeLinecap="round" />,
      )
    }
    return (
      <g>
        <path d={`M${x - w * 1.02} ${y + h * 0.32} Q${x} ${y - h * 1.15} ${x + w * 1.02} ${y + h * 0.32}`} stroke={lid} strokeWidth={sw * 1.15} fill="none" strokeLinecap="round" />
        {lashes}
      </g>
    )
  }
  if (kind === 'closed') {
    if (g.lashes) {
      const lx = profile ? -1 : side
      lashes.push(
        <path key="l1" d={`M${x + lx * w * 0.55} ${y + h * 0.5} l${lx * w * 0.22} ${h * 0.42}`} stroke={lid} strokeWidth={sw * 0.75} strokeLinecap="round" />,
        <path key="l2" d={`M${x + lx * w * 0.95} ${y + h * 0.15} l${lx * w * 0.42} ${h * 0.32}`} stroke={lid} strokeWidth={sw * 0.75} strokeLinecap="round" />,
      )
    }
    return (
      <g>
        <path d={`M${x - w * 1.02} ${y} Q${x} ${y + h * 0.95} ${x + w * 1.02} ${y}`} stroke={lid} strokeWidth={sw * 1.1} fill="none" strokeLinecap="round" />
        {lashes}
      </g>
    )
  }

  // Open-ish eyes.
  let dx = 0
  let dy = 0
  if (kind === 'look') { dx = profile ? w * 0.18 : w * 0.24; dy = -h * 0.24 }
  if (kind === 'teary') dy = h * 0.08

  if (g.lashes) {
    if (profile) {
      lashes.push(
        <path key="l1" d={`M${x - w * 0.55} ${y - h * 1.12} l${-w * 0.42} ${-h * 0.5}`} stroke={g.ink} strokeWidth={sw * 0.72} strokeLinecap="round" />,
        <path key="l2" d={`M${x - w * 0.02} ${y - h * 1.22} l${-w * 0.1} ${-h * 0.58}`} stroke={g.ink} strokeWidth={sw * 0.72} strokeLinecap="round" />,
        <path key="l3" d={`M${x + w * 0.52} ${y - h * 1.14} l${w * 0.18} ${-h * 0.54}`} stroke={g.ink} strokeWidth={sw * 0.72} strokeLinecap="round" />,
      )
    } else {
      const k = kind === 'wide' ? 1.18 : 1
      lashes.push(
        <path key="l1" d={`M${x + side * w * 0.62 * k} ${y - h * 0.8 * k} l${side * w * 0.42} ${-h * 0.42}`} stroke={g.ink} strokeWidth={sw * 0.72} strokeLinecap="round" />,
        <path key="l2" d={`M${x + side * w * 0.95 * k} ${y - h * 0.34 * k} l${side * w * 0.52} ${-h * 0.2}`} stroke={g.ink} strokeWidth={sw * 0.72} strokeLinecap="round" />,
      )
    }
  }

  if (kind === 'wide') {
    const pr = Math.min(w, h) * 0.62
    return (
      <g>
        {lashes}
        <ellipse cx={x} cy={y} rx={w * 1.18} ry={h * 1.14} fill={WHITE} stroke={g.ink} strokeWidth={sw * 0.8} />
        <ellipse cx={x + (profile ? w * 0.12 : 0)} cy={y + h * 0.05} rx={pr} ry={pr * 1.08} fill={pupil} />
        <circle cx={x + (profile ? w * 0.12 : 0) + pr * 0.38} cy={y - pr * 0.36} r={pr * 0.36} fill={WHITE} />
      </g>
    )
  }

  if (g.sclera) {
    return (
      <g>
        {lashes}
        <ellipse cx={x} cy={y} rx={w * 1.12} ry={h * 1.08} fill={g.sclera} />
        <ellipse cx={x + dx * 0.7} cy={y + dy * 0.7 + h * 0.1} rx={w * 0.76} ry={h * 0.8} fill={pupil} />
        <circle cx={x + dx * 0.7 + w * 0.28} cy={y + dy * 0.7 - h * 0.22} r={w * 0.32} fill={WHITE} />
        <circle cx={x + dx * 0.7 - w * 0.3} cy={y + dy * 0.7 + h * 0.48} r={w * 0.15} fill={WHITE} opacity={0.85} />
        {kind === 'teary' && <ellipse cx={x} cy={y + h * 0.62} rx={w * 0.62} ry={h * 0.2} fill="#bfdbfe" opacity={0.9} />}
      </g>
    )
  }

  return (
    <g>
      {lashes}
      <ellipse cx={x + dx * 0.4} cy={y + dy * 0.4} rx={w} ry={h} fill={pupil} />
      <circle cx={x + dx + w * 0.3} cy={y + dy - h * 0.36} r={w * 0.42} fill={WHITE} />
      <circle cx={x + dx - w * 0.34} cy={y + dy + h * 0.4} r={w * 0.2} fill={WHITE} opacity={0.85} />
      {kind === 'teary' && <path d={`M${x - w * 0.8} ${y + h * 0.45} Q${x} ${y + h * 1.0} ${x + w * 0.8} ${y + h * 0.45}`} stroke="#93c5fd" strokeWidth={sw * 0.9} fill="none" strokeLinecap="round" />}
    </g>
  )
}

function Brow({ x, y, kind, g, side, index }: { x: number; y: number; kind: BrowKind; g: FaceGeom; side: -1 | 1; index: number }) {
  if (kind === 'none') return null
  const w = g.ew
  const h = g.eh
  const sw = (g.sw ?? 3.6) * 0.95
  const by = y - (g.browLift ?? h * 1.55)
  const ink = g.browInk ?? g.ink
  const profile = g.facing === 'right'
  // "inner" = toward the face centre (front) or toward the snout (profile, facing right).
  const inner = profile ? 1 : -side
  let d = ''
  if (kind === 'raised') {
    d = `M${x - w * 0.8} ${by - h * 0.25} Q${x} ${by - h * 0.85} ${x + w * 0.8} ${by - h * 0.25}`
  } else if (kind === 'worried') {
    const ox = x - inner * w * 0.85
    const ix = x + inner * w * 0.7
    d = `M${ox} ${by + h * 0.12} Q${(ox + ix) / 2} ${by - h * 0.05} ${ix} ${by - h * 0.5}`
  } else if (kind === 'mischief') {
    const ox = x - inner * w * 0.85
    const ix = x + inner * w * 0.65
    d = `M${ox} ${by - h * 0.42} Q${(ox + ix) / 2} ${by - h * 0.3} ${ix} ${by + h * 0.12}`
  } else if (kind === 'think') {
    const up = profile || index === 0
    d = up
      ? `M${x - w * 0.8} ${by - h * 0.15} Q${x} ${by - h * 0.75} ${x + w * 0.8} ${by - h * 0.25}`
      : `M${x - w * 0.75} ${by + h * 0.12} L${x + w * 0.75} ${by + h * 0.02}`
  }
  return <path d={d} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />
}

function Mouth({ kind, g, animated }: { kind: MouthKind; g: FaceGeom; animated: boolean }) {
  const [x, y] = g.mouth
  const w = g.mw
  const sw = g.sw ?? 3.6
  const ink = g.ink
  const fill = g.mouthFill ?? '#7a2848'
  const tongue = g.tongue ?? '#fb7185'
  const line = { stroke: ink, strokeWidth: sw, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (kind) {
    case 'smile':
      if (g.catMouth) {
        return <path d={`M${x - w} ${y - w * 0.05} Q${x - w * 0.5} ${y + w * 0.6} ${x} ${y} Q${x + w * 0.5} ${y + w * 0.6} ${x + w} ${y - w * 0.05}`} {...line} />
      }
      return <path d={`M${x - w} ${y} Q${x} ${y + w * 0.85} ${x + w} ${y}`} {...line} />
    case 'grin':
      return (
        <g>
          <path d={`M${x - w * 1.05} ${y - w * 0.1} Q${x} ${y - w * 0.02} ${x + w * 1.05} ${y - w * 0.1} Q${x + w * 0.9} ${y + w * 1.25} ${x} ${y + w * 1.22} Q${x - w * 0.9} ${y + w * 1.25} ${x - w * 1.05} ${y - w * 0.1} Z`} fill={fill} stroke={ink} strokeWidth={sw * 0.85} strokeLinejoin="round" />
          <path d={`M${x - w * 0.55} ${y + w * 0.95} Q${x} ${y + w * 0.42} ${x + w * 0.55} ${y + w * 0.95} Q${x} ${y + w * 1.2} ${x - w * 0.55} ${y + w * 0.95} Z`} fill={tongue} />
        </g>
      )
    case 'talk':
      return (
        <g className={animated ? s.talk : undefined} style={{ transformOrigin: `${x}px ${y - w * 0.1}px` }}>
          <ellipse cx={x} cy={y + w * 0.38} rx={w * 0.62} ry={w * 0.55} fill={fill} stroke={ink} strokeWidth={sw * 0.85} />
          <ellipse cx={x} cy={y + w * 0.66} rx={w * 0.36} ry={w * 0.2} fill={tongue} />
        </g>
      )
    case 'frown':
      return <path d={`M${x - w * 0.8} ${y + w * 0.5} Q${x} ${y - w * 0.32} ${x + w * 0.8} ${y + w * 0.5}`} {...line} />
    case 'wobble': {
      const a = w * 0.85
      const st = (a * 2) / 4
      return <path d={`M${x - a} ${y + w * 0.25} q${st / 2} ${-w * 0.32} ${st} 0 t${st} 0 t${st} 0 t${st} 0`} {...line} />
    }
    case 'o':
      return <ellipse cx={x} cy={y + w * 0.35} rx={w * 0.38} ry={w * 0.48} fill={fill} stroke={ink} strokeWidth={sw * 0.85} />
    case 'eek':
      return (
        <path
          d={`M${x - w * 0.85} ${y + w * 0.2} Q${x - w * 0.42} ${y - w * 0.2} ${x} ${y + w * 0.12} Q${x + w * 0.42} ${y - w * 0.2} ${x + w * 0.85} ${y + w * 0.2} Q${x + w * 0.4} ${y + w * 0.95} ${x} ${y + w * 0.9} Q${x - w * 0.4} ${y + w * 0.95} ${x - w * 0.85} ${y + w * 0.2} Z`}
          fill={fill}
          stroke={ink}
          strokeWidth={sw * 0.85}
          strokeLinejoin="round"
        />
      )
    case 'hmm':
      return <path d={`M${x - w * 0.45} ${y + w * 0.3} Q${x + w * 0.1} ${y + w * 0.42} ${x + w * 0.6} ${y + w * 0.05}`} {...line} />
    case 'smirk':
      return (
        <g>
          <path d={`M${x - w} ${y + w * 0.05} Q${x + w * 0.1} ${y + w * 0.75} ${x + w * 1.05} ${y - w * 0.3}`} {...line} />
          <path d={`M${x + w * 0.92} ${y - w * 0.42} l${w * 0.26} ${w * 0.2}`} {...line} strokeWidth={sw * 0.8} />
        </g>
      )
    case 'snore':
      return <ellipse cx={x} cy={y + w * 0.3} rx={w * 0.26} ry={w * 0.3} fill={fill} stroke={ink} strokeWidth={sw * 0.75} />
  }
}

export function Tear({ x, y, size = 1, animated }: { x: number; y: number; size?: number; animated: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <g className={animated ? s.drip : undefined}>
        <path d="M0 -6 C3 -1.5 5.5 1.5 5.5 4.4 A5.5 5.5 0 0 1 -5.5 4.4 C-5.5 1.5 -3 -1.5 0 -6 Z" fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.8} strokeLinejoin="round" />
        <circle cx={-1.6} cy={3.6} r={1.4} fill="#fff" />
      </g>
    </g>
  )
}

export interface FaceProps {
  g: FaceGeom
  expr: Expression
  animated: boolean
  blinks: boolean
  /** CSS animation-delay for the blink, to desync characters. */
  delay?: number
  /** Changing this remounts the face so the new expression pops in softly. */
  poseKey?: string
}

/** Draws brows, eyes (with blink), cheeks, mouth and tears. */
export function Face({ g, expr, animated, blinks, delay = 0, poseKey }: FaceProps) {
  const cx = g.eyes.reduce((a, e) => a + e[0], 0) / g.eyes.length
  const ey = g.eyes.reduce((a, e) => a + e[1], 0) / g.eyes.length
  const sideOf = (x: number): -1 | 1 => (g.facing === 'right' ? 1 : x < cx - 0.5 ? -1 : 1)
  const glow = expr.blush === 'glow'
  const [crx, cry] = g.cheekR ?? [g.ew * 1.05, g.ew * 0.62]
  const blinkable = blinks && (expr.eyes === 'open' || expr.eyes === 'look' || expr.eyes === 'teary')
  return (
    <g key={poseKey} className={animated ? s.faceIn : undefined} style={{ transformOrigin: `${cx}px ${ey}px` }}>
      {g.cheeks?.map(([x, y], i) => (
        <ellipse key={`c${i}`} cx={x} cy={y} rx={crx * (glow ? 1.12 : 1)} ry={cry * (glow ? 1.12 : 1)} fill={g.cheekColor ?? '#f9a8d4'} opacity={glow ? 0.95 : 0.72} />
      ))}
      <g
        className={animated && blinkable ? s.blink : undefined}
        style={{ transformOrigin: `${cx}px ${ey}px`, animationDelay: `${delay}s` }}
      >
        {g.eyes.map(([x, y], i) => (
          <Eye key={`e${i}`} x={x} y={y} kind={expr.eyes} g={g} side={sideOf(x)} />
        ))}
      </g>
      {g.eyes.map(([x, y], i) => (
        <Brow key={`b${i}`} x={x} y={y} kind={expr.brows} g={g} side={sideOf(x)} index={i} />
      ))}
      {!g.noMouth && <Mouth kind={expr.mouth} g={g} animated={animated} />}
      {expr.extras.includes('tear') &&
        g.eyes.slice(0, g.facing === 'right' ? 1 : 2).map(([x, y], i) => (
          <Tear key={`t${i}`} x={x + (g.facing === 'right' ? -g.ew * 0.6 : sideOf(x) * g.ew * 0.75)} y={y + g.eh * 1.45} size={Math.max(0.7, g.ew / 9)} animated={animated} />
        ))}
    </g>
  )
}
