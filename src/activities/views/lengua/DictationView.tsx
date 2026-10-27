/* Lengua de 3.º, dictado (lng-dictation): the app says a word or a short sentence (the speech service, TTS) and the child
   writes it. The text is never shown on the screen before the answer: with the voice on the sentence is read when the
   exercise opens and «Repetir» reads it again; with the voice off only «🔊 Escuchar» is shown. A sentence is compared with
   'exact' (capitals and marks count); a single word ignores its capital (see dictationRule). */
import { useEffect, useState } from 'react'
import { speech } from '@/audio'
import { celebrate } from '@/fx'
import { useActiveChild } from '@/data'
import { TextInput } from '@/ink/TextInput'
import { Button } from '@/ui'
import type { ExerciseViewProps, LngDictationExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function DictationView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-dictation') return null
  return <DictationRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function DictationRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngDictationExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const { child } = useActiveChild()
  const voiceOn = child?.settings.voice ?? false
  const [value, setValue] = useState('')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  // The voice reads it once when the exercise opens (only with the voice on); «Repetir» or «Escuchar» reads it again.
  useEffect(() => {
    if (voiceOn) void speech.say(ex.answer, { interrupt: true }).catch(() => undefined)
  }, [ex.id, ex.answer, voiceOn])
  const say = () => { void speech.say(ex.answer, { interrupt: true }).catch(() => undefined) }

  const submit = () => {
    if (!value.trim()) return
    const c = flow.submit({ type: 'text', value })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Dictado" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Escucha y escribe lo que oigas</p>
      <div className={s.listen}>
        <Button variant="secondary" size="lg" onClick={say} aria-label={voiceOn ? 'Repetir' : 'Escuchar'}>
          {voiceOn ? '🔊 Repetir' : '🔊 Escuchar'}
        </Button>
      </div>
      <div className={s.typedFrame}>
        <TextInput
          className={s.typed}
          value={value}
          onChange={setValue}
          onSubmit={submit}
          maxLength={120}
          ariaLabel="Escribe lo que oyes"
          placeholder="Escribe aquí"
          autoFocus
          disabled={locked}
        />
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={value.trim().length > 0} />
    </section>
  )
}
