/* Osito panda / osita panda: round dark ears, eye patches with shiny eyes, dark arms and feet. */
import { ol } from '../../characters/shared/frame'
import type { SpeciesDef } from '../types'
import { EarPair, Tail, anchors, chibiFace } from './common'

export const panda: SpeciesDef = {
  label: 'Osito panda',
  palettes: {
    default: { fur: '#ffffff', ink: '#3f3f46', light: '#f4f4f5', inner: '#52525b', nose: '#18181b', mark: '#3f3f46', eye: '#18181b' },
    sunny: { fur: '#fffbeb', ink: '#92400e', light: '#fef3c7', inner: '#b45309', nose: '#451a03', mark: '#a16207', eye: '#451a03' },
    berry: { fur: '#fdf2f8', ink: '#86198f', light: '#fce7f3', inner: '#c026d3', nose: '#4a044e', mark: '#a21caf', eye: '#4a044e' },
    mint: { fur: '#f0fdfa', ink: '#115e59', light: '#ccfbf1', inner: '#14b8a6', nose: '#042f2e', mark: '#0f766e', eye: '#042f2e' },
  },
  anchors: anchors({ headTop: { y: 43, w: 60 }, eyes: { span: 44 } }),
  face: (p) =>
    chibiFace(p, {
      ew: 7.2,
      eh: 8.4,
      sclera: '#ffffff',
      pupil: p.eye,
      lidInk: '#ffffff',
      ink: p.ink,
      mouth: [100, 111],
      browLift: 22,
    }),
  ears: (c) => (
    <EarPair c={c} pivot={[64, 54]}>
      <circle cx={58} cy={46} r={16} fill={c.p.mark} {...ol(c.p.ink)} />
      <circle cx={58} cy={47} r={7} fill={c.p.inner} />
    </EarPair>
  ),
  headDecor: ({ p }) => (
    <g fill={p.mark}>
      <ellipse cx={78} cy={92} rx={15} ry={17.5} transform="rotate(32 78 92)" />
      <ellipse cx={122} cy={92} rx={15} ry={17.5} transform="rotate(-32 122 92)" />
      <ellipse cx={84} cy={48} rx={10} ry={4.5} fill="#ffffff" opacity={0.8} transform="rotate(-16 84 48)" />
    </g>
  ),
  faceDecor: ({ p }) => (
    <g>
      <path d="M93 101 Q100 97 107 101 Q105 107 100 108 Q95 107 93 101 Z" fill={p.nose} />
      <ellipse cx={97.5} cy={101} rx={2} ry={1.1} fill="#ffffff" opacity={0.6} />
    </g>
  ),
  arm: { x: 69, y: 137, fill: (p) => p.mark },
  behind: (c) => (
    <Tail c={c} x={130} y={170}>
      <circle cx={132} cy={170} r={8} fill={c.p.mark} {...ol(c.p.ink)} />
    </Tail>
  ),
  bodyDecor: ({ p }) => (
    <g>
      <path d="M66 136 Q100 128 134 136 L132 146 Q100 138 68 146 Z" fill={p.mark} />
      <ellipse cx={100} cy={161} rx={21} ry={17} fill={p.light} />
    </g>
  ),
  feet: ({ p }) => (
    <g>
      <g fill={p.mark} {...ol(p.ink)}>
        <ellipse cx={82} cy={184} rx={13} ry={8.5} />
        <ellipse cx={118} cy={184} rx={13} ry={8.5} />
      </g>
      <g fill={p.inner}>
        <ellipse cx={82} cy={185} rx={5} ry={3.2} />
        <ellipse cx={118} cy={185} rx={5} ry={3.2} />
      </g>
    </g>
  ),
}
