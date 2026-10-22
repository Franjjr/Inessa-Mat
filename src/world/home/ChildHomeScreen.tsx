/* ChildHomeScreen (/play): the child's start in the direction C layout. A greeting, the subjects the adult enabled,
   the companion and Lumi with the horn of crystals, the next step of the adventure, the daily tiles and the world bar.
   Shows the sync state quietly and lets a family switch child. */
import type { ReactNode } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ChestArt, Crystal, LumiHorn, StarIcon, WorldBackground, CompanionArt, Character } from '@/art'
import {
  crystalsOf, isWorldUnlocked, nextNode, season1, getNode, getWorld, renderTemplate, templateContext,
} from '@/content'
import { DAILY_MINUTES, dueSkills } from '@/engine'
import { GRADE3_SYLLABUS, currentTopic } from '@/content/syllabus'
import { useActiveChild, useMastery, useProgress, useSyncStatus } from '@/data'
import { Button, Pill, Screen, Spinner, toast } from '@/ui'
import { SUBJECTS } from '@/types'
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

/** The world that must be finished before `world` opens (the one before it in the season). */
function previousWorld(world: WorldDef): WorldDef | undefined {
  return world.index > 1 ? season1.worlds[world.index - 2] : undefined
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
  const subjects = SUBJECTS.filter((sub) => child.settings.subjects.includes(sub.id))
  const sessionTopic = currentTopic(GRADE3_SYLLABUS, mastery ?? {})?.name ?? null

  const continueTo = next
    ? `/play/w/${next.worldId}/${next.nodeId}`
    : progress.diplomaEarnedAt ? '/play/diploma' : `/play/w/${season1.worlds[0].id}`
  const continueTitle = nextWorld && nextDef
    ? renderTemplate(nextDef.title, ctx)
    : progress.diplomaEarnedAt ? 'Tu diploma' : '¡Aventura completa!'
  const continueHook = nextWorld ? renderTemplate(nextWorld.hook, ctx) : ''

  const switchChild = () => {
    setActiveChild(null)
    navigate('/kids')
  }

  const openWorld = (world: WorldDef, open: boolean) => {
    if (open) {
      navigate(`/play/w/${world.id}`)
      return
    }
    const before = previousWorld(world)
    toast(before ? `Este mundo se abre al conseguir el cristal del ${before.shortName}.` : 'Este mundo todavía está cerrado.')
  }

  return (
    <Screen className={s.screen}>
      <WorldBackground id="home" vividness={0.45 + 0.55 * (crystalCount / season1.worlds.length)} />

      <header className={s.top}>
        <h1 className={s.hello}>
          ¡Hola, <span className={s.helloName}>{child.nickname}</span>!
        </h1>
        <div className={s.topRight}>
          <SyncPill />
          <Button variant="secondary" size="sm" className={`${s.touch} ${s.chipBtn}`} onClick={switchChild}>Cambiar</Button>
          <Button variant="ghost" size="sm" className={`${s.touch} ${s.chipBtn} ${s.family}`} onClick={() => navigate('/adult')}>Familia</Button>
        </div>
      </header>

      {subjects.length > 1 && <SubjectPicker subjects={subjects} />}

      <main className={s.main}>
        <div className={s.left}>
          <section className={s.stage} aria-label="Tu equipo">
            <div className={s.friends}>
              <div className={s.companion}>
                <CompanionArt
                  species={child.companion.species}
                  colorway={child.companion.colorway}
                  equipped={child.companion.equipped}
                  size={200}
                  animated
                />
                <span className={s.companionName}>{child.companion.name}</span>
              </div>
              <div className={s.lumi}>
                <Character id="lumi" pose="happy" size={200} animated />
              </div>
            </div>
            <div className={s.horn}>
              <LumiHorn crystals={crystals} size={80} animated />
              <div className={s.hornText}>
                <span className={s.hornTitle}>Cuerno de Lumi</span>
                <span className={s.hornCount}>{crystalCount} de {season1.worlds.length} cristales</span>
                <Pill>
                  <StarIcon filled size={18} /> {available} {available === 1 ? 'estrella' : 'estrellas'}
                </Pill>
              </div>
            </div>
          </section>
        </div>

        <div className={s.right}>
          {/* The placement test comes first: the daily session starts where it says. */}
          {(!progress.flags?.placement || progress.flags?.placementRequested) && (
            <button type="button" className={`${s.next} ${s.placement}`} onClick={() => navigate('/play/prueba')}>
              <span className={s.nextKicker}>Antes de empezar · unos 10 min</span>
              <span className={s.nextTitle}>Prueba inicial</span>
              <span className={s.nextText}>Sin pistas: así sabemos por dónde empezar.</span>
              <span className={s.nextCta}>¡Hacer la prueba!</span>
            </button>
          )}
          <button type="button" className={`${s.next} ${s.session}`} onClick={() => navigate('/play/sesion')}>
            <span className={s.nextKicker}>Mi sesión de hoy · {DAILY_MINUTES} min</span>
            <span className={s.nextTitle}>{sessionTopic ?? 'Matemáticas de hoy'}</span>
            <span className={s.nextText}>Calentamiento, lo nuevo, mezcla y un problema.</span>
            <span className={s.nextCta}>¡Empezar!</span>
          </button>

          <button type="button" className={`${s.next} ${s.adventure}`} onClick={() => navigate(continueTo)}>
            <span className={s.nextKicker}>
              {nextWorld ? `${renderTemplate(nextWorld.name, ctx)} · Paso siguiente` : 'Tu aventura'}
            </span>
            <span className={s.nextTitle}>{continueTitle}</span>
            {continueHook && <span className={s.nextText}>{continueHook}</span>}
            <span className={s.nextCta}>{next ? '¡Seguir la aventura!' : 'Ver'}</span>
          </button>

          <div className={s.tiles}>
            <Tile
              label="Repaso del día"
              hint={due ? `${due} ${due === 1 ? 'cosa' : 'cosas'} para repasar` : 'Todo repasado'}
              tone="violet"
              onClick={() => navigate('/play/review')}
            />
            <Tile label="Juego libre" hint="Practica lo que quieras" tone="blue" onClick={() => navigate('/play/free')} />
            <Tile label="Álbum" hint="Tus pegatinas" tone="yellow" onClick={() => navigate('/play/album')} />
            <Tile label="Tienda" hint="Ropa para tu compañero" tone="green" onClick={() => navigate('/play/shop')} />
            {allCrystals && (
              <Tile label="Gran Cofre" hint="¡Ábrelo!" tone="yellow" onClick={() => navigate('/play/chest')}>
                <ChestArt open={!!progress.chestOpened} size={56} />
              </Tile>
            )}
            {progress.diplomaEarnedAt && (
              <Tile label="Diploma" hint="Tu gran premio" tone="violet" onClick={() => navigate('/play/diploma')} />
            )}
          </div>
        </div>
      </main>

      <footer className={s.worlds} aria-label="Mundos">
        {season1.worlds.map((w) => (
          <WorldChip key={w.id} world={w} progress={progress} open={unlockedWorlds.includes(w)} currentWorldId={next?.worldId} onOpen={() => openWorld(w, true)} onLocked={() => openWorld(w, false)} />
        ))}
      </footer>
    </Screen>
  )
}

