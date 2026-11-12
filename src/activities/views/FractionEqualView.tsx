/* Fracciones: tap the figures that are NOT split into equal parts (fraction-equal). */
import clsx from 'clsx'
import { useState } from 'react'
import type { ExerciseViewProps, FractionEqualExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, RETRY_WRONG_CLASS, useRetryFlow, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function FractionEqualView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'fraction-equal') return null
  return <EqualRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function EqualRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: FractionEqualExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the figures the child tapped; a figure tapped that IS split in equal parts is soft red until
  // she taps it again.
  const [before] = useState(() => initialOf(retry, 'marks')?.marked ?? null)
  const wrongBefore = useRetryWrong(retry, () => (before ? before.filter((i) => !ex.unequal.includes(i)) : []))
  const [marked, setMarked] = useState<number[]>(() => before?.slice() ?? [])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = !!flow.result?.correct

  const toggle = (i: number) => {
    if (locked) return
    setMarked((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))
  }

  const submit = () => {
    flow.submit({ type: 'marks', marked })
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Figuras partidas en partes iguales" data-kind={ex.kind} data-status={status} prompt={'Toca las figuras que NO están partidas en partes iguales.'} actions={<AnswerBar flow={flow} onCheck={submit} canCheck={marked.length > 0} />}>
      <div className={s.figureRow}>
        {ex.figures.map((f, i) => {
          const on = marked.includes(i)
          return (
            <button
              key={i}
              type="button"
              className={clsx(s.figureCard, on && s.figureCardOn, !flow.result && on && wrongBefore.has(i) && RETRY_WRONG_CLASS)}
              aria-pressed={on}
              aria-label={`Figura ${i + 1}`}
              onClick={() => toggle(i)}
            >
              <FigureSvg figure={f} label={`Figura ${i + 1}`} className={`${s.figure} ${s.figureSmall}`} />
            </button>
          )
        })}
      </div>
    </ExerciseLayout>
  )
}
