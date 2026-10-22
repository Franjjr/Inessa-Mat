/* Perrito / perrita: floppy ears, a patch over one eye, a big muzzle and a waggy stub tail. */
import { Limb, ol } from '../../characters/shared/frame'
import type { SpeciesDef } from '../types'
import { Tail, anchors, chibiFace } from './common'

/** Floppy ears: positive = lifted outward (perky), negative = hugging the face (sad). */
const FLOP: Record<string, number> = { up: 0, perk: 16, droop: -10, flat: -16 }

export const dog: SpeciesDef = {
  label: 'Perrito',
  palettes: {
    default: { fur: '#f5deb3', ink: '#92400e', light: '#fffaf0', inner: '#fbcfe8', nose: '#3f2a1d', mark: '#c08457', markInk: '#7c4a1e', eye: '#3f2a1d' },
    sunny: { fur: '#fcd34d', ink: '#a16207', light: '#fefce8', inner: '#fecdd3', nose: '#422006', mark: '#f59e0b', markInk: '#a16207', eye: '#422006' },
    berry: { fur: '#fbcfe8', ink: '#be185d', light: '#fff1f2', inner: '#fda4af', nose: '#831843', mark: '#f472b6', markInk: '#9d174d', eye: '#500724' },
    mint: { fur: '#ccfbf1', ink: '#0f766e', light: '#f0fdfa', inner: '#fbcfe8', nose: '#134e4a', mark: '#5eead4', markInk: '#0f766e', eye: '#042f2e' },
  },
  anchors: anchors({ headTop: { y: 42, w: 66 } }),
  face: (p) => chibiFace(p, { mouth: [100, 111], mw: 7.6 }),
  ears: (c) => {
    const a = FLOP[c.posture.ears] ?? 0
    const ear = (
      <path d="M68 46 C48 42 32 62 36 94 C38 108 54 110 58 96 C62 82 66 66 74 54 Z" fill={c.p.mark} {...ol(c.p.markInk ?? c.p.ink)} />
    )
    return (
      <>
        <Limb x={66} y={50} angle={a}>{ear}</Limb>
        <g transform="translate(200 0) scale(-1 1)">
          <Limb x={66} y={50} angle={a}>{ear}</Limb>
        </g>
      </>
    )
  },
  headDecor: ({ p }) => (
    <g>
      <ellipse cx={122} cy={86} rx={17} ry={16} fill={p.mark} />
      <ellipse cx={100} cy={107} rx={23} ry={16} fill={p.light} />
      <ellipse cx={100} cy={48} rx={10} ry={4.5} fill={p.light} opacity={0.7} />
    </g>
  ),
  faceDecor: ({ p }) => (
    <g>
      <ellipse cx={100} cy={100} rx={8} ry={5.6} fill={p.nose} />
      <ellipse cx={97.5} cy={98.4} rx={2.6} ry={1.5} fill="#ffffff" opacity={0.75} />
      <path d="M100 105 L100 110" stroke={p.eye} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  behind: (c) => (
    <Tail c={c} x={128} y={166}>
      <path d="M124 166 C138 162 146 150 146 138 C152 142 154 156 146 166 C140 172 130 174 124 172 Z" fill={c.p.fur} {...ol(c.p.ink)} />
    </Tail>
  ),
}
