/* clock:convert:day — digital 24 h time ↔ the phrase with mañana, tarde or noche.
   to-digital: the phrase is shown and the child writes the 24 h time (two boxes).
   to-phrase: the 24 h time is shown and the child picks the phrase among three (the wrong ones change the period or the hour). */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { digital } from '@/engine'
import type { ExerciseViewProps, TimeConvertExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { TimeFields, capitalize } from './Clock'
import s from './clock.module.css'

export default function TimeConvertView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'time-convert') return null
  return <ConvertRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ConvertRound({ ex, onAnswered, showFeedback, allowHints }: { ex: TimeConvertExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [choice, setChoice] = useState<number | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [minute, setMinute] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const done = flow.result?.correct === true

  const submitChoice = () => {
    if (choice === null) return
    const c = flow.submit({ type: 'choice', index: choice })
    if (c.correct) celebrate('small')
  }
  const submitTime = (h: number | null = hour, m: number | null = minute) => {
    const c = flow.submit({ type: 'time', hour: h, minute: m })
    if (c.correct) celebrate('small')
  }

  if (ex.direction === 'to-phrase') {
    return (
      <section className={s.view} aria-label="Hora digital y frase" data-kind={ex.kind} data-direction={ex.direction} data-status={status}>
        <p className={s.instructions}>¿Qué frase dice esta hora?</p>
        <div className={s.row}>
          <div className={s.card}>
            <span className={s.digital} aria-label={`Hora digital ${digital(ex.answer.hour, ex.answer.minute)}`}>{digital(ex.answer.hour, ex.answer.minute)}</span>
          </div>
        </div>
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
        <AnswerBar flow={flow} onCheck={submitChoice} canCheck={choice !== null} />
      </section>
    )
  }

  return (
    <section className={s.view} aria-label="Escribir la hora digital" data-kind={ex.kind} data-direction={ex.direction} data-status={status}>
      <p className={s.instructions}>Escribe esta hora con números, como en un reloj digital de 24 horas.</p>
      <div className={s.row}>
        <div className={s.card}>
          <span className={s.target}>{capitalize(ex.phrase)}</span>
        </div>
      </div>
      <TimeFields
        hour={hour}
        minute={minute}
        onHour={setHour}
        onMinute={setMinute}
        status={status}
        onSubmit={(h, m) => { setMinute(m); if (!flow.submitted) submitTime(h, m) }}
        autoFocus
      />
      <AnswerBar flow={flow} onCheck={() => submitTime()} canCheck={hour !== null && minute !== null} />
    </section>
  )
}
