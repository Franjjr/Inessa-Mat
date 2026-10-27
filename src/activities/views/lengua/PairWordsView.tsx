/* Lengua de 3.º, palabras que se relacionan (lng-pair-words): a question about one word (a synonym, an antonym, a word of
   its family, a compound…). mode 'choice': the child taps one of the options. mode 'text': the child writes the form
   (a diminutive or an augmentative), compared with 'ignore-case' (accents count). */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { ExerciseViewProps, LngPairWordsExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function PairWordsView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-pair-words') return null
  return <PairRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function PairRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngPairWordsExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true
  const text = ex.mode === 'text'

  const submit = () => {
    const c = text
      ? (value.trim() ? flow.submit({ type: 'text', value }) : null)
      : (picked === null ? null : flow.submit({ type: 'choice', index: picked }))
    if (c?.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Relacionar palabras" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{ex.question}</p>
      {text ? (
        <div className={s.typedFrame}>
          <TextInput
            className={s.typed}
            value={value}
            onChange={setValue}
            onSubmit={submit}
            maxLength={30}
            ariaLabel="Escribe la palabra"
            placeholder="Escribe aquí"
            autoFocus
            disabled={locked}
          />
        </div>
      ) : (
        <div className={s.options} role="group" aria-label="Respuestas">
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
      )}
      <AnswerBar flow={flow} onCheck={submit} canCheck={text ? value.trim().length > 0 : picked !== null} />
    </section>
  )
}
