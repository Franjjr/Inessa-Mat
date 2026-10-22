/* El Bosque de los Grupos (w1): morning light through tall trees, a winding path, mushrooms, falling leaves,
   fairy lanterns and fireflies. Calm centre: the open clearing and pale sky. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { Blob, Bush, Butterfly, Daisy, Flower, LeafParticle, Mushroom, Pine, RadialGlow, Rock, RoundTree, Tuft } from '../shapes'
import { bumpLine, DriftClouds, ParticleField, Sky, Twinkles } from './common'

const LEAF = '#5cb87a'
const LEAF_DARK = '#46a366'
const TRUNK = '#b07d52'

function Pano() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        <defs>
          <RadialGlow id={ids('sun')} color="#fff6c4" inner={1} />
        </defs>
        <circle cx={1060} cy={170} r={250} fill={ids.url('sun')} />
        <circle cx={1060} cy={170} r={58} {...ol('#fff1a8', 4, '#f2cf6b')} />
        <circle cx={1043} cy={152} r={14} fill={t('#fffbe0')} />
        {/* far hills + tree line */}
        <path d="M 0 560 Q 180 470 380 520 Q 560 560 760 500 Q 960 445 1160 510 Q 1360 560 1600 480 L 1600 1000 L 0 1000 Z" {...ol('#c6ead4', 3)} />
        <path d={bumpLine(-20, 1640, 590, 22, 40, 7)} {...ol('#a8dbbd', 3)} />
        <path d={bumpLine(-40, 1640, 632, 26, 46, 11)} {...ol('#93d1aa', 3)} />
        {/* mid hill */}
        <path d="M 0 700 Q 260 630 560 668 Q 820 700 1060 660 Q 1340 616 1600 664 L 1600 1000 L 0 1000 Z" {...ol('#86cc98', 4)} />
        <Pine x={470} y={676} s={0.55} fill="#4f9f7a" />
        <Pine x={512} y={684} s={0.42} fill="#5aa984" />
        <Pine x={1130} y={662} s={0.6} fill="#4f9f7a" />
        <Pine x={1176} y={668} s={0.44} fill="#5aa984" />
        <RoundTree x={604} y={692} s={0.55} leaf="#6fc38c" />
        <RoundTree x={1018} y={684} s={0.5} leaf="#6fc38c" />
        <RoundTree x={300} y={712} s={0.78} leaf="#62bb80" />
        <RoundTree x={1330} y={700} s={0.82} leaf="#62bb80" fruit="#fca5a5" />
        <Pine x={180} y={730} s={0.8} fill="#4a9a75" />
        <Pine x={1460} y={720} s={0.86} fill="#4a9a75" />
        {/* meadow */}
        <path d="M 0 790 Q 380 730 800 760 Q 1210 790 1600 740 L 1600 1000 L 0 1000 Z" {...ol('#7cc58f', 4)} />
        {/* winding path */}
        <path
          d="M 800 664 C 784 684 772 704 794 724 C 826 752 902 768 884 812 C 866 856 744 884 694 940 C 676 962 664 984 654 1004 L 1012 1004 C 1002 962 1018 930 1040 900 C 1068 852 1010 800 958 780 C 902 758 842 734 852 704 C 858 686 846 672 830 664 Z"
          {...ol('#f6e5bc', 4, '#d9bd88')}
        />
        <path d="M 830 700 Q 846 720 880 734 M 900 800 Q 930 820 920 846 M 780 900 Q 820 880 860 890" fill="none" stroke={t('#ead39f')} strokeWidth={5} strokeLinecap="round" />
        {[[760, 974, 9], [992, 960, 8], [732, 930, 6], [1012, 900, 6], [868, 852, 5], [948, 808, 5], [800, 740, 4]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r * 1.6} ry={r} {...ol('#e8d6ad', 2.5)} />
        ))}
        {/* meadow details */}
        <Bush x={560} y={800} s={0.8} fill="#62b97c" />
        <Bush x={1170} y={796} s={0.7} fill="#62b97c" berries="#f9a8d4" />
        <Rock x={1260} y={850} s={0.55} fill="#cfd7d0" />
        <Mushroom x={734} y={872} s={0.62} />
        <Mushroom x={1092} y={868} s={0.5} cap="#fb923c" />
        {[[520, 860, '#f9a8d4'], [600, 900, '#fde68a'], [470, 930, '#c4b5fd'], [1150, 920, '#f9a8d4'], [1210, 960, '#fde68a'], [1290, 900, '#c4b5fd'], [640, 960, '#fca5a5'], [400, 880, '#fde68a']].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} s={0.7} petal={c as string} stemH={22} />
        ))}
        {[[560, 940], [1110, 980], [1240, 930], [430, 970]].map(([x, y], i) => <Daisy key={i} x={x} y={y} s={0.8} />)}
        {[[380, 820], [700, 800], [960, 810], [1400, 800], [520, 990], [1180, 860], [1320, 980], [330, 940]].map(([x, y], i) => (
          <Tuft key={i} x={x} y={y} s={0.9} fill="#5fb878" />
        ))}
      </Art>
      <DriftClouds clouds={[{ x: 560, y: 250, s: 0.8, d: 60 }, { x: 1300, y: 330, s: 0.6, d: 70 }, { x: 760, y: 120, s: 0.48, d: 54 }]} stroke="#c3e5d6" />
      {/* sun rays */}
      <Sprite x={760} y={120} w={640} h={640} className={a.glow} vars={{ '--d': '7s' }}>
        <defs>
          <linearGradient id={ids('ray')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t('#ffffff')} stopOpacity={0.5} />
            <stop offset="100%" stopColor={t('#ffffff')} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g fill={ids.url('ray')}>
          <polygon points="1020,170 1090,170 900,760 790,760" />
          <polygon points="1046,180 1080,180 1090,760 1020,760" opacity={0.7} />
          <polygon points="1080,180 1110,180 1360,720 1290,740" opacity={0.6} />
        </g>
      </Sprite>
      <Sprite x={418} y={730} w={70} h={60} className={a.bob} vars={{ '--d': '4s', '--by': '-25%' }} inner={a.wander} innerVars={{ '--d': '14s', '--wx': '120%', '--wy': '50%' }}>
        <Butterfly cx={453} cy={760} s={0.9} flapClass={a.flap} />
      </Sprite>
      <Sprite x={1200} y={700} w={70} h={60} className={a.bob} vars={{ '--d': '5s', '--dl': '-2s', '--by': '-30%' }} inner={a.wander} innerVars={{ '--d': '17s', '--wx': '-140%', '--wy': '40%' }}>
        <Butterfly cx={1235} cy={730} s={0.8} wing="#fde68a" wing2="#fdba74" flapClass={a.flap} />
      </Sprite>
    </Stage>
  )
}

