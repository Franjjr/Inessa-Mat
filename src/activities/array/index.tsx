/* Activity "array": Construye el rectángulo. The child fills the empty frame of rows × columns with objects (tap a
   slot to plant one, tap again to take it out). Then the array view asks for the total, and after a correct answer
   the rectangle turns over to show the mirror rule. */
import { useMemo, useState } from 'react'
import type { ActivityProps, ArrayExercise, ExerciseOutcome } from '@/types'
import { generate } from '@/engine'
import { useActivityHost } from '@/activities/host'
import { sfx } from '@/audio'
import ArrayView from '../views/ArrayView'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import { useOpsRun } from '../groups/useOpsRun'
import s from './array.module.css'

export default function ArrayActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(config.selector, config.count ?? 6, { rng: host.rng, mastery: host.mastery })
      .filter((e): e is ArrayExercise => e.kind === 'array'),
    // The rounds of one run are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises, config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex || ex.kind !== 'array') return null
  const mirror = config.params?.mirror !== false
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <BuildArray key={`${ex.id}-${run.index}`} ex={ex} mirror={mirror} onAnswered={run.record} />
    </OpsShell>
  )
}

interface BuildProps {
  ex: ArrayExercise
  mirror: boolean
  onAnswered: (outcome: ExerciseOutcome) => void
}

function BuildArray({ ex, mirror, onAnswered }: BuildProps) {
  const host = useActivityHost()
  const total = ex.rows * ex.cols
  const [filled, setFilled] = useState<boolean[]>(() => Array.from({ length: total }, () => false))
  const [built, setBuilt] = useState(false)
  const count = filled.filter(Boolean).length
  const done = count === total

  const toggle = (i: number) => {
    setFilled((prev) => prev.map((v, k) => (k === i ? !v : v)))
    sfx.play(filled[i] ? 'erase' : 'pop', { volume: 0.5 })
  }

  if (built) {
    return <ArrayView exercise={ex} onAnswered={onAnswered} showFeedback allowHints mirror={mirror} />
  }

  return (
    <section className={s.stage} aria-label="Construye el rectángulo">
      <p className={s.prompt}>
        {host.t(`Construye un rectángulo de ${ex.rows} filas y ${ex.cols} columnas. Toca cada hueco para poner un ${ex.emoji}.`)}
      </p>
      <div className={s.frame} role="group" aria-label={`Rectángulo de ${ex.rows} filas y ${ex.cols} columnas`}
        style={{ gridTemplateColumns: `repeat(${ex.cols}, minmax(0, 1fr))` }}>
        {filled.map((on, i) => (
          <button
            key={i}
            type="button"
            className={`${s.slot} ${on ? s.on : ''}`}
            onClick={() => toggle(i)}
            aria-pressed={on}
            aria-label={`Fila ${Math.floor(i / ex.cols) + 1}, columna ${(i % ex.cols) + 1}`}
          >
            <span aria-hidden>{on ? ex.emoji : ''}</span>
          </button>
        ))}
      </div>
      <p className={s.count} aria-live="polite">{count} / {total}</p>
      <button type="button" className={s.go} disabled={!done} onClick={() => setBuilt(true)}>
        {done ? host.t('¡Ya está! ¿Cuántos hay?') : host.t('Llena todos los huecos')}
      </button>
    </section>
  )
}
