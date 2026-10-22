/* Multiplication visuals: groups, the mirror rule, the 5-and-one trick, splitting, column multiplication,
   and the 7×7 rhyme. Each component reads its phase (see types.ts) and draws that state. */
import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { FINAL, GLIDE, POP, digitsLE, motionT, numParam, padLE, stateOf, strParam } from './types'
import s from './visuals.module.css'

const ROW_COLORS = ['var(--c-primary)', 'var(--c-magic)', 'var(--c-gold)', 'var(--w1)', 'var(--w2)', 'var(--w3)', 'var(--w4)']

/* ------------------------------------------------------------------ groups */

/** n groups of k objects: "4 × 3" as groups, then as a repeated addition, then as a product. */
export function GroupsVisual({ params, phase, runLength, reduced }: VisualProps) {
  const groups = numParam(params, 'groups', 3)
  const perGroup = numParam(params, 'perGroup', 2)
  const emoji = strParam(params, 'emoji', '🍄')
  const st = stateOf({ phase, runLength })
  const sum = Array.from({ length: groups }, () => String(perGroup)).join(' + ')
  return (
    <div className={s.stage}>
      <div className={s.row} style={{ alignItems: 'stretch' }}>
        {Array.from({ length: groups }, (_, g) => (
          <motion.div
            key={g}
            className={s.panel}
            style={{ width: 'auto', padding: 'var(--sp-3)', maxWidth: 'none', background: 'var(--c-primary-soft)', borderColor: 'var(--c-primary)' }}
            initial={reduced ? false : { scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={motionT(reduced, { ...POP, delay: 0.12 * g })}
            data-testid="group"
          >
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(perGroup, 4)}, auto)`, gap: 4 }}>
              {Array.from({ length: perGroup }, (_, k) => (
                <span key={k} className={s.emoji}>{emoji}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      {st >= 1 && (
        <motion.p className={s.eq} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, GLIDE)}>
          {sum} = {groups * perGroup}
        </motion.p>
      )}
      {st >= 2 && (
        <motion.p className={`${s.eq} ${s.eqBig}`} initial={reduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={motionT(reduced, POP)}>
          {groups} × {perGroup} = <span className={s.hl}>{groups * perGroup}</span>
        </motion.p>
      )}
      {st >= 3 && (
        <div className={s.row}>
          <span className={s.tag}>{groups} grupos</span>
          <span className={s.tag}>{perGroup} en cada grupo</span>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------- array (mirror rule) */

const CELL = 46

/** rows × cols objects; "girar" turns the array so the mirror fact shows the same product. */
export function ArrayRotateVisual({ params, phase, runLength, reduced }: VisualProps) {
  const rows = numParam(params, 'rows', 3)
  const cols = numParam(params, 'cols', 5)
  const emoji = strParam(params, 'emoji', '🌸')
  const st = stateOf({ phase, runLength })
  const [mirrored, setMirrored] = useMirror(st >= 1)
  const size = Math.max(rows, cols) * CELL
  const product = rows * cols

  return (
    <div className={s.stage}>
      <div style={{ position: 'relative', width: size, height: size }} data-testid="array">
        {Array.from({ length: rows * cols }, (_, k) => {
          const r = Math.floor(k / cols)
          const c = k % cols
          // Original: row r, column c. Mirrored: the same object is now at row c, column r.
          const x = (mirrored ? r : c) * CELL
          const y = (mirrored ? c : r) * CELL
          return (
            <motion.span
              key={k}
              className={s.emoji}
              style={{ position: 'absolute', left: 0, top: 0, width: CELL, height: CELL, display: 'grid', placeItems: 'center' }}
              initial={false}
              animate={{ x, y }}
              transition={motionT(reduced, { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: mirrored ? c * 0.03 : 0 })}
            >
              {emoji}
            </motion.span>
          )
        })}
      </div>
      <p className={s.eq} data-testid="array-label">
        {mirrored ? `${cols} filas de ${rows}` : `${rows} filas de ${cols}`}
        <br />
        {mirrored ? `${cols} × ${rows}` : `${rows} × ${cols}`} = <span className={s.hl}>{product}</span>
      </p>
      {st >= 2 && (
        <motion.div className={s.tag} style={{ fontSize: 'var(--fs-sm)', padding: '6px 14px' }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, GLIDE)}>
          {rows} × {cols} = {cols} × {rows}: ¡el orden no cambia!
        </motion.div>
      )}
      <button type="button" className={s.chip} style={{ minHeight: 56, cursor: 'pointer' }} onClick={() => setMirrored(!mirrored)} aria-pressed={mirrored}>
        ↻ Girar
      </button>
    </div>
  )
}

/** Local "mirrored" flag that follows the phase whenever the phase changes. */
function useMirror(initial: boolean): [boolean, (v: boolean) => void] {
  const [mirrored, setMirrored] = useState(initial)
  useEffect(() => setMirrored(initial), [initial])
  return [mirrored, setMirrored]
}

/* -------------------------------------------------------- 5 and one more */

/** 6 × b = 5 × b + b: six rows of b dots, the last row set apart. */
export function FivePlusOneVisual({ params, phase, runLength, reduced }: VisualProps) {
  const b = numParam(params, 'b', 7)
  const st = stateOf({ phase, runLength })
  const dot = 'var(--c-primary)'
  const extra = 'var(--c-gold)'
  return (
    <div className={s.stage}>
      <div className={s.row} style={{ alignItems: 'stretch', gap: 'var(--sp-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${b}, 26px)`, gap: 6 }} data-testid="five-plus-one">
          {Array.from({ length: 6 * b }, (_, k) => {
            const row = Math.floor(k / b)
            const color = row < 5 ? dot : extra
            return (
              <motion.span
                key={k}
                className={s.dot}
                style={{ background: color }}
                initial={reduced ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={motionT(reduced, { ...POP, delay: 0.02 * k })}
              />
            )
          })}
        </div>
        <div className={s.eq} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--sp-3)', textAlign: 'left' }}>
          <span>6 grupos</span>
          <span style={{ color: 'var(--c-primary)' }}>5 grupos de {b} = {5 * b}</span>
          <span style={{ color: 'var(--c-gold)' }}>+ 1 grupo: {b}</span>
        </div>
      </div>
      {st >= 1 && (
        <motion.p className={`${s.eq} ${s.eqBig}`} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, GLIDE)}>
          6 × {b} = 5 × {b} + {b} = {5 * b} + {b} = <span className={s.hl}>{6 * b}</span>
        </motion.p>
      )}
    </div>
  )
}

