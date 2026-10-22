/* Addition visuals: place-value houses ("cada número en su casa") and column addition with carries
   ("me llevo una"). */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { FINAL, GLIDE, POP, digitsLE, motionT, numParam, padLE, stateOf } from './types'
import s from './visuals.module.css'

const HOUSE_NAMES = ['U', 'D', 'C', 'UM'] // from the right
const HOUSE_LONG = ['unidades', 'decenas', 'centenas', 'unidades de mil']
const HOUSE_COLOR: Record<string, { c: string; soft: string }> = {
  U: { c: 'var(--pv-u)', soft: 'var(--pv-u-soft)' },
  D: { c: 'var(--pv-d)', soft: 'var(--pv-d-soft)' },
  C: { c: 'var(--pv-c)', soft: 'var(--pv-c-soft)' },
  UM: { c: 'var(--pv-um)', soft: 'var(--pv-um-soft)' },
}

/** The number written in its houses: digits drop in from the right, then the house names, then the values. */
export function PlaceValueVisual({ params, phase, runLength, reduced }: VisualProps) {
  const n = Math.max(0, Math.floor(numParam(params, 'n', 2486)))
  const st = stateOf({ phase, runLength })
  const digits = digitsLE(n) // units first
  const count = digits.length
  const houses = Array.from({ length: count }, (_, p) => {
    const k = count - 1 - p // column from the right
    const name = HOUSE_NAMES[k] ?? 'UM'
    return { k, name, digit: digits[k], value: digits[k] * 10 ** k, long: HOUSE_LONG[k] ?? 'miles' }
  })
  const showValues = st >= 2
  return (
    <div className={s.stage}>
      <div className={s.row} style={{ alignItems: 'flex-end', gap: 'clamp(8px, 2cqi, 20px)' }} data-testid="houses">
        {houses.map((h) => {
          const color = HOUSE_COLOR[h.name] ?? HOUSE_COLOR.UM
          const isUnits = h.k === 0
          const highlight = isUnits && st >= 1
          return (
            <div key={h.k} className={s.house} data-testid="house">
              <svg className={s.roof} viewBox="0 0 34 13" preserveAspectRatio="none" aria-hidden>
                <polygon points="2,13 17,1 32,13" fill={color.c} />
              </svg>
              <motion.div
                className={s.body}
                style={{ background: color.soft, borderColor: color.c }}
                initial={reduced ? false : { x: 60, opacity: 0 }}
                animate={highlight && !reduced ? { x: 0, opacity: 1, scale: [1, 1.06, 1] } : { x: 0, opacity: 1, scale: 1 }}
                transition={motionT(reduced, { ...POP, delay: st === 0 ? 0.25 * (count - 1 - h.k) : 0, scale: { duration: 0.6, repeat: highlight ? Infinity : 0, repeatDelay: 0.6 } })}
              >
                <span className={s.houseName} style={{ color: color.c }}>{h.name}</span>
                <span className={s.houseDigit} style={{ color: 'var(--c-ink)' }}>{h.digit}</span>
                <span className={s.muted} style={{ fontSize: 'var(--fs-xs)' }}>{h.long}</span>
              </motion.div>
              {highlight && <span className={s.tag}>¡Empieza aquí!</span>}
              {showValues && (
                <motion.span className={s.eq} style={{ color: color.c, fontSize: 'var(--fs-md)' }} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, GLIDE)}>
                  {h.value}
                </motion.span>
              )}
            </div>
          )
        })}
      </div>
      {showValues && (
        <motion.p className={s.eq} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, GLIDE)}>
          {n} = {houses.filter((h) => h.digit > 0).map((h) => h.value).join(' + ')}
        </motion.p>
      )}
    </div>
  )
}

/**
 * Column addition. Each step adds one column (units first) and writes its digit; a ten is carried into the
 * next column as a small "mochila" above it.
 */
