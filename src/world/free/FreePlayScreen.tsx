/* Route /play/free: practise anything already unlocked. A times table drill, or any minigame the child has
   reached. Results are logged like any other game (GameHostProvider). */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActivityRunner } from '@/activities'
import { childText } from '@/world/rewards/childText'
import { worldHex } from '@/world/rewards/worldColors'
import { GameHostProvider } from '@/world/host/GameHost'
import { StarIcon } from '@/art'
import { useActiveChild, useMastery, useProgress } from '@/data'
import { Button, Screen, Spinner, TopBar } from '@/ui'
import type { ActivityConfig, ActivityResult } from '@/types'
import { kindLabel, reachedClasses, tableDrill, unlockedGames, unlockedTables } from './logic'
import s from './free.module.css'

interface Summary {
  title: string
  result: ActivityResult
}

export default function FreePlayScreen() {
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)
  const navigate = useNavigate()
  const [running, setRunning] = useState<ActivityConfig | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)

  if (!child || !progress) return <Spinner label="Preparando los juegos…" />

  if (running) {
    return (
      <GameHostProvider>
        <ActivityRunner
          config={running}
          onDone={(result) => {
            setSummary({ title: running.title, result })
            setRunning(null)
          }}
          onExit={() => setRunning(null)}
        />
      </GameHostProvider>
    )
  }

  const tables = unlockedTables(progress)
  const games = unlockedGames(progress)
  const classes = reachedClasses({ grade: child.grade, mastery: mastery ?? {}, progress })

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <TopBar back="/play" title="Jugar" />
      <div className={s.content}>
        {summary && (
          <section className={s.summary} role="status" aria-live="polite">
            <div className={s.summaryStars} aria-label={`${summary.result.stars} de 3 estrellas`}>
              {[0, 1, 2].map((i) => <StarIcon key={i} size={44} filled={i < summary.result.stars} />)}
            </div>
            <p className={s.summaryText}>
              {childText(child, '¡Muy bien, {child}!')} Has acertado {summary.result.correct} de {summary.result.total}.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setSummary(null)}>Elegir otro juego</Button>
          </section>
        )}

        {classes.length > 0 && <section className={s.section} aria-labelledby="free-classes">
          <h2 id="free-classes" className={s.heading}>Clases</h2>
          <ul className={s.classes}>
            {classes.map((c) => (
              <li key={c.topicId}>
                <button type="button" className={s.classCard} onClick={() => navigate(`/play/clase/${c.topicId}`)}>
                  <span className={s.classTitle}>{c.title}</span>
                  <span className={s.classAction}>Ver la clase ›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>}

        {tables.length === 0 && games.length === 0 && classes.length === 0 && (
          <p className={s.empty}>
            {childText(child, 'Cuando termines tu primera aventura, aquí aparecerán tus tablas y tus juegos, {child}.')}
          </p>
        )}

        {tables.length > 0 && <section className={s.section} aria-labelledby="free-tables">
          <h2 id="free-tables" className={s.heading}>Tablas</h2>
          <div className={s.tables}>
            {tables.map((t) => (
              <button
                key={t}
                type="button"
                className={s.table}
                onClick={() => setRunning(tableDrill(t))}
              >
                <span className={s.tableTimes} aria-hidden>×</span>
                <span className={s.tableNumber}>{t}</span>
                <span className={s.tableLabel}>La tabla del {t}</span>
              </button>
            ))}
          </div>
        </section>}

        {games.length > 0 && <section className={s.section} aria-labelledby="free-games">
          <h2 id="free-games" className={s.heading}>Juegos</h2>
          <ul className={s.games}>
              {games.map((g) => (
                <li key={`${g.worldId}:${g.node.id}`}>
                  <button
                    type="button"
                    className={s.game}
                    style={{ ['--world' as string]: worldHex(g.worldId) }}
                    onClick={() => setRunning(g.config)}
                  >
                    <span className={s.gameWorld}>{childText(child, g.world.shortName)}</span>
                    <span className={s.gameTitle}>{childText(child, g.config.title)}</span>
                    <span className={s.gameKind}>{kindLabel(g.config.kind)}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>}
      </div>
    </Screen>
  )
}