/* --------------------------------------------------------- split multiply */

const TILE = 16

/** 23 × 3 = 20 × 3 + 3 × 3, with tens as blocks of ten and units as single squares. */
export function SplitMultiplyVisual({ params, phase, runLength, reduced }: VisualProps) {
  const n = numParam(params, 'n', 23)
  const m = numParam(params, 'm', 3)
  const st = stateOf({ phase, runLength })
  const tens = Math.floor(n / 10)
  const units = n % 10
  const tenBars = tens * m
  const unitSquares = units * m
  return (
    <div className={s.stage}>
      {st < 1 && (
        <div className={s.row} style={{ gap: 'var(--sp-5)' }} data-testid="split-pieces">
          <div className={s.row}>
            {Array.from({ length: tens }, (_, i) => (
              <Tile key={i} reduced={reduced} delay={i * 0.15} />
            ))}
          </div>
          <div className={s.row} style={{ maxWidth: 160 }}>
            {Array.from({ length: units }, (_, i) => (
              <motion.span key={i} className={s.dot} style={{ background: 'var(--c-magic)', width: 26, height: 26 }} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, { ...POP, delay: 0.3 + i * 0.1 })} />
            ))}
          </div>
        </div>
      )}
      {st < 1 && <p className={s.eq}>{n} son {tens * 10} y {units}</p>}
      {st >= 1 && (
        <div className={s.panel} style={{ maxWidth: 'none', width: 'auto' }} data-testid="split-products">
          <div className={s.row} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <div className={s.row}>
              {Array.from({ length: tenBars }, (_, i) => <Tile key={i} reduced={reduced} delay={i * 0.08} />)}
            </div>
            <span className={s.eq}>{tens * 10} × {m} = <span className={s.hl}>{tens * 10 * m}</span></span>
          </div>
          <div className={s.row} style={{ justifyContent: 'space-between', flexWrap: 'nowrap', marginTop: 'var(--sp-3)' }}>
            <div className={s.row} style={{ maxWidth: 260 }}>
              {Array.from({ length: unitSquares }, (_, i) => (
                <motion.span key={i} className={s.dot} style={{ background: 'var(--c-magic)', width: 20, height: 20 }} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, { ...POP, delay: 0.1 + i * 0.05 })} />
              ))}
            </div>
            <span className={s.eq}>{units} × {m} = <span className={s.hl}>{unitSquares}</span></span>
          </div>
        </div>
      )}
      {st >= 2 && (
        <motion.p className={`${s.eq} ${s.eqBig}`} initial={reduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={motionT(reduced, POP)}>
          {tens * 10 * m} + {unitSquares} = <span className={s.hl}>{n * m}</span>
        </motion.p>
      )}
    </div>
  )
}

