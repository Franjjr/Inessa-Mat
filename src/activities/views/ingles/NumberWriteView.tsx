/* Inglés de 3.º, escribir un número en inglés (eng-num-write): the digits are shown big; the child types the English word
   with the letter keyboard. «twenty-one» and «twenty one» both count (compareEnglish). */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { EngNumWriteExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { statusOf, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function NumberWriteView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-num-write') return null
  return <NumberWriteRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function NumberWriteRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngNumWriteExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState('')
  const locked = flow.result?.correct === true
  useSayRight(flow.result, ex.answer)

  const submit = () => {
    if (!value.trim()) return
    const c = flow.submit({ type: 'text', value })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Escribir el número en inglés" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Escribe este número en inglés</p>
      <div className={s.digits} aria-label={`Número ${ex.value}`}>{ex.value}</div>
      <div className={s.typedFrame}>
        <TextInput
          className={s.typed}
          value={value}
          onChange={setValue}
          onSubmit={submit}
          maxLength={40}
          ariaLabel="Escribe el número en inglés"
          placeholder="Escribe aquí"
          autoFocus
          disabled={locked}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={value.trim().length > 0} />
    </section>
  )
}
