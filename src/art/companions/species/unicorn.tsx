/* Unicornio bebé: lilac by default, a SMALL pearly horn (Lumi's is big and golden), a short
   three-colour forelock, leaf ears, a soft muzzle and little hooves. Front-facing chibi. */
import { ol } from '../../characters/shared/frame'
import { spiralHorn } from '../../characters/shared/horn'
import type { SpeciesDef } from '../types'
import { EarPair, Tail, anchors, chibiFace } from './common'

const HORN = spiralHorn([100, 48], [103, 6], 19, 0, 3)

export const babyUnicorn: SpeciesDef = {
  label: 'Unicornio bebé',
  palettes: {
    default: { fur: '#ede4ff', ink: '#7e22ce', light: '#faf5ff', inner: '#fbcfe8', nose: '#c084fc', mark: '#fdf2f8', markInk: '#db2777', eye: '#3b0764', mane: ['#f9a8d4', '#a5b4fc', '#99f6e4'] },
    sunny: { fur: '#fef9c3', ink: '#ca8a04', light: '#fffbeb', inner: '#fecdd3', nose: '#fdba74', mark: '#fff7ed', markInk: '#ea580c', eye: '#422006', mane: ['#fdba74', '#fca5a5', '#fde047'] },
    berry: { fur: '#fce7f3', ink: '#be185d', light: '#fdf2f8', inner: '#f9a8d4', nose: '#f472b6', mark: '#faf5ff', markInk: '#9333ea', eye: '#500724', mane: ['#c084fc', '#f472b6', '#fda4af'] },
    mint: { fur: '#d1fae5', ink: '#047857', light: '#f0fdf4', inner: '#fbcfe8', nose: '#6ee7b7', mark: '#f0f9ff', markInk: '#0284c7', eye: '#022c22', mane: ['#93c5fd', '#a5b4fc', '#6ee7b7'] },
  },
  anchors: anchors({ headTop: { y: 45, w: 60 } }),
  face: (p) => chibiFace(p, { lashes: true, mouth: [100, 113], mw: 6.8, cheeks: [[64, 104], [136, 104]] }),
  ears: (c) => {
    const m = c.p.mane ?? ['#f9a8d4', '#a5b4fc', '#99f6e4']
    return (
      <>
        {/* side mane flowing down the left */}
        <g {...ol(c.p.ink, 3.6)}>
          <circle cx={52} cy={96} r={11} fill={m[2]} />
          <circle cx={50} cy={76} r={12} fill={m[1]} />
        </g>
        <EarPair c={c} pivot={[70, 54]}>
          <path d="M56 66 Q50 42 60 28 Q76 38 84 52 Z" fill={c.p.fur} {...ol(c.p.ink)} />
          <path d="M61 58 Q58 44 63 36 Q72 42 77 50 Z" fill={c.p.inner} />
        </EarPair>
      </>
    )
  },
  headDecor: ({ p }) => {
    const m = p.mane ?? ['#f9a8d4', '#a5b4fc', '#99f6e4']
    return (
      <g>
        <ellipse cx={100} cy={110} rx={22} ry={14} fill={p.light} />
        <g {...ol(p.ink, 3.6)}>
          <circle cx={64} cy={58} r={11} fill={m[1]} />
          <circle cx={78} cy={46} r={12} fill={m[0]} />
          <circle cx={88} cy={54} r={9} fill={m[2]} />
        </g>
      </g>
    )
  },
  faceDecor: ({ p }) => (
    <g fill={p.nose}>
      <ellipse cx={93} cy={106} rx={2.2} ry={1.6} />
      <ellipse cx={107} cy={106} rx={2.2} ry={1.6} />
    </g>
  ),
  overHat: ({ p }) => (
    <g>
      {HORN.rings.map((d, i) => (
        <g key={i}>
          <path d={d} fill={p.mark} {...ol(p.markInk ?? p.ink, 3.6)} />
          <path d={HORN.highlights[i].d} stroke="#ffffff" strokeWidth={HORN.highlights[i].w} strokeLinecap="round" />
        </g>
      ))}
    </g>
  ),
  behind: (c) => {
    const m = c.p.mane ?? ['#f9a8d4', '#a5b4fc', '#99f6e4']
    return (
      <Tail c={c} x={128} y={168}>
        <g {...ol(c.p.ink, 3.6)}>
          <circle cx={140} cy={150} r={11} fill={m[0]} />
          <circle cx={146} cy={166} r={10} fill={m[1]} />
          <circle cx={136} cy={176} r={9} fill={m[2]} />
        </g>
      </Tail>
    )
  },
  feet: ({ p }) => {
    const m = p.mane ?? ['#f9a8d4', '#a5b4fc', '#99f6e4']
    return (
      <g>
        <g fill={p.fur} {...ol(p.ink)}>
          <ellipse cx={82} cy={183} rx={12.5} ry={8.5} />
          <ellipse cx={118} cy={183} rx={12.5} ry={8.5} />
        </g>
        <g fill={m[1]} {...ol(p.ink, 3.4)}>
          <path d="M70 186 Q82 182 94 186 Q94 192 82 192 Q70 192 70 186 Z" />
          <path d="M106 186 Q118 182 130 186 Q130 192 118 192 Q106 192 106 186 Z" />
        </g>
      </g>
    )
  },
}
