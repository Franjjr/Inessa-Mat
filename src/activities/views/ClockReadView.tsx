/* clock:read — reads an analogue clock. Early (mode 'phrase'): the child picks the phrase that says the time among
   three, the two wrong ones mix up the hour or the minutes. Later (mode 'write'): the hour and the minutes are written.
   The face shows no digits for the time; the answer is never said or printed while the child looks at the hands. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { ClockReadExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { ClockFace, TimeFields, capitalize } from './Clock'
import s from './clock.module.css'

export default function ClockReadView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'clock-read') return null
  return <ReadRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ReadRound({ ex, onAnswered, showFeedback, allowHints }: { ex: ClockReadExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [choice, setChoice] = useState<number | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [minute, setMinute] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const done = flow.result?.correct === true

  const submitChoice = (index: number | null = choice) => {
    if (index === null) return
    const c = flow.submit({ type: 'choice', index })
    if (c.correct) celebrate('small')
  }
  const submitTime = (h: number | null = hour, m: number | null = minute) => {
    const c = flow.submit({ type: 'time', hour: h, minute: m })
    if (c.correct) celebrate('small')
  }

  const canCheck = ex.mode === 'phrase' ? choice !== null : hour !== null && minute !== null

  return (
    <section className={s.view} aria-label="Leer el reloj" data-kind={ex.kind} data-mode={ex.mode} data-status={status}>
      <p className={s.instructions}>
        {ex.mode === 'phrase' ? '¿Qué hora marca el reloj? Elige la frase.' : '¿Qué hora marca el reloj? Escribe la hora y los minutos.'}
      </p>
      <div className={s.row}>
        <ClockFace time={{ hour: ex.hour, minute: ex.minute }} label="Reloj: lee la hora" />
      </div>

      {ex.mode === 'phrase' ? (
        <div className={s.phrases} role="group" aria-label="Frases">
          {ex.options.map((text, i) => (
            <button
              key={text}
              type="button"
              className={clsx(s.phraseBtn, choice === i && s.phraseOn)}
              aria-pressed={choice === i}
              onClick={() => { if (!done) setChoice(i) }}
            >
              {capitalize(text)}
            </button>
          ))}
        </div>
      ) : (
        <TimeFields
          hour={hour}
          minute={minute}
          onHour={setHour}
          onMinute={setMinute}
          status={status}
          onSubmit={(h, m) => { setMinute(m); if (!flow.submitted) submitTime(h, m) }}
          autoFocus
        />
      )}

      <AnswerBar
        flow={flow}
        onCheck={() => (ex.mode === 'phrase' ? submitChoice() : submitTime())}
        canCheck={canCheck}
      />
    </section>
  )
}
