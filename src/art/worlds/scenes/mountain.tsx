/* La Montaña de las Restas (w4): snowy peaks, a cosy cabin with a smoking chimney, snowy pines, a frozen pond
   and gentle snowfall. Calm centre: pale sky over the peaks and the open snowfield. */
import a from '../ambient.module.css'
import { light, mix, shade } from '../color'
import { Art, Lane, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { Pine, RadialGlow, Rock, SmokeParticle, SnowParticle } from '../shapes'
import { DriftClouds, ParticleField, Sky, Twinkles } from './common'

function Peak({ cx, top, hw, base = 660, fill, snowK = 0.34 }: { cx: number; top: number; hw: number; base?: number; fill: string; snowK?: number }) {
  const t = useTint()
  const ol = useOutline()
  const H = base - top
  const k = snowK
  const sy = top + k * H
  const sx = k * hw
  return (
    <g>
      <path d={`M ${cx - hw} ${base} L ${cx - 16} ${top + 20} Q ${cx} ${top} ${cx + 16} ${top + 20} L ${cx + hw} ${base} Z`} {...ol(fill, 3.5)} />
      <path d={`M ${cx + 6} ${top + 8} L ${cx + hw - 6} ${base} L ${cx + hw * 0.18} ${base} Z`} fill={t(mix(fill, '#9cc3d6', 0.32))} />
      <path
        d={`M ${cx - sx} ${sy} L ${cx - 16} ${top + 20} Q ${cx} ${top} ${cx + 16} ${top + 20} L ${cx + sx} ${sy} L ${cx + sx * 0.45} ${sy - H * 0.05} L ${cx + sx * 0.05} ${sy + H * 0.06} L ${cx - sx * 0.4} ${sy - H * 0.04} Z`}
        {...ol('#ffffff', 3.5, shade(fill, 0.12))}
      />
      <path d={`M ${cx - 10} ${top + 30} Q ${cx - sx * 0.5} ${top + H * 0.18} ${cx - sx * 0.6} ${sy - 10}`} fill="none" stroke={t('#e0f2fe')} strokeWidth={5} strokeLinecap="round" />
    </g>
  )
}

function Cabin({ x, y }: { x: number; y: number }) {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <g>
      <defs><RadialGlow id={ids('win')} color="#fde68a" inner={0.9} /></defs>
      <rect x={x - 66} y={y - 84} width={132} height={84} rx={6} {...ol('#d9a37a', 4)} />
      {[-62, -44, -26].map((dy) => <path key={dy} d={`M ${x - 62} ${y + dy} L ${x + 62} ${y + dy}`} stroke={t(shade('#d9a37a', 0.18))} strokeWidth={3} />)}
      <rect x={x + 28} y={y - 150} width={22} height={50} rx={3} {...ol('#b9a7a0', 4)} />
      <rect x={x + 24} y={y - 156} width={30} height={10} rx={4} {...ol('#ffffff', 3, '#9cc4d4')} />
      <path d={`M ${x - 86} ${y - 76} L ${x} ${y - 140} L ${x + 86} ${y - 76} Q ${x + 90} ${y - 66} ${x + 78} ${y - 66} L ${x - 78} ${y - 66} Q ${x - 90} ${y - 66} ${x - 86} ${y - 76} Z`} {...ol('#ffffff', 4, '#9cc4d4')} />
      <path d={`M ${x - 70} ${y - 72} q 10 10 20 0 q 10 12 22 0 q 10 10 20 0`} fill="none" stroke={t('#cfe7f1')} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x - 30} cy={y - 34} r={44} fill={ids.url('win')} />
      <rect x={x - 46} y={y - 50} width={32} height={30} rx={5} {...ol('#fde68a', 3.5, '#b7791f')} />
      <path d={`M ${x - 30} ${y - 50} L ${x - 30} ${y - 20} M ${x - 46} ${y - 35} L ${x - 14} ${y - 35}`} stroke={t('#b7791f')} strokeWidth={3} />
      <path d={`M ${x + 6} ${y} L ${x + 6} ${y - 42} Q ${x + 24} ${y - 56} ${x + 42} ${y - 42} L ${x + 42} ${y} Z`} {...ol('#a8674a', 3.5)} />
      <circle cx={x + 34} cy={y - 20} r={3} fill={t('#fde68a')} />
      <path d={`M ${x - 80} ${y + 2} Q ${x} ${y - 8} ${x + 80} ${y + 2}`} fill="none" stroke={t('#ffffff')} strokeWidth={10} strokeLinecap="round" />
    </g>
  )
}

