/* Escalating hints: shows the latest revealed hint (strategy → visual → worked step) with its visual scaffold. */
import { AnimatePresence, motion } from 'motion/react'
import type { Hint } from '@/types'
import { useActivityHost } from '../../host'
import s from './shared.module.css'

const MAX_DOTS = 60

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function Dots({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, MAX_DOTS) }, (_, i) => (
        <span key={i} className={s.dot} aria-hidden />
      ))}
    </>
  )
}

/** Small visual scaffolds driven by the hint params from @/engine (groups, arrays, sharing, skip chains). */
export function HintVisual({ hint }: { hint: Hint }) {
  const p = hint.params ?? {}
  switch (hint.visual) {
    case 'groups': {
      const groups = num(p.groups)
      const per = num(p.perGroup)
      if (groups <= 0 || per <= 0 || groups * per > MAX_DOTS) return null
      return (
        <div className={s.hintVisual} aria-hidden>
          {Array.from({ length: groups }, (_, g) => (
            <span key={g} className={s.group}><Dots count={per} /></span>
          ))}
        </div>
      )
    }
    case 'array': {
      const rows = num(p.rows)
      const cols = num(p.cols)
      if (rows <= 0 || cols <= 0 || rows * cols > MAX_DOTS) return null
      return (
        <div className={s.hintVisual} aria-hidden>
          <div className={s.dotGrid} style={{ gridTemplateColumns: `repeat(${cols}, 14px)` }}>
            <Dots count={rows * cols} />
          </div>
        </div>
      )
    }
    case 'share': {
      const total = num(p.total)
      const groups = num(p.groups)
      const per = num(p.perGroup)
      if (groups <= 0 || per <= 0 || total > MAX_DOTS * 2) return null
      return (
        <div className={s.hintVisual} aria-hidden>
          {Array.from({ length: Math.min(groups, 12) }, (_, g) => (
            <span key={g} className={s.group}><Dots count={per} /></span>
          ))}
        </div>
      )
    }
    case 'skip-count': {
      const step = num(p.step)
      const count = num(p.count, 0) || num(p.length, 0)
      const start = num(p.start, 1)
      const index = p.index === undefined ? -1 : num(p.index, -1)
      // blank: the chip at `index` is a «?» (the answer is the value it stands for; it is never drawn).
      const blank = p.blank === 1
      if (step <= 0 || count <= 0) return null
      return (
        <div className={s.hintVisual} aria-hidden>
          {Array.from({ length: Math.min(count, 12) }, (_, i) => (
            <span key={i} className={`${s.chip} ${i === index ? s.chipHot : ''}`}>{blank && i === index ? '?' : step * (start + i)}</span>
          ))}
        </div>
      )
    }
    case 'double-chain': {
      const start = num(p.start)
      const steps = num(p.steps)
      if (start <= 0 || steps <= 0) return null
      const values = [start, ...Array.from({ length: Math.min(steps, 6) }, (_, i) => start * 2 ** (i + 1))]
      return (
        <div className={s.hintVisual} aria-hidden>
          {values.map((v, i) => (
            <span key={`v${i}`} className={s.chip}>{v}</span>
          )).flatMap((el, i) => (i === 0 ? [el] : [<span key={`a${i}`} className={s.arrow}>→</span>, el]))}
        </div>
      )
    }
    case 'dots-five-plus-one': {
      // «El 5 y uno más»: 5 rows of b dots, then the extra rows (one for a 6, two for a 7) in the highlight colour.
      const a = num(p.a)
      const b = num(p.b)
      if (a < 6 || b <= 0 || a * b > 80) return null
      return (
        <div className={s.hintVisual} aria-hidden>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="dots-five-plus-one">
            {Array.from({ length: a }, (_, r) => (
              // The extra rows take another colour through the dots' --accent (shared.module.css).
              <span key={r} data-extra={r >= 5 ? 'true' : undefined} style={{ display: 'flex', gap: 6, ...(r >= 5 ? { ['--accent' as string]: 'var(--c-gold)' } : {}) }}>
                <Dots count={b} />
              </span>
            ))}
          </div>
        </div>
      )
    }
    case 'nine-trick': {
      // «El truco del 9»: the first digit is one less than the factor, and the two digits add up to 9.
      const a = num(p.a)
      if (a < 2 || a > 10) return null
      return (
        <div className={s.hintVisual} aria-hidden>
          <span className={s.chip}>{a - 1}</span>
          <span className={s.arrow}>+</span>
          <span className={`${s.chip} ${s.chipHot}`}>?</span>
          <span className={s.arrow}>=</span>
          <span className={s.chip}>9</span>
        </div>
      )
    }
    case 'words': {
      // Lengua: a card of examples or questions (words, never the answer of the exercise; see src/engine/lengua/grammar.ts).
      const words = Array.isArray(p.words) ? p.words : []
      if (words.length === 0) return null
      return (
        <div className={s.hintVisual}>
          {words.map((w, i) => <span key={i} className={s.chip}>{w}</span>)}
        </div>
      )
    }
    default:
      return null
  }
}

export interface HintPanelProps {
  hints: Hint[]
  /** How many hints are revealed so far (0 = none). */
  shown: number
}

export function HintPanel({ hints, shown }: HintPanelProps) {
  const host = useActivityHost()
  const hint = shown > 0 ? hints[Math.min(shown, hints.length) - 1] : undefined
  return (
    <AnimatePresence mode="wait" initial={false}>
      {hint && (
        <motion.div
          key={hint.level}
          className={s.hintBox}
          role="note"
          aria-live="polite"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <p className={s.hintLevel}>Pista {hint.level} de {hints.length}</p>
          <p className={s.hintText}>{host.t(hint.text)}</p>
          <HintVisual hint={hint} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
