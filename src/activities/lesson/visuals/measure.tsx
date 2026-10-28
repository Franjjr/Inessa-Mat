/* Medida visuals: a centimetre ruler with an object lying on it from 0 to `cm` (ruler), drawn with the ruler of the measure
   exercise (MeasureRuler), and the units of one kind with a real object of that size beside each (units). Static pictures:
   reduced motion changes nothing. */
import { MeasureRuler, RULER_CM_PX, RULER_PAD_PX } from '@/activities/views/MeasureRuler'
import type { VisualProps } from './types'
import { numParam, strParam } from './types'
import s from './visuals.module.css'

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.floor(v)))

/* A lesson ruler is short (1 to 9 cm) so its numbers, one per centimetre, never touch on a phone. The object lies from
   `from` (0 when missing) to `cm`; the ruler always starts at 0. */
export function RulerVisual({ params }: VisualProps) {
  const cm = clampInt(numParam(params, 'cm', 8), 1, 9)
  const start = clampInt(numParam(params, 'from', 0), 0, cm - 1)
  const emoji = strParam(params, 'object', '')
  const width = cm * RULER_CM_PX + RULER_PAD_PX * 2
  return (
    <div className={s.stage}>
      <div style={{ width: `min(100%, ${width}px)` }}>
        <MeasureRuler
          start={start}
          end={cm}
          from={0}
          to={cm}
          every={1}
          emoji={emoji || undefined}
          label={`Regla de ${cm} centímetros. El objeto empieza en ${start} y acaba en ${cm}`}
        />
      </div>
    </div>
  )
}

interface UnitRow { unit: string; object: string; emoji: string }

/** One real reference per unit: the size a child can picture. */
const UNITS: Record<string, UnitRow[]> = {
  length: [
    { unit: '1 cm', object: 'el ancho de una uña', emoji: '💅' },
    { unit: '1 m', object: 'una regla de un metro', emoji: '📏' },
    { unit: '1 km', object: 'un paseo de unos 12 minutos', emoji: '🚶' },
  ],
  mass: [
    { unit: '1 g', object: 'un clip', emoji: '📎' },
    { unit: '1 kg', object: 'un paquete de harina', emoji: '🌾' },
  ],
  capacity: [
    { unit: '1 ml', object: 'unas 20 gotas de agua', emoji: '💧' },
    { unit: '1 l', object: 'una botella de agua', emoji: '🧴' },
  ],
}

export function UnitsVisual({ params }: VisualProps) {
  const kind = strParam(params, 'kind', 'length')
  const rows = UNITS[kind] ?? UNITS.length
  return (
    <div className={s.stage}>
      <ul className={s.unitList} aria-label="Unidades">
        {rows.map((row) => (
          <li key={row.unit} className={s.unitRow}>
            <span className={s.unitEmoji} aria-hidden>{row.emoji}</span>
            <span className={s.unitChip}>{row.unit}</span>
            <span className={s.unitObject}>{row.object}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
