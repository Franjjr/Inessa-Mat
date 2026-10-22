/* Activity "groups": Haz grupos iguales. The child first makes the groups by tapping the objects from the tray into
   the baskets (each basket holds the same number). Then the view asks how many there are in total. */
import { useMemo, useState } from 'react'
import type { ActivityProps, ExerciseOutcome, GroupsExercise } from '@/types'
import { generate } from '@/engine'
import { useActivityHost } from '@/activities/host'
import { sfx } from '@/audio'
import GroupsView from '../views/GroupsView'
import { NoRounds, OpsShell } from './OpsShell'
import { useOpsRun } from './useOpsRun'
import s from './groups.module.css'

export default function GroupsActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(config.selector, config.count ?? 6, { rng: host.rng, mastery: host.mastery })
      .filter((e): e is GroupsExercise => e.kind === 'groups'),
    // Generated once per mount: the rounds of one run are fixed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises, config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex || ex.kind !== 'groups') return null
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <GroupsRound key={`${ex.id}-${run.index}`} ex={ex} onAnswered={run.record} guided={run.index === 0} />
    </OpsShell>
  )
}

function GroupsRound({ ex, onAnswered, guided }: { ex: GroupsExercise; onAnswered: (o: ExerciseOutcome) => void; guided: boolean }) {
  const host = useActivityHost()
  const [built, setBuilt] = useState(false)
  if (built) {
    return <GroupsView exercise={ex} onAnswered={onAnswered} guided={guided} showFeedback allowHints />
  }
  return <BuildGroups ex={ex} onBuilt={() => setBuilt(true)} t={host.t} />
}

interface BuildProps {
  ex: GroupsExercise
  onBuilt: () => void
  t: (text: string) => string
}

/** Tap objects from the tray: each one goes into the open basket, until every basket is full. */
function BuildGroups({ ex, onBuilt, t }: BuildProps) {
  const total = ex.groups * ex.perGroup
  const [tray, setTray] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i))
  const [baskets, setBaskets] = useState<number[][]>(() => Array.from({ length: ex.groups }, () => []))
  const open = baskets.findIndex((b) => b.length < ex.perGroup)
  const ready = tray.length === 0

  const put = (id: number) => {
    if (open < 0) return
    setTray((prev) => prev.filter((x) => x !== id))
    setBaskets((prev) => prev.map((b, i) => (i === open ? [...b, id] : b)))
    const fills = baskets[open].length + 1 === ex.perGroup
    sfx.play(fills ? 'select' : 'pop', { volume: 0.6 })
  }
  const take = (basket: number, id: number) => {
    setBaskets((prev) => prev.map((b, i) => (i === basket ? b.filter((x) => x !== id) : b)))
    setTray((prev) => [...prev, id])
    sfx.play('erase', { volume: 0.4 })
  }

  return (
    <section className={s.stage} aria-label="Haz grupos iguales">
      <p className={s.prompt}>{t(`Haz ${ex.groups} grupos de ${ex.perGroup}. Toca un ${ex.emoji} para ponerlo en el grupo que está abierto.`)}</p>

      <div className={s.tray} aria-label="Objetos sin colocar">
        {tray.map((id) => (
          <button key={id} type="button" className={s.token} onClick={() => put(id)} aria-label={`${ex.emoji} sin colocar`}>
            <span aria-hidden>{ex.emoji}</span>
          </button>
        ))}
        {ready && <span className={s.note}>{t('¡Ya están todos!')}</span>}
      </div>

      <div className={s.baskets}>
        {baskets.map((items, b) => {
          const full = items.length === ex.perGroup
          const isOpen = b === open
          return (
            <div
              key={b}
              className={`${s.basket} ${isOpen ? s.basketOpen : ''} ${full ? s.basketFull : ''}`}
              aria-label={`Grupo ${b + 1}, ${items.length} de ${ex.perGroup}`}
            >
              <div className={s.slots}>
                {items.map((id) => (
                  <button key={id} type="button" className={s.slotItem} onClick={() => take(b, id)} aria-label={`quitar ${ex.emoji} del grupo ${b + 1}`}>
                    <span aria-hidden>{ex.emoji}</span>
                  </button>
                ))}
              </div>
              <span className={s.label}>{t(`Grupo ${b + 1}`)} · {items.length}/{ex.perGroup}</span>
            </div>
          )
        })}
      </div>

      {ready && (
        <button type="button" className={`${s.ready} ${s.go}`} onClick={onBuilt}>
          {t('¡Ya están! ¿Cuántos hay?')}
        </button>
      )}
    </section>
  )
}

