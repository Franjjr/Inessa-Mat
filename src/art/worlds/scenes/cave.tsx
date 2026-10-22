/* La Cueva del Seis (w3): a warm, glowing crystal chamber seen through a rocky arch. Glowing ladybugs wander,
   crystals pulse, a sunbeam falls from a skylight. Calm centre: the bright chamber. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { CrystalCluster, Mushroom, RadialGlow, Rock, Spike } from '../shapes'
import { bumpLine, Sky, Twinkles } from './common'

const WALL = '#cc8f93'
const ARCH = 'M 262 1004 C 248 640 400 150 800 120 C 1200 150 1352 640 1338 1004 Z'

function Pano() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        <defs>
          <RadialGlow id={ids('light')} color="#fff4de" inner={1} />
          <RadialGlow id={ids('cg')} color="#fca5a5" inner={0.8} />
          <RadialGlow id={ids('gg')} color="#fde68a" inner={0.8} />
        </defs>
        <circle cx={800} cy={420} r={620} fill={ids.url('light')} />
        {/* far chamber */}
        <path d={bumpLine(200, 1400, 640, 30, 56, 5)} {...ol('#efc6b6', 3)} />
        <Spike x={540} y={640} w={60} h={120} dir={-1} fill="#ebbcab" sw={3} />
        <Spike x={600} y={650} w={40} h={70} dir={-1} fill="#ebbcab" sw={3} />
        <Spike x={1040} y={640} w={56} h={110} dir={-1} fill="#ebbcab" sw={3} />
        <Spike x={1090} y={652} w={36} h={60} dir={-1} fill="#ebbcab" sw={3} />
        <circle cx={680} cy={640} r={70} fill={ids.url('cg')} />
        <CrystalCluster x={680} y={662} s={0.5} color="#fca5a5" sw={3} />
        <circle cx={930} cy={650} r={60} fill={ids.url('gg')} />
        <CrystalCluster x={930} y={668} s={0.42} color="#fcd34d" sw={3} flip />
        {/* tiny tunnel where the ladybug went */}
        <path d="M 1100 760 Q 1100 676 1170 672 Q 1240 676 1240 760 Z" {...ol('#e2ab9d', 4)} />
        <ellipse cx={1170} cy={736} rx={30} ry={34} {...ol('#7d4655', 4)} />
        <ellipse cx={1170} cy={744} rx={18} ry={22} fill={t('#5e3343')} />
        {/* floor of the chamber */}
        <path d="M 0 790 Q 400 736 800 756 Q 1200 776 1600 736 L 1600 1000 L 0 1000 Z" {...ol('#e8b6a0', 4)} />
        <ellipse cx={820} cy={850} rx={170} ry={26} fill={t('#f6d2bd')} />
        <ellipse cx={780} cy={846} rx={60} ry={8} fill={t('#fff1e4')} />
        {/* rocky arch frame */}
        <path d={`M -10 -10 L 1610 -10 L 1610 1010 L -10 1010 Z ${ARCH}`} fillRule="evenodd" fill={t(WALL)} />
        <path d={ARCH} fill="none" stroke={t('#e6b0a6')} strokeWidth={22} />
        <path d={ARCH} fill="none" stroke={t(shade(WALL))} strokeWidth={6} strokeLinejoin="round" />
        {/* wall texture */}
        <g fill="none" stroke={t(shade(WALL, 0.16))} strokeWidth={6} strokeLinecap="round">
          <path d="M 80 220 Q 140 200 180 236 M 60 520 Q 120 500 160 540 M 150 760 Q 200 740 240 770 M 1420 260 Q 1480 240 1530 270 M 1450 580 Q 1500 560 1550 596 M 1380 820 Q 1430 800 1470 826" />
        </g>
        <g fill={t(light(WALL, 0.25))}>
          <ellipse cx={120} cy={120} rx={40} ry={22} />
          <ellipse cx={1480} cy={140} rx={46} ry={22} />
          <ellipse cx={200} cy={400} rx={26} ry={14} />
          <ellipse cx={1400} cy={440} rx={30} ry={14} />
          <ellipse cx={300} cy={80} rx={60} ry={22} />
          <ellipse cx={1290} cy={70} rx={60} ry={22} />
        </g>
        {[[110, 300, '#fda4af'], [70, 640, '#99f6e4'], [210, 900, '#fda4af'], [1500, 360, '#99f6e4'], [1530, 700, '#fda4af'], [1380, 120, '#fcd34d'], [230, 160, '#fcd34d'], [1460, 900, '#fda4af']].map(([x, y, c], i) => (
          <g key={i}>
            <polygon points={`${x as number},${(y as number) - 12} ${(x as number) + 9},${y as number} ${x as number},${(y as number) + 12} ${(x as number) - 9},${y as number}`} {...ol(c as string, 3)} />
            <circle cx={(x as number) - 2} cy={(y as number) - 3} r={2} fill={t('#ffffff')} />
          </g>
        ))}
        {/* stalactites along the arch */}
        <Spike x={470} y={290} w={46} h={60} fill={WALL} />
        <Spike x={560} y={210} w={40} h={52} fill={WALL} />
        <Spike x={660} y={160} w={34} h={40} fill={WALL} />
        <Spike x={950} y={156} w={36} h={44} fill={WALL} />
        <Spike x={1050} y={200} w={44} h={58} fill={WALL} />
        <Spike x={1140} y={270} w={40} h={50} fill={WALL} />
        {/* floor details */}
        <Spike x={330} y={1004} w={110} h={200} dir={-1} fill="#dda08f" />
        <Spike x={410} y={1004} w={60} h={110} dir={-1} fill="#dda08f" />
        <Spike x={1270} y={1004} w={100} h={180} dir={-1} fill="#dda08f" />
        <Rock x={520} y={940} s={0.7} fill="#e1ad9c" />
        <Rock x={1100} y={960} s={0.8} fill="#e1ad9c" flip />
        {[[640, 980, 7], [700, 900, 5], [960, 920, 6], [1010, 990, 8], [880, 970, 5]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r * 1.6} ry={r} {...ol('#efc4b2', 2.5)} />
        ))}
        <Mushroom x={600} y={900} s={0.55} cap="#99f6e4" dots="#ecfeff" />
        <Mushroom x={630} y={910} s={0.38} cap="#99f6e4" dots="#ecfeff" />
        <Mushroom x={1000} y={880} s={0.45} cap="#fdba74" dots="#fff7ed" />
      </Art>
      {/* sunbeam from a skylight */}
      <Sprite x={560} y={110} w={480} h={760} className={a.glow} vars={{ '--d': '6s' }}>
        <defs>
          <linearGradient id={ids('beam')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t('#ffffff')} stopOpacity={0.55} />
            <stop offset="100%" stopColor={t('#ffffff')} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points="740,120 860,120 1010,860 590,860" fill={ids.url('beam')} />
      </Sprite>
      {/* pulsing crystal glows on the walls */}
      {[[330, 790, 1.25, '#f87171'], [1290, 770, 1.1, '#fb7185'], [560, 870, 0.75, '#fca5a5'], [1060, 860, 0.7, '#f87171']].map(([x, y, s, c], i) => (
        <Sprite key={i} x={(x as number) - 110 * (s as number)} y={(y as number) - 150 * (s as number)} w={220 * (s as number)} h={190 * (s as number)} className={a.glow} vars={{ '--d': `${3.2 + i * 0.6}s`, '--dl': `${-i}s` }}>
          <defs><RadialGlow id={ids(`cw${i}`)} color={c as string} inner={0.75} /></defs>
          <ellipse cx={x as number} cy={(y as number) - 50 * (s as number)} rx={105 * (s as number)} ry={95 * (s as number)} fill={ids.url(`cw${i}`)} />
        </Sprite>
      ))}
      <Art>
        <CrystalCluster x={330} y={790} s={1.25} color="#f87171" />
        <CrystalCluster x={1290} y={770} s={1.1} color="#fb7185" flip />
        <CrystalCluster x={560} y={870} s={0.75} color="#fca5a5" />
        <CrystalCluster x={1060} y={860} s={0.7} color="#f87171" flip />
      </Art>
      <Twinkles points={[[700, 420], [880, 360], [760, 560], [960, 500], [620, 300], [1010, 330], [840, 640]]} color="#fff7d6" r={7} />
      {LADYBUGS.map((l, i) => <Ladybug key={i} {...l} i={i} />)}
    </Stage>
  )
}

