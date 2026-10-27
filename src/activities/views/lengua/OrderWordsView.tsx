/* Lengua de 3.º, ordenar por el abecedario (lng-alphabet): 3 to 5 words, shown shuffled. The child taps them in alphabetical
   order; each tapped word gets its place (1, 2, 3…). Tapping a placed word takes it back. The answer is the order tapped. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, LngAlphabetExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function OrderWordsView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-alphabet') return null
  return <OrderRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function OrderRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngAlphabetExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [order, setOrder] = useState<number[]>([])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  const tap = (i: number) => {
    if (locked) return
    setOrder((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))
  }
  const submit = () => {
    const c = flow.submit({ type: 'marks', marked: order })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Ordenar por el abecedario" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Toca las palabras en orden del abecedario, de la primera a la última</p>
      <div className={s.options} role="group" aria-label="Palabras">
        {ex.words.map((w, i) => {
          const place = order.indexOf(i)
          return (
            <button
              key={w}
              type="button"
              className={clsx(s.option, place >= 0 && s.optionOn)}
              aria-pressed={place >= 0}
              onClick={() => tap(i)}
            >
              {place >= 0 && <span className={s.badge} aria-hidden>{place + 1}</span>}
              {w}
            </button>
          )
        })}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={order.length === ex.words.length} />
    </section>
  )
}
