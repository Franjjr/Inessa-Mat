/* Division visuals: fair sharing into containers, fact families (multiplication run backwards), the Spanish
   "galera" layout and the division check (quotient × divisor + remainder = dividend). */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { FINAL, GLIDE, POP, motionT, numParam, stateOf, strParam } from './types'
import s from './visuals.module.css'

/* ------------------------------------------------------------------ share */

/** Gems dealt one by one into the containers, so every container gets the same amount. */
export function ShareVisual({ params, phase, runLength, reduced }: VisualProps) {
  const total = Math.max(0, Math.min(40, Math.floor(numParam(params, 'total', 12))))
  const groups = Math.max(1, Math.min(6, Math.floor(numParam(params, 'groups', 3))))
  const emoji = strParam(params, 'emoji', '💎')
  const st = stateOf({ phase, runLength })
  const dealt = st >= 1 ? total - (total % groups) : 0
  const each = Math.floor(total / groups)
  const rest = total % groups

  // Positions in % of the stage: the pile on the left, the containers on the right.
  const pileAt = (k: number) => ({ left: `${6 + (k % 3) * 8}%`, top: `${18 + Math.floor(k / 3) * 13}%` })
  const chestLeft = (i: number) => 42 + ((i + 0.5) * 54) / groups
  const chestAt = (i: number, j: number) => ({
    left: `${chestLeft(i) + ((j % 3) - 1) * 4.5}%`,
    top: `${52 + Math.floor(j / 3) * 9}%`,
  })

  return (
    <div className={s.stage} style={{ position: 'relative', justifyContent: 'flex-start' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 680, height: 'min(44cqh, 320px)', minHeight: 220 }} data-testid="share">
        {Array.from({ length: groups }, (_, i) => (
          <div
            key={`chest-${i}`}
            style={{ position: 'absolute', left: `${chestLeft(i) - 8.5}%`, top: '46%', width: '17%', height: '44%', borderRadius: 'var(--r-md)', background: 'var(--w8-soft)', border: '3px solid var(--w8)', boxSizing: 'border-box' }}
          >
            <span className={s.muted} style={{ position: 'absolute', top: -26, left: 0, right: 0, color: 'var(--w8)' }}>Cofre {i + 1}</span>
            {st >= 2 && <span className={s.eqBig} style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-display)', color: 'var(--c-ink)' }}>{each}</span>}
          </div>
        ))}
        {Array.from({ length: total }, (_, k) => {
          const isDealt = k < dealt
          const pos = isDealt ? chestAt(k % groups, Math.floor(k / groups)) : pileAt(k)
          return (
            <motion.span
              key={k}
              style={{ position: 'absolute', transform: 'translate(-50%, -50%)', fontSize: 'clamp(22px, 4cqi, 30px)', lineHeight: 1 }}
              initial={false}
              animate={{ left: pos.left, top: pos.top }}
              transition={motionT(reduced, { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: isDealt ? 0.12 * k : 0 })}
            >
              {emoji}
            </motion.span>
          )
        })}
        {rest > 0 && st >= 1 && (
          <span className={s.tag} style={{ position: 'absolute', left: '4%', bottom: 0 }}>Sobran {rest}</span>
        )}
      </div>
      {st >= 2 && (
        <motion.p className={`${s.eq} ${s.eqBig}`} initial={reduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={motionT(reduced, POP)} data-testid="share-equation">
          {total} ÷ {groups} = <span className={s.hl}>{each}</span>
        </motion.p>
      )}
    </div>
  )
}

/* ----------------------------------------------------------- fact family */

/** Triangle a, b, p and the four facts that belong to it (two products, two divisions). */
export function FactFamilyVisual({ params, phase, runLength, reduced }: VisualProps) {
  const a = Math.max(0, Math.floor(numParam(params, 'a', 3)))
  const b = Math.max(0, Math.floor(numParam(params, 'b', 4)))
  const p = a * b
  const st = stateOf({ phase, runLength })
  const facts = [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`, `${p} ÷ ${a} = ${b}`, `${p} ÷ ${b} = ${a}`]
  const node = (text: number, x: string, y: string, color: string, key: string) => (
    <motion.span
      key={key}
      className={s.chip}
      style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', width: 76, height: 56, fontSize: 'var(--fs-lg)', borderColor: color }}
      initial={reduced ? false : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={motionT(reduced, POP)}
    >
      {text}
    </motion.span>
  )
  return (
    <div className={s.stage}>
      <div style={{ position: 'relative', width: 300, height: 210 }} data-testid="triangle">
        <svg viewBox="0 0 300 210" width="300" height="210" aria-hidden style={{ position: 'absolute', inset: 0 }}>
          <polygon points="150,40 60,170 240,170" fill="none" stroke="var(--c-line)" strokeWidth="6" strokeLinejoin="round" />
        </svg>
        {node(p, '50%', '19%', 'var(--c-magic)', 'p')}
        {node(a, '20%', '81%', 'var(--c-primary)', 'a')}
        {node(b, '80%', '81%', 'var(--c-gold)', 'b')}
      </div>
      <div style={{ display: 'grid', gap: 'var(--sp-2)', width: '100%', maxWidth: 420 }} data-testid="family-facts">
        {facts.map((f, i) => (
          <motion.div key={f} className={s.chip} style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center', fontSize: 'var(--fs-md)' }} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: st >= 1 ? 1 : 0, y: st >= 1 ? 0 : 8 }} transition={motionT(reduced, { ...GLIDE, delay: st >= 1 ? 0.2 * i : 0 })}>
            {f}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ galera */

/** Long division digit by digit: cur is the number being divided (previous rest × 10 + next digit). */
export function longDivision(dividend: number, divisor: number) {
  const digits = String(Math.max(0, Math.floor(dividend))).split('').map(Number)
  let rest = 0
  const steps: { cur: number; digit: number }[] = []
  let quotient = ''
  for (const d of digits) {
    const cur = rest * 10 + d
    const qd = Math.floor(cur / divisor)
    steps.push({ cur, digit: qd })
    rest = cur - qd * divisor
    if (quotient !== '' || qd > 0) quotient += String(qd)
  }
  return { steps, quotient: quotient === '' ? 0 : Number(quotient), remainder: rest }
}

const GALERA_BAR = 'var(--c-ink)'

/** The "casita" of the division: dividend and divisor on top, quotient under the divisor, remainder under the dividend. */
export function GaleraVisual({ params, phase, runLength, reduced }: VisualProps) {
  const dividend = Math.max(0, Math.floor(numParam(params, 'dividend', 84)))
  const divisor = Math.max(1, Math.floor(numParam(params, 'divisor', 4)))
  const st = stateOf({ phase, runLength })
  const plan = longDivision(dividend, divisor)
  const multiDigit = plan.quotient >= 10
  const quotientShown = multiDigit ? st >= 2 : st >= 1
  const remainderShown = quotientShown
  const checkShown = !multiDigit && st >= 2
  const cell: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(36px, 7cqi, 60px)', lineHeight: 1.1, padding: '0 var(--sp-3)', minWidth: 72, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }
  return (
    <div className={s.stage}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 4px auto', gridTemplateRows: 'auto auto', alignItems: 'start' }} data-testid="galera">
        <div style={{ ...cell, gridColumn: 1, gridRow: 1, borderBottom: `4px solid ${GALERA_BAR}`, paddingBottom: 6, justifySelf: 'stretch' }} data-testid="dividend">{dividend}</div>
        <div style={{ gridColumn: 2, gridRow: '1 / span 2', background: GALERA_BAR, width: 4, alignSelf: 'stretch' }} />
        <motion.div
          style={{ ...cell, gridColumn: 3, gridRow: 1, borderBottom: `4px solid ${GALERA_BAR}`, paddingBottom: 6, justifySelf: 'stretch', position: 'relative', color: multiDigit && st === 1 ? 'var(--c-magic)' : 'var(--c-ink)' }}
          animate={multiDigit && st === 1 && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={motionT(reduced, { duration: 0.8, repeat: multiDigit && st === 1 ? Infinity : 0, repeatDelay: 0.4 })}
          data-testid="divisor"
        >
          {divisor}
        </motion.div>
        <div style={{ ...cell, gridColumn: 1, gridRow: 2, textAlign: 'right', color: 'var(--c-magic)', minHeight: 60 }} data-testid="remainder">
          {remainderShown ? plan.remainder : ''}
        </div>
        <motion.div style={{ ...cell, gridColumn: 3, gridRow: 2, minHeight: 60, color: 'var(--c-primary)' }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: quotientShown ? 1 : 0 }} transition={motionT(reduced, GLIDE)} data-testid="quotient">
          {quotientShown ? plan.quotient : ''}
        </motion.div>
      </div>
      {multiDigit && st >= 2 && (
        <div className={s.row} data-testid="galera-work">
          {plan.steps.map((step, i) => (
            <span key={i} className={s.tag} style={{ fontSize: 'var(--fs-md)' }}>{step.cur} ÷ {divisor} = {step.digit}</span>
          ))}
        </div>
      )}
      {!multiDigit && st >= 1 && (
        <motion.p className={s.eq} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, GLIDE)} data-testid="galera-product">
          {plan.quotient} × {divisor} = {plan.quotient * divisor} · {dividend} − {plan.quotient * divisor} = {plan.remainder}
        </motion.p>
      )}
      {checkShown && (
        <motion.p className={s.muted} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, GLIDE)}>
          El resto ({plan.remainder}) es <b>menor</b> que el divisor ({divisor}).
        </motion.p>
      )}
      {multiDigit && st === 1 && <p className={s.muted}>Mira cuántas veces cabe el {divisor} en cada cifra.</p>}
      {st === FINAL && multiDigit && <p className={s.eq}>Cociente: {plan.quotient}</p>}
    </div>
  )
}

/* ------------------------------------------------------------- check */

/** The division check: quotient × divisor + remainder = dividend. */
export function DivisionCheckVisual({ params, phase, runLength, reduced }: VisualProps) {
  const dividend = Math.max(0, Math.floor(numParam(params, 'dividend', 17)))
  const divisor = Math.max(1, Math.floor(numParam(params, 'divisor', 5)))
  const q = Math.floor(dividend / divisor)
  const r = dividend % divisor
  const st = stateOf({ phase, runLength })
  return (
    <div className={s.stage}>
      <p className={`${s.eq} ${s.eqBig}`} data-testid="check-equation">
        {q} × {divisor} + {r} = {st >= 1 ? <motion.span className={s.hl} initial={reduced ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={motionT(reduced, POP)}>{dividend}</motion.span> : '?'}
      </p>
      {st >= 1 && (
        <motion.div className={s.panel} style={{ maxWidth: 420, width: 'auto' }} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, GLIDE)}>
          <p className={s.muted}>cociente × divisor + resto = dividendo</p>
          <p className={s.eq}>{q * divisor} + {r} = {dividend} <span className={s.ok}>✔</span></p>
        </motion.div>
      )}
    </div>
  )
}
