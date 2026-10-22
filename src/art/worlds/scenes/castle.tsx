/* El Castillo del Reparto (w8): Queen Aurora's pastel castle on a golden morning, flags waving, a path through
   the meadow, hedges, a golden-fruit tree and a royal banner; birds glide and golden sparkles twinkle. */
import a from '../ambient.module.css'
import { light } from '../color'
import { Art, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { Bush, Daisy, Flower, RadialGlow, RoundTree, Tuft } from '../shapes'
import { bumpLine, DriftClouds, Sky, Twinkles } from './common'

const WALL = '#fdf3e1'
const TOWER = '#ede9fe'

function Flag({ x, y, color = '#fbbf24', w = 52, i = 0 }: { x: number; y: number; color?: string; w?: number; i?: number }) {
  const ol = useOutline()
  return (
    <Sprite x={x} y={y - 4} w={w + 6} h={34} className={a.flag} vars={{ '--d': `${1.4 + (i % 3) * 0.25}s`, '--dl': `${-i * 0.4}s` }}>
      <path d={`M ${x} ${y} Q ${x + w * 0.5} ${y - 4} ${x + w} ${y + 6} L ${x + w * 0.72} ${y + 13} L ${x + w} ${y + 22} Q ${x + w * 0.5} ${y + 26} ${x} ${y + 24} Z`} {...ol(color, 3)} />
    </Sprite>
  )
}

function Castle() {
  const t = useTint()
  const ol = useOutline()
  const cren = (x0: number, x1: number, y: number, fill: string) => {
    const out = []
    for (let x = x0; x < x1 - 4; x += 26) out.push(<rect key={x} x={x} y={y - 16} width={16} height={18} rx={3} {...ol(fill, 3.5)} />)
    return out
  }
  return (
    <g>
      {/* curtain wall */}
      {cren(676, 924, 502, WALL)}
      <rect x={670} y={500} width={260} height={152} rx={4} {...ol(WALL, 4)} />
      {/* side towers */}
      {[600, 920].map((x) => (
        <g key={x}>
          <rect x={x} y={420} width={80} height={232} rx={4} {...ol(TOWER, 4)} />
          <path d={`M ${x - 12} ${424} L ${x + 40} ${300} L ${x + 92} ${424} Z`} {...ol('#c4b5fd', 4)} />
          <path d={`M ${x + 30} ${330} L ${x + 8} ${410}`} stroke={t(light('#c4b5fd', 0.45))} strokeWidth={6} strokeLinecap="round" />
          <circle cx={x + 40} cy={470} r={13} {...ol('#fde68a', 3.5, '#b7791f')} />
          <path d={`M ${x + 26} ${600} L ${x + 26} ${570} Q ${x + 40} ${556} ${x + 54} ${570} L ${x + 54} ${600} Z`} {...ol('#fde68a', 3.5, '#b7791f')} />
          <path d={`M ${x + 40} ${300} L ${x + 40} ${270}`} stroke={t('#7c5a3a')} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      {/* keep */}
      {cren(752, 850, 362, '#fce7f3')}
      <rect x={748} y={360} width={104} height={292} rx={4} {...ol('#fce7f3', 4)} />
      <path d="M 734 364 L 800 220 L 866 364 Z" {...ol('#f9a8d4', 4)} />
      <path d="M 790 250 L 762 352" stroke={t(light('#f9a8d4', 0.45))} strokeWidth={7} strokeLinecap="round" />
      <path d="M 800 220 L 800 186" stroke={t('#7c5a3a')} strokeWidth={4} strokeLinecap="round" />
      <path d="M 776 452 L 776 420 Q 800 396 824 420 L 824 452 Z" {...ol('#fde68a', 3.5, '#b7791f')} />
      <path d="M 800 404 L 800 452 M 776 430 L 824 430" stroke={t('#b7791f')} strokeWidth={3} />
      {/* royal crest */}
      <circle cx={800} cy={500} r={22} {...ol('#fbbf24', 3.5, '#a16207')} />
      <path d="M 788 506 L 788 494 L 794 500 L 800 490 L 806 500 L 812 494 L 812 506 Z" {...ol('#fff7d6', 2.5, '#a16207')} />
      {/* gate */}
      <path d="M 766 652 L 766 590 Q 800 552 834 590 L 834 652 Z" {...ol('#fcd34d', 4, '#a16207')} />
      <path d="M 800 566 L 800 652 M 766 610 L 834 610 M 766 632 L 834 632" stroke={t('#d4a017')} strokeWidth={3} />
      {/* wall windows */}
      {[700, 880].map((x) => <path key={x} d={`M ${x - 10} 560 L ${x - 10} 540 Q ${x} 528 ${x + 10} 540 L ${x + 10} 560 Z`} {...ol('#fde68a', 3, '#b7791f')} />)}
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
        <defs><RadialGlow id={ids('halo')} color="#fff6cf" inner={1} /></defs>
        <circle cx={800} cy={420} r={420} fill={ids.url('halo')} />
        <path d="M -10 610 Q 220 530 460 574 Q 640 606 800 586 Q 980 562 1160 590 Q 1400 626 1610 560 L 1610 1010 L -10 1010 Z" {...ol('#d4ecbc', 3)} />
        <path d={bumpLine(-20, 1640, 640, 18, 32, 61)} {...ol('#bfe3a6', 3)} />
        <Castle />
        <path d="M -10 680 Q 300 630 620 660 L 980 660 Q 1300 630 1610 676 L 1610 1010 L -10 1010 Z" {...ol('#b5e09c', 4)} />
        {/* path to the gate */}
        <path d="M 772 656 L 828 656 Q 880 820 1030 1010 L 570 1010 Q 720 820 772 656 Z" {...ol('#f8e3b6', 4, '#d7b981')} />
        {[[800, 690], [784, 730], [820, 770], [780, 820], [840, 870], [760, 920], [860, 970]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={12 + i * 2} ry={5 + i * 0.8} fill={t('#efd39c')} />)}
        {/* hedges + trees */}
        <Bush x={640} y={700} s={0.7} fill="#7cc98f" berries="#f9a8d4" />
        <Bush x={960} y={700} s={0.7} fill="#7cc98f" berries="#f9a8d4" />
        <RoundTree x={480} y={690} s={0.6} leaf="#7cc98f" fruit="#fbbf24" />
        <RoundTree x={1120} y={684} s={0.6} leaf="#7cc98f" fruit="#fbbf24" />
        <RoundTree x={300} y={720} s={0.85} leaf="#6fc285" />
        <RoundTree x={1320} y={716} s={0.9} leaf="#6fc285" />
        {/* meadow */}
        <path d="M -10 800 Q 300 766 600 790 L 560 1010 L -10 1010 Z" {...ol('#a6da8c', 4)} />
        <path d="M 1610 790 Q 1300 762 1000 790 L 1040 1010 L 1610 1010 Z" {...ol('#a6da8c', 4)} />
        {[[160, 860, '#fde68a'], [260, 900, '#f9a8d4'], [380, 850, '#c4b5fd'], [470, 920, '#fde68a'], [210, 970, '#fca5a5'], [1140, 860, '#f9a8d4'], [1240, 900, '#fde68a'], [1350, 850, '#c4b5fd'], [1440, 930, '#fde68a'], [1180, 970, '#fca5a5']].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} s={0.75} petal={c as string} stemH={20} />
        ))}
        {[[340, 960], [1300, 980], [520, 990], [1100, 940]].map(([x, y], i) => <Daisy key={i} x={x} y={y} s={0.85} />)}
        {[[420, 800], [1180, 800], [640, 780], [960, 780]].map(([x, y], i) => <Tuft key={i} x={x} y={y} s={0.8} fill="#86c96f" />)}
      </Art>
      <DriftClouds clouds={[{ x: 300, y: 230, s: 0.85, d: 62 }, { x: 1300, y: 200, s: 0.8, d: 70 }, { x: 1050, y: 330, s: 0.45, d: 56 }]} stroke="#f3dca6" />
      <Flag x={640} y={270} color="#f472b6" i={0} />
      <Flag x={960} y={270} color="#a78bfa" i={1} />
      <Flag x={800} y={186} color="#fbbf24" w={62} i={2} />
      {[[480, 300, 11], [1160, 360, 13], [620, 180, 15]].map(([x, y, d], i) => (
        <Sprite key={i} x={x - 20} y={y - 10} w={40} h={20} className={a.drift} vars={{ '--d': `${d}s`, '--dx': '260%' }} inner={a.bob} innerVars={{ '--d': '2.6s', '--by': '-40%' }}>
          <path d={`M ${x - 14} ${y} Q ${x - 7} ${y - 9} ${x} ${y} Q ${x + 7} ${y - 9} ${x + 14} ${y}`} fill="none" stroke={t('#8b6b9a')} strokeWidth={3} strokeLinecap="round" />
        </Sprite>
      ))}
      <Twinkles points={[[690, 360], [920, 330], [800, 140], [560, 470], [1050, 470], [760, 560], [850, 600]]} color="#fbbf24" r={10} />
    </Stage>
  )
}

function LeftEdge() {
  const t = useTint()
  const ol = useOutline()
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <rect x={92} y={380} width={16} height={624} rx={6} {...ol('#c89b5d', 4)} />
        <circle cx={100} cy={372} r={16} {...ol('#fbbf24', 4, '#a16207')} />
        <Bush x={180} y={1004} s={1.6} fill="#6fc285" berries="#f472b6" />
        <Flower x={330} y={1004} s={1.2} petal="#fca5a5" stemH={36} />
        <Flower x={40} y={1004} s={1.1} petal="#fde68a" stemH={30} />
        <Tuft x={370} y={1004} s={1.2} fill="#86c96f" />
      </Art>
      <Sprite x={108} y={404} w={150} h={290} className={a.flag} vars={{ '--d': '2.4s' }}>
        <path d="M 108 410 L 250 430 L 250 640 L 180 600 L 108 640 Z" {...ol('#a78bfa', 4)} />
        <path d="M 108 440 L 250 458" stroke={t('#fbbf24')} strokeWidth={8} />
        <path d="M 178 500 l 12 26 l 28 4 l -20 20 l 5 28 l -25 -14 l -25 14 l 5 -28 l -20 -20 l 28 -4 Z" {...ol('#fde68a', 3, '#a16207')} />
        <path d="M 112 600 L 180 570 L 248 600" fill="none" stroke={t(light('#a78bfa', 0.4))} strokeWidth={4} />
      </Sprite>
    </Stage>
  )
}

