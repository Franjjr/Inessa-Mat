/* Lengua de 3.º, clasificar una palabra (lng-classify): the word is shown big and the child picks one of the two or three
   options (común o propio, masculino o femenino, singular o plural, presente, pasado o futuro). Big buttons, no typing. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, LngClassifyExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function ClassifyView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-classify') return null
  return <ClassifyRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ClassifyRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngClassifyExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = () => {
    if (picked === null) return
    const c = flow.submit({ type: 'choice', index: picked })
    if (c.correct) celebrate('small')
  }
  const choose = (i: number) => { if (!flow.result?.correct) setPicked(i) }

  return (
    <section className={s.view} aria-label="Clasificar la palabra" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{ex.question}</p>
      <div className={s.card} aria-label={`Palabra: ${ex.word}`}>{ex.word}</div>
      <div className={s.options} role="group" aria-label="Respuestas">
        {ex.options.map((o, i) => (
          <button
            key={o}
            type="button"
            className={clsx(s.option, picked === i && s.optionOn)}
            aria-pressed={picked === i}
            onClick={() => choose(i)}
          >
            {o}
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </section>
  )
}
