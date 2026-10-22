/* Conejito / conejita: long ears that flop when sad, a pink button nose and a cotton tail. */
import { ol } from '../../characters/shared/frame'
import type { SpeciesDef } from '../types'
import { EarPair, Nose, Tail, anchors, chibiFace } from './common'

export const bunny: SpeciesDef = {
  label: 'Conejito',
  palettes: {
    default: { fur: '#ffffff', ink: '#9a86bd', light: '#f5f3ff', inner: '#fbcfe8', nose: '#f472b6', mark: '#ede9fe', eye: '#3b0764' },
    sunny: { fur: '#fef3c7', ink: '#c2410c', light: '#fffbeb', inner: '#fecdd3', nose: '#fb7185', mark: '#fde68a', eye: '#431407' },
    berry: { fur: '#fbcfe8', ink: '#be185d', light: '#fdf2f8', inner: '#f9a8d4', nose: '#db2777', mark: '#fce7f3', eye: '#500724' },
    mint: { fur: '#d1fae5', ink: '#059669', light: '#f0fdf4', inner: '#fbcfe8', nose: '#f472b6', mark: '#a7f3d0', eye: '#022c22' },
  },
  anchors: anchors({ headTop: { y: 44, w: 60 } }),
  earGain: 1.9,
  face: (p) => chibiFace(p, { catMouth: true, mouth: [100, 108] }),
  ears: (c) => (
    <EarPair c={c} pivot={[82, 50]}>
      <path d="M74 54 C64 30 64 4 76 0 C90 -4 96 26 92 50 Z" fill={c.p.fur} {...ol(c.p.ink)} />
      <path d="M78 46 C72 30 72 12 78 8 C86 6 88 28 86 46 Z" fill={c.p.inner} />
    </EarPair>
  ),
  headDecor: ({ p }) => <ellipse cx={82} cy={50} rx={10} ry={4.5} fill={p.mark} transform="rotate(-18 82 50)" />,
  faceDecor: ({ p, expr }) => (
    <g>
      <Nose y={100} w={5.4} fill={p.nose} />
      {/* little buck teeth on the resting smile */}
      {expr.mouth === 'smile' && (
        <path d="M96.5 110.5 L96.5 115.5 Q98.2 117 100 115.5 Q101.8 117 103.5 115.5 L103.5 110.5 Z" fill="#ffffff" stroke={p.ink} strokeWidth={1.8} strokeLinejoin="round" />
      )}
    </g>
  ),
  behind: (c) => (
    <Tail c={c} x={132} y={170}>
      <circle cx={134} cy={168} r={12} fill={c.p.light} {...ol(c.p.ink)} />
    </Tail>
  ),
  feet: ({ p }) => (
    <g>
      <g fill={p.fur} {...ol(p.ink)}>
        <ellipse cx={80} cy={185} rx={15} ry={8.5} />
        <ellipse cx={120} cy={185} rx={15} ry={8.5} />
      </g>
      <g fill={p.inner}>
        <ellipse cx={80} cy={186} rx={5.5} ry={3.4} />
        <ellipse cx={120} cy={186} rx={5.5} ry={3.4} />
      </g>
    </g>
  ),
}
