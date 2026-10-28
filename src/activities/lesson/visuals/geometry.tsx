/* Geometry visuals (geometría): a regular polygon with its sides or corners numbered (polygon), a line of the lesson (lines:
   recta, curva, poligonal, paralelas, perpendiculares, segmento, semirrecta), an angle with its arc and, at 90°, the square
   mark (angle), a solid (solid), a polygon with the length on each side and the sum below (perimeter), and a 5 × 5 grid
   with a walk from a start star (grid-route). Lines and solids are drawn by FigureSvg, the figure of the geometry exercises.
   Static pictures: reduced motion changes nothing. */
import { FigureSvg } from '@/activities/views/FigureSvg'
import type { Figure, SolidName } from '@/types'
import type { VisualProps } from './types'
import { numParam, strParam } from './types'
import s from './visuals.module.css'

const VB = 200
const C = 100
const RADIUS = 66
const LABEL_GAP = 16

const r1 = (n: number) => Math.round(n * 10) / 10
type Pt = [number, number]

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.floor(v)))

/** The corners of a regular polygon with n sides. Even polygons have a flat side on the bottom, the others a corner. */
export function regularPolygon(n: number): Pt[] {
  const start = -90 + (n % 2 === 0 ? 180 / n : 0)
  return Array.from({ length: n }, (_, i) => {
    const t = ((start + (360 / n) * i) * Math.PI) / 180
    return [C + RADIUS * Math.cos(t), C + RADIUS * Math.sin(t)] as Pt
  })
}

/** A point pushed away from the centre of the figure by LABEL_GAP: where a number outside the figure goes. */
function outside(p: Pt): Pt {
  const dx = p[0] - C
  const dy = p[1] - C
  const len = Math.hypot(dx, dy) || 1
  return [p[0] + (dx / len) * LABEL_GAP, p[1] + (dy / len) * LABEL_GAP]
}

/* A polygon of n sides numbered 1 to n: on the sides (mark sides) or at the corners (mark corners). */
export function PolygonVisual({ params }: VisualProps) {
  const n = clampInt(numParam(params, 'sides', 3), 3, 8)
  const mark = strParam(params, 'mark', '')
  const pts = regularPolygon(n)
  const labels: { text: string; at: Pt }[] = []
  if (mark === 'sides') {
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % n]
      labels.push({ text: String(i + 1), at: outside([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]) })
    })
  } else if (mark === 'corners') {
    pts.forEach((p, i) => labels.push({ text: String(i + 1), at: outside(p) }))
  }
  return (
    <div className={s.stage}>
      <svg viewBox={`0 0 ${VB} ${VB}`} className={s.geoFigure} role="img" aria-label={`Figura de ${n} lados`}>
        <polygon points={pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ')} className={s.geoShape} />
        {labels.map((l) => (
          <text key={l.text} x={r1(l.at[0])} y={r1(l.at[1])} textAnchor="middle" dominantBaseline="central" className={s.geoLabel}>{l.text}</text>
        ))}
      </svg>
    </div>
  )
}

/* The two rays of an angle from the vertex (100, 150), the first one flat; its arc, and the square of a right angle. */
const VERTEX: Pt = [100, 150]
const RAY = 88
const ARC = 30
const SQUARE = 16

export function AngleVisual({ params }: VisualProps) {
  const deg = clampInt(numParam(params, 'deg', 90), 1, 179)
  const rad = (deg * Math.PI) / 180
  const [vx, vy] = VERTEX
  const end1: Pt = [vx + RAY, vy]
  const end2: Pt = [vx + RAY * Math.cos(rad), vy - RAY * Math.sin(rad)]
  const arc0: Pt = [vx + ARC, vy]
  const arc1: Pt = [vx + ARC * Math.cos(rad), vy - ARC * Math.sin(rad)]
  const right = deg === 90
  return (
    <div className={s.stage}>
      <svg viewBox={`0 0 ${VB} ${VB}`} className={s.geoFigure} role="img" aria-label="Ángulo">
        <g className={s.geoLine}>
          <line x1={vx} y1={vy} x2={end1[0]} y2={end1[1]} />
          <line x1={vx} y1={vy} x2={r1(end2[0])} y2={r1(end2[1])} />
        </g>
        {right ? (
          <path
            data-mark="right"
            d={`M ${vx + SQUARE} ${vy} L ${vx + SQUARE} ${vy - SQUARE} L ${vx} ${vy - SQUARE}`}
            className={s.geoMark}
          />
        ) : (
          <path d={`M ${arc0[0]} ${arc0[1]} A ${ARC} ${ARC} 0 0 0 ${r1(arc1[0])} ${r1(arc1[1])}`} className={s.geoMark} />
        )}
      </svg>
    </div>
  )
}

const LINE_POINTS: Record<string, Figure> = {
  recta: { type: 'line', kind: 'straight', points: [[10, 50], [90, 50]] },
  semirrecta: { type: 'line', kind: 'ray', points: [[10, 50], [90, 50]] },
  segmento: { type: 'line', kind: 'segment', points: [[10, 50], [90, 50]] },
  curva: { type: 'line', kind: 'curve', points: [[10, 80], [50, 10], [90, 80]] },
  poligonal: { type: 'line', kind: 'broken', points: [[10, 70], [30, 20], [60, 80], [90, 20]] },
  paralelas: { type: 'lines', segments: [[[10, 30], [90, 30]], [[10, 70], [90, 70]]] },
  perpendiculares: { type: 'lines', segments: [[[10, 50], [90, 50]], [[50, 10], [50, 90]]] },
}

export function LinesVisual({ params }: VisualProps) {
  const kind = strParam(params, 'kind', 'recta')
  const figure = LINE_POINTS[kind] ?? LINE_POINTS.recta
  return (
    <div className={s.stage}>
      <FigureSvg figure={figure} label={kind} className={s.geoFigure} />
    </div>
  )
}

