/* Fracciones: read the fraction that is coloured (fraction-read). The child writes the number of coloured parts above a
   bar and the number of equal parts below it. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, FractionReadExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function FractionReadView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'fraction-read') return null
  return <ReadRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function ReadRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: FractionReadExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the fraction the child wrote; the wrong number is soft red until she changes it.
  const againTop = useRetryNumber(retry, ex.numerator, (a) => (a.type === 'fraction' ? a.numerator : null))
  const againBottom = useRetryNumber(retry, ex.denominator, (a) => (a.type === 'fraction' ? a.denominator : null))
  const [top, setTop] = useState<number | null>(againTop.first)
  const [bottom, setBottom] = useState<number | null>(againBottom.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const topStatus = againTop.marked(top, !!flow.result) ? 'wrong' as const : status
  const bottomStatus = againBottom.marked(bottom, !!flow.result) ? 'wrong' as const : status

  const submit = (n: number | null = top, d: number | null = bottom) => {
    if (n === null || d === null) return
    const c = flow.submit({ type: 'fraction', numerator: n, denominator: d })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Leer fracciones" data-kind={ex.kind} data-status={status} prompt={'¿Qué fracción está coloreada?'} sub={'Arriba, las partes de color. Abajo, todas las partes iguales.'} actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={top !== null && bottom !== null} />}>
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
          status={topStatus}
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
          status={bottomStatus}
          ariaLabel="Número de abajo"
          checkButton={false}
          placeholder="?"
        />
      </div>
    </ExerciseLayout>
  )
}
