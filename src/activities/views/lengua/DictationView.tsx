/* Lengua de 3.º, dictado (lng-dictation): the app says a word or a short sentence (the speech service, TTS) and the child
   writes it. The text is never shown on the screen before the answer. «🔊 Escuchar» always speaks when the child presses
   it (R16: an explicit press uses speech.say with force, so the automatic voice setting does not block it). With the voice
   setting on, the sentence is also read once when the exercise opens. With the sound setting off, the button is replaced
   by «Activa el sonido para hacer el dictado»; with no Spanish voice on the device (R27) by a short request to read it aloud.
   A sentence is compared with 'exact' (capitals and marks count); a single word ignores its capital (see dictationRule). */
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
  // Without a Spanish voice on this device nothing can be heard: the view says so (R27) and never shows the text.
  const soundOn = (child?.settings.sound ?? true) && speech.available()
  const [value, setValue] = useState('')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const locked = flow.result?.correct === true

  // The automatic reading (voice setting on) happens once when the exercise opens. A press always speaks (R16).
  useEffect(() => {
    if (voiceOn && soundOn) void speech.say(ex.answer, { interrupt: true }).catch(() => undefined)
  }, [ex.id, ex.answer, voiceOn, soundOn])
  const say = () => { void speech.say(ex.answer, { interrupt: true, force: true }).catch(() => undefined) }

  const submit = () => {
    if (!value.trim()) return
    const c = flow.submit({ type: 'text', value })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Dictado" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>Escucha y escribe lo que oigas</p>
      <div className={s.listen}>
        {soundOn ? (
          <Button variant="secondary" size="lg" onClick={say}>🔊 Escuchar</Button>
        ) : (
          <p className={s.prompt}>{child?.settings.sound === false ? 'Activa el sonido para hacer el dictado' : 'Este aparato no tiene voz: pide a alguien que lea la frase en voz alta'}</p>
        )}
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
