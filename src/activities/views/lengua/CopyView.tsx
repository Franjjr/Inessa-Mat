/* Lengua de 3.º, copiar una frase (lng-copy): the sentence stays on the card and the child writes it again with the letter
   keyboard or a physical one. Compared with 'exact' (capitals and marks count), as a dictation is. */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { ExerciseViewProps, LngCopyExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function CopyView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-copy') return null
  return <CopyRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function CopyRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngCopyExercise
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
    <section className={s.view} aria-label="Copiar una frase" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Copia la frase con el teclado</p>
      <div className={s.card + ' ' + s.sentenceCard} aria-label={`Frase para copiar: ${ex.answer}`}>{ex.answer}</div>
      <div className={s.typedFrame}>
        <TextInput
          className={s.typed}
          value={value}
          onChange={setValue}
          onSubmit={submit}
          maxLength={120}
          ariaLabel="Escribe la frase"
          placeholder="Escribe aquí"
          autoFocus
          disabled={locked}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={value.trim().length > 0} />
    </section>
  )
}
