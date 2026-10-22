/* ChildHomeScreen (/play): the companion and Lumi, the next step of the adventure, daily review, free play and the
   rewards the child has unlocked. Shows the sync state quietly and lets a family switch child. */
import type { ReactNode } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ChestArt, Crystal, LumiHorn, StarIcon, WorldBackground, CompanionArt, Character } from '@/art'
import {
  crystalsOf, isWorldUnlocked, nextNode, season1, getNode, getWorld, renderTemplate, templateContext,
} from '@/content'
import { dueSkills } from '@/engine'
import { useActiveChild, useMastery, useProgress, useSyncStatus } from '@/data'
import { Button, Pill, Screen, Spinner } from '@/ui'
import type { ProgressState, WorldDef } from '@/types'
import type { SyncStatus } from '@/data'
import s from './ChildHomeScreen.module.css'

const SYNC_LABEL: Record<SyncStatus['state'], string> = {
  'local-only': 'Guardado en este dispositivo',
  offline: 'Sin conexión: se guarda aquí',
  idle: 'Todo guardado',
  syncing: 'Guardando…',
  error: 'Guardaremos esto más tarde',
}

function SyncPill() {
  const status = useSyncStatus()
  const tone = status.state === 'error' ? s.toneWarn : status.state === 'idle' || status.state === 'local-only' ? s.toneOk : s.toneBusy
  return (
    <span className={`${s.sync} ${tone}`} role="status" aria-live="polite">
      <span className={s.syncDot} aria-hidden="true" />
      {SYNC_LABEL[status.state]}
    </span>
  )
}

export default function ChildHomeScreen() {
  const navigate = useNavigate()
  const { child, loading, setActiveChild } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)

  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  if (!progress) return <Spinner />

  const ctx = templateContext(child)
  const crystals = crystalsOf(progress)
  const crystalCount = crystals.filter(Boolean).length
  const allCrystals = crystalCount === season1.worlds.length
  const next = nextNode(progress)
  const nextWorld = next ? getWorld(next.worldId) : undefined
  const nextDef = next ? getNode(next.worldId, next.nodeId) : undefined
  const due = mastery ? dueSkills(mastery, new Date(), 50).length : 0
  const available = progress.stars - progress.starsSpent
  const unlockedWorlds = season1.worlds.filter((w) => isWorldUnlocked(progress, w.id))

  const continueTo = next
    ? `/play/w/${next.worldId}/${next.nodeId}`
    : progress.diplomaEarnedAt ? '/play/diploma' : `/play/w/${season1.worlds[0].id}`
  const continueTitle = nextWorld && nextDef
    ? renderTemplate(nextDef.title, ctx)
    : progress.diplomaEarnedAt ? 'Tu diploma' : '¡Aventura completa!'

  const switchChild = () => {
    setActiveChild(null)
    navigate('/kids')
  }

  return (
    <Screen className={s.screen}>
      <WorldBackground id="home" vividness={0.45 + 0.55 * (crystalCount / season1.worlds.length)} />

      <header className={s.top}>
        <div className={s.hello}>
          <span className={s.helloSmall}>Hola</span>
          <span className={s.helloName}>{child.nickname}</span>
        </div>
        <div className={s.topRight}>
          <SyncPill />
          <Button variant="secondary" size="sm" className={s.touch} onClick={switchChild}>Cambiar</Button>
          <Button variant="ghost" size="sm" className={s.touch} onClick={() => navigate('/adult')}>Familia</Button>
        </div>
      </header>

      <main className={s.main}>
        <section className={s.stage} aria-label="Tu equipo">
          <div className={s.friends}>
            <div className={s.companion}>
              <CompanionArt
                species={child.companion.species}
                colorway={child.companion.colorway}
                equipped={child.companion.equipped}
                size={230}
                animated
              />
              <span className={s.companionName}>{child.companion.name}</span>
            </div>
            <div className={s.lumi}>
              <Character id="lumi" pose="happy" size={230} animated />
            </div>
          </div>
          <div className={s.horn}>
            <LumiHorn crystals={crystals} size={96} animated />
            <div className={s.hornText}>
              <span className={s.hornTitle}>Cuerno de Lumi</span>
              <span className={s.hornCount}>{crystalCount} de {season1.worlds.length} cristales</span>
              <Pill>
                <StarIcon filled size={18} /> {available} {available === 1 ? 'estrella' : 'estrellas'}
              </Pill>
            </div>
          </div>
        </section>

        <section className={s.side} aria-label="Qué hacer ahora">
          <button type="button" className={s.continue} onClick={() => navigate(continueTo)}>
            <span className={s.continueKicker}>
              {nextWorld ? renderTemplate(nextWorld.name, ctx) : 'Tu aventura'}
            </span>
            <span className={s.continueTitle}>{continueTitle}</span>
            <span className={s.continueCta}>{next ? 'Seguir la aventura' : 'Ver'} ›</span>
          </button>

          <div className={s.tiles}>
            <Tile
              label="Repaso del día"
              hint={due ? `${due} ${due === 1 ? 'cosa' : 'cosas'} para repasar` : 'Todo repasado'}
              tone="magic"
              onClick={() => navigate('/play/review')}
            />
            <Tile label="Juego libre" hint="Practica lo que quieras" tone="primary" onClick={() => navigate('/play/free')} />
            <Tile label="Álbum" hint="Tus pegatinas" tone="gold" onClick={() => navigate('/play/album')} />
            <Tile label="Tienda" hint="Ropa para tu compañero" tone="success" onClick={() => navigate('/play/shop')} />
            {allCrystals && (
              <Tile label="Gran Cofre" hint="¡Ábrelo!" tone="gold" onClick={() => navigate('/play/chest')}>
                <ChestArt open={!!progress.chestOpened} size={64} />
              </Tile>
            )}
            {progress.diplomaEarnedAt && (
              <Tile label="Diploma" hint="Tu gran premio" tone="magic" onClick={() => navigate('/play/diploma')} />
            )}
          </div>
        </section>
      </main>

      <footer className={s.worlds} aria-label="Mundos">
        {season1.worlds.map((w) => (
          <WorldChip key={w.id} world={w} progress={progress} open={unlockedWorlds.includes(w)} onOpen={() => navigate(`/play/w/${w.id}`)} />
        ))}
      </footer>
    </Screen>
  )
}

function Tile({ label, hint, tone, onClick, children }: {
  label: string; hint: string; tone: 'primary' | 'magic' | 'gold' | 'success'; onClick: () => void; children?: ReactNode
}) {
  return (
    <button type="button" className={`${s.tile} ${s[tone]}`} onClick={onClick}>
      <span className={s.tileArt}>{children}</span>
      <span className={s.tileLabel}>{label}</span>
      <span className={s.tileHint}>{hint}</span>
    </button>
  )
}

function WorldChip({ world, progress, open, onOpen }: {
  world: WorldDef; progress: ProgressState; open: boolean; onOpen: () => void
}) {
  const done = progress.worlds[world.id]?.crystal === true
  return (
    <button
      type="button"
      className={`${s.chip} ${open ? '' : s.chipLocked} ${done ? s.chipDone : ''}`}
      onClick={open ? onOpen : undefined}
      aria-disabled={!open}
      aria-label={`${world.shortName}${done ? ', cristal conseguido' : open ? '' : ', todavía cerrado'}`}
      style={{ ['--chip' as string]: world.color }}
    >
      <Crystal color={world.color} state={done ? 'collected' : open ? 'empty' : 'locked'} size={34} />
      <span className={s.chipName}>{world.shortName}</span>
    </button>
  )
}
