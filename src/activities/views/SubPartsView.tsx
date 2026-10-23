/* Subtraction by parts (resta por partes): 352 − 127 = 352 − 100 − 20 − 7. The child writes the result after each
   part is taken away. Each step is checked against the one before it, so a slip shows up at the step where it happened. */
import { useMemo, useState } from 'react'
import type { ColumnSubExercise, ExerciseViewProps } from '@/types'
import { digitCount, hintsFor, subtrahendParts } from '@/engine'
import { CellGroup } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { SubStepNumber, focusOrder, numberOf } from './SubStepNumber'
import s from './SubStepViews.module.css'

export default function SubPartsView(props: ExerciseViewProps) {
  const { exercise, onAnswered, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'column-sub') return null
  return (
    <PartsRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
  )
}

interface RoundProps {
  ex: ColumnSubExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
}

function PartsRound({ ex, onAnswered, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const parts = useMemo(() => subtrahendParts(ex.subtrahend), [ex])
  const width = digitCount(ex.minuend)
  const hints = useMemo(() => hintsFor(ex, 'parts'), [ex])
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, hints, method: 'parts' })
  const [cells, setCells] = useState<(number | null)[][]>(() => parts.map(() => Array.from({ length: width }, () => null)))
  const values = cells.map((d) => numberOf(d))
  const order = useMemo(() => focusOrder(parts.map((_, k) => `p${k}-`), width), [parts, width])

  const check = () => {
    if (!values.some((v) => v !== null)) return
    const c = flow.submit({ type: 'steps', method: 'parts', values })
    if (c.correct) celebrate('small')
  }

  const setDigit = (k: number, i: number, d: number | null) =>
    setCells((prev) => prev.map((row, r) => (r === k ? row.map((v, j) => (j === i ? d : v)) : row)))

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="Resta por partes">
      <p className={s.prompt}>{host.t('Resta por partes: quita una parte cada vez.')}</p>
      <p className={s.model}>
        {ex.minuend} − {ex.subtrahend} = {ex.minuend} {parts.map((p) => `− ${p}`).join(' ')}
      </p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <ol className={s.steps}>
          {parts.map((p, k) => {
            const from = k === 0 ? ex.minuend : values[k - 1]
            return (
              <li key={k} className={s.step}>
                <span className={s.from} aria-label={`antes del paso ${k + 1}`}>{from ?? '…'}</span>
                <span className={s.sign} aria-hidden>−</span>
                <span className={s.part}>{p}</span>
                <span className={s.sign} aria-hidden>=</span>
                <SubStepNumber
                  prefix={`p${k}-`}
                  width={width}
                  digits={cells[k]}
                  onDigit={(i, d) => setDigit(k, i, d)}
                  label={`resultado del paso ${k + 1}`}
                />
              </li>
            )
          })}
        </ol>
      </CellGroup>
      <AnswerBar flow={flow} onCheck={check} canCheck={values.some((v) => v !== null)} />
    </section>
  )
}
