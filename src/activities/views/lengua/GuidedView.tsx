/* Lengua de 3.º, escritura guiada corta (lng-guided): a short text (an invitation, a note, a letter, a description) with a
   blank for each question. The child writes the blanks one at a time; the text is composed and checked once at the end.
   The exercise is completion only: the answer is not graded (ExerciseStep reports it with graded: false). */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import { Button } from '@/ui'
import type { ExerciseViewProps, LngGuidedExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function GuidedView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-guided') return null
  return <GuidedRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

/** The text with each blank filled: parts[i] comes before blank i, and the last part closes the text. */
const composeGuided = (parts: string[], values: string[]) => parts.map((p, i) => `${p}${values[i] ?? ''}`).join('')

function GuidedRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngGuidedExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [values, setValues] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true
  const blanks = ex.prompts.length
  const writing = values.length < blanks
  const current = values.length

  const keep = () => {
    const v = draft.trim().replace(/\s+/g, ' ')
    if (!v || !writing) return
    setValues((vs) => [...vs, v])
    setDraft('')
  }
  const submit = () => {
    if (writing) return
    const c = flow.submit({ type: 'text', value: composeGuided(ex.parts, values) })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Escritura guiada" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{ex.task}</p>
      <div className={s.card + ' ' + s.sentenceCard + ' ' + s.guidedText} aria-label="Texto con huecos">
        {ex.parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks && (
              <span className={clsx(s.blank, i < values.length ? s.blankFilled : i === current ? s.blankOpen : s.blankEmpty)}>
                {i < values.length ? values[i] : i === current ? (draft.trim() || '…') : '…'}
              </span>
            )}
          </span>
        ))}
      </div>
      {writing && <p className={s.guidedQuestion}>{ex.prompts[current]}</p>}
      {writing && !locked && (
        <div className={s.typedFrame}>
          <TextInput
            className={s.typed}
            value={draft}
            onChange={setDraft}
            onSubmit={keep}
            maxLength={60}
            ariaLabel={`Hueco ${current + 1} de ${blanks}: ${ex.prompts[current]}`}
            placeholder="Escribe aquí"
            autoFocus
          />
        </div>
      )}
      {writing && !locked && (
        <div className={s.listen}>
          <Button variant="secondary" size="lg" onClick={keep} disabled={!draft.trim()}>
            Siguiente hueco →
          </Button>
        </div>
      )}
      <AnswerBar flow={flow} onCheck={submit} canCheck={!writing} />
    </section>
  )
}
