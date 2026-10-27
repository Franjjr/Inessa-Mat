/* Lengua de 3.º, escribir la palabra cambiada (lng-transform): the instruction («Escribe en plural:») and the word, big;
   the child types the changed word with the letter keyboard or a physical one (TextInput). Compared with 'exact':
   capitals and accents count. Enter sends the answer, like «Comprobar». */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { grammarPrompt } from '@/engine'
import { TextInput } from '@/ink/TextInput'
import type { ExerciseViewProps, LngTransformExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function TransformWordView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-transform') return null
  return <TransformRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function TransformRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngTransformExercise
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
    <section className={s.view} aria-label="Escribir la palabra cambiada" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{grammarPrompt(ex)}</p>
      <div className={s.card} aria-label={`Palabra: ${ex.word}`}>{ex.word}</div>
      <TextInput
        className={s.typed}
        value={value}
        onChange={setValue}
        onSubmit={submit}
        maxLength={30}
        ariaLabel="Escribe la palabra cambiada"
        placeholder="Escribe aquí"
        autoFocus
        disabled={locked}
      />
      <AnswerBar flow={flow} onCheck={submit} canCheck={value.trim().length > 0} />
    </section>
  )
}
