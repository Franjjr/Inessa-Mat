/* Reina Aurora — a kind queen: long chestnut waves, a golden crown with jewels in the world colours,
   a golden gown and a rose cape with a fluffy collar. */
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Silhouette, SW_DETAIL, SW_FINE, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'

const SKIN = '#f3c9a6'
const SKIN_INK = '#a8643f'
const HAIR = '#9a5530'
const HAIR_INK = '#5a2d17'
const GOLD = '#fcd34d'
const GOLD_INK = '#a16207'
const GOLD_LIGHT = '#fef3c7'
const CAPE = '#f9a8d4'
const CAPE_INK = '#be185d'

const FACE: FaceGeom = {
  eyes: [[84, 76], [116, 76]],
  ew: 8.2,
  eh: 10,
  ink: '#3f1d0b',
  lashes: true,
  mouth: [100, 94],
  mw: 7.5,
  cheeks: [[73, 89], [127, 89]],
  cheekR: [7.5, 4.6],
  cheekColor: '#f49ab8',
  sw: 3.3,
  browLift: 16,
  browInk: HAIR_INK,
  mouthFill: '#9d174d',
}

const ARMS = { down: 18, in: 8, out: 64, up: 152, spread: 110, talk: 76, chest: -36, face: -140, chin: -146 }
const JEWELS = ['#15803d', '#2563eb', '#dc2626', '#0e7490', '#7c3aed', '#c026d3', '#ea580c', '#a16207']

function Arm() {
  return (
    <g>
      <path d="M-4.8 4 L-4.4 22 L4.4 22 L4.8 4 Z" fill={SKIN} {...ol(SKIN_INK, 4)} />
      <circle cx={0} cy={25} r={5.8} fill={SKIN} {...ol(SKIN_INK, 4)} />
      {/* puffy sleeve */}
      <ellipse cx={0} cy={3} rx={8.5} ry={8} fill={GOLD} {...ol(GOLD_INK, 4)} />
    </g>
  )
}

export const queen: CastDef = {
  label: 'Reina Aurora',
  head: { cx: 100, cy: 70, r: 50 },
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = armAngle(posture.armR, 1, ARMS)
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 194px' }}>
        {/* cape */}
        <path d="M76 112 Q42 140 30 192 L170 192 Q158 140 124 112 Z" fill={CAPE} {...ol(CAPE_INK)} />
        <path d="M44 172 Q48 150 64 132 M156 172 Q152 150 136 132" fill="none" stroke="#fbcfe8" strokeWidth={4} strokeLinecap="round" />
        {/* long hair behind */}
        <Limb x={100} y={112} angle={posture.head * 0.5}>
          <path d="M58 76 C52 42 76 28 100 28 C124 28 148 42 142 76 C146 104 152 126 140 140 C132 136 128 128 126 120 L74 120 C72 128 68 136 60 140 C48 126 54 104 58 76 Z" fill={HAIR} {...ol(HAIR_INK)} />
        </Limb>
        {/* gown */}
        <Silhouette fill={GOLD} ink={GOLD_INK}>
          <path d="M79 112 Q100 118 121 112 L120 136 Q146 160 150 190 Q100 198 50 190 Q54 160 80 136 Z" />
        </Silhouette>
        <path d="M54 182 Q64 176 74 182 Q84 188 94 182 Q104 176 114 182 Q124 188 134 182 Q142 177 147 181" fill="none" stroke={GOLD_INK} strokeWidth={SW_FINE} strokeLinecap="round" />
        <path d="M82 136 Q100 142 118 136" fill="none" stroke={GOLD_LIGHT} strokeWidth={6} strokeLinecap="round" />
        <path d="M100 144 L100 176" stroke={GOLD_LIGHT} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 9" />
        <g fill={GOLD_LIGHT}>
          <path d="M74 166 l3 -5 l3 5 l-3 5 Z" />
          <path d="M120 166 l3 -5 l3 5 l-3 5 Z" />
        </g>
        <path d="M94 120 L100 128 L106 120" fill="none" stroke={GOLD_INK} strokeWidth={SW_FINE} strokeLinecap="round" strokeLinejoin="round" />
        {/* fluffy collar */}
        <g fill="#ffffff" {...ol('#cbd5e1', 2.6)}>
          <circle cx={78} cy={112} r={7} />
          <circle cx={122} cy={112} r={7} />
          <circle cx={88} cy={116} r={6} />
          <circle cx={112} cy={116} r={6} />
        </g>
        {/* arms */}
        <Limb x={77} y={119} angle={aL}>
          <g transform="translate(77 119)"><Arm /></g>
        </Limb>
        <Limb x={123} y={119} angle={aR}>
          <g transform="translate(123 119)"><Arm /></g>
        </Limb>
        {/* head */}
        <Limb x={100} y={112} angle={posture.head}>
          <Silhouette fill={SKIN} ink={SKIN_INK} w={4}>
            <ellipse cx={100} cy={76} rx={35} ry={33} />
            <rect x={93} y={100} width={14} height={14} rx={4} />
          </Silhouette>
          {/* earrings */}
          <circle cx={65} cy={88} r={3} fill={GOLD} {...ol(GOLD_INK, 2)} />
          <circle cx={135} cy={88} r={3} fill={GOLD} {...ol(GOLD_INK, 2)} />
          {/* side-swept bangs */}
          <path d="M64 78 C60 52 80 38 102 38 C124 38 140 52 136 78 C132 66 124 58 114 56 C102 54 90 58 82 66 C76 64 70 70 64 78 Z" fill={HAIR} {...ol(HAIR_INK, 4)} />
          <path d="M80 50 Q90 44 102 44" fill="none" stroke="#c07a4e" strokeWidth={3} strokeLinecap="round" />
          {/* crown */}
          <path d="M72 46 L70 18 L84 32 L100 10 L116 32 L130 18 L128 46 Q100 54 72 46 Z" fill={GOLD} {...ol(GOLD_INK, SW_DETAIL)} />
          <path d="M74 42 Q100 49 126 42" fill="none" stroke={GOLD_LIGHT} strokeWidth={3} strokeLinecap="round" />
          <circle cx={70} cy={17} r={3.6} fill={GOLD_LIGHT} {...ol(GOLD_INK, 2)} />
          <circle cx={100} cy={9} r={4} fill={GOLD_LIGHT} {...ol(GOLD_INK, 2)} />
          <circle cx={130} cy={17} r={3.6} fill={GOLD_LIGHT} {...ol(GOLD_INK, 2)} />
          <path d="M100 26 L106 34 L100 42 L94 34 Z" fill="#f472b6" {...ol('#be185d', 2)} />
          {JEWELS.filter((_, i) => i % 2 === 0).map((c, i) => (
            <circle key={c} cx={[80, 90, 110, 120][i]} cy={[42, 44, 44, 42][i]} r={2.6} fill={c} />
          ))}
          <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
        </Limb>
      </g>
    )
  },
}
