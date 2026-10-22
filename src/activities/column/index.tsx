/* Activity "column": operaciones en columna dentro de una historia. Each round wraps one column sum, subtraction or
   2-digit × 1-digit multiplication in a short story, then uses the column view (units first, carries optional). */
import { useMemo } from 'react'
import type { ActivityProps, ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, Exercise, SubMethod } from '@/types'
import { generate, normaliseSubMethod } from '@/engine'
import { useActivityHost } from '@/activities/host'
import SubtractionView from '../views/SubtractionView'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import { useOpsRun } from '../groups/useOpsRun'
import s from './column.module.css'

type ColumnEx = ColumnAddExercise | ColumnSubExercise | ColumnMulExercise
const isColumn = (e: Exercise): e is ColumnEx => e.kind === 'column-add' || e.kind === 'column-sub' || e.kind === 'column-mul'

/** Story frame for each kind. Templates go through host.t (child name, gender agreement). */
function storyFor(ex: ColumnEx): string {
  if (ex.kind === 'column-add') return '{child}, Lumi reúne las estrellas de dos cofres. ¿Cuántas tiene en total?'
  if (ex.kind === 'column-sub') return '{child}, Borrón ha escondido algunas estrellas. ¿Cuántas quedan encendidas?'
  const boxes = ex.bottom === 1 ? 'caja' : 'cajas'
  return `En la Forja hay ${ex.bottom} ${boxes} y en cada caja hay ${ex.top} piezas de luz. ¿Cuántas piezas hay en total?`
}

export default function ColumnActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const exercises = useMemo(
    () => generate(config.selector, config.count ?? 6, { rng: host.rng, mastery: host.mastery }).filter(isColumn),
    // The rounds of one run are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  const run = useOpsRun(exercises, config, onDone)
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  const ex = run.exercise
  if (!ex || !isColumn(ex)) return null
  const guided = config.params?.guided === true || run.index === 0
  const proof = config.params?.proof === true
  // Subtraction uses the child's favourite method (params.method overrides it for a fixed activity).
  const method: SubMethod | undefined = ex.kind === 'column-sub'
    ? normaliseSubMethod(config.params?.method ?? host.prefs.subMethod)
    : undefined
  return (
    <OpsShell title={config.title} index={run.index} total={run.total} onExit={onExit}>
      <section className={s.stage} aria-label="Historia">
        <p className={s.story}>{host.t(storyFor(ex))}</p>
        <SubtractionView key={`${ex.id}-${run.index}`} exercise={ex} onAnswered={run.record} guided={guided} proof={proof} method={method} showFeedback allowHints />
      </section>
    </OpsShell>
  )
}
