/* Subtraction visuals: borrowing from the neighbour ("pedir ayuda a la vecina"), borrowing across a zero, and the
   magic check (result + subtrahend = minuend). */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { FINAL, GLIDE, POP, digitsLE, lastStateOf, motionT, numParam, padLE, stateOf } from './types'
import s from './visuals.module.css'

/** The borrowing chain of a subtraction, computed once (units first everywhere). */
export interface BorrowPlan {
  width: number
  /** Top digits as written (units first). */
  orig: number[]
  /** Bottom digits (units first). */
  bottom: number[]
  /** Top digits after each borrowing action (units first). Empty when nothing is borrowed. */
  snapshots: number[][]
  /** Result digits (units first). */
  result: number[]
}

/** Column subtraction with borrowing. Works for any a >= b; across zeros the zero becomes 10 before it lends. */
export function planBorrow(a: number, b: number): BorrowPlan {
  const orig = digitsLE(a)
  const bottomDigits = digitsLE(b)
  const width = Math.max(orig.length, bottomDigits.length)
  const top = padLE(orig, width)
  const bottom = padLE(bottomDigits, width)
  const snapshots: number[][] = []
  const result: number[] = []
  for (let i = 0; i < width; i++) {
    if (top[i] < bottom[i]) {
      let j = i + 1
      while (j < width && top[j] === 0) j++
      if (j >= width) break // a < b: not a valid lesson
      top[j] -= 1
      top[j - 1] += 10
      snapshots.push(top.slice())
      for (let k = j - 1; k > i; k--) {
        top[k] -= 1
        top[k - 1] += 10
        snapshots.push(top.slice())
      }
    }
    result.push(top[i] - bottom[i])
  }
  return { width, orig: padLE(orig, width), bottom, snapshots, result }
}

interface BorrowProps extends VisualProps {
  /** First state that shows the borrowing (2 for one borrow, 1 when the zero case is explained right away). */
  borrowFrom: number
}

function BorrowColumns({ params, phase, runLength, reduced, borrowFrom }: BorrowProps) {
  const a = Math.max(0, Math.floor(numParam(params, 'a', 352)))
  const b = Math.max(0, Math.floor(numParam(params, 'b', 127)))
  const plan = planBorrow(a, b)
  const st = stateOf({ phase, runLength })
  const last = lastStateOf({ runLength })
  const snapIndex = st >= borrowFrom && plan.snapshots.length > 0 ? Math.min(st - borrowFrom, plan.snapshots.length - 1) : -1
  const tops = snapIndex >= 0 ? plan.snapshots[snapIndex] : plan.orig
  const width = plan.width
  const restAt = Math.min(4, last)
  const resultVisible = (k: number) => (k === 0 ? st >= 3 : st >= restAt) || st === FINAL
  const cellVars = { '--col-w': 'clamp(54px, 9vmin, 80px)', '--col-h': 'clamp(56px, 9vmin, 84px)' } as React.CSSProperties
  const colOf = (p: number) => width - 1 - p
  const hintOn = st < borrowFrom && plan.orig[0] < plan.bottom[0]
  const lastComputed = (() => {
    for (let k = width - 1; k >= 0; k--) if (resultVisible(k)) return k
    return -1
  })()

  return (
    <div className={s.stage}>
      <div className={s.grid} style={{ ...cellVars, gridTemplateColumns: `auto repeat(${width}, var(--col-w))` }} data-testid="sub-columns">
        <div />
        {Array.from({ length: width }, (_, p) => {
          const k = colOf(p)
          const changed = tops[k] !== plan.orig[k]
          const lent = changed && tops[k] < plan.orig[k]
          const received = changed && tops[k] > plan.orig[k]
          return (
            <div key={`t${p}`} className={s.cell} style={{ color: changed ? 'var(--c-magic)' : 'var(--c-ink)' }}>
              {changed && (
                <span style={{ position: 'absolute', top: -22, fontSize: 'var(--fs-sm)', color: 'var(--c-ink-mute)', textDecoration: 'line-through' }} data-testid="struck">
                  {plan.orig[k]}
                </span>
              )}
              <motion.span key={`${snapIndex}-${p}`} initial={reduced ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={motionT(reduced, POP)}>
                {k < digitsLE(a).length || changed ? tops[k] : ''}
              </motion.span>
              {lent && <span className={s.tag} style={{ position: 'absolute', bottom: -22, background: 'var(--c-warn-soft)', color: 'var(--c-warn)' }}>−1</span>}
              {received && <span className={s.tag} style={{ position: 'absolute', bottom: -22 }}>+10</span>}
              {hintOn && k === 0 && <span className={s.tag} style={{ position: 'absolute', top: -34, whiteSpace: 'nowrap' }}>{plan.orig[0]} &lt; {plan.bottom[0]}</span>}
            </div>
          )
        })}
        <div className={s.sign}>−</div>
        {Array.from({ length: width }, (_, p) => {
          const k = colOf(p)
          return <div key={`b${p}`} className={s.cell}>{k < digitsLE(b).length ? plan.bottom[k] : ''}</div>
        })}
        <div className={s.line} style={{ gridColumn: `1 / span ${width + 1}` }} />
        <div className={s.sign}>=</div>
        {Array.from({ length: width }, (_, p) => {
          const k = colOf(p)
          const shown = resultVisible(k)
          return (
            <div key={`r${p}`} className={s.cell}>
              {shown && (
                <motion.span key={`r-${st}-${p}`} initial={reduced ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, POP)}>
                  {plan.result[k]}
                </motion.span>
              )}
              {!shown && <span className={s.cellEmpty} style={{ position: 'absolute', inset: 8 }} />}
            </div>
          )
        })}
        <div />
        <div className={s.work} style={{ gridColumn: `2 / span ${width}`, minHeight: 28 }} data-testid="sub-work">
          {st === FINAL
            ? `${a} − ${b} = ${a - b}`
            : lastComputed >= 0
              ? `${tops[lastComputed]} − ${plan.bottom[lastComputed]} = ${plan.result[lastComputed]}`
              : ''}
        </div>
      </div>
    </div>
  )
}

