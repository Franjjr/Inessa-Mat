/* <ExerciseLayout> — the frame every exercise view shares (P3PE-01, P3PE-06): the statement on top (the one statement
   style, ≥ 20 px on screen even in a shrunk game), then the work, then the answer bar. On a short tablet in landscape
   the statement and the answer bar sit on the left and the work on the right, so «Comprobar» is always in view.
   The styles live in src/styles/exercise.css (.ex-layout, .ex-prompt, .ex-prompt-sub). */
import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

export interface ExerciseLayoutProps extends Omit<HTMLAttributes<HTMLElement>, 'prompt'> {
  /** The statement: what to do, in one short sentence. */
  prompt?: ReactNode
  /** Optional second line (how to do it). */
  sub?: ReactNode
  /** The answer bar (Pista, Comprobar) or the view's own buttons. */
  actions?: ReactNode
  /** Class of the work box (the view's own layout: a flex column with its gap). */
  workClassName?: string
  children?: ReactNode
  /** Data attributes the e2e and the views read (data-kind, data-status…). */
  [data: `data-${string}`]: string | undefined
}

export function ExerciseLayout({ prompt, sub, actions, workClassName, className, children, ...rest }: ExerciseLayoutProps) {
  return (
    <section className={clsx('ex-layout', className)} {...rest}>
      {(prompt || sub) && (
        <div className="ex-head">
          {prompt && <p className="ex-prompt">{prompt}</p>}
          {sub && <p className="ex-prompt-sub">{sub}</p>}
        </div>
      )}
      <div className={clsx('ex-work', workClassName)}>{children}</div>
      {actions && <div className="ex-actions">{actions}</div>}
    </section>
  )
}
