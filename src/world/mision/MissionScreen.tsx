/* Route /play/mision/:assignmentId: «Misión de tu profe». One run of the teacher's practice (missionConfig), logged like
   any other game and marked with the mission id (GameHostProvider assignmentId), then a calm «¡Misión hecha!». A mission
   that is no longer current (or unknown on this device) sends the child back home. «Salir» leaves at any time. */
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActivityRunner } from '@/activities'
import { listAssignmentsForChild, useActiveChild } from '@/data'
import type { ActivityResult, Assignment } from '@/types'
import { Button, Screen, Spinner } from '@/ui'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { missionConfig } from './logic'
import s from './MissionScreen.module.css'

export default function MissionScreen() {
  const { assignmentId = '' } = useParams()
  const { child } = useActiveChild()
  const navigate = useNavigate()
  /** undefined while loading, null when the mission is not current. */
  const [mission, setMission] = useState<Assignment | null | undefined>(undefined)
  const [result, setResult] = useState<ActivityResult | null>(null)

  useEffect(() => {
    if (!child) return
    let alive = true
    listAssignmentsForChild(child.id)
      .then((list) => { if (alive) setMission(list.find((a) => a.id === assignmentId) ?? null) })
      .catch(() => { if (alive) setMission(null) })
    return () => { alive = false }
  }, [child, assignmentId])

  if (!child || mission === undefined) return <Spinner label="Preparando la misión…" />
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
      <ActivityRunner config={missionConfig(mission)} onDone={setResult} onExit={() => navigate('/play')} />
    </GameHostProvider>
  )
}
