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
/** Keep at most this many 'confirmed' samples per digit for personalisation (calibration/corrected always kept). */
export const MAX_CONFIRMED_PER_DIGIT = 24
/** Pending recognitions older than this are dropped (activity never called confirm/discard). */
export const PENDING_TTL_MS = 10 * 60 * 1000

export const PEN_SEEN_KEY = 'numeria.ink.penSeen'
