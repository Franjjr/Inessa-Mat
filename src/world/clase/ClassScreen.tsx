/* Clase (route /play/clase/:topicId): the lesson of a syllabus topic, with «Ya lo sé» to skip it. «Ya lo sé» gives
   KNOW_IT_COUNT exercises of the topic with no hints, reported as normal attempts: all right → the class is marked done;
   any wrong → the class from its first step. Finishing the lesson marks it done too. Leaving («Salir») marks nothing,
   so a class left half-way starts again next time. Exercises are drawn from the child and the topic, so they stay the
   same during one visit. */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { LessonPlayer } from '@/activities'
import type { ExerciseOutcome } from '@/types'
import { classForTopic, markClassDone, type ClassDef } from '@/content/classes'
import { allTopics, syllabusForGrade, topicTitle, type SyllabusTopic } from '@/content/syllabus'
import { createRng, generate } from '@/engine'
import { updateProgress, useActiveChild } from '@/data'
import { BackButton, Button, Screen, Spinner, toast } from '@/ui'
import { GameHostProvider } from '@/world/host/GameHost'
import { ExerciseStep } from '@/world/review/ExerciseStep'
import { seedFrom } from '@/world/review/logic'
import s from '../session/session.module.css'

export const KNOW_IT_COUNT = 3

type Phase = 'intro' | 'check' | 'vamos' | 'lesson' | 'done'

export default function ClassScreen() {
  const { topicId = '' } = useParams()
  const { child, loading } = useActiveChild()
  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  const topic = allTopics(syllabusForGrade(child.grade)).find((t) => t.id === topicId)
  const cls = classForTopic(topicId, child.grade)
  if (!topic || !cls) return <Navigate to="/play" replace />
  return (
    <GameHostProvider activity="clase">
      <ClassRunner childId={child.id} topic={topic} cls={cls} />
    </GameHostProvider>
  )
}

function ClassRunner({ childId, topic, cls }: { childId: string; topic: SyllabusTopic; cls: ClassDef }) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const exercises = useMemo(
    () => generate({ skills: topic.skills }, KNOW_IT_COUNT, { rng: createRng(seedFrom(`${childId}|${topic.id}`)) }),
    [childId, topic],
  )
  const knowItAvailable = exercises.length >= KNOW_IT_COUNT
  const title = topicTitle(topic)
  const leave = () => navigate('/play')

  const finish = async () => {
    try {
      await updateProgress(childId, (p) => markClassDone(p, cls))
      setPhase('done')
    } catch {
      toast('No hemos podido guardar la clase. Vuelve a intentarlo en un momento.')
      navigate('/play', { replace: true })
    }
  }

  const onKnowItContinue = (o: ExerciseOutcome) => {
    if (!o.check.correct) {
      setPhase('vamos')
      return
    }
    if (index + 1 < exercises.length) {
      setIndex(index + 1)
      return
    }
    void finish()
  }

  if (phase === 'lesson') {
    return <LessonPlayer lesson={cls.lesson} onDone={() => void finish()} onExit={leave} />
  }

  if (phase === 'done') {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        <div className={s.stage}>
          <div className={s.card}>
            <div className={s.intro}>
              <h2 className={s.title}>¡Clase terminada!</h2>
              <div className={s.actions}>
                <Button size="lg" variant="success" onClick={() => navigate('/play/sesion')}>Seguir con la sesión</Button>
                <Button variant="secondary" onClick={leave}>Volver al inicio</Button>
              </div>
            </div>
          </div>
        </div>
      </Screen>
    )
  }

  const header = (
    <header className={s.header}>
      <BackButton variant="exit" onClick={leave} />
      <h1 className={s.headerTitle}>{title}</h1>
      <span />
    </header>
  )

  if (phase === 'check') {
    const exercise = exercises[index]
    const last = index + 1 >= exercises.length
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {header}
        <div className={s.stage}>
          <p className={s.blockChip}>Ya lo sé · {index + 1} de {exercises.length}</p>
          <div className={s.card}>
            <ExerciseStep
              key={exercise.id}
              exercise={exercise}
              allowHints={false}
              okLabel={last ? 'Terminar' : 'Siguiente'}
              wrongLabel="Siguiente"
              onContinue={onKnowItContinue}
            />
          </div>
        </div>
      </Screen>
    )
  }

  if (phase === 'vamos') {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {header}
        <div className={s.stage}>
          <div className={s.card}>
            <div className={s.intro}>
              <h2 className={s.title}>¡Vamos a verlo juntos!</h2>
              <Button size="lg" variant="success" onClick={() => setPhase('lesson')}>¡Empezar la clase!</Button>
            </div>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen background="var(--c-bg)" className={s.root}>
      {header}
      <div className={s.stage}>
        <div className={s.card}>
          <div className={s.intro}>
            <h2 className={s.title}>Hoy aprendemos: {title}</h2>
            <div className={s.actions}>
              <Button size="lg" variant="success" onClick={() => setPhase('lesson')}>¡Empezar la clase!</Button>
              {knowItAvailable && (
                <Button size="lg" variant="secondary" onClick={() => { setIndex(0); setPhase('check') }}>
                  Ya lo sé
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Screen>
  )
}
