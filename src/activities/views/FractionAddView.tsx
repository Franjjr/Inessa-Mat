/* Fracciones (4.º): sumar y restar con el mismo denominador (fraction-add). The operation is written as on paper, with
   the bars above it in drawing mode (two bars to join, or one to take from); the child writes the result above and
   below the bar, with a single «Comprobar». */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import type { ExerciseViewProps, FractionAddExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function FractionAddView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'fraction-add') return null
  return <AddRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function Fraction({ n, d }: { n: number; d: number }) {
  return (
    <span className={s.fractionStatic} aria-label={`${n} partido por ${d}`}>
      <span aria-hidden>{n}</span>
      <span className={s.fractionStaticBar} aria-hidden />
      <span aria-hidden>{d}</span>
    </span>
  )
}

function AddRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: FractionAddExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the fraction the child wrote; the wrong number is soft red until she changes it.
  const againTop = useRetryNumber(retry, ex.answer, (a) => (a.type === 'fraction' ? a.numerator : null))
  const againBottom = useRetryNumber(retry, ex.denominator, (a) => (a.type === 'fraction' ? a.denominator : null))
  const [top, setTop] = useState<number | null>(againTop.first)
  const [bottom, setBottom] = useState<number | null>(againBottom.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const topStatus = againTop.marked(top, !!flow.result) ? 'wrong' as const : status
  const bottomStatus = againBottom.marked(bottom, !!flow.result) ? 'wrong' as const : status
  const add = ex.op === 'add'
  const sign = add ? '+' : '−'

  const submit = (n: number | null = top, d: number | null = bottom) => {
    if (n === null || d === null) return
    const c = flow.submit({ type: 'fraction', numerator: n, denominator: d })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label={add ? 'Sumar fracciones' : 'Restar fracciones'} data-kind={ex.kind} data-status={status} prompt={add ? 'Suma las fracciones' : 'Resta las fracciones'} actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={top !== null && bottom !== null} />}>
      {ex.figures.length > 0 && (
        <div className={s.figureRow}>
          <FigureSvg figure={ex.figures[0]} label={`Barra con ${ex.a} partes de color`} className={`${s.figure} ${s.figureSmall}`} />
          {ex.figures[1] && <span className={s.opSign} aria-hidden>{sign}</span>}
          {ex.figures[1] && <FigureSvg figure={ex.figures[1]} label={`Barra con ${ex.b} partes de color`} className={`${s.figure} ${s.figureSmall}`} />}
        </div>
      )}
      {!add && ex.figures.length > 0 && (
        <p className={s.instructions}>Quita {ex.b} {ex.b === 1 ? 'parte' : 'partes'} de color. ¿Qué fracción queda?</p>
      )}
      <div className={s.fractionRow}>
        <Fraction n={ex.a} d={ex.denominator} />
        <span className={s.opSign} aria-hidden>{sign}</span>
        <Fraction n={ex.b} d={ex.denominator} />
        <span className={s.opSign} aria-hidden>=</span>
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
      </div>
    </ExerciseLayout>
  )
}