/** 352 − 127: the 2 cannot take 7, so the tens lend a ten to the units. */
export function BorrowVisual(props: VisualProps) {
  return <BorrowColumns {...props} borrowFrom={2} />
}

/** 503 − 128: the tens are 0, so the hundreds lend to the tens (0 becomes 10), and then the tens lend to the units. */
export function ZeroBorrowVisual(props: VisualProps) {
  return <BorrowColumns {...props} borrowFrom={1} />
}

/** The magic check: result + subtrahend = minuend, plus the "llevando" variant (adding 10 to both numbers). */
export function SubCheckVisual({ params, phase, runLength, reduced }: VisualProps) {
  const a = Math.max(0, Math.floor(numParam(params, 'a', 352)))
  const b = Math.max(0, Math.floor(numParam(params, 'b', 127)))
  const c = a - b
  const st = stateOf({ phase, runLength })
  const showResult = st >= 1
  const showCheck = st >= 1
  const width = Math.max(digitsLE(a).length, digitsLE(b).length, digitsLE(c).length)
  const cd = padLE(digitsLE(c), width)
  const bd = padLE(digitsLE(b), width)
  const ad = padLE(digitsLE(a), width)
  const cellVars = { '--col-w': 'clamp(50px, 8vmin, 72px)', '--col-h': 'clamp(52px, 8vmin, 76px)' } as React.CSSProperties
  const colOf = (p: number) => width - 1 - p
  return (
    <div className={s.stage}>
      <p className={`${s.eq} ${s.eqBig}`} data-testid="sub-question">
        {a} − {b} = {showResult ? <motion.span className={s.hl} initial={reduced ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={motionT(reduced, POP)}>{c}</motion.span> : '?'}
      </p>
      {showCheck && (
        <motion.div className={s.panel} style={{ maxWidth: 360, width: 'auto' }} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, GLIDE)} data-testid="sub-check">
          <div className={s.grid} style={{ ...cellVars, gridTemplateColumns: `auto repeat(${width}, var(--col-w))` }}>
            <div />
            {Array.from({ length: width }, (_, p) => <div key={`c${p}`} className={s.cell}>{cd[colOf(p)]}</div>)}
            <div className={s.sign}>+</div>
            {Array.from({ length: width }, (_, p) => <div key={`b${p}`} className={s.cell}>{bd[colOf(p)]}</div>)}
            <div className={s.line} style={{ gridColumn: `1 / span ${width + 1}` }} />
            <div className={s.sign}>=</div>
            {Array.from({ length: width }, (_, p) => <div key={`a${p}`} className={s.cell} style={{ color: 'var(--c-success)' }}>{ad[colOf(p)]}</div>)}
          </div>
          <p className={s.muted} style={{ marginTop: 'var(--sp-2)' }}>
            {c} + {b} = {a} <span className={s.ok}>✔</span>
          </p>
        </motion.div>
      )}
      {st === 2 && (
        <motion.div className={s.panel} style={{ maxWidth: 420, width: 'auto' }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, GLIDE)} data-testid="llevando">
          <p className={s.muted}>Llevando: sumamos 10 arriba y 10 abajo, y la diferencia no cambia.</p>
          <p className={s.eq}>{a} + 10 = {a + 10} · {b} + 10 = {b + 10}</p>
          <p className={s.eq}>{a + 10} − {b + 10} = {c}</p>
        </motion.div>
      )}
    </div>
  )
}
