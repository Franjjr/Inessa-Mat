/* Ordinales (3.º, num:ordinal:*). row: a queue of alike objects with the exit arrow at the start; the child taps the n-th
   (counting from the exit). read: the numeral is shown and the child picks its word. write: the word is shown and the child
   picks the numeral. Big buttons, no typing, like the shape-choice views. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, OrdinalExercise } from '@/types'
import { ordinalPrompt } from '@/engine'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './OrdinalView.module.css'

export default function OrdinalView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'ordinal') return null
  return <OrdinalRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function OrdinalRound({ ex, onAnswered, showFeedback, allowHints }: { ex: OrdinalExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = () => {
    if (picked === null) return
    const c = flow.submit({ type: 'choice', index: picked })
    if (c.correct) celebrate('small')
  }

  const choose = (i: number) => { if (!flow.result?.correct) setPicked(i) }

  return (
    <section className={s.view} aria-label="Ordinales" data-kind={ex.kind} data-mode={ex.mode} data-status={status}>
      <p className={s.prompt}>{ordinalPrompt(ex)}</p>
      {ex.mode === 'row' ? (
        <div className={s.row} role="group" aria-label="Fila">
          <span className={s.exit} aria-hidden="true">Salida →</span>
          {ex.items.map((item, i) => (
            <button
              key={i}
              type="button"
              className={clsx(s.item, picked === i && s.itemOn)}
              aria-label={`Lugar ${i + 1}`}
              aria-pressed={picked === i}
              onClick={() => choose(i)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : (
        <div className={s.optionGrid} role="group" aria-label="Respuestas">
          {ex.options.map((o, i) => (
            <button
              key={i}
              type="button"
              className={clsx(s.option, picked === i && s.optionOn)}
              aria-pressed={picked === i}
              onClick={() => choose(i)}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </section>
  )
}
