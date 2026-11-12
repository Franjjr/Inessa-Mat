/* Order 3–4 numbers up to 9 999 (num:order): the child writes them one by one, from the smallest (or the biggest). */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { ExerciseViewProps, OrderExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, useRetryFlow, useRetryWrong, wrongEntries, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function OrderView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'order') return null
  return <OrderRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function OrderRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: OrderExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the numbers the child wrote; the boxes in the wrong place are soft red until she changes them.
  const [before] = useState(() => initialOf(retry, 'numbers')?.values ?? null)
  const wrongBefore = useRetryWrong(retry, () => (before ? wrongEntries(before, ex.answer) : []))
  const [cells, setCells] = useState<(number | null)[]>(() => ex.values.map((_, i) => before?.[i] ?? null))
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  // A box left empty on the last try is not marked: soft red means «está mal», not «te falta».
  const statusOf = (i: number) => (!flow.result && wrongBefore.has(i) && before?.[i] != null && cells[i] === before[i] ? 'wrong' as const : status)
  const asc = ex.direction === 'asc'

  const submit = () => {
    if (cells.some((c) => c === null)) return
    const c = flow.submit({ type: 'numbers', values: cells })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Ordenar números" data-kind={ex.kind} data-direction={ex.direction} prompt={asc ? 'Escribe los números de menor a mayor.' : 'Escribe los números de mayor a menor.'} actions={<AnswerBar flow={flow} onCheck={submit} canCheck={cells.every((c) => c !== null)} />}>
      <div className={s.row} aria-label="Números para ordenar">
        {ex.values.map((v) => (
          <span key={v} className={s.card}><span className={s.cardNumber}>{fmt(v)}</span></span>
        ))}
      </div>
      <div className={s.row} role="group" aria-label="Orden">
        {ex.values.map((_, i) => (
          <span key={i} className={s.row}>
            {i > 0 && <span className={s.sign} aria-hidden>{asc ? '<' : '>'}</span>}
            <NumberInput
              value={cells[i]}
              onChange={(v) => setCells((prev) => prev.map((c, k) => (k === i ? v : c)))}
              onSubmit={() => submit()}
              maxDigits={Math.max(4, String(Math.max(...ex.answer)).length)}
              size="lg"
              status={statusOf(i)}
              ariaLabel={`${i + 1}.º número`}
              placeholder="?"
              autoFocus={i === 0}
            />
          </span>
        ))}
      </div>
    </ExerciseLayout>
  )
}
