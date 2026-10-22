/* Fracciones de una cantidad (fraction-of). Drawing first: the objects are in equal groups and the child counts the
   groups that the fraction asks for. Then numbers: the calculation alone, sometimes in a short story. */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt, fractionName } from '@/engine'
import type { ExerciseViewProps, FractionOfExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './FractionsGeometry.module.css'

export default function FractionOfView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'fraction-of') return null
  return <OfRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

/** Columns of the groups: a row of up to four, so the groups stay big on a tablet. */
const columnsFor = (d: number) => (d <= 4 ? d : d <= 6 ? 3 : 4)

function OfRound({ ex, onAnswered, showFeedback, allowHints }: { ex: FractionOfExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const name = fractionName(ex.numerator, ex.denominator)
  const perGroup = ex.total / ex.denominator

  const submit = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  const answerBox = (
    <NumberInput
      value={value}
      onChange={setValue}
      onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
      maxDigits={3}
      size="lg"
      status={status}
      ariaLabel="Cuántos son"
      placeholder="?"
      autoFocus
    />
  )

  if (ex.mode === 'drawing') {
    return (
      <section className={s.view} aria-label="Fracción de una cantidad" data-kind={ex.kind} data-mode="drawing" data-status={status}>
        <p className={s.prompt}>¿Cuántos objetos hay en los grupos de color?</p>
        <p className={s.instructions}>
          Hay {fmt(ex.total)} objetos repartidos en {ex.denominator} grupos iguales. Los grupos de color son {name} del total.
        </p>
        <div className={s.groups} style={{ gridTemplateColumns: `repeat(${columnsFor(ex.denominator)}, minmax(0, 1fr))` }}>
          {Array.from({ length: ex.denominator }, (_, g) => {
            const on = g < ex.numerator
            return (
              <div key={g} className={clsx(s.group, on && s.groupOn)} data-group={on ? 'on' : 'off'} aria-label={on ? 'Grupo de color' : 'Grupo sin color'}>
                {Array.from({ length: perGroup }, (_, k) => (
                  <span key={k} aria-hidden>{ex.emoji}</span>
                ))}
              </div>
            )
          })}
        </div>
        <div className={s.inputRow}>{answerBox}</div>
        <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
      </section>
    )
  }

  return (
    <section className={s.view} aria-label="Fracción de una cantidad" data-kind={ex.kind} data-mode="numbers" data-status={status}>
      <p className={s.prompt}>{ex.story ?? `¿Cuánto es ${name} de ${fmt(ex.total)}?`}</p>
      <div className={s.fractionRow}>
        <div className={s.fractionEntry}>
          <span className={s.bigText}>{ex.numerator}</span>
          <span className={s.fractionBar} aria-hidden />
          <span className={s.bigText}>{ex.denominator}</span>
        </div>
        <span className={s.bigText}>de {fmt(ex.total)} =</span>
        {answerBox}
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </section>
  )
}
