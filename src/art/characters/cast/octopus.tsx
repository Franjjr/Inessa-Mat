/* Pulpo Octavio — a lavender octopus juggling a teapot, a paintbrush and a shell.
   When things go wrong (sad, worried, scared, sleepy) the objects drop to the floor. */
import type { CSSProperties, ReactNode } from 'react'
import type { Pose } from '@/types'
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Loop, Silhouette, SW, SW_FINE, anim, ol } from '../shared/frame'
import type { CastDef } from '../shared/cast'

const BODY = '#c4b5fd'
const INK = '#6d28d9'
const SPOT = '#a78bfa'

const FACE: FaceGeom = {
  eyes: [[80, 100], [120, 100]],
  ew: 10.5,
  eh: 12.5,
  ink: '#3b0764',
  mouth: [100, 122],
  mw: 8.5,
  cheeks: [[65, 118], [135, 118]],
  cheekR: [8.5, 5],
  cheekColor: '#f9a8d4',
  sw: 3.5,
  browLift: 20,
  mouthFill: '#701a75',
}

/** Juggling tentacles [viewer-left, viewer-right] (0 = hanging down). */
const ARMS: Record<Pose, [number, number]> = {
  idle: [126, -126],
  talk: [120, -96],
  happy: [140, -140],
  cheer: [156, -156],
  sad: [12, -12],
  worried: [-38, 38],
  scared: [-128, 128],
  think: [-146, -122],
  surprised: [104, -104],
  sleep: [6, -6],
}

type Spot = [number, number, number]
const AIR: [Spot, Spot, Spot] = [[34, 48, -10], [100, 18, -30], [166, 48, 12]]
const HIGH: [Spot, Spot, Spot] = [[28, 30, -34], [100, -8, -70], [172, 30, 34]]
const THINK: [Spot, Spot, Spot] = [[22, 96, -6], [100, 20, -24], [178, 104, 8]]
const FLOOR: [Spot, Spot, Spot] = [[18, 180, 0], [48, 192, -6], [184, 184, -12]]

function objectSpots(pose: Pose): [Spot, Spot, Spot] {
  if (pose === 'sad' || pose === 'worried' || pose === 'scared' || pose === 'sleep') return FLOOR
  if (pose === 'surprised') return HIGH
  if (pose === 'think') return THINK
  return AIR
}

const TENTACLES = [
  'M64 128 C50 148 32 158 28 174 C26 184 38 188 42 180',
  'M78 134 C72 156 62 170 64 182 C66 190 75 189 73 182',
  'M93 138 C91 158 89 174 93 186',
  'M107 138 C109 158 111 174 107 186',
  'M122 134 C128 156 138 170 136 182 C134 190 125 189 127 182',
  'M136 128 C150 148 168 158 172 174 C174 184 162 188 158 180',
]

const ARM_PATH = 'M0 0 C-6 14 -6 28 2 36 C6 40 12 38 10 32'

function Teapot() {
  return (
    <g>
      <path d="M12 -2 Q18 -4 21 -11" fill="none" stroke="#0f766e" strokeWidth={9} strokeLinecap="round" />
      <path d="M12 -2 Q18 -4 21 -11" fill="none" stroke="#5eead4" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M-12 -5 Q-22 -4 -20 3 Q-18 8 -11 6" fill="none" stroke="#0f766e" strokeWidth={3.4} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={13.5} ry={10.5} fill="#5eead4" {...ol('#0f766e', 3.2)} />
      <ellipse cx={0} cy={-10} rx={7.5} ry={3} fill="#99f6e4" {...ol('#0f766e', 2.6)} />
      <circle cx={0} cy={-14.5} r={2.6} fill="#fbbf24" {...ol('#0f766e', 2)} />
      <g fill="#ffffff">
        <circle cx={-5} cy={1} r={2} />
        <circle cx={4} cy={-3} r={1.6} />
        <circle cx={5} cy={4} r={1.6} />
      </g>
    </g>
  )
}

function Brush() {
  return (
    <g>
      <rect x={-17} y={-2.6} width={26} height={5.2} rx={2.6} fill="#fbbf24" {...ol('#b45309', 2.6)} />
      <rect x={8} y={-3.8} width={6} height={7.6} rx={1.2} fill="#e2e8f0" {...ol('#64748b', 2.2)} />
      <path d="M13.5 -4.4 Q23 -3 25 0 Q23 3 13.5 4.4 Z" fill="#f472b6" {...ol('#be185d', 2.4)} />
    </g>
  )
}

