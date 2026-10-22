/* La Forja del Dragón (w7): a friendly rounded volcano puffing smoke behind warm rocky hills, the dragon's stone
   forge with a glowing door and cage-shaped lanterns, embers and forge sparks rising. */
import a from '../ambient.module.css'
import { light, shade } from '../color'
import { Art, Lane, Sprite, Stage, useIds, useOutline, useTint } from '../kit'
import { CrystalCluster, RadialGlow, Rock, SmokeParticle, SparkParticle } from '../shapes'
import { bumpLine, ParticleField, Sky, Twinkles } from './common'

function Pano() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={1600} h={1000}>
      <Art>
        <defs>
          <RadialGlow id={ids('sun')} color="#fff0c4" inner={1} />
          <RadialGlow id={ids('crater')} color="#fdba74" inner={0.9} />
        </defs>
        <circle cx={1180} cy={170} r={200} fill={ids.url('sun')} />
        <circle cx={1180} cy={170} r={42} {...ol('#fff1b8', 4, '#f2c46b')} />
        {/* far ranges */}
        <path d={bumpLine(-20, 1640, 580, 40, 80, 41)} {...ol('#f3cdb3', 3)} />
        {/* volcano */}
        <circle cx={800} cy={300} r={170} fill={ids.url('crater')} />
        <path d="M 360 712 C 520 590 620 420 690 330 Q 704 306 730 302 L 870 302 Q 896 306 910 330 C 980 420 1080 590 1240 712 Z" {...ol('#d9997b', 5)} />
        <path d="M 820 304 C 880 400 1000 560 1150 700 L 1240 712 C 1080 590 980 420 910 330 Q 896 306 870 302 Z" fill={t('#c98a6f')} />
        <ellipse cx={800} cy={306} rx={72} ry={14} {...ol('#fb923c', 4, '#c2410c')} />
        <ellipse cx={792} cy={303} rx={40} ry={6} fill={t('#fde68a')} />
        {/* friendly lava drips */}
        <path d="M 736 306 Q 728 360 744 404 Q 758 444 740 492 Q 730 528 750 540 Q 772 532 766 494 Q 780 446 768 400 Q 758 356 774 306 Z" {...ol('#fb923c', 4, '#c2410c')} />
        <path d="M 746 330 Q 742 366 752 398" fill="none" stroke={t('#fde68a')} strokeWidth={6} strokeLinecap="round" />
        <path d="M 838 306 Q 852 344 846 380 Q 840 412 856 436 Q 874 444 876 424 Q 866 400 870 374 Q 874 340 864 306 Z" {...ol('#fdba74', 4, '#c2410c')} />
        <path d="M 848 322 Q 856 346 852 368" fill="none" stroke={t('#fff1c2')} strokeWidth={5} strokeLinecap="round" />
        <g fill={t(light('#d9997b', 0.25))}>
          <ellipse cx={640} cy={520} rx={22} ry={10} />
          <ellipse cx={940} cy={560} rx={26} ry={11} />
          <ellipse cx={560} cy={640} rx={18} ry={8} />
          <ellipse cx={1010} cy={460} rx={14} ry={7} />
        </g>
        {/* rocky hills */}
        <path d="M -10 700 Q 240 620 520 670 Q 800 716 1080 664 Q 1360 616 1610 668 L 1610 1010 L -10 1010 Z" {...ol('#e8b493', 4)} />
        <Rock x={420} y={700} s={0.8} fill="#d9a184" />
        <Rock x={1210} y={690} s={0.9} fill="#d9a184" flip />
        <CrystalCluster x={560} y={720} s={0.5} color="#fb923c" sw={3} />
        <CrystalCluster x={1080} y={706} s={0.45} color="#fbbf24" sw={3} flip />
        {/* front ground with warm glowing cracks */}
        <path d="M -10 806 Q 400 756 800 780 Q 1200 806 1610 760 L 1610 1010 L -10 1010 Z" {...ol('#f0c6a5', 4)} />
        <path d="M 760 800 Q 840 830 800 880 Q 760 930 860 1004 L 980 1004 Q 900 930 920 880 Q 950 830 860 800 Z" {...ol('#f8dcc2', 3.5, '#d8a882')} />
        <path d="M 360 880 l 30 18 l -14 22 l 34 20 M 1200 860 l -26 20 l 18 18 l -30 26" fill="none" stroke={t('#fb923c')} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {[[600, 900, 9], [660, 960, 7], [1040, 920, 8], [1110, 980, 6], [500, 980, 6]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r * 1.6} ry={r} {...ol('#e0ae8c', 2.5)} />)}
      </Art>
      {/* crater glow + smoke */}
      <Sprite x={680} y={240} w={240} h={120} className={a.glow} vars={{ '--d': '3s' }}>
        <defs><RadialGlow id={ids('cg')} color="#fde68a" inner={0.85} /></defs>
        <ellipse cx={800} cy={300} rx={110} ry={44} fill={ids.url('cg')} />
      </Sprite>
      {[0, 1, 2, 3].map((i) => (
        <Lane key={i} x={760 + i * 26} y={60} h={240} size={70} dir="rise" laneClass={a.rise} particleClass={a.puff} vars={{ '--d': '9s', '--dl': `${-i * 2.25}s`, '--op': 0.95 }}>
          <SmokeParticle color="#f3e6de" />
        </Lane>
      ))}
      <ParticleField count={10} seed={51} x0={200} x1={1400} y={200} h={800} size={[12, 20]} dur={[6, 10]} dir="rise" particleClass={a.wobble} render={(i) => <SparkParticle color={i % 2 ? '#fb923c' : '#fbbf24'} />} />
      <Twinkles points={[[800, 230], [740, 200], [860, 210]]} color="#fde68a" r={8} />
    </Stage>
  )
}

