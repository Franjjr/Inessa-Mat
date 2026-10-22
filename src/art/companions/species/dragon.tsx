/* Dragoncito / dragoncita: a round baby dragon with nub horns, fin ears, tiny wings, a striped belly
   and a spade tail. (Green by default so it never looks like Chispa, the orange forge dragon.) */
import { Loop, anim, ol } from '../../characters/shared/frame'
import type { SpeciesDef } from '../types'
import { EarPair, Stroke, Tail, anchors, chibiFace } from './common'

export const babyDragon: SpeciesDef = {
  label: 'Dragoncito',
  palettes: {
    default: { fur: '#86efac', ink: '#15803d', light: '#fef9c3', inner: '#bbf7d0', nose: '#166534', mark: '#fde68a', markInk: '#a16207', eye: '#052e16' },
    sunny: { fur: '#fde047', ink: '#a16207', light: '#fff7ed', inner: '#fef08a', nose: '#713f12', mark: '#fb923c', markInk: '#c2410c', eye: '#422006' },
    berry: { fur: '#f0abfc', ink: '#a21caf', light: '#fdf4ff', inner: '#f5d0fe', nose: '#701a75', mark: '#c4b5fd', markInk: '#6d28d9', eye: '#4a044e' },
    mint: { fur: '#7dd3fc', ink: '#0369a1', light: '#ecfeff', inner: '#bae6fd', nose: '#0c4a6e', mark: '#a7f3d0', markInk: '#047857', eye: '#082f49' },
  },
  anchors: anchors({ headTop: { y: 44, w: 60 } }),
  face: (p) => chibiFace(p, { mouth: [100, 110], mw: 7.6 }),
  ears: (c) => (
    <>
      <EarPair c={c} pivot={[50, 86]}>
        <path d="M50 78 L30 68 L36 92 L50 96 Z" fill={c.p.inner} {...ol(c.p.ink, 4)} />
      </EarPair>
      <g fill={c.p.mark} {...ol(c.p.markInk ?? c.p.ink, 4)}>
        <path d="M68 52 Q62 34 70 24 Q80 32 84 46 Z" />
        <path d="M132 52 Q138 34 130 24 Q120 32 116 46 Z" />
        <path d="M93 40 L100 26 L107 40 Z" />
      </g>
    </>
  ),
  headDecor: ({ p }) => (
    <g>
      <ellipse cx={100} cy={108} rx={24} ry={14} fill={p.light} />
      <ellipse cx={84} cy={50} rx={10} ry={4.5} fill="#ffffff" opacity={0.55} transform="rotate(-18 84 50)" />
    </g>
  ),
  faceDecor: ({ p }) => (
    <g fill={p.nose}>
      <ellipse cx={93} cy={101} rx={2.4} ry={1.8} />
      <ellipse cx={107} cy={101} rx={2.4} ry={1.8} />
    </g>
  ),
  behind: (c) => (
    <g>
      <Loop cls={anim.flapSlow} x={72} y={134} on={c.animated && c.pose !== 'sleep'}>
        <path d="M72 134 C58 128 44 116 40 100 C48 106 54 106 58 102 C58 112 64 118 72 120 Z" fill={c.p.inner} {...ol(c.p.ink, 4.4)} />
      </Loop>
      <Loop cls={anim.flapSlow} x={128} y={134} on={c.animated && c.pose !== 'sleep'}>
        <path d="M128 134 C142 128 156 116 160 100 C152 106 146 106 142 102 C142 112 136 118 128 120 Z" fill={c.p.inner} {...ol(c.p.ink, 4.4)} />
      </Loop>
      <Tail c={c} x={126} y={172}>
        <Stroke d="M124 174 C144 178 160 172 166 156" w={12} fill={c.p.fur} ink={c.p.ink} />
        <path d="M164 160 L160 142 L178 150 L174 164 Z" fill={c.p.mark} {...ol(c.p.markInk ?? c.p.ink, 4)} />
      </Tail>
    </g>
  ),
  bodyDecor: ({ p }) => (
    <g>
      <ellipse cx={100} cy={158} rx={22} ry={19} fill={p.light} />
      <path d="M84 150 Q100 154 116 150 M82 160 Q100 164 118 160 M86 170 Q100 174 114 170" fill="none" stroke={p.mark} strokeWidth={2.6} strokeLinecap="round" />
    </g>
  ),
  feet: ({ p }) => (
    <g>
      <g fill={p.fur} {...ol(p.ink)}>
        <ellipse cx={82} cy={184} rx={13} ry={8.5} />
        <ellipse cx={118} cy={184} rx={13} ry={8.5} />
      </g>
      <g fill="#ffffff">
        <circle cx={76} cy={189} r={1.8} /><circle cx={82} cy={190} r={1.8} /><circle cx={88} cy={189} r={1.8} />
        <circle cx={112} cy={189} r={1.8} /><circle cx={118} cy={190} r={1.8} /><circle cx={124} cy={189} r={1.8} />
      </g>
    </g>
  ),
}