function Lantern({ x, y }: { x: number; y: number }) {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Sprite x={x - 40} y={y} w={80} h={120} className={a.swing} vars={{ '--d': '4.5s', '--deg': '5deg' }}>
      <defs><RadialGlow id={ids('lan')} color="#fde68a" inner={0.9} /></defs>
      <path d={`M ${x} ${y} L ${x} ${y + 42}`} stroke={t('#7a5230')} strokeWidth={3} />
      <circle cx={x} cy={y + 66} r={36} fill={ids.url('lan')} />
      <path d={`M ${x - 13} ${y + 50} L ${x + 13} ${y + 50} L ${x + 16} ${y + 82} L ${x - 16} ${y + 82} Z`} {...ol('#fff3b0', 3, '#c98a2e')} />
      <rect x={x - 17} y={y + 42} width={34} height={9} rx={4} {...ol('#c084fc', 3)} />
      <rect x={x - 19} y={y + 81} width={38} height={8} rx={4} {...ol('#c084fc', 3)} />
      <circle cx={x} cy={y + 66} r={6} fill={t('#fbbf24')} />
    </Sprite>
  )
}

function LeftEdge() {
  const t = useTint()
  const ol = useOutline()
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <path d="M 150 440 Q 250 420 340 452" fill="none" stroke={t(shade(TRUNK))} strokeWidth={22} strokeLinecap="round" />
        <path d="M 150 440 Q 250 420 340 452" fill="none" stroke={t(TRUNK)} strokeWidth={14} strokeLinecap="round" />
        <path d="M 20 1004 C 58 964 70 904 72 820 C 74 700 66 560 84 400 L 176 400 C 164 560 152 700 162 820 C 168 904 196 964 246 1004 Z" {...ol(TRUNK, 5)} />
        <path d="M 104 520 Q 96 600 110 680 M 132 760 Q 126 820 140 880 M 96 900 Q 80 950 60 990" fill="none" stroke={t(shade(TRUNK, 0.2))} strokeWidth={5} strokeLinecap="round" />
        <Blob circles={[[40, 300, 150], [190, 260, 120], [300, 330, 76], [110, 140, 120], [250, 140, 86], [-10, 120, 110]]} fill={LEAF} stroke={shade(LEAF)} sw={5} />
        <Blob circles={[[60, 380, 70], [180, 360, 60], [270, 370, 44]]} fill={LEAF_DARK} stroke={shade(LEAF)} sw={4} />
        <ellipse cx={90} cy={90} rx={36} ry={20} fill={t(light(LEAF, 0.4))} transform="rotate(-20 90 90)" />
        <ellipse cx={226} cy={176} rx={22} ry={13} fill={t(light(LEAF, 0.4))} transform="rotate(-24 226 176)" />
        <ellipse cx={168} cy={92} rx={14} ry={9} fill={t(light(LEAF, 0.4))} />
        <path d="M 52 236 q 14 -16 28 0 q 14 -16 28 0 M 196 296 q 14 -16 28 0 q 14 -16 28 0" fill="none" stroke={t(shade(LEAF, 0.12))} strokeWidth={4.5} strokeLinecap="round" />
        <Bush x={196} y={1004} s={1.5} fill="#4fae6e" berries="#f472b6" />
        <Mushroom x={334} y={996} s={1.05} />
        <Mushroom x={292} y={1000} s={0.68} cap="#fb923c" />
        <Tuft x={40} y={1000} s={1.3} fill="#5fb878" />
        <Tuft x={370} y={1000} s={1.1} fill="#5fb878" />
        <Flower x={110} y={1000} s={1.1} petal="#c4b5fd" stemH={30} />
      </Art>
      <Lantern x={290} y={440} />
    </Stage>
  )
}