function Snowman({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const t = useTint()
  const ol = useOutline()
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-46} r={48} {...ol('#ffffff', 4, '#9cc4d4')} />
      <circle cx={0} cy={-126} r={36} {...ol('#ffffff', 4, '#9cc4d4')} />
      <path d="M -34 -96 Q 0 -80 34 -96 L 30 -84 Q 0 -70 -30 -84 Z" {...ol('#f472b6', 3)} />
      <path d="M 18 -88 L 30 -48 L 14 -50 Z" {...ol('#f472b6', 3)} />
      <circle cx={-12} cy={-134} r={4.5} fill={t('#3b2f4a')} />
      <circle cx={12} cy={-134} r={4.5} fill={t('#3b2f4a')} />
      <path d="M -2 -124 L 20 -118 L -2 -114 Z" {...ol('#fb923c', 2.5)} />
      <ellipse cx={-22} cy={-120} rx={6} ry={3.5} fill={t('#fbcfe8')} />
      <ellipse cx={22} cy={-120} rx={6} ry={3.5} fill={t('#fbcfe8')} />
      <path d="M -8 -110 Q 0 -104 8 -110" fill="none" stroke={t('#3b2f4a')} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={0} cy={-58} r={4} fill={t('#7c3aed')} />
      <circle cx={0} cy={-38} r={4} fill={t('#7c3aed')} />
      <path d="M -42 -60 L -84 -86 M -70 -78 L -78 -96" stroke={t('#a47148')} strokeWidth={5} strokeLinecap="round" />
      <path d="M -26 -158 Q 0 -150 26 -158 L 22 -170 Q 0 -196 -22 -170 Z" {...ol('#a78bfa', 3)} />
      <circle cx={0} cy={-186} r={8} {...ol('#ffffff', 2.5, '#9cc4d4')} />
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
        <defs><RadialGlow id={ids('sun')} color="#fffbe6" inner={1} /></defs>
        <circle cx={1150} cy={170} r={220} fill={ids.url('sun')} />
        <circle cx={1150} cy={170} r={44} {...ol('#fff7c2', 4, '#f2d27a')} />
        {/* back range */}
        <Peak cx={290} top={340} hw={300} fill="#c6e2ee" />
        <Peak cx={1340} top={330} hw={310} fill="#c6e2ee" />
        <Peak cx={640} top={220} hw={340} fill="#b5d8e7" snowK={0.38} />
        <Peak cx={1020} top={270} hw={320} fill="#bcdcea" />
        {/* front range */}
        <Peak cx={460} top={430} hw={230} base={700} fill="#d6ebf3" snowK={0.5} />
        <Peak cx={1200} top={450} hw={220} base={700} fill="#d6ebf3" snowK={0.5} />
        {/* snowy slopes */}
        <path d="M 0 704 Q 300 632 640 676 Q 960 718 1280 650 Q 1450 616 1600 648 L 1600 1000 L 0 1000 Z" {...ol('#f4fafd', 4, '#a9cfdf')} />
        <path d="M 120 740 Q 300 700 520 720 M 1100 700 Q 1250 680 1420 700" fill="none" stroke={t('#dcedf5')} strokeWidth={8} strokeLinecap="round" />
        <Pine x={330} y={720} s={0.6} fill="#3f8f88" snow />
        <Pine x={372} y={728} s={0.45} fill="#4a9b92" snow />
        <Pine x={1300} y={690} s={0.62} fill="#3f8f88" snow />
        <Pine x={1340} y={700} s={0.44} fill="#4a9b92" snow />
        <Pine x={560} y={706} s={0.42} fill="#4a9b92" snow />
        <Cabin x={1010} y={714} />
        <Pine x={1110} y={720} s={0.5} fill="#3f8f88" snow />
        {/* front snowfield */}
        <path d="M 0 806 Q 400 752 800 778 Q 1200 802 1600 760 L 1600 1000 L 0 1000 Z" {...ol('#ffffff', 4, '#b3d4e2')} />
        {/* frozen pond */}
        <ellipse cx={600} cy={872} rx={170} ry={40} {...ol('#cdeefa', 4, '#7fb7cc')} />
        <path d="M 500 864 L 560 856 M 620 884 L 700 874 M 640 856 L 668 852" stroke={t('#ffffff')} strokeWidth={5} strokeLinecap="round" />
        {/* sled tracks */}
        <path d="M 1060 760 C 1000 820 1100 880 980 1004 M 1086 762 C 1026 822 1126 882 1006 1004" fill="none" stroke={t('#d7ebf4')} strokeWidth={6} strokeLinecap="round" />
        {[[860, 960], [890, 930], [850, 900], [880, 870]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={7} ry={4} fill={t('#d7ebf4')} />)}
        <Rock x={1260} y={900} s={0.7} fill="#dde7ef" flip />
        <path d="M 1214 868 Q 1250 846 1290 866" fill="none" stroke={t('#ffffff')} strokeWidth={8} strokeLinecap="round" />
      </Art>
      <DriftClouds clouds={[{ x: 300, y: 200, s: 0.8, d: 66 }, { x: 860, y: 120, s: 0.55, d: 74 }]} stroke="#bcdcea" />
      {/* chimney smoke */}
      {[0, 1, 2].map((i) => (
        <Lane key={i} x={1049 + i * 4} y={430} h={130} size={34} dir="rise" laneClass={a.rise} particleClass={a.puff} vars={{ '--d': '6s', '--dl': `${-i * 2}s`, '--op': 0.9 }}>
          <SmokeParticle />
        </Lane>
      ))}
      <Twinkles points={[[420, 930], [760, 820], [1180, 960], [980, 860], [300, 860], [1420, 880]]} color="#e0f7ff" r={9} />
      <Sprite x={430} y={830} w={340} h={84} className={a.shimmer} vars={{ '--d': '5s', '--op': 0.8 }}>
        <path d="M 470 872 Q 600 846 730 872" fill="none" stroke={t(light('#cdeefa', 0.8))} strokeWidth={6} strokeLinecap="round" />
      </Sprite>
    </Stage>
  )
}

