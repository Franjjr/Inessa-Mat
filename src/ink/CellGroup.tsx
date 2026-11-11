/* <CellGroup> — groups DigitCells of one answer (a column operation, a fact family…):
   custom focus order (column ops: units first), auto-advance after typing, arrows move spatially,
   Tab follows the order, Backspace on an empty cell goes back, Enter submits, and an on-screen keypad
   (keypad mode, or the "123" fallback toggle) types into the current cell. */
import clsx from 'clsx'
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useInk } from './context'
import { CellGroupContext, type CellEntry, type CellGroupApi } from './groupContext'
import { computeOrder, neighbor, step, type CellOrder, type Direction, type OrderItem } from './order'
import { Keypad } from './Keypad'
import { KeypadIcon, PencilIcon } from './icons'
import { usePalmGuard } from './usePalmGuard'
import { NudgeBubble, useNudge } from './Nudge'
import s from './CellGroup.module.css'

export interface CellGroupProps {
  children: ReactNode
  /** Focus/typing order. Column operations: 'rtl-columns' or an explicit list of DigitCell `cellId`s. */
  order?: CellOrder
  /**
   * How typed digits (keyboard, on-screen keypad) fill a number. 'ltr' (default): the cells of a number (DigitCells
   * with the same `numberId`) work like a calculator — a digit typed in the units cell (where the cursor waits) enters
   * at the units and pushes the others to the left, so «172» typed as read gives 172; a cell tapped on purpose takes
   * the digit typed in it. 'column': the result of a column operation, units first along
   * `order`, with an arrow over the cell that is typed next and the reminder to start with the units.
   * Cells without a `numberId` always follow `order`.
   */
  typingOrder?: 'ltr' | 'column'
  /** Enter key or the keypad's ✓. */
  onSubmit?: () => void
  /** Move to the next cell after a typed digit (default true). */
  autoAdvance?: boolean
  /** 'auto' (default): keypad in keypad mode or when the child opens it with the toggle. */
  keypad?: 'auto' | 'show' | 'hide'
  /** Show the small toggle that opens the keypad as a fallback (default true). */
  keypadToggle?: boolean
  keypadPosition?: 'below' | 'right' | 'left'
  keypadLayout?: 'grid' | 'wide'
  className?: string
  style?: CSSProperties
}

