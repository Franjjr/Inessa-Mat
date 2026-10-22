/* Activity "division": la galera. Each round is one division with a 1-digit divisor, written in the Spanish layout
   and solved digit by digit. Options: `guided` (highlight the step), `proof` (magic proof after a correct answer). */
import { useMemo } from 'react'
import type { ActivityProps, DivisionExercise, Exercise } from '@/types'
import { generate } from '@/engine'
import { useActivityHost } from '@/activities/host'
import DivisionView from '../views/DivisionView'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import { useOpsRun } from '../groups/useOpsRun'
import s from './division.module.css'

const isDivision = (e: Exercise): e is DivisionExercise => e.kind === 'division'

export default function DivisionActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(config.selector, config.count ?? 5, { rng: host.rng, mastery: host.mastery }).filter(isDivision),
    // The rounds of one run are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises, config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex) return null
  const guided = config.params?.guided === true || run.index === 0
  const proof = config.params?.proof === true
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <section className={s.stage} aria-label="Galera">
        <p className={s.intro}>{host.t('La galera: el dividendo a la izquierda, el divisor dentro de la casita y el cociente debajo.')}</p>
        <DivisionView key={`${ex.id}-${run.index}`} exercise={ex} onAnswered={run.record} guided={guided} proof={proof} showFeedback allowHints />
      </section>
    </OpsShell>
  )
}
