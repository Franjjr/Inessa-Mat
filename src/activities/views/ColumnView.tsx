/* Exercise view "column": column addition, column subtraction and 2-digit × 1-digit multiplication written in the
   Spanish column layout. The result is written UNITS FIRST (right to left, focus follows the order). Carries (suma,
   multiplication) and borrow marks (resta) sit above the columns: they help the child but are never graded. */
import { useMemo, useState, type ReactNode } from 'react'
import type { Answer, ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, ExerciseViewProps } from '@/types'
import { toDigits } from '@/engine'
import { CellGroup, DigitCell } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './ColumnView.module.css'

type ColEx = ColumnAddExercise | ColumnSubExercise | ColumnMulExercise

export interface ColumnViewProps extends ExerciseViewProps {
  /** Subtraction: after a correct answer show the magic proof (result + subtrahend = minuend). */
  proof?: boolean
}

const PLACE_NAMES = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil']
const placeOf = (i: number) => (['u', 'd', 'c', 'um'] as const)[i] ?? null

interface Layout {
  /** Operand values, top to bottom. */
  rows: number[]
  op: '+' | '−' | '×'
  /** Number of result columns (units = column 0). */
  cols: number
  /** Optional cells above the columns: carries (add, mul) or borrow marks (sub). Never graded. */
  auxKind: 'carry' | 'borrow'
}

function layoutOf(ex: ColEx): Layout {
  if (ex.kind === 'column-add') {
    const cols = Math.max(toDigits(ex.answer).length, ...ex.operands.map((n) => toDigits(n).length))
    return { rows: ex.operands, op: '+', cols, auxKind: 'carry' }
  }
  if (ex.kind === 'column-sub') {
    const cols = Math.max(toDigits(ex.minuend).length, toDigits(ex.answer).length)
    return { rows: [ex.minuend, ex.subtrahend], op: '−', cols, auxKind: 'borrow' }
  }
  return { rows: [ex.top, ex.bottom], op: '×', cols: toDigits(ex.answer).length, auxKind: 'carry' }
}

export default function ColumnView(props: ColumnViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, proof } = props
  if (exercise.kind !== 'column-add' && exercise.kind !== 'column-sub' && exercise.kind !== 'column-mul') return null
  return (
    <ColumnRound
      key={exercise.id}
      ex={exercise}
      onAnswered={onAnswered}
      guided={guided}
      allowHints={allowHints}
      showFeedback={showFeedback}
      compact={compact}
      proof={proof}
    />
  )
}

interface RoundProps {
  ex: ColEx
  onAnswered: ExerciseViewProps['onAnswered']
  guided?: boolean
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  proof?: boolean
}

function ColumnRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, proof }: RoundProps) {
  const host = useActivityHost()
  const layout = useMemo(() => layoutOf(ex), [ex])
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const { cols, rows, op, auxKind } = layout
  const [res, setRes] = useState<(number | null)[]>(() => Array.from({ length: cols }, () => null))
  const [aux, setAux] = useState<(number | null)[]>(() => Array.from({ length: cols }, () => null))

  // Focus order: units result, then the optional cell above the next column, then its result, and so on.
  const order = useMemo(() => {
    const list: string[] = ['r0']
    for (let i = 1; i < cols; i++) list.push(`x${i}`, `r${i}`)
    return list
  }, [cols])

  const wrong = new Set(flow.result && !flow.result.correct ? flow.result.wrongColumns ?? [] : [])
  const allRight = !!flow.result?.correct
  const nextEmpty = res.findIndex((v) => v === null)
  const statusOf = (i: number) => {
    if (allRight) return 'correct' as const
    if (wrong.has(i)) return 'wrong' as const
    if (guided && i === nextEmpty) return 'active' as const
    return 'idle' as const
  }

  const check = () => {
    if (!res.some((v) => v !== null)) return
    const answer: Answer = { type: 'digits', digits: res.slice(), ...(auxKind === 'carry' ? { carries: aux.slice() } : {}) }
    const c = flow.submit(answer)
    if (c.correct) celebrate('small')
  }

  // Build the grid: column 1 is the operator, digit column i sits at grid column (cols - i + 1).
  const colOf = (i: number) => cols - i + 1
  const cells: ReactNode[] = []
  let row = 1
  const hasAux = cols > 1
  if (hasAux) {
    for (let i = 1; i < cols; i++) {
      cells.push(
        <div key={`ax${i}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(i) }}>
          <DigitCell
            cellId={`x${i}`}
            variant="carry"
            size="sm"
            place={placeOf(i)}
            value={aux[i]}
            onChange={(d) => setAux((prev) => prev.map((v, k) => (k === i ? d : v)))}
            ariaLabel={auxKind === 'carry' ? `llevada de ${PLACE_NAMES[i]} (opcional)` : `marca de ${PLACE_NAMES[i]} (opcional)`}
            showClear
          />
        </div>,
      )
    }
    row += 1
  }
  if (guided) {
    for (let i = 0; i < cols; i++) {
      cells.push(
        <div key={`name${i}`} className={s.name} style={{ gridRow: row, gridColumn: colOf(i) }} aria-hidden>
          {host.t(PLACE_NAMES[i] ?? '')}
        </div>,
      )
    }
    row += 1
  }
  rows.forEach((value, j) => {
    const digits = toDigits(value)
    const isLast = j === rows.length - 1
    if (isLast) {
      cells.push(
        <div key={`op${j}`} className={s.op} style={{ gridRow: row, gridColumn: 1 }} aria-hidden>{op}</div>,
      )
    }
    for (let i = 0; i < cols; i++) {
      if (i >= digits.length) continue
      cells.push(
        <div key={`o${j}-${i}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(i) }}>
          <DigitCell variant="given" size="md" place={placeOf(i)} value={digits[i]} onChange={() => {}} ariaLabel={`${PLACE_NAMES[i]} de ${value}`} />
        </div>,
      )
    }
    row += 1
  })
  cells.push(
    <div key="line" className={s.line} style={{ gridRow: row, gridColumn: `1 / ${cols + 2}` }} aria-hidden />,
  )
  row += 1
  for (let i = 0; i < cols; i++) {
    cells.push(
      <div key={`r${i}`} className={s.cellSlot} style={{ gridRow: row, gridColumn: colOf(i) }}>
        <DigitCell
          cellId={`r${i}`}
          variant="result"
          size="md"
          place={placeOf(i)}
          value={res[i]}
          status={statusOf(i)}
          onChange={(d) => setRes((prev) => prev.map((v, k) => (k === i ? d : v)))}
          ariaLabel={`${PLACE_NAMES[i]} del resultado`}
          autoFocus={i === 0}
        />
      </div>,
    )
  }

  const prompt = ex.kind === 'column-add'
    ? 'Suma en columna. Escribe el resultado empezando por las unidades.'
    : ex.kind === 'column-sub'
      ? 'Resta en columna. Empieza por las unidades, la casa azul.'
      : 'Multiplicación en columna. Empieza por las unidades.'

  const magic = proof && ex.kind === 'column-sub' && allRight
    ? host.t(`La prueba mágica: ${ex.subtrahend} + ${ex.answer} = ${ex.minuend}`)
    : null

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="Operación en columna">
      <p className={s.prompt}>{host.t(prompt)}</p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <div className={s.grid} style={{ gridTemplateColumns: `minmax(1.1em, auto) repeat(${cols}, auto)` }}>
          {cells}
        </div>
      </CellGroup>
      {magic && <p className={s.magic}>{magic}</p>}
      <AnswerBar flow={flow} onCheck={check} canCheck={res.some((v) => v !== null)} />
    </section>
  )
}
