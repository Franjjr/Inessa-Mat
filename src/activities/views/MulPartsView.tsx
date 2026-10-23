/* Multiplicar por dos cifras por partes (mul-parts, 4.º): 23 × 14 is 23 × 4 and 23 × 10, then their sum. Three writing
   pads, one per line, and a single «Comprobar» at the end (no ✓ beside each pad). */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { ExerciseViewProps, MulPartsExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import g from './FractionsGeometry.module.css'
import s from './DataViews.module.css'

export default function MulPartsView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'mul-parts') return null
  return <PartsRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

type Values = [number | null, number | null, number | null]

function PartsRound({ ex, onAnswered, showFeedback, allowHints }: { ex: MulPartsExercise } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const [values, setValues] = useState<Values>([null, null, null])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const ready = values.every((v) => v !== null)
  const set = (i: number, v: number | null) => setValues((cur) => cur.map((x, k) => (k === i ? v : x)) as Values)
  const submit = (vs: Values = values) => {
    if (!vs.every((v) => v !== null)) return
    if (flow.submit({ type: 'numbers', values: vs }).correct) celebrate('small')
  }
  const lines = [
    { label: `${fmt(ex.top)} × ${ex.units} =`, aria: `${ex.top} por ${ex.units}` },
    { label: `${fmt(ex.top)} × ${ex.tens} =`, aria: `${ex.top} por ${ex.tens}` },
    { label: 'Suma las dos partes:', aria: 'La suma' },
  ]
  return (
    <section className={g.view} aria-label="Multiplicar por partes" data-kind="mul-parts" data-status={status}>
      <p className={g.prompt}>{fmt(ex.top)} × {ex.bottom} = ?</p>
      <p className={s.title}>Parte el {ex.bottom} en {ex.tens} y {ex.units}: multiplica cada parte y suma.</p>
      <div className={s.partsList}>
        {lines.map((l, i) => (
          <div key={i} className={s.partsRow}>
            <span className={s.partsLabel}>{l.label}</span>
            <NumberInput
              value={values[i]}
              onChange={(v) => set(i, v)}
              onSubmit={(v) => {
                const next = values.map((x, k) => (k === i ? v : x)) as Values
                setValues(next)
                if (i === 2 && !flow.submitted) submit(next)
              }}
              maxDigits={5}
              size="md"
              status={status}
              ariaLabel={l.aria}
              checkButton={false}
              placeholder="?"
              autoFocus={i === 0}
            />
          </div>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={ready} />
    </section>
  )
}
