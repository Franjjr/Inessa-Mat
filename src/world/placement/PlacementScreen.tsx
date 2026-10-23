/* Prueba inicial (route /play/prueba): about ten minutes, fourteen items in five blocks, no hints and no feedback
   of right or wrong («¡Gracias!» only). Each answer goes through the normal mastery update, so the plan starts where
   the child is. Leaving before the end does not mark it done; the adult can launch it again from the report. */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExerciseView, useActivityHost } from '@/activities'
import { StarIcon } from '@/art'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { buildPlacement, PLACEMENT_ACTIVITY, PLACEMENT_BLOCKS, type PlacementItem } from '@/engine'
import { updateProgress, useActiveChild, useProgress } from '@/data'
import { BackButton, Button, Screen, Spinner } from '@/ui'
import type { ProgressState } from '@/types'
import type { ExerciseOutcome } from '@/types'
import s from '../session/session.module.css'

export default function PlacementScreen() {
  const navigate = useNavigate()
  const leave = () => navigate('/play')
  return (
    <GameHostProvider activity={PLACEMENT_ACTIVITY}>
      <PlacementRunner onDone={leave} onExit={leave} />
    </GameHostProvider>
  )
}

function PlacementRunner({ onDone, onExit }: { onDone: () => void; onExit: () => void }) {
  const host = useActivityHost()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  const [items, setItems] = useState<PlacementItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [thanks, setThanks] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (items || !child) return
    setItems(buildPlacement(`${child.id}|${new Date().toISOString().slice(0, 10)}`, new Date(), child.grade))
  }, [child, items])

  if (loading || !child || !progress || !items) return <Spinner label="Preparando la prueba…" />

  const total = items.length
  const current = items[index]

  const onAnswered = (o: ExerciseOutcome) => {
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

  const next = async () => {
    setThanks(false)
    if (index + 1 < total) {
      setIndex(index + 1)
      return
    }
    await markDone(child.id, progress)
    setFinished(true)
  }

  const header = (
    <header className={s.header}>
      <BackButton variant="exit" onClick={onExit} />
      <h1 className={s.headerTitle}>Prueba inicial</h1>
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
            <p className={s.text}>Ya sabemos por dónde empezar. Tu sesión de hoy se ajustará a lo que sabes.</p>
            <div className={s.actions}>
              <Button size="lg" variant="success" onClick={onDone}>Volver al inicio</Button>
            </div>
          </div>
        </div>
      </Screen>
    )
  }

  const blockLabel = PLACEMENT_BLOCKS.find((b) => b.id === current.block)?.label ?? ''
  return (
    <Screen background="var(--c-bg)" className={s.root}>
      {header}
      <div className={s.progressTrack} role="progressbar" aria-label={`Pregunta ${index + 1} de ${total}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (thanks ? 1 : 0)}>
        <div className={s.progressFill} style={{ width: `${Math.round(((index + (thanks ? 1 : 0)) / total) * 100)}%` }} />
      </div>
      <div className={s.stage}>
        <div className={s.card}>
          <p className={s.blockChip}>{blockLabel} · {index + 1} de {total}</p>
          <ExerciseView
            key={index}
            exercise={current.exercise}
            allowHints={false}
            showFeedback={false}
            onAnswered={onAnswered}
          />
        </div>
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

async function markDone(childId: string, progress: ProgressState): Promise<void> {
  if (progress.flags?.placement && !progress.flags?.placementRequested) return
  await updateProgress(childId, (p) => ({
    ...p,
    flags: { ...p.flags, placement: true, placementRequested: false },
    updatedAt: new Date().toISOString(),
  }))
}
