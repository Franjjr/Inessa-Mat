/* Lengua de 3.º, lectura y literatura (lng-read-choice, lng-read-text, lng-read-order): one question of a text. The choice
   shows whole sentences the child taps; the text is a word the child writes (compared with 'ignore-case'); the order taps
   the events of the text in the order they happen (the first tapped is the first). The text itself is read on the reading
   screen (src/world/lengua/ReadingScreen.tsx), not here. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { TextInput } from '@/ink/TextInput'
import type { ExerciseViewProps, LngReadChoiceExercise, LngReadOrderExercise, LngReadTextExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

type ReadingEx = LngReadChoiceExercise | LngReadTextExercise | LngReadOrderExercise

export default function ReadingView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-read-choice' && exercise.kind !== 'lng-read-text' && exercise.kind !== 'lng-read-order') return null
  return <ReadingRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ReadingRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: ReadingEx
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const [order, setOrder] = useState<number[]>([])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  const submit = () => {
    let c = null
    if (ex.kind === 'lng-read-text') {
      if (value.trim()) c = flow.submit({ type: 'text', value })
    } else if (ex.kind === 'lng-read-choice') {
      if (picked !== null) c = flow.submit({ type: 'choice', index: picked })
    } else {
      c = flow.submit({ type: 'marks', marked: order })
    }
    if (c?.correct) celebrate('small')
  }

  const tapEvent = (i: number) => {
    if (locked) return
    setOrder((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))
  }

  const canCheck = ex.kind === 'lng-read-text'
    ? value.trim().length > 0
    : ex.kind === 'lng-read-choice' ? picked !== null : order.length === ex.events.length

  return (
    <section className={s.view} aria-label="Pregunta del texto" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{ex.question}</p>
      {ex.kind === 'lng-read-choice' && (
        <div className={s.readOptions} role="group" aria-label="Respuestas">
          {ex.options.map((o, i) => (
            <button
              key={o}
              type="button"
              className={clsx(s.readOption, picked === i && s.readOptionOn)}
              aria-pressed={picked === i}
              onClick={() => { if (!locked) setPicked(i) }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {ex.kind === 'lng-read-text' && (
        <div className={s.typedFrame}>
          <TextInput
            className={s.typed}
            value={value}
            onChange={setValue}
            onSubmit={submit}
            maxLength={40}
            ariaLabel="Escribe la palabra"
            placeholder="Escribe aquí"
            autoFocus
            disabled={locked}
          />
        </div>
      )}
      {ex.kind === 'lng-read-order' && (
        <div className={s.readOptions} role="group" aria-label="Frases">
          {ex.events.map((w, i) => {
            const place = order.indexOf(i)
            return (
              <button
                key={w}
                type="button"
                className={clsx(s.readOption, place >= 0 && s.readOptionOn)}
                aria-pressed={place >= 0}
                onClick={() => tapEvent(i)}
              >
                {place >= 0 && <span className={s.badge} aria-hidden>{place + 1}</span>}
                {w}
              </button>
            )
          })}
        </div>
      )}
      <AnswerBar flow={flow} onCheck={submit} canCheck={canCheck} />
    </section>
  )
}
