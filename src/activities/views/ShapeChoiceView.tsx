/* Shapes and fractions with options (shape-choice): a figure, a question, and the answer among the options (big
   buttons, no typing). Used for names of polygons, lines, angles, circles, solids, fraction names and comparisons, and for
   the word problems «¿tiene sentido?» (word:sense), which have no figure. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, ShapeChoiceExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { ExerciseLayout } from './ExerciseLayout'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'

export default function ShapeChoiceView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'shape-choice') return null
  return <ChoiceRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ChoiceRound({ ex, onAnswered, showFeedback, allowHints }: { ex: ShapeChoiceExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = () => {
    if (picked === null) return
    const c = flow.submit({ type: 'choice', index: picked })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout
      workClassName={s.view}
      aria-label="Elegir la respuesta"
      data-kind={ex.kind}
      data-status={status}
      prompt={ex.question}
      actions={<AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />}
    >
      {ex.figures.length > 0 && (
        <div className={s.figureRow}>
          {ex.figures.map((f, i) => (
            <div key={i} className={s.figureBox}>
              <FigureSvg
                figure={f}
                label={ex.figures.length > 1 ? `Figura ${i + 1}` : 'Figura'}
                // Two fractions to compare stay big (P3PE-05): only three or more figures are drawn small.
                className={`${s.figure} ${ex.figures.length > 2 ? s.figureSmall : ''}`}
                lying={ex.skill === 'geo:solid:roll'}
              />
            </div>
          ))}
        </div>
      )}
      <div className={s.optionGrid} role="group" aria-label="Respuestas">
        {ex.options.map((o, i) => (
          <button
            key={i}
            type="button"
            className={clsx(s.option, picked === i && s.optionOn)}
            aria-pressed={picked === i}
            onClick={() => { if (!flow.result?.correct) setPicked(i) }}
          >
            {o}
          </button>
        ))}
      </div>
    </ExerciseLayout>
  )
}
