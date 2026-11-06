/* Inglés de 3.º, completar la frase (eng-complete): a sentence with a gap; the child taps the word that fits (three options).
   The gap shows the word the child picked. A wrong answer says the whole right sentence in English. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { EngCompleteExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { statusOf, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function CompleteView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-complete') return null
  return <CompleteRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function CompleteRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngCompleteExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const locked = flow.result?.correct === true
  const [before, after = ''] = ex.sentence.split('___')
  const right = ex.sentence.replace('___', ex.options[ex.answer])
  useSayRight(flow.result, right)

  const submit = () => {
    if (picked === null) return
    const c = flow.submit({ type: 'choice', index: picked })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Completar la frase" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Elige la palabra que completa la frase</p>
      {ex.es && <p className={s.cue} lang="es">{ex.es}</p>}
      <p className={s.sentence} aria-label={`Frase: ${ex.sentence}`}>
        <span>{before}</span>
        <span className={clsx(s.gap, picked !== null && s.gapFilled)}>{picked === null ? '___' : ex.options[picked]}</span>
        <span>{after}</span>
      </p>
      <div className={s.options} role="group" aria-label="Palabras">
        {ex.options.map((o, i) => (
          <button
            key={o}
            type="button"
            className={clsx(s.option, picked === i && s.optionOn)}
            aria-pressed={picked === i}
            onClick={() => { if (!locked) setPicked(i) }}
          >
            {o}
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </section>
  )
}
