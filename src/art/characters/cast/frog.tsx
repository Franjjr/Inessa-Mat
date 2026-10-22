/* Rana Saltarina — a springy green frog sitting on a lily pad (with a little pink flower). */
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Silhouette, SW_DETAIL, SW_FINE, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'

const INK = '#2f7d4a'
const SKIN = '#8fe388'
const BELLY = '#ecfccb'
const SPOT = '#6cc965'
const PAD = '#34d399'
const PAD_INK = '#047857'

const FACE: FaceGeom = {
  eyes: [[68, 68], [132, 68]],
  ew: 10,
  eh: 12,
  ink: '#1f4d2e',
  lashes: true,
  mouth: [100, 110],
  mw: 19,
  cheeks: [[56, 104], [144, 104]],
  cheekR: [9, 5.5],
  cheekColor: '#f9a8d4',
  sw: 3.6,
  browLift: 20,
  mouthFill: '#9f1239',
  tongue: '#fb7185',
}

const ARMS = { down: 6, in: -2, out: 58, up: 150, spread: 104, talk: 72, chest: -44, face: -150, chin: -152 }

function Arm() {
  return (
    <g>
      <path d="M-6.5 -2 Q-8 12 -5.5 25 L5.5 25 Q8 12 6.5 -2 A6.5 6.5 0 0 0 -6.5 -2 Z" fill={SKIN} {...ol(INK)} />
      <g fill={SKIN} {...ol(INK, SW_DETAIL)}>
        <circle cx={-6.5} cy={29} r={4} />
        <circle cx={6.5} cy={29} r={4} />
        <circle cx={0} cy={31.5} r={4.2} />
      </g>
    </g>
  )
}

export const frog: CastDef = {
  label: 'Rana Saltarina',
  head: { cx: 100, cy: 86, r: 62 },
  // The frog hops off its lily pad on its own (the pad stays put).
  motion: { happy: 'none', cheer: 'none' },
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = armAngle(posture.armR, 1, ARMS)
    return (
      <g>
        {/* lily pad (does not breathe) */}
        <path d="M100 184 L181 180 A84 15 0 1 0 181 188 Z" fill={PAD} {...ol(PAD_INK)} />
        <g stroke="#059669" strokeWidth={SW_FINE} strokeLinecap="round" fill="none">
          <path d="M100 184 L40 178 M100 184 L62 194 M100 184 L132 195 M100 184 L150 175" />
        </g>
        <g className={pose === 'happy' || pose === 'cheer' ? anim.hop : undefined} style={{ transformOrigin: '100px 186px' }}>
        <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 184px' }}>
          {/* back legs */}
          <g fill={SKIN} {...ol(INK)}>
            <path d="M32 186 Q30 174 44 176 L60 182 Q62 188 54 189 Z" />
            <path d="M168 186 Q170 174 156 176 L140 182 Q138 188 146 189 Z" />
            <ellipse cx={54} cy={164} rx={22} ry={18} />
            <ellipse cx={146} cy={164} rx={22} ry={18} />
          </g>
          <Limb x={100} y={150} angle={posture.head * 0.7}>
            <Silhouette fill={SKIN} ink={INK}>
              <ellipse cx={100} cy={150} rx={44} ry={32} />
              <ellipse cx={100} cy={102} rx={62} ry={42} />
              <circle cx={68} cy={68} r={22} />
              <circle cx={132} cy={68} r={22} />
            </Silhouette>
            <ellipse cx={100} cy={157} rx={30} ry={21} fill={BELLY} />
            <g fill={SPOT}>
              <circle cx={100} cy={76} r={5} />
              <circle cx={86} cy={84} r={3} />
              <circle cx={115} cy={83} r={3.6} />
              <circle cx={48} cy={124} r={3.4} />
              <circle cx={152} cy={124} r={3.4} />
            </g>
            <ellipse cx={60} cy={56} rx={6} ry={3.5} fill="#d9f99d" transform="rotate(-30 60 56)" />
            <ellipse cx={124} cy={56} rx={6} ry={3.5} fill="#d9f99d" transform="rotate(-30 124 56)" />
            <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
            {/* pink lotus hair-flower */}
            <g transform="translate(100 64)">
              <path d="M0 2 C-11 -1 -14 -11 -7 -16 C-5 -9 -2 -5 0 2 Z" fill="#f9a8d4" {...ol('#db2777', 2.6)} />
              <path d="M0 2 C11 -1 14 -11 7 -16 C5 -9 2 -5 0 2 Z" fill="#f9a8d4" {...ol('#db2777', 2.6)} />
              <path d="M0 2 C-6 -6 -5 -17 0 -22 C5 -17 6 -6 0 2 Z" fill="#fbcfe8" {...ol('#db2777', 2.6)} />
              <circle cx={0} cy={-2} r={2.6} fill="#fde047" />
            </g>
          </Limb>
          <Limb x={66} y={134} angle={aL}>
            <g transform="translate(66 134)"><Arm /></g>
          </Limb>
          <Limb x={134} y={134} angle={aR}>
            <g transform="translate(134 134)"><Arm /></g>
          </Limb>
        </g>
        </g>
      </g>
    )
  },
}
