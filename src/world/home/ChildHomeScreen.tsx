/* ChildHomeScreen (/play): the child's start in the direction C layout. A greeting, the subjects the adult enabled,
   the companion and Lumi with the horn of crystals, then the right column in this order: the placement banner (while
   it is pending), «Hoy» (the class of today's topic, or the daily session), «Mi aventura», and the tiles Repasar (only
   with something due), Jugar and Mis premios. The world bar is at the bottom. Shows the sync state quietly and lets a
   family switch child. */
import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Crystal, LumiHorn, StarIcon, WorldBackground, CompanionArt, Character } from '@/art'
import {
  crystalsOf, isWorldUnlocked, nextNode, getNode, getWorld, renderTemplate, seasonIdForGrade, seasonOf, switchSeason,
  templateContext,
} from '@/content'
import { DAILY_MINUTES, dueSkills } from '@/engine'
import { updateProgress, useActiveChild, useMastery, useProgress, useSyncStatus } from '@/data'
import { Button, Pill, Screen, Spinner, toast } from '@/ui'
import { SUBJECTS } from '@/types'
import type { ProgressState, WorldDef } from '@/types'
import type { SyncStatus } from '@/data'
import { Tile } from './Tile'
import { todayEntry } from './todayEntry'
import s from './ChildHomeScreen.module.css'

const SYNC_LABEL: Record<SyncStatus['state'], string> = {
  'local-only': 'Guardado en este dispositivo',
  offline: 'Sin conexión: se guarda aquí',
  idle: 'Todo guardado',
  syncing: 'Guardando…',
  error: 'No se ha guardado en la nube',
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
function previousWorld(world: WorldDef, worlds: WorldDef[]): WorldDef | undefined {
  return world.index > 1 ? worlds[world.index - 2] : undefined
}

export default function ChildHomeScreen() {
  const navigate = useNavigate()
  const { child, loading, setActiveChild } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)

  // The adventure follows the course: a 2.º child plays the 2.º season. switchSeason keeps a season half won.
  useEffect(() => {
    if (!child || !progress) return
    const target = seasonIdForGrade(child.grade)
    if (progress.seasonId === target || switchSeason(progress, target) === progress) return
    void updateProgress(child.id, (p) => switchSeason(p, target)).catch(() => undefined)
  }, [child, progress])

  if (loading) return <Spinner />
  if (!child) return <Navigate to="/kids" replace />
  // «Hoy» needs the mastery too: without it a mid-course child would see the first topic's card for a moment.
  if (!progress || !mastery) return <Spinner />

  const ctx = templateContext(child)
  const season = seasonOf(progress)
  const crystals = crystalsOf(progress)
  const crystalCount = crystals.filter(Boolean).length
  const next = nextNode(progress)
  const nextWorld = next ? getWorld(next.worldId, season.id) : undefined
  const nextDef = next ? getNode(next.worldId, next.nodeId, season.id) : undefined
  const due = dueSkills(mastery, new Date(), 50).length
  const available = progress.stars - progress.starsSpent
  const unlockedWorlds = season.worlds.filter((w) => isWorldUnlocked(progress, w.id))
  const subjects = SUBJECTS.filter((sub) => child.settings.subjects.includes(sub.id))
  const today = todayEntry({ grade: child.grade, mastery, progress })

  const continueTo = next
    ? `/play/w/${next.worldId}/${next.nodeId}`
    : progress.diplomaEarnedAt ? '/play/diploma' : `/play/w/${season.worlds[0].id}`
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
    const before = previousWorld(world, season.worlds)
    toast(before ? `Este mundo se abre al conseguir el cristal del ${before.shortName}.` : 'Este mundo todavía está cerrado.')
  }

  return (
    <Screen className={s.screen}>
      <WorldBackground id="home" vividness={0.45 + 0.55 * (crystalCount / season.worlds.length)} />

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
                <span className={s.hornCount}>{crystalCount} de {season.worlds.length} cristales</span>
                <Pill>
                  <StarIcon filled size={18} /> {available} {available === 1 ? 'estrella' : 'estrellas'}
                </Pill>
              </div>
            </div>
          </section>
        </div>

        <div className={s.right}>
          {/* The placement test is a thin bar on top while it is pending; «Hoy» comes first after it. */}
          {(!progress.flags?.placement || progress.flags?.placementRequested) && (
            <button type="button" className={s.banner} onClick={() => navigate('/play/prueba')}>
              Antes de empezar: haz la prueba inicial ›
            </button>
          )}
          {today.kind === 'clase' ? (
            <button type="button" className={`${s.next} ${s.today}`} onClick={() => navigate(today.to)}>
              <span className={s.nextKicker}>Hoy aprendemos</span>
              <span className={s.nextTitle}>{today.title}</span>
              <span className={s.nextCta}>¡Empezar la clase!</span>
            </button>
          ) : (
            <button type="button" className={`${s.next} ${s.today}`} onClick={() => navigate(today.to)}>
              <span className={s.nextKicker}>Mi sesión de hoy · {DAILY_MINUTES} min</span>
              <span className={s.nextTitle}>{today.title}</span>
              <span className={s.nextText}>Calentamiento, lo nuevo, mezcla y un problema.</span>
              <span className={s.nextCta}>¡Empezar!</span>
            </button>
          )}

          <button type="button" className={`${s.next} ${s.adventure}`} onClick={() => navigate(continueTo)}>
            <span className={s.nextKicker}>Mi aventura</span>
            <span className={s.nextTitle}>{continueTitle}</span>
            {continueHook && <span className={s.nextText}>{continueHook}</span>}
            <span className={s.nextCta}>{next ? '¡Seguir la aventura!' : 'Ver'}</span>
          </button>

          <div className={s.tiles}>
            {due > 0 && <Tile label={`Repasar · ${due}`} tone="violet" onClick={() => navigate('/play/review')} />}
            <Tile label="Jugar" tone="blue" onClick={() => navigate('/play/free')} />
            <Tile label="Mis premios" tone="yellow" onClick={() => navigate('/play/premios')} />
          </div>
        </div>
      </main>

      <footer className={s.worlds} aria-label="Mundos">
        {season.worlds.map((w) => (
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