export function CellGroup({
  children, order = 'dom', onSubmit, autoAdvance = true, keypad = 'auto', keypadToggle = true,
  keypadPosition = 'below', keypadLayout, className, style, typingOrder = 'ltr',
}: CellGroupProps) {
  const { mode } = useInk()
  const entries = useRef(new Map<string, CellEntry>())
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [toggled, setToggled] = useState(false)
  const palm = usePalmGuard()
  const [nudging, nudge] = useNudge()
  const keypadVisible = keypad === 'show' || (keypad === 'auto' && (mode === 'keypad' || toggled))

  const latest = useRef({ order, onSubmit, autoAdvance, typingOrder })
  useLayoutEffect(() => { latest.current = { order, onSubmit, autoAdvance, typingOrder } })
  const orderKey = typeof order === 'string' ? order : order.join('|')

  const items = useCallback((): OrderItem[] => {
    const list = [...entries.current.entries()]
    list.sort(([, a], [, b]) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    return list.map(([uid, e], domIndex) => {
      const r = e.el.getBoundingClientRect()
      return { uid, cellId: e.cellId, domIndex, rect: { x: r.left, y: r.top, width: r.width, height: r.height }, focusable: e.focusable() }
    })
  }, [])

  const orderNow = useCallback(() => computeOrder(items(), latest.current.order), [items])
  /** The order for typing (auto-advance, Backspace back): optional cells are skipped, except the one `uid` is in. */
  const advanceOrder = useCallback(
    (uid: string) => orderNow().filter((id) => id === uid || !entries.current.get(id)?.optional),
    [orderNow],
  )

  const focusCell = useCallback((uid: string | null) => {
    if (!uid) return
    const e = entries.current.get(uid)
    if (!e) return
    setCurrentId(uid)
    e.focus()
  }, [])

  useLayoutEffect(() => {
    setCurrentId((cur) => {
      const e = cur ? entries.current.get(cur) : null
      if (e && e.focusable()) return cur
      const first = orderNow()
      return first.find((id) => !entries.current.get(id)?.optional) ?? first[0] ?? null
    })
  }, [version, orderKey, orderNow])

  const register = useCallback((uid: string, entry: CellEntry) => {
    entries.current.set(uid, entry)
    setVersion((v) => v + 1)
    return () => {
      if (entries.current.get(uid) === entry) entries.current.delete(uid)
      setVersion((v) => v + 1)
    }
  }, [])
  const afterInput = useCallback((uid: string) => {
    if (!latest.current.autoAdvance) return
    const next = step(advanceOrder(uid), uid, 1)
    if (next) focusCell(next)
  }, [advanceOrder, focusCell])
  const move = useCallback((uid: string, dir: Direction) => focusCell(neighbor(items(), uid, dir)), [items, focusCell])
  const tab = useCallback((uid: string, backward: boolean) => {
    const next = step(orderNow(), uid, backward ? -1 : 1)
    if (!next) return false
    focusCell(next)
    return true
  }, [orderNow, focusCell])
  const back = useCallback((uid: string) => {
    const prev = step(advanceOrder(uid), uid, -1)
    if (!prev) return
    focusCell(prev)
    entries.current.get(prev)?.clear()
  }, [advanceOrder, focusCell])
  const submit = useCallback(() => {
    let flushed = false
    for (const e of entries.current.values()) flushed = e.flush() || flushed
    // Let the parent re-render with the freshly recognised digits before it reads them.
    if (flushed) setTimeout(() => latest.current.onSubmit?.(), 0)
    else latest.current.onSubmit?.()
  }, [])

  /** The cells of a number, left to right as drawn. */
  const numberCells = useCallback((numberId: string): [string, CellEntry][] => {
    const list = [...entries.current.entries()].filter(([, e]) => e.numberId === numberId)
    list.sort(([, a], [, b]) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    return list
  }, [])

  /** Writes the digits of a number right-aligned (units in the last cell), empty cells on the left. */
  const fillNumber = (cells: [string, CellEntry][], digits: string, via: 'keyboard' | 'keypad') => {
    const pad = cells.length - digits.length
    cells.forEach(([, e], i) => e.assign(i < pad ? null : Number(digits[i - pad]), via))
  }
  const digitsOf = (cells: [string, CellEntry][]) => cells.map(([, e]) => e.value()).filter((v) => v != null).join('')

  const typeInNumber = useCallback((uid: string, d: number, via: 'keyboard' | 'keypad') => {
    if (latest.current.typingOrder !== 'ltr') return false
    const e = entries.current.get(uid)
    if (!e?.numberId) return false
    const cells = numberCells(e.numberId)
    const units = cells[cells.length - 1][0]
    // Only the units cell (where the cursor waits) types like a calculator; a cell she taps on purpose takes the digit.
    if (uid !== units) return false
    const before = digitsOf(cells)
    // A full number starts again: the child is writing a new one over it.
    const digits = before.length >= cells.length ? String(d) : before + String(d)
    fillNumber(cells, digits, via)
    if (digits.length >= cells.length && latest.current.autoAdvance) {
      // The number is complete: go on to the first cell after it (the next number) in the typing order.
      const own = new Set(cells.map(([id]) => id))
      const list = advanceOrder(uid)
      const last = list.reduce((acc, id, i) => (own.has(id) ? i : acc), -1)
      const next = list.slice(last + 1).find((id) => !own.has(id))
      focusCell(next ?? units)
    } else focusCell(units)
    return true
  }, [numberCells, advanceOrder, focusCell])

  const deleteInNumber = useCallback((uid: string) => {
    if (latest.current.typingOrder !== 'ltr') return false
    const e = entries.current.get(uid)
    if (!e?.numberId) return false
    const cells = numberCells(e.numberId)
    if (uid !== cells[cells.length - 1][0]) return false
    const before = digitsOf(cells)
    if (!before) return false
    fillNumber(cells, before.slice(0, -1), 'keypad')
    focusCell(cells[cells.length - 1][0])
    return true
  }, [numberCells, focusCell])

  const showToggle = keypadToggle && keypad === 'auto' && mode !== 'keypad'
  const canNudge = showToggle && !keypadVisible
  const nudgeKeypad = useCallback(() => { if (canNudge) nudge() }, [canNudge, nudge])

  const api = useMemo<CellGroupApi>(
    () => ({
      register, currentId, setCurrent: setCurrentId, afterInput, move, tab, back, submit, keypadVisible, nudgeKeypad,
      typingOrder, typeInNumber, deleteInNumber,
    }),
    [register, currentId, afterInput, move, tab, back, submit, keypadVisible, nudgeKeypad, typingOrder, typeInNumber, deleteInNumber],
  )

  const target = () => {
    const uid = currentId && entries.current.has(currentId) ? currentId : orderNow()[0]
    return uid ? ([uid, entries.current.get(uid)!] as const) : null
  }
  const onDigit = (d: number) => { const t = target(); t?.[1].input(d, 'keypad') }
  const onDelete = () => {
    const t = target()
    if (!t) return
    if (api.deleteInNumber(t[0])) return
    if (!t[1].isEmpty()) { t[1].clear(); t[1].focus() } else api.back(t[0])
  }

  return (
    <CellGroupContext.Provider value={api}>
      <div className={clsx(s.group, s[keypadPosition], className)} style={style}>
        <div className={s.cells}>{children}</div>
        {(keypadVisible || showToggle) && (
          <div className={s.side}>
            {keypadVisible && typingOrder === 'column' && (
              <p className={s.columnTip} role="note">Empieza por las unidades, la casilla que brilla.</p>
            )}
            {keypadVisible && (
              <Keypad
                onDigit={onDigit}
                onDelete={onDelete}
                onSubmit={onSubmit ? () => api.submit() : undefined}
                layout={keypadLayout ?? (keypadPosition === 'below' ? 'wide' : 'grid')}
              />
            )}
            {showToggle && (
              <span className={s.toggleWrap}>
                {nudging && !toggled && <NudgeBubble side={keypadPosition === 'below' ? 'left' : 'top'} />}
                <button
                  type="button"
                  className={clsx(s.toggle, nudging && !toggled && s.nudge)}
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={palm.onPointerDown}
                  onClick={palm.guard(() => {
                    setToggled((t) => !t)
                    const t = target()
                    t?.[1].focus()
                  })}
                  aria-pressed={toggled}
                  aria-label={toggled ? 'Escribir a mano' : 'Usar el teclado de números'}
                  title={toggled ? 'Escribir a mano' : 'Teclado de números'}
                >
                  {toggled ? <PencilIcon size={26} /> : <KeypadIcon size={24} />}
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </CellGroupContext.Provider>
  )
}