/** The subjects the adult enabled. Only the ones with content can be opened; the rest say «Pronto». */
function SubjectPicker({ subjects }: { subjects: { id: string; name: string; available: boolean }[] }) {
  return (
    <nav className={s.subjects} aria-label="Asignaturas">
      {subjects.map((sub) => (
        <button
          key={sub.id}
          type="button"
          className={`${s.subj} ${sub.available ? s.subjOn : s.subjOff}`}
          disabled={!sub.available}
          aria-current={sub.available ? 'page' : undefined}
        >
          {sub.name}
          <small>{sub.available ? '¡Hoy!' : 'Pronto'}</small>
        </button>
      ))}
    </nav>
  )
}

function Tile({ label, hint, tone, onClick, children }: {
  label: string; hint: string; tone: 'violet' | 'blue' | 'yellow' | 'green'; onClick: () => void; children?: ReactNode
}) {
  return (
    <button type="button" className={`${s.tile} ${s[tone]}`} onClick={onClick}>
      <span className={s.tileLabel}>{label}</span>
      <span className={s.tileHint}>{hint}</span>
      {children && <span className={s.tileArt}>{children}</span>}
    </button>
  )
}

function WorldChip({ world, progress, open, currentWorldId, onOpen, onLocked }: {
  world: WorldDef; progress: ProgressState; open: boolean; currentWorldId?: string; onOpen: () => void; onLocked: () => void
}) {
  const done = progress.worlds[world.id]?.crystal === true
  const current = open && !done && currentWorldId === world.id
  const state = done ? 'hecho' : open ? (current ? 'aquí' : 'abierto') : 'bloqueado'
  return (
    <button
      type="button"
      className={`${s.world} ${done ? s.worldDone : open ? s.worldOpen : s.worldLock} ${current ? s.worldNow : ''}`}
      onClick={open ? onOpen : onLocked}
      aria-disabled={!open || undefined}
      aria-label={`${world.shortName}${done ? ', cristal conseguido' : open ? '' : ', bloqueado'}`}
      data-state={state}
      style={{ ['--c' as string]: world.color, ['--c-soft' as string]: world.colorSoft }}
    >
      <Crystal color={world.color} state={done ? 'collected' : open ? 'empty' : 'locked'} size={30} />
      <span className={s.worldName}>{world.shortName}</span>
      <span className={s.worldState}>{done ? 'Hecho' : open ? (current ? 'Aquí' : '') : 'Bloqueado'}</span>
    </button>
  )
}