function LeftEdge() {
  const t = useTint()
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <Pine x={130} y={1004} s={2.5} fill="#3f8f88" snow sw={5} />
        <Pine x={300} y={1004} s={1.6} fill="#4a9b92" snow sw={5} />
        <Rock x={250} y={1004} s={1.2} fill="#dde7ef" />
        <path d="M 196 962 Q 250 936 300 964" fill="none" stroke={t('#ffffff')} strokeWidth={12} strokeLinecap="round" />
      </Art>
    </Stage>
  )
}

function RightEdge() {
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <Pine x={300} y={1004} s={2.3} fill="#3f8f88" snow sw={5} />
        <Snowman x={130} y={1000} s={1.05} />
      </Art>
    </Stage>
  )
}

function Snowfall() {
  return (
    <Stage w={1600} h={1000}>
      <ParticleField count={18} seed={9} size={[14, 26]} dur={[10, 16]} swayDur={[2.2, 3.6]} particleClass={a.wobble} render={() => <SnowParticle />} />
    </Stage>
  )
}

export function MountainScene() {
  return (
    <>
      <Sky stops={[[0, '#c5eaf7'], [60, '#e7f7fd'], [100, '#f7fdff']]} />
      <Pano />
      <LeftEdge />
      <RightEdge />
      <Snowfall />
    </>
  )
}
