/* El Jardín del Arcoíris (w6): a great pastel rainbow (Lumi's mane colours) over a flower garden with a
   fountain, round topiaries and hedges; the rainbow shimmers, butterflies flutter, petals drift. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Sprite, Stage, useOutline, useTint } from '../kit'
import { Blob, Butterfly, Cloud, Daisy, Flower, PetalParticle, Tuft } from '../shapes'
import { ParticleField, Sky, Twinkles } from './common'

export const MANE = ['#fca5a5', '#fdba74', '#fde68a', '#86efac', '#93c5fd', '#a5b4fc', '#d8b4fe']
const RC = { x: 800, y: 760, r: 600, band: 28 }

function arc(r: number) {
  return `M ${RC.x - r} ${RC.y} A ${r} ${r} 0 0 1 ${RC.x + r} ${RC.y}`
}

function Topiary({ x, y, s = 1, fill = '#7fd08f' }: { x: number; y: number; s?: number; fill?: string }) {
  const t = useTint()
  const ol = useOutline()
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -22 0 L -18 -30 L 18 -30 L 22 0 Z" {...ol('#f9a8d4', 4 / s)} />
      <rect x={-24} y={-36} width={48} height={10} rx={4} {...ol('#f472b6', 4 / s)} />
      <rect x={-4} y={-70} width={8} height={36} fill={t('#a47148')} />
      <circle cx={0} cy={-96} r={38} {...ol(fill, 4 / s)} />
      <ellipse cx={-12} cy={-112} rx={11} ry={7} fill={t(light(fill, 0.45))} transform="rotate(-25 -12 -112)" />
      {[[-18, -86], [14, -104], [12, -76]].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r={4.5} fill={t(['#f9a8d4', '#fde68a', '#c4b5fd'][i])} />)}
    </g>
  )
}

function Tulip({ x, y, s = 1, color = '#f472b6' }: { x: number; y: number; s?: number; color?: string }) {
  const t = useTint()
  const ol = useOutline()
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 Q -2 -40 0 -78" fill="none" stroke={t('#3f9a5a')} strokeWidth={5 / s} strokeLinecap="round" />
      <path d="M 0 -10 Q -28 -30 -24 -62 Q -4 -46 0 -18 Z" {...ol('#6cc285', 3.5 / s)} />
      <path d="M 0 -78 L -18 -96 L -18 -118 L -8 -104 L 0 -124 L 8 -104 L 18 -118 L 18 -96 Z" {...ol(color, 3.5 / s)} />
      <path d="M -18 -96 Q -18 -74 0 -74 Q 18 -74 18 -96 Z" {...ol(color, 3.5 / s)} />
      <path d="M -8 -100 Q -10 -88 -4 -82" fill="none" stroke={t(light(color, 0.55))} strokeWidth={3 / s} strokeLinecap="round" />
    </g>
  )
}

function Foxglove({ x, y, s = 1, color = '#d8b4fe' }: { x: number; y: number; s?: number; color?: string }) {
  const t = useTint()
  const ol = useOutline()
  const bells = [0, 1, 2, 3, 4, 5]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 Q 4 -90 0 -190" fill="none" stroke={t('#3f9a5a')} strokeWidth={5 / s} strokeLinecap="round" />
      <path d="M 0 -20 Q 30 -34 34 -62 Q 8 -54 0 -30 Z" {...ol('#6cc285', 3.5 / s)} />
      {bells.map((i) => {
        const by = -70 - i * 22
        const side = i % 2 ? 1 : -1
        const r = 13 - i * 1.3
        return (
          <g key={i}>
            <path d={`M ${side * r * 0.7 - r} ${by + r * 0.9} Q ${side * r * 0.7 - r} ${by - r * 1.2} ${side * r * 0.7} ${by - r * 1.2} Q ${side * r * 0.7 + r} ${by - r * 1.2} ${side * r * 0.7 + r} ${by + r * 0.9} Q ${side * r * 0.7} ${by + r * 0.5} ${side * r * 0.7 - r} ${by + r * 0.9} Z`} {...ol(i > 3 ? light(color, 0.35) : color, 3 / s)} />
            <ellipse cx={side * r * 0.7} cy={by + r * 0.72} rx={r * 0.62} ry={r * 0.24} fill={t(shade(color, 0.25))} />
          </g>
        )
      })}
      <circle cx={0} cy={-200} r={6} {...ol(light(color, 0.5), 3 / s)} />
    </g>
  )
}

function Fountain({ x, y }: { x: number; y: number }) {
  const t = useTint()
  const ol = useOutline()
  return (
    <g>
      <ellipse cx={x} cy={y} rx={110} ry={26} {...ol('#ede9fe', 4)} />
      <ellipse cx={x} cy={y - 4} rx={92} ry={18} {...ol('#a5d8ff', 3)} />
      <rect x={x - 12} y={y - 80} width={24} height={74} rx={6} {...ol('#ede9fe', 4)} />
      <ellipse cx={x} cy={y - 80} rx={52} ry={12} {...ol('#ede9fe', 4)} />
      <ellipse cx={x} cy={y - 83} rx={40} ry={7} fill={t('#bfe3ff')} />
      <rect x={x - 6} y={y - 120} width={12} height={40} rx={5} {...ol('#ede9fe', 3)} />
      <circle cx={x} cy={y - 124} r={10} {...ol('#f9a8d4', 3)} />
    </g>
  )
}

function Pano() {
  const t = useTint()
  const ol = useOutline()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        {/* rainbow */}
        {MANE.map((c, i) => <path key={c} d={arc(RC.r - i * RC.band)} fill="none" stroke={t(c)} strokeWidth={RC.band + 1} />)}
        <path d={arc(RC.r + RC.band / 2)} fill="none" stroke={t('#ffffff')} strokeWidth={4} opacity={0.8} />
        <path d={arc(RC.r - 6.5 * RC.band)} fill="none" stroke={t('#ffffff')} strokeWidth={4} opacity={0.8} />
        {/* garden hills */}
        <path d="M -10 690 Q 260 620 560 660 Q 820 694 1080 652 Q 1360 610 1610 660 L 1610 1010 L -10 1010 Z" {...ol('#bfe9b8', 4)} />
        {/* clouds hiding the rainbow's feet */}
        <Cloud x={210} y={700} s={1.3} stroke="#f5c6e6" />
        <Cloud x={1390} y={700} s={1.3} stroke="#f5c6e6" flip />
        <Cloud x={90} y={730} s={0.8} stroke="#f5c6e6" flip />
        <Cloud x={1510} y={734} s={0.85} stroke="#f5c6e6" />
        {/* hedges */}
        <Blob circles={[[300, 700, 28], [350, 690, 32], [400, 694, 30], [450, 700, 26]]} rects={[[276, 696, 196, 30, 12]]} fill="#86d495" stroke={shade('#86d495')} sw={4} />
        <Blob circles={[[1150, 694, 28], [1200, 686, 32], [1250, 690, 30], [1300, 698, 26]]} rects={[[1126, 692, 196, 30, 12]]} fill="#86d495" stroke={shade('#86d495')} sw={4} />
        {[[310, 690, '#f9a8d4'], [360, 676, '#fde68a'], [420, 684, '#c4b5fd'], [1170, 680, '#fde68a'], [1230, 672, '#f9a8d4'], [1290, 684, '#c4b5fd']].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r={6} fill={t(c as string)} stroke={t(shade(c as string))} strokeWidth={2} />
        ))}
        <Topiary x={560} y={720} s={0.7} />
        <Topiary x={1040} y={716} s={0.7} fill="#95dba1" />
        {/* path + fountain */}
        <path d="M 760 720 L 840 720 Q 900 860 1010 1010 L 590 1010 Q 700 860 760 720 Z" {...ol('#fde5d0', 4, '#e7b99a')} />
        {[[790, 760], [818, 800], [770, 840], [830, 880], [760, 930], [850, 960]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={14} ry={6} fill={t('#f6cfb3')} />)}
        <Fountain x={800} y={744} />
        {/* flower beds */}
        <path d="M -10 820 Q 300 780 600 812 L 560 1010 L -10 1010 Z" {...ol('#a9df9f', 4)} />
        <path d="M 1610 810 Q 1300 776 1000 812 L 1040 1010 L 1610 1010 Z" {...ol('#a9df9f', 4)} />
        {[[120, 860, '#f9a8d4'], [210, 840, '#fde68a'], [300, 856, '#c4b5fd'], [400, 840, '#fca5a5'], [480, 870, '#93c5fd'], [180, 930, '#fdba74'], [290, 950, '#f9a8d4'], [420, 930, '#fde68a'],
          [1120, 850, '#fde68a'], [1210, 836, '#f9a8d4'], [1310, 850, '#93c5fd'], [1400, 836, '#c4b5fd'], [1490, 860, '#fca5a5'], [1180, 930, '#c4b5fd'], [1300, 950, '#fdba74'], [1440, 930, '#f9a8d4']].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} s={0.8} petal={c as string} stemH={20} />
        ))}
        {[[520, 960], [1080, 960], [640, 1000], [960, 1000]].map(([x, y], i) => <Daisy key={i} x={x} y={y} s={0.85} />)}
        {[[560, 840], [1050, 840], [700, 690], [920, 690]].map(([x, y], i) => <Tuft key={i} x={x} y={y} s={0.8} fill="#7cc98a" />)}
      </Art>
      {/* rainbow shimmer: a soft white sheen breathing through the bands in sequence */}
      {MANE.map((c, i) => (
        <Sprite key={c} x={RC.x - RC.r - 20} y={RC.y - RC.r - 20} w={RC.r * 2 + 40} h={RC.r + 20} className={a.shimmer} vars={{ '--d': '5s', '--dl': `${-i * 0.45}s`, '--op': 0.55 }}>
          <path d={arc(RC.r - i * RC.band)} fill="none" stroke={t(light(c, 0.7))} strokeWidth={RC.band * 0.34} strokeLinecap="round" />
        </Sprite>
      ))}
      <Sprite x={740} y={590} w={120} h={160} className={a.shimmer} vars={{ '--d': '2.4s', '--op': 0.9 }}>
        <path d="M 800 616 Q 770 640 760 690 M 800 616 Q 830 640 840 690 M 800 612 L 800 640" fill="none" stroke={t('#bfe3ff')} strokeWidth={5} strokeLinecap="round" />
        <circle cx={760} cy={700} r={4} fill={t('#bfe3ff')} />
        <circle cx={840} cy={700} r={4} fill={t('#bfe3ff')} />
      </Sprite>
      {[[420, 600, '#f9a8d4', '#fde68a', 13], [1180, 560, '#a5b4fc', '#f9a8d4', 16], [700, 470, '#fde68a', '#86efac', 15], [980, 820, '#fca5a5', '#fdba74', 12]].map(([x, y, w1, w2, d], i) => (
        <Sprite key={i} x={(x as number) - 35} y={(y as number) - 30} w={70} h={60} className={a.bob} vars={{ '--d': `${3 + i * 0.4}s`, '--by': '-30%' }} inner={a.wander} innerVars={{ '--d': `${d}s`, '--wx': i % 2 ? '-150%' : '150%', '--wy': '60%' }}>
          <Butterfly cx={x as number} cy={y as number} s={0.9} wing={w1 as string} wing2={w2 as string} flapClass={a.flap} />
        </Sprite>
      ))}
      <Twinkles points={[[560, 330], [1040, 300], [800, 200], [420, 470], [1190, 440], [660, 560], [960, 540]]} color="#ffffff" r={11} />
      <ParticleField count={8} seed={23} size={[16, 26]} dur={[14, 20]} render={(i) => <PetalParticle color={['#f9a8d4', '#fbcfe8', '#fde68a', '#e9d5ff'][i % 4]} />} />
    </Stage>
  )
}

