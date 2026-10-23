/* Fracciones: read the fraction that is coloured (fraction-read). The child writes the number of coloured parts above a
   bar and the number of equal parts below it. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, FractionReadExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'

export default function FractionReadView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'fraction-read') return null
  return <ReadRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ReadRound({ ex, onAnswered, showFeedback, allowHints }: { ex: FractionReadExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [top, setTop] = useState<number | null>(null)
  const [bottom, setBottom] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = (n: number | null = top, d: number | null = bottom) => {
    if (n === null || d === null) return
    const c = flow.submit({ type: 'fraction', numerator: n, denominator: d })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Leer fracciones" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>¿Qué fracción está coloreada?</p>
      <p className={s.instructions}>Arriba, las partes de color. Abajo, todas las partes iguales.</p>
      <div className={s.figureBox}>
        <FigureSvg figure={ex.figure} label="Figura con partes de color" className={s.figure} />
      </div>
      <div className={s.fractionEntry}>
        <NumberInput
          value={top}
          onChange={setTop}
          onSubmit={(v) => { setTop(v); if (!flow.submitted) submit(v, bottom) }}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Número de arriba"
          checkButton={false}
          placeholder="?"
          autoFocus
        />
        <span className={s.fractionBar} aria-hidden />
        <NumberInput
          value={bottom}
          onChange={setBottom}
          onSubmit={(v) => { setBottom(v); if (!flow.submitted) submit(top, v) }}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Número de abajo"
          checkButton={false}
          placeholder="?"
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={top !== null && bottom !== null} />
    </section>
  )
}
