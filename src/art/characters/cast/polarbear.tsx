/* Osa Nieve — a snowy polar bear in a striped teal scarf, holding a mug of hot chocolate. */
import type { Pose } from '@/types'
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Silhouette, SW_DETAIL, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'

const FUR = '#f8fafc'
const INK = '#64748b'
const SCARF = '#22d3ee'
const SCARF_DARK = '#0e7490'
const SCARF_INK = '#155e75'

const FACE: FaceGeom = {
  eyes: [[76, 76], [124, 76]],
  ew: 8.2,
  eh: 9.8,
  ink: '#334155',
  lashes: true,
  mouth: [100, 103],
  mw: 7.5,
  catMouth: true,
  cheeks: [[63, 96], [137, 96]],
  cheekR: [8.5, 5],
  cheekColor: '#f9a8d4',
  sw: 3.4,
  browLift: 17,
  mouthFill: '#9f1239',
}

const ARMS = { down: 12, in: 2, out: 62, up: 150, spread: 104, talk: 70, chest: -36, face: -134, chin: -138 }
/** The mug arm (viewer-right) keeps the chocolate in front of her. */
const MUG_ARM: Record<Pose, number> = {
  idle: 40, talk: 18, happy: -34, cheer: -150, sad: 34, worried: 48, scared: 122, think: 40, surprised: -92, sleep: 30,
}

function Arm() {
  return <path d="M-10 0 A10 10 0 0 1 10 0 L10 17 Q10 27 0 27 Q-10 27 -10 17 Z" fill={FUR} {...ol(INK)} />
}

function Mug({ steam }: { steam: boolean }) {
  return (
    <g>
      {steam && (
        <g className={anim.steam} fill="none" stroke="#cbd5e1" strokeWidth={2.6} strokeLinecap="round">
          <path d="M-15 -20 q-3 -4 0 -8 q3 -4 0 -8" />
          <path d="M-6 -20 q-3 -4 0 -8 q3 -4 0 -8" />
        </g>
      )}
      <path d="M0 -9 Q9 -9 8.5 -2 Q8 4 -1 3.5" fill="none" stroke="#9d174d" strokeWidth={4.2} strokeLinecap="round" />
      <path d="M-23 -15 L1 -15 L-0.5 7 Q-1 12 -6 12 L-17 12 Q-22 12 -22 7 Z" fill="#f472b6" {...ol('#9d174d', SW_DETAIL)} />
      <ellipse cx={-11} cy={-14.5} rx={11} ry={3} fill="#92400e" />
      <path d="M-18 -15 Q-16 -20 -11 -19 Q-7 -22 -4 -17 Q-2 -15 -4 -15 Z" fill="#ffffff" {...ol('#cbd5e1', 1.6)} />
      <path d="M-11.5 4 C-16 0 -16 -5 -12.5 -5 Q-11.5 -5 -11.5 -3.5 Q-11.5 -5 -10.5 -5 C-7 -5 -7 0 -11.5 4 Z" fill="#ffffff" />
    </g>
  )
}

export const polarbear: CastDef = {
  label: 'Osa Nieve',
  head: { cx: 100, cy: 76, r: 54 },
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = MUG_ARM[pose]
    const ear = posture.ears === 'droop' || posture.ears === 'flat' ? 14 : posture.ears === 'perk' ? -6 : 0
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 194px' }}>
        {/* feet */}
        <g fill={FUR} {...ol(INK)}>
          <ellipse cx={76} cy={186} rx={16} ry={9} />
          <ellipse cx={124} cy={186} rx={16} ry={9} />
        </g>
        <g fill="#fbcfe8">
          <ellipse cx={76} cy={188} rx={6} ry={3.5} />
          <ellipse cx={124} cy={188} rx={6} ry={3.5} />
        </g>
        {/* body */}
        <Silhouette fill={FUR} ink={INK}>
          <ellipse cx={100} cy={152} rx={48} ry={36} />
        </Silhouette>
        <ellipse cx={100} cy={160} rx={30} ry={22} fill="#eef2f7" />
        {/* scarf tail */}
        <path d="M60 128 L76 132 L70 170 L54 166 Z" fill={SCARF} {...ol(SCARF_INK, SW_DETAIL)} />
        <path d="M58 146 L73 149 M56 157 L71 160" stroke={SCARF_DARK} strokeWidth={4} />
        <path d="M55 166 l-1 6 M60 167 l-1 6 M65 168 l-1 6 M70 170 l-1 6" stroke={SCARF_INK} strokeWidth={2.4} strokeLinecap="round" />
        {/* head */}
        <Limb x={100} y={124} angle={posture.head}>
          <Limb x={60} y={50} angle={-ear}>
            <circle cx={58} cy={42} r={15} fill={FUR} {...ol(INK)} />
            <circle cx={58} cy={43} r={7.5} fill="#fbcfe8" />
          </Limb>
          <Limb x={140} y={50} angle={ear}>
            <circle cx={142} cy={42} r={15} fill={FUR} {...ol(INK)} />
            <circle cx={142} cy={43} r={7.5} fill="#fbcfe8" />
          </Limb>
          <Silhouette fill={FUR} ink={INK}>
            <ellipse cx={100} cy={78} rx={53} ry={46} />
          </Silhouette>
          <ellipse cx={80} cy={46} rx={12} ry={5} fill="#ffffff" transform="rotate(-20 80 46)" />
          <ellipse cx={100} cy={99} rx={23} ry={16} fill="#ffffff" {...ol('#94a3b8', 3)} />
          <path d="M92.5 89.5 Q100 86 107.5 89.5 Q106 96.5 100 97.5 Q94 96.5 92.5 89.5 Z" fill="#334155" />
          <ellipse cx={97} cy={90} rx={2.6} ry={1.4} fill="#94a3b8" />
          <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
        </Limb>
        {/* scarf wrap */}
        <path d="M54 118 Q100 138 146 118 L148 130 Q100 152 52 130 Z" fill={SCARF} {...ol(SCARF_INK, SW_DETAIL)} />
        <path d="M74 128 L72 140 M100 134 L100 146 M126 128 L128 140" stroke={SCARF_DARK} strokeWidth={4.5} strokeLinecap="round" />
        {/* arms */}
        <Limb x={56} y={136} angle={aL}>
          <g transform="translate(56 136)"><Arm /></g>
        </Limb>
        <Limb x={144} y={136} angle={aR}>
          <g transform="translate(144 136)">
            <Arm />
            <Limb x={0} y={24} angle={-aR}>
              <g transform="translate(0 24)">
                <Mug steam={pose !== 'sleep'} />
                <ellipse cx={1} cy={0} rx={8} ry={7} fill={FUR} {...ol(INK, 4)} />
              </g>
            </Limb>
          </g>
        </Limb>
      </g>
    )
  },
}
