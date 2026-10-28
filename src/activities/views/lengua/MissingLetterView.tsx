/* Lengua de 3.º, la letra que falta (lng-missing-letter): the word with «_» where the letters go. mode 'choose' (the
   first levels): the child taps the letters (c or qu, g or gu or gü, r or rr, mp or mb, a capital). mode 'type': the child
   writes the whole word with the letter keyboard or a physical one, compared with 'exact' (capitals and accents count). */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { ExerciseViewProps, LngMissingLetterExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function MissingLetterView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-missing-letter') return null
  return <MissingRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function MissingRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngMissingLetterExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true
  const typed = ex.mode === 'type'

  const submit = () => {
    const c = typed ? flow.submit({ type: 'text', value }) : picked === null ? null : flow.submit({ type: 'choice', index: picked })
    if (c?.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Completar la palabra" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{typed ? 'Escribe la palabra completa' : '¿Qué letras faltan?'}</p>
      <div className={clsx(s.card)} aria-label={`Palabra con huecos: ${ex.shown}`}>{ex.shown}</div>
      {typed ? (
        // The phone letter keyboard bleeds 8 px into this frame's padding, so its keys stay inside the card.
        <div className={s.typedFrame}>
          <TextInput
            className={s.typed}
            value={value}
            onChange={setValue}
            onSubmit={submit}
            maxLength={30}
            ariaLabel="Escribe la palabra completa"
            placeholder="Escribe aquí"
            autoFocus
            disabled={locked}
          />
        </div>
      ) : (
        <div className={s.options} role="group" aria-label="Letras">
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
      <AnswerBar flow={flow} onCheck={submit} canCheck={typed ? value.trim().length > 0 : picked !== null} />
    </section>
  )
}
