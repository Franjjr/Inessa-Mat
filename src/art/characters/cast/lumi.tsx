/* Lumi — grown-up white unicorn guide, sitting, 3/4 profile facing right (as in the printed workbook).
   7-colour pastel mane, golden spiral horn with 8 small crystal sockets, golden hooves. */
import type { Pose } from '@/types'
import { Face, type FaceGeom } from '../shared/face'
import { spiralHorn } from '../shared/horn'
import { Limb, Loop, Silhouette, SW_DETAIL, anim, ol } from '../shared/frame'
import type { CastDef } from '../shared/cast'

export const LUMI_INK = '#4c1d95'
export const LUMI_MANE = ['#fca5a5', '#fdba74', '#fde68a', '#86efac', '#93c5fd', '#a5b4fc', '#d8b4fe']
const HOOF = '#fde68a'
const HORN = '#fde68a'
const HORN_INK = '#b45309'
const FAR = '#f3eefe'
const TAIL = 'M62 174 C36 180 18 166 20 146 C22 130 36 126 42 136'

/** Front legs per pose: [far shoulder, far knee, near shoulder, near knee] in degrees.
    Negative shoulder = forward (toward the snout); positive knee bends the hoof back down. */
const LEGS: Record<Pose, [number, number, number, number]> = {
  idle: [0, 0, 0, 0],
  talk: [0, 0, -62, 50],
  happy: [-10, 8, -42, 26],
  cheer: [-100, 72, -136, 88],
  sad: [2, 0, 4, 0],
  worried: [-34, 30, -54, 46],
  scared: [-84, 62, -112, 80],
  think: [0, 0, -120, 100],
  surprised: [-40, 22, -90, 48],
  sleep: [4, 0, 6, 0],
}

const EAR: Record<Pose, number> = {
  idle: 0, talk: 0, happy: 8, cheer: 10, sad: -34, worried: -22, scared: -40, think: 0, surprised: 10, sleep: -28,
}

/** The horn: base tucked behind the head, leaning toward the snout. */
export const LUMI_HORN = spiralHorn([111, 54], [137, 0], 28, 2.6)

const FACE: FaceGeom = {
  eyes: [[126, 85]],
  ew: 9.2,
  eh: 11.6,
  ink: '#3b0764',
  lashes: true,
  facing: 'right',
  mouth: [153, 117],
  mw: 9.5,
  cheeks: [[134, 104]],
  cheekR: [8.5, 5.2],
  cheekColor: '#f9a8d4',
  sw: 3.4,
  browLift: 17,
  mouthFill: '#701a45',
  tongue: '#f472b6',
}

const UPPER = 'M-9.5 0 A9.5 9.5 0 0 1 9.5 0 L9 20 A9 9 0 0 1 -9 20 Z'
const LOWER = 'M-8.6 14 A8.6 8.6 0 0 1 8.6 14 L8.6 31 Q8.6 37.5 3 37.5 L-3 37.5 Q-8.6 37.5 -8.6 31 Z'
const HOOF_D = 'M-8.6 29.5 L8.6 29.5 L8.6 31 Q8.6 37.5 3 37.5 L-3 37.5 Q-8.6 37.5 -8.6 31 Z'

/** A two-segment front leg (shoulder + knee) drawn as one seamless silhouette. */
function FrontLeg({ x, y, shoulder, knee, fill, wave }: { x: number; y: number; shoulder: number; knee: number; fill: string; wave: boolean }) {
  const pass = (ink: boolean) => (
    <Limb x={x} y={y} angle={shoulder}>
      <g transform={`translate(${x} ${y})`}>
        <Loop cls={anim.wave} x={0} y={0} on={wave}>
          <g {...(ink ? { fill: LUMI_INK, stroke: LUMI_INK, strokeWidth: 10, strokeLinejoin: 'round' as const } : { fill })}>
            <path d={UPPER} />
            <Limb x={0} y={20} angle={knee}>
              <path d={LOWER} />
              {!ink && <path d={HOOF_D} fill={HOOF} />}
              {!ink && <path d="M-8.6 29.5 L8.6 29.5" stroke={LUMI_INK} strokeWidth={3} strokeLinecap="round" />}
            </Limb>
          </g>
        </Loop>
      </g>
    </Limb>
  )
  return (
    <g>
      {pass(true)}
      {pass(false)}
    </g>
  )
}

