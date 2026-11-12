/* Multiplicar por dos cifras por partes (mul-parts, 4.º): 23 × 14 is 23 × 4 and 23 × 10, then their sum. It explains
   why the column multiplication works; to practise, the app uses the column (long-mul). Three writing pads, one per
   line, and a single «Comprobar» at the end (no ✓ beside each pad). The total is the answer: checkMulParts lets it
   decide, so «Comprobar» needs only the total and a right total is right even with the parts left empty. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { ExerciseViewProps, MulPartsExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { ExerciseLayout } from './ExerciseLayout'
import s from './DataViews.module.css'

export default function MulPartsView({ exercise, onAnswered, showFeedback = true, allowHints = true, initialAnswer, wrongColumns }: ExerciseViewProps) {
  if (exercise.kind !== 'mul-parts') return null
  return <PartsRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} initialAnswer={initialAnswer} wrongColumns={wrongColumns} />
}

type Values = [number | null, number | null, number | null]

function PartsRound({ ex, onAnswered, showFeedback, allowHints, initialAnswer, wrongColumns }: { ex: MulPartsExercise } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints' | 'initialAnswer' | 'wrongColumns'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  // «Inténtalo otra vez»: the lines start with what she wrote on the previous try.
  const [values, setValues] = useState<Values>(() => {
    const given = initialAnswer?.type === 'numbers' ? initialAnswer.values : []
    return [0, 1, 2].map((i) => (typeof given[i] === 'number' ? given[i] : null)) as Values
  })
  const expectedAt = [ex.top * ex.units, ex.top * ex.tens, ex.top * ex.bottom]
  // The lines marked wrong: the ones the corrector named, or (when it named none) the ones that differ from the product.
  // A line stops being marked as soon as she changes it.
  const [touched, setTouched] = useState<boolean[]>([false, false, false])
  const markedWrong = (i: number) => !touched[i] && values[i] !== null && !!initialAnswer
    && (wrongColumns && wrongColumns.length ? wrongColumns.includes(i) : values[i] !== expectedAt[i])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const statusAt = (i: number) => (markedWrong(i) && status === 'idle' ? 'wrong' : status)
  // The total decides (checkMulParts): the parts help, they are never required.
  const ready = values[2] !== null
  const set = (i: number, v: number | null) => {
    setTouched((cur) => cur.map((x, k) => (k === i ? true : x)))
    setValues((cur) => cur.map((x, k) => (k === i ? v : x)) as Values)
  }
  const submit = (vs: Values = values) => {
    if (vs[2] === null) return
    if (flow.submit({ type: 'numbers', values: vs }).correct) celebrate('small')
  }
  const lines = [
    { label: `${fmt(ex.top)} × ${ex.units} =`, aria: `${ex.top} por ${ex.units}` },
    { label: `${fmt(ex.top)} × ${ex.tens} =`, aria: `${ex.top} por ${ex.tens}` },
    { label: 'Suma =', aria: 'La suma' },
  ]
  const eg = ex.top === 21 && ex.bottom === 13 ? { top: 31, units: 2, tens: 10 } : { top: 21, units: 3, tens: 10 }
  return (
    <ExerciseLayout
      aria-label="Multiplicar por partes"
      data-kind="mul-parts"
      data-status={status}
      prompt={`${fmt(ex.top)} × ${ex.bottom} = ?`}
      sub={`Parte el ${ex.bottom} en ${ex.tens} y ${ex.units}: multiplica cada parte y suma. Ejemplo: ${eg.top} × ${eg.units + eg.tens} = ${eg.top} × ${eg.units} + ${eg.top} × ${eg.tens} = ${eg.top * eg.units} + ${eg.top * eg.tens} = ${eg.top * (eg.units + eg.tens)}.`}
      actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={ready} />}
      workClassName={s.partsList}
    >
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
              status={statusAt(i)}
              ariaLabel={l.aria}
              checkButton={false}
              placeholder="?"
              autoFocus={i === 0}
            />
          </div>
        ))}
    </ExerciseLayout>
  )
}
