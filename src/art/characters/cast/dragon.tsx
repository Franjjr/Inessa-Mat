/* Dragona Chispa — a friendly orange dragon blacksmith with cream horns, little wings, a leather forge
   apron and smoke puffs from her nose. */
import type { Pose } from '@/types'
import { Face, type FaceGeom } from '../shared/face'
import { Limb, Loop, Silhouette, SW_DETAIL, SW_FINE, anim, ol } from '../shared/frame'
import { armAngle } from '../shared/pose'
import type { CastDef } from '../shared/cast'

const BODY = '#fb923c'
const INK = '#c2410c'
const BELLY = '#fed7aa'
const SNOUT = '#fdba74'
const HORN = '#fef3c7'
const CREST = '#facc15'
const APRON = '#a16207'
const APRON_INK = '#713f12'

const FACE: FaceGeom = {
  eyes: [[77, 72], [123, 72]],
  ew: 9.6,
  eh: 11.6,
  ink: '#4a1d0a',
  lashes: true,
  mouth: [100, 108],
  mw: 10,
  cheeks: [[62, 92], [138, 92]],
  cheekR: [8.5, 5],
  cheekColor: '#f472b6',
  sw: 3.5,
  browLift: 19,
  mouthFill: '#7c2d12',
  tongue: '#fb7185',
}

const ARMS = { down: 12, in: 2, out: 64, up: 150, spread: 106, talk: 74, chest: -38, face: -138, chin: -144 }
const SMOKE: Partial<Record<Pose, boolean>> = { idle: true, talk: true, happy: true, cheer: true, think: true, sleep: true }

function Arm() {
  return (
    <g>
      <path d="M-9.5 0 A9.5 9.5 0 0 1 9.5 0 L9.5 15 Q9.5 25 0 25 Q-9.5 25 -9.5 15 Z" fill={BODY} {...ol(INK)} />
      <g fill="#fff7ed">
        <circle cx={-4.5} cy={23.5} r={1.8} />
        <circle cx={0} cy={25} r={1.8} />
        <circle cx={4.5} cy={23.5} r={1.8} />
      </g>
    </g>
  )
}

function Wing({ flip }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
      <path d="M70 120 C54 112 34 98 28 78 C38 84 46 84 52 80 C52 90 58 96 64 96 C62 104 66 110 72 112 Z" fill={SNOUT} {...ol(INK)} />
      <path d="M66 112 L44 88 M68 106 L54 90" fill="none" stroke={INK} strokeWidth={SW_FINE} strokeLinecap="round" />
    </g>
  )
}

