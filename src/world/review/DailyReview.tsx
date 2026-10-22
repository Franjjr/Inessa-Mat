/* Daily review: a short spaced-repetition session (what is due today, from @/engine) played through the real
   exercise views. Used as the 'review' node of a world and from the Repaso route. Friendly when nothing is due. */
import { useEffect, useState } from 'react'
import { useActivityHost } from '@/activities'
import { createRng, starsFor } from '@/engine'
import { useActiveChild, useMastery, useProgress } from '@/data'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { StarIcon } from '@/art'
import { Button, Screen, Spinner } from '@/ui'
import type { DailyReviewProps } from '@/world/contracts'
import type { Exercise } from '@/types'
import { ExerciseStep } from './ExerciseStep'
import { buildReviewSession, seedFrom } from './logic'
import s from './DailyReview.module.css'

export default function DailyReview(props: DailyReviewProps) {
  return (
    <GameHostProvider>
      <ReviewSession {...props} />
    </GameHostProvider>
  )
}

type Phase = 'playing' | 'done'

function ReviewSession({ onDone, onExit }: DailyReviewProps) {
  const host = useActivityHost()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')

  // The plan is made once per visit: live mastery updates must not reshuffle the session under the child.
  useEffect(() => {
    if (exercises || !child || !progress || !mastery) return
    const now = new Date()
    const rng = createRng(seedFrom(`${child.id}:${now.toDateString()}`))
    setExercises(buildReviewSession({ child, progress, mastery, now, rng }).exercises)
  }, [child, progress, mastery, exercises])

  if (loading || !child || !exercises) {
    return <Spinner label="Preparando el repaso…" />
  }

  const title = (
    <header className={s.header}>
      {onExit && phase === 'playing' && exercises.length > 0 && (
        <Button variant="secondary" size="sm" onClick={onExit}>Salir</Button>
      )}
      <h1 className={s.headerTitle}>Repaso de hoy</h1>
    </header>
  )

  if (exercises.length === 0) {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {title}
        <div className={s.stage}>
          <div className={s.calm}>
            <h2 className={s.title}>{childText(child, '¡Hoy no tienes repasos pendientes, {child}!')}</h2>
            <p className={s.text}>
              {childText(child, 'Todo lo que has aprendido está fresquito. Vuelve otro día o sigue tu aventura con Lumi.')}
            </p>
            <div className={s.actions}>
              <Button size="lg" onClick={() => (onExit ? onExit() : onDone({ correct: 0, total: 0, stars: 0 }))}>
                Volver
              </Button>
            </div>
          </div>
        </div>
      </Screen>
    )
  }

  const total = exercises.length

  if (phase === 'done') {
    const stars = starsFor(correct, total)
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {title}
        <div className={s.stage}>
          <div className={s.calm}>
            <div className={s.stars} aria-label={`${stars} de 3 estrellas`}>
              {[0, 1, 2].map((i) => (
                <StarIcon key={i} size={64} filled={i < stars} />
              ))}
            </div>
            <h2 className={s.title}>{childText(child, '¡Repaso terminado, {child}!')}</h2>
            <p className={s.text}>{host.t(`Has acertado ${correct} de ${total}. ¡Cada repaso te hace más fuerte!`)}</p>
            <div className={s.actions}>
              <Button size="lg" variant="success" onClick={() => onDone({ correct, total, stars })}>
                {childText(child, 'Continuar')}
              </Button>
            </div>
          </div>
        </div>
      </Screen>
    )
  }

  const current = exercises[index]
  return (
    <Screen background="var(--c-bg)" className={s.root}>
      {title}
      <div className={s.dots} aria-label={`Ejercicio ${index + 1} de ${total}`}>
        {exercises.map((e, i) => (
          <span
            key={e.id}
            className={`${s.dot} ${i < index ? s.dotDone : ''} ${i === index ? s.dotCurrent : ''}`}
          />
        ))}
      </div>
      <div className={s.stage}>
        <div className={s.card}>
          <ExerciseStep
            key={current.id}
            exercise={current}
            allowHints
            okLabel={index + 1 < total ? 'Siguiente' : 'Ver mi resultado'}
            wrongLabel={index + 1 < total ? 'Siguiente' : 'Ver mi resultado'}
            onContinue={(o) => {
              const nextCorrect = correct + (o.check.correct ? 1 : 0)
              setCorrect(nextCorrect)
              if (index + 1 < total) {
                setIndex(index + 1)
              } else {
                setPhase('done')
              }
            }}
          />
        </div>
      </div>
    </Screen>
  )
}