function RightEdge() {
  const t = useTint()
  const ol = useOutline()
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <path d="M 160 1004 C 220 960 236 900 236 820 C 236 680 240 520 230 340 L 330 340 C 330 520 340 680 346 820 C 350 900 360 960 404 1004 Z" {...ol('#a8744a', 5)} />
        <path d="M 260 520 Q 252 600 266 680 M 300 760 Q 296 820 310 880" fill="none" stroke={t(shade('#a8744a', 0.2))} strokeWidth={5} strokeLinecap="round" />
        {/* hollow */}
        <ellipse cx={282} cy={560} rx={22} ry={30} {...ol('#5b3a24', 4)} />
        {/* little round door */}
        <path d="M 250 1004 L 250 946 A 36 36 0 0 1 322 946 L 322 1004 Z" {...ol('#f59e8b', 4)} />
        <path d="M 286 912 L 286 1004 M 250 950 L 322 950" stroke={t(shade('#f59e8b', 0.2))} strokeWidth={3} />
        <circle cx={310} cy={972} r={4} fill={t('#fde68a')} stroke={t('#b45309')} strokeWidth={2} />
        <circle cx={256} cy={880} r={13} {...ol('#fff3b0', 3, '#c98a2e')} />
        <path d="M 256 867 L 256 893 M 243 880 L 269 880" stroke={t('#c98a2e')} strokeWidth={2.5} />
        <Blob circles={[[300, 250, 140], [170, 200, 110], [380, 120, 120], [240, 90, 100], [110, 320, 70], [400, 330, 90]]} fill="#58b576" stroke={shade(LEAF)} sw={5} />
        <Blob circles={[[220, 330, 62], [320, 360, 70], [140, 330, 40]]} fill={LEAF_DARK} stroke={shade(LEAF)} sw={4} />
        <ellipse cx={200} cy={130} rx={34} ry={18} fill={t(light(LEAF, 0.4))} transform="rotate(-22 200 130)" />
        <ellipse cx={130} cy={210} rx={18} ry={11} fill={t(light(LEAF, 0.4))} transform="rotate(-22 130 210)" />
        <path d="M 156 256 q 14 -16 28 0 q 14 -16 28 0 M 290 196 q 14 -16 28 0 q 14 -16 28 0" fill="none" stroke={t(shade(LEAF, 0.12))} strokeWidth={4.5} strokeLinecap="round" />
        <Bush x={110} y={1004} s={1.2} fill="#4fae6e" />
        <Flower x={40} y={1000} s={1.1} petal="#f9a8d4" stemH={34} />
        <Flower x={196} y={1000} s={0.9} petal="#fde68a" stemH={24} />
        <Daisy x={360} y={1000} s={1} />
        <Tuft x={10} y={1000} s={1.2} fill="#5fb878" />
      </Art>
    </Stage>
  )
}

function Fx() {
  return (
    <Stage w={1600} h={1000}>
      <ParticleField
        count={9}
        seed={3}
        size={[24, 34]}
        dur={[13, 20]}
        render={(i) => <LeafParticle color={['#86d39b', '#fbbf24', '#a3e635', '#fb923c', '#6cc58a'][i % 5]} />}
      />
      <Twinkles points={[[340, 610], [520, 560], [700, 640], [930, 590], [1090, 560], [1250, 620], [1420, 600], [620, 760], [1010, 720]]} color="#fef08a" glow="#fde047" r={7} kind="dot" />
    </Stage>
  )
}

export function ForestScene() {
  return (
    <>
      <Sky stops={[[0, '#c4e9d9'], [50, '#e6f6e1'], [100, '#fbf3d2']]} />
      <Pano />
      <LeftEdge />
      <RightEdge />
      <Fx />
    </>
  )
}
