/* Round to decenas or centenas (num:round:*): the number is shown, the child writes the rounded value. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt, roundWords } from '@/engine'
import type { ExerciseViewProps, RoundExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'

export default function RoundView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'round') return null
  return <RoundRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function RoundRound({ ex, onAnswered, showFeedback, allowHints }: { ex: RoundExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const unit = roundWords(ex.to).one

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Redondear" data-kind={ex.kind}>
      <p className={s.instructions}>Redondea a la {unit} más cercana.</p>
      <p className={s.prompt}>{fmt(ex.value)}</p>
      <div className={s.row}>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={4}
          size="lg"
          status={status}
          ariaLabel="Número redondeado"
          placeholder="?"
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </section>
  )
}
