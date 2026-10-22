/* El Lago del Ocho (w5): a violet dusk lake with the moon's reflection, eight lily pads, a little boat and a
   wooden dock; bubbles rise, fireflies glow, stars twinkle. Calm centre: the sky and the still water. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { Blob, BubbleParticle, LilyPad, RadialGlow, Reed, Rock, Tuft, WaveLine } from '../shapes'
import { bumpLine, ParticleField, Sky, Twinkles } from './common'

const LAKE = 'M -10 642 Q 800 600 1610 642 L 1610 904 Q 800 936 -10 894 Z'

function Lavender({ x, y, h = 90, s = 1 }: { x: number; y: number; h?: number; s?: number }) {
  const t = useTint()
  const ol = useOutline()
  const buds = Array.from({ length: 6 }, (_, i) => i)
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 0 Q 2 ${-h / 2} 0 ${-h}`} fill="none" stroke={t('#5f9e6e')} strokeWidth={3.5} strokeLinecap="round" />
      {buds.map((i) => (
        <ellipse key={i} cx={i % 2 ? 4 : -4} cy={-h + 6 + i * 9} rx={6} ry={8} {...ol(i < 2 ? '#c4b5fd' : '#a78bfa', 2.5)} />
      ))}
    </g>
  )
}

function Pano() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        <defs>
          <RadialGlow id={ids('moon')} color="#fff6dc" inner={0.9} />
          <linearGradient id={ids('lake')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t('#c3c4f8')} />
            <stop offset="100%" stopColor={t('#9ea4ef')} />
          </linearGradient>
        </defs>
        <circle cx={1060} cy={210} r={210} fill={ids.url('moon')} />
        <circle cx={1060} cy={210} r={46} {...ol('#fff6dc', 4, '#e7c98a')} />
        <circle cx={1046} cy={198} r={9} fill={t('#f6e7c2')} />
        <circle cx={1074} cy={226} r={6} fill={t('#f6e7c2')} />
        <circle cx={1070} cy={194} r={4} fill={t('#f6e7c2')} />
        {/* far hills */}
        <path d="M -10 590 Q 200 500 430 552 Q 620 590 820 540 Q 1040 484 1250 548 Q 1420 594 1610 534 L 1610 1000 L -10 1000 Z" {...ol('#d5c3f1', 3)} />
        <path d={bumpLine(-20, 1640, 624, 18, 34, 31)} {...ol('#bfa9e8', 3)} />
        {/* lake */}
        <path d={LAKE} fill="none" stroke={t('#f4e1c6')} strokeWidth={26} />
        <path d={LAKE} fill={ids.url('lake')} stroke={t('#7b82d6')} strokeWidth={4} strokeLinejoin="round" />
        <WaveLine x={200} y={690} w={160} color="#d8dbfd" sw={4} />
        <WaveLine x={520} y={740} w={120} color="#d8dbfd" sw={4} />
        <WaveLine x={1260} y={720} w={150} color="#d8dbfd" sw={4} />
        <WaveLine x={300} y={830} w={200} color="#d8dbfd" sw={5} amp={5} />
        <WaveLine x={1180} y={850} w={180} color="#d8dbfd" sw={5} amp={5} />
        {/* eight lily pads */}
        {[[420, 790, 0.8, '#f9a8d4'], [520, 860, 0.95, ''], [660, 820, 0.7, '#ffffff'], [300, 870, 0.9, ''], [940, 850, 0.85, '#f9a8d4'], [1080, 800, 0.7, ''], [1220, 880, 0.95, '#ffffff'], [820, 720, 0.55, '']].map(([x, y, s, b], i) => (
          <LilyPad key={i} x={x as number} y={y as number} s={s as number} fill="#7fcf9a" bloom={(b as string) || undefined} />
        ))}
        {/* little boat */}
        <path d="M 600 742 Q 640 772 720 772 Q 790 772 812 742 Z" {...ol('#f9a8d4', 4)} />
        <path d="M 618 750 L 800 750" stroke={t(light('#f9a8d4', 0.5))} strokeWidth={4} strokeLinecap="round" />
        <path d="M 700 742 L 700 668 L 760 734 Z" {...ol('#fff7ed', 3.5, '#c6a07a')} />
        <path d="M 700 742 L 700 660" stroke={t('#a47148')} strokeWidth={4} strokeLinecap="round" />
        {/* dock */}
        <path d="M 1190 812 L 1420 812 L 1450 862 L 1176 862 Z" {...ol('#d6a77a', 4)} />
        {[1220, 1260, 1300, 1340, 1380].map((x) => <path key={x} d={`M ${x} 812 L ${x - 6} 862`} stroke={t(shade('#d6a77a', 0.2))} strokeWidth={3} />)}
        {[1196, 1300, 1420].map((x) => <rect key={x} x={x - 7} y={856} width={14} height={34} rx={4} {...ol('#b98457', 3)} />)}
        <rect x={1408} y={720} width={10} height={96} rx={4} {...ol('#b98457', 3)} />
        {/* shore */}
        <path d="M -10 904 Q 400 864 800 884 Q 1200 904 1610 864 L 1610 1010 L -10 1010 Z" {...ol('#b9e2a8', 4)} />
        {[[340, 930], [700, 920], [1000, 940], [1320, 920], [520, 990], [1150, 990]].map(([x, y], i) => <Tuft key={i} x={x} y={y} s={0.9} fill="#86c98e" />)}
        <Lavender x={460} y={960} s={0.8} />
        <Lavender x={480} y={966} s={0.7} h={70} />
        <Lavender x={1100} y={950} s={0.8} />
        <Rock x={880} y={940} s={0.5} fill="#ddd6f3" />
      </Art>
      <Twinkles points={[[180, 120], [400, 220], [560, 90], [760, 170], [880, 60], [1250, 110], [1400, 230], [1500, 80], [300, 330], [1330, 360], [660, 300]]} color="#fff7d6" r={10} kind="star" />
      {/* moon reflection */}
      <Sprite x={980} y={650} w={160} h={160} className={a.shimmer} vars={{ '--d': '4s', '--op': 0.9 }}>
        {[[660, 70], [690, 54], [720, 40], [750, 30], [780, 20]].map(([y, w]) => <path key={y} d={`M ${1060 - w} ${y} L ${1060 + w} ${y}`} stroke={t('#fff6dc')} strokeWidth={5} strokeLinecap="round" />)}
      </Sprite>
      <Sprite x={980} y={650} w={160} h={160} className={a.shimmer} vars={{ '--d': '4s', '--dl': '-2s', '--op': 0.7 }}>
        {[[675, 46], [705, 60], [735, 34], [765, 24]].map(([y, w]) => <path key={y} d={`M ${1056 - w} ${y} L ${1056 + w} ${y}`} stroke={t('#fff6dc')} strokeWidth={4} strokeLinecap="round" />)}
      </Sprite>
      {/* dock lantern */}
      <Sprite x={1360} y={650} w={110} h={110} className={a.glow} vars={{ '--d': '3s' }}>
        <defs><RadialGlow id={ids('lan')} color="#fde68a" inner={0.95} /></defs>
        <circle cx={1413} cy={704} r={54} fill={ids.url('lan')} />
        <rect x={1400} y={690} width={26} height={30} rx={6} {...ol('#fff3b0', 3, '#b7791f')} />
        <path d="M 1398 690 L 1413 676 L 1428 690 Z" {...ol('#a78bfa', 3)} />
      </Sprite>
      {[[640, 870, 60], [1000, 760, 50], [360, 760, 56], [1160, 860, 64], [820, 900, 50]].map(([x, y, r], i) => (
        <Sprite key={i} x={x - r} y={y - r * 0.4} w={r * 2} h={r * 0.8} className={a.ripple} vars={{ '--d': `${4.5 + (i % 3)}s`, '--dl': `${-i * 1.4}s` }}>
          <ellipse cx={x} cy={y} rx={r * 0.92} ry={r * 0.3} fill="none" stroke={t('#eef0ff')} strokeWidth={4} />
        </Sprite>
      ))}
      <ParticleField count={8} seed={17} x0={260} x1={1340} y={420} h={480} size={[18, 30]} dur={[7, 11]} dir="rise" particleClass={a.wobble} render={() => <BubbleParticle color="#c7d2fe" />} />
      <Twinkles points={[[240, 860], [560, 900], [900, 930], [1260, 950], [1500, 900], [120, 960], [760, 960]]} color="#fef08a" glow="#fde047" r={7} kind="dot" />
    </Stage>
  )
}

