/* Datos visuals (gráficos y probabilidad de 3.º): a pictogram and a bar chart drawn with the same components as the
   exercises (src/activities/views/DataView.tsx), so the lesson and the exercise look alike, and a bag of coloured balls
   (chance-bag). Rows are written «Gatos:3,Perros:5»; a third field names the icon («Gatos:3:🐱»). Static pictures:
   reduced motion changes nothing. */
import { Bag, BarChart, Pictogram } from '@/activities/views/DataView'
import dataCss from '@/activities/views/DataViews.module.css'
import type { VisualProps } from './types'
import { numParam, strParam } from './types'
import s from './visuals.module.css'

/** The icon of a row that names none. */
const DEFAULT_ICON = '⭐'

interface Row { label: string; value: number; emoji: string }

/** «Gatos:3,Perros:5» → one row per part, with its number and icon. Parts without a name or a number are left out. */
export function parseRows(rows: string): Row[] {
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
export function parseBag(balls: string): { label: string; emoji: string; count: number }[] {
  return balls.split(',').flatMap((part) => {
    const [colour, count] = part.split(':').map((x) => x.trim())
    const n = Number(count)
    const known = COLOURS[colour]
    if (!known || !Number.isFinite(n) || n < 0) return []
    return [{ ...known, count: Math.floor(n) }]
  })
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

/** The balls in a bag, one icon each: a colour with 0 balls has none drawn. */
export function ChanceBagVisual({ params }: VisualProps) {
  const bag = parseBag(strParam(params, 'balls', ''))
  return (
    <div className={s.stage}>
      <Bag bag={bag} />
    </div>
  )
}