function RightEdge() {
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <RoundTree x={290} y={1004} s={2.3} leaf="#6fc285" trunk="#b07d52" fruit="#fbbf24" sw={5} />
        <rect x={88} y={640} width={14} height={364} rx={6} {...ol('#7c6a8a', 4)} />
        <path d="M 70 646 L 120 646 L 112 606 L 78 606 Z" {...ol('#fff3b0', 4, '#7c6a8a')} />
        <path d="M 66 606 L 95 580 L 124 606 Z" {...ol('#7c6a8a', 4)} />
        <Bush x={190} y={1004} s={1.2} fill="#5fb878" berries="#f9a8d4" />
        <Daisy x={40} y={1004} s={1.2} />
        <Flower x={150} y={1004} s={1} petal="#c4b5fd" stemH={30} />
      </Art>
      <Sprite x={35} y={566} w={120} h={120} className={a.glow} vars={{ '--d': '3.4s' }}>
        <defs><RadialGlow id={ids('lamp')} color="#fde68a" inner={0.9} /></defs>
        <circle cx={95} cy={626} r={56} fill={ids.url('lamp')} />
      </Sprite>
    </Stage>
  )
}

export function CastleScene() {
  return (
    <>
      <Sky stops={[[0, '#ffedb8'], [55, '#fff6dc'], [100, '#fdf0f4']]} />
      <Pano />
      <LeftEdge />
      <RightEdge />
    </>
  )
}

