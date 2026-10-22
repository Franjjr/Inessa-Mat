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
  keypadPosition = 'below', keypadLayout, className, style,
}: CellGroupProps) {
  const { mode } = useInk()
  const entries = useRef(new Map<string, CellEntry>())
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [toggled, setToggled] = useState(false)
  const palm = usePalmGuard()
  const [nudging, nudge] = useNudge()
  const keypadVisible = keypad === 'show' || (keypad === 'auto' && (mode === 'keypad' || toggled))

  const latest = useRef({ order, onSubmit, autoAdvance })
  useLayoutEffect(() => { latest.current = { order, onSubmit, autoAdvance } })
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
      return orderNow()[0] ?? null
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
    const next = step(orderNow(), uid, 1)
    if (next) focusCell(next)
  }, [orderNow, focusCell])
  const move = useCallback((uid: string, dir: Direction) => focusCell(neighbor(items(), uid, dir)), [items, focusCell])
  const tab = useCallback((uid: string, backward: boolean) => {
    const next = step(orderNow(), uid, backward ? -1 : 1)
    if (!next) return false
    focusCell(next)
    return true
  }, [orderNow, focusCell])
  const back = useCallback((uid: string) => {
    const prev = step(orderNow(), uid, -1)
    if (!prev) return
    focusCell(prev)
    entries.current.get(prev)?.clear()
  }, [orderNow, focusCell])
  const submit = useCallback(() => {
    let flushed = false
    for (const e of entries.current.values()) flushed = e.flush() || flushed
    // Let the parent re-render with the freshly recognised digits before it reads them.
    if (flushed) setTimeout(() => latest.current.onSubmit?.(), 0)
    else latest.current.onSubmit?.()
  }, [])

  const showToggle = keypadToggle && keypad === 'auto' && mode !== 'keypad'
  const canNudge = showToggle && !keypadVisible
  const nudgeKeypad = useCallback(() => { if (canNudge) nudge() }, [canNudge, nudge])

  const api = useMemo<CellGroupApi>(
    () => ({ register, currentId, setCurrent: setCurrentId, afterInput, move, tab, back, submit, keypadVisible, nudgeKeypad }),
    [register, currentId, afterInput, move, tab, back, submit, keypadVisible, nudgeKeypad],
  )

  const target = () => {
    const uid = currentId && entries.current.has(currentId) ? currentId : orderNow()[0]
    return uid ? ([uid, entries.current.get(uid)!] as const) : null
  }
  const onDigit = (d: number) => { const t = target(); t?.[1].input(d, 'keypad') }
  const onDelete = () => {
    const t = target()
    if (!t) return
    if (!t[1].isEmpty()) { t[1].clear(); t[1].focus() } else api.back(t[0])
  }

  return (
    <CellGroupContext.Provider value={api}>
      <div className={clsx(s.group, s[keypadPosition], className)} style={style}>
        <div className={s.cells}>{children}</div>
        {(keypadVisible || showToggle) && (
          <div className={s.side}>
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
