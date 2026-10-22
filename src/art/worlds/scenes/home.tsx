/* Home: the child's cosy bedroom at dusk (prologue + home hub). A big arched window with stars, swaying
   curtains, a bookshelf with the glowing magic book, a bed with a patchwork quilt and a soft rug. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, seeded, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { RadialGlow, SparklePath } from '../shapes'
import { Sky, Twinkles } from './common'

const WOOD = '#f1d2ab'
const WIN = 'M 630 576 L 630 330 A 170 170 0 0 1 970 330 L 970 576 Z'
const GLASS = 'M 652 556 L 652 334 A 148 148 0 0 1 948 334 L 948 556 Z'

function Wallpaper() {
  const t = useTint()
  const rnd = seeded(77)
  const pts: [number, number][] = []
  for (let gy = 0; gy < 6; gy++) {
    for (let gx = 0; gx < 13; gx++) {
      const x = gx * 128 + (gy % 2 ? 64 : 0) + rnd() * 30
      const y = 60 + gy * 104 + rnd() * 26
      if (x > 520 && x < 1080 && y > 110 && y < 640) continue
      pts.push([x, y])
    }
  }
  return (
    <g>
      {pts.map(([x, y], i) => <SparklePath key={i} x={x} y={y} r={i % 3 ? 9 : 13} fill={t('#e2cffb')} />)}
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
          <linearGradient id={ids('glass')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t('#8d96ee')} />
            <stop offset="65%" stopColor={t('#c7a9ea')} />
            <stop offset="100%" stopColor={t('#f6bcd9')} />
          </linearGradient>
          <clipPath id={ids('clip')}><path d={GLASS} /></clipPath>
          <RadialGlow id={ids('wglow')} color="#fdf2ff" inner={0.9} />
        </defs>
        <Wallpaper />
        <circle cx={800} cy={420} r={330} fill={ids.url('wglow')} />
        {/* framed drawings */}
        <rect x={400} y={250} width={130} height={150} rx={10} {...ol('#f9d7a7', 6)} />
        <rect x={414} y={264} width={102} height={122} rx={4} fill={t('#ffffff')} />
        {['#fca5a5', '#fde68a', '#86efac', '#93c5fd'].map((c, i) => <path key={c} d={`M ${430 + i * 7} 360 A ${35 - i * 7} ${35 - i * 7} 0 0 1 ${500 - i * 7} 360`} fill="none" stroke={t(c)} strokeWidth={7} />)}
        <circle cx={448} cy={292} r={10} fill={t('#fde68a')} />
        <rect x={1070} y={240} width={130} height={130} rx={65} {...ol('#c4b5fd', 6)} />
        <circle cx={1135} cy={305} r={50} fill={t('#ffffff')} />
        <path d="M 1135 270 l 10 22 l 24 3 l -18 16 l 5 24 l -21 -12 l -21 12 l 5 -24 l -18 -16 l 24 -3 Z" {...ol('#fde68a', 3, '#d29a1a')} />
        {/* window */}
        <path d={WIN} {...ol(WOOD, 6)} />
        <path d={GLASS} fill={ids.url('glass')} stroke={t(shade(WOOD))} strokeWidth={4} />
        <g clipPath={ids.url('clip')}>
          <circle cx={880} cy={262} r={34} fill={t('#fff7de')} />
          <circle cx={896} cy={252} r={30} fill={t('#949cee')} />
          <path d="M 640 560 Q 700 480 780 510 Q 860 540 960 470 L 960 570 L 640 570 Z" fill={t('#7c77d8')} />
          <path d="M 640 570 Q 720 520 800 540 Q 880 560 960 520 L 960 580 L 640 580 Z" fill={t('#6a63c8')} />
          <circle cx={720} cy={520} r={5} fill={t('#fde68a')} />
          <circle cx={740} cy={528} r={4} fill={t('#fde68a')} />
          <circle cx={900} cy={510} r={4} fill={t('#fde68a')} />
        </g>
        <path d="M 800 182 L 800 556 M 652 400 L 948 400" stroke={t(shade(WOOD))} strokeWidth={14} strokeLinecap="round" />
        <path d="M 800 182 L 800 556 M 652 400 L 948 400" stroke={t(WOOD)} strokeWidth={8} strokeLinecap="round" />
        <rect x={600} y={566} width={400} height={30} rx={10} {...ol(WOOD, 5)} />
        {/* sill: plant + star lamp */}
        <path d="M 650 566 L 656 530 L 700 530 L 706 566 Z" {...ol('#f9a8d4', 4)} />
        {[[-16, -30], [0, -44], [16, -32], [-6, -20], [10, -18]].map(([dx, dy], i) => (
          <ellipse key={i} cx={678 + dx} cy={530 + dy} rx={9} ry={16} transform={`rotate(${dx * 2} ${678 + dx} ${530 + dy})`} {...ol('#7ccf8c', 3)} />
        ))}
        <rect x={900} y={546} width={40} height={20} rx={6} {...ol('#c4b5fd', 4)} />
        {/* curtain rod */}
        <rect x={540} y={148} width={520} height={14} rx={7} {...ol('#d8a56f', 4)} />
        <circle cx={540} cy={155} r={14} {...ol('#fbbf24', 4, '#a16207')} />
        <circle cx={1060} cy={155} r={14} {...ol('#fbbf24', 4, '#a16207')} />
        {/* wainscot */}
        <rect x={-10} y={660} width={1620} height={140} fill={t('#e7d6fb')} />
        <path d="M -10 660 L 1610 660" stroke={t(shade('#e7d6fb', 0.2))} strokeWidth={10} />
        <path d="M -10 664 L 1610 664" stroke={t('#f5edff')} strokeWidth={4} />
        {[100, 300, 500, 700, 900, 1100, 1300, 1500].map((x) => <rect key={x} x={x - 80} y={690} width={160} height={84} rx={10} fill="none" stroke={t('#d8c3f6')} strokeWidth={4} />)}
        {/* floor */}
        <path d="M -10 790 L 1610 790 L 1610 1010 L -10 1010 Z" {...ol(WOOD, 4)} />
        {[830, 880, 940, 1000].map((y) => <path key={y} d={`M -10 ${y} L 1610 ${y}`} stroke={t('#e4bd90')} strokeWidth={3} />)}
        {[[200, 790, 830], [620, 790, 830], [1040, 790, 830], [420, 830, 880], [880, 830, 880], [1340, 830, 880], [140, 880, 940], [700, 880, 940], [1180, 880, 940], [480, 940, 1000], [1000, 940, 1000]].map(([x, y0, y1], i) => (
          <path key={i} d={`M ${x} ${y0} L ${x} ${y1}`} stroke={t('#e4bd90')} strokeWidth={3} />
        ))}
        <path d="M -10 792 L 1610 792" stroke={t('#c99a6a')} strokeWidth={8} />
        {/* rug */}
        <ellipse cx={800} cy={910} rx={470} ry={80} {...ol('#c4b5fd', 5)} />
        <ellipse cx={800} cy={910} rx={410} ry={58} fill="none" stroke={t('#ede9fe')} strokeWidth={6} strokeDasharray="2 18" strokeLinecap="round" />
        <ellipse cx={800} cy={910} rx={330} ry={40} {...ol('#ddd6fe', 3)} />
        {[[640, 906], [800, 896], [960, 910], [720, 924], [880, 926]].map(([x, y], i) => <SparklePath key={i} x={x} y={y} r={9} fill={t('#ffffff')} />)}
      </Art>
      <Twinkles points={[[700, 260], [760, 210], [690, 340], [830, 300], [920, 350], [880, 440], [720, 430]]} color="#fff7d6" r={7} kind="star" />
      {/* string of fairy lights */}
      <Art>
        <path d="M -10 40 Q 400 120 800 60 Q 1200 0 1610 70" fill="none" stroke={t('#a78bfa')} strokeWidth={3} />
      </Art>
      {[[120, 72], [300, 96], [480, 100], [660, 80], [940, 44], [1120, 30], [1300, 36], [1480, 56]].map(([x, y], i) => (
        <Sprite key={i} x={x - 22} y={y - 6} w={44} h={50} className={a.glow} vars={{ '--d': `${1.8 + (i % 3) * 0.6}s`, '--dl': `${-i * 0.4}s` }}>
          <circle cx={x} cy={y + 20} r={18} fill={t(['#fde68a', '#f9a8d4', '#a5f3fc', '#c4b5fd'][i % 4])} opacity={0.35} />
          <ellipse cx={x} cy={y + 18} rx={8} ry={11} {...ol(['#fde68a', '#f9a8d4', '#a5f3fc', '#c4b5fd'][i % 4], 2.5)} />
          <rect x={x - 5} y={y + 2} width={10} height={6} rx={2} fill={t('#8b6fb3')} />
        </Sprite>
      ))}
      {/* curtains */}
      <Sprite x={544} y={150} w={130} h={470} className={a.swing} vars={{ '--d': '7s', '--deg': '1.2deg' }}>
        <path d="M 550 156 L 664 156 Q 640 300 612 380 Q 640 470 650 610 L 556 610 Q 590 470 566 380 Q 540 300 550 156 Z" {...ol('#f9a8d4', 5)} />
        <path d="M 586 170 Q 600 280 590 370 M 620 170 Q 630 280 612 370 M 590 400 Q 610 500 600 600" fill="none" stroke={t(shade('#f9a8d4', 0.12))} strokeWidth={4} strokeLinecap="round" />
        <rect x={560} y={372} width={70} height={18} rx={9} {...ol('#fde68a', 3.5, '#b7791f')} />
      </Sprite>
      <Sprite x={926} y={150} w={130} h={470} className={a.swing} vars={{ '--d': '7.6s', '--dl': '-3s', '--deg': '1.2deg' }}>
        <path d="M 1050 156 L 936 156 Q 960 300 988 380 Q 960 470 950 610 L 1044 610 Q 1010 470 1034 380 Q 1060 300 1050 156 Z" {...ol('#f9a8d4', 5)} />
        <path d="M 1014 170 Q 1000 280 1010 370 M 980 170 Q 970 280 988 370 M 1010 400 Q 990 500 1000 600" fill="none" stroke={t(shade('#f9a8d4', 0.12))} strokeWidth={4} strokeLinecap="round" />
        <rect x={970} y={372} width={70} height={18} rx={9} {...ol('#fde68a', 3.5, '#b7791f')} />
      </Sprite>
      <Twinkles points={[[420, 520], [560, 700], [1100, 520], [1240, 660], [320, 620], [980, 700], [640, 640]]} color="#fde68a" r={8} />
    </Stage>
  )
}

