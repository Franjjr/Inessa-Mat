/* Décimas y centésimas (4.º, decimal-op): a sum or a difference written in a column with the commas one under the other.
   The result is written in cells: the whole part, then one box per decimal place. An empty centésimas box counts as 0.
   One «Comprobar» for all the boxes. */
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
  const [tenths, setTenths] = useState<number | null>(null)
  const [hund, setHund] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const add = ex.op === 'add'
  const sign = add ? '+' : '−'

  const submit = (w: number | null, t: number | null, h: number | null) => {
    if (w === null || t === null) return
    const c = flow.submit({ type: 'numbers', values: [w, t, ex.places === 2 ? h : null] })
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
          onSubmit={(v) => { setWhole(v); if (!flow.submitted) submit(v, tenths, hund) }}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Parte entera del resultado"
          checkButton={false}
          placeholder="?"
          autoFocus
        />
        <span className={d.comma} aria-hidden>,</span>
        <div className={d.cells}>
          <NumberInput
            value={tenths}
            onChange={setTenths}
            onSubmit={(v) => { setTenths(v); if (!flow.submitted) submit(whole, v, hund) }}
            maxDigits={1}
            size="lg"
            status={status}
            ariaLabel="Décimas del resultado"
            checkButton={false}
            placeholder="?"
          />
          {ex.places === 2 && (
            <NumberInput
              value={hund}
              onChange={setHund}
              onSubmit={(v) => { setHund(v); if (!flow.submitted) submit(whole, tenths, v) }}
              maxDigits={1}
              size="lg"
              status={status}
              ariaLabel="Centésimas del resultado"
              checkButton={false}
              placeholder="0"
            />
          )}
        </div>
      </div>
      <AnswerBar flow={flow} onCheck={() => submit(whole, tenths, hund)} canCheck={whole !== null && tenths !== null} />
    </section>
  )
}
