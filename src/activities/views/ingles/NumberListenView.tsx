/* Inglés de 3.º, oír un número (eng-num-listen): the English voice says the number; the child writes the digits with the
   same number input as the maths views (NumberInput: pen or keypad). The number is never written before the answer. */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { NumberInput } from '@/ink'
import type { EngNumListenExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { ListenControl } from './shared'
import { statusOf, useListening, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function NumberListenView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-num-listen') return null
  return <NumberListenRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function NumberListenRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngNumListenExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const listen = useListening(ex.spoken, ex.id)
  const [draft, setDraft] = useState<number | null>(null)
  const status = statusOf(flow.result)
  useSayRight(flow.result, ex.spoken)

  const submit = (v: number | null) => {
    if (v === null || flow.submitted) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Escuchar el número" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Escucha el número y escríbelo con cifras</p>
      <div className={s.listen}>
        <ListenControl soundOn={listen.soundOn} soundSetting={listen.soundSetting} again={listen.again} />
      </div>
      <div className={s.numberRow}>
        <NumberInput
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          maxDigits={3}
          size="lg"
          status={status}
          autoFocus
          ariaLabel="Número que oyes"
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit(draft)} canCheck={draft !== null} />
    </section>
  )
}
