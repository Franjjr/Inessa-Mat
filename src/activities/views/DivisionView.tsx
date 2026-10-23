/* Exercise view "division": the Spanish "galera" and, by the child's method (ChildSettings.divMethod), the other
   written methods of the same exercise: «la galera sin restas» (only the quotient digits and the final remainder),
   «repartir por partes» (DivisionPartsView) and «multiplicar hacia arriba» (DivisionClimbView).
   The galera: the dividend on the left, the divisor inside the bracket, the quotient under it, and the subtractions under
   the dividend. Steps open one by one: each step brings a digit down, writes its quotient digit (top right) and its
   remainder (under the digit just used). The engine checks the final quotient and remainder; step marks are only
   gentle feedback. */
import { useMemo, useState, type ReactNode } from 'react'
import type { DivMethod, DivisionExercise, ExerciseViewProps } from '@/types'
import { CellGroup, DigitCell } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { galeraSteps, quotientOf, remainderOf, type GaleraStep } from '../division/galera'
import { DivisionClimbView, DivisionPartsView } from './DivisionMethods'
import s from './DivisionView.module.css'

export interface DivisionViewProps extends ExerciseViewProps {
  /** After a correct answer show the magic proof (quotient × divisor + remainder = dividend). */
  proof?: boolean
}

/** The method the view can really show: the climb needs a one-digit quotient, otherwise the galera is shown. */
export function effectiveDivMethod(method: DivMethod | undefined, ex: DivisionExercise): DivMethod {
  // Splitting into parts is for one-digit divisors: with two digits the galera is shown.
  if (method === 'div-parts') return ex.divisor < 10 ? 'div-parts' : 'galera'
  if (method === 'climb') return ex.quotient < 10 ? 'climb' : 'galera'
  if (method === 'galera-short') return 'galera-short'
  return 'galera'
}