function Bookshelf() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  const SHELF = '#d9a77a'
  const shelves = [470, 620, 770, 920]
  const rnd = seeded(5)
  const colors = ['#f9a8d4', '#a5b4fc', '#fde68a', '#86efac', '#fdba74', '#c4b5fd', '#93c5fd', '#fca5a5']
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <rect x={24} y={330} width={286} height={680} rx={12} {...ol(SHELF, 5)} />
        <rect x={44} y={350} width={246} height={650} rx={6} fill={t(shade(SHELF, 0.12))} />
        {shelves.map((y, si) => {
          let x = 52
          const books = []
          let k = 0
          while (x < 270) {
            const w = 18 + rnd() * 16
            const h = 84 + rnd() * 40
            const c = colors[(si * 3 + k) % colors.length]
            const lean = si === 1 && k === 3
            if (si === 1 && k === 2) { x += 40; k++; continue } // gap for the magic book
            books.push(
              <g key={k} transform={lean ? `rotate(-12 ${x} ${y})` : undefined}>
                <rect x={x} y={y - h} width={w} height={h} rx={3} {...ol(c, 3)} />
                <path d={`M ${x + 3} ${y - h + 14} L ${x + w - 3} ${y - h + 14} M ${x + 3} ${y - 18} L ${x + w - 3} ${y - 18}`} stroke={t(light(c, 0.55))} strokeWidth={3} />
              </g>,
            )
            x += w + 3
            k++
            if (books.length > 7) break
          }
          return (
            <g key={y}>
              {books}
              <rect x={36} y={y} width={262} height={18} rx={5} {...ol(SHELF, 4)} />
            </g>
          )
        })}
        {/* plant on top */}
        <path d="M 210 330 L 216 290 L 270 290 L 276 330 Z" {...ol('#a5b4fc', 4)} />
        <path d="M 230 292 Q 200 340 190 420 M 256 292 Q 290 350 300 440" fill="none" stroke={t('#5f9e6e')} strokeWidth={4} strokeLinecap="round" />
        {[[198, 360], [192, 400], [292, 380], [298, 420], [226, 262], [250, 250], [272, 266]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={10} ry={16} transform={`rotate(${i % 2 ? 30 : -30} ${x} ${y})`} {...ol('#7ccf8c', 3)} />
        ))}
        {/* toy box */}
        <rect x={250} y={900} width={150} height={104} rx={10} {...ol('#fde68a', 5)} />
        <path d="M 250 930 L 400 930" stroke={t(shade('#fde68a'))} strokeWidth={4} />
        <circle cx={325} cy={968} r={16} {...ol('#f9a8d4', 3.5)} />
      </Art>
      {/* the glowing magic book */}
      <Sprite x={60} y={420} w={180} h={180} className={a.glow} vars={{ '--d': '2.6s' }}>
        <defs><RadialGlow id={ids('book')} color="#fde68a" inner={1} /></defs>
        <circle cx={150} cy={530} r={86} fill={ids.url('book')} />
      </Sprite>
      <Sprite x={110} y={480} w={80} h={140} className={a.bob} vars={{ '--d': '3.2s', '--by': '-4%' }}>
        <rect x={132} y={500} width={36} height={118} rx={4} {...ol('#a78bfa', 3.5)} />
        <rect x={136} y={506} width={6} height={106} fill={t('#fde68a')} />
        <path d="M 160 540 l 4 9 l 10 1 l -8 7 l 2 10 l -8 -5 l -8 5 l 2 -10 l -8 -7 l 10 -1 Z" fill={t('#fde68a')} stroke={t('#b7791f')} strokeWidth={1.5} />
      </Sprite>
      <Twinkles points={[[120, 470], [200, 450], [96, 560], [214, 600], [170, 420]]} color="#fde68a" r={9} />
    </Stage>
  )
}