function CageLantern({ x, y, i }: { x: number; y: number; i: number }) {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Sprite x={x - 44} y={y} w={88} h={150} className={a.swing} vars={{ '--d': `${3.6 + i * 0.8}s`, '--dl': `${-i}s`, '--deg': '4deg' }}>
      <defs><RadialGlow id={ids(`cl${i}`)} color="#fdba74" inner={0.95} /></defs>
      <path d={`M ${x} ${y} L ${x} ${y + 36}`} stroke={t('#6b4f4f')} strokeWidth={3} />
      <circle cx={x} cy={y + 88} r={44} fill={ids.url(`cl${i}`)} />
      <circle cx={x} cy={y + 40} r={7} fill="none" stroke={t('#6b4f4f')} strokeWidth={3} />
      <path d={`M ${x - 24} ${y + 66} Q ${x - 24} ${y + 46} ${x} ${y + 46} Q ${x + 24} ${y + 46} ${x + 24} ${y + 66} Z`} {...ol('#a16207', 3)} />
      <circle cx={x} cy={y + 90} r={10} fill={t('#fde68a')} />
      {[-18, -6, 6, 18].map((dx) => <path key={dx} d={`M ${x + dx} ${y + 66} L ${x + dx} ${y + 114}`} stroke={t('#7c4a1e')} strokeWidth={3.5} strokeLinecap="round" />)}
      <rect x={x - 27} y={y + 112} width={54} height={10} rx={4} {...ol('#a16207', 3)} />
    </Sprite>
  )
}

