/* Exercise view "word-problem": a short Spanish story with its numbers, solved as in the school notebook.
   1. Planteamiento: the child writes the two numbers of the story and picks the operation (+ − × ÷); the app says
      whether it is well set out (a wrong one is a clue, never a mark).
   2. Operación: the calculation in boxes, with the same views as the column operations and the galera. Small numbers
      (a table fact) go straight to the result; «Lo sé de cabeza» skips the boxes too.
   3. Solución: the result with its unit («18 velas»).
   Only the result is graded (P1): the planteamiento and the boxes guide. */
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import type { Answer, Exercise, ExerciseOutcome, ExerciseViewProps, WordProblemExercise } from '@/types'
import { makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeDivision3, makeLongMul } from '@/engine'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { ListenButton } from '@/activities/shared/ListenButton'
import { statementFor } from '@/engine/statement'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, useRetryFlow, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { ExerciseLayout } from './ExerciseLayout'
import s from './WordProblemView.module.css'

export interface WordProblemViewProps extends ExerciseViewProps {
  /** The child picks the operation before solving. */
  chooseOp?: boolean
}

const OPS: { op: WordProblemExercise['op']; label: string; sign: string; verb: string }[] = [
  { op: 'add', label: 'Juntar', sign: '+', verb: 'juntar' },
  { op: 'sub', label: 'Quitar', sign: '−', verb: 'quitar' },
  { op: 'mul', label: 'Repetir', sign: '×', verb: 'repetir' },
  { op: 'div', label: 'Repartir', sign: '÷', verb: 'repartir' },
]

const ColumnView = lazy(() => import('./ColumnView'))
const LongMulView = lazy(() => import('./LongMulView'))
const DivisionView = lazy(() => import('./DivisionView'))

/** The calculation in boxes for the operation of the story, or null when it is done in the head (a table fact, a small
    sum or subtraction, a two-digit divisor). */
export function calculationFor(ex: WordProblemExercise): Exercise | null {
  const [x, y] = ex.operands
  switch (ex.op) {
    case 'add': return Math.max(x, y) >= 10 ? makeColumnAdd([x, y]) : null
    case 'sub': return x >= 20 ? makeColumnSub(x, y) : null
    case 'mul': {
      const top = Math.max(x, y)
      const bottom = Math.min(x, y)
      if (top < 10) return null
      return bottom >= 10 ? makeLongMul(top, bottom) : makeColumnMul(top, bottom)
    }
    case 'div':
      if (y >= 10 || ex.answer < 10) return null
      return x >= 100 ? makeDivision3(x, y) : makeDivision(x, y)
  }
}

/** What is wrong in the planteamiento, or null when it is well set out. */
export function planMistake(ex: WordProblemExercise, a: number | null, op: WordProblemExercise['op'] | null, b: number | null): string | null {
  if (op !== ex.op) return 'Esa no es la operación que toca. Vuelve a leer la historia y piensa qué pasa con los números.'
  const [x, y] = ex.operands
  const same = (p: number | null, q: number | null) => (p === x && q === y) || (p === y && q === x)
  if (!same(a, b)) return 'Busca en la historia los dos números que hay que usar.'
  if (op === 'sub' && a !== Math.max(x, y)) return 'En una resta, primero va el número más grande: al mayor le quitas el menor.'
  if (op === 'div' && a !== x) return 'Primero va lo que se reparte y después entre cuántos se reparte.'
  return null
}

const SIGN: Record<WordProblemExercise['op'], string> = { add: '+', sub: '−', mul: '×', div: ':' }

/** The result the calculation view sent, as the answer of the story. */
function answerFromCalc(ex: WordProblemExercise, o: ExerciseOutcome): Answer {
  const withRest = (ex.remainder ?? 0) > 0
  if (o.check.correct) {
    return withRest ? { type: 'division', quotient: ex.answer, remainder: ex.remainder ?? 0 } : { type: 'number', value: ex.answer }
  }
  const nums = (o.check.given.match(/\d+/g) ?? []).map(Number)
  if (ex.op === 'div') {
    return withRest ? { type: 'division', quotient: nums[0] ?? null, remainder: nums[1] ?? 0 } : { type: 'number', value: nums[0] ?? null }
  }
  return { type: 'number', value: nums.length ? Number(nums.join('')) : null }
}

export default function WordProblemView(props: WordProblemViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, chooseOp, method, divMethod } = props
  if (exercise.kind !== 'word-problem') return null
  return (
    <WordRound
      key={exercise.id}
      ex={exercise}
      onAnswered={onAnswered}
      allowHints={allowHints}
      showFeedback={showFeedback}
      compact={compact}
      chooseOp={chooseOp}
      guided={guided}
      retry={props}
      method={method}
      divMethod={divMethod}
    />
  )
}

interface RoundProps {
  ex: WordProblemExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  chooseOp?: boolean
  guided?: boolean
  /** «Inténtalo otra vez»: what the child wrote (the number, and what is left over) and the wrong boxes. */
  retry?: RetryProps
  method?: ExerciseViewProps['method']
  divMethod?: ExerciseViewProps['divMethod']
}

