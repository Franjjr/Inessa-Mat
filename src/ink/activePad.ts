/* Which NumberInput shows the on-screen keypad when the input mode is 'keypad': only one per screen, the one touched
   last, or the first one on the screen until the child touches another (a fraction has two boxes, one keypad). */
import { useEffect, useSyncExternalStore } from 'react'

const mounted: string[] = []
let touched: string | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function current(): string | null {
  return touched !== null && mounted.includes(touched) ? touched : mounted[0] ?? null
}

/** Marks this pad as the one the child is using. */
export function focusPad(id: string): void {
  if (touched === id) return
  touched = id
  emit()
}

const filled = new Map<string, boolean>()
const focusers = new Map<string, () => void>()

/** Says whether this pad holds a number and how to move the child into it (its ✓ uses them to go to the next box). */
export function usePadSlot(id: string, hasValue: boolean, focus: () => void): void {
  useEffect(() => {
    filled.set(id, hasValue)
    focusers.set(id, focus)
  })
  useEffect(() => () => { filled.delete(id); focusers.delete(id) }, [id])
}

/** The next empty box on the screen after this one (going round to the first), or null when all the others hold a
    number. */
export function nextEmptyPad(id: string): string | null {
  const i = mounted.indexOf(id)
  const order = [...mounted.slice(i + 1), ...mounted.slice(0, Math.max(i, 0))]
  return order.find((other) => other !== id && filled.get(other) === false) ?? null
}

/** Moves the child to another box: it takes the keypad and the focus. */
export function moveToPad(id: string): void {
  focusPad(id)
  focusers.get(id)?.()
}

/** Registers the pad while it is on screen and says whether it is the one that shows the keypad. */
export function useIsActivePad(id: string): boolean {
  useEffect(() => {
    mounted.push(id)
    emit()
    return () => {
      mounted.splice(mounted.indexOf(id), 1)
      emit()
    }
  }, [id])
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => current() === id,
    () => false,
  )
}
