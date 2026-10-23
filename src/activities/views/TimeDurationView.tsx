/* time:end and time:elapsed — durations on a time line of hours. The line starts at the full hour before the start, has a
   tick per hour and a small mark per quarter, so the child counts the way a child counts time (hour by hour, then the
   minutes to the next hour). time:end: the child writes the arrival time (two boxes). time:elapsed: both times are on
   the line and the child writes the minutes that pass. */
import { useState, type CSSProperties } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { clockPhrase, durationWords, faceHour, minutesFace } from '@/engine'
import type { ExerciseViewProps, TimeDurationExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import { TimeFields, capitalize } from './Clock'
import s from './clock.module.css'

export default function TimeDurationView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'time-duration') return null
  return <DurationRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

/** The time line: hour ticks from the full hour before the start, quarter marks, and the start (and end) marks. */
function TimeLine({ start, minutes, end }: { start: { hour: number; minute: number }; minutes: number; end?: { hour: number; minute: number } }) {
  const m0 = start.minute
  const hours = Math.max(1, Math.ceil((m0 + minutes) / 60))
  const total = hours * 60
  const at = (t: number, style: CSSProperties = {}) => ({ ['--pos' as string]: `${(t / total) * 100}%`, ...style }) as CSSProperties
  const quarters = Array.from({ length: hours * 4 + 1 }, (_, i) => i * 15).filter((t) => t % 60 !== 0)
  return (
    <div className={s.track} role="img" aria-label="Recta del tiempo, de hora en hora">
      <div className={s.trackInner}>
      <div className={s.trackLine} />
      {quarters.map((t) => <span key={`q${t}`} className={s.trackTick} style={at(t, { height: 12, top: 46 })} />)}
      {Array.from({ length: hours + 1 }, (_, k) => <span key={`t${k}`} className={s.trackTick} style={at(k * 60)} />)}
      {Array.from({ length: hours + 1 }, (_, k) => (
        <span key={`h${k}`} className={s.trackLabel} style={at(k * 60, { top: 84 })}>{faceHour(start.hour + k)}</span>
      ))}
      <span className={s.trackMark} style={at(m0)} aria-hidden />
      <span className={s.trackMarkLabel} style={at(m0, { top: 8 })}>Salida: {clockPhrase(start.hour, start.minute)}</span>
      {end && (
        <>
          <span className={s.trackMark} style={at(m0 + minutes)} aria-hidden />
          <span className={s.trackMarkLabel} style={at(m0 + minutes, { top: 8 })}>Llegada: {clockPhrase(end.hour, end.minute)}</span>
        </>
      )}
      </div>
    </div>
  )
}

function DurationRound({ ex, onAnswered, showFeedback, allowHints }: { ex: TimeDurationExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [hour, setHour] = useState<number | null>(null)
  const [minute, setMinute] = useState<number | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const startText = clockPhrase(ex.start.hour, ex.start.minute)

  const submitTime = (h: number | null = hour, m: number | null = minute) => {
    const c = flow.submit({ type: 'time', hour: h, minute: m })
    if (c.correct) celebrate('small')
  }
  const submitMinutes = (v: number | null = minutes) => {
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  if (ex.ask === 'end') {
    return (
      <section className={s.view} aria-label="Duración: ¿a qué hora acaba?" data-kind={ex.kind} data-ask={ex.ask} data-status={status}>
        <p className={s.instructions}>
          La película empieza a {startText} y dura {durationWords(ex.duration)}. ¿A qué hora acaba?
        </p>
        <TimeLine start={ex.start} minutes={ex.duration} />
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

  const end = { hour: ex.end.hour, minute: ex.end.minute }
  const elapsed = minutesFace(ex.start, end)
  return (
    <section className={s.view} aria-label="Duración: cuántos minutos pasan" data-kind={ex.kind} data-ask={ex.ask} data-status={status} data-elapsed={elapsed}>
      <p className={s.instructions}>
        {capitalize(`¿Cuántos minutos pasan de ${startText} a ${clockPhrase(end.hour, end.minute)}?`)}
      </p>
      <TimeLine start={ex.start} minutes={ex.duration} end={end} />
      <div className={s.answerNumber}>
        <span className={s.fieldLabel}>Minutos</span>
        <NumberInput
          value={minutes}
          onChange={setMinutes}
          onSubmit={(v) => { setMinutes(v); if (!flow.submitted) submitMinutes(v) }}
          maxDigits={3}
          size="lg"
          status={status}
          ariaLabel="Minutos que pasan"
          placeholder="?"
          keypadToggle={false}
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submitMinutes()} canCheck={minutes !== null} />
    </section>
  )
}
