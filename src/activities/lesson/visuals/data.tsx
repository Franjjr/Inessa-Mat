/* Datos visuals (gráficos y probabilidad de 3.º): a pictogram and a bar chart drawn with the same components as the
   exercises (src/activities/views/DataView.tsx), so the lesson and the exercise look alike, and a bag of coloured balls
   (chance-bag). Rows are written «Gatos:3,Perros:5»; a third field names the icon («Gatos:3:🐱»). Static pictures:
   reduced motion changes nothing. */
import { Bag, BarChart, Pictogram, TwoWayTable } from '@/activities/views/DataView'
import type { ChartTable } from '@/types'
import dataCss from '@/activities/views/DataViews.module.css'
import type { VisualProps } from './types'
import { numParam, strParam } from './types'
import s from './visuals.module.css'

/** The icon of a row that names none. */
const DEFAULT_ICON = '⭐'

interface Row { label: string; value: number; emoji: string }

/** «Gatos:3,Perros:5» → one row per part, with its number and icon. Parts without a name or a number are left out. */
function parseRows(rows: string): Row[] {
  return rows.split(',').flatMap((part) => {
    const [label, value, emoji] = part.split(':').map((x) => x.trim())
    const n = Number(value)
    if (!label || value === undefined || !Number.isFinite(n) || n < 0) return []
    return [{ label, value: Math.floor(n), emoji: emoji || DEFAULT_ICON }]
  })
}

/** The colours a lesson bag can hold, by the name the params use. */
const COLOURS: Record<string, { label: string; emoji: string }> = {
  red: { label: 'roja', emoji: '🔴' },
  blue: { label: 'azul', emoji: '🔵' },
  green: { label: 'verde', emoji: '🟢' },
  yellow: { label: 'amarilla', emoji: '🟡' },
}

/** «red:3,blue:0» → the bag: each colour with how many balls of it (0 is a colour with none in the bag). */
function parseBag(balls: string): { label: string; emoji: string; count: number }[] {
  return balls.split(',').flatMap((part) => {
    const [colour, count] = part.split(':').map((x) => x.trim())
    const n = Number(count)
    const known = COLOURS[colour]
    if (!known || !Number.isFinite(n) || n < 0) return []
    return [{ ...known, count: Math.floor(n) }]
  })
}

/** «3.º A,3.º B» and «la manzana:🍎,la pera:🍐» name the groups and the options; «5-2/3-6» gives the counts, one row per
    group (rows split by /, cells by -). A missing count is 0, so a short grid still draws. */
export function parseTable(rows: string, cols: string, cells: string): ChartTable {
  const groups = rows.split(',').map((x) => x.trim()).filter(Boolean)
  const options = cols.split(',').flatMap((part) => {
    const [label, emoji] = part.split(':').map((x) => x.trim())
    return label ? [{ label, emoji: emoji || DEFAULT_ICON }] : []
  })
  const grid = cells.split('/').map((row) => row.split('-').map((x) => Number(x.trim())))
  return {
    rows: groups,
    cols: options,
    cells: groups.map((_, r) => options.map((__, c) => {
      const v = grid[r]?.[c]
      return v !== undefined && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
    })),
    at: [0, 0],
  }
}

/** «0:1» → the cell in row 0, column 1 (the cell the lesson reads), or none. */
function parseAt(at: string): [number, number] | undefined {
  const [r, c] = at.split(':').map((x) => Number(x))
  return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 ? [r, c] : undefined
}

/** A pictogram: each row is value / unit icons; unit (1 by default) is what one icon is worth. */
export function PictogramVisual({ params }: VisualProps) {
  const unit = Math.max(1, Math.floor(numParam(params, 'unit', 1)))
  const rows = parseRows(strParam(params, 'rows', ''))
  return (
    <div className={s.stage}>
      <div className={dataCss.card}>
        <Pictogram categories={rows} per={unit} />
      </div>
    </div>
  )
}

/** A bar chart with a numbered scale of 1 by 1 and the name of each row under its bar. */
export function BarChartVisual({ params }: VisualProps) {
  const rows = parseRows(strParam(params, 'rows', ''))
  return (
    <div className={s.stage}>
      <div className={dataCss.card}>
        <BarChart categories={rows} per={1} labels />
      </div>
    </div>
  )
}

/** A double-entry table, as the table exercises draw it; `at` marks the cell the explanation reads. */
export function TableVisual({ params }: VisualProps) {
  const table = parseTable(strParam(params, 'rows', ''), strParam(params, 'cols', ''), strParam(params, 'cells', ''))
  return (
    <div className={s.stage}>
      <div className={dataCss.card}>
        <TwoWayTable table={table} marked={parseAt(strParam(params, 'at', ''))} />
      </div>
    </div>
  )
}

/** The balls in a bag, one icon each: a colour with 0 balls has none drawn. (The generator never puts 0 in a bag.) */
export function ChanceBagVisual({ params }: VisualProps) {
  const bag = parseBag(strParam(params, 'balls', ''))
  return (
    <div className={s.stage}>
      <Bag bag={bag} />
    </div>
  )
}
