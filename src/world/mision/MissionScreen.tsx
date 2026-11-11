/* Route /play/mision/:assignmentId: «Misión de tu profe». One run of the teacher's practice (missionConfig), logged like
   any other game and marked with the mission id (GameHostProvider assignmentId), then a calm «¡Misión hecha!». A mission
   that is no longer current (or unknown on this device) sends the child back home. «Salir» leaves at any time, also
   while loading. The home hands the mission over (router state), so it starts at once; without it the list is read, and
   a network that hangs sends the child home after a few seconds instead of leaving a spinner. */
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ActivityRunner } from '@/activities'
import { listAssignmentsForChild, updateProgress, useActiveChild } from '@/data'
import type { ActivityResult, Assignment } from '@/types'
import { BackButton, Button, Screen, Spinner } from '@/ui'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { isMissionCurrent, missionConfig, missionDoneFlag } from './logic'
import s from './MissionScreen.module.css'

/** How long the list of missions may take before the child is sent home. */
export const MISSION_LOAD_TIMEOUT_MS = 5_000

export default function MissionScreen() {
  const { assignmentId = '' } = useParams()
  const { child } = useActiveChild()
  const navigate = useNavigate()
  const handed = (useLocation().state as { mission?: Assignment } | null)?.mission
  const fromHome = handed && handed.id === assignmentId ? handed : undefined
  /** undefined while loading, null when the mission is not current. */
  const [mission, setMission] = useState<Assignment | null | undefined>(() => (fromHome ? (isMissionCurrent(fromHome) ? fromHome : null) : undefined))
  const [result, setResult] = useState<ActivityResult | null>(null)

  const loading = mission === undefined
  useEffect(() => {
    if (!child || !loading) return
    let alive = true
    const timer = window.setTimeout(() => { if (alive) setMission(null) }, MISSION_LOAD_TIMEOUT_MS)
    listAssignmentsForChild(child.id)
      .then((list) => { if (alive) setMission(list.find((a) => a.id === assignmentId) ?? null) })
      .catch(() => { if (alive) setMission(null) })
    return () => { alive = false; window.clearTimeout(timer) }
  }, [child, assignmentId, loading])

  const done = (r: ActivityResult) => {
    setResult(r)
    if (child) {
      const key = missionDoneFlag(assignmentId)
      void updateProgress(child.id, (p) => (p.flags?.[key] ? p : { ...p, flags: { ...p.flags, [key]: true }, updatedAt: new Date().toISOString() })).catch(() => undefined)
    }
  }

  if (!child || mission === undefined) {
    return (
      <Screen className={s.root} background="var(--c-bg)">
        <div className={s.loading}>
          <Spinner label="Preparando la misión…" retry={false} />
          <BackButton variant="exit" onClick={() => navigate('/play')} />
        </div>
      </Screen>
    )
  }
  if (mission === null) return <Navigate to="/play" replace />

  if (result) {
    return (
      <Screen className={s.root} background="var(--c-bg)">
        <section className={s.card} role="status" aria-live="polite">
          <h1 className={s.title}>¡Misión hecha!</h1>
          <p className={s.text}>{childText(child, '¡Muy bien, {child}!')} Has acertado {result.correct} de {result.total}.</p>
          <Button onClick={() => navigate('/play')}>Volver al inicio</Button>
        </section>
      </Screen>
    )
  }

  return (
    <GameHostProvider activity="mission" assignmentId={mission.id}>
      <ActivityRunner config={missionConfig(mission)} onDone={done} onExit={() => navigate('/play')} />
    </GameHostProvider>
  )
}
