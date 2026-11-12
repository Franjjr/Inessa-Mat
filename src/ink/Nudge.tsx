/* A small speech bubble that points at a control for a few seconds ("¿Sin lápiz? ¡Toca aquí!").
   Used when a finger tries to write although a pen is in use on this device (the Pencil may be lost).
   One nudge per screen: a new one takes the place of the one showing (several boxes never each show a bubble). */
import clsx from 'clsx'
import { useCallback, useEffect, useId, useSyncExternalStore } from 'react'
import s from './Nudge.module.css'

export const NUDGE_TEXT = '¿Sin lápiz? ¡Toca aquí!'
const NUDGE_MS = 4200

// The one nudge showing on the screen, shared by every box.
let active: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()
const notify = () => { for (const fn of [...listeners]) fn() }
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }

function show(id: string): void {
  active = id
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { timer = null; active = null; notify() }, NUDGE_MS)
  notify()
}

function hide(id: string): void {
  if (active !== id) return
  active = null
  if (timer) { clearTimeout(timer); timer = null }
  notify()
}

/** Returns [visible, trigger]: trigger() shows this box's nudge (again) for a few seconds, and hides any other. */
export function useNudge(): [boolean, () => void] {
  const id = useId()
  const visible = useSyncExternalStore(subscribe, () => active === id, () => false)
  useEffect(() => () => hide(id), [id])
  const trigger = useCallback(() => show(id), [id])
  return [visible, trigger]
}

export function NudgeBubble({ text = NUDGE_TEXT, side = 'top', className }: { text?: string; side?: 'top' | 'bottom' | 'left'; className?: string }) {
  return (
    <span className={clsx(s.bubble, s[side], className)} role="status">
      {text}
    </span>
  )
}
