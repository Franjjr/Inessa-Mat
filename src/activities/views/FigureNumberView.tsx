/* A figure and a number to write: the perimeter (drawing with the side lengths, or a garden story), the count of sides
   or corners of a polygon (geo:poly:sides), and the área in squares of a figure on a grid (geo:area). */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import type { AreaExercise, ExerciseViewProps, PerimeterExercise, ShapeCountExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { FigureSvg } from './FigureSvg'
import s from './FractionsGeometry.module.css'

export default function FigureNumberView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'perimeter' && exercise.kind !== 'shape-count' && exercise.kind !== 'area') return null
  return <NumberRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function NumberRound({ ex, onAnswered, showFeedback, allowHints }: { ex: PerimeterExercise | ShapeCountExercise | AreaExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const isPerimeter = ex.kind === 'perimeter'
  const story = isPerimeter && ex.mode === 'story'

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  const isArea = ex.kind === 'area'
  const prompt = isPerimeter
    ? (ex.mode === 'story' && ex.text ? ex.text : '¿Cuánto mide el contorno de la figura? Suma la medida de todos los lados.')
    : isArea ? '¿Cuántos cuadraditos ocupa la figura de color? Esa es su área.'
      : (ex.ask === 'sides' ? '¿Cuántos lados tiene la figura?' : '¿Cuántas esquinas tiene la figura?')

  return (
    <section className={s.view} aria-label={isPerimeter ? 'Perímetro' : isArea ? 'Área' : 'Contar lados'} data-kind={ex.kind} data-status={status}>
      <p className={s.prompt} style={story ? { fontSize: 'var(--fs-lg)', textAlign: 'left' } : undefined}>{prompt}</p>
      <div className={s.figureBox}>
        <FigureSvg
          figure={ex.kind === 'area' ? ex.figure : { ...ex.figure, labels: isPerimeter && ex.mode === 'drawing' ? ex.figure.labels : undefined }}
          label={isPerimeter ? 'Figura con la medida de sus lados' : isArea ? 'Figura en una cuadrícula' : 'Figura'}
          className={s.figure}
        />
      </div>
      <div className={s.inputRow}>
        {/* The unit goes before the box: after it would sit beside the pad's own ✓ button. */}
        {isPerimeter && <span className={s.unitLabel}>En {ex.unit === 'm' ? 'metros' : ex.unit === 'cm' ? 'centímetros' : ex.unit}:</span>}
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={isPerimeter ? 4 : isArea ? 2 : 1}
          size="lg"
          status={status}
          ariaLabel={isPerimeter ? 'Medida del contorno' : isArea ? 'Cuadraditos' : 'Número'}
          placeholder="?"
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </section>
  )
}
