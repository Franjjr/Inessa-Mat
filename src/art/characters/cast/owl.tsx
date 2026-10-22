/* Búho Sabio — a round caramel owl with ear tufts, big round glasses and feathered wings. */
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Silhouette, SW_DETAIL, SW_FINE, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'
import type { MouthKind } from '../shared/pose'

const INK = '#6b3f1d'
const BODY = '#c48f5e'
const WING = '#a8744a'
const BELLY = '#f7e6cb'
const DISC = '#f3dcb8'
const BEAK = '#f59e0b'
const BEAK_INK = '#b45309'
const FRAME = '#7c2d12'

const FACE: FaceGeom = {
  eyes: [[78, 99], [122, 99]],
  ew: 9.5,
  eh: 11,
  ink: '#3b1f0c',
  noMouth: true,
  mouth: [100, 124],
  mw: 8,
  cheeks: [[66, 122], [134, 122]],
  cheekR: [8, 4.8],
  cheekColor: '#f9a8d4',
  sw: 3.5,
  browLift: 25,
  browInk: INK,
}

const WINGS = { down: 4, in: -4, out: 52, up: 138, spread: 98, talk: 66, chest: -30, face: -96, chin: -104 }

function Wing() {
  return (
    <g>
      <path d="M-11 -4 C-18 18 -12 40 1 52 C5 46 9 47 11 41 C14 34 14 18 11 4 C10 -1 8 -4 6 -6 Z" fill={WING} {...ol(INK)} />
      <path d="M-3 22 Q1 32 0 42 M4 16 Q7 26 6 36" fill="none" stroke="#8a5a34" strokeWidth={SW_FINE} strokeLinecap="round" />
    </g>
  )
}

function Beak({ mouth, animated }: { mouth: MouthKind; animated: boolean }) {
  const open = mouth === 'grin' || mouth === 'o' || mouth === 'eek'
  if (mouth === 'talk') {
    return (
      <g>
        <g className={animated ? anim.talk : undefined} style={{ transformOrigin: '100px 122px' }}>
          <path d="M94 121 L106 121 L100 133 Z" fill="#fbbf24" {...ol(BEAK_INK, 3)} />
        </g>
        <path d="M91 115 Q100 110 109 115 L100 127 Z" fill={BEAK} {...ol(BEAK_INK, 3.2)} />
      </g>
    )
  }
  if (open) {
    return (
      <g>
        <ellipse cx={100} cy={128} rx={mouth === 'o' ? 5 : 7} ry={6} fill="#7a2848" />
        <path d="M93 129 Q100 139 107 129 Z" fill="#fbbf24" {...ol(BEAK_INK, 3)} />
        <path d="M90 114 Q100 108 110 114 L100 124 Z" fill={BEAK} {...ol(BEAK_INK, 3.2)} />
      </g>
    )
  }
  const sad = mouth === 'frown' || mouth === 'wobble'
  return (
    <path
      d={sad ? 'M91 117 Q100 112 109 117 L100 131 Z' : 'M91 115 Q100 110 109 115 L100 130 Z'}
      fill={BEAK}
      {...ol(BEAK_INK, 3.2)}
    />
  )
}

export const owl: CastDef = {
  label: 'Búho Sabio',
  head: { cx: 100, cy: 92, r: 58 },
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, WINGS)
    const aR = armAngle(posture.armR, 1, WINGS)
    const tuft = posture.ears === 'droop' || posture.ears === 'flat' ? 14 : posture.ears === 'perk' ? -6 : 0
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 192px' }}>
        {/* feet */}
        <g fill={BEAK} {...ol(BEAK_INK, 3)}>
          <ellipse cx={78} cy={190} rx={6} ry={4.5} />
          <ellipse cx={88} cy={191} rx={6} ry={4.5} />
          <ellipse cx={112} cy={191} rx={6} ry={4.5} />
          <ellipse cx={122} cy={190} rx={6} ry={4.5} />
        </g>
        <Limb x={100} y={170} angle={posture.head * 0.5}>
          {/* ear tufts */}
          <Limb x={64} y={62} angle={-tuft}>
            <path d="M56 70 Q44 48 46 32 Q64 42 78 56 Z" fill={BODY} {...ol(INK)} />
          </Limb>
          <Limb x={136} y={62} angle={tuft}>
            <path d="M144 70 Q156 48 154 32 Q136 42 122 56 Z" fill={BODY} {...ol(INK)} />
          </Limb>
          <Silhouette fill={BODY} ink={INK}>
            <ellipse cx={100} cy={122} rx={58} ry={66} />
          </Silhouette>
          {/* forehead feathers */}
          <path d="M70 70 Q100 56 130 70 Q116 72 100 84 Q84 72 70 70 Z" fill="#b07a4c" />
          {/* belly with feather scallops */}
          <ellipse cx={100} cy={158} rx={37} ry={28} fill={BELLY} />
          <g fill="none" stroke="#d9b48a" strokeWidth={SW_FINE} strokeLinecap="round">
            <path d="M80 148 q5 5 10 0 M96 148 q5 5 10 0 M112 148 q5 5 10 0" />
            <path d="M88 162 q5 5 10 0 M104 162 q5 5 10 0" />
            <path d="M96 176 q5 5 10 0" />
          </g>
          {/* face discs */}
          <circle cx={78} cy={99} r={25} fill={DISC} />
          <circle cx={122} cy={99} r={25} fill={DISC} />
          <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
          {/* round glasses */}
          <g fill="#ffffff" fillOpacity={0.16} stroke={FRAME} strokeWidth={4}>
            <circle cx={78} cy={99} r={19} />
            <circle cx={122} cy={99} r={19} />
          </g>
          <g fill="none" stroke={FRAME} strokeWidth={SW_DETAIL} strokeLinecap="round">
            <path d="M97 96 Q100 91 103 96" />
            <path d="M59 95 L50 90 M141 95 L150 90" />
          </g>
          <path d="M66 88 Q70 84 75 83 M110 88 Q114 84 119 83" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
          <Beak mouth={expr.mouth} animated={animated} />
        </Limb>
        <Limb x={46} y={112} angle={aL}>
          <g transform="translate(46 112)"><Wing /></g>
        </Limb>
        <Limb x={154} y={112} angle={aR}>
          <g transform="translate(154 112) scale(-1 1)"><Wing /></g>
        </Limb>
      </g>
    )
  },
}
