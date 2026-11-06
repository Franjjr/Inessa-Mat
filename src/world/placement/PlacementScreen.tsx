/* Prueba inicial (route /play/prueba, maths), Prueba de Lengua (route /play/prueba-lengua) and Prueba de Inglés (route
   /play/prueba-ingles): about ten minutes, no hints and no feedback of right or wrong («¡Gracias!» only). «No lo sé» skips an
   item the child cannot do yet: it counts as not known, so the plan starts there. Each answer goes through the normal mastery
   update, so the plan starts where the child is. Leaving before the end does not mark it done; the adult can launch it again
   from the report. The subject picks the items, the blocks, the activity name, the texts and the progress flags
   (placementFlags). */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExerciseView, useActivityHost } from '@/activities'
import { StarIcon } from '@/art'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import {
  buildEnglishPlacement, buildLenguaPlacement, buildPlacement, ENGLISH_PLACEMENT_ACTIVITY, ENGLISH_PLACEMENT_BLOCKS, LENGUA_PLACEMENT_ACTIVITY,
  LENGUA_PLACEMENT_BLOCKS, PLACEMENT_ACTIVITY, PLACEMENT_BLOCKS, placementFlags, type LessonSubject,
} from '@/engine'
import { updateProgress, useActiveChild, useProgress } from '@/data'
import { useInputMode } from '@/ink'
import { BackButton, Button, Screen, Spinner } from '@/ui'
import type { Exercise, ProgressState } from '@/types'
import type { ExerciseOutcome } from '@/types'
import s from '../session/session.module.css'
import { FitToScreen } from '@/activities/shared/FitToScreen'

/** One item of any of the tests: the block is one of the subject's (the runner shows its label). */
interface PlacementItemOf {
  block: string
  exercise: Exercise
}

/** What each subject's placement shows and runs: its activity name, title, blocks, items and the text at its end. */
const PLACEMENT_SETUP: Record<LessonSubject, {
  activity: string; title: string; blocks: { id: string; label: string }[]
  build: (seed: string, now: Date, grade?: number) => PlacementItemOf[]; done: string
}> = {
  math: {
    activity: PLACEMENT_ACTIVITY, title: 'Prueba inicial', blocks: PLACEMENT_BLOCKS, build: (seed, now, grade) => buildPlacement(seed, now, grade),
    done: 'Ya sabemos por dónde empezar. Tu sesión de hoy se ajustará a lo que sabes.',
  },
  language: {
    activity: LENGUA_PLACEMENT_ACTIVITY, title: 'Prueba de Lengua', blocks: LENGUA_PLACEMENT_BLOCKS, build: (seed, now) => buildLenguaPlacement(seed, now),
    done: 'Ya sabemos por dónde empezar en Lengua. Tu sesión de Lengua se ajustará a lo que sabes.',
  },
  english: {
    activity: ENGLISH_PLACEMENT_ACTIVITY, title: 'Prueba de Inglés', blocks: ENGLISH_PLACEMENT_BLOCKS, build: (seed, now) => buildEnglishPlacement(seed, now),
    done: 'Ya sabemos por dónde empezar en Inglés. Tu sesión de Inglés se ajustará a lo que sabes.',
  },
}

export default function PlacementScreen({ subject = 'math' }: { subject?: LessonSubject }) {
  const navigate = useNavigate()
  const leave = () => navigate('/play')
  return (
    <GameHostProvider activity={PLACEMENT_SETUP[subject].activity} subject={subject}>
      <PlacementRunner subject={subject} onDone={leave} onExit={leave} />
    </GameHostProvider>
  )
}