export function CarryVisual({ params, phase, runLength, reduced }: VisualProps) {
  const a = Math.max(0, Math.floor(numParam(params, 'a', 368)))
  const b = Math.max(0, Math.floor(numParam(params, 'b', 257)))
  const st = stateOf({ phase, runLength })
  const sum = a + b
  const ad = digitsLE(a)
  const bd = digitsLE(b)
  const cols = Math.max(ad.length, bd.length)
  const width = Math.max(digitsLE(sum).length, cols)
  const computed = st === FINAL ? cols : Math.min(st, cols)

  // Per-column results (units first).
  // carryIn[k] is the carry written above column k; carryIn[cols] is the final carry (a new leading digit).
  const carryIn: number[] = []
  const outDigit: number[] = []
  const work: string[] = []
  let carry = 0
  for (let k = 0; k < cols; k++) {
    const x = ad[k] ?? 0
    const y = bd[k] ?? 0
    const total = x + y + carry
    carryIn.push(carry)
    outDigit.push(total % 10)
    work.push(carry ? `${x} + ${y} + ${carry} = ${total}` : `${x} + ${y} = ${total}`)
    carry = Math.floor(total / 10)
  }
  carryIn.push(carry)
  const resultLE = padLE(digitsLE(sum), width)
  const glow = st === FINAL || st > cols
  const cellVars = { '--col-w': 'clamp(54px, 9vmin, 80px)', '--col-h': 'clamp(56px, 9vmin, 84px)' } as React.CSSProperties
  const colOf = (p: number) => width - 1 - p // column from the right for a left-to-right index

  const operandCell = (list: number[], k: number) => (k < list.length ? list[k] : null)

  return (
    <div className={s.stage}>
      <div className={s.grid} style={{ ...cellVars, gridTemplateColumns: `auto repeat(${width}, var(--col-w))` }} data-testid="carry-columns">
        {/* carry row: the carry out of column k-1 sits above column k */}
        <div />
        {Array.from({ length: width }, (_, p) => {
          const k = colOf(p)
          const c = k >= 1 && k <= cols ? carryIn[k] : 0 // k = cols: the final carry
          const shown = k >= 1 && k - 1 < computed && c > 0
          return (
            <div key={`c${p}`} style={{ height: 'calc(var(--col-h) * 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {shown && (
                <motion.span className={`${s.carry} ${glow ? s.carryGlow : ''}`} initial={reduced ? false : { scale: 0, y: 12 }} animate={{ scale: 1, y: 0 }} transition={motionT(reduced, POP)} data-testid="carry">
                  {c}
                </motion.span>
              )}
            </div>
          )
        })}
        {/* operand a */}
        <div />
        {Array.from({ length: width }, (_, p) => {
          const d = operandCell(ad, colOf(p))
          return <div key={`a${p}`} className={s.cell}>{d ?? ''}</div>
        })}
        {/* operand b */}
        <div className={s.sign}>+</div>
        {Array.from({ length: width }, (_, p) => {
          const d = operandCell(bd, colOf(p))
          return <div key={`b${p}`} className={s.cell}>{d ?? ''}</div>
        })}
        <div className={s.line} style={{ gridColumn: `1 / span ${width + 1}` }} />
        {/* result */}
        <div className={s.sign}>=</div>
        {Array.from({ length: width }, (_, p) => {
          const k = colOf(p)
          const isColumn = k < cols
          const done = isColumn ? k < computed : computed >= cols
          const digit = resultLE[k]
          return (
            <div key={`r${p}`} className={s.cell} style={{ color: glow ? 'var(--c-magic)' : 'var(--c-ink)' }}>
              {done && (
                <motion.span key={`${st}-${p}`} initial={reduced ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, POP)}>
                  {digit}
                </motion.span>
              )}
              {!done && isColumn && <span className={s.cellEmpty} style={{ position: 'absolute', inset: 8 }} />}
            </div>
          )
        })}
        <div />
        <div className={s.work} style={{ gridColumn: `2 / span ${width}`, minHeight: 28 }} data-testid="carry-work">
          {st === FINAL ? `${a} + ${b} = ${sum}` : computed > 0 ? work[computed - 1] : ''}
        </div>
      </div>
    </div>
  )
}

