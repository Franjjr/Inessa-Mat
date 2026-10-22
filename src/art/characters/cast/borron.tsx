/* Borrón — a small grey fluffy cloud-goblin: pointy wisp ears, a curl on top, stubby arms,
   big eyes and a mischievous smirk. Floats. */
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Silhouette, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'

const FILL = '#e5e7eb'
const INK = '#6b7280'
const SHADE = '#d1d5db'

const FACE: FaceGeom = {
  eyes: [[81, 106], [119, 106]],
  ew: 11.5,
  eh: 14.5,
  ink: '#374151',
  mouth: [100, 133],
  mw: 10,
  cheeks: [[62, 127], [138, 127]],
  cheekR: [9, 5.5],
  cheekColor: '#f9a8d4',
  sw: 3.6,
  mouthFill: '#4b5563',
  tongue: '#f9a8d4',
}

const ARMS = { down: 14, in: 4, out: 70, up: 150, spread: 112, talk: 82, chest: -38, face: -138, chin: -140 }

function Arm() {
  return <path d="M-9 0 A9 9 0 0 1 9 0 L9.5 11 A9.5 9.5 0 0 1 -9.5 11 Z" fill={FILL} {...ol(INK)} />
}

export const borron: CastDef = {
  label: 'Borrón',
  head: { cx: 100, cy: 104, r: 58 },
  float: true,
  render: ({ pose, expr, posture, animated, delay }) => {
    // Borrón is cheeky by default.
    const e =
      pose === 'idle' ? { ...expr, mouth: 'smirk' as const, brows: 'mischief' as const }
        : pose === 'talk' ? { ...expr, brows: 'mischief' as const }
          : expr
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = armAngle(posture.armR, 1, ARMS)
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 170px' }}>
        {/* little fog wisps */}
        <g fill="none" stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" opacity={0.9}>
          <path d="M34 172 q8 -7 16 0 t16 0" />
          <path d="M140 178 q7 -6 14 0 t14 0" />
        </g>
        <Limb x={100} y={150} angle={posture.head * 0.6}>
          <Silhouette fill={FILL} ink={INK}>
            <circle cx={100} cy={106} r={50} />
            <circle cx={60} cy={120} r={31} />
            <circle cx={140} cy={120} r={31} />
            <circle cx={76} cy={78} r={29} />
            <circle cx={124} cy={80} r={27} />
            <circle cx={100} cy={142} r={30} />
            <circle cx={68} cy={146} r={21} />
            <circle cx={132} cy={146} r={21} />
            {/* pointy wisp ears */}
            <path d="M42 104 Q20 96 22 74 Q34 88 52 90 Z" />
            <path d="M158 104 Q180 96 178 74 Q166 88 148 90 Z" />
            {/* curl on top */}
            <path d="M98 56 C94 38 110 26 122 34 C112 34 106 42 112 54 Z" />
            {/* wisp tail */}
            <path d="M92 166 C88 182 102 192 116 184 C106 184 102 178 110 170 Z" />
          </Silhouette>
          {/* soft shading + highlights */}
          <path d="M44 146 Q100 176 156 146" fill="none" stroke={SHADE} strokeWidth={8} strokeLinecap="round" opacity={0.9} />
          <ellipse cx={70} cy={66} rx={10} ry={5.5} fill="#ffffff" opacity={0.85} transform="rotate(-25 70 66)" />
          <ellipse cx={118} cy={64} rx={6} ry={3.5} fill="#ffffff" opacity={0.75} transform="rotate(-10 118 64)" />
          <circle cx={52} cy={100} r={3} fill="#ffffff" opacity={0.8} />
          <Face g={FACE} expr={e} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
        </Limb>
        <Limb x={44} y={134} angle={aL}>
          <g transform="translate(44 134)"><Arm /></g>
        </Limb>
        <Limb x={156} y={134} angle={aR}>
          <g transform="translate(156 134) scale(-1 1)"><Arm /></g>
        </Limb>
      </g>
    )
  },
}