function LeftEdge() {
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <Tulip x={60} y={1004} s={1.9} color="#f472b6" />
        <Tulip x={140} y={1004} s={1.5} color="#fbbf24" />
        <Tulip x={210} y={1004} s={1.75} color="#a78bfa" />
        <Foxglove x={300} y={1004} s={1.4} color="#f9a8d4" />
        <Daisy x={360} y={1004} s={1.2} />
        <Daisy x={110} y={1004} s={1} />
        <Tuft x={250} y={1004} s={1.3} fill="#7cc98a" />
      </Art>
    </Stage>
  )
}

function RightEdge() {
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <Foxglove x={340} y={1004} s={1.9} color="#d8b4fe" />
        <Foxglove x={250} y={1004} s={1.5} color="#f9a8d4" />
        <Tulip x={160} y={1004} s={1.6} color="#fb7185" />
        <Tulip x={80} y={1004} s={1.3} color="#fde68a" />
        <Daisy x={30} y={1004} s={1.1} />
        <Daisy x={200} y={1004} s={1.2} />
      </Art>
    </Stage>
  )
}

export function RainbowGardenScene() {
  return (
    <>
      <Sky stops={[[0, '#fcdff3'], [55, '#fff0f8'], [100, '#fff9e6']]} />
      <Pano />
      <LeftEdge />
      <RightEdge />
    </>
  )
}
