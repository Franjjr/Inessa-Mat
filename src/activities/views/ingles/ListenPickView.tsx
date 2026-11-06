/* Inglés de 3.º, oír y tocar (eng-listen-pick): the English voice says a word, the child taps its picture among three or
   four cards. The word is never written before the answer. The cards are numbered for the reader, not named. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { EngListenPickExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { ListenControl, PictureFace } from './shared'
import { statusOf, useListening, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function ListenPickView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-listen-pick') return null
  return <ListenPickRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ListenPickRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngListenPickExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const listen = useListening(ex.word, ex.id)
  const [picked, setPicked] = useState<number | null>(null)
  const locked = flow.result?.correct === true
  useSayRight(flow.result, ex.word)

  const submit = () => {
    if (picked === null) return
    const c = flow.submit({ type: 'choice', index: picked })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Escuchar y tocar" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Escucha la palabra y toca su dibujo</p>
      <div className={s.listen}>
        <ListenControl soundOn={listen.soundOn} soundSetting={listen.soundSetting} again={listen.again} />
      </div>
      <div className={s.cards} role="group" aria-label="Dibujos">
        {ex.cards.map((card, i) => (
          <button
            key={i}
            type="button"
            className={clsx(s.pictureCard, picked === i && s.optionOn, flow.result && !flow.result.correct && i === ex.answer && s.pictureRight)}
            aria-pressed={picked === i}
            aria-label={`Dibujo ${i + 1}`}
            onClick={() => { if (!locked) setPicked(i) }}
          >
            <PictureFace card={card} />
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </section>
  )
}
