/* Signo igual flexible (eq:flex): 5 + 3 = __ + 6 or 7 = 3 + __. The equal sign is a balance: the child writes the
   number that makes both sides equal. The blank is a number box, like every other numeric answer.
   Signo igual o distinto (eq:same): two expressions with no blank; the child taps = or ≠ (the same tapping pad as compare). */
import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { EqTerm, EquationExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { RETRY_WRONG_CLASS, useRetryChoice, useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function EquationView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'equation') return null
  if (exercise.mode === 'same') return <SameRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
  return <EqRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

type RoundProps = { ex: EquationExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }

/** One side of the balance: the numbers and operators as written, the blank as `box`. */
function sideNodes(terms: EqTerm[], box: ReactNode) {
  return terms.map((t, i) => {
    if (t === null) return <span key={i}>{box}</span>
    if (t === '+' || t === '−') return <span key={i} className={s.eqOp}>{t}</span>
    return <span key={i}>{fmt(t)}</span>
  })
}

function EqRound({ ex, onAnswered, showFeedback, allowHints, retry }: RoundProps) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const again = useRetryNumber(retry, typeof ex.answer === 'number' ? ex.answer : null)
  const [value, setValue] = useState<number | null>(again.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  const box = (
    <NumberInput
      value={value}
      onChange={setValue}
      onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
      maxDigits={4}
      size="lg"
      status={again.marked(value, !!flow.result) ? 'wrong' : status}
      ariaLabel="Número que falta"
      placeholder="?"
      autoFocus
    />
  )

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Igualdad" data-kind={ex.kind} prompt="¿Qué número falta?" sub="Los dos lados del = tienen que valer lo mismo." actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}>
      <div className={s.eq}>
        <span className={s.eqSide}>{sideNodes(ex.left, box)}</span>
        <span className={s.eqEq} aria-hidden>=</span>
        <span className={s.eqSide}>{sideNodes(ex.right, box)}</span>
      </div>
    </ExerciseLayout>
  )
}

const SAME_SIGNS: { sign: '=' | '≠'; label: string }[] = [
  { sign: '=', label: 'igual a' },
  { sign: '≠', label: 'distinto de' },
]

function SameRound({ ex, onAnswered, showFeedback, allowHints, retry }: RoundProps) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const again = useRetryChoice<'=' | '≠'>(retry, (a) => (a.type === 'sign' && (a.sign === '=' || a.sign === '≠') ? a.sign : null), ex.answer === '=' || ex.answer === '≠' ? ex.answer : null)
  const [picked, setPicked] = useState<'=' | '≠' | null>(again.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = () => {
    if (!picked) return
    const c = flow.submit({ type: 'sign', sign: picked })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Igualdad" data-kind={ex.kind} data-status={status} prompt="¿Valen lo mismo los dos lados?" sub="Toca = si valen lo mismo, o ≠ si no." actions={<AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />}>
      <div className={s.eq}>
        <span className={s.eqSide}>{sideNodes(ex.left, null)}</span>
        <span className={s.sign} aria-hidden>{picked ?? '?'}</span>
        <span className={s.eqSide}>{sideNodes(ex.right, null)}</span>
      </div>
      <div className={s.signPad} role="group" aria-label="Signo">
        {SAME_SIGNS.map((o) => (
          <button
            key={o.sign}
            type="button"
            className={clsx(s.signBtn, picked === o.sign && s.signOn, again.marked(o.sign, picked, !!flow.result) && RETRY_WRONG_CLASS)}
            onClick={() => { if (!flow.result?.correct) setPicked(o.sign) }}
            aria-pressed={picked === o.sign}
            aria-label={o.label}
          >
            {o.sign}
          </button>
        ))}
      </div>
    </ExerciseLayout>
  )
}
