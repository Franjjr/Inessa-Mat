/* Shared chrome of the minigames: header with exit + progress, instructions, and the result card. */
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { Sparkles, StarIcon } from '@/art'
import { BackButton, Button } from '@/ui'
import type { ActivityResult } from '@/types'
import { useActivityHost } from '../../host'
import { formatClock } from './items'
import s from './shared.module.css'

export interface ActivityFrameProps {
  title: string
  instructions?: string
  index: number
  total: number
  accent?: string
  accentSoft?: string
  onExit?: () => void
  /** Optional pill next to the progress (e.g. the race clock or the table). */
  badge?: ReactNode
  children: ReactNode
  className?: string
}

export function ActivityFrame({ title, instructions, index, total, accent, accentSoft, onExit, badge, children, className }: ActivityFrameProps) {
  const host = useActivityHost()
  const pct = total > 0 ? Math.min(100, (index / total) * 100) : 0
  const style = accent
    ? ({ ['--accent' as string]: accent, ['--accent-soft' as string]: accentSoft ?? 'var(--c-surface-2)' } as CSSProperties)
    : undefined
  return (
    <section className={clsx(s.frame, className)} style={style} aria-label={host.t(title)}>
      <header className={s.header}>
        {onExit ? (
          <BackButton variant="exit" onClick={onExit} />
        ) : <span />}
        <h1 className={s.title}>{host.t(title)}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {badge}
          <span className={s.progressPill} aria-live="polite">
            {Math.min(index + 1, total)} / {total}
          </span>
        </div>
      </header>
      <div className={s.progressBar} aria-hidden>
        <div className={s.progressFill} style={{ width: `${pct}%` }} />
      </div>
      {instructions && <p className={s.instructions}>{host.t(instructions)}</p>}
      <div className={s.stage}>{children}</div>
    </section>
  )
}

export interface ResultCardProps {
  result: ActivityResult
  onContinue: () => void
  /** Second line of stats, e.g. "Récord: 0:42". */
  extra?: ReactNode
  /** True when the activity was played untimed (no clock shown). */
  untimed?: boolean
}

const PRAISE = [
  '¡Buen intento! Juega otra vez y consigue estrellas.',
  '¡Vas por buen camino!',
  '¡Muy bien, {child}!',
  '¡Increíble! ¡Lo has hecho genial!',
]

/** Result card shown at the end of every minigame: stars, accuracy, time (never compared with other children). */
export function ResultCard({ result, onContinue, extra, untimed }: ResultCardProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const perfect = result.total > 0 && result.correct === result.total
  return (
    <motion.div
      className={s.result}
      role="dialog"
      aria-label="Resultado"
      initial={reduce ? false : { opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className={s.sparkleLayer} aria-hidden>
        <Sparkles active={result.stars >= 2} count={14} />
      </div>
      <h2 className={s.resultTitle}>{perfect ? '¡Todo bien!' : '¡Terminado!'}</h2>
      <div className={s.resultStars} aria-label={`${result.stars} de 3 estrellas`}>
        {[1, 2, 3].map((n) => (
          <StarIcon key={n} filled={result.stars >= n} size={52} />
        ))}
      </div>
      <p className={s.resultText}>{host.t(PRAISE[result.stars])}</p>
      <div className={s.resultStats}>
        <span className={s.statPill}>Aciertos {result.correct} de {result.total}</span>
        {!untimed && <span className={s.statPill}>Tiempo {formatClock(result.ms)}</span>}
      </div>
      {extra}
      <div className={s.btnRow}>
        <Button size="lg" variant="primary" onClick={onContinue}>Seguir</Button>
      </div>
    </motion.div>
  )
}
