/* Exercise view "column": column addition, column subtraction and 2-digit × 1-digit multiplication written in the
   Spanish column layout. The result is written UNITS FIRST (right to left, focus follows the order).
   Addition and multiplication carries are never graded. Subtraction steps are graded where the child writes them:
   - 'borrow' (pedir prestado arriba): the lender's new top digit goes small above it; the +10 appears above the
     column that received the ten once that step is right.
   - 'carry' (me llevo una abajo): the +1 for the next column goes small under its subtrahend digit.
   An empty step is never wrong; a written step must match what the method needs. */
import { useMemo, useState, type ReactNode } from 'react'
import type { Answer, ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, ExerciseViewProps, SubMethod } from '@/types'
import { analyzeSub, borrowMarks, compensationSteps, hintsFor, toDigits } from '@/engine'
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
  /** Optional cells beside the columns: carries (add, mul) or written steps (sub). Never graded for add and mul. */
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
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, proof, method } = props
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
      method={method}
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
  method?: SubMethod
}

function ColumnRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, proof, method }: RoundProps) {
  const host = useActivityHost()
  const layout = useMemo(() => layoutOf(ex), [ex])
  const subMethod: 'borrow' | 'carry' = ex.kind === 'column-sub' && method === 'carry' ? 'carry' : 'borrow'
  const hints = useMemo(() => hintsFor(ex, ex.kind === 'column-sub' ? subMethod : undefined), [ex, subMethod])
  const flow = useAnswerFlow(ex, {
    onAnswered,
    showFeedback,
    allowHints,
    hints,
    method: ex.kind === 'column-sub' ? subMethod : undefined,
  })
  const { cols, rows, op, auxKind } = layout
  const [res, setRes] = useState<(number | null)[]>(() => Array.from({ length: cols }, () => null))
  const [aux, setAux] = useState<(number | null)[]>(() => Array.from({ length: cols }, () => null))

  /** Subtraction: the steps the method expects (written marks) and the columns that receive a ten. */
  const steps = useMemo(() => {
    if (ex.kind !== 'column-sub') return null
    if (subMethod === 'carry') return { marks: compensationSteps(ex.minuend, ex.subtrahend).marks, receivers: null as boolean[] | null }
    return { marks: borrowMarks(ex.minuend, ex.subtrahend), receivers: analyzeSub(ex.minuend, ex.subtrahend).borrowed }
  }, [ex, subMethod])

  /** «Pedir prestado»: the +10 shows above a column once the step that lends it to that column is written right. */
  const giftOn = (i: number) => {
    if (!steps || subMethod !== 'borrow' || !steps.receivers?.[i]) return false
    const lender = i + 1
    const want = steps.marks[lender]
    return want !== null && aux[lender] === want
  }

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
    const answer: Answer = {
      type: 'digits',
      digits: res.slice(),
      carries: aux.slice(),
      ...(ex.kind === 'column-sub' ? { method: subMethod } : {}),
    }
    const c = flow.submit(answer)
    if (c.correct) celebrate('small')
  }

  // Build the grid: column 1 is the operator, digit column i sits at grid column (cols - i + 1).
  const colOf = (i: number) => cols - i + 1
  const cells: ReactNode[] = []
  let row = 1
  const hasAux = cols > 1
  const auxCells = (at: number): ReactNode[] => {
    const out: ReactNode[] = []
    const first = subMethod === 'borrow' && ex.kind === 'column-sub' ? 0 : 1
    for (let i = first; i < cols; i++) {
      const isMark = i >= 1
      const label = ex.kind === 'column-sub' && subMethod === 'carry'
        ? `compensación de ${PLACE_NAMES[i]} (opcional)`
        : `marca de ${PLACE_NAMES[i]} (opcional)`
      out.push(
        <div key={`ax${i}-${at}`} className={`${s.cellSlot} ${s.auxSlot}`} style={{ gridRow: at, gridColumn: colOf(i) }}>
          {giftOn(i) && <span className={s.gift} aria-hidden>+10</span>}
          {isMark && (
            <DigitCell
              cellId={`x${i}`}
              variant="carry"
              size="sm"
              place={placeOf(i)}
              value={aux[i]}
              onChange={(d) => setAux((prev) => prev.map((v, k) => (k === i ? d : v)))}
              ariaLabel={ex.kind === 'column-add' || ex.kind === 'column-mul' ? `llevada de ${PLACE_NAMES[i]} (opcional)` : label}
              showClear
            />
          )}
        </div>,
      )
    }
    return out
  }
  // Borrow marks sit above the minuend; the carry (compensation) marks sit under the subtrahend, before the line.
  const auxAbove = hasAux && (auxKind === 'carry' || subMethod === 'borrow')
  const auxBelow = hasAux && ex.kind === 'column-sub' && subMethod === 'carry'
  if (auxAbove) {
    cells.push(...auxCells(row))
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
  if (auxBelow) {
    cells.push(...auxCells(row))
    row += 1
  }
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
      ? subMethod === 'carry'
        ? 'Resta en columna con «me llevo una». Empieza por las unidades.'
        : 'Resta en columna. Empieza por las unidades, la casa azul.'
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
