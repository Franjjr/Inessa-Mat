/* A row of beads (skip counting) or chain links (doubling). Pure presentation; the flow hook decides the states. */
import clsx from 'clsx'
import { motion } from 'motion/react'
import s from './shared.module.css'

export type SequenceState = 'given' | 'open' | 'current' | 'filled' | 'revealed'

export interface SequenceCell {
  /** Text shown for given / filled / revealed cells (empty for open ones). */
  text: string
  state: SequenceState
}

export interface SequenceBoardProps {
  cells: SequenceCell[]
  variant: 'beads' | 'chain'
  /** Accessible label of the whole row. */
  label: string
}

export function SequenceBoard({ cells, variant, label }: SequenceBoardProps) {
  const beads = variant === 'beads'
  return (
    <div className={s.sequence} role="group" aria-label={label}>
      {cells.map((c, i) => {
        const cls = beads
          ? clsx(s.bead, c.state === 'given' && s.beadGiven, c.state === 'open' && s.beadOpen,
              c.state === 'current' && s.beadCurrent, c.state === 'filled' && s.beadFilled, c.state === 'revealed' && s.beadRevealed)
          : clsx(s.link, c.state === 'given' && s.linkGiven, c.state === 'open' && s.linkOpen,
              c.state === 'current' && s.linkCurrent, c.state === 'filled' && s.linkFilled, c.state === 'revealed' && s.linkRevealed)
        return (
          <motion.div
            key={i}
            className={cls}
            data-state={c.state}
            layout
            animate={c.state === 'filled' || c.state === 'revealed' ? { scale: [0.7, 1.12, 1] } : undefined}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {c.state === 'open' || c.state === 'current' ? (c.text || '?') : c.text}
          </motion.div>
        )
      })}
    </div>
  )
}
