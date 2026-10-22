/* Haptics through navigator.vibrate (Android Chrome / Samsung Internet). iOS Safari has no vibration API (and iPads
   have no vibration motor), so everything is a silent no-op there. Patterns are short and soft: a mistake is a gentle
   double nudge, never a long buzz. Vibration only runs after the page has had a user gesture (Chrome blocks it and
   logs a warning otherwise). */

const PATTERNS = {
  tap: 8,
  success: [14, 70, 22] as number[],
  error: [22, 90, 22] as number[],
}

const TAP_GAP_MS = 40

let enabled = true
let lastTap = -Infinity

function vibrateFn(): ((p: number | number[]) => boolean) | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  return typeof nav.vibrate === 'function' ? nav.vibrate.bind(nav) : null
}

function activated(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  return ua ? ua.hasBeenActive : true
}

function buzz(pattern: number | number[]): void {
  if (!enabled) return
  const v = vibrateFn()
  if (!v || !activated()) return
  try { v(pattern) } catch { /* some browsers throw when the frame is not allowed to vibrate */ }
}

export function hapticsSupported(): boolean {
  return vibrateFn() !== null
}

export const haptics = {
  tap(): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (now - lastTap < TAP_GAP_MS) return
    lastTap = now
    buzz(PATTERNS.tap)
  },
  success(): void {
    buzz(PATTERNS.success)
  },
  error(): void {
    buzz(PATTERNS.error)
  },
  /** Extra: haptics follow the "sound" setting (applyAudioSettings). */
  setEnabled(on: boolean): void {
    enabled = on
    if (!on) {
      const v = vibrateFn()
      if (v && activated()) {
        try { v(0) } catch { /* ignore */ }
      }
    }
  },
  /** Extra: whether this device can vibrate at all. */
  supported: hapticsSupported,
}

/** Test helper. */
export function __resetHapticsForTests(): void {
  enabled = true
  lastTap = -Infinity
}
