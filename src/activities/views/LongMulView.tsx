/* Exercise view "long-mul": multiplying in columns with partial rows (4.º, src/engine/longmul.ts). The top and the bottom
   are given. Each digit of the bottom gives one partial row, written right to left (units first) and shifted: its zeros
   are already written in grey. The total is the sum of the rows. Only the total is graded; the rows are the child's
   working, so an empty row is never wrong.
   Each row says what it is (P3PE-13): «38 × 4 =», «38 × 70 =» on the left of the partial rows and «suma» on the
   left of the total, and the names of the columns are on top. */
import { useMemo, useState, type ReactNode } from 'react'
import type { Answer, ExerciseViewProps, LongMulExercise } from '@/types'
import { hintsFor, toDigits } from '@/engine'
import { wrongColumnsOf } from '@/engine/diagnose'
import { CellGroup, DigitCell } from '@/ink'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, useRetryFlow, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './LongMulView.module.css'
import { ExerciseLayout } from './ExerciseLayout'

const PLACE_NAMES = ['unidades', 'decenas', 'centenas', 'millares', 'decenas de millar', 'centenas de millar']
const placeOf = (i: number) => (['u', 'd', 'c', 'um'] as const)[i] ?? null

/** The name of a partial row: the top times the digit of the bottom with its place («38 × 70 =»). */
export function partialLabel(top: number, digit: number, place: number): string {
  return `${top} × ${digit * 10 ** place} =`
}

export default function LongMulView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'long-mul') return null
  return <LongMulRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

interface RoundProps {
  ex: LongMulExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
  /** «Inténtalo otra vez»: the rows and the total the child wrote, and the columns of the total that were wrong. */
  retry?: RetryProps
}

function LongMulRound({ ex, onAnswered, showFeedback, allowHints, retry }: RoundProps) {
  const hints = useMemo(() => hintsFor(ex), [ex])
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints, hints })
  const [before] = useState(() => initialOf(retry, 'long-mul'))
  /** Columns of the result; every row is written in the same columns, shifted to the left by its place. */
  const cols = toDigits(ex.answer).length
  const topDigits = toDigits(ex.top)
  const bottomDigits = toDigits(ex.bottom)
  // A try again starts with what the child wrote: her rows and her total (only the total is graded and marked).
  const [rows, setRows] = useState<(number | null)[][]>(() =>
    ex.partials.map((_, j) => Array.from({ length: cols }, (_, k) => (k < j ? 0 : before?.rows[j]?.[k] ?? null))))
  const [total, setTotal] = useState<(number | null)[]>(() => Array.from({ length: cols }, (_, k) => before?.total[k] ?? null))
  const wrongBefore = useRetryWrong(retry, () => (before ? wrongColumnsOf(before.total, ex.answer, cols) : []))
  const status = flow.result?.correct ? 'correct' : 'idle'
  /** Before checking again, a column of the total the child had wrong stays soft red until she changes it. */
  const totalStatus = (k: number) =>
    !flow.result && wrongBefore.has(k) && before?.total[k] != null && total[k] === before.total[k] ? 'wrong' as const : status

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

  // Grid: column 1 is the name of the row, column 2 the operator; the digit of place k sits in grid column cols - k + 2
  // (units at the right).
  const colOf = (k: number) => cols - k + 2
  const cells: ReactNode[] = []
  let row = 1
  for (let k = 0; k < cols; k++) {
    cells.push(<div key={`name${k}`} className={s.name} style={{ gridRow: row, gridColumn: colOf(k) }} aria-hidden>{PLACE_NAMES[k]}</div>)
  }
  row += 1
  topDigits.forEach((d, k) => {
    cells.push(
      <div key={`top${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
        <DigitCell variant="given" size="md" place={placeOf(k)} value={d} onChange={() => {}} ariaLabel={`${PLACE_NAMES[k]} de ${ex.top}`} />
      </div>,
    )
  })
  row += 1
  cells.push(<div key="times" className={s.op} style={{ gridRow: row, gridColumn: 2 }} aria-hidden>×</div>)
  bottomDigits.forEach((d, k) => {
    cells.push(
      <div key={`bottom${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
        <DigitCell variant="given" size="md" place={placeOf(k)} value={d} onChange={() => {}} ariaLabel={`${PLACE_NAMES[k]} de ${ex.bottom}`} />
      </div>,
    )
  })
  row += 1
  cells.push(<div key="line1" className={s.line} style={{ gridRow: row, gridColumn: `2 / ${cols + 3}` }} aria-hidden />)
  row += 1
  ex.partials.forEach((_, j) => {
    cells.push(
      <div key={`label${j}`} className={s.rowLabel} style={{ gridRow: row, gridColumn: 1 }} data-row-label="">
        {partialLabel(ex.top, bottomDigits[j] ?? 0, j)}
      </div>,
    )
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
            // The places the partial product has are written in turn; the empty places past its last digit (the
            // hundreds of 92) are optional, so typing goes on to the next row instead of stopping in them.
            variant={k < String(ex.partials[j]).length ? 'result' : 'carry'}
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
  cells.push(<div key="line2" className={s.line} style={{ gridRow: row, gridColumn: `2 / ${cols + 3}` }} aria-hidden />)
  row += 1
  cells.push(<div key="labelSum" className={s.rowLabel} style={{ gridRow: row, gridColumn: 1 }} data-row-label="">suma</div>)
  for (let k = 0; k < cols; k++) {
    cells.push(
      <div key={`t${k}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(k) }}>
        <DigitCell
          cellId={`t${k}`}
          variant="result"
          size="md"
          place={placeOf(k)}
          value={total[k]}
          status={totalStatus(k)}
          onChange={(d) => setTotalAt(k, d)}
          ariaLabel={`${PLACE_NAMES[k]} del resultado`}
        />
      </div>,
    )
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Multiplicación en columna" data-kind="long-mul" data-status={status} prompt="Multiplica en columna, fila a fila." sub="Cada fila se escribe de derecha a izquierda. Al final, suma las filas." actions={<AnswerBar flow={flow} onCheck={check} canCheck={total.some((v) => v !== null)} />}>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle typingOrder="column">
        <div className={s.grid} style={{ gridTemplateColumns: `auto minmax(1.1em, auto) repeat(${cols}, auto)` }}>
          {cells}
        </div>
      </CellGroup>
    </ExerciseLayout>
  )
}