export const dragon: CastDef = {
  label: 'Dragona Chispa',
  head: { cx: 100, cy: 76, r: 54 },
  render: ({ pose, expr, posture, animated, delay }) => {
    const aL = armAngle(posture.armL, -1, ARMS)
    const aR = armAngle(posture.armR, 1, ARMS)
    const wag = pose === 'happy' || pose === 'cheer'
    return (
      <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 192px' }}>
        {/* tail */}
        <Loop cls={wag ? anim.wag : anim.wagSlow} x={134} y={176} on={animated}>
          <path d="M126 178 C150 182 170 176 180 158" fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" />
          <path d="M126 178 C150 182 170 176 180 158" fill="none" stroke={BODY} strokeWidth={14} strokeLinecap="round" />
          <path d="M178 160 L174 140 L192 150 L186 166 Z" fill={CREST} {...ol(INK, 4)} />
        </Loop>
        {/* wings */}
        <Loop cls={anim.flapSlow} x={70} y={118} on={animated && pose !== 'sleep'}><Wing /></Loop>
        <Loop cls={anim.flapSlow} x={130} y={118} on={animated && pose !== 'sleep'}><Wing flip /></Loop>
        {/* feet */}
        <g fill={BODY} {...ol(INK)}>
          <ellipse cx={78} cy={186} rx={15} ry={9} />
          <ellipse cx={122} cy={186} rx={15} ry={9} />
        </g>
        <g fill="#fff7ed">
          <circle cx={70} cy={192} r={2} /><circle cx={78} cy={193} r={2} /><circle cx={86} cy={192} r={2} />
          <circle cx={114} cy={192} r={2} /><circle cx={122} cy={193} r={2} /><circle cx={130} cy={192} r={2} />
        </g>
        {/* body */}
        <Silhouette fill={BODY} ink={INK}>
          <ellipse cx={100} cy={152} rx={44} ry={35} />
        </Silhouette>
        <ellipse cx={100} cy={158} rx={30} ry={25} fill={BELLY} />
        {/* forge apron */}
        <path d="M84 118 L80 108 M116 118 L120 108" stroke={APRON_INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M83 120 L117 120 L119 138 Q131 144 130 180 Q100 188 70 180 Q69 144 81 138 Z" fill={APRON} {...ol(APRON_INK, SW_DETAIL)} />
        <path d="M81 138 Q100 143 119 138" fill="none" stroke={APRON_INK} strokeWidth={SW_FINE} strokeLinecap="round" />
        <rect x={89} y={152} width={22} height={15} rx={4} fill="#854d0e" {...ol(APRON_INK, 2.8)} />
        <path d="M100 124 C106 130 106 136 100 138 C94 136 94 130 100 124 Z" fill="#fde047" {...ol('#ea580c', 2.2)} />
        <path d="M94 152 L94 146 M106 152 L106 144" stroke="#e2e8f0" strokeWidth={3.4} strokeLinecap="round" />
        {/* arms */}
        <Limb x={58} y={134} angle={aL}>
          <g transform="translate(58 134)"><Arm /></g>
        </Limb>
        <Limb x={142} y={134} angle={aR}>
          <g transform="translate(142 134)"><Arm /></g>
        </Limb>
        {/* head */}
        <Limb x={100} y={122} angle={posture.head}>
          {/* crest + horns */}
          <g fill={CREST} {...ol(INK, 4)}>
            <path d="M84 40 L88 22 L98 36 Z" />
            <path d="M94 36 L101 16 L108 36 Z" />
            <path d="M104 36 L113 22 L117 40 Z" />
          </g>
          <path d="M70 46 Q56 32 60 12 Q74 26 84 38 Z" fill={HORN} {...ol(INK, 4)} />
          <path d="M130 46 Q144 32 140 12 Q126 26 116 38 Z" fill={HORN} {...ol(INK, 4)} />
          {/* fin ears */}
          <path d="M52 74 L32 64 L40 86 L52 88 Z" fill={SNOUT} {...ol(INK, 4)} />
          <path d="M148 74 L168 64 L160 86 L148 88 Z" fill={SNOUT} {...ol(INK, 4)} />
          <Silhouette fill={BODY} ink={INK}>
            <ellipse cx={100} cy={78} rx={52} ry={45} />
          </Silhouette>
          <ellipse cx={80} cy={46} rx={12} ry={5} fill="#fdba74" transform="rotate(-18 80 46)" />
          <ellipse cx={100} cy={102} rx={30} ry={18} fill={SNOUT} />
          <g fill={INK}>
            <ellipse cx={91} cy={95} rx={2.6} ry={2} />
            <ellipse cx={109} cy={95} rx={2.6} ry={2} />
          </g>
          {/* freckles */}
          <g fill="#ea580c" opacity={0.7}>
            <circle cx={56} cy={86} r={1.5} /><circle cx={61} cy={83} r={1.5} /><circle cx={60} cy={89} r={1.5} />
            <circle cx={144} cy={86} r={1.5} /><circle cx={139} cy={83} r={1.5} /><circle cx={140} cy={89} r={1.5} />
          </g>
          <Face g={FACE} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
          {SMOKE[pose] && (
            <g className={anim.puff}>
              <circle className={anim.self} cx={126} cy={100} r={3.6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
              <circle className={anim.self} cx={138} cy={96} r={4.8} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
              <circle className={anim.self} cx={153} cy={89} r={6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
            </g>
          )}
        </Limb>
      </g>
    )
  },
}
