/* Number line with jumps of 10, 100 or 1 000 (num:line:*). Tick mode: a mark is missing and the child writes it.
   Jump mode: the child starts from a point and jumps one step; the child writes where it lands.
   The answer box never sits among the labels of the line (P3PE-09): the empty mark shows «?» and the box goes under
   the line, right below that mark, joined to it by an arrow. The box has no ✓ of its own: «Comprobar» is the one check. */
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { ExerciseViewProps, NumberLineExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function NumberLineView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'number-line') return null
  return <LineRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function LineRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: NumberLineExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const again = useRetryNumber(retry, ex.answer)
  const [value, setValue] = useState<number | null>(again.first)
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
      maxDigits={Math.max(4, String(last).length)}
      size="lg"
      status={again.marked(value, !!flow.result) ? 'wrong' : status}
      ariaLabel={isJump ? 'Adónde caes' : 'Marca que falta'}
      placeholder="?"
      checkButton={false}
      autoFocus
    />
  )

  return (
    <ExerciseLayout
      workClassName={s.view}
      aria-label="Recta numérica"
      data-kind={ex.kind}
      data-mode={ex.mode}
      prompt={isJump ? `Salta ${fmt(ex.step)} ${word}. ¿En qué número caes?` : '¿Qué número va en la marca del «?»?'}
      sub={isJump ? undefined : `Las marcas van de ${fmt(ex.step)} en ${fmt(ex.step)}.`}
      actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}
    >

      {isJump && ex.start !== null && (
        <div className={s.row} aria-label={`Empiezas en ${fmt(ex.start)}`}>
          <span className={s.jumpLabel}>Empiezas en {fmt(ex.start)}</span>
        </div>
      )}

      <div className={s.line} role="group" aria-label="Recta">
        {ex.ticks.map((t, i) => {
          const blank = !isJump && i === ex.blank
          const pct = ((t - first) / span) * 100
          return (
            <div key={t} className={s.tick} data-pos={Math.round(pct)}>
              {blank ? <span className={s.tickBlank} aria-label="Marca vacía">?</span> : <span className={s.tickLabel}>{fmt(t)}</span>}
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

      {!isJump && ex.blank !== null && (
        <div className={s.lineAnswer} data-line-answer="">
          {ex.ticks.map((t, i) => (
            <div
              key={t}
              className={s.lineAnswerCell}
              style={i === ex.blank ? { justifyContent: i === 0 ? 'flex-start' : i === ex.ticks.length - 1 ? 'flex-end' : 'center' } : undefined}
            >
              {i === ex.blank && (
                <div className={s.lineAnswerBox}>
                  <span className={s.lineArrow} aria-hidden>↑</span>
                  {answerBox}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isJump && (
        <div className={s.row}>
          <span className={s.sign}>Caes en</span>
          {answerBox}
        </div>
      )}

    </ExerciseLayout>
  )
}