export default function DivisionView(props: DivisionViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, proof, divMethod } = props
  if (exercise.kind !== 'division') return null
  const method = effectiveDivMethod(divMethod, exercise)
  if (method === 'div-parts') {
    return <DivisionPartsView key={exercise.id} exercise={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
  }
  if (method === 'climb') {
    return <DivisionClimbView key={exercise.id} exercise={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
  }
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
      method={method}
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
  method: DivMethod
}

function GaleraRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, proof, method }: RoundProps) {
  const host = useActivityHost()
  const short = method === 'galera-short'
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, method })
  const steps = useMemo(() => galeraSteps(ex.dividend, ex.divisor), [ex.dividend, ex.divisor])
  const digits = String(ex.dividend).split('')
  const n = digits.length
  const k = steps.length
  // The quotient columns: at least as many as the divisor's digits, so a 2-digit divisor fits above them.
  const width = Math.max(k, String(ex.divisor).length)
  // A remainder is smaller than the divisor: with a 2-digit divisor each remainder has a tens cell too (blank = 0).
  const twoDigitRem = ex.divisor >= 10
  const showRemainder = ex.variant === 'rem' || remainderOf(steps) !== 0

  const [qs, setQs] = useState<(number | null)[]>(() => steps.map(() => null))
  const [rs, setRs] = useState<(number | null)[]>(() => steps.map(() => null))
  const [rts, setRts] = useState<(number | null)[]>(() => steps.map(() => null))
  const remOf = (j: number) => (rs[j] === null ? null : (rts[j] ?? 0) * 10 + rs[j])

  // Without subtractions, only the last step writes a remainder (the one left over at the end).
  const needsRem = (j: number) => !short || j === k - 1
  const filled = (j: number) => qs[j] !== null && (!needsRem(j) || rs[j] !== null)
  // Step j is open when it is the first one, or the previous step is filled.
  const open = (j: number) => j === 0 || filled(j - 1)
  const complete = steps.every((_, j) => filled(j))
  const active = steps.findIndex((_, j) => open(j) && !filled(j))

  // The remainder is written like a subtraction: units first, then tens.
  const order = useMemo(
    () => steps.flatMap((_, j) => (needsRem(j) ? [`q${j}`, `r${j}`, ...(twoDigitRem ? [`rt${j}`] : [])] : [`q${j}`])),
    [steps, short, twoDigitRem], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const qWrong = (j: number) => !!flow.result && !flow.result.correct && qs[j] !== null && qs[j] !== steps[j].quotientDigit
  const rWrong = (j: number) => !!flow.result && !flow.result.correct && rs[j] !== null && remOf(j) !== steps[j].remainder
  const statusOf = (j: number, wrong: boolean) => {
    if (flow.result?.correct) return 'correct' as const
    if (wrong) return 'wrong' as const
    if (guided && j === active) return 'active' as const
    return 'idle' as const
  }

  const check = () => {
    if (!complete) return
    const quotient = Number(qs.join(''))
    const remainder = remOf(k - 1) ?? 0
    const c = flow.submit({ type: 'division', quotient, remainder })
    if (c.correct) celebrate('small')
  }

  const cells: ReactNode[] = []
  const rowsPer = short ? 1 : 3
  const lastRow = short ? 3 + (k - 1) : 3 + (k - 1) * 3 + 2

  // Row 1: dividend digits, the divisor sits above the top bar.
  digits.forEach((d, i) => {
    const brought = guided && active >= 0 && steps[active].endIndex === i
    cells.push(
      <div key={`dv${i}`} className={`${s.cell} ${brought ? s.brought : ''}`} style={{ gridRow: 1, gridColumn: i + 1 }}>
        <DigitCell variant="given" size="md" value={Number(d)} onChange={() => {}} ariaLabel={`dividendo, cifra ${d}`} />
      </div>,
    )
  })
  cells.push(
    <div key="dvs" className={s.divisor} style={{ gridRow: 1, gridColumn: n + 2 }}>
      <span className={s.divisorNum} aria-label={`divisor ${ex.divisor}`}>{ex.divisor}</span>
    </div>,
  )

  // Row 2: quotient digits under the top bar, one per open step.
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

  // Rows 3+: in the galera each step is the product (printed under the partial dividend), a line, then the remainder.
  // Without subtractions each step is one row: only the remainder of the last step is written.
  steps.forEach((st, j) => {
    if (!open(j)) return
    const base = 3 + j * rowsPer
    if (!short) {
      const productDigits = String(st.product).split('')
      const partialLength = String(st.partial).length
      const firstCol = st.endIndex - partialLength + 1 // 0-based column where the partial starts
      const span = { gridColumn: `${firstCol + 1} / ${st.endIndex + 2}` }
      cells.push(
        <div
          key={`p${j}`}
          className={s.product}
          role="group"
          aria-label={`producto ${st.product}`}
          style={{ ...span, gridRow: base, gridTemplateColumns: `repeat(${partialLength}, var(--galera-col))` }}
        >
          {Array.from({ length: partialLength }, (_, c) => {
            const digit = productDigits[c - (partialLength - productDigits.length)]
            return <span key={c} aria-hidden>{digit ?? ''}</span>
          })}
        </div>,
      )
      cells.push(<div key={`l${j}`} className={s.subLine} style={{ ...span, gridRow: base + 1 }} aria-hidden />)
    }
    if (!needsRem(j)) return
    const remainderRow = short ? base : base + 2
    cells.push(
      <div key={`r${j}`} className={s.cell} style={{ gridRow: remainderRow, gridColumn: st.endIndex + 1 }}>
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
    if (!twoDigitRem || st.endIndex < 1) return
    cells.push(
      <div key={`rt${j}`} className={s.cell} style={{ gridRow: remainderRow, gridColumn: st.endIndex }}>
        <DigitCell
          cellId={`rt${j}`}
          variant="result"
          size="md"
          value={rts[j]}
          status={statusOf(j, rWrong(j))}
          onChange={(v) => setRts((prev) => prev.map((x, i) => (i === j ? v : x)))}
          ariaLabel={showRemainder && j === k - 1 ? 'resto, decenas' : `resto del paso ${j + 1}, decenas`}
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
        {host.t(short
          ? `Reparte ${ex.dividend} entre ${ex.divisor}. Escribe solo el cociente y, al final, el resto.`
          : `Reparte ${ex.dividend} entre ${ex.divisor}. Escribe el cociente y los restos paso a paso.`)}
      </p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <div
          className={s.galera}
          style={{
            gridTemplateColumns: `repeat(${n}, var(--galera-col)) var(--galera-gutter) repeat(${width}, var(--galera-col))`,
            ['--galera-cols' as string]: n + width,
          }}
        >
          <div className={s.bracket} style={{ gridRow: `1 / ${lastRow + 1}`, gridColumn: n + 1 }} aria-hidden />
          <div className={s.topBar} style={{ gridRow: 2, gridColumn: `${n + 1} / span ${width + 1}` }} aria-hidden />
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
