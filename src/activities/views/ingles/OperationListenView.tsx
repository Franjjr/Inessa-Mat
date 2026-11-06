/* Inglés de 3.º, oír una operación (eng-op-listen): the English voice says «three plus four»; the child writes the result
   with the same number input as the maths views. The operation is never written before the answer. */
import { useState } from 'react'
import { celebrate } from '@/fx'
import { numberToEnglish } from '@/engine'
import { NumberInput } from '@/ink'
import type { EngOpListenExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { ListenControl } from './shared'
import { statusOf, useListening, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function OperationListenView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-op-listen') return null
  return <OperationListenRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function OperationListenRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngOpListenExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const listen = useListening(ex.spoken, ex.id)
  const [draft, setDraft] = useState<number | null>(null)
  const status = statusOf(flow.result)
  // A wrong result says the right one in English («seven»).
  useSayRight(flow.result, numberToEnglish(ex.answer))

  const submit = (v: number | null) => {
    if (v === null || flow.submitted) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Escuchar la operación" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Escucha la operación y escribe el resultado</p>
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
          ariaLabel="Resultado de la operación"
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit(draft)} canCheck={draft !== null} />
    </section>
  )
}
