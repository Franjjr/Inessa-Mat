/* Exercise view "division": the Spanish "galera". Dividend on the left, divisor inside the bracket, quotient under
   the divisor, and the subtractions under the dividend. Steps open one by one: each step brings a digit down, writes
   its quotient digit (top right) and its remainder (under the digit just used). The engine checks the final
   quotient and remainder; the step marks are only gentle feedback. */
import { useMemo, useState, type ReactNode } from 'react'
import type { DivisionExercise, ExerciseViewProps } from '@/types'
import { CellGroup, DigitCell } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { galeraSteps, quotientOf, remainderOf, type GaleraStep } from '../division/galera'
import s from './DivisionView.module.css'

export interface DivisionViewProps extends ExerciseViewProps {
  /** After a correct answer show the magic proof (quotient × divisor + remainder = dividend). */
  proof?: boolean
}

export default function DivisionView(props: DivisionViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, proof } = props
  if (exercise.kind !== 'division') return null
  return (
    <GaleraRound
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
  ex: DivisionExercise
  onAnswered: ExerciseViewProps['onAnswered']
  guided?: boolean
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  proof?: boolean
}

function GaleraRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, proof }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const steps = useMemo(() => galeraSteps(ex.dividend, ex.divisor), [ex.dividend, ex.divisor])
  const digits = String(ex.dividend).split('')
  const n = digits.length
  const k = steps.length
  const width = Math.max(k, 1)
  const showRemainder = ex.variant === 'rem' || remainderOf(steps) !== 0

  const [qs, setQs] = useState<(number | null)[]>(() => steps.map(() => null))
  const [rs, setRs] = useState<(number | null)[]>(() => steps.map(() => null))

  // Step j is open when it is the first one, or the previous step has both its cells written.
  const open = (j: number) => j === 0 || (qs[j - 1] !== null && rs[j - 1] !== null)
  const complete = steps.every((_, j) => qs[j] !== null && rs[j] !== null)
  const active = steps.findIndex((_, j) => open(j) && (qs[j] === null || rs[j] === null))

  const order = useMemo(() => steps.flatMap((_, j) => [`q${j}`, `r${j}`]), [steps])
  const qWrong = (j: number) => !!flow.result && !flow.result.correct && qs[j] !== null && qs[j] !== steps[j].quotientDigit
  const rWrong = (j: number) => !!flow.result && !flow.result.correct && rs[j] !== null && rs[j] !== steps[j].remainder
  const statusOf = (j: number, wrong: boolean) => {
    if (flow.result?.correct) return 'correct' as const
    if (wrong) return 'wrong' as const
    if (guided && j === active) return 'active' as const
    return 'idle' as const
  }

  const check = () => {
    if (!complete) return
    const quotient = Number(qs.join(''))
    const remainder = rs[k - 1] ?? 0
    const c = flow.submit({ type: 'division', quotient, remainder })
    if (c.correct) celebrate('small')
  }

  const cells: ReactNode[] = []
  const lastRow = 3 + (k - 1) * 3 + 2

  // Row 1: dividend digits, the divisor over the quotient.
  digits.forEach((d, i) => {
    const brought = guided && active >= 0 && steps[active].endIndex === i
    cells.push(
      <div key={`dv${i}`} className={`${s.cell} ${brought ? s.brought : ''}`} style={{ gridRow: 1, gridColumn: i + 1 }}>
        <DigitCell variant="given" size="md" value={Number(d)} onChange={() => {}} ariaLabel={`dividendo, cifra ${d}`} />
      </div>,
    )
  })
  cells.push(
    <div key="dvs" className={s.divisor} style={{ gridRow: 1, gridColumn: `${n + 2} / span ${width}` }}>
      <span className={s.divisorNum} aria-label={`divisor ${ex.divisor}`}>{ex.divisor}</span>
    </div>,
  )

  // Row 2: quotient digits under the divisor, one per open step.
  steps.forEach((_, j) => {
    if (!open(j)) return
    cells.push(
      <div key={`q${j}`} className={`${s.cell} ${s.quotient}`} style={{ gridRow: 2, gridColumn: n + 2 + j }}>
        <DigitCell
          cellId={`q${j}`}
          variant="result"
          size="md"
          value={qs[j]}
          status={statusOf(j, qWrong(j))}
          onChange={(v) => setQs((prev) => prev.map((x, i) => (i === j ? v : x)))}
          ariaLabel={`cociente, cifra ${j + 1}`}
          autoFocus={j === 0}
        />
      </div>,
    )
  })

  // Rows 3+: each step is product (printed), a line, then the remainder under the digit just used.
  steps.forEach((st, j) => {
    if (!open(j)) return
    const base = 3 + j * 3
    const productText = String(st.product)
    const endCol = st.endIndex + 2
    const startCol = Math.max(1, endCol - Math.max(productText.length, st.endIndex - st.startIndex + 1))
    cells.push(
      <div key={`p${j}`} className={s.product} style={{ gridRow: base, gridColumn: `${startCol} / ${endCol}` }} aria-label={`producto ${st.product}`}>
        {productText}
      </div>,
    )
    cells.push(<div key={`l${j}`} className={s.subLine} style={{ gridRow: base + 1, gridColumn: `${startCol} / ${endCol}` }} aria-hidden />)
    cells.push(
      <div key={`r${j}`} className={s.cell} style={{ gridRow: base + 2, gridColumn: st.endIndex + 1 }}>
        <DigitCell
          cellId={`r${j}`}
          variant="result"
          size="md"
          value={rs[j]}
          status={statusOf(j, rWrong(j))}
          onChange={(v) => setRs((prev) => prev.map((x, i) => (i === j ? v : x)))}
          ariaLabel={showRemainder && j === k - 1 ? 'resto' : `resto del paso ${j + 1}`}
        />
      </div>,
    )
  })

  const stepLine = (st: GaleraStep, j: number) => {
    const at = j === 0
      ? `¿Cuántas veces cabe el ${ex.divisor} en ${st.partial}?`
      : `Bajamos el ${digits[st.endIndex]}: ¿cuántas veces cabe el ${ex.divisor} en ${st.partial}?`
    const rest = showRemainder && j === k - 1 && flow.result?.correct ? ` Resto: ${st.remainder}.` : ''
    return host.t(at + rest)
  }

  const magic = proof && flow.result?.correct
    ? host.t(`La prueba mágica: ${quotientOf(steps)} × ${ex.divisor} + ${remainderOf(steps)} = ${ex.dividend}`)
    : null

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="División en galera">
      <p className={s.prompt}>
        {host.t(`Reparte ${ex.dividend} entre ${ex.divisor}. Escribe el cociente y los restos paso a paso.`)}
      </p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <div
          className={s.galera}
          style={{ gridTemplateColumns: `repeat(${n}, var(--galera-col)) var(--galera-gutter) repeat(${width}, var(--galera-col))` }}
        >
          <div className={s.bracket} style={{ gridRow: `1 / ${lastRow + 1}`, gridColumn: n + 1 }} aria-hidden />
          <div className={s.topBar} style={{ gridRow: 2, gridColumn: `${n + 2} / span ${width}` }} aria-hidden />
          {cells}
        </div>
      </CellGroup>
      <ol className={s.steps} aria-label="Pasos">
        {steps.map((st, j) => (open(j) ? (
          <li key={j} className={`${s.stepText} ${j === active ? s.stepActive : ''}`}>
            <span className={s.stepNum} aria-hidden>{j + 1}</span>
            <span>{stepLine(st, j)}</span>
          </li>
        ) : null))}
      </ol>
      {magic && <p className={s.magic}>{magic}</p>}
      <AnswerBar flow={flow} onCheck={check} canCheck={complete} />
    </section>
  )
}
