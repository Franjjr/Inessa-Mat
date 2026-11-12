/* Fracciones: colour the parts (fraction-shade). A figure split in equal parts; the child taps the parts until the
   fraction asked is coloured. No counter of coloured parts: the child counts. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { fractionName } from '@/engine'
import type { ExerciseViewProps, FractionShadeExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, RETRY_WRONG_CLASS, useRetryFlow, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function FractionShadeView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'fraction-shade') return null
  return <ShadeRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function ShadeRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: FractionShadeExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the parts the child coloured. Any parts may make the fraction (only how many counts), so no
  // part is wrong by itself: the figure is soft red until she changes the colouring.
  const [before] = useState(() => initialOf(retry, 'shade')?.chosen ?? null)
  const wrongBefore = useRetryWrong(retry, () => (before ? [0] : []))
  const [chosen, setChosen] = useState<number[]>(() => before?.slice() ?? [])
  const figureMarked = !flow.result && wrongBefore.size > 0 && before !== null && chosen.length === before.length && chosen.every((v, i) => v === before[i])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = !!flow.result?.correct

  const toggle = (i: number) => {
    if (locked) return
    setChosen((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))
  }
  const submit = () => {
    const c = flow.submit({ type: 'shade', chosen })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Colorear fracciones" data-kind={ex.kind} data-status={status} prompt={<>Colorea {fractionName(ex.numerator, ex.denominator)} de la figura.</>} sub={'Toca las partes para colorearlas. Si tocas otra vez, se quita el color.'} actions={<AnswerBar flow={flow} onCheck={submit} canCheck={chosen.length > 0} />}>
      <div className={clsx(s.figureBox, figureMarked && RETRY_WRONG_CLASS)} data-retry-wrong={figureMarked || undefined}>
        <FigureSvg
          figure={ex.figure}
          label={`Figura partida en partes iguales`}
          chosen={chosen}
          onPartTap={toggle}
          className={s.figure}
        />
      </div>
    </ExerciseLayout>
  )
}
