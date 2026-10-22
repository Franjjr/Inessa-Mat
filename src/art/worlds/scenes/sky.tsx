/* Sky: the Kingdom of Numeria above the clouds — floating islands with Lumi's little observatory and a
   waterfall, a sea of clouds, a hot-air balloon, twinkling stars. Used for the prologue portal and overviews. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { Blob, RadialGlow, RoundTree } from '../shapes'
import { DriftClouds, Sky, Twinkles } from './common'

const ROCK = '#cdbcec'

function Island({ x, y, s = 1, tower, trees = true }: { x: number; y: number; s?: number; tower?: boolean; trees?: boolean }) {
  const t = useTint()
  const ol = useOutline()
  const w = 4 / s
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -170 0 Q -150 40 -100 70 Q -60 130 -20 200 Q 0 226 20 196 Q 50 130 96 72 Q 150 40 170 0 Z" {...ol(ROCK, w)} />
      <path d="M -120 40 Q -40 64 40 50 Q 100 40 140 24 M -70 110 Q 0 124 60 104" fill="none" stroke={t(shade(ROCK, 0.12))} strokeWidth={w * 1.4} strokeLinecap="round" />
      <path d="M -150 20 Q -120 50 -80 56" fill="none" stroke={t(light(ROCK, 0.5))} strokeWidth={w * 1.6} strokeLinecap="round" />
      <circle cx={-34} cy={92} r={9} {...ol('#a5b4fc', w * 0.8)} />
      <circle cx={52} cy={70} r={7} {...ol('#f9a8d4', w * 0.8)} />
      <circle cx={-4} cy={150} r={6} {...ol('#fde68a', w * 0.8)} />
      <path d="M -178 2 Q -170 -30 -100 -34 Q 0 -44 100 -34 Q 170 -30 178 2 Q 120 18 0 16 Q -120 18 -178 2 Z" {...ol('#a9e4a2', w)} />
      <path d="M -150 -8 Q -80 -24 0 -26" fill="none" stroke={t(light('#a9e4a2', 0.5))} strokeWidth={w * 1.6} strokeLinecap="round" />
      {trees && <RoundTree x={-110} y={-14} s={0.42} leaf="#7fd39a" sw={4 * s} />}
      {trees && <RoundTree x={120} y={-12} s={0.34} leaf="#8fdba7" fruit="#f9a8d4" sw={4 * s} />}
      {tower && (
        <g>
          <rect x={-26} y={-150} width={52} height={130} rx={6} {...ol('#ffffff', w, '#a78bfa')} />
          <path d="M -36 -146 Q 0 -206 36 -146 Z" {...ol('#a78bfa', w)} />
          <path d="M 0 -196 L 0 -222" stroke={t('#a16207')} strokeWidth={w} strokeLinecap="round" />
          <path d="M 0 -244 l 6 12 l 13 2 l -10 9 l 3 13 l -12 -7 l -12 7 l 3 -13 l -10 -9 l 13 -2 Z" {...ol('#fde68a', w * 0.8, '#b7791f')} />
          <path d="M -10 -20 L -10 -48 Q 0 -60 10 -48 L 10 -20 Z" {...ol('#fde68a', w * 0.9, '#b7791f')} />
          <circle cx={0} cy={-104} r={12} {...ol('#bfdbfe', w * 0.9, '#7c83d8')} />
        </g>
      )}
    </g>
  )
}

function Balloon({ x, y }: { x: number; y: number }) {
  const t = useTint()
  const ol = useOutline()
  return (
    <g>
      <path d={`M ${x} ${y + 86} Q ${x - 66} ${y + 40} ${x - 62} ${y - 10} Q ${x - 56} ${y - 72} ${x} ${y - 74} Q ${x + 56} ${y - 72} ${x + 62} ${y - 10} Q ${x + 66} ${y + 40} ${x} ${y + 86} Z`} {...ol('#f9a8d4', 4)} />
      <path d={`M ${x} ${y + 86} Q ${x - 26} ${y + 40} ${x - 24} ${y - 10} Q ${x - 20} ${y - 70} ${x} ${y - 74} Q ${x + 20} ${y - 70} ${x + 24} ${y - 10} Q ${x + 26} ${y + 40} ${x} ${y + 86} Z`} {...ol('#c4b5fd', 3)} />
      <path d={`M ${x - 40} ${y - 40} Q ${x - 46} ${y - 12} ${x - 38} ${y + 16}`} fill="none" stroke={t('#ffffff')} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      <path d={`M ${x - 16} ${y + 92} L ${x - 14} ${y + 112} M ${x + 16} ${y + 92} L ${x + 14} ${y + 112}`} stroke={t('#7c5a3a')} strokeWidth={2.5} />
      <rect x={x - 20} y={y + 110} width={40} height={28} rx={6} {...ol('#d9a77a', 3.5)} />
    </g>
  )
}

function CloudSea() {
  return (
    <>
      <Blob circles={[[60, 800, 90], [220, 770, 110], [400, 790, 90], [560, 760, 110], [760, 790, 100], [940, 760, 110], [1120, 790, 95], [1300, 760, 110], [1480, 790, 100], [1620, 770, 90]]} rects={[[-20, 790, 1660, 240, 0]]} fill="#efe9ff" stroke="#d4c8fb" sw={4} />
      <Blob circles={[[-20, 900, 100], [160, 880, 110], [360, 900, 100], [560, 870, 120], [780, 900, 100], [1000, 870, 120], [1200, 900, 100], [1400, 880, 110], [1600, 900, 100]]} rects={[[-40, 900, 1680, 140, 0]]} fill="#ffffff" stroke="#d6cdfb" sw={4} />
    </>
  )
}

function Pano() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        <defs><RadialGlow id={ids('halo')} color="#fff5fb" inner={0.9} /></defs>
        <circle cx={800} cy={420} r={460} fill={ids.url('halo')} />
        {['#fca5a5', '#fdba74', '#fde68a', '#86efac', '#93c5fd', '#a5b4fc', '#d8b4fe'].map((c, i) => (
          <path key={c} d={`M ${180 + i * 12} 780 A ${620 - i * 12} ${620 - i * 12} 0 0 1 ${1420 - i * 12} 780`} fill="none" stroke={t(c)} strokeWidth={13} opacity={0.45} />
        ))}
        <circle cx={1210} cy={150} r={40} {...ol('#fff7de', 4, '#e7c98a')} />
        <circle cx={1228} cy={140} r={36} fill={t('#c9d3fc')} />
      </Art>
      <DriftClouds clouds={[{ x: 260, y: 300, s: 0.8, d: 66 }, { x: 1350, y: 380, s: 0.7, d: 72 }, { x: 560, y: 170, s: 0.5, d: 60 }]} stroke="#d4c8fb" />
      {/* small islands */}
      <Sprite x={300} y={290} w={180} h={150} className={a.bob} vars={{ '--d': '7s', '--by': '-6%' }}>
        <Island x={390} y={360} s={0.42} />
      </Sprite>
      <Sprite x={1120} y={230} w={220} h={170} className={a.bob} vars={{ '--d': '8s', '--dl': '-3s', '--by': '-6%' }}>
        <Island x={1230} y={300} s={0.5} trees={false} />
      </Sprite>
      {/* waterfall + main island */}
      <Sprite x={880} y={500} w={60} h={360} className={a.shimmer} vars={{ '--d': '2.2s', '--op': 1 }}>
        <path d="M 888 520 L 888 850 M 901 516 L 901 860 M 914 520 L 914 850" stroke={t('#ffffff')} strokeWidth={4} strokeLinecap="round" strokeDasharray="22 16" />
      </Sprite>
      <Art>
        <path d="M 880 504 L 922 504 L 926 860 L 876 860 Z" {...ol('#cfe9ff', 3, '#93c5fd')} />
      </Art>
      <Sprite x={600} y={240} w={400} h={420} className={a.bob} vars={{ '--d': '9s', '--by': '-3%' }}>
        <Island x={800} y={500} s={0.86} tower />
      </Sprite>
      <Sprite x={1150} y={470} w={140} h={240} className={a.drift} vars={{ '--d': '30s', '--dx': '40%' }} inner={a.bob} innerVars={{ '--d': '5s', '--by': '-6%' }}>
        <Balloon x={1220} y={560} />
      </Sprite>
      <Art>
        <CloudSea />
      </Art>
      <Twinkles points={[[150, 90], [380, 160], [620, 70], [980, 110], [1110, 230], [1460, 120], [1500, 300], [260, 420], [720, 160], [1340, 500]]} color="#ffffff" r={11} kind="star" />
      <Twinkles points={[[540, 600], [1060, 640], [700, 720], [1000, 400]]} color="#fde68a" r={9} />
    </Stage>
  )
}

function CornerClouds({ side }: { side: 'bl' | 'br' }) {
  const flip = side === 'br'
  return (
    <Stage w={400} h={1000} anchor={side}>
      <Art>
        <g transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
          <Blob circles={[[-40, 720, 100], [80, 790, 90], [190, 870, 100], [320, 950, 90], [40, 950, 160], [220, 1010, 90]]} fill="#ffffff" stroke="#d6cdfb" sw={5} />
        </g>
      </Art>
    </Stage>
  )
}

export function SkyScene() {
  return (
    <>
      <Sky stops={[[0, '#b8cafb'], [45, '#d8d3fd'], [100, '#fde0ef']]} />
      <Pano />
      <CornerClouds side="bl" />
      <CornerClouds side="br" />
    </>
  )
}
