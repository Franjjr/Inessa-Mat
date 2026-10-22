/* 10×10 times-table heatmap. Each cell has a fill colour, a glyph and an accessible label, so the state
   survives greyscale printing and colour-blindness. Read-only. With `triangle`, only the 55 distinct facts
   (a ≤ b) are drawn: the mirrored half is left blank so the cells add up to the total. */
import clsx from 'clsx'
import { FACT_STATE_GLYPH, FACT_STATE_LABEL, factState } from './heatmap'
import s from './FactHeatmap.module.css'

export function FactHeatmap({ grid, compact, label, triangle }: { grid: number[][]; compact?: boolean; label: string; triangle?: boolean }) {
  const nums = Array.from({ length: 10 }, (_, i) => i + 1)
  return (
    <div className={clsx(s.wrap, compact && s.compact)} role="table" aria-label={label}>
      <div role="row" className={s.row}>
        <div role="columnheader" className={s.corner} aria-label="Multiplicando por">×</div>
        {nums.map((b) => (
          <div role="columnheader" key={b} className={s.head} aria-hidden={compact || undefined}>{b}</div>
        ))}
      </div>
      {nums.map((a) => (
        <div role="row" key={a} className={s.row}>
          <div role="rowheader" className={s.head} aria-hidden={compact || undefined}>{a}</div>
          {nums.map((b) => {
            if (triangle && b < a) {
              return <div key={b} role="none" aria-hidden className={s.blank} />
            }
            const box = grid[a - 1]?.[b - 1] ?? -1
            const state = factState(box)
            const cellLabel = `${a} × ${b} = ${a * b}: ${FACT_STATE_LABEL[state]}`
            return (
              <div
                key={b}
                role="cell"
                aria-label={cellLabel}
                title={cellLabel}
                data-state={state}
                className={clsx(s.cell, s[state])}
              >
                {!compact && <span className={s.product}>{a * b}</span>}
                <span className={s.glyph} aria-hidden>{FACT_STATE_GLYPH[state]}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** Legend that explains each state with the same label and glyph used in the cells. */
export function FactLegend() {
  const order = ['mastered', 'learning', 'struggling', 'unseen'] as const
  return (
    <ul className={s.legend} aria-label="Leyenda">
      {order.map((st) => (
        <li key={st} className={s.legendItem}>
          <span className={clsx(s.swatch, s[st])} aria-hidden>{FACT_STATE_GLYPH[st]}</span>
          {FACT_STATE_LABEL[st]}
        </li>
      ))}
    </ul>
  )
}
