/* Route /play/diploma: the diploma once all 8 crystals are won. Printing uses the A4 landscape print sheet. */
import { useNavigate } from 'react-router-dom'
import { crystalsOf } from '@/content'
import { useActiveChild, useProgress } from '@/data'
import { Button, Screen, Spinner, TopBar } from '@/ui'
import { DiplomaCertificate } from './DiplomaCertificate'
import s from './diploma.module.css'

export default function DiplomaScreen() {
  const navigate = useNavigate()
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)

  if (!child || !progress) return <Spinner label="Preparando el diploma…" />

  const earned = progress.diplomaEarnedAt
  if (!earned) {
    const crystals = crystalsOf(progress)
    const left = crystals.filter((c) => !c).length
    const lead = left === 1
      ? `Te falta 1 cristal para conseguir tu diploma, ${child.nickname}.`
      : `Te faltan ${left} cristales para conseguir tu diploma, ${child.nickname}.`
    return (
      <Screen className={s.root} background="var(--c-bg)">
        <TopBar back="/play" title="Mi diploma" />
        <div className={s.locked}>
          <div className={s.previewWrap}>
            <DiplomaCertificate child={child} crystals={crystals} seasonId={progress.seasonId} className={s.printSheet} />
          </div>
          <p className={s.lockedText}>{lead}</p>
          <Button variant="magic" size="lg" onClick={() => navigate('/play')}>Volver al mapa</Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <div className={s.toolbar}>
        <TopBar
          back="/play"
          title="Mi diploma"
          right={<Button variant="primary" size="sm" onClick={() => window.print()}>Imprimir</Button>}
        />
      </div>
      <div className={s.previewWrap}>
        <DiplomaCertificate child={child} date={earned} seasonId={progress.seasonId} className={s.printSheet} />
      </div>
      <p className={s.note}>Se imprime en papel A4 horizontal.</p>
    </Screen>
  )
}
