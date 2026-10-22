/* El Río de las Sumas (w2): a sparkling river winding from a little waterfall, a wooden bridge, stepping
   stones and lily pads; ripples, glints and dragonflies. Calm centre: the sky and the open water. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { Blob, Bush, Butterfly, Daisy, Flower, LilyPad, RadialGlow, Reed, Rock, RoundTree, Tuft, WaveLine } from '../shapes'
import { bumpLine, DriftClouds, Sky, Twinkles } from './common'

const WATER = '#8fd0f6'
const RIVER = 'M 786 640 C 744 690 870 736 770 800 C 680 856 520 910 400 1004 L 1250 1004 C 1120 910 990 850 1004 790 C 1016 738 860 696 832 640 Z'

function Pano() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        <defs>
          <RadialGlow id={ids('sun')} color="#fff7cc" inner={1} />
          <linearGradient id={ids('water')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t('#bfe6fb')} />
            <stop offset="100%" stopColor={t(WATER)} />
          </linearGradient>
        </defs>
        <circle cx={560} cy={170} r={200} fill={ids.url('sun')} />
        <circle cx={560} cy={170} r={46} {...ol('#fff1a8', 4, '#f2cf6b')} />
        <circle cx={546} cy={156} r={11} fill={t('#fffbe0')} />
        {/* far hills */}
        <path d="M 0 600 Q 220 500 450 548 Q 640 586 820 530 Q 1040 466 1260 540 Q 1430 594 1600 520 L 1600 1000 L 0 1000 Z" {...ol('#c4e7cc', 3)} />
        {/* little waterfall from the hills */}
        <path d="M 790 560 Q 808 548 826 560 L 830 642 L 786 642 Z" {...ol('#d6f0ff', 3, '#7bb8e6')} />
        <path d="M 798 566 L 798 636 M 810 562 L 810 640 M 820 566 L 820 636" stroke={t('#ffffff')} strokeWidth={3} strokeLinecap="round" />
        <path d={bumpLine(-20, 1640, 612, 20, 36, 21)} {...ol('#abdcb9', 3)} />
        {/* banks */}
        <path d="M 0 664 Q 400 632 800 646 Q 1200 660 1600 630 L 1600 1000 L 0 1000 Z" {...ol('#9fd98f', 4)} />
        <RoundTree x={470} y={672} s={0.55} leaf="#79c98d" />
        <RoundTree x={1110} y={664} s={0.5} leaf="#79c98d" fruit="#fca5a5" />
        <RoundTree x={270} y={720} s={0.85} leaf="#6cc285" />
        <RoundTree x={1360} y={706} s={0.9} leaf="#6cc285" />
        <Bush x={600} y={700} s={0.55} fill="#76c88a" berries="#c4b5fd" />
        <Bush x={1010} y={694} s={0.5} fill="#76c88a" />
        {/* river: sandy rim, water, highlights */}
        <path d={RIVER} fill="none" stroke={t('#f3e2b6')} strokeWidth={30} strokeLinejoin="round" />
        <path d={RIVER} fill={ids.url('water')} stroke={t('#5aa2e0')} strokeWidth={4} strokeLinejoin="round" />
        <WaveLine x={792} y={690} w={46} color="#e0f4ff" sw={3} amp={3} />
        <WaveLine x={800} y={760} w={70} color="#d4efff" sw={4} />
        <WaveLine x={660} y={850} w={120} color="#d4efff" sw={4} />
        <WaveLine x={940} y={830} w={60} color="#d4efff" sw={4} />
        <WaveLine x={520} y={950} w={160} color="#d4efff" sw={5} amp={5} />
        <WaveLine x={900} y={930} w={180} color="#d4efff" sw={5} amp={5} />
        {/* wooden bridge in the distance */}
        <path d="M 740 712 Q 822 664 904 712" fill="none" stroke={t(shade('#d29a62'))} strokeWidth={16} strokeLinecap="round" />
        <path d="M 740 712 Q 822 664 904 712" fill="none" stroke={t('#d29a62')} strokeWidth={9} strokeLinecap="round" />
        <path d="M 748 696 Q 822 650 896 696" fill="none" stroke={t(shade('#d29a62'))} strokeWidth={4} strokeLinecap="round" />
        {[756, 782, 808, 836, 862, 888].map((x, i) => (
          <line key={x} x1={x} y1={705 - [4, 16, 22, 22, 16, 4][i]} x2={x} y2={688 - [4, 16, 22, 22, 16, 4][i]} stroke={t(shade('#d29a62'))} strokeWidth={4} strokeLinecap="round" />
        ))}
        {/* stepping stones + lily pads */}
        {[[690, 878, 36], [796, 862, 32], [902, 864, 32], [1006, 878, 34]].map(([x, y, r], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 6} rx={r + 4} ry={r * 0.42} fill={t('#6db6e8')} />
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.46} {...ol('#d3dae6', 3.5)} />
            <ellipse cx={x - r * 0.3} cy={y - r * 0.14} rx={r * 0.32} ry={r * 0.12} fill={t('#f1f5f9')} />
          </g>
        ))}
        <LilyPad x={560} y={968} s={1.25} bloom="#f9a8d4" />
        <LilyPad x={1130} y={958} s={1.05} />
        <LilyPad x={1046} y={940} s={0.6} bloom="#fde68a" />
        <LilyPad x={846} y={770} s={0.55} />
        <LilyPad x={760} y={812} s={0.6} bloom="#f9a8d4" />
        {/* bank details */}
        <Reed x={574} y={884} h={86} lean={-10} />
        <Reed x={590} y={890} h={66} lean={8} cattail={false} />
        <Reed x={1118} y={876} h={92} lean={12} />
        <Rock x={520} y={900} s={0.5} fill="#d3dae6" />
        <Rock x={1180} y={892} s={0.55} fill="#d3dae6" flip />
        {[[430, 820, '#fde68a'], [380, 900, '#f9a8d4'], [1250, 830, '#c4b5fd'], [1300, 920, '#fde68a'], [470, 960, '#c4b5fd'], [1220, 980, '#f9a8d4']].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} s={0.72} petal={c as string} stemH={22} />
        ))}
        {[[330, 860], [1360, 860], [1290, 990], [300, 980]].map(([x, y], i) => <Daisy key={i} x={x} y={y} s={0.8} />)}
        {[[420, 760], [700, 690], [960, 690], [1200, 740], [350, 940], [1400, 950]].map(([x, y], i) => <Tuft key={i} x={x} y={y} s={0.85} fill="#6cc285" />)}
      </Art>
      <DriftClouds clouds={[{ x: 320, y: 260, s: 0.9, d: 64 }, { x: 1250, y: 210, s: 0.75, d: 72 }, { x: 900, y: 360, s: 0.45, d: 58 }]} />
      {/* ripples */}
      {[[640, 930, 70], [990, 912, 60], [830, 812, 40], [1150, 990, 70], [720, 990, 50]].map(([x, y, r], i) => (
        <Sprite key={i} x={x - r} y={y - r * 0.4} w={r * 2} h={r * 0.8} className={a.ripple} vars={{ '--d': `${4 + (i % 3)}s`, '--dl': `${-i * 1.3}s` }}>
          <ellipse cx={x} cy={y} rx={r * 0.92} ry={r * 0.32} fill="none" stroke={t('#ffffff')} strokeWidth={4} />
        </Sprite>
      ))}
      <Twinkles points={[[700, 900], [880, 960], [1050, 930], [600, 990], [820, 740], [960, 808], [770, 840]]} color="#ffffff" r={9} />
      <Sprite x={360} y={700} w={70} h={60} className={a.bob} vars={{ '--d': '3s', '--by': '-30%' }} inner={a.wander} innerVars={{ '--d': '12s', '--wx': '160%', '--wy': '60%' }}>
        <Butterfly cx={395} cy={730} s={0.8} wing="#93c5fd" wing2="#a5f3fc" flapClass={a.flap} />
      </Sprite>
      <Sprite x={1180} y={760} w={70} h={60} className={a.bob} vars={{ '--d': '3.4s', '--dl': '-1s', '--by': '-30%' }} inner={a.wander} innerVars={{ '--d': '15s', '--wx': '-150%', '--wy': '50%' }}>
        <Butterfly cx={1215} cy={790} s={0.75} wing="#a5b4fc" wing2="#bae6fd" flapClass={a.flap} />
      </Sprite>
    </Stage>
  )
}