function PlacementRunner({ subject, onDone, onExit }: { subject: LessonSubject; onDone: () => void; onExit: () => void }) {
  const host = useActivityHost()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  const [items, setItems] = useState<PlacementItemOf[] | null>(null)
  const [index, setIndex] = useState(0)
  const [thanks, setThanks] = useState(false)
  const [finished, setFinished] = useState(false)
  const { mode } = useInputMode()
  const shownAt = useRef(performance.now())
  useEffect(() => { shownAt.current = performance.now() }, [index])

  useEffect(() => {
    if (items || !child) return
    const seed = `${child.id}|${new Date().toISOString().slice(0, 10)}`
    setItems(PLACEMENT_SETUP[subject].build(seed, new Date(), child.grade))
  }, [child, items, subject])

  if (loading || !child || !progress || !items) return <Spinner label="Preparando la prueba…" />

  const total = items.length
  const current = items[index]

  const onAnswered = (o: ExerciseOutcome) => {
    if (thanks) return // already answered with «No lo sé»
    host.reportAttempt({
      exercise: current.exercise,
      check: o.check,
      ms: o.ms,
      inputMode: o.inputMode,
      hintsUsed: 0,
      recognitionFixes: o.recognitionFixes,
    })
    setThanks(true)
  }

  const dontKnow = () => {
    if (thanks) return
    host.reportAttempt({
      exercise: current.exercise,
      check: { correct: false, given: 'No lo sé', expected: '?', errorType: 'dont-know' },
      ms: Math.round(performance.now() - shownAt.current),
      inputMode: mode,
      hintsUsed: 0,
    })
    setThanks(true)
  }

  const next = async () => {
    setThanks(false)
    if (index + 1 < total) {
      setIndex(index + 1)
      return
    }
    await markDone(child.id, progress, subject)
    setFinished(true)
  }

  const setup = PLACEMENT_SETUP[subject]
  const header = (
    <header className={s.header}>
      <BackButton variant="exit" onClick={onExit} />
      <h1 className={s.headerTitle}>{setup.title}</h1>
      <span />
    </header>
  )

  if (finished) {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {header}
        <div className={s.stage}>
          <div className={`${s.card} ${s.calm}`}>
            <div className={s.stars}>{[0, 1, 2].map((i) => <StarIcon key={i} size={56} filled />)}</div>
            <h2 className={s.title}>{childText(child, '¡Gracias, {child}!')}</h2>
            <p className={s.text}>{setup.done}</p>
            <div className={s.actions}>
              <Button size="lg" variant="success" onClick={onDone}>Volver al inicio</Button>
            </div>
          </div>
        </div>
      </Screen>
    )
  }

  const blockLabel = setup.blocks.find((b) => b.id === current.block)?.label ?? ''
  return (
    <Screen background="var(--c-bg)" className={s.root}>
      {header}
      <div className={s.progressTrack} role="progressbar" aria-label={`Pregunta ${index + 1} de ${total}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (thanks ? 1 : 0)}>
        <div className={s.progressFill} style={{ width: `${Math.round(((index + (thanks ? 1 : 0)) / total) * 100)}%` }} />
      </div>
      <div className={`${s.stage} ${s.stageEnd}`}>
        <div className={s.card}>
          <p className={s.blockChip}>{blockLabel} · {index + 1} de {total}</p>
          {/* Shrunk to fit the window: no scrolling to answer. */}
          <FitToScreen>
            <ExerciseView
              key={index}
              exercise={current.exercise}
              allowHints={false}
              showFeedback={false}
              onAnswered={onAnswered}
            />
          </FitToScreen>
        </div>
        {!thanks && (
          <Button variant="secondary" onClick={dontKnow}>No lo sé</Button>
        )}
        {thanks && (
          <div className={s.calm} role="status">
            <p className={s.title}>¡Gracias!</p>
            <Button size="lg" variant="success" onClick={() => void next()}>
              {index + 1 < total ? 'Siguiente' : 'Terminar'}
            </Button>
          </div>
        )}
      </div>
    </Screen>
  )
}

async function markDone(childId: string, progress: ProgressState, subject: LessonSubject): Promise<void> {
  const flags = placementFlags(subject)
  if (progress.flags?.[flags.done] && !progress.flags?.[flags.requested]) return
  await updateProgress(childId, (p) => ({
    ...p,
    flags: { ...p.flags, [flags.done]: true, [flags.requested]: false },
    updatedAt: new Date().toISOString(),
  }))
}
