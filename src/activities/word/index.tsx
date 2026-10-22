/* Activity "word": problemas de palabras. Each round is a short story with the Numeria cast. Optional `chooseOp`:
   the child first picks juntar, quitar, repetir or repartir. */
import { useMemo } from 'react'
import type { ActivityProps, Exercise, WordProblemExercise } from '@/types'
import { generate } from '@/engine'
import { useActivityHost } from '@/activities/host'
import WordProblemView from '../views/WordProblemView'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import { useOpsRun } from '../groups/useOpsRun'

const isWord = (e: Exercise): e is WordProblemExercise => e.kind === 'word-problem'

export default function WordActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(config.selector, config.count ?? 5, { rng: host.rng, mastery: host.mastery }).filter(isWord),
    // The rounds of one run are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises, config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex) return null
  const chooseOp = config.params?.chooseOp === true
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <WordProblemView key={`${ex.id}-${run.index}`} exercise={ex} onAnswered={run.record} chooseOp={chooseOp} showFeedback allowHints />
    </OpsShell>
  )
}
