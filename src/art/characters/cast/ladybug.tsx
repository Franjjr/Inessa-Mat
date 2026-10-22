/* Reina Mariquita — a glowing ladybug queen: red spotted shell, dark plum head with big shiny eyes,
   heart antennae and a tiny golden crown. Hovers in a soft warm glow. */
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Loop, Silhouette, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'

const SHELL = '#ef4444'
const SHELL_INK = '#9f1239'
const HEAD = '#46325a'
const HEAD_INK = '#24182f'
const SPOT = '#3b2a4a'

const FACE: FaceGeom = {
  eyes: [[84, 82], [116, 82]],
  ew: 9.5,
  eh: 11,
  ink: '#fbcfe8',
  pupil: '#24182f',
  sclera: '#ffffff',
  lidInk: '#fde2ea',
  lashes: true,
  mouth: [100, 104],
  mw: 8,
  cheeks: [[71, 99], [129, 99]],
  cheekR: [7.5, 4.6],
  cheekColor: '#f472b6',
  sw: 3.3,
  browLift: 19,
  mouthFill: '#be185d',
  tongue: '#f9a8d4',
}

const ARMS = { down: 16, in: 6, out: 70, up: 150, spread: 110, talk: 80, chest: -30, face: -132, chin: -138 }

function Arm() {
  return (
    <g>
      <path d="M-4.5 -2 L-4 16 L4 16 L4.5 -2 Z" fill={HEAD} {...ol(HEAD_INK, 4)} />
      <circle cx={0} cy={19} r={6} fill={HEAD} {...ol(HEAD_INK, 4)} />
    </g>
  )
}

function Antenna({ side }: { side: -1 | 1 }) {
  const x = 100 + side * 12
  const tx = 100 + side * 30
  return (
    <g>
      <path d={`M${x} 44 Q${x + side * 6} 24 ${tx} 16`} fill="none" stroke={HEAD_INK} strokeWidth={4} strokeLinecap="round" />
      <path
        d={`M${tx} 21 C${tx - 9} 15 ${tx - 7} 6 ${tx} 10 C${tx + 7} 6 ${tx + 9} 15 ${tx} 21 Z`}
        fill="#f472b6"
        {...ol(HEAD_INK, 3)}
      />
    </g>
  )
}

export const ladybug: CastDef = {
  label: 'Reina Mariquita',
  head: { cx: 100, cy: 80, r: 50 },
  float: true,
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = armAngle(posture.armR, 1, ARMS)
    const ant = posture.ears === 'droop' || posture.ears === 'flat' ? 18 : posture.ears === 'perk' ? -8 : 0
    return (
      <g>
        {/* soft glow */}
        <Loop cls={anim.glow} on={animated} self>
          <circle cx={100} cy={108} r={92} fill="#fef9c3" opacity={0.6} />
          <circle cx={100} cy={108} r={70} fill="#fef08a" opacity={0.5} />
        </Loop>
        <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 190px' }}>
          {/* feet */}
          <g fill={HEAD} {...ol(HEAD_INK, 4)}>
            <ellipse cx={84} cy={188} rx={8} ry={5} />
            <ellipse cx={116} cy={188} rx={8} ry={5} />
          </g>
          {/* shell */}
          <Silhouette fill={SHELL} ink={SHELL_INK}>
            <ellipse cx={100} cy={142} rx={54} ry={46} />
          </Silhouette>
          <path d="M100 112 L100 186" stroke={SHELL_INK} strokeWidth={4} strokeLinecap="round" />
          <g fill={SPOT}>
            <circle cx={74} cy={130} r={9.5} />
            <circle cx={126} cy={130} r={9.5} />
            <circle cx={66} cy={159} r={8} />
            <circle cx={134} cy={159} r={8} />
            <circle cx={86} cy={177} r={6} />
            <circle cx={114} cy={177} r={6} />
          </g>
          <ellipse cx={68} cy={112} rx={11} ry={5} fill="#ffffff" opacity={0.5} transform="rotate(-28 68 112)" />
          <Limb x={50} y={136} angle={aL}>
            <g transform="translate(50 136)"><Arm /></g>
          </Limb>
          <Limb x={150} y={136} angle={aR}>
            <g transform="translate(150 136)"><Arm /></g>
          </Limb>
          {/* head */}
          <Limb x={100} y={118} angle={posture.head}>
            <Limb x={88} y={44} angle={-ant}><Antenna side={-1} /></Limb>
            <Limb x={112} y={44} angle={ant}><Antenna side={1} /></Limb>
            <Silhouette fill={HEAD} ink={HEAD_INK}>
              <circle cx={100} cy={80} r={42} />
            </Silhouette>
            <ellipse cx={82} cy={54} rx={10} ry={5} fill="#6b5480" transform="rotate(-24 82 54)" />
            {/* tiny crown */}
            <path d="M86 44 L84 28 L93 35 L100 24 L107 35 L116 28 L114 44 Q100 48 86 44 Z" fill="#fcd34d" {...ol('#a16207', 3)} />
            <circle cx={100} cy={37} r={2.6} fill="#ef4444" />
            <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
          </Limb>
        </g>
      </g>
    )
  },
}
