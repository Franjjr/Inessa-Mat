/* <FitInBoard> — a lesson drawing (or the choices) shrunk just enough to fit in the board, which hides overflow.
   A tall drawing (the whole table of 7 on a 360 × 740 phone) was cut at the bottom of the board. The content keeps
   its layout (CSS pixels) and is drawn smaller with transform: scale from the top centre. Drawings are not tapped
   for writing, so the scale may go lower than for a game (MIN_BOARD_FIT). */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import styles from './LessonPlayer.module.css'

/** Smallest scale of a drawing on the board. */
export const MIN_BOARD_FIT = 0.5

/** Scale that fits `need` (content) into `have` (board) on both axes: 1 when it fits, never below MIN_BOARD_FIT. */
export function boardFitScale(haveW: number, haveH: number, needW: number, needH: number): number {
  if (haveW <= 0 || haveH <= 0 || needW <= 0 || needH <= 0) return 1
  const s = Math.min(1, haveW / needW, haveH / needH)
  return s >= 0.999 ? 1 : Math.max(MIN_BOARD_FIT, Math.floor(s * 1000) / 1000)
}

export function FitInBoard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // After every render (a drawing grows phase by phase) and when the board changes size.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const next = boardFitScale(el.clientWidth, el.clientHeight, el.scrollWidth, el.scrollHeight)
    setScale((prev) => (prev === next ? prev : next))
  })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver !== 'function') return
    const ro = new ResizeObserver(() => {
      const next = boardFitScale(el.clientWidth, el.clientHeight, el.scrollWidth, el.scrollHeight)
      setScale((prev) => (prev === next ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={styles.fitBoard}
      data-board-scale={scale < 1 ? scale : undefined}
      style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}
    >
      {children}
    </div>
  )
}