function Shell() {
  return (
    <g>
      <path d="M0 11 L-13 -1 Q-14 -13 0 -13 Q14 -13 13 -1 Z" fill="#fecdd3" {...ol('#be123c', 2.8)} />
      <path d="M0 10 L-7 -11 M0 10 L0 -13 M0 10 L7 -11" fill="none" stroke="#fb7185" strokeWidth={SW_FINE} strokeLinecap="round" />
      <path d="M-5 11 L5 11 L3 15 L-3 15 Z" fill="#fecdd3" {...ol('#be123c', 2.4)} />
    </g>
  )
}

function Tossed({ spot, juggling, delay, children }: { spot: Spot; juggling: boolean; delay: number; children: ReactNode }) {
  const style: CSSProperties = { transform: `translate(${spot[0]}px, ${spot[1]}px) rotate(${spot[2]}deg)` }
  return (
    <g className={anim.limb} style={style}>
      <Loop cls={anim.juggle} on={juggling} delay={delay} self>
        {children}
      </Loop>
    </g>
  )
}

function Tentacle({ d, w }: { d: string; w: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + SW * 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={BODY} strokeWidth={w} strokeLinecap="round" />
    </>
  )
}

export const octopus: CastDef = {
  label: 'Pulpo Octavio',
  head: { cx: 100, cy: 96, r: 54 },
  render: ({ pose, expr, posture, animated, delay }) => {
    const [aL, aR] = ARMS[pose]
    const spots = objectSpots(pose)
    const juggling = animated && (pose === 'idle' || pose === 'talk' || pose === 'happy' || pose === 'cheer')
    return (
      <g>
        <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 188px' }}>
          {/* lower tentacles: outlines first, then fills, for seamless curls */}
          <g fill="none" strokeLinecap="round">
            {TENTACLES.map((d) => <path key={`o${d}`} d={d} stroke={INK} strokeWidth={13 + SW * 2} />)}
            {TENTACLES.map((d) => <path key={`f${d}`} d={d} stroke={BODY} strokeWidth={13} />)}
          </g>
          <g fill="#ede9fe">
            <circle cx={93} cy={176} r={2.4} />
            <circle cx={92} cy={166} r={2} />
            <circle cx={107} cy={176} r={2.4} />
            <circle cx={108} cy={166} r={2} />
          </g>
          {/* juggling tentacles */}
          <Limb x={58} y={118} angle={aL}>
            <g transform="translate(58 118)">
              <Loop cls={anim.wiggle} x={0} y={0} on={juggling}>
                <Tentacle d={ARM_PATH} w={11} />
              </Loop>
            </g>
          </Limb>
          <Limb x={142} y={118} angle={aR}>
            <g transform="translate(142 118) scale(-1 1)">
              <Loop cls={anim.wiggle} x={0} y={0} on={juggling} delay={0.5}>
                <Tentacle d={ARM_PATH} w={11} />
              </Loop>
            </g>
          </Limb>
          {/* mantle */}
          <Limb x={100} y={140} angle={posture.head * 0.6}>
            <Silhouette fill={BODY} ink={INK}>
              <path d="M48 104 C44 64 70 42 100 42 C130 42 156 64 152 104 C150 128 136 142 100 142 C64 142 50 128 48 104 Z" />
            </Silhouette>
            <g fill={SPOT}>
              <circle cx={78} cy={64} r={6} />
              <circle cx={106} cy={55} r={4} />
              <circle cx={126} cy={70} r={5} />
              <circle cx={66} cy={86} r={3} />
            </g>
            <ellipse cx={86} cy={52} rx={9} ry={4.5} fill="#ede9fe" transform="rotate(-18 86 52)" />
            <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
          </Limb>
        </g>
        {/* the juggled objects glide between the air and the floor */}
        <Tossed spot={spots[0]} juggling={juggling} delay={0}><Teapot /></Tossed>
        <Tossed spot={spots[1]} juggling={juggling} delay={0.37}><Brush /></Tossed>
        <Tossed spot={spots[2]} juggling={juggling} delay={0.74}><Shell /></Tossed>
      </g>
    )
  },
}
