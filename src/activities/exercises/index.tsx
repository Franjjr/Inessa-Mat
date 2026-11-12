/* Activity "exercises": rounds of any exercise kinds the selector asks for (problemas con barras, encuentra el error,
   comprobar). Each round is the real exercise view of its kind, through ExerciseView. The school methods the grown-up
   chose are passed to the subtraction and division rounds (the same as the column and division activities). */
import { useMemo } from 'react'
import type { ActivityProps, Exercise } from '@/types'
import { generate, methodFor } from '@/engine'
import { adaptiveSelector } from '../facts/shared/items'
import { guidedOutcome } from '../shared/guided'
import { ExerciseView, useActivityHost } from '@/activities'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import { useOpsRun } from '../groups/useOpsRun'

export default function ExercisesActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(adaptiveSelector(config.selector), config.count ?? 5, { rng: host.rng, mastery: host.mastery }),
    // The rounds of one run are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises as Exercise[], config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex) return null
  const guided = config.params?.guided === true || run.index === 0
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <section aria-label={config.title} style={{ width: '100%' }}>
        <ExerciseView
          key={`${ex.id}-${run.index}`}
          exercise={ex}
          // A guided round shows its help from the start: that help is a hint used (mastery does not climb on it).
          onAnswered={(o) => run.record(guided ? guidedOutcome(o) : o)}
          guided={guided}
          allowHints
          showFeedback
          method={methodFor('sub', host.prefs)}
          divMethod={methodFor('div', host.prefs)}
          tableMethod={host.prefs.tableMethod}
        />
      </section>
    </OpsShell>
  )
}
