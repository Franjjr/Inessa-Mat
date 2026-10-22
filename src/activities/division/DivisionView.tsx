/* Exercise view "division": the Spanish "galera". Dividend on the left, divisor inside the bracket, quotient
   under the divisor and the subtractions under the dividend. Steps appear one by one (each one bring a digit down).
   Each step has its quotient digit and its remainder; the final quotient and remainder are checked by the engine. */
import { useMemo, useState } from 'react'
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
  const showRemainderLabel = ex.variant === 'rem' || remainderOf(steps) !== 0

  const [qs, setQs] = useState<(number | null)[]>(() => steps.map(() => null))
  const [rs, setRs] = useState<(number | null)[]>(() => steps.map(() => null))

  // A step is open when it is the first one or the previous step has both its cells written.
  const open = (j: number) => j === 0 || (qs[j - 1] !== null && rs[j - 1] !== null)
  const filled = steps.every((_, j) => !open(j) || (qs[j] !== null && rs[j] !== null))
  const complete = steps.every((_, j) => qs[j] !== null && rs[j] !== null)
  const active = steps.findIndex((_, j) => open(j) && (qs[j] === null || rs[j] === null))

  const order = useMemo(() => steps.flatMap((_, j) => [`q${j}`, `r${j}`]), [steps])
  const wrongCell = (j: number, which: 'q' | 'r') => {
    if (!flow.result || flow.result.correct) return false
    const st = steps[j]
    return which === 'q' ? qs[j] !== st.quotientDigit : rs[j] !== st.remainder
  }

  const check = () => {
    if (!complete) return
    const quotient = Number(qs.join(''))
    const remainder = rs[k - 1] ?? 0
    const c = flow.submit({ type: 'division', quotient, remainder })
    if (c.correct) celebrate('small')
  }

  const qColumn = (j: number) => n + 2 + j
  const stepLine = (st: GaleraStep, j: number) => {
    const word = j === 0 ? 'Cabe' : 'Bajamos el'
    if (j === 0) {
      return host.t(`¿Cuántas veces cabe el ${ex.divisor} en ${st.partial}?`)
    }
    return host.t(`${word} ${digits[st.endIndex]}: ¿cuántas veces cabe el ${ex.divisor} en ${st.partial}?`)
  }

  const magic = proof && flow.submitted && flow.result?.correct
    ? host.t(`La prueba mágica: ${quotientOf(steps)} × ${ex.divisor} + ${remainderOf(steps)} = ${ex.dividend}`)
    : null

  const rows: React.ReactNode[] = []
  // Dividend (row 1) and divisor (row 1, over the quotient).
  digits.forEach((d, i) => {
    rows.push(
      <div key={`dv${i}`} className={`${s.cell} ${guided && active >= 0 && steps[active].endIndex === i ? s.brought : ''}`}
        style={{ gridRow: 1, gridColumn: i + 1 }}>
        <DigitCell variant="given" size="md" value={Number(d)} onChange={() => {}} ariaLabel={`dividendo, cifra ${d}`} />
      </div>,
    )
  })
  rows.push(
    <div key="dvs" className={s.divisor} style={{ gridRow: 1, gridColumn: `${n + 2} / span ${Math.max(k, 1)}` }}>
      <span className={s.divisorNum}>{ex.divisor}</span>
    </div>,
  )
  // Quotient digits (row 2, under the divisor).
  steps.forEach((_, j) => {
    rows.push(
      <div key={`q${j}`} className={s.cell} style={{ gridRow: 2, gridColumn: qColumn(j) }}>
        <DigitCell
          cellId={`q${j}`}
          variant="result"
          size="md"
          value={qs[j]}
          status={statusFor(flow, complete, j, wrongCell(j, 'q'), active === j, guided)}
          onChange={(v) => setQs((prev) => prev.map((x, i) => (i === j ? v : x)))}
          ariaLabel={`cociente, cifra ${j + 1}`}
          autoFocus={j === 0}
        />
      </div>,
    )
  })

  // Steps (rows 3 onwards): product under the partial, then the remainder under the digit just used.
  steps.forEach((st, j) => {
    if (!open(j)) return
    const base = 3 + j * 3
    const span = Math.max(1, st.endIndex - st.startIndex + 1)
    const productText = String(st.product)
    const startCol = st.endIndex + 1 - Math.max(productText.length, span) + 1
    rows.push(
      <div key={`prod${j}`} className={s.product} style={{ gridRow: base, gridColumn: `${Math.max(1, startCol)} / ${st.endIndex + 2}` }}
        aria-label={`producto ${st.product}`}>
        <span>{st.product}</span>
      </div>,
    )
    rows.push(
      <div key={`line${j}`} className={s.subLine} style={{ gridRow: base + 1, gridColumn: `${Math.max(1, st.startIndex + 1 - 0)} / ${st.endIndex + 2}` }} aria-hidden />,
    )
    rows.push(
      <div key={`r${j}`} className={s.cell} style={{ gridRow: base + 2, gridColumn: st.endIndex + 1 }}>
        <DigitCell
          cellId={`r${j}`}
          variant="result"
          size="md"
          value={rs[j]}
          status={statusFor(flow, complete, j, wrongCell(j, 'r'), active === j, guided)}
          onChange={(v) => setRs((prev) => prev.map((x, i) => (i === j ? v : x)))}
          ariaLabel={showRemainderLabel && j === k - 1 ? 'resto' : `resto del paso ${j + 1}`}
        />
      </div>,
    )
  })

  const lastRow = 3 + Math.max(0, k - 1) * 3 + 2
  const stepLines = steps.map((st, j) => (open(j) ? (
    <p key={`txt${j}`} className={`${s.stepText} ${j === active ? s.stepActive : ''}`}>
      <span className={s.stepNum}>{j + 1}</span>
      {stepLine(st, j)}
    </p>
  ) : null))

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="División en galera">
      <p className={s.prompt}>
        {host.t(`Reparte ${ex.dividend} entre ${ex.divisor}. Escribe el cociente y los restos paso a paso.`)}
      </p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <div className={s.galera} style={{ gridTemplateColumns: `repeat(${n}, auto) 14px repeat(${Math.max(k, 1)}, auto)` }}>
          <div className={s.bracket} style={{ gridRow: `1 / ${lastRow + 1}`, gridColumn: n + 1 }} aria-hidden />
          <div className={s.topBar} style={{ gridRow: 2, gridColumn: `${n + 2} / span ${Math.max(k, 1)}` }} aria-hidden />
          {rows}
          {showRemainderLabel && <span className={s.restoLabel} style={{ gridRow: lastRow, gridColumn: `1 / ${n + 1}` }} aria-hidden />}
        </div>
      </CellGroup>
      <div className={s.steps}>{stepLines}</div>
      {!filled && <p className={s.hint}>{host.t('Escribe el paso que toca. Cada cifra va en su sitio.')}</p>}
      {magic && <p className={s.magic}>{magic}</p>}
      <AnswerBar flow={flow} onCheck={check} canCheck={complete} />
    </section>
  )
}

function statusFor(
  flow: { result: { correct: boolean } | null },
  complete: boolean,
  _j: number,
  wrong: boolean,
  isActive: boolean,
  guided?: boolean,
) {
  if (flow.result?.correct || complete) return 'correct' as const
  if (wrong) return 'wrong' as const
  if (guided && isActive) return 'active' as const
  return 'idle' as const
}
