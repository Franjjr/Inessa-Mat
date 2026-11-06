/* Inglés de 3.º, escribir la palabra (eng-write-word): the picture (or the Spanish word) and the Spanish word; the child
   types the English word with the letter keyboard (TextInput, as Lengua). compareEnglish: capitals and the hyphen do not
   count, a letter away is «¡Casi!». */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { EngWriteWordExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { PictureFace } from './shared'
import { statusOf, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function WriteWordView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-write-word') return null
  return <WriteWordRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function WriteWordRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngWriteWordExercise
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
    <section className={s.view} aria-label="Escribir la palabra en inglés" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Escribe la palabra en inglés</p>
      <div className={s.card} aria-label={`Palabra: ${ex.card.es}`}>
        <PictureFace card={ex.card} />
        {ex.card.emoji && ex.card.theme !== 'familia' && <span className={s.gloss}>{ex.card.es}</span>}
      </div>
      <div className={s.typedFrame}>
        <TextInput
          className={s.typed}
          value={value}
          onChange={setValue}
          onSubmit={submit}
          maxLength={30}
          ariaLabel="Escribe la palabra en inglés"
          placeholder="Escribe aquí"
          autoFocus
          disabled={locked}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={value.trim().length > 0} />
    </section>
  )
}
