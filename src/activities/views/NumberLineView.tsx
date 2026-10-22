/* Number line with jumps of 10, 100 or 1 000 (num:line:*). Tick mode: a mark is missing and the child writes it.
   Jump mode: the child starts from a point and jumps one step; the child writes where it lands. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { ExerciseViewProps, NumberLineExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'

export default function NumberLineView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'number-line') return null
  return <LineRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function LineRound({ ex, onAnswered, showFeedback, allowHints }: { ex: NumberLineExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const first = ex.ticks[0]
  const last = ex.ticks[ex.ticks.length - 1]
  const span = last - first || 1
  const isJump = ex.mode === 'jump'
  const word = isJump ? (ex.jump > 0 ? 'hacia la derecha' : 'hacia la izquierda') : ''

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
      maxDigits={4}
      size="lg"
      status={status}
      ariaLabel={isJump ? 'Adónde caes' : 'Marca que falta'}
      placeholder="?"
      autoFocus
    />
  )

  return (
    <section className={s.view} aria-label="Recta numérica" data-kind={ex.kind} data-mode={ex.mode}>
      <p className={s.instructions}>
        {isJump
          ? `Salta ${fmt(ex.step)} ${word}. ¿En qué número caes?`
          : `Las marcas van de ${fmt(ex.step)} en ${fmt(ex.step)}. ¿Qué número va en la marca vacía?`}
      </p>

      {isJump && ex.start !== null && (
        <div className={s.row} aria-label={`Empiezas en ${fmt(ex.start)}`}>
          <span className={s.jumpLabel}>Empiezas en {fmt(ex.start)} · salto {ex.jump > 0 ? '+' : '−'}{fmt(ex.step)}</span>
        </div>
      )}

      <div className={s.line} role="group" aria-label="Recta">
        {ex.ticks.map((t, i) => {
          const blank = !isJump && i === ex.blank
          const pct = ((t - first) / span) * 100
          return (
            <div key={t} className={s.tick} data-pos={Math.round(pct)}>
              {blank ? answerBox : <span className={s.tickLabel}>{fmt(t)}</span>}
              <span className={s.tickMark} aria-hidden />
            </div>
          )
        })}
        {isJump && ex.start !== null && (
          <span
            className={s.start}
            aria-hidden
            style={{ position: 'absolute', left: `calc(${((ex.start - first) / span) * 100}% )`, bottom: 'calc(var(--sp-4) + 6px)' }}
          />
        )}
      </div>

      {isJump && (
        <div className={s.row}>
          <span className={s.sign}>Caes en</span>
          {answerBox}
        </div>
      )}

      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </section>
  )
}