function LeftEdge() {
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <Rock x={110} y={1004} s={1.6} fill="#ddd6f3" />
        <Reed x={220} y={1004} h={200} lean={-14} />
        <Reed x={250} y={1004} h={160} lean={16} />
        <Reed x={190} y={1004} h={120} lean={-6} cattail={false} />
        <Lavender x={300} y={1004} s={1.5} />
        <Lavender x={340} y={1004} s={1.2} h={80} />
        <Lavender x={40} y={1004} s={1.3} />
        <Tuft x={370} y={1004} s={1.2} fill="#86c98e" />
      </Art>
    </Stage>
  )
}

function PaperLantern({ x, y, color, i }: { x: number; y: number; color: string; i: number }) {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Sprite x={x - 40} y={y} w={80} h={130} className={a.swing} vars={{ '--d': `${4 + i * 0.7}s`, '--dl': `${-i}s`, '--deg': '4deg' }}>
      <defs><RadialGlow id={ids(`pl${i}`)} color={color} inner={0.8} /></defs>
      <path d={`M ${x} ${y} L ${x} ${y + 40}`} stroke={t('#6b4f8a')} strokeWidth={2.5} />
      <circle cx={x} cy={y + 72} r={42} fill={ids.url(`pl${i}`)} />
      <ellipse cx={x} cy={y + 72} rx={22} ry={28} {...ol(color, 3)} />
      <path d={`M ${x - 22} ${y + 72} Q ${x} ${y + 80} ${x + 22} ${y + 72} M ${x - 20} ${y + 60} Q ${x} ${y + 66} ${x + 20} ${y + 60} M ${x - 20} ${y + 85} Q ${x} ${y + 92} ${x + 20} ${y + 85}`} fill="none" stroke={t(shade(color, 0.15))} strokeWidth={2} />
      <rect x={x - 10} y={y + 40} width={20} height={6} rx={3} fill={t('#6b4f8a')} />
      <rect x={x - 10} y={y + 98} width={20} height={6} rx={3} fill={t('#6b4f8a')} />
    </Sprite>
  )
}