function Bed() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  const squares = ['#f9a8d4', '#fde68a', '#a5b4fc', '#86efac', '#fdba74', '#c4b5fd']
  return (
    <Stage w={400} h={1000} anchor="br">
      <Art>
        {/* headboard */}
        <path d="M 170 1004 L 170 700 Q 170 600 290 600 Q 410 600 410 700 L 410 1004 Z" {...ol('#c4b5fd', 5)} />
        <path d="M 290 640 l 9 18 l 20 3 l -15 14 l 4 20 l -18 -10 l -18 10 l 4 -20 l -15 -14 l 20 -3 Z" {...ol('#fde68a', 3, '#b7791f')} />
        {/* pillow + quilt */}
        <rect x={200} y={740} width={190} height={60} rx={28} {...ol('#ffffff', 4, '#c4b5fd')} />
        <path d="M 150 800 L 410 800 L 410 1004 L 150 1004 Z" {...ol('#f9a8d4', 5)} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const cx = 162 + (i % 3) * 82
          const cy = 820 + Math.floor(i / 3) * 62
          return <rect key={i} x={cx} y={cy} width={70} height={52} rx={8} fill={t(squares[(i * 2) % squares.length])} stroke={t('#ffffff')} strokeWidth={3} strokeDasharray="6 5" />
        })}
        <path d="M 150 800 L 410 800" stroke={t(shade('#f9a8d4'))} strokeWidth={6} />
        {/* nightstand + lamp */}
        <rect x={10} y={860} width={120} height={144} rx={10} {...ol('#d9a77a', 5)} />
        <rect x={26} y={900} width={88} height={36} rx={8} {...ol('#e8c49d', 3.5)} />
        <circle cx={70} cy={918} r={5} fill={t('#a16207')} />
        <rect x={62} y={790} width={16} height={70} rx={6} {...ol('#a5b4fc', 4)} />
        <path d="M 30 800 L 110 800 L 92 740 L 48 740 Z" {...ol('#fde68a', 4, '#b7791f')} />
      </Art>
      <Sprite x={-30} y={660} w={200} h={220} className={a.glow} vars={{ '--d': '4s' }}>
        <defs><RadialGlow id={ids('lamp')} color="#fde68a" inner={0.85} /></defs>
        <circle cx={70} cy={770} r={100} fill={ids.url('lamp')} />
      </Sprite>
    </Stage>
  )
}

export function HomeScene() {
  return (
    <>
      <Sky stops={[[0, '#f3e8ff'], [100, '#ecdcff']]} />
      <Pano />
      <Bookshelf />
      <Bed />
    </>
  )
}
