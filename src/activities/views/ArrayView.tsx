/* Exercise view "array": r rows × c columns of objects. Tap the objects to count, then write the total.
   With `mirror`, after a correct answer the array turns over (rows ↔ columns) to show the mirror rule. */
import { useState, type CSSProperties } from 'react'
import type { ArrayExercise, ExerciseViewProps } from '@/types'
import { useActivityHost } from '@/activities/host'
import { NumberInput } from '@/ink'
import { sfx } from '@/audio'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './ArrayView.module.css'

export interface ArrayViewProps extends ExerciseViewProps {
  /** After a correct answer, turn the array over and show that the total does not change. */
  mirror?: boolean
}

export default function ArrayView(props: ArrayViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, mirror } = props
  if (exercise.kind !== 'array') return null
  return (
    <ArrayRound
      key={exercise.id}
      ex={exercise}
      onAnswered={onAnswered}
      guided={guided}
      allowHints={allowHints}
      showFeedback={showFeedback}
      compact={compact}
      mirror={mirror}
    />
  )
}

interface RoundProps extends Omit<ArrayViewProps, 'exercise'> {
  ex: ArrayExercise
}

function ArrayRound({ ex, onAnswered, guided, allowHints = true, showFeedback = true, compact, mirror }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const [counted, setCounted] = useState<Set<number>>(() => new Set())
  const [turned, setTurned] = useState(false)
  const [turnKey, setTurnKey] = useState(0)

  const rows = turned ? ex.cols : ex.rows
  const cols = turned ? ex.rows : ex.cols
  const cells = Array.from({ length: ex.rows * ex.cols }, (_, i) => i)
  const orderIndex = (i: number) => {
    // Index of the cell in the currently displayed grid, reading order (rows × cols of the view).
    const r = Math.floor(i / ex.cols)
    const c = i % ex.cols
    return turned ? c * ex.rows + r : i
  }
  const cellsInView = turned
    ? cells.slice().sort((a, b) => orderIndex(a) - orderIndex(b))
    : cells

  const toggle = (i: number) => {
    setCounted((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else {
        next.add(i)
        sfx.play('tap', { volume: 0.5 })
      }
      return next
    })
  }

  const submitValue = (v: number) => {
    const c = flow.submit({ type: 'number', value: v })
    if (!c.correct) return
    celebrate('small')
    if (mirror) {
      setTurned(true)
      setTurnKey((k) => k + 1)
    }
  }
  const check = () => {
    if (value !== null) submitValue(value)
  }
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="Filas y columnas">
      <p className={s.prompt}>
        {host.t(`Hay ${ex.rows} filas de ${ex.cols}. ¿Cuántos ${ex.emoji} hay en total?`)}
      </p>
      {guided && <p className={s.guide}>{host.t('Cuenta por filas: cada fila tiene lo mismo.')}</p>}

      <div className={s.stage}>
        {/* A plain group of toggle buttons: each object is a button with aria-pressed (counted or not). The name is
            its position in the grid on screen, so it never changes when the child counts it. */}
        <div key={turnKey} className={`${s.grid} ${turned ? s.turned : ''}`} role="group" aria-label={`${rows} filas de ${cols}`}
          style={{ '--cols': cols, '--rows': rows } as CSSProperties}>
          {cellsInView.map((i, k) => {
            const on = counted.has(i)
            const row = Math.floor(k / cols) + 1
            const col = (k % cols) + 1
            return (
              <button
                key={i}
                type="button"
                className={`${s.tile} ${on ? s.on : ''}`}
                onClick={() => toggle(i)}
                aria-pressed={on}
                aria-label={`${ex.emoji}, fila ${row}, columna ${col}`}
                style={{ animationDelay: `${turned ? orderIndex(i) * 30 : 0}ms` }}
              >
                <span aria-hidden>{ex.emoji}</span>
              </button>
            )
          })}
        </div>
        <p className={s.dims}>
          {host.t(`${rows} filas × ${cols} columnas`)}
        </p>
      </div>

      {/* No running count: the child counts (better, by rows); the marks only show which ones are done. */}

      {turned && flow.result?.correct && (
        <p className={s.mirrorNote}>
          {host.t(`¡Mira! Al girarlo sigue habiendo ${ex.answer}. ¡Es la regla del espejo!`)}
        </p>
      )}

      <div className={s.answer}>
        <span className={s.answerLabel} aria-hidden>{`${rows} × ${cols} =`}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => {
            setValue(v)
            if (v !== null) submitValue(v)
          }}
          maxDigits={3}
          size="lg"
          status={status}
          ariaLabel={`Resultado de ${rows} × ${cols}`}
          placeholder="?"
        />
      </div>

      <AnswerBar flow={flow} onCheck={check} canCheck={value !== null} />
    </section>
  )
}
