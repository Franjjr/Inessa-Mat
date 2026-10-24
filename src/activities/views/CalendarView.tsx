/* cal:weekday, cal:month, time:units and time:seconds — the days of the week, the months, the units of time and the
   minutes↔seconds conversions.
   weekday: a week strip (today marked) and four day choices; month: the twelve months with the one asked about marked,
   and the number of days written; units: a chip with the amount and its unit, and the number written; seconds: the
   question in words (a chip for minutes to seconds), and the number written. */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { WEEKDAYS } from '@/engine'
import type { CalendarExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './clock.module.css'

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export default function CalendarView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'calendar') return null
  return <CalRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

/** «1 hora», «2 horas», «1 día», «2 días»: the amount with its unit. */
const unitLabel = (amount: number, unit: string) => (amount === 1 ? `1 ${unit}` : `${amount} ${unit}s`)

function CalRound({ ex, onAnswered, showFeedback, allowHints }: { ex: CalendarExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [choice, setChoice] = useState<number | null>(null)
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const done = flow.result?.correct === true

  const submitChoice = () => {
    if (choice === null) return
    const c = flow.submit({ type: 'choice', index: choice })
    if (c.correct) celebrate('small')
  }
  const submitNumber = (v: number | null = value) => {
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  if (ex.topic === 'weekday' && ex.week) {
    return (
      <section className={s.view} aria-label="Días de la semana" data-kind={ex.kind} data-topic={ex.topic} data-status={status}>
        <p className={s.instructions}>{ex.prompt}</p>
        <div className={s.week} role="group" aria-label="Semana">
          {WEEKDAYS.map((d, i) => (
            <span key={d} className={clsx(s.day, i === ex.week!.today && s.dayToday)}>
              {d}
            </span>
          ))}
        </div>
        <div className={s.choices} role="group" aria-label="Día">
          {ex.options.map((text, i) => (
            <button
              key={text}
              type="button"
              className={clsx(s.choiceBtn, choice === i && s.phraseOn)}
              aria-pressed={choice === i}
              onClick={() => { if (!done) setChoice(i) }}
            >
              {text}
            </button>
          ))}
        </div>
        <AnswerBar flow={flow} onCheck={submitChoice} canCheck={choice !== null} />
      </section>
    )
  }

  if (ex.topic === 'month') {
    return (
      <section className={s.view} aria-label="Días de un mes" data-kind={ex.kind} data-topic={ex.topic} data-status={status}>
        <p className={s.instructions}>{ex.prompt}</p>
        <div className={s.months} role="group" aria-label="Meses del año">
          {MONTH_NAMES.map((m) => (
            <span key={m} className={clsx(s.month, m === ex.month && s.monthOn)}>{m}</span>
          ))}
        </div>
        <div className={s.answerNumber}>
          <span className={s.fieldLabel}>Días</span>
          <NumberInput
            value={value}
            onChange={setValue}
            onSubmit={(v) => { setValue(v); if (!flow.submitted) submitNumber(v) }}
            maxDigits={2}
            size="lg"
            status={status}
            ariaLabel="Días del mes"
            placeholder="?"
            keypadToggle={false}
            autoFocus
          />
        </div>
        <AnswerBar flow={flow} onCheck={() => submitNumber()} canCheck={value !== null} />
      </section>
    )
  }

  const u = ex.units
  return (
    <section className={s.view} aria-label="Unidades de tiempo" data-kind={ex.kind} data-topic="units" data-status={status}>
      <p className={s.instructions}>{ex.prompt}</p>
      {u && (
        <div className={s.units}>
          <span className={s.card}><span className={s.cardNumber}>{unitLabel(u.amount, u.from)}</span></span>
          <span className={s.arrow} aria-hidden>→</span>
          <span className={s.card}><span className={s.cardNumber}>¿? {u.to}</span></span>
        </div>
      )}
      <div className={s.answerNumber}>
        <span className={s.fieldLabel}>{u?.to ?? 'Número'}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submitNumber(v) }}
          maxDigits={3}
          size="lg"
          status={status}
          ariaLabel="Cuántas"
          placeholder="?"
          keypadToggle={false}
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submitNumber()} canCheck={value !== null} />
    </section>
  )
}
