/* Hada Iris — a tiny fairy with rainbow wings, lilac hair in a bun, pointy ears, a fuchsia petal dress
   and a star wand. Floats. */
import type { Pose } from '@/types'
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Loop, Silhouette, SW_DETAIL, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'
import { Sparkle } from '../shared/extras'

const SKIN = '#ffe0cc'
const SKIN_INK = '#b86a4b'
const HAIR = '#c084fc'
const HAIR_INK = '#7e22ce'
const DRESS = '#d946ef'
const DRESS_INK = '#86198f'
const WING_BANDS = ['#c4b5fd', '#93c5fd', '#86efac', '#fde68a', '#fca5a5']

const FACE: FaceGeom = {
  eyes: [[84, 80], [116, 80]],
  ew: 8.6,
  eh: 10.6,
  ink: '#4a2040',
  lashes: true,
  mouth: [100, 97],
  mw: 7,
  cheeks: [[73, 93], [127, 93]],
  cheekR: [7.5, 4.6],
  cheekColor: '#fb9ac7',
  sw: 3.3,
  browLift: 17,
  browInk: HAIR_INK,
  mouthFill: '#9d174d',
}

const ARMS = { down: 22, in: 12, out: 66, up: 152, spread: 112, talk: 74, chest: -30, face: -142, chin: -148 }
/** Wand arm (viewer-right) angles per pose. */
const WAND_ARM: Record<Pose, number> = {
  idle: -40, talk: -84, happy: -70, cheer: -158, sad: -14, worried: 30, scared: 140, think: -40, surprised: -112, sleep: -10,
}

const UPPER_WING = 'M90 118 C62 112 22 98 20 70 C18 48 46 46 62 62 C78 78 88 100 90 118 Z'
const LOWER_WING = 'M90 126 C68 130 42 148 46 166 C50 180 72 172 80 156 C86 144 90 134 90 126 Z'

/** A wing with concentric rainbow bands around its own centre (ox, oy). */
function Wing({ d, ox, oy }: { d: string; ox: number; oy: number }) {
  return (
    <g>
      <path d={d} fill={WING_BANDS[0]} {...ol('#7c3aed', SW_DETAIL)} />
      {WING_BANDS.slice(1).map((c, i) => {
        const k = 0.8 - i * 0.17
        return <path key={c} d={d} fill={c} transform={`translate(${ox} ${oy}) scale(${k}) translate(${-ox} ${-oy})`} />
      })}
    </g>
  )
}

function Arm() {
  return (
    <g>
      <path d="M-4.6 -2 L-4.2 18 L4.2 18 L4.6 -2 Z" fill={SKIN} {...ol(SKIN_INK, 4)} />
      <circle cx={0} cy={21} r={5.6} fill={SKIN} {...ol(SKIN_INK, 4)} />
    </g>
  )
}

function Wand({ animated }: { animated: boolean }) {
  return (
    <g>
      <path d="M0 4 L0 -30" stroke="#a16207" strokeWidth={6.5} strokeLinecap="round" />
      <path d="M0 4 L0 -30" stroke="#fde68a" strokeWidth={3} strokeLinecap="round" />
      <path d="M0 -46 L3.6 -37.2 L12.8 -36.6 L5.8 -30.6 L8 -21.6 L0 -26.4 L-8 -21.6 L-5.8 -30.6 L-12.8 -36.6 L-3.6 -37.2 Z" fill="#fde047" {...ol('#ca8a04', 3)} />
      <Sparkle x={13} y={-46} size={0.55} color="#f472b6" animated={animated} />
      <Sparkle x={-12} y={-50} size={0.4} color="#a78bfa" animated={animated} delay={0.5} />
    </g>
  )
}