function RightEdge() {
  const t = useTint()
  const ol = useOutline()
  const BLOSSOM = '#e9b3f0'
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <path d="M 200 1004 C 250 950 262 880 262 800 C 262 680 270 540 260 400 L 340 400 C 340 540 350 680 352 800 C 354 880 366 950 404 1004 Z" {...ol('#9c7a8f', 5)} />
        <path d="M 262 560 Q 190 520 120 470" fill="none" stroke={t(shade('#9c7a8f'))} strokeWidth={22} strokeLinecap="round" />
        <path d="M 262 560 Q 190 520 120 470" fill="none" stroke={t('#9c7a8f')} strokeWidth={14} strokeLinecap="round" />
        <Blob circles={[[300, 280, 130], [170, 240, 100], [380, 150, 110], [250, 120, 90], [110, 370, 64], [400, 360, 80]]} fill={BLOSSOM} stroke={shade(BLOSSOM)} sw={5} />
        <ellipse cx={210} cy={150} rx={32} ry={18} fill={t(light(BLOSSOM, 0.5))} transform="rotate(-20 210 150)" />
        {[[180, 300], [260, 200], [340, 300], [300, 120], [140, 230], [380, 230]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={7} fill={t('#fdf2f8')} stroke={t(shade(BLOSSOM, 0.2))} strokeWidth={2} />
        ))}
        <Reed x={120} y={1004} h={150} lean={-10} />
        <Lavender x={60} y={1004} s={1.3} />
        <Tuft x={170} y={1004} s={1.2} fill="#86c98e" />
      </Art>
      <PaperLantern x={130} y={480} color="#f9a8d4" i={0} />
      <PaperLantern x={200} y={520} color="#fde68a" i={1} />
    </Stage>
  )
}

export function LakeScene() {
  return (
    <>
      <Sky stops={[[0, '#d6c4f6'], [52, '#efd8f2'], [100, '#ffe3d4']]} />
      <Pano />
      <LeftEdge />
      <RightEdge />
    </>
  )
}
