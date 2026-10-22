/* Signo igual flexible (eq:flex): 5 + 3 = __ + 6 or 7 = 3 + __. The equal sign is a balance: the child writes the
   number that makes both sides equal. The blank is a number box, like every other numeric answer. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { EqTerm, EquationExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'

export default function EquationView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'equation') return null
  return <EqRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function EqRound({ ex, onAnswered, showFeedback, allowHints }: { ex: EquationExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
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
      status={status}
      ariaLabel="Número que falta"
      placeholder="?"
      autoFocus
    />
  )

  const side = (terms: EqTerm[]) => terms.map((t, i) => {
    if (t === null) return <span key={i}>{box}</span>
    if (t === '+' || t === '−') return <span key={i} className={s.eqOp}>{t}</span>
    return <span key={i}>{fmt(t)}</span>
  })

  return (
    <section className={s.view} aria-label="Igualdad" data-kind={ex.kind}>
      <p className={s.instructions}>Los dos lados del = tienen que valer lo mismo. ¿Qué número falta?</p>
      <div className={s.eq}>
        <span className={s.eqSide}>{side(ex.left)}</span>
        <span className={s.eqEq} aria-hidden>=</span>
        <span className={s.eqSide}>{side(ex.right)}</span>
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </section>
  )
}
