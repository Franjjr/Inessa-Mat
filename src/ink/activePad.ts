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
