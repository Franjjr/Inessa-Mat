/* Compare two numbers up to 9 999 (num:compare): the child taps <, > or =. Big tappable signs, no typing. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { CompareExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'

type Sign = '<' | '>' | '='

const SIGNS: { sign: Sign; label: string }[] = [
  { sign: '<', label: 'menor que' },
  { sign: '=', label: 'igual a' },
  { sign: '>', label: 'mayor que' },
]

export default function CompareView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'compare') return null
  return <CompareRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function CompareRound({ ex, onAnswered, showFeedback, allowHints }: { ex: CompareExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean }) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [picked, setPicked] = useState<Sign | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = () => {
    if (!picked) return
    const c = flow.submit({ type: 'sign', sign: picked })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Comparar números" data-kind={ex.kind} data-status={status}>
      <p className={s.instructions}>¿Qué signo va entre los dos números?</p>
      <div className={s.row}>
        <span className={s.card}><span className={s.cardNumber}>{fmt(ex.left)}</span></span>
        <span className={s.sign} aria-hidden>{picked ?? '?'}</span>
        <span className={s.card}><span className={s.cardNumber}>{fmt(ex.right)}</span></span>
      </div>
      <div className={s.signPad} role="group" aria-label="Signo">
        {SIGNS.map((o) => (
          <button
            key={o.sign}
            type="button"
            className={clsx(s.signBtn, picked === o.sign && s.signOn)}
            onClick={() => { if (!flow.result?.correct) setPicked(o.sign) }}
            aria-pressed={picked === o.sign}
            aria-label={o.label}
          >
            {o.sign}
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </section>
  )
}
