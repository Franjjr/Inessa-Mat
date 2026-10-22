/* Tunables for handwriting capture. Values chosen for 7–8-year-olds writing with an Apple Pencil or a finger. */

/** Inactivity after pen-up before recognising (lets multi-stroke 4, 5, 7 finish). */
export const IDLE_MS = 620
/** Calibration and tracing give a little more time: children write slower when asked to "write nicely". */
export const IDLE_MS_SLOW = 950
/** A new stroke this soon after the previous pen-up continues the same digit instead of rewriting it. */
export const CONTINUE_MS = 1800
/** After the continuation window, a small new stroke (bar, hat) still continues; a tall one rewrites. */
export const CONTINUE_MAX_HEIGHT = 0.45
/** Below this confidence the cell shows a subtle "?" and offers alternatives. */
export const LOW_CONFIDENCE = 0.6
/** A press shorter than this, that barely moves, is a tap (focus / alternatives / rewrite), not ink. */
export const TAP_MS = 280
/** Max movement (CSS px) of a tap, also scaled with the zone (see geometry.isTap). */
export const TAP_SLOP_PX = 9
/** Fraction of the cell size the canvas extends beyond the cell so ink may overflow a little. */
export const OVERFLOW_RATIO = 0.18
/** Number of alternative chips shown for a low-confidence digit. */
export const ALT_CHIPS = 3
/** Newest personal samples kept per digit and source. The sum (30) matches the recogniser's per-class index size,
    so a frequent corrector never pushes out the calibration samples. Older ones stay in the database. */
export const MAX_SAMPLES_PER_DIGIT = { calibration: 4, corrected: 10, confirmed: 16 } as const
/** A cell that unmounts forgets its pending recognition after this grace time (confirm() may come just after). */
export const UNMOUNT_FORGET_MS = 2500
/** A finger on an ink surface after a pen was used: offer the keypad if the pen has not touched for this long. */
export const PEN_IDLE_FALLBACK_MS = 3000
/** Pending recognitions older than this are dropped (activity never called confirm/discard). */
export const PENDING_TTL_MS = 10 * 60 * 1000

export const PEN_SEEN_KEY = 'numeria.ink.penSeen'