const LADYBUGS = [
  { x: 620, y: 470, s: 1 },
  { x: 990, y: 420, s: 0.9 },
  { x: 760, y: 640, s: 0.8 },
  { x: 1150, y: 560, s: 1.1 },
  { x: 450, y: 600, s: 0.9 },
]

function Ladybug({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  const t = useTint()
  const ids = useIds()
  const r = 21 * s
  return (
    <Sprite x={x - r * 3} y={y - r * 3} w={r * 6} h={r * 6} className={a.wander} vars={{ '--d': `${13 + i * 2}s`, '--dl': `${-i * 3}s`, '--wx': '90%', '--wy': '60%' }} inner={a.glow} innerVars={{ '--d': `${2 + (i % 3) * 0.5}s` }}>
      <defs><RadialGlow id={ids(`lb${i}`)} color="#fde68a" inner={0.95} /></defs>
      <circle cx={x} cy={y} r={r * 2.8} fill={ids.url(`lb${i}`)} />
      <circle cx={x} cy={y - r * 0.8} r={r * 0.5} fill={t('#3b2f4a')} />
      <circle cx={x} cy={y} r={r * 0.85} fill={t('#ef4444')} stroke={t('#9f1239')} strokeWidth={2} />
      <path d={`M ${x} ${y - r * 0.85} L ${x} ${y + r * 0.85}`} stroke={t('#3b2f4a')} strokeWidth={1.8} />
      <circle cx={x - r * 0.4} cy={y - r * 0.1} r={r * 0.18} fill={t('#3b2f4a')} />
      <circle cx={x + r * 0.42} cy={y + r * 0.2} r={r * 0.18} fill={t('#3b2f4a')} />
      <circle cx={x - r * 0.3} cy={y + r * 0.45} r={r * 0.14} fill={t('#3b2f4a')} />
      <circle cx={x - r * 0.35} cy={y - r * 0.45} r={r * 0.16} fill={t('#ffffff')} opacity={0.8} />
    </Sprite>
  )
}

function LeftEdge() {
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <Spike x={120} y={1004} w={190} h={420} dir={-1} fill="#c98580" sw={5} />
        <Spike x={250} y={1004} w={120} h={230} dir={-1} fill="#d4928a" sw={5} />
        <CrystalCluster x={170} y={1000} s={1.5} color="#f87171" sw={5} />
        <Mushroom x={330} y={1000} s={0.9} cap="#99f6e4" dots="#ecfeff" />
        <Mushroom x={370} y={1000} s={0.6} cap="#99f6e4" dots="#ecfeff" />
      </Art>
    </Stage>
  )
}

