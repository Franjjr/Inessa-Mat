/* Subtraction on the number line (saltos): count forward from the subtrahend up to the minuend. The child writes
   where each jump lands (round numbers) and how far she has jumped in total. */
import { useMemo, useState } from 'react'
import type { ColumnSubExercise, ExerciseViewProps } from '@/types'
import { digitCount, hintsFor, lineStops } from '@/engine'
import { CellGroup } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { SubStepNumber, focusOrder, numberOf } from './SubStepNumber'
import s from './SubStepViews.module.css'

export default function SubLineView(props: ExerciseViewProps) {
  const { exercise, onAnswered, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'column-sub') return null
  return (
    <LineRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
  )
}

interface RoundProps {
  ex: ColumnSubExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
}

function LineRound({ ex, onAnswered, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const stops = useMemo(() => lineStops(ex.subtrahend, ex.minuend), [ex])
  const width = digitCount(ex.minuend)
  const hints = useMemo(() => hintsFor(ex, 'line'), [ex])
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, hints, method: 'line' })
  const [lands, setLands] = useState<(number | null)[][]>(() => stops.map(() => Array.from({ length: width }, () => null)))
  const [total, setTotal] = useState<(number | null)[]>(() => Array.from({ length: width }, () => null))
  const landValues = lands.map((d) => numberOf(d))
  const totalValue = numberOf(total)
  const order = useMemo(() => focusOrder([...stops.map((_, k) => `l${k}-`), 't-'], width), [stops, width])

  const check = () => {
    if (!landValues.some((v) => v !== null) && totalValue === null) return
    const c = flow.submit({ type: 'steps', method: 'line', values: landValues, total: totalValue })
    if (c.correct) celebrate('small')
  }

  const setLand = (k: number, i: number, d: number | null) =>
    setLands((prev) => prev.map((row, r) => (r === k ? row.map((v, j) => (j === i ? d : v)) : row)))

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="Resta con saltos en la recta">
      <p className={s.prompt}>{host.t(`Cuenta hacia delante desde ${ex.subtrahend} hasta ${ex.minuend}. Salta a números redondos.`)}</p>
      <CellGroup order={order} onSubmit={check} keypadPosition="below" keypadToggle>
        <ol className={s.jumps}>
          {stops.map((_, k) => {
            const from = k === 0 ? ex.subtrahend : landValues[k - 1]
            return (
              <li key={k} className={s.jump}>
                <span className={s.landing}>{from ?? '…'}</span>
                <span className={s.arrow} aria-hidden>→ salto hasta</span>
                <SubStepNumber prefix={`l${k}-`} width={width} digits={lands[k]} onDigit={(i, d) => setLand(k, i, d)} label={`salto ${k + 1}`} />
              </li>
            )
          })}
          <li className={s.jump}>
            <span className={s.landing}>{stops.length ? landValues[stops.length - 1] ?? '…' : ex.subtrahend}</span>
            <span className={s.arrow} aria-hidden>→ último salto hasta</span>
            <span className={s.chip}>{ex.minuend}</span>
          </li>
        </ol>
        <div className={s.total}>
          <span>{host.t('Total que has saltado:')}</span>
          <SubStepNumber prefix="t-" width={width} digits={total} onDigit={(i, d) => setTotal((prev) => prev.map((v, j) => (j === i ? d : v)))} label="total saltado" />
        </div>
      </CellGroup>
      <AnswerBar flow={flow} onCheck={check} canCheck={landValues.some((v) => v !== null) || totalValue !== null} />
    </section>
  )
}