export const fairy: CastDef = {
  label: 'Hada Iris',
  head: { cx: 100, cy: 70, r: 48 },
  float: true,
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = WAND_ARM[pose]
    const ear = posture.ears === 'droop' || posture.ears === 'flat' ? 16 : posture.ears === 'perk' ? -8 : 0
    const fast = pose === 'happy' || pose === 'cheer' || pose === 'surprised'
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 188px' }}>
        {/* rainbow wings */}
        <Loop cls={fast ? anim.flap : anim.flapSlow} x={92} y={122} on={animated && pose !== 'sleep'}>
          <Wing d={UPPER_WING} ox={56} oy={84} />
          <Wing d={LOWER_WING} ox={68} oy={150} />
        </Loop>
        <Loop cls={fast ? anim.flap : anim.flapSlow} x={108} y={122} on={animated && pose !== 'sleep'}>
          <g transform="translate(200 0) scale(-1 1)">
            <Wing d={UPPER_WING} ox={56} oy={84} />
            <Wing d={LOWER_WING} ox={68} oy={150} />
          </g>
        </Loop>
        {/* legs */}
        <g {...ol(SKIN_INK, 4)}>
          <path d="M92 166 L92 182" stroke={SKIN_INK} strokeWidth={11} />
          <path d="M108 166 L108 182" stroke={SKIN_INK} strokeWidth={11} />
          <path d="M92 166 L92 182" stroke={SKIN} strokeWidth={4} />
          <path d="M108 166 L108 182" stroke={SKIN} strokeWidth={4} />
        </g>
        <g fill={DRESS} {...ol(DRESS_INK, 3.4)}>
          <ellipse cx={90} cy={186} rx={7.5} ry={5} />
          <ellipse cx={110} cy={186} rx={7.5} ry={5} />
        </g>
        {/* petal dress */}
        <Silhouette fill={DRESS} ink={DRESS_INK}>
          <path d="M86 112 Q100 117 114 112 L116 134 Q136 148 142 166 Q133 175 122 169 Q112 177 100 172 Q88 177 78 169 Q67 175 58 166 Q64 148 84 134 Z" />
        </Silhouette>
        <path d="M66 162 Q72 152 84 146 M134 162 Q128 152 116 146 M100 146 L100 166" fill="none" stroke="#f0abfc" strokeWidth={3} strokeLinecap="round" />
        <path d="M84 134 Q100 140 116 134" fill="none" stroke="#fde68a" strokeWidth={5} strokeLinecap="round" />
        <g fill="#ffffff">
          <circle cx={80} cy={158} r={1.8} />
          <circle cx={118} cy={156} r={1.8} />
          <circle cx={100} cy={124} r={2} />
        </g>
        <Limb x={86} y={120} angle={aL}>
          <g transform="translate(86 120)"><Arm /></g>
        </Limb>
        {/* wand arm */}
        <Limb x={113} y={120} angle={aR}>
          <g transform="translate(113 120)">
            <Limb x={0} y={21} angle={-aR + 14}>
              <g transform="translate(0 21)"><Wand animated={animated} /></g>
            </Limb>
            <Arm />
          </g>
        </Limb>
        {/* head */}
        <Limb x={100} y={112} angle={posture.head}>
          {/* back hair + bun */}
          <circle cx={100} cy={27} r={14} fill={HAIR} {...ol(HAIR_INK)} />
          <path d="M94 16 Q100 22 106 16" fill="none" stroke={HAIR_INK} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M56 76 C52 40 76 30 100 30 C124 30 148 40 144 76 C146 92 142 104 136 110 L64 110 C58 104 54 92 56 76 Z" fill={HAIR} {...ol(HAIR_INK)} />
          {/* pointy ears */}
          <Limb x={62} y={82} angle={-ear}>
            <path d="M64 76 L46 70 L62 92 Z" fill={SKIN} {...ol(SKIN_INK, 4)} />
          </Limb>
          <Limb x={138} y={82} angle={ear}>
            <path d="M136 76 L154 70 L138 92 Z" fill={SKIN} {...ol(SKIN_INK, 4)} />
          </Limb>
          <Silhouette fill={SKIN} ink={SKIN_INK} w={4}>
            <ellipse cx={100} cy={78} rx={36} ry={34} />
          </Silhouette>
          {/* bangs */}
          <path d="M63 76 C62 50 80 40 100 40 C120 40 138 50 137 76 C130 64 120 58 110 58 C113 63 113 67 111 71 C105 61 93 57 82 61 C74 64 67 69 63 76 Z" fill={HAIR} {...ol(HAIR_INK, 4)} />
          <ellipse cx={86} cy={48} rx={8} ry={3.5} fill="#e9d5ff" transform="rotate(-16 86 48)" />
          {/* flower in the bun */}
          <g transform="translate(112 22)">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={0} cy={-5} rx={3.6} ry={5} fill="#fbcfe8" stroke="#db2777" strokeWidth={1.6} transform={`rotate(${a})`} />
            ))}
            <circle cx={0} cy={0} r={2.8} fill="#fde047" />
          </g>
          <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
        </Limb>
      </g>
    )
  },
}
