/* Round to decenas or centenas (num:round:*): the number is shown, the child writes the rounded value. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt, roundWords } from '@/engine'
import type { ExerciseViewProps, RoundExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function RoundView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'round') return null
  return <RoundRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function RoundRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: RoundExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const again = useRetryNumber(retry, ex.answer)
  const [value, setValue] = useState<number | null>(again.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const unit = roundWords(ex.to).one

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Redondear" data-kind={ex.kind} prompt={<>Redondea a la {unit} más cercana.</>} actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}>
      <p className={s.prompt}>{fmt(ex.value)}</p>
      <div className={s.row}>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={Math.max(String(ex.answer).length, String(ex.value).length)}
          size="lg"
          status={again.marked(value, !!flow.result) ? 'wrong' : status}
          ariaLabel="Número redondeado"
          placeholder="?"
          autoFocus
        />
      </div>
    </ExerciseLayout>
  )
}
