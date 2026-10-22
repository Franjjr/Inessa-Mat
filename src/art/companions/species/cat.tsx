/* Gatito / gatita: pointy ears, forehead stripes, whiskers, a curly tail. */
import { SW_FINE, ol } from '../../characters/shared/frame'
import type { SpeciesDef } from '../types'
import { EarPair, Nose, Stroke, Tail, anchors, chibiFace } from './common'

export const cat: SpeciesDef = {
  label: 'Gatito',
  palettes: {
    default: { fur: '#fdba74', ink: '#c2410c', light: '#fff7ed', inner: '#fbcfe8', nose: '#f472b6', mark: '#f97316', eye: '#431407' },
    sunny: { fur: '#fde68a', ink: '#b45309', light: '#fffbeb', inner: '#fecdd3', nose: '#fb7185', mark: '#fbbf24', eye: '#451a03' },
    berry: { fur: '#e9d5ff', ink: '#7e22ce', light: '#faf5ff', inner: '#fbcfe8', nose: '#ec4899', mark: '#c084fc', eye: '#3b0764' },
    mint: { fur: '#a7f3d0', ink: '#047857', light: '#ecfdf5', inner: '#fbcfe8', nose: '#f472b6', mark: '#5fd3a5', eye: '#022c22' },
  },
  anchors: anchors({ headTop: { y: 44, w: 62 } }),
  face: (p) => chibiFace(p, { catMouth: true }),
  ears: (c) => (
    <EarPair c={c} pivot={[72, 52]}>
      <path d="M52 70 Q48 36 58 20 Q78 28 94 46 Z" fill={c.p.fur} {...ol(c.p.ink)} />
      <path d="M59 58 Q57 40 62 30 Q74 36 84 46 Z" fill={c.p.inner} />
    </EarPair>
  ),
  headDecor: ({ p }) => (
    <g stroke={p.mark} strokeWidth={4.4} strokeLinecap="round" fill="none">
      <path d="M100 40 L100 53 M87 42 L89 52 M113 42 L111 52" />
      <path d="M47 82 L57 84 M48 92 L57 92 M153 82 L143 84 M152 92 L143 92" />
    </g>
  ),
  faceDecor: ({ p }) => (
    <g>
      <Nose y={100} w={5.6} fill={p.nose} />
      <g stroke={p.ink} strokeWidth={SW_FINE} strokeLinecap="round" opacity={0.75}>
        <path d="M58 104 L40 101 M58 110 L41 113 M142 104 L160 101 M142 110 L159 113" />
      </g>
    </g>
  ),
  behind: (c) => (
    <Tail c={c} x={128} y={170}>
      <Stroke d="M124 172 C150 176 166 160 160 140 C156 126 166 116 174 122" w={13} fill={c.p.fur} ink={c.p.ink} />
      <path d="M160 140 C157 130 162 122 168 120" stroke={c.p.mark} strokeWidth={5} fill="none" strokeLinecap="round" />
    </Tail>
  ),
  bodyDecor: ({ p }) => (
    <g>
      <ellipse cx={100} cy={158} rx={22} ry={19} fill={p.light} />
      <path d="M68 146 L76 148 M132 146 L124 148" stroke={p.mark} strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
  feet: ({ p }) => (
    <g>
      <g fill={p.fur} {...ol(p.ink)}>
        <ellipse cx={82} cy={184} rx={13} ry={8.5} />
        <ellipse cx={118} cy={184} rx={13} ry={8.5} />
      </g>
      <path d="M78 188 L78 184 M86 188 L86 184 M114 188 L114 184 M122 188 L122 184" stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
}