const SOLIDS: SolidName[] = ['cubo', 'prisma', 'piramide', 'cilindro', 'cono', 'esfera']

export function SolidVisual({ params }: VisualProps) {
  const name = strParam(params, 'name', 'cubo') as SolidName
  const solid = SOLIDS.includes(name) ? name : 'cubo'
  return (
    <div className={s.stage}>
      <FigureSvg figure={{ type: 'solid', name: solid }} label={`Cuerpo: ${solid}`} className={s.geoFigure} />
    </div>
  )
}

/** The figure of a list of side lengths: a rectangle when the opposite sides are equal, a triangle with those three sides
    when it can be drawn, and otherwise a regular polygon with the same number of sides. The labels always say the lengths;
    the drawing is to scale only for the rectangle and the triangle. */
function perimeterShape(sides: number[]): Pt[] {
  const n = sides.length
  if (n === 4 && sides[0] === sides[2] && sides[1] === sides[3]) {
    const [a, b] = sides
    return [[0, 0], [a, 0], [a, b], [0, b]]
  }
  if (n === 3) {
    const [ab, bc, ca] = sides
    const x = (ca * ca + ab * ab - bc * bc) / (2 * ab)
    const y2 = ca * ca - x * x
    if (y2 > 0) return [[0, 0], [ab, 0], [x, Math.sqrt(y2)]]
  }
  return regularPolygon(n).map(([x, y]) => [x - C, y - C] as Pt)
}

export function PerimeterVisual({ params }: VisualProps) {
  const sides = strParam(params, 'sides', '3,4,3,4').split(',').map(Number).filter((v) => Number.isFinite(v) && v > 0)
  const list = sides.length >= 3 && sides.length <= 8 ? sides : [3, 4, 3, 4]
  const total = list.reduce((sum, v) => sum + v, 0)
  const figure: Figure = { type: 'polygon', points: perimeterShape(list), labels: list.map((v) => `${v} cm`) }
  return (
    <div className={s.stage}>
      <FigureSvg figure={figure} label={`Figura de lados ${list.join(', ')} centímetros`} className={s.geoFigure} />
      <p className={s.geoSum}>{list.join(' + ')} = {total} cm</p>
    </div>
  )
}

/* The grid of the walk, as the recorridos exercise draws it: 4 rows by 5 columns, the start cell in gold, one line per step,
   and the steps under the grid as arrow chips (a chip per move, the arrows repeated: →→ is two squares to the right). */
const ROWS = 4
const COLS = 5
const CELL = 34
const W = 200
const H = 160
const ORIGIN_X = (W - COLS * CELL) / 2
const ORIGIN_Y = (H - ROWS * CELL) / 2
const STEP: Record<string, [number, number]> = { R: [0, 1], L: [0, -1], U: [-1, 0], D: [1, 0] }
const ARROW: Record<string, string> = { R: '→', L: '←', U: '↑', D: '↓' }

export function GridRouteVisual({ params }: VisualProps) {
  const letters = strParam(params, 'route', 'R,R,U').split(',').map((x) => x.trim().toUpperCase()).filter((x) => x in STEP)
  const walk: Pt[] = [[0, 0]]
  for (const letter of letters) {
    const [dr, dc] = STEP[letter]
    const [r, c] = walk[walk.length - 1]
    walk.push([r + dr, c + dc])
  }
  // The walk sits in the middle of the grid, whatever its direction.
  const rows = walk.map((p) => p[0])
  const cols = walk.map((p) => p[1])
  const r0 = Math.floor((ROWS - (Math.max(...rows) - Math.min(...rows) + 1)) / 2) - Math.min(...rows)
  const c0 = Math.floor((COLS - (Math.max(...cols) - Math.min(...cols) + 1)) / 2) - Math.min(...cols)
  const cellOf = ([r, c]: Pt): Pt => [r + r0, c + c0]
  const centre = ([r, c]: Pt): Pt => [ORIGIN_X + (c + 0.5) * CELL, ORIGIN_Y + (r + 0.5) * CELL]
  const cells = walk.map(cellOf)
  const start = cells[0]
  const centres = cells.map(centre)
  // Runs of the same letter: one chip per move, as the exercise lists them.
  const moves: { letter: string; n: number }[] = []
  for (const letter of letters) {
    const last = moves[moves.length - 1]
    if (last && last.letter === letter) last.n += 1
    else moves.push({ letter, n: 1 })
  }
  return (
    <div className={s.stage}>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.geoFigure} role="img" aria-label="Recorrido en una cuadrícula de 4 filas por 5 columnas">
        {Array.from({ length: ROWS * COLS }, (_, k) => {
          const cell: Pt = [Math.floor(k / COLS), k % COLS]
          const isStart = cell[0] === start[0] && cell[1] === start[1]
          return (
            <rect
              key={k}
              x={ORIGIN_X + cell[1] * CELL}
              y={ORIGIN_Y + cell[0] * CELL}
              width={CELL}
              height={CELL}
              className={isStart ? s.geoStartCell : s.geoCell}
              data-start={isStart ? 'yes' : undefined}
            />
          )
        })}
        {centres.slice(1).map((p, k) => (
          <line key={k} data-step={k} x1={r1(centres[k][0])} y1={r1(centres[k][1])} x2={r1(p[0])} y2={r1(p[1])} className={s.geoPath} />
        ))}
      </svg>
      {moves.length > 0 && (
        <ul className={s.geoMoves} aria-label="Pasos">
          {moves.map((m, k) => (
            <li key={k} className={s.geoMove}>{ARROW[m.letter].repeat(m.n)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
