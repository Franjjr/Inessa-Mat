/* Exercise view "long-mul": multiplying in columns with partial rows (4.º, src/engine/longmul.ts). The top and the bottom
   are given. Each digit of the bottom gives one partial row, written right to left (units first) and shifted: its zeros
   are already written in grey. The total is the sum of the rows. Only the total is graded; the rows are the child's
   working, so an empty row is never wrong. */
import { useMemo, useState, type ReactNode } from 'react'
import type { Answer, ExerciseViewProps, LongMulExercise } from '@/types'
import { hintsFor, toDigits } from '@/engine'
import { CellGroup, DigitCell } from '@/ink'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './LongMulView.module.css'

const PLACE_NAMES = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil', 'centenas de mil']
const placeOf = (i: number) => (['u', 'd', 'c', 'um'] as const)[i] ?? null

export default function LongMulView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'long-mul') return null
  return <LongMulRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

interface RoundProps {
  ex: LongMulExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}

function LongMulRound({ ex, onAnswered, showFeedback, allowHints }: RoundProps) {
  const hints = useMemo(() => hintsFor(ex), [ex])
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, hints })
  /** Columns of the result; every row is written in the same columns, shifted to the left by its place. */
  const cols = toDigits(ex.answer).length
  const topDigits = toDigits(ex.top)
  const bottomDigits = toDigits(ex.bottom)
  const [rows, setRows] = useState<(number | null)[][]>(() =>
    ex.partials.map((_, j) => Array.from({ length: cols }, (_, k) => (k < j ? 0 : null))))
  const [total, setTotal] = useState<(number | null)[]>(() => Array.from({ length: cols }, () => null))
  const status = flow.result?.correct ? 'correct' : 'idle'

  const setRow = (j: number, k: number, d: number | null) =>
    setRows((prev) => prev.map((r, jj) => (jj === j ? r.map((v, kk) => (kk === k ? d : v)) : r)))
  const setTotalAt = (k: number, d: number | null) => setTotal((prev) => prev.map((v, kk) => (kk === k ? d : v)))

  // Writing order: each partial row from its units to the left, row after row, then the total from the units.
  const order = useMemo(() => {
    const list: string[] = []
    ex.partials.forEach((_, j) => { for (let k = j; k < cols; k++) list.push(`p${j}-${k}`) })
    for (let k = 0; k < cols; k++) list.push(`t${k}`)
    return list
  }, [ex, cols])

  const check = () => {
    if (!total.some((v) => v !== null)) return
    const answer: Answer = { type: 'long-mul', rows: rows.map((r) => r.slice()), total: total.slice() }
    if (flow.submit(answer).correct) celebrate('small')
  }

  // Grid: column 1 is the operator; the digit of place k sits in grid column cols - k + 1 (units at the right).
  const colOf = (k: number) => cols - k + 1
  const cells: ReactNode[] = []
  let row = 1
  topDigits.forEach((d, k) => {
    cells.push(
      <div key={`top${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
        <DigitCell variant="given" size="md" place={placeOf(k)} value={d} onChange={() => {}} ariaLabel={`${PLACE_NAMES[k]} de ${ex.top}`} />
      </div>,
    )
  })
  row += 1
  cells.push(<div key="times" className={s.op} style={{ gridRow: row, gridColumn: 1 }} aria-hidden>×</div>)
  bottomDigits.forEach((d, k) => {
    cells.push(
      <div key={`bottom${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
        <DigitCell variant="given" size="md" place={placeOf(k)} value={d} onChange={() => {}} ariaLabel={`${PLACE_NAMES[k]} de ${ex.bottom}`} />
      </div>,
    )
  })
  row += 1
  cells.push(<div key="line1" className={s.line} style={{ gridRow: row, gridColumn: `1 / ${cols + 2}` }} aria-hidden />)
  row += 1
  ex.partials.forEach((_, j) => {
    for (let k = 0; k < cols; k++) {
      if (k < j) {
        cells.push(
          <div key={`shift${j}-${k}`} className={s.shift} style={{ gridRow: row, gridColumn: colOf(k) }}>
            <DigitCell variant="given" size="md" place={placeOf(k)} value={0} onChange={() => {}} ariaLabel="cero de desplazamiento" />
          </div>,
        )
        continue
      }
      cells.push(
        <div key={`p${j}-${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
          <DigitCell
            cellId={`p${j}-${k}`}
            variant="carry"
            size="md"
            place={placeOf(k)}
            value={rows[j][k]}
            onChange={(d) => setRow(j, k, d)}
            ariaLabel={`parcial ${j + 1}, ${PLACE_NAMES[k]}`}
            autoFocus={j === 0 && k === 0}
            showClear
          />
        </div>,
      )
    }
    row += 1
  })
  cells.push(<div key="line2" className={s.line} style={{ gridRow: row, gridColumn: `1 / ${cols + 2}` }} aria-hidden />)
  row += 1
  for (let k = 0; k < cols; k++) {
    cells.push(
      <div key={`t${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
        <DigitCell
          cellId={`t${k}`}
          variant="result"
          size="md"
          place={placeOf(k)}
          value={total[k]}
          status={status}
          onChange={(d) => setTotalAt(k, d)}
          ariaLabel={`${PLACE_NAMES[k]} del resultado`}
        />
      </div>,
    )
  }

  return (
    <section className={s.view} aria-label="Multiplicación en columna" data-kind="long-mul" data-status={status}>
      <p className={s.prompt}>Escribe cada fila de derecha a izquierda y, al final, la suma de las filas.</p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <div className={s.grid} style={{ gridTemplateColumns: `minmax(1.1em, auto) repeat(${cols}, auto)` }}>
          {cells}
        </div>
      </CellGroup>
      <AnswerBar flow={flow} onCheck={check} canCheck={total.some((v) => v !== null)} />
    </section>
  )
}
