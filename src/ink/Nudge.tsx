/* A small speech bubble that points at a control for a few seconds ("¿Sin lápiz? ¡Toca aquí!").
   Used when a finger tries to write although a pen is in use on this device (the Pencil may be lost). */
import clsx from 'clsx'
import { useCallback, useEffect, useState } from 'react'
import s from './Nudge.module.css'

export const NUDGE_TEXT = '¿Sin lápiz? ¡Toca aquí!'
const NUDGE_MS = 4200

/** Returns [visible, trigger]: trigger() shows the nudge (again) for a few seconds. */
export function useNudge(): [boolean, () => void] {
  const [at, setAt] = useState(0)
  useEffect(() => {
    if (!at) return
    const t = setTimeout(() => setAt(0), NUDGE_MS)
    return () => clearTimeout(t)
  }, [at])
  const trigger = useCallback(() => setAt(Date.now()), [])
  return [at > 0, trigger]
}

export function NudgeBubble({ text = NUDGE_TEXT, side = 'top', className }: { text?: string; side?: 'top' | 'bottom' | 'left'; className?: string }) {
  return (
    <span className={clsx(s.bubble, s[side], className)} role="status">
      {text}
    </span>
  )
}
