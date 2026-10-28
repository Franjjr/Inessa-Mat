/* Lengua de 3.º, los signos de una frase (lng-punctuation): the sentence is shown without its marks (its capitals stay);
   the child writes it again with . , ¿? ¡! on the letter keyboard or a physical one. Compared with 'exact'. */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { ExerciseViewProps, LngPunctuationExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function PunctuationView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-punctuation') return null
  return <PunctuationRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function PunctuationRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngPunctuationExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState('')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  const submit = () => {
    if (!value.trim()) return
    const c = flow.submit({ type: 'text', value })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Poner los signos" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Escribe la frase con sus signos: puntos, comas, ¿? y ¡!</p>
      <div className={s.card + ' ' + s.sentenceCard} aria-label={`Frase: ${ex.bare}`}>{ex.bare}</div>
      <div className={s.typedFrame}>
        <TextInput
          className={s.typed}
          value={value}
          onChange={setValue}
          onSubmit={submit}
          maxLength={80}
          ariaLabel="Escribe la frase con sus signos"
          placeholder="Escribe aquí"
          autoFocus
          disabled={locked}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={value.trim().length > 0} />
    </section>
  )
}
