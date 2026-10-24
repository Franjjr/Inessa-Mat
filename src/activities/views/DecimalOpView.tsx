/* Décimas y centésimas (4.º, decimal-op): a sum or a difference written in a column with the commas one under the other.
   The result is written in two boxes, the whole part and the decimal part, with the comma fixed between them; in
   centésimas the decimal box fills from the left (a single 5 is 0,50). One «Comprobar» for both boxes. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmtDecimal } from '@/engine'
import type { DecimalOpExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'
import d from './DecimalViews.module.css'

export default function DecimalOpView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'decimal-op') return null
  return <OpRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function OpRound({ ex, onAnswered, showFeedback, allowHints }: { ex: DecimalOpExercise } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const [whole, setWhole] = useState<number | null>(null)
  const [dec, setDec] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const add = ex.op === 'add'
  const sign = add ? '+' : '−'

  const submit = (w: number | null = whole, x: number | null = dec) => {
    if (w === null || x === null) return
    const c = flow.submit({ type: 'numbers', values: [w, x] })
    if (c.correct) celebrate('small')
  }
  const [lw, ld] = fmtDecimal(ex.left, ex.places).split(',')
  const [rw, rd] = fmtDecimal(ex.right, ex.places).split(',')

  return (
    <section className={s.view} aria-label={add ? 'Sumar decimales' : 'Restar decimales'} data-kind={ex.kind} data-status={status}>
      <p className={s.instructions}>{add ? 'Suma. Pon las comas una debajo de otra.' : 'Resta. Pon las comas una debajo de otra.'}</p>
      <div className={d.column}>
        <span />
        <span className={d.whole}>{lw}</span>
        <span className={d.comma} aria-hidden>,</span>
        <span className={d.dec}>{ld}</span>
        <span className={d.op} aria-hidden>{sign}</span>
        <span className={d.whole}>{rw}</span>
        <span className={d.comma} aria-hidden>,</span>
        <span className={d.dec}>{rd}</span>
        <span className={d.rule} aria-hidden />
        <span />
        <NumberInput
          value={whole}
          onChange={setWhole}
          onSubmit={(v) => { setWhole(v); if (!flow.submitted) submit(v, dec) }}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Parte entera del resultado"
          checkButton={false}
          placeholder="?"
          autoFocus
        />
        <span className={d.comma} aria-hidden>,</span>
        <NumberInput
          value={dec}
          onChange={setDec}
          onSubmit={(v) => { setDec(v); if (!flow.submitted) submit(whole, v) }}
          maxDigits={ex.places === 2 ? 2 : 1}
          size="lg"
          status={status}
          ariaLabel="Parte decimal del resultado"
          checkButton={false}
          placeholder="?"
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={whole !== null && dec !== null} />
    </section>
  )
}
