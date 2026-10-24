/* Order 3–4 numbers up to 9 999 (num:order): the child writes them one by one, from the smallest (or the biggest). */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { ExerciseViewProps, OrderExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'

export default function OrderView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'order') return null
  return <OrderRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function OrderRound({ ex, onAnswered, showFeedback, allowHints }: { ex: OrderExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [cells, setCells] = useState<(number | null)[]>(() => ex.values.map(() => null))
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const asc = ex.direction === 'asc'

  const submit = () => {
    if (cells.some((c) => c === null)) return
    const c = flow.submit({ type: 'numbers', values: cells })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Ordenar números" data-kind={ex.kind} data-direction={ex.direction}>
      <p className={s.instructions}>{asc ? 'Escribe los números de menor a mayor.' : 'Escribe los números de mayor a menor.'}</p>
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
              status={status}
              ariaLabel={`${i + 1}.º número`}
              placeholder="?"
              autoFocus={i === 0}
            />
          </span>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={cells.every((c) => c !== null)} />
    </section>
  )
}
