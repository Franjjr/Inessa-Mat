/* Exercise view "division": the Spanish "galera", in the school way the grown-up chose (ChildSettings.divMethod):
   «la galera con restas» (the default) or «la galera sin restas» (only the quotient digits and what is left over).
   Old data may still name a retired method (repartir por partes, multiplicar hacia arriba): it is shown as the galera.
   The galera: the dividend on the left, the divisor inside the bracket, the quotient under it, and the subtractions under
   the dividend. Steps open one by one: each step brings a digit down, writes its quotient digit (top right) and its
   remainder (under the digit just used). The product of a step is written only after the child writes its quotient
   digit («7 × 9 = 63»), never before. The engine checks the final quotient and remainder: the remainders of the
   middle steps help, but the child may check without them; step marks are only gentle feedback.
   The digits of the quotient (and of each remainder) share a numberId: the on-screen keypad and the keyboard type them
   like a calculator, left to right. A number whose cells are all written has no numberId, so typing there replaces
   that digit instead of starting the number again (the quotient grows step by step, so it never starts over by mistake).
   The terms (dividendo, divisor, cociente, resto) are named on the galera; the first time, with a child's explanation.
   A speech bubble under the active quotient cell asks the question of the step. «Inténtalo otra vez» starts with what
   she wrote (initialAnswer) and marks the digits that were wrong until she changes them. */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DivMethod, DivisionExercise, ExerciseViewProps } from '@/types'
import { hintsFor } from '@/engine'
import { CellGroup, DigitCell } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { galeraSteps, quotientOf, remainderOf, type GaleraStep } from '../division/galera'
import { ExerciseLayout } from './ExerciseLayout'
import s from './DivisionView.module.css'

export interface DivisionViewProps extends ExerciseViewProps {
  /** After a correct answer show the magic proof (quotient × divisor + remainder = dividend). */
  proof?: boolean
}

/** The method the view shows: always a galera, with or without the subtractions. A retired method becomes the galera. */
export function effectiveDivMethod(method: DivMethod | undefined): DivMethod {
  return method === 'galera-short' ? 'galera-short' : 'galera'
}

export default function DivisionView(props: DivisionViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, proof, divMethod, initialAnswer, wrongColumns } = props
  if (exercise.kind !== 'division') return null
  const method = effectiveDivMethod(divMethod)
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
      initialAnswer={initialAnswer}
      wrongColumns={wrongColumns}
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
  initialAnswer?: ExerciseViewProps['initialAnswer']
  wrongColumns?: number[]
}

function GaleraRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, proof, method, initialAnswer, wrongColumns }: RoundProps) {
  const host = useActivityHost()
  // The first division she does explains the words of the galera; once she has checked one, they are only named.
  const [firstTime] = useState(() => !termsSeen())
  const short = method === 'galera-short'
  // The hints of the galera the child uses: without subtractions they never ask to «restar» on paper.
  const hints = useMemo(() => hintsFor(ex, undefined, { divMethod: method }), [ex, method])
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, method, hints })
  useEffect(() => { if (flow.result) rememberTerms() }, [flow.result])
  const steps = useMemo(() => galeraSteps(ex.dividend, ex.divisor), [ex.dividend, ex.divisor])
  const digits = String(ex.dividend).split('')
  const n = digits.length
  const k = steps.length
  // The quotient columns: at least as many as the divisor's digits, so a 2-digit divisor fits above them.
  const width = Math.max(k, String(ex.divisor).length)
  // A remainder is smaller than the divisor: with a 2-digit divisor each remainder has a tens cell too (blank = 0).
  const twoDigitRem = ex.divisor >= 10
  const showRemainder = ex.variant === 'rem' || remainderOf(steps) !== 0

  // «Inténtalo otra vez»: start with the quotient and the remainder she wrote (the digits of the quotient go to the
  // steps from the right, the remainder to the last step).
  const prior = initialAnswer?.type === 'division' ? initialAnswer : null
  const priorDigits = prior && prior.quotient !== null ? String(prior.quotient).split('').map(Number) : []
  const priorRem = prior && prior.remainder !== null ? prior.remainder : null
  const [qs, setQs] = useState<(number | null)[]>(() => steps.map((_, j) => priorDigits[j + priorDigits.length - k] ?? null))
  const [rs, setRs] = useState<(number | null)[]>(() => steps.map((_, j) => (j === k - 1 && priorRem !== null ? priorRem % 10 : null)))
  const [rts, setRts] = useState<(number | null)[]>(() => steps.map((_, j) => (j === k - 1 && priorRem !== null && twoDigitRem && priorRem >= 10 ? Math.floor(priorRem / 10) % 10 : null)))
  // The digits of the previous try that were wrong, marked until she changes them.
  const [marked, setMarked] = useState<Set<string>>(() => {
    const out = new Set<string>()
    if (!prior) return out
    const named = wrongColumns && wrongColumns.length ? new Set(wrongColumns) : null
    steps.forEach((st, j) => {
      const q = priorDigits[j + priorDigits.length - k]
      if (q !== undefined && (named ? named.has(j) : q !== st.quotientDigit)) out.add(`q${j}`)
    })
    if (priorRem !== null && (named ? named.has(k - 1) : priorRem !== steps[k - 1].remainder)) out.add(`r${k - 1}`)
    return out
  })
  const unmark = (key: string) => setMarked((prev) => { if (!prev.has(key)) return prev; const next = new Set(prev); next.delete(key); return next })
  const remOf = (j: number) => (rs[j] === null ? null : (rts[j] ?? 0) * 10 + rs[j])

  // Without subtractions, only the last step writes a remainder (the one left over at the end).
  const needsRem = (j: number) => !short || j === k - 1
  const filled = (j: number) => qs[j] !== null && (!needsRem(j) || rs[j] !== null)
  // Step j is open when it is the first one, or the quotient digit of the step before is written: the remainders of
  // the middle steps help to know what to bring down, but they never block the next step.
  const open = (j: number) => j === 0 || qs[j - 1] !== null
  // The answer is the quotient and what is left over at the end: those are enough to check.
  const complete = qs.every((q) => q !== null) && rs[k - 1] !== null
  const active = steps.findIndex((_, j) => open(j) && !filled(j))
  // The product the child's quotient digit gives (7 × 9 = 63): written only after the digit, never before.
  const productOf = (j: number) => (qs[j] === null ? null : ex.divisor * (qs[j] as number))

  // The remainder is written like a subtraction: units first, then tens.
  const order = useMemo(
    () => steps.flatMap((_, j) => (needsRem(j) ? [`q${j}`, `r${j}`, ...(twoDigitRem ? [`rt${j}`] : [])] : [`q${j}`])),
    [steps, short, twoDigitRem], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const qWrong = (j: number) => !!flow.result && !flow.result.correct && qs[j] !== null && qs[j] !== steps[j].quotientDigit
  const rWrong = (j: number) => !!flow.result && !flow.result.correct && rs[j] !== null && remOf(j) !== steps[j].remainder
  const statusOf = (j: number, wrong: boolean, key: string) => {
    if (flow.result?.correct) return 'correct' as const
    if (wrong || marked.has(key)) return 'wrong' as const
    if (guided && j === active) return 'active' as const
    return 'idle' as const
  }

  // The quotient is typed like a calculator while its last open cell is empty; the remainder, while a cell of it is free.
  const lastOpen = steps.reduce((acc, _, j) => (open(j) ? j : acc), 0)
  // Without subtractions every cell of the quotient is there from the start, so a quotient typed as read («1», «2»)
  // goes right to left like a calculator and the cursor has somewhere to wait.
  const qCalculator = short ? qs.some((q) => q === null) : qs[lastOpen] === null
  const qShown = (j: number) => short || open(j)
  const remainderNumber = (j: number) => (twoDigitRem && !(rs[j] !== null && rts[j] !== null) ? `r${j}` : undefined)

  // A remainder of one digit that cannot grow (a remainder is smaller than the divisor: 9 followed by any digit is
  // more than 90) is finished: the cursor goes on to the next quotient cell instead of waiting for a second digit.
  useEffect(() => {
    if (!twoDigitRem) return
    const j = steps.findIndex((_, i) => rs[i] !== null && rts[i] === null && (rs[i] as number) * 10 >= ex.divisor)
    if (j < 0 || j >= k - 1) return
    const a = document.activeElement
    if (!(a instanceof HTMLElement) || a.getAttribute('aria-label') !== (showRemainder && j === k - 1 ? 'resto' : `resto del paso ${j + 1}`)) return
    const next = document.querySelector<HTMLElement>(`[aria-label="cociente, cifra ${j + 2}"]`)
    next?.focus()
  }, [rs, rts, twoDigitRem, ex.divisor, steps, k, showRemainder])

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
        {i === 0 && <span className={s.caption} aria-hidden>dividendo</span>}
      </div>,
    )
  })
  cells.push(
    <div key="dvs" className={s.divisor} style={{ gridRow: 1, gridColumn: n + 2 }}>
      <span className={s.divisorNum} aria-label={`divisor ${ex.divisor}`}>{ex.divisor}</span>
      <span className={s.caption} aria-hidden>divisor</span>
    </div>,
  )

  // Row 2: quotient digits under the top bar, one per open step.
  steps.forEach((_, j) => {
    if (!qShown(j)) return
    cells.push(
      <div key={`q${j}`} className={`${s.cell} ${s.quotient}`} style={{ gridRow: 2, gridColumn: n + 2 + j }}>
        <DigitCell
          cellId={`q${j}`}
          variant="result"
          size="md"
          value={qs[j]}
          status={statusOf(j, qWrong(j), `q${j}`)}
          numberId={qCalculator ? 'q' : undefined}
          onChange={(v) => { unmark(`q${j}`); setQs((prev) => prev.map((x, i) => (i === j ? v : x))) }}
          ariaLabel={`cociente, cifra ${j + 1}`}
          autoFocus={j === 0}
        />
      </div>,
    )
  })

  cells.push(<span key="qcap" className={s.quotientCaption} style={{ gridRow: 2, gridColumn: n + 2 + width }} aria-hidden>← cociente</span>)

  // The question of the step, in a bubble under the active quotient cell (the empty part of the galera: nothing under it).
  const activeStep = active >= 0 && !flow.result?.correct ? steps[active] : null
  if (activeStep) {
    cells.push(
      <div
        key="ask"
        className={s.ask}
        data-testid="galera-ask"
        style={{ gridRow: `3 / ${lastRow + 1}`, gridColumn: `${n + 2} / -1`, ['--ask-tip' as string]: `calc((${active} + .5) * var(--galera-col))` }}
      >
        {host.t(`${active > 0 ? `Baja el ${digits[activeStep.endIndex]}. ` : ''}¿Cuántas veces cabe el ${ex.divisor} en ${activeStep.partial}?`)}
      </div>,
    )
  }

  // Rows 3+: in the galera each step is the product (printed under the partial dividend), a line, then the remainder.
  // Without subtractions each step is one row: only the remainder of the last step is written.
  steps.forEach((st, j) => {
    if (!open(j)) return
    const base = 3 + j * rowsPer
    if (!short) {
      const product = productOf(j)
      // A product longer than the partial (the digit is too big) is not drawn in the columns: the step line says it.
      const productDigits = product === null || String(product).length > String(st.partial).length ? [] : String(product).split('')
      const partialLength = String(st.partial).length
      const firstCol = st.endIndex - partialLength + 1 // 0-based column where the partial starts
      const span = { gridColumn: `${firstCol + 1} / ${st.endIndex + 2}` }
      cells.push(
        <div
          key={`p${j}`}
          className={s.product}
          role="group"
          aria-label={product === null ? `producto del paso ${j + 1}` : `producto del paso ${j + 1}: ${ex.divisor} × ${qs[j]} = ${product}`}
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
    // The tens cell comes first in the page (left to right): the cells of a number are read in that order.
    if (twoDigitRem && st.endIndex >= 1) {
      cells.push(
        <div key={`rt${j}`} className={s.cell} style={{ gridRow: remainderRow, gridColumn: st.endIndex }}>
          <DigitCell
            cellId={`rt${j}`}
            variant="result"
            size="md"
            value={rts[j]}
            status={statusOf(j, rWrong(j), `r${j}`)}
            numberId={remainderNumber(j)}
            onChange={(v) => { unmark(`r${j}`); setRts((prev) => prev.map((x, i) => (i === j ? v : x))) }}
            ariaLabel={showRemainder && j === k - 1 ? 'resto, decenas' : `resto del paso ${j + 1}, decenas`}
          />
        </div>,
      )
    }
    cells.push(
      <div key={`r${j}`} className={s.cell} style={{ gridRow: remainderRow, gridColumn: st.endIndex + 1 }}>
        <DigitCell
          cellId={`r${j}`}
          variant="result"
          size="md"
          value={rs[j]}
          status={statusOf(j, rWrong(j), `r${j}`)}
          numberId={remainderNumber(j)}
          onChange={(v) => { unmark(`r${j}`); setRs((prev) => prev.map((x, i) => (i === j ? v : x))) }}
          ariaLabel={showRemainder && j === k - 1 ? 'resto' : `resto del paso ${j + 1}`}
        />
        {j === k - 1 && <span className={`${s.caption} ${s.captionBelow}`} aria-hidden>resto</span>}
      </div>,
    )
  })

  const stepLine = (st: GaleraStep, j: number) => {
    const at = j === 0
      ? `¿Cuántas veces cabe el ${ex.divisor} en ${st.partial}?`
      : `Bajamos el ${digits[st.endIndex]}: ¿cuántas veces cabe el ${ex.divisor} en ${st.partial}?`
    const product = short ? null : productOf(j)
    // After the digit: its product, as the notebook writes it, and a gentle word when it is more than the number.
    const times = product === null
      ? ''
      : ` ${ex.divisor} × ${qs[j]} = ${product}.${product > st.partial ? ` Es más que ${st.partial}: prueba un número más pequeño.` : ''}`
    const rest = showRemainder && j === k - 1 && flow.result?.correct ? ` Resto: ${st.remainder}.` : ''
    return host.t(at + times + rest)
  }

  const magic = proof && flow.result?.correct
    ? host.t(`La prueba mágica: ${quotientOf(steps)} × ${ex.divisor} + ${remainderOf(steps)} = ${ex.dividend}`)
    : null

  // The example is worked before the child is asked (like at school); it is not this exercise. One short line each.
  const other = ex.dividend === 85 && ex.divisor === 4
  const sub = short
    ? (other
      ? 'Ejemplo con 97 ÷ 4: en 9 cabe 2 y sobra 1; bajo el 7, en 17 caben 4 y sobra 1. Escribo 24 y resto 1.'
      : 'Ejemplo con 85 ÷ 4: en 8 cabe 2 y no sobra nada; bajo el 5 cabe 1 y sobra 1. Escribo 21 y resto 1.')
    : (other
      ? 'Ejemplo con 97 ÷ 4: en 9 cabe 2 (4 × 2 = 8) y sobra 1; bajo el 7, en 17 caben 4 (4 × 4 = 16) y sobra 1. Sale 24 y resto 1.'
      : 'Ejemplo con 85 ÷ 4: en 8 cabe 2 (4 × 2 = 8) y no sobra nada; bajo el 5 cabe 1 (4 × 1 = 4) y sobra 1. Sale 21 y resto 1.')

  return (
    <ExerciseLayout
      className={compact ? s.compact : undefined}
      workClassName={s.view}
      aria-label="División en galera"
      prompt={host.t(`Reparte ${ex.dividend} entre ${ex.divisor}.`)}
      sub={host.t(sub)}
      actions={<AnswerBar flow={flow} onCheck={check} canCheck={complete} />}
    >
      <TermsLegend firstTime={firstTime} />
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle className={s.work}>
        <div
          className={s.galera}
          style={{
            gridTemplateColumns: `repeat(${n}, var(--galera-col)) var(--galera-gutter) repeat(${width}, var(--galera-col)) auto`,
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
    </ExerciseLayout>
  )
}

const TERMS_SEEN_KEY = 'repasitos.galera-terms-seen'
/** Has the child already seen the terms of the galera explained (and done a division)? Storage may be missing. */
function termsSeen(): boolean {
  try { return window.localStorage.getItem(TERMS_SEEN_KEY) === '1' } catch { return false }
}
function rememberTerms() {
  try { window.localStorage.setItem(TERMS_SEEN_KEY, '1') } catch { /* private window: it is shown again, no harm */ }
}

const TERMS: { term: string; says: string }[] = [
  { term: 'dividendo', says: 'el número que se reparte' },
  { term: 'divisor', says: 'entre cuántos se reparte' },
  { term: 'cociente', says: 'lo que le toca a cada uno' },
  { term: 'resto', says: 'lo que sobra' },
]

/** The four words of the galera: the first time with what each one means, later only the words. */
function TermsLegend({ firstTime }: { firstTime: boolean }) {
  return (
    <dl className={`${s.terms} ${firstTime ? s.termsFirst : ''}`} aria-label="Palabras de la división" data-first={firstTime || undefined}>
      {TERMS.map(({ term, says }) => (
        <div key={term} className={s.term}>
          <dt>{term}</dt>
          {firstTime && <dd>{says}</dd>}
        </div>
      ))}
    </dl>
  )
}
