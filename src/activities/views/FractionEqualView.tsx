/* Fracciones: tap the figures that are NOT split into equal parts (fraction-equal). */
import clsx from 'clsx'
import { useState } from 'react'
import type { ExerciseViewProps, FractionEqualExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'

export default function FractionEqualView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'fraction-equal') return null
  return <EqualRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function EqualRound({ ex, onAnswered, showFeedback, allowHints }: { ex: FractionEqualExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [marked, setMarked] = useState<number[]>([])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = !!flow.result?.correct

  const toggle = (i: number) => {
    if (locked) return
    setMarked((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))
  }

  const submit = () => {
    flow.submit({ type: 'marks', marked })
  }

  return (
    <section className={s.view} aria-label="Figuras partidas en partes iguales" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Toca las figuras que NO están partidas en partes iguales.</p>
      <div className={s.figureRow}>
        {ex.figures.map((f, i) => {
          const on = marked.includes(i)
          return (
            <button
              key={i}
              type="button"
              className={clsx(s.figureCard, on && s.figureCardOn)}
              aria-pressed={on}
              aria-label={`Figura ${i + 1}`}
              onClick={() => toggle(i)}
            >
              <FigureSvg figure={f} label={`Figura ${i + 1}`} className={`${s.figure} ${s.figureSmall}`} />
            </button>
          )
        })}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={marked.length > 0} />
    </section>
  )
}
