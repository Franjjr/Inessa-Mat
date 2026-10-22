/* Pingüino / pingüina: a heart-shaped face mask, a little beak that opens, flippers and orange feet. */
import { anim, ol } from '../../characters/shared/frame'
import type { MouthKind } from '../../characters/shared/pose'
import type { Palette, SpeciesDef } from '../types'
import { Tail, anchors, chibiFace } from './common'

const BEAK_INK = '#c2410c'

function Beak({ p, mouth, animated }: { p: Palette; mouth: MouthKind; animated: boolean }) {
  if (mouth === 'grin' || mouth === 'o' || mouth === 'eek' || mouth === 'talk') {
    const lower = <path d="M93 110 Q100 119 107 110 Z" fill="#fdba74" stroke={BEAK_INK} strokeWidth={2.8} strokeLinejoin="round" />
    return (
      <g>
        <ellipse cx={100} cy={109} rx={mouth === 'o' ? 4.5 : 6} ry={4.5} fill="#9f1239" />
        {mouth === 'talk'
          ? <g className={animated ? anim.talk : undefined} style={{ transformOrigin: '100px 106px' }}>{lower}</g>
          : lower}
        <path d="M91 104 Q100 98 109 104 L100 110 Z" fill={p.nose} stroke={BEAK_INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
    )
  }
  return <path d="M91 104 Q100 98 109 104 Q104 112 100 113 Q96 112 91 104 Z" fill={p.nose} stroke={BEAK_INK} strokeWidth={3} strokeLinejoin="round" />
}

export const penguin: SpeciesDef = {
  label: 'Pingüino',
  palettes: {
    default: { fur: '#475569', ink: '#1e293b', light: '#ffffff', inner: '#cbd5e1', nose: '#fb923c', mark: '#fb923c', markInk: '#c2410c', eye: '#0f172a' },
    sunny: { fur: '#f59e0b', ink: '#92400e', light: '#fffbeb', inner: '#fde68a', nose: '#fb923c', mark: '#f97316', markInk: '#c2410c', eye: '#431407' },
    berry: { fur: '#a855f7', ink: '#6b21a8', light: '#faf5ff', inner: '#e9d5ff', nose: '#fb923c', mark: '#fb923c', markInk: '#c2410c', eye: '#3b0764' },
    mint: { fur: '#14b8a6', ink: '#115e59', light: '#f0fdfa', inner: '#99f6e4', nose: '#fb923c', mark: '#fb923c', markInk: '#c2410c', eye: '#042f2e' },
  },
  anchors: anchors({ headTop: { y: 42, w: 62 }, neck: { y: 131 } }),
  face: (p) => chibiFace(p, { noMouth: true, eyes: [[80, 89], [120, 89]], cheeks: [[67, 104], [133, 104]] }),
  body: { cx: 100, cy: 150, rx: 42, ry: 35 },
  arm: {
    x: 62,
    y: 134,
    d: 'M-7 -4 C-13 12 -12 28 -2 38 C5 30 8 16 7 -4 A7 7 0 0 0 -7 -4 Z',
    hand: [-1, 30],
    table: { down: 14, in: 4, out: 60, up: 146, spread: 104, talk: 74, chest: -40, face: -140, chin: -146 },
  },
  ears: ({ p }) => <path d="M96 42 C90 26 104 18 112 26 C104 27 101 33 105 42 Z" fill={p.fur} {...ol(p.ink)} />,
  headDecor: ({ p }) => (
    <g>
      <path d="M100 64 C88 48 56 52 54 80 C52 106 72 126 100 129 C128 126 148 106 146 80 C144 52 112 48 100 64 Z" fill={p.light} />
      <ellipse cx={78} cy={48} rx={10} ry={4.5} fill="#ffffff" opacity={0.35} transform="rotate(-18 78 48)" />
    </g>
  ),
  faceDecor: ({ p, expr, animated }) => <Beak p={p} mouth={expr.mouth} animated={animated} />,
  bodyDecor: ({ p }) => <ellipse cx={100} cy={156} rx={27} ry={25} fill={p.light} />,
  behind: (c) => (
    <Tail c={c} x={100} y={180}>
      <path d="M90 178 L100 190 L110 178 Z" fill={c.p.fur} {...ol(c.p.ink)} />
    </Tail>
  ),
  feet: ({ p }) => (
    <g fill={p.mark} {...ol(p.markInk ?? p.ink, 4)}>
      <path d="M68 186 Q70 176 82 178 Q94 178 96 186 Q90 191 82 188 Q76 192 68 186 Z" />
      <path d="M132 186 Q130 176 118 178 Q106 178 104 186 Q110 191 118 188 Q124 192 132 186 Z" />
    </g>
  ),
}