function Forge() {
  const t = useTint()
  const ol = useOutline()
  const ids = useIds()
  return (
    <Stage w={400} h={1000} anchor="br" maxW="36%">
      <Art>
        <defs><RadialGlow id={ids('door')} color="#fdba74" inner={1} /></defs>
        {/* chimney */}
        <rect x={250} y={420} width={60} height={200} rx={8} {...ol('#b9a3a3', 5)} />
        <rect x={240} y={408} width={80} height={24} rx={8} {...ol('#a38c8c', 5)} />
        {/* stone dome forge */}
        <path d="M 40 1004 L 40 800 Q 40 610 230 600 Q 404 610 404 800 L 404 1004 Z" {...ol('#c9b3b0', 5)} />
        {[[90, 700, 46], [170, 660, 40], [280, 650, 46], [360, 700, 36], [70, 800, 40], [380, 800, 34], [80, 900, 38], [380, 900, 30]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.55} {...ol(i % 2 ? '#d8c6c2' : '#bea6a3', 3)} />
        ))}
        <circle cx={200} cy={900} r={150} fill={ids.url('door')} />
        <path d="M 120 1004 L 120 880 Q 120 800 200 800 Q 280 800 280 880 L 280 1004 Z" {...ol('#7c2d12', 5)} />
        <path d="M 140 1004 L 140 888 Q 140 822 200 822 Q 260 822 260 888 L 260 1004 Z" fill={t('#fb923c')} />
        <path d="M 160 1004 Q 160 920 200 900 Q 240 920 240 1004 Z" fill={t('#fde68a')} />
        <path d="M 182 1004 Q 186 950 200 940 Q 214 950 218 1004 Z" fill={t('#fff7d6')} />
        <path d="M 110 790 L 290 790" stroke={t(shade('#c9b3b0'))} strokeWidth={6} strokeLinecap="round" />
        {/* anvil */}
        <path d="M -20 930 L 90 930 Q 96 950 60 956 L 50 980 L 70 1004 L -10 1004 L 10 980 L 0 956 Q -36 950 -20 930 Z" {...ol('#8b8fa3', 4)} />
        <path d="M -10 938 L 80 938" stroke={t(light('#8b8fa3', 0.5))} strokeWidth={4} strokeLinecap="round" />
      </Art>
      <Sprite x={140} y={780} w={120} h={224} className={a.glow} vars={{ '--d': '1.8s' }}>
        <path d="M 160 1004 Q 160 920 200 900 Q 240 920 240 1004 Z" fill={t('#fde68a')} />
        <path d="M 182 1004 Q 186 950 200 940 Q 214 950 218 1004 Z" fill={t('#ffffff')} />
      </Sprite>
      {[0, 1].map((i) => (
        <Lane key={i} x={270 + i * 18} y={170} h={240} size={66} dir="rise" laneClass={a.rise} particleClass={a.puff} vars={{ '--d': '7s', '--dl': `${-i * 3.5}s`, '--op': 0.9 }}>
          <SmokeParticle color="#ece2df" />
        </Lane>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Lane key={`s${i}`} x={150 + i * 20} y={600} h={260} size={16} dir="rise" laneClass={a.rise} particleClass={a.wobble} vars={{ '--d': `${2.2 + (i % 3) * 0.5}s`, '--dl': `${-i * 0.55}s`, '--sd': '0.9s' }}>
          <SparkParticle color={i % 2 ? '#fbbf24' : '#fb923c'} />
        </Lane>
      ))}
    </Stage>
  )
}

function LeftEdge() {
  const t = useTint()
  return (
    <Stage w={400} h={1000} anchor="bl">
      <Art>
        <Rock x={140} y={1004} s={2.4} fill="#d9a184" sw={5} />
        <CrystalCluster x={250} y={1000} s={1.4} color="#fb923c" sw={5} />
        <CrystalCluster x={60} y={1000} s={0.9} color="#fbbf24" sw={5} flip />
        <path d="M 310 1004 l 20 -50 l 40 0 l 20 50 Z" fill={t('#c2410c')} />
      </Art>
    </Stage>
  )
}

function Rope() {
  const t = useTint()
  return (
    <Stage w={400} h={400} anchor="tl">
      <Art>
        <path d="M -10 30 Q 200 120 410 40" fill="none" stroke={t('#8a6a55')} strokeWidth={5} strokeLinecap="round" />
      </Art>
      <CageLantern x={130} y={72} i={1} />
      <CageLantern x={290} y={70} i={2} />
    </Stage>
  )
}

export function VolcanoScene() {
  return (
    <>
      <Sky stops={[[0, '#ffd8bb'], [55, '#ffedd9'], [100, '#fff7ea']]} />
      <Pano />
      <LeftEdge />
      <Forge />
      <Rope />
    </>
  )
}