function Willow() {
  const t = useTint()
  const ol = useOutline()
  const strands = [60, 110, 160, 210, 260, 310, 350]
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <path d="M 40 1004 C 76 950 92 880 96 780 C 100 640 96 500 110 380 L 196 380 C 186 500 180 640 186 780 C 190 880 210 950 260 1004 Z" {...ol('#a8784e', 5)} />
        <path d="M 130 520 Q 122 600 136 680 M 150 780 Q 144 840 160 900" fill="none" stroke={t(shade('#a8784e', 0.2))} strokeWidth={5} strokeLinecap="round" />
        <Blob circles={[[60, 260, 140], [200, 220, 120], [300, 290, 80], [120, 110, 110], [-20, 120, 100]]} fill="#7ccb8c" stroke={shade('#7ccb8c')} sw={5} />
        <ellipse cx={110} cy={80} rx={34} ry={18} fill={t(light('#7ccb8c', 0.4))} transform="rotate(-18 110 80)" />
        <ellipse cx={220} cy={160} rx={20} ry={12} fill={t(light('#7ccb8c', 0.4))} />
        <Rock x={290} y={1004} s={1.4} fill="#d3dae6" />
        <Reed x={190} y={1004} h={190} lean={-18} />
        <Reed x={220} y={1004} h={150} lean={14} />
        <Reed x={360} y={1004} h={170} lean={10} />
        <Reed x={340} y={1004} h={110} lean={-8} cattail={false} />
        <Flower x={40} y={1004} s={1.2} petal="#93c5fd" stemH={34} />
        <Tuft x={130} y={1004} s={1.3} fill="#6cc285" />
      </Art>
      {strands.map((x, i) => {
        const y0 = 330
        const y1 = 440 + (i % 4) * 26
        const leaves = Array.from({ length: Math.floor((y1 - y0) / 22) }, (_, j) => y0 + 16 + j * 22)
        return (
          <Sprite key={x} x={x - 24} y={y0} w={48} h={y1 - y0 + 24} className={a.swing} vars={{ '--d': `${4 + (i % 3) * 0.6}s`, '--dl': `${-i * 0.7}s`, '--deg': '3deg' }}>
            <path d={`M ${x} ${y0} Q ${x - 6} ${(y0 + y1) / 2} ${x + 2} ${y1}`} fill="none" stroke={t(shade('#7ccb8c', 0.2))} strokeWidth={4} strokeLinecap="round" />
            {leaves.map((ly, j) => (
              <ellipse key={ly} cx={x + (j % 2 ? 7 : -7)} cy={ly} rx={6} ry={11} transform={`rotate(${j % 2 ? -28 : 28} ${x + (j % 2 ? 7 : -7)} ${ly})`} {...ol(j % 3 === 0 ? '#9ad9a6' : '#86cf96', 2.5)} />
            ))}
            <ellipse cx={x + 1} cy={y1 + 6} rx={6} ry={11} {...ol('#9ad9a6', 2.5)} />
          </Sprite>
        )
      })}
    </Stage>
  )
}

function RightEdge() {
  const ol = useOutline()
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        <RoundTree x={290} y={1004} s={2.3} leaf="#6cc285" trunk="#b07d52" fruit="#fde68a" sw={5} />
        <Bush x={120} y={1004} s={1.4} fill="#5fb878" berries="#93c5fd" />
        <Reed x={40} y={1004} h={160} lean={-12} />
        <Reed x={66} y={1004} h={120} lean={10} cattail={false} />
        <Daisy x={200} y={1004} s={1.1} />
        <Flower x={380} y={1004} s={1.1} petal="#f9a8d4" stemH={30} />
        <ellipse cx={0} cy={1000} rx={60} ry={14} {...ol('#9fd98f', 3)} />
      </Art>
    </Stage>
  )
}

export function RiverScene() {
  return (
    <>
      <Sky stops={[[0, '#c6e4ff'], [55, '#e5f3ff'], [100, '#fdf8e4']]} />
      <Pano />
      <Willow />
      <RightEdge />
    </>
  )
}
