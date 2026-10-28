/* Fraction visuals: one figure cut into equal parts, some of them shaded, with the fraction written under it
   (fraction-shape); and a number of objects dealt into equal groups, some groups taken (fraction-groups, a fraction of
   a quantity). Static pictures: the colour change is a CSS transition, and reduced motion skips it. */
import type { VisualProps } from './types'
import { numParam, strParam } from './types'
import s from './visuals.module.css'

const SHADED = 'var(--c-magic)'
const PLAIN = 'var(--c-surface)'
const INK = 'var(--c-ink)'

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.floor(v)))

/* The drawing is 340 units wide and shows at about 0.95 of its size on a 360 px phone: the 28-unit fraction reads at
   about 26 px. */
const VIEW_W = 340
const VIEW_H = 256
const CX = VIEW_W / 2
const CY = 100
const RADIUS = 88
const BAR_X = 30
const BAR_W = 280
const BAR_Y = 56
const BAR_H = 120

/** The slice of a circle from angle a0 to a1 (radians, from the top), as a closed path through the centre. */
function slicePath(i: number, parts: number): string {
  const a0 = -Math.PI / 2 + (2 * Math.PI * i) / parts
  const a1 = a0 + (2 * Math.PI) / parts
  const x0 = CX + RADIUS * Math.cos(a0)
  const y0 = CY + RADIUS * Math.sin(a0)
  const x1 = CX + RADIUS * Math.cos(a1)
  const y1 = CY + RADIUS * Math.sin(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${CX} ${CY} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x1} ${y1} Z`
}

/** One figure (a circle or a bar) cut into equal parts; the first `shaded` parts are coloured, and the fraction is
    written under it: shaded over parts. */
export function FractionShapeVisual({ params, reduced }: VisualProps) {
  const parts = clampInt(numParam(params, 'parts', 4), 1, 12)
  const shaded = clampInt(numParam(params, 'shaded', 1), 0, parts)
  const isBar = strParam(params, 'shape', 'circle') === 'bar'
  const transition = reduced ? 'none' : 'fill 0.4s ease'
  const label = `${shaded} de ${parts} partes iguales`

  return (
    <div className={s.stage}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ maxWidth: 420 }} role="img" aria-label={label} data-testid="fraction-shape">
        {Array.from({ length: parts }, (_, i) => {
          const on = i < shaded
          const style = { fill: on ? SHADED : PLAIN, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, transition }
          const dataProps = { 'data-part': i, 'data-shaded': on ? 'true' : 'false' }
          if (isBar) {
            const w = BAR_W / parts
            return <rect key={i} x={BAR_X + i * w} y={BAR_Y} width={w} height={BAR_H} style={style} {...dataProps} />
          }
          if (parts === 1) return <circle key={i} cx={CX} cy={CY} r={RADIUS} style={style} {...dataProps} />
          return <path key={i} d={slicePath(i, parts)} style={style} {...dataProps} />
        })}
        <text x={CX} y={212} textAnchor="middle" fontSize={28} fontWeight={700} fill={INK}>{shaded}</text>
        <line x1={CX - 24} y1={222} x2={CX + 24} y2={222} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <text x={CX} y={252} textAnchor="middle" fontSize={28} fontWeight={700} fill={INK}>{parts}</text>
      </svg>
    </div>
  )
}

/* Groups: the dots are dealt one by one into the groups (dot k goes to group k mod parts), so the groups differ by one
   dot at most when the total does not split evenly. A group is a box with its number above and its dots in a grid. */
const GAP = 10
const PAD = 10
const LABEL_H = 30
const MAX_CELL = 26

/** `total` dots dealt into `parts` equal groups; the first `take` groups are highlighted (¼ de 20: 4 groups, 1 taken). */
export function FractionGroupsVisual({ params, reduced }: VisualProps) {
  const total = clampInt(numParam(params, 'total', 12), 0, 60)
  const parts = clampInt(numParam(params, 'parts', 4), 1, 6)
  const take = clampInt(numParam(params, 'take', 0), 0, parts)
  const groupsOf: number[][] = Array.from({ length: parts }, () => [])
  for (let k = 0; k < total; k++) groupsOf[k % parts].push(k)

  const perGroup = Math.max(1, Math.ceil(total / parts))
  const cols = Math.ceil(Math.sqrt(perGroup))
  const rows = Math.ceil(perGroup / cols)
  const boxW = (VIEW_W - GAP * (parts - 1)) / parts
  const cell = Math.min(MAX_CELL, (boxW - 2 * PAD) / cols)
  const gridW = cols * cell
  const boxH = LABEL_H + rows * cell + PAD
  const transition = reduced ? 'none' : 'fill 0.4s ease, stroke 0.4s ease'
  const viewH = boxH + 2

  return (
    <div className={s.stage}>
      <svg viewBox={`0 0 ${VIEW_W} ${viewH}`} width="100%" style={{ maxWidth: 420 }} role="img" aria-label={`${total} objetos en ${parts} grupos iguales, ${take} de color`} data-testid="fraction-groups">
        {groupsOf.map((dots, g) => {
          const taken = g < take
          const x = g * (boxW + GAP)
          const offsetX = (boxW - gridW) / 2
          return (
            <g key={g} data-group={g} data-taken={taken ? 'true' : 'false'}>
              <rect
                x={x}
                y={0}
                width={boxW}
                height={boxH}
                rx={10}
                style={{ fill: taken ? 'var(--c-magic-soft)' : PLAIN, stroke: taken ? SHADED : 'var(--c-line)', strokeWidth: 3, transition }}
              />
              <text x={x + boxW / 2} y={LABEL_H - 8} textAnchor="middle" fontSize={17} fontWeight={700} fill={taken ? SHADED : 'var(--c-ink-soft)'}>{g + 1}</text>
              {dots.map((k, j) => {
                const col = j % cols
                const row = Math.floor(j / cols)
                return (
                  <circle
                    key={k}
                    data-dot={k}
                    cx={x + offsetX + (col + 0.5) * cell}
                    cy={LABEL_H + (row + 0.5) * cell}
                    r={cell * 0.36}
                    style={{ fill: taken ? SHADED : 'var(--c-ink-soft)', transition }}
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
