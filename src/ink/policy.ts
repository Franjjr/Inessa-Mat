/* Input policy: palm rejection, pen eraser detection, pen-seen persistence and input-mode resolution.
   Pure functions + tiny storage helpers (wrapped in try/catch: private mode or blocked storage must not crash). */
import type { AnswerInputPreference, InputMode } from '@/types'
import { PEN_SEEN_KEY, TOUCH_SEEN_KEY } from './constants'

export type PointerKind = 'pen' | 'touch' | 'mouse'

/** What an ink surface does with a new pointer: write ink, only detect taps (focus/alternatives), or ignore it. */
export type PointerRole = 'write' | 'tap' | 'ignore'

export function normalizePointerType(t: string): PointerKind {
  return t === 'pen' ? 'pen' : t === 'mouse' ? 'mouse' : 'touch'
}

/**
 * Palm rejection: once a pen has been seen on this device, fingers no longer write on ink surfaces
 * (a resting palm would otherwise scribble). Fingers can still tap. Without a pen, fingers write — except in
 * keypad mode, where taps select a cell for the on-screen keypad.
 */
export function pointerRole(pointerType: string, opts: { penSeen: boolean; mode: InputMode; isPrimary?: boolean }): PointerRole {
  const kind = normalizePointerType(pointerType)
  if (kind === 'pen') return 'write'
  // A mouse cannot write digits well: with the keypad (or the physical keyboard) it only selects a box.
  if (kind === 'mouse') return opts.mode === 'keypad' || opts.mode === 'keyboard' ? 'tap' : 'write'
  if (opts.isPrimary === false) return 'ignore'
  if (opts.penSeen) return 'tap'
  if (opts.mode === 'keypad') return 'tap'
  return 'write'
}

/**
 * Pen eraser: the eraser end of Surface/Wacom pens reports buttons bit 32 (button 5 on pointerdown).
 * The S Pen / barrel button (bit 2 while touching with a pen) also erases, as in most drawing apps.
 */
export function isEraserPointer(e: { pointerType: string; button?: number; buttons?: number }): boolean {
  if (e.pointerType !== 'pen') return false
  const buttons = e.buttons ?? 0
  return (buttons & 32) !== 0 || e.button === 5 || (buttons & 2) !== 0
}

export function readPenSeen(): boolean {
  try {
    return globalThis.localStorage?.getItem(PEN_SEEN_KEY) != null
  } catch {
    return false
  }
}

export function persistPenSeen(): void {
  try {
    globalThis.localStorage?.setItem(PEN_SEEN_KEY, new Date().toISOString())
  } catch {
    /* storage unavailable: palm rejection still works for this session */
  }
}

/** A finger has touched the screen on this device before (see TOUCH_SEEN_KEY). */
export function readTouchSeen(): boolean {
  try {
    return globalThis.localStorage?.getItem(TOUCH_SEEN_KEY) != null
  } catch {
    return false
  }
}

export function persistTouchSeen(): void {
  try {
    globalThis.localStorage?.setItem(TOUCH_SEEN_KEY, new Date().toISOString())
  } catch {
    /* storage unavailable: the switch still holds for this session */
  }
}

export function forgetPenSeen(): void {
  try {
    globalThis.localStorage?.removeItem(PEN_SEEN_KEY)
  } catch {
    /* ignore */
  }
}

/** A device the child writes on with a finger or a pen (tablet, phone). iPadOS reports itself as a Mac, so rely on
    the pointer media queries rather than the user agent. A computer with a touch screen still has a mouse or
    trackpad as its main pointer, so it counts as a computer until a finger touches it (InkProvider, TOUCH_SEEN_KEY);
    its pen, if it has one, is detected on use. */
export function detectTouchDevice(): boolean {
  try {
    if (typeof matchMedia === 'function') {
      if (matchMedia('(pointer: coarse)').matches) return true
      if (matchMedia('(any-pointer: fine)').matches) return false
    }
  } catch {
    /* fall back to touch points */
  }
  return typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0
}

/** A phone: a touch screen whose short side is under 600 px (an iPad mini is 744). Handwritten cells are too small
    there, so «auto» answers with the on-screen keypad. */
export function detectPhone(): boolean {
  if (!detectTouchDevice() || typeof screen === 'undefined') return false
  const side = Math.min(screen.width || 0, screen.height || 0)
  return side > 0 && side < 600
}

/**
 * auto → pen if a pen has been seen, else touch on touch devices (keyboard if the child is typing on a
 * physical keyboard attached to the tablet, the on-screen keypad on a phone), else (a computer) the on-screen keypad,
 * which the physical keyboard can also type into.
 */
export function resolveInputMode(opts: {
  preference: AnswerInputPreference
  penSeen: boolean
  isTouchDevice: boolean
  keyboardUsed?: boolean
  isPhone?: boolean
}): InputMode {
  const { preference, penSeen, isTouchDevice, keyboardUsed, isPhone } = opts
  switch (preference) {
    case 'keyboard': return 'keyboard'
    case 'keypad': return 'keypad'
    case 'pen': return penSeen || !isTouchDevice ? 'pen' : 'touch'
    default:
      if (penSeen) return 'pen'
      if (isTouchDevice) return keyboardUsed ? 'keyboard' : isPhone ? 'keypad' : 'touch'
      return 'keypad'
  }
}

// ------------------------------------------------------------------------------------------ palm guard for buttons

const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
let penContact = false
let lastPenContactAt = -Infinity

/** Pen touched down (true) or lifted (false). Hover does not count: a hovering Pencil must not block fingers. */
export function notePenContact(down: boolean, t: number = clock()): void {
  penContact = down
  lastPenContactAt = t
}

/** The pen moved while touching the screen. */
export function notePenActivity(t: number = clock()): void {
  lastPenContactAt = t
}

/** Milliseconds since the pen last touched the screen (Infinity if it never did in this session). */
export function msSincePenContact(t: number = clock()): number {
  if (penContact) return 0
  return t - lastPenContactAt
}

/** A finger press within this time of pen contact is treated as the palm. */
export const PALM_GUARD_MS = 300

/**
 * Palm on a button (✓, eraser, keypad…) while the pen writes: finger presses during pen contact, or right after
 * it, are ignored. Deliberate finger taps a moment later work normally.
 */
export function isPalmPress(pointerType: string | null | undefined, t: number = clock()): boolean {
  if (pointerType !== 'touch') return false
  const since = t - lastPenContactAt
  if (penContact && since < 4000) return true // pen down (a lost pointerup cannot block fingers forever)
  return since < PALM_GUARD_MS
}

/** Feeds the palm guard from raw pointer events (pen only). */
export function trackPenEvent(e: { type: string; pointerType: string; buttons: number }): void {
  if (e.pointerType !== 'pen') return
  if (e.type === 'pointerdown') notePenContact(true)
  else if (e.type === 'pointerup' || e.type === 'pointercancel') notePenContact(false)
  else if (e.type === 'pointermove' && e.buttons !== 0) notePenActivity()
}
