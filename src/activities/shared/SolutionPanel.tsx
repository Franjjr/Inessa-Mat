/* «Así se resuelve»: the exercise solved step by step (engine/solution.ts), with its drawing and its final answer. Shown
   after the child gives up or misses for the last time: the app teaches the solution, it never leaves a bare number. The
   panel is plain content in the flow (never fixed over the exercise), so it covers nothing. */
import { useMemo } from 'react'
import type { Exercise } from '@/types'
import { solutionFor, type SolutionOptions } from '@/engine/solution'
import { HintVisual } from '@/activities/facts/shared/HintPanel'
import { useActivityHost } from '@/activities/host'
import s from './SolutionPanel.module.css'

export interface SolutionPanelProps {
  exercise: Exercise
  /** The methods the child solves with (subtraction, division, the tables trick): the steps follow them. */
  opts?: SolutionOptions
  /** Heading of the panel (default «Así se resuelve»). */
  title?: string
  className?: string
}

export function SolutionPanel({ exercise, opts, title = 'Así se resuelve', className }: SolutionPanelProps) {
  const host = useActivityHost()
  const sol = useMemo(() => solutionFor(exercise, opts), [exercise, opts])
  return (
    <section className={[s.panel, className].filter(Boolean).join(' ')} aria-label={title} data-testid="solution-panel">
      <h3 className={s.title}>{title}</h3>
      <ol className={s.steps}>
        {sol.steps.map((step, i) => (
          <li key={i} className={s.step}>{host.t(step)}</li>
        ))}
      </ol>
      {sol.visual && sol.visual !== 'none' && <HintVisual hint={{ level: 3, text: '', visual: sol.visual, params: sol.params }} />}
      <p className={s.answer}>
        <span className={s.answerLabel}>Respuesta: </span>
        <strong>{host.t(sol.answer)}</strong>
      </p>
    </section>
  )
}

export default SolutionPanel