function WordRound({ ex, onAnswered, allowHints, showFeedback, compact, guided, retry, method, divMethod }: RoundProps) {
  const host = useActivityHost()
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  // A try again starts with what the child wrote: the number, the remainder, and the operation she had already found.
  const before = initialOf(retry, 'number') ?? null
  const beforeDiv = initialOf(retry, 'division') ?? null
  const first = before ? before.value : beforeDiv ? beforeDiv.quotient : null
  const firstRest = beforeDiv ? beforeDiv.remainder : null
  /** 0: the answer box, 1: the box of what is left over. */
  const wrongBox = useRetryWrong(retry, () => [
    ...(first !== ex.answer ? [0] : []),
    ...((ex.remainder ?? 0) > 0 && firstRest !== (ex.remainder ?? 0) ? [1] : []),
  ])
  // A try again comes back with the planteamiento done (it was right the first time) and the result to write again.
  const again = before !== null || beforeDiv !== null
  const [a, setA] = useState<number | null>(again ? (ex.op === 'sub' ? Math.max(...ex.operands) : ex.operands[0]) : null)
  const [b, setB] = useState<number | null>(again ? (ex.op === 'sub' ? Math.min(...ex.operands) : ex.operands[1]) : null)
  const [picked, setPicked] = useState<WordProblemExercise['op'] | null>(again ? ex.op : null)
  const calc = useMemo(() => calculationFor(ex), [ex])
  /** plan: numbers and operation; calc: the boxes; head: the result alone (small numbers, or «Lo sé de cabeza»). */
  const [stage, setStage] = useState<'plan' | 'calc' | 'head'>(again ? (calc && !before && !beforeDiv ? 'calc' : 'head') : 'plan')
  const [planClue, setPlanClue] = useState<string | null>(null)
  /** The planteamiento clue has been counted for this problem (counted once, at the first wrong planteamiento). */
  const clueCounted = useRef(false)
  const [value, setValue] = useState<number | null>(first)
  const [rest, setRest] = useState<number | null>(firstRest)
  const hasRemainder = (ex.remainder ?? 0) > 0

  const planMisses = useRef(0)
  /** The next step comes into view when it opens (the story above stays one scroll away). */
  // Stable: a callback ref runs on mount only, not on every render (no scrolling while the child writes).
  const toView = useCallback((el: HTMLElement | null) => { el?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }) }, [])
  const checkPlan = () => {
    const mistake = planMistake(ex, a, picked, b)
    if (mistake) {
      // A wrong planteamiento is a clue taken: counted once as a hint used, so trying one by one does not climb mastery.
      if (!clueCounted.current) {
        clueCounted.current = true
        flow.countClue()
      }
      planMisses.current += 1
      if (planMisses.current < 2) {
        setPlanClue(host.t(mistake))
        return
      }
      // The second miss: the planteamiento is shown done (never stuck on it) and the child goes on to the calculation.
      const [x, y] = ex.operands
      const first = ex.op === 'sub' ? Math.max(x, y) : x
      const second = ex.op === 'sub' ? Math.min(x, y) : y
      setA(first)
      setB(second)
      setPicked(ex.op)
      setPlanClue(host.t(`Mira cómo se plantea: ${first} ${SIGN[ex.op]} ${second}. Ahora, la cuenta.`))
      setStage(calc ? 'calc' : 'head')
      return
    }
    setPlanClue(null)
    setStage(calc ? 'calc' : 'head')
  }

  /** The calculation in boxes answered: its result is the answer of the story (graded as the story). */
  const calcAnswered = (o: ExerciseOutcome) => {
    if (o.hintsUsed > 0) flow.countClue()
    const c = flow.submit(answerFromCalc(ex, o))
    if (c.correct) celebrate('small')
  }

  // Takes the values explicitly: a NumberInput submit passes the value it has just read.
  const submit = (answer: number | null = value, leftover: number | null = rest) => {
    if (answer === null) return
    const c = hasRemainder
      ? flow.submit({ type: 'division', quotient: answer, remainder: leftover })
      : flow.submit({ type: 'number', value: answer })
    if (c.correct) celebrate('small')
  }

  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  /** Before checking again, a box the child had wrong stays soft red until she changes it. */
  const statusOf = (box: 0 | 1, now: number | null, then: number | null) =>
    !flow.result && wrongBox.has(box) && now === then ? 'wrong' as const : status
  const readyToCheck = value !== null
  const planReady = a !== null && b !== null && picked !== null
  const planned = stage !== 'plan'

  const actions = stage === 'plan'
    ? <AnswerBar flow={flow} onCheck={checkPlan} canCheck={planReady} />
    : stage === 'head' || flow.result ? <AnswerBar flow={flow} onCheck={() => submit()} canCheck={readyToCheck && !flow.result} /> : null

  return (
    <ExerciseLayout
      workClassName={`${s.view} ${compact ? s.compact : ''}`}
      aria-label="Problema"
      prompt={text}
      actions={actions}
    >
      {/* With the voice on the problem reads itself here: the «word» and «exercises» activities have no other «Escuchar»,
          and the lesson (TrySlot) and the session (ExerciseStep) leave theirs out for a problem when the voice is on. */}
      {host.prefs.voice && <ListenButton text={statementFor({ ...ex, text })} className={s.speak} />}

      {planned ? (
        // Set out: one line, so the calculation and its «Comprobar» fit on the screen.
        <section className={s.planDone} aria-label="Planteamiento">
          <span className={s.planDoneLabel}>{host.t('Planteamiento:')}</span>
          <span className={s.planDoneOp}>{`${a ?? ''} ${picked ? SIGN[picked] : ''} ${b ?? ''}`}</span>
          {planClue ? <span className={s.opClue} role="status">{planClue}</span> : <span className={s.planOk}>{host.t('¡Bien planteado!')}</span>}
        </section>
      ) : (
        <section className={s.step} aria-label="Planteamiento">
          <p className={s.stepTitle}>{host.t('1. Planteamiento: escribe los números de la historia y elige la operación.')}</p>
          <div className={s.planRow}>
            <NumberInput value={a} onChange={(v) => { setA(v); setPlanClue(null) }} onSubmit={(v) => setA(v)} maxDigits={4} size="lg" ariaLabel="Primer número" placeholder="?" checkButton={false} autoFocus />
            <span className={s.planSign} aria-label={picked ? `Operación ${SIGN[picked]}` : 'Operación sin elegir'}>{picked ? SIGN[picked] : '?'}</span>
            <NumberInput value={b} onChange={(v) => { setB(v); setPlanClue(null) }} onSubmit={(v) => setB(v)} maxDigits={4} size="lg" ariaLabel="Segundo número" placeholder="?" checkButton={false} />
          </div>
          <div className={s.opButtons} role="group" aria-label="¿Qué operación?">
            {OPS.map((o) => (
              <button
                key={o.op}
                type="button"
                className={`${s.opBtn} ${picked === o.op ? s.opOn : ''}`}
                onClick={() => { setPicked(o.op); setPlanClue(null) }}
                aria-pressed={picked === o.op}
              >
                <span className={s.opSign} aria-hidden>{o.sign}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          {planClue && <p className={s.opClue} role="status">{planClue}</p>}
        </section>
      )}

      {stage === 'calc' && calc && (
        <section className={s.step} aria-label="Operación" ref={toView}>
          <p className={s.stepTitle}>{host.t('2. Operación: haz la cuenta en las casillas.')}</p>
          <Suspense fallback={null}>
            {calc.kind === 'long-mul'
              ? <LongMulView exercise={calc} onAnswered={calcAnswered} allowHints={allowHints} showFeedback={false} compact />
              : calc.kind === 'division'
                ? <DivisionView exercise={calc} onAnswered={calcAnswered} allowHints={allowHints} showFeedback={false} divMethod={divMethod} compact />
                : <ColumnView exercise={calc} onAnswered={calcAnswered} allowHints={allowHints} showFeedback={false} method={method} compact />}
          </Suspense>
          {!flow.result && (
            <button type="button" className={s.headLink} onClick={() => setStage('head')}>{host.t('Lo sé de cabeza')}</button>
          )}
        </section>
      )}

      {stage === 'head' && (
        <section className={s.step} aria-label="Solución" ref={toView}>
          <p className={s.stepTitle}>{host.t(calc ? 'Escribe el resultado.' : '2. Resultado: hazlo de cabeza y escríbelo.')}</p>
          <div className={s.answer}>
            <span className={s.answerLabel}>{host.t('Solución:')}</span>
            <NumberInput
              value={value}
              onChange={setValue}
              onSubmit={(v) => { setValue(v); submit(v) }}
              maxDigits={4}
              size="lg"
              status={statusOf(0, value, first)}
              ariaLabel="Respuesta"
              placeholder="?"
              autoFocus
              checkButton={!hasRemainder}
            />
            <span className={s.unit}>{ex.unit}</span>
          </div>
          {hasRemainder && (
            <div className={s.answer}>
              <span className={s.answerLabel}>{host.t('Sobra:')}</span>
              <NumberInput value={rest} onChange={setRest} onSubmit={(r) => submit(value, r)} maxDigits={2} size="lg" status={statusOf(1, rest, firstRest)} ariaLabel="Lo que sobra" placeholder="?" checkButton={false} />
            </div>
          )}
        </section>
      )}

      {stage === 'calc' && flow.result?.correct && (
        <p className={s.solution}>{host.t(`Solución: ${ex.answer} ${ex.unit}${hasRemainder ? ` y sobran ${ex.remainder}` : ''}.`)}</p>
      )}

      {guided && <p className={s.guide}>{host.t('Piensa qué pasa en la historia antes de escribir los números.')}</p>}
    </ExerciseLayout>
  )
}
