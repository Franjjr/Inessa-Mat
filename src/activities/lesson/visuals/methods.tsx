/* Method visuals for the new lessons: the part-part-whole bar («problemas con barras»), repartir por partes (a dividend
   split into its parts) and multiplicar hacia arriba (the multiples of the divisor, one row at a time). Each one
   reveals its steps by phase, like the other visuals; the last phase shows the whole. */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { POP, motionT, numParam, stateOf } from './types'
import s from './visuals.module.css'

/* ------------------------------------------------------------------ bar model */

/** Two parts drawn one after the other, then the bracket of the whole with the equation. */
export function BarModelVisual({ params, phase, runLength, reduced }: VisualProps) {
  const a = Math.max(1, Math.min(60, Math.floor(numParam(params, 'a', 5))))
  const b = Math.max(1, Math.min(60, Math.floor(numParam(params, 'b', 3))))
  const total = a + b
  const st = stateOf({ phase, runLength })
  const wa = (a / total) * 100
  const piece = (widthPct: number, color: string, label: string, shown: boolean) => (
    <motion.div
      key={label}
      initial={false}
      animate={{ opacity: shown ? 1 : 0.15, scale: shown ? 1 : 0.96 }}
      transition={motionT(reduced, POP)}
      style={{
        width: `${widthPct}%`, minWidth: 64, height: 'clamp(56px, 12cqh, 84px)', borderRadius: 'var(--r-md)',
        background: color, border: '3px solid var(--c-ink-soft)', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', color: 'var(--c-ink)',
      }}
    >
      {shown ? label : '?'}
    </motion.div>
  )
  return (
    <div className={s.stage} style={{ justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }} data-testid="bar-model">
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          {piece(wa, 'var(--c-primary-soft)', String(a), st >= 1)}
          {piece(100 - wa, 'var(--c-gold-soft)', String(b), st >= 2)}
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: st >= 3 ? 1 : 0.2 }}
          transition={motionT(reduced, { duration: 0.4 })}
          style={{ borderTop: '3px solid var(--c-ink-soft)', textAlign: 'center', paddingTop: 6, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)' }}
        >
          {st >= 3 ? `${a} + ${b} = ${total}` : 'El total es toda la barra'}
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ repartir por partes */

/** The dividend split into its parts, each part divided, and the quotients added: 84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4 = 20 + 1. */
export function DivPartsVisual({ params, phase, runLength, reduced }: VisualProps) {
  const dividend = Math.max(10, Math.min(999, Math.floor(numParam(params, 'dividend', 84))))
  const divisor = Math.max(2, Math.min(9, Math.floor(numParam(params, 'divisor', 4))))
  const digits = String(dividend).split('').map(Number)
  const parts: { part: number; q: number; r: number }[] = []
  let carried = 0
  digits.forEach((d, i) => {
    const place = digits.length - 1 - i
    if (d === 0 && place !== 0) return
    const part = d * 10 ** place
    const partial = carried + part
    const q = Math.floor(partial / divisor)
    carried = partial - q * divisor
    parts.push({ part, q, r: carried })
  })
  const total = parts.reduce((sum, p) => sum + p.q, 0)
  const st = stateOf({ phase, runLength })
  const shownParts = Math.min(parts.length, Math.max(0, st))
  return (
    <div className={s.stage} style={{ justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'center' }} data-testid="div-parts">
        <p className={s.eqBig} style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)' }}>
          {`${dividend} = ${parts.map((p) => p.part).join(' + ')}`}
        </p>
        {parts.map((p, k) => (
          <motion.p
            key={k}
            initial={false}
            animate={{ opacity: k < shownParts ? 1 : 0.15 }}
            transition={motionT(reduced, { duration: 0.3 })}
            style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)' }}
          >
            {k < shownParts ? `${p.part}${k > 0 && parts[k - 1].r ? ` + ${parts[k - 1].r}` : ''} ÷ ${divisor} = ${p.q}${p.r ? ` y sobra ${p.r}` : ''}` : '…'}
          </motion.p>
        ))}
        {st >= parts.length + 1 && (
          <p className={s.eqBig} style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)' }}>
            {`${parts.map((p) => p.q).join(' + ')} = ${total}`}
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ multiplicar hacia arriba */

/** The multiples of the divisor, one row at a time, until one passes the dividend. */
export function DivClimbVisual({ params, phase, runLength, reduced }: VisualProps) {
  const divisor = Math.max(2, Math.min(9, Math.floor(numParam(params, 'divisor', 4))))
  const quotient = Math.max(1, Math.min(9, Math.floor(numParam(params, 'quotient', 7))))
  const dividend = divisor * quotient
  const rows = Array.from({ length: quotient }, (_, k) => ({ k: k + 1, p: divisor * (k + 1) }))
  const st = stateOf({ phase, runLength })
  return (
    <div className={s.stage} style={{ justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }} data-testid="div-climb">
        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)' }}>
          {`¿Qué número por ${divisor} da ${dividend}, o se acerca sin pasarse?`}
        </p>
        {rows.map((r, i) => {
          const shown = i < Math.max(0, st)
          const passes = r.p >= dividend
          return (
            <motion.div
              key={r.k}
              initial={false}
              animate={{ opacity: shown ? 1 : 0.12, scale: shown ? 1 : 0.97 }}
              transition={motionT(reduced, POP)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', padding: '4px 14px', borderRadius: 'var(--r-md)',
                background: passes ? 'var(--c-warn-soft)' : 'var(--c-surface)', boxShadow: 'var(--shadow-1)', minWidth: 160, textAlign: 'center',
              }}
            >
              {`${divisor} × ${r.k} = ${r.p}${passes ? ` (¡llega a ${dividend}!)` : ''}`}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