function Tile({ reduced, delay }: { reduced: boolean; delay: number }) {
  // A block of ten squares (2 × 5) standing for one ten.
  return (
    <motion.div
      style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${TILE / 2}px)`, gap: 2, padding: 4, borderRadius: 8, background: 'var(--c-primary-soft)', border: '2px solid var(--c-primary)' }}
      initial={reduced ? false : { scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={motionT(reduced, { ...POP, delay })}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ width: TILE / 2, height: TILE / 2, borderRadius: 3, background: 'var(--c-primary)' }} />
      ))}
    </motion.div>
  )
}

/* -------------------------------------------------------- column multiply */

/** 2 digits × 1 digit in columns: units first, then tens, with the carry written above the next column. */
export function ColumnMulVisual({ params, phase, runLength, reduced }: VisualProps) {
  const top = numParam(params, 'top', 23)
  const bottom = numParam(params, 'bottom', 3)
  const st = stateOf({ phase, runLength })
  const topDigits = digitsLE(top)
  const cols = topDigits.length

  // Column results, units first. carryIn[i] is the carry written above column i.
  const outs: number[] = []
  const carryIn: number[] = []
  const work: string[] = []
  let carry = 0
  for (let i = 0; i < cols; i++) {
    const prod = topDigits[i] * bottom + carry
    carryIn.push(carry)
    outs.push(prod % 10)
    work.push(carry ? `${topDigits[i]} × ${bottom} + ${carry} = ${prod}` : `${topDigits[i]} × ${bottom} = ${prod}`)
    carry = Math.floor(prod / 10)
  }
  const finalCarry = carry
  const resultDigits = finalCarry > 0 ? [...outs, ...digitsLE(finalCarry)] : outs
  const width = resultDigits.length
  const topRow = padLE(topDigits, width).reverse() // left to right
  const resultRow = resultDigits.slice().reverse() // left to right
  const computed = st === FINAL ? cols : Math.min(st + 1, cols)
  const glow = st === FINAL || st > cols
  const cellVars = { '--col-w': 'clamp(52px, 9vmin, 76px)', '--col-h': 'clamp(56px, 9vmin, 80px)' } as CSSProperties

  // Index helpers: p is the left-to-right position, k the column from the right (0 = units).
  const colOf = (p: number) => width - 1 - p
  const carryFor = (k: number): number => (k >= 1 && k <= cols ? carryIn[k] : 0)

  return (
    <div className={s.stage}>
      <div className={s.grid} style={{ ...cellVars, gridTemplateColumns: `auto repeat(${width}, var(--col-w))` }} data-testid="column-mul">
        <div />
        {Array.from({ length: width }, (_, p) => {
          const k = colOf(p)
          // The carry out of column k-1 sits above column k, once column k-1 has been multiplied.
          const shown = k >= 1 && k - 1 < computed && carryFor(k) > 0
          return (
            <div key={`c${p}`} style={{ height: 'calc(var(--col-h) * 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {shown && (
                <motion.span className={`${s.carry} ${glow ? s.carryGlow : ''}`} initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} transition={motionT(reduced, POP)} data-testid="carry">
                  {carryFor(k)}
                </motion.span>
              )}
            </div>
          )
        })}

        <div />
        {topRow.map((d, p) => (
          <div key={`t${p}`} className={s.cell}>{colOf(p) < cols ? d : ''}</div>
        ))}

        <div className={s.sign}>×</div>
        {Array.from({ length: width }, (_, p) => (
          <div key={`b${p}`} className={s.cell}>{p === width - 1 ? bottom : ''}</div>
        ))}

        <div className={s.line} style={{ gridColumn: `1 / span ${width + 1}` }} />

        <div />
        {resultRow.map((d, p) => {
          const k = colOf(p)
          const isProduct = k < cols
          const done = isProduct ? k < computed : computed >= cols
          return (
            <div key={`r${p}`} className={s.cell} style={{ color: glow ? 'var(--c-magic)' : 'var(--c-ink)' }}>
              {done && (
                <motion.span key={`${st}-${p}`} initial={reduced ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={motionT(reduced, POP)}>
                  {d}
                </motion.span>
              )}
              {!done && isProduct && <span className={s.cellEmpty} style={{ position: 'absolute', inset: 8 }} />}
            </div>
          )
        })}

        <div />
        <div className={s.work} style={{ gridColumn: `2 / span ${width}`, minHeight: 28 }} data-testid="work">
          {st === FINAL ? `${top} × ${bottom} = ${top * bottom}` : computed > 0 ? work[computed - 1] : ''}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- 7 × 7 */

/** 7 × 7 = 49: a square of dots coloured like a rainbow, row by row. */
export function SquareRhymeVisual({ reduced }: VisualProps) {
  return (
    <div className={s.stage}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 34px)', gap: 6 }} data-testid="square">
        {Array.from({ length: 49 }, (_, k) => {
          const row = Math.floor(k / 7)
          return (
            <motion.span
              key={k}
              className={s.dot}
              style={{ width: 28, height: 28, background: ROW_COLORS[row] }}
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={motionT(reduced, { ...POP, delay: row * 0.12 + (k % 7) * 0.03 })}
            />
          )
        })}
      </div>
      <motion.p className={`${s.eq} ${s.eqBig}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={motionT(reduced, { duration: 0.6, delay: 0.9 })}>
        7 × 7 = <span className={s.hl}>49</span>
      </motion.p>
    </div>
  )
}

