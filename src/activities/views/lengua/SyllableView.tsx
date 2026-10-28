/* Lengua de 3.º, sílabas (lng-stress and lng-syllables). lng-stress: the word is cut into its syllables, each one a button,
   and the child taps the one said with more force. lng-syllables: the word is shown and the child picks how many syllables
   it has (count) or how it is cut (split), from three options. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, LngStressExercise, LngSyllablesExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function SyllableView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-stress' && exercise.kind !== 'lng-syllables') return null
  return <SyllableRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function SyllableRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngStressExercise | LngSyllablesExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  const submit = () => {
    if (picked === null) return
    const c = ex.kind === 'lng-stress' ? flow.submit({ type: 'marks', marked: [picked] }) : flow.submit({ type: 'choice', index: picked })
    if (c.correct) celebrate('small')
  }
  const choose = (i: number) => { if (!locked) setPicked(i) }

  if (ex.kind === 'lng-stress') {
    return (
      <section className={s.view} aria-label="Sílaba fuerte" data-kind={ex.kind} data-status={status}>
        <p className={s.prompt}>Toca la sílaba que se dice con más fuerza</p>
        <div className={s.card} aria-label={`Palabra: ${ex.word}`}>{ex.word}</div>
        <div className={s.sentence} role="group" aria-label="Sílabas">
          {ex.syllables.map((syl, i) => (
            <button
              key={i}
              type="button"
              className={clsx(s.word, s.syllable, picked === i && s.wordOn)}
              aria-pressed={picked === i}
              onClick={() => choose(i)}
            >
              {syl}
            </button>
          ))}
        </div>
        <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
      </section>
    )
  }

  const question = ex.mode === 'count'
    ? `¿Cuántas sílabas tiene «${ex.word}»?`
    : `¿Cómo se separan las sílabas de «${ex.word}»?`
  return (
    <section className={s.view} aria-label="Sílabas" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{question}</p>
      <div className={s.card} aria-label={`Palabra: ${ex.word}`}>{ex.word}</div>
      <div className={s.options} role="group" aria-label="Respuestas">
        {ex.options.map((o, i) => (
          <button
            key={`${o}-${i}`}
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
