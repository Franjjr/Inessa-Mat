/* Compare two numbers up to 9 999 (num:compare): the child taps <, > or =. Big tappable signs, no typing. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { fmt } from '@/engine'
import type { CompareExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { RETRY_WRONG_CLASS, useRetryChoice, useRetryFlow, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

type Sign = '<' | '>' | '='

const SIGNS: { sign: Sign; label: string }[] = [
  { sign: '<', label: 'menor que' },
  { sign: '=', label: 'igual a' },
  { sign: '>', label: 'mayor que' },
]

export default function CompareView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'compare') return null
  return <CompareRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

function CompareRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: CompareExercise; onAnswered: ExerciseViewProps['onAnswered']; showFeedback: boolean; allowHints: boolean; retry?: RetryProps }) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the sign the child picked, soft red until she changes it.
  const again = useRetryChoice<Sign>(retry, (a) => (a.type === 'sign' && a.sign !== '≠' ? a.sign : null), ex.answer)
  const [picked, setPicked] = useState<Sign | null>(again.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const submit = () => {
    if (!picked) return
    const c = flow.submit({ type: 'sign', sign: picked })
    if (c.correct) celebrate('small')
  }

  return (
    <ExerciseLayout workClassName={s.view} aria-label="Comparar números" data-kind={ex.kind} data-status={status} prompt={'¿Qué signo va entre los dos números?'} actions={<AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />}>
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
            className={clsx(s.signBtn, picked === o.sign && s.signOn, again.marked(o.sign, picked, !!flow.result) && RETRY_WRONG_CLASS)}
            onClick={() => { if (!flow.result?.correct) setPicked(o.sign) }}
            aria-pressed={picked === o.sign}
            aria-label={o.label}
          >
            {o.sign}
          </button>
        ))}
      </div>
    </ExerciseLayout>
  )
}