function RightEdge() {
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <Rock x={300} y={1004} s={2.6} fill="#c98580" sw={5} flip />
        <CrystalCluster x={280} y={900} s={1.2} color="#fb7185" sw={5} flip />
        <CrystalCluster x={110} y={1000} s={0.9} color="#fcd34d" sw={5} />
        <Mushroom x={30} y={1000} s={0.7} cap="#fdba74" dots="#fff7ed" />
      </Art>
    </Stage>
  )
}

function Ceiling({ side }: { side: 'tl' | 'tr' }) {
  const t = useTint()
  const flip = side === 'tr'
  return (
    <Stage w={400} h={400} anchor={side}>
      <Art>
        <g transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
          <Spike x={70} y={-6} w={130} h={250} fill="#bf8189" sw={5} />
          <Spike x={190} y={-6} w={76} h={140} fill="#bf8189" sw={5} />
          <Spike x={266} y={-6} w={46} h={70} fill="#bf8189" sw={4} />
          <circle cx={70} cy={262} r={7} fill={t('#fbcfe8')} />
          <circle cx={190} cy={150} r={5} fill={t('#fbcfe8')} />
        </g>
      </Art>
    </Stage>
  )
}

export function CaveScene() {
  return (
    <>
      <Sky stops={[[0, '#fbe2cf'], [50, '#f6d4c2'], [100, '#ecbcab']]} />
      <Pano />
      <LeftEdge />
      <RightEdge />
      <Ceiling side="tl" />
      <Ceiling side="tr" />
    </>
  )
}
