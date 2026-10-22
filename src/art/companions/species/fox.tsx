/* Zorrito: tall ears with dark tips, a white cheek mask and a big fluffy tail. */
import { ol } from '../../characters/shared/frame'
import type { SpeciesDef } from '../types'
import { EarPair, Tail, anchors, chibiFace } from './common'

export const fox: SpeciesDef = {
  label: 'Zorrito',
  palettes: {
    default: { fur: '#fb923c', ink: '#c2410c', light: '#fff7ed', inner: '#fed7aa', nose: '#431407', mark: '#7c2d12', eye: '#431407' },
    sunny: { fur: '#fcd34d', ink: '#b45309', light: '#fffbeb', inner: '#fef3c7', nose: '#451a03', mark: '#b45309', eye: '#451a03' },
    berry: { fur: '#f472b6', ink: '#9d174d', light: '#fdf2f8', inner: '#fbcfe8', nose: '#500724', mark: '#831843', eye: '#500724' },
    mint: { fur: '#5eead4', ink: '#0f766e', light: '#f0fdfa', inner: '#ccfbf1', nose: '#134e4a', mark: '#115e59', eye: '#042f2e' },
  },
  anchors: anchors({ headTop: { y: 44, w: 60 } }),
  face: (p) => chibiFace(p, { mouth: [100, 110] }),
  ears: (c) => (
    <EarPair c={c} pivot={[72, 52]}>
      <path d="M52 70 Q46 30 58 10 Q82 26 94 46 Z" fill={c.p.fur} {...ol(c.p.ink)} />
      <path d="M58 26 Q58 16 58.5 11 Q68 17 75 24 Q66 26 58 26 Z" fill={c.p.mark} />
      <path d="M60 58 Q58 40 62 30 Q74 36 84 46 Z" fill={c.p.inner} />
    </EarPair>
  ),
  headDecor: ({ p }) => (
    <path d="M47 92 Q62 86 80 102 Q92 110 100 104 Q108 110 120 102 Q138 86 153 92 Q150 126 100 131 Q50 126 47 92 Z" fill={p.light} />
  ),
  faceDecor: ({ p }) => (
    <g>
      <ellipse cx={100} cy={101} rx={6.4} ry={4.6} fill={p.nose} />
      <ellipse cx={98} cy={99.6} rx={2} ry={1.2} fill="#ffffff" opacity={0.7} />
    </g>
  ),
  behind: (c) => (
    <Tail c={c} x={126} y={170}>
      <path d="M122 172 C150 180 182 164 184 132 C186 112 172 98 160 104 C168 122 158 144 128 152 Z" fill={c.p.fur} {...ol(c.p.ink)} />
      <path d="M184 132 C186 112 172 98 160 104 C163 112 163 120 160 128 Q172 136 184 132 Z" fill={c.p.light} {...ol(c.p.ink)} />
    </Tail>
  ),
  feet: ({ p }) => (
    <g fill={p.mark} {...ol(p.ink)}>
      <ellipse cx={82} cy={184} rx={13} ry={8.5} />
      <ellipse cx={118} cy={184} rx={13} ry={8.5} />
    </g>
  ),
}
