/* Cálculo mental exprés (mental:*): one short question, a short answer, no column. The number is the only input. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, MentalExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function MentalView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'mental') return null
  return <MentalRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

/** «De cabeza» only while the numbers are small: with a number of 3 or more digits the child may well write (P3PE-14). */
export function mentalPrompt(ex: MentalExercise): string {
  const big = [ex.a, ex.b, ex.c ?? 0, ex.answer].some((n) => Math.abs(n) >= 100)
  return big ? 'Calcula y escribe el resultado.' : 'Calcúlalo de cabeza, sin escribir la cuenta.'
}

function MentalRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: MentalExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const again = useRetryNumber(retry, ex.answer)
  const [value, setValue] = useState<number | null>(again.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Cálculo mental" data-kind={ex.kind} data-family={ex.family} prompt={mentalPrompt(ex)} actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}>
      <p className={s.prompt}>{ex.prompt}</p>
      <div className={s.row}>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={4}
          size="lg"
          status={again.marked(value, !!flow.result) ? 'wrong' : status}
          ariaLabel="Respuesta de cabeza"
          placeholder="?"
          autoFocus
        />
      </div>
    </ExerciseLayout>
  )
}
