/* Lengua de 3.º, lectura: one text (a story, a poem or a riddle) in paragraphs at a comfortable reading size. «🔊 Escuchar»
   reads it paragraph by paragraph (the speech service, one paragraph after another); each press speaks with force, so the
   explicit press works even when the automatic voice is off (R16, as in the dictation). With the sound setting off the button
   is replaced by a line that says so. «Siguiente» goes to the questions: each one is an ExerciseStep, reported as an attempt
   with the question's skill. The text can be read again from the questions, folded under «Leer el texto otra vez». */
import { useEffect, useMemo, useRef, useState } from 'react'
import { speech } from '@/audio'
import { useActiveChild } from '@/data'
import { renderTemplate, templateContext } from '@/content/template'
import { Button, Screen } from '@/ui'
import { readingExercise } from '@/engine/lengua/reading'
import type { ChildProfile, ReadingDef } from '@/types'
import { ExerciseStep } from '../review/ExerciseStep'
import { GameHostProvider } from '../host/GameHost'
import s from './ReadingScreen.module.css'

export interface ReadingScreenProps {
  reading: ReadingDef
  /** The child has answered every question (or the reading has no question). */
  onDone: () => void
}

export function ReadingScreen(props: ReadingScreenProps) {
  return (
    <GameHostProvider>
      <ReadingBody {...props} />
    </GameHostProvider>
  )
}

function ReadingBody({ reading, onDone }: ReadingScreenProps) {
  const { child } = useActiveChild()
  const soundOn = child?.settings.sound ?? true
  const [phase, setPhase] = useState<'read' | 'questions'>('read')
  const [index, setIndex] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  /** Each press of «Escuchar» starts a new run; the older run stops at its next paragraph. */
  const run = useRef(0)

  // Without a child loaded, the defaults of the template apply (the same as the rest of the app).
  const ctx = useMemo(() => templateContext(child ?? ({} as ChildProfile)), [child])
  const paragraphs = useMemo(() => reading.text.map((p) => renderTemplate(p, ctx)), [reading, ctx])
  // The questions never change with the child: the same reading gives the same exercises (and the same order of events).
  const exercises = useMemo(
    () => reading.questions.map((_, i) => readingExercise(reading, i)),
    [reading],
  )

  // Leaving the screen stops the voice.
  useEffect(() => () => {
    run.current += 1
    speech.stop()
  }, [])

  const listen = () => {
    const mine = ++run.current
    setSpeaking(true)
    void (async () => {
      for (let i = 0; i < paragraphs.length; i++) {
        if (run.current !== mine) return
        await speech.say(paragraphs[i], { interrupt: i === 0, force: true })
      }
      if (run.current === mine) setSpeaking(false)
    })().catch(() => setSpeaking(false))
  }

  const next = (answered: number) => {
    if (answered + 1 < exercises.length) setIndex(answered + 1)
    else onDone()
  }

  if (phase === 'read') {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        <article className={s.card} aria-label={reading.title}>
          <h1 className={s.title}>{reading.title}</h1>
          <div className={s.text}>
            {paragraphs.map((p, i) => (
              <p key={i} className={s.paragraph}>{p}</p>
            ))}
          </div>
          <div className={s.actions}>
            {soundOn ? (
              <Button variant="secondary" size="lg" onClick={listen}>
                {speaking ? '🔊 Escuchando…' : '🔊 Escuchar'}
              </Button>
            ) : (
              <p className={s.note}>Activa el sonido para escuchar el texto</p>
            )}
            <Button variant="primary" size="lg" onClick={() => setPhase('questions')}>Siguiente</Button>
          </div>
        </article>
      </Screen>
    )
  }

  const total = exercises.length
  const current = exercises[index]
  return (
    <Screen background="var(--c-bg)" className={s.root}>
      <div className={s.card}>
        <p className={s.progress} aria-label={`Pregunta ${index + 1} de ${total}`}>
          Pregunta {index + 1} de {total}
        </p>
        <details className={s.reread}>
          <summary>Leer el texto otra vez</summary>
          <div className={s.text}>
            {paragraphs.map((p, i) => (
              <p key={i} className={s.paragraph}>{p}</p>
            ))}
          </div>
        </details>
        <ExerciseStep
          key={current.id}
          exercise={current}
          allowHints
          allowRetry
          allowDontKnow
          okLabel={index + 1 < total ? 'Siguiente' : 'Terminar'}
          wrongLabel={index + 1 < total ? 'Siguiente' : 'Terminar'}
          onContinue={() => next(index)}
        />
      </div>
    </Screen>
  )
}

export default ReadingScreen
