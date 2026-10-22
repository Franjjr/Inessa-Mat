/* Buttons next to a writing area (✓, eraser, keypad…) must still work with a finger, but a palm resting on
   them while the pen writes must not press them. Spread the handlers on the button and wrap its onClick. */
import { useCallback, useRef, type MouseEvent, type PointerEvent } from 'react'
import { isPalmPress } from './policy'

export function usePalmGuard() {
  const press = useRef<{ type: string; palm: boolean } | null>(null)
  const onPointerDown = useCallback((e: PointerEvent) => {
    press.current = { type: e.pointerType, palm: isPalmPress(e.pointerType) }
  }, [])
  /** Wraps a click handler: palm presses are swallowed. */
  const guard = useCallback(<E extends MouseEvent>(fn: (e: E) => void) => (e: E) => {
    const p = press.current
    press.current = null
    if (p?.palm) return
    fn(e)
  }, [])
  return { onPointerDown, guard }
}
