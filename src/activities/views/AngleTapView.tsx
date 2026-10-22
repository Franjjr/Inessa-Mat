/* Right angles (angle-tap): tap the corners of the figure that are right angles. Each corner is a big target. */
import { useState } from 'react'
import type { AngleTapExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { celebrate } from '@/fx'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'

export default function AngleTapView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'angle-tap') return null
  return <TapRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function TapRound({ ex, onAnswered, showFeedback, allowHints }: { ex: AngleTapExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [marked, setMarked] = useState<number[]>([])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = !!flow.result?.correct

  const toggle = (i: number) => {
    if (locked) return
    setMarked((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))
  }
  const submit = () => {
    const c = flow.submit({ type: 'marks', marked })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Ángulos rectos" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Toca las esquinas que son ángulos rectos.</p>
      <p className={s.instructions}>Un ángulo recto encaja justo en la esquina de una hoja de papel.</p>
      <div className={s.figureBox}>
        <FigureSvg
          figure={ex.figure}
          label="Figura: toca las esquinas rectas"
          corners={{ marked, onTap: toggle }}
          className={s.figure}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck />
    </section>
  )
}
