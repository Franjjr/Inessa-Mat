/* Décimas y centésimas (4.º, decimal-op): a sum or a difference written in a column with the commas one under the other.
   P3PE-10: like the column calculation of the school, the result has ONE box per digit, right under each digit of the
   numbers, and the comma is printed in its own column (the child never writes it). Written right to left, from the
   last decimal. An empty centésimas box counts as 0; the boxes are empty (no «0» that looks written). One «Comprobar»
   for all the boxes, beside the statement. */
import { useMemo, useState, type ReactNode } from 'react'
import { CellGroup, DigitCell } from '@/ink'
import { celebrate } from '@/fx'
import { fmtDecimal, toDigits } from '@/engine'
import type { DecimalOpExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { digitsOf, initialOf, useRetryFlow, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import d from './DecimalViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function DecimalOpView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'decimal-op') return null
  return <OpRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

/** Index of a decimal box among the marks of a try again (the whole boxes are 0, 1, 2… units first). */
const DEC_MARK = 100

const WHOLE_NAMES = ['unidades', 'decenas', 'centenas']
const DEC_NAMES = ['décimas', 'centésimas']

/** The whole part written in its boxes (units first): null while no box is written. */
export function wholeFromDigits(digits: (number | null)[]): number | null {
  if (digits.every((v) => v === null)) return null
  return digits.reduce<number>((sum, v, k) => sum + (v ?? 0) * 10 ** k, 0)
}

function OpRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: DecimalOpExercise; retry?: RetryProps } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const add = ex.op === 'add'
  const places = ex.places
  const [lw, ld] = fmtDecimal(ex.left, places).split(',')
  const [rw, rd] = fmtDecimal(ex.right, places).split(',')
  const aw = fmtDecimal(ex.answer, places).split(',')[0]
  // As many whole columns as the longest whole part (the numbers' or the result's): a sum may carry into a new one.
  const wholeCols = Math.max(lw.length, rw.length, aw.length)
  // A try again starts with the boxes the child wrote; a wrong box is soft red until she changes it.
  const [before] = useState(() => {
    const v = initialOf(retry, 'numbers')?.values
    return v ? { whole: digitsOf(v[0], wholeCols), decs: Array.from({ length: places }, (_, i) => v[1 + i] ?? null) } : null
  })
  const wrongBefore = useRetryWrong(retry, () => {
    if (!before) return []
    const wantWhole = digitsOf(Math.floor(ex.answer / 100), wholeCols)
    const wantDecs = [Math.floor((ex.answer % 100) / 10), ex.answer % 10]
    return [
      ...wantWhole.flatMap((w, k) => ((before.whole[k] ?? 0) !== (w ?? 0) ? [k] : [])),
      // An empty centésimas box counts as 0, as the corrector reads it.
      ...before.decs.flatMap((d, i) => ((d ?? (i === 1 ? 0 : null)) !== wantDecs[i] ? [DEC_MARK + i] : [])),
    ]
  })
  const [whole, setWhole] = useState<(number | null)[]>(() => before?.whole ?? Array.from({ length: wholeCols }, () => null))
  const [decs, setDecs] = useState<(number | null)[]>(() => before?.decs ?? Array.from({ length: places }, () => null))
  const cellStatus = (mark: number, now: number | null, then: number | null | undefined) =>
    !flow.result && wrongBefore.has(mark) && now === (then ?? null) ? 'wrong' as const : status

  const wholeValue = wholeFromDigits(whole)
  const tenths = decs[0]
  const canCheck = wholeValue !== null && tenths !== null
  const submit = () => {
    if (!canCheck) return
    const c = flow.submit({ type: 'numbers', values: [wholeValue, tenths, places === 2 ? decs[1] : null] })
    if (c.correct) celebrate('small')
  }

  // Writing order: right to left, from the last decimal to the highest whole column.
  const order = useMemo(() => [
    ...Array.from({ length: places }, (_, i) => `d${places - 1 - i}`),
    ...Array.from({ length: wholeCols }, (_, k) => `w${k}`),
  ], [places, wholeCols])

  // Grid: column 1 the sign, then the whole columns (highest first), the comma, the decimal columns.
  const colOfWhole = (k: number) => 1 + wholeCols - k
  const commaCol = wholeCols + 2
  const colOfDec = (i: number) => commaCol + 1 + i
  const cells: ReactNode[] = []
  const numberRow = (text: [string, string], row: number, key: string) => {
    const wd = toDigits(Number(text[0]))
    for (let k = 0; k < wholeCols; k++) {
      cells.push(<span key={`${key}w${k}`} className={d.digit} style={{ gridRow: row, gridColumn: colOfWhole(k) }}>{k < text[0].length ? wd[k] : ''}</span>)
    }
    cells.push(<span key={`${key}c`} className={d.comma} style={{ gridRow: row, gridColumn: commaCol }} aria-hidden>,</span>)
    text[1].split('').forEach((ch, i) => {
      cells.push(<span key={`${key}d${i}`} className={d.digit} style={{ gridRow: row, gridColumn: colOfDec(i) }}>{ch}</span>)
    })
  }
  for (let k = 0; k < wholeCols; k++) {
    cells.push(<span key={`nw${k}`} className={d.colName} style={{ gridRow: 1, gridColumn: colOfWhole(k) }} aria-hidden>{WHOLE_NAMES[k]}</span>)
  }
  for (let i = 0; i < places; i++) {
    cells.push(<span key={`nd${i}`} className={d.colName} style={{ gridRow: 1, gridColumn: colOfDec(i) }} aria-hidden>{DEC_NAMES[i]}</span>)
  }
  numberRow([lw, ld], 2, 'l')
  cells.push(<span key="op" className={d.op} style={{ gridRow: 3, gridColumn: 1 }} aria-hidden>{add ? '+' : '−'}</span>)
  numberRow([rw, rd], 3, 'r')
  cells.push(<span key="rule" className={d.rule} style={{ gridRow: 4 }} aria-hidden />)
  for (let k = 0; k < wholeCols; k++) {
    cells.push(
      <div key={`w${k}`} style={{ gridRow: 5, gridColumn: colOfWhole(k) }}>
        <DigitCell
          cellId={`w${k}`}
          variant="result"
          size="md"
          value={whole[k]}
          status={cellStatus(k, whole[k], before?.whole[k])}
          onChange={(v) => setWhole((prev) => prev.map((x, j) => (j === k ? v : x)))}
          ariaLabel={`${WHOLE_NAMES[k]} del resultado`}
        />
      </div>,
    )
  }
  cells.push(<span key="rc" className={d.comma} style={{ gridRow: 5, gridColumn: commaCol }} aria-hidden>,</span>)
  for (let i = 0; i < places; i++) {
    cells.push(
      <div key={`d${i}`} style={{ gridRow: 5, gridColumn: colOfDec(i) }}>
        <DigitCell
          cellId={`d${i}`}
          variant="result"
          size="md"
          value={decs[i]}
          status={cellStatus(DEC_MARK + i, decs[i], before?.decs[i])}
          onChange={(v) => setDecs((prev) => prev.map((x, j) => (j === i ? v : x)))}
          ariaLabel={`${DEC_NAMES[i]} del resultado`}
          autoFocus={i === places - 1}
        />
      </div>,
    )
  }

  return (
    <ExerciseLayout
      workClassName={s.view}
      aria-label={add ? 'Sumar decimales' : 'Restar decimales'}
      data-kind={ex.kind}
      data-status={status}
      prompt={add ? 'Suma en columna, con las comas una debajo de otra.' : 'Resta en columna, con las comas una debajo de otra.'}
      sub="Empieza por la derecha. Escribe una cifra en cada casilla: la coma ya está puesta."
      actions={<AnswerBar flow={flow} onCheck={submit} canCheck={canCheck} />}
    >
      <CellGroup order={order} onSubmit={submit} keypadPosition="below" keypadToggle>
        <div className={d.opGrid} style={{ gridTemplateColumns: `1.2em repeat(${wholeCols}, auto) auto repeat(${places}, auto)` }}>
          {cells}
        </div>
      </CellGroup>
    </ExerciseLayout>
  )
}
