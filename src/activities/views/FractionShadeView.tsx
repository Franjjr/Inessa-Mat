/* Fracciones: colour the parts (fraction-shade). A figure split in equal parts; the child taps the parts until the
   fraction asked is coloured. No counter of coloured parts: the child counts. */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { fractionName } from '@/engine'
import type { ExerciseViewProps, FractionShadeExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'

export default function FractionShadeView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'fraction-shade') return null
  return <ShadeRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ShadeRound({ ex, onAnswered, showFeedback, allowHints }: { ex: FractionShadeExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [chosen, setChosen] = useState<number[]>([])
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
    <section className={s.view} aria-label="Colorear fracciones" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Colorea {fractionName(ex.numerator, ex.denominator)} de la figura.</p>
      <p className={s.instructions}>Toca las partes para colorearlas. Si tocas otra vez, se quita el color.</p>
      <div className={s.figureBox}>
        <FigureSvg
          figure={ex.figure}
          label={`Figura partida en partes iguales`}
          chosen={chosen}
          onPartTap={toggle}
          className={s.figure}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={chosen.length > 0} />
    </section>
  )
}
