/* Times-table visuals: the easy tables, the known facts map, the rhyme of the 6, the units pattern of the 8,
   5-6-7-8, the trick of the 9 and the double chain (the 7 × 7 rhyme lives in multiplication.tsx). */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { FINAL, GLIDE, POP, digitsLE, motionT, numParam, stateOf } from './types'
import s from './visuals.module.css'

/* ------------------------------------------------------------ easy tables */

/** × 1 stays the same, × 2 is the double, × 5 ends in 0 or 5, × 10 adds a zero. One card lights up per step. */
export function EasyTablesVisual({ phase, runLength, reduced }: VisualProps) {
  const st = stateOf({ phase, runLength })
  const active = st === FINAL ? -1 : st - 1 // card 0..3 lights up after the intro step
  const cards = [
    { key: '×1', title: 'Se queda igual', body: <span className={s.eq}>7 × 1 = <span className={s.hl}>7</span></span> },
    { key: '×2', title: 'Es el doble', body: <span className={s.eq}>2 × 8 = 8 + 8 = <span className={s.hl}>16</span></span> },
    {
      key: '×5',
      title: 'Acaba en 0 o en 5',
      body: (
        <div className={s.row}>
          {[5, 10, 15, 20].map((v, i) => (
            <motion.span key={v} className={s.chip} style={{ minWidth: 44, height: 44, fontSize: 'var(--fs-md)' }} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, { ...POP, delay: 0.15 * i })}>
              {v}
            </motion.span>
          ))}
        </div>
      ),
    },
    { key: '×10', title: 'Pon un 0', body: <span className={s.eq}>10 × 6 = 6<motion.span className={s.hl} style={{ display: 'inline-block' }} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, POP)}>0</motion.span></span> },
  ]
  return (
    <div className={s.stage}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--sp-3)', width: '100%', maxWidth: 760 }}>
        {cards.map((c, i) => {
          const on = i === active
          const dim = active >= 0 && !on
          return (
            <motion.div
              key={c.key}
              className={s.panel}
              style={{ maxWidth: 'none', opacity: dim ? 0.45 : 1, borderColor: on ? 'var(--c-magic)' : undefined, background: on ? 'var(--c-magic-soft)' : undefined, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', alignItems: 'center' }}
              animate={{ scale: on ? 1.03 : 1, opacity: dim ? 0.45 : 1 }}
              transition={motionT(reduced, GLIDE)}
            >
              <span className={s.tag}>{c.key}</span>
              <span className={s.muted}>{c.title}</span>
              {c.body}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ known facts */

/** Facts of the table the child already knows from earlier worlds (the workbook's "ya la sabes" marks). */
const KNOWN: Record<number, number[]> = {
  6: [1, 2, 5, 10],
  7: [1, 2, 4, 5, 6, 8, 10],
  8: [1, 2, 5, 6, 7, 10],
}

/** A times table: ✔ marks what is known, then ✨ marks the new facts, then the new rows are highlighted. */
export function KnownFactsVisual({ params, phase, runLength, reduced }: VisualProps) {
  const table = numParam(params, 'table', 6)
  const st = stateOf({ phase, runLength })
  const known = KNOWN[table] ?? [1, 2, 5, 10]
  const rows = Array.from({ length: 10 }, (_, i) => i + 1)
  return (
    <div className={s.stage}>
      <p className={s.eq}>La tabla del {table}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--sp-2)', width: '100%', maxWidth: 560 }} data-testid="known-table">
        {rows.map((k) => {
          const isKnown = known.includes(k)
          const isNew = !isKnown
          const highlight = isNew && st >= 2
          return (
            <motion.div
              key={k}
              className={s.chip}
              style={{ justifyContent: 'space-between', minHeight: 52, padding: '0 var(--sp-4)', width: '100%', boxSizing: 'border-box', background: highlight ? 'var(--c-magic-soft)' : undefined, borderColor: highlight ? 'var(--c-magic)' : undefined }}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={motionT(reduced, { duration: 0.3, delay: 0.03 * k })}
              data-known={isKnown ? 'yes' : 'no'}
            >
              <span>{table} × {k} = {table * k}</span>
              {isKnown && <span className={s.ok} aria-label="ya la sabes">✔</span>}
              {isNew && st >= 1 && <span className={s.tag}>✨ nueva</span>}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ even rhyme */

/** 6 × even number: the result ends in that same digit, and in front of it goes half of the even number. */
export function EvenSixRhymeVisual({ phase, runLength, reduced }: VisualProps) {
  const st = stateOf({ phase, runLength })
  const facts = [2, 4, 6, 8]
  return (
    <div className={s.stage}>
      <div style={{ display: 'grid', gap: 'var(--sp-3)', width: '100%', maxWidth: 420 }} data-testid="rhyme">
        {facts.map((f, i) => {
          const product = String(6 * f)
          const focus = f === 8 && st >= 2
          const unitsLit = st >= 1
          return (
            <motion.div key={f} className={s.chip} style={{ justifyContent: 'space-between', width: '100%', boxSizing: 'border-box', padding: '0 var(--sp-5)', fontSize: 'var(--fs-lg)', background: focus ? 'var(--c-magic-soft)' : undefined, borderColor: focus ? 'var(--c-magic)' : undefined }} initial={reduced ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={motionT(reduced, { duration: 0.3, delay: 0.1 * i })}>
              <span>6 × {f} =</span>
              <span className={s.eqBig} style={{ fontFamily: 'var(--font-display)' }}>
                {product.split('').map((d, j) => {
                  const isUnits = j === product.length - 1
                  const isHalf = focus && j === 0
                  return (
                    <span key={j} className={unitsLit && isUnits ? s.hl : undefined} style={{ color: isHalf ? 'var(--c-gold)' : undefined, textDecoration: unitsLit && isUnits ? 'underline' : undefined }}>
                      {d}
                    </span>
                  )
                })}
              </span>
            </motion.div>
          )
        })}
      </div>
      {st >= 1 && <p className={s.muted}>El resultado termina en el mismo número del par.</p>}
      {st >= 2 && <p className={s.eq}>Mitad de 8 = <span className={s.hl}>4</span> → <span className={s.hl}>48</span></p>}
    </div>
  )
}

/* ------------------------------------------------------------ units pattern */

/** The units digit of the table runs down in twos: 8, 6, 4, 2, 0, then it starts again. */
export function PatternUnitsVisual({ params, phase, runLength, reduced }: VisualProps) {
  const table = numParam(params, 'table', 8)
  const st = stateOf({ phase, runLength })
  const values = Array.from({ length: 10 }, (_, i) => table * (i + 1))
  return (
    <div className={s.stage}>
      <div className={s.row} style={{ maxWidth: 640 }} data-testid="pattern">
        {values.map((v, i) => {
          const units = digitsLE(v)[0]
          return (
            <motion.span key={i} className={s.chip} style={{ minWidth: 60, height: 60, borderColor: st >= 1 ? 'var(--c-magic)' : undefined }} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, { ...POP, delay: 0.06 * i })}>
              <span>{v}</span>
              <span className={st >= 1 ? s.hl : s.muted} style={{ fontSize: 'var(--fs-xs)', position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center' }}>{units}</span>
            </motion.span>
          )
        })}
      </div>
      {st >= 1 && (
        <div className={s.row} data-testid="units-path">
          {values.slice(0, 5).map((v, i) => (
            <span key={i} className={s.row} style={{ gap: 'var(--sp-2)' }}>
              <span className={s.eqBig} style={{ fontSize: 'var(--fs-xl)', color: 'var(--c-magic)' }}>{digitsLE(v)[0]}</span>
              {i < 4 && <span className={s.muted}>−2</span>}
            </span>
          ))}
          <span className={s.muted}>… ¡y vuelve a empezar!</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ 5 6 7 8 */

/** 5, 6, 7, 8: the digits in a row, and the rhyme: 56 = 7 × 8. */
export function FiveSixSevenEightVisual({ reduced }: VisualProps) {
  return (
    <div className={s.stage}>
      <div className={s.row}>
        {[5, 6, 7, 8].map((d, i) => (
          <motion.span key={d} className={s.chip} style={{ width: 70, height: 70, fontSize: 'var(--fs-xl)' }} initial={reduced ? false : { y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={motionT(reduced, { ...POP, delay: 0.2 * i })}>
            {d}
          </motion.span>
        ))}
      </div>
      <motion.p className={`${s.eq} ${s.eqBig}`} initial={reduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={motionT(reduced, { ...POP, delay: 0.9 })}>
        <span className={s.hl}>5 6</span> = 7 × 8
      </motion.p>
      <p className={s.muted}>Las dos cifras de 56 son 5 y 6; y 7 × 8 = 56.</p>
    </div>
  )
}

/* ------------------------------------------------------------ 9 trick */

/** 7 × 9: the first digit is one less than the factor, and the two digits add up to 9. */
export function NineTrickVisual({ params, phase, runLength, reduced }: VisualProps) {
  const a = Math.max(1, Math.min(9, Math.floor(numParam(params, 'a', 7))))
  const st = stateOf({ phase, runLength })
  const first = a - 1
  const second = 9 - first
  const product = 9 * a
  return (
    <div className={s.stage}>
      <p className={`${s.eq} ${s.eqBig}`}>{a} × 9 = {st >= 1 ? <span className={s.hl}>{product}</span> : '?'}</p>
      <div className={s.row} style={{ gap: 'var(--sp-3)' }}>
        <motion.span className={s.chip} style={{ width: 80, height: 80, fontSize: 'var(--fs-2xl)', background: st >= 0 ? 'var(--c-magic-soft)' : undefined, borderColor: 'var(--c-magic)' }} initial={reduced ? false : { scale: 0.5 }} animate={{ scale: 1 }} transition={motionT(reduced, POP)}>
          {first}
        </motion.span>
        {st >= 1 && (
          <motion.span className={s.chip} style={{ width: 80, height: 80, fontSize: 'var(--fs-2xl)' }} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, POP)}>
            {second}
          </motion.span>
        )}
      </div>
      {st >= 1 && <p className={s.eq}>{first} + {second} = 9</p>}
      {st === 0 && <p className={s.muted}>Uno menos que {a}: {first}</p>}
      {st >= 2 && <p className={s.eq}>{a * 10} − {a} = <span className={s.hl}>{product}</span></p>}
    </div>
  )
}

/* ------------------------------------------------------------ double chain */

/** Doubling three times multiplies by 8: each arrow doubles the number on its left. */
export function DoubleChainVisual({ params, phase, runLength, reduced }: VisualProps) {
  const start = numParam(params, 'start', 3)
  const steps = Math.max(1, Math.min(5, numParam(params, 'steps', 3)))
  const st = stateOf({ phase, runLength })
  const shown = st === FINAL || st >= 1 ? steps : 0
  const values = [start]
  for (let i = 0; i < steps; i++) values.push(values[i] * 2)
  const factor = 2 ** steps
  return (
    <div className={s.stage}>
      <div className={s.row} data-testid="chain">
        {values.map((v, i) => {
          const visible = i <= shown
          return (
            <span key={i} className={s.row} style={{ gap: 'var(--sp-2)' }}>
              {i > 0 && (
                <motion.span className={s.tag} style={{ fontSize: 'var(--fs-sm)' }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={motionT(reduced, { duration: 0.3, delay: 0.25 * i })}>
                  ×2
                </motion.span>
              )}
              <motion.span
                className={s.chip}
                style={{ width: 84, height: 84, fontSize: 'var(--fs-xl)', borderColor: i === 0 ? 'var(--c-primary)' : 'var(--c-magic)' }}
                initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: visible ? 1 : 0.4, opacity: visible ? 1 : 0.25 }}
                transition={motionT(reduced, { ...POP, delay: 0.25 * i })}
              >
                {v}
              </motion.span>
            </span>
          )
        })}
      </div>
      {shown > 0 && (
        <motion.p className={s.eq} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, { duration: 0.4, delay: 0.25 * steps })}>
          {Array.from({ length: steps }, () => '× 2').join(' ')} = × {factor}
        </motion.p>
      )}
    </div>
  )
}