export const lumi: CastDef = {
  label: 'Lumi',
  head: { cx: 116, cy: 82, r: 50 },
  render: ({ pose, expr, posture, animated, delay }) => {
    const [farS, farK, nearS, nearK] = LEGS[pose]
    const happyTail = pose === 'happy' || pose === 'cheer'
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 194px' }}>
        {/* Tail: a rainbow ribbon curl */}
        <Loop cls={happyTail ? anim.wag : anim.wagSlow} x={60} y={172} on={animated}>
          <g fill="none" strokeLinecap="round">
            <path d={TAIL} stroke={LUMI_INK} strokeWidth={29} />
            <path d={TAIL} stroke={LUMI_MANE[6]} strokeWidth={19} />
            <path d={TAIL} stroke={LUMI_MANE[4]} strokeWidth={11.5} />
            <path d={TAIL} stroke={LUMI_MANE[0]} strokeWidth={4.5} />
          </g>
        </Loop>

        {/* Back mane (lower part, behind the neck) */}
        <g {...ol(LUMI_INK, SW_DETAIL)}>
          <circle cx={63} cy={136} r={14} fill={LUMI_MANE[5]} />
          <circle cx={73} cy={153} r={13} fill={LUMI_MANE[6]} />
          <circle cx={58} cy={116} r={14} fill={LUMI_MANE[4]} />
        </g>

        {/* Body, haunch and neck as one silhouette */}
        <Silhouette fill="#ffffff" ink={LUMI_INK}>
          <ellipse cx={98} cy={170} rx={47} ry={24} />
          <circle cx={70} cy={170} r={24} />
          <path d="M90 112 C86 132 84 150 84 166 L140 166 C140 150 139 132 134 112 Z" />
        </Silhouette>
        <path d="M52 182 Q56 152 86 152" fill="none" {...ol(LUMI_INK, SW_DETAIL)} />
        <ellipse cx={104} cy={160} rx={9} ry={5} fill="#f5f3ff" />
        {/* Hind hoof tucked in front of the haunch */}
        <path d="M80 194 Q80 182 92 182 L104 182 Q110 182 110 188 L110 194 Z" fill={HOOF} {...ol(LUMI_INK, SW_DETAIL)} />

        {/* Far front leg */}
        <FrontLeg x={115} y={158} shoulder={farS} knee={farK} fill={FAR} wave={false} />

        {/* Head (tilts) */}
        <Limb x={118} y={128} angle={posture.head}>
          {/* upper mane behind the head */}
          <g {...ol(LUMI_INK, SW_DETAIL)}>
            <circle cx={57} cy={95} r={14} fill={LUMI_MANE[3]} />
            <circle cx={61} cy={73} r={14} fill={LUMI_MANE[2]} />
            <circle cx={72} cy={55} r={13} fill={LUMI_MANE[1]} />
            <circle cx={88} cy={44} r={12} fill={LUMI_MANE[0]} />
          </g>
          {/* ear */}
          <Limb x={90} y={46} angle={EAR[pose]}>
            <path d="M79 56 C72 42 71 28 76 15 C88 21 97 32 100 45 Z" fill="#ffffff" {...ol(LUMI_INK)} />
            <path d="M83.5 49 C79 39 78.5 31 80.5 23 C87 27 92 34 94 42 Z" fill="#fbcfe8" />
          </Limb>
          {/* horn (base tucked behind the head) */}
          <g>
            {LUMI_HORN.rings.map((d, i) => (
              <g key={i}>
                <path d={d} fill={HORN} {...ol(HORN_INK, 3.2)} />
                <path d={LUMI_HORN.highlights[i].d} stroke="#fef9c3" strokeWidth={LUMI_HORN.highlights[i].w} strokeLinecap="round" />
              </g>
            ))}
            {LUMI_HORN.sockets.map((p, i) => (
              <g key={`s${i}`}>
                <circle cx={p.x} cy={p.y} r={p.r} fill="#fcd34d" stroke={HORN_INK} strokeWidth={1} />
                <circle cx={p.x - p.r * 0.32} cy={p.y - p.r * 0.32} r={p.r * 0.32} fill="#fffbeb" />
              </g>
            ))}
          </g>
          {/* head + snout */}
          <Silhouette fill="#ffffff" ink={LUMI_INK}>
            <ellipse cx={111} cy={86} rx={45} ry={42} />
          </Silhouette>
          <ellipse cx={146} cy={108} rx={28.5} ry={21} fill="#fdf2f8" {...ol(LUMI_INK)} />
          {/* little highlight on the forehead */}
          <ellipse cx={100} cy={62} rx={8} ry={4.5} fill="#f5f3ff" transform="rotate(-24 100 62)" />
          {/* forelock */}
          <g {...ol(LUMI_INK, SW_DETAIL)}>
            <circle cx={97} cy={56} r={10} fill={LUMI_MANE[0]} />
            <circle cx={86} cy={64} r={9} fill={LUMI_MANE[6]} />
          </g>
          {/* nostril */}
          <ellipse cx={166} cy={103} rx={3} ry={4} fill="#be185d" transform="rotate(-12 166 103)" />
          <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
        </Limb>

        {/* Near front leg (the expressive "arm") */}
        <FrontLeg x={134} y={158} shoulder={nearS} knee={nearK} fill="#ffffff" wave={animated && pose === 'talk'} />
      </g>
    )
  },
}
