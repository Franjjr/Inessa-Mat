export type ID = string
/** ISO-8601 timestamp, e.g. new Date().toISOString() */
export type ISODate = string

/** Grammatical gender used to inflect Spanish copy: feminine or masculine (generic masculine is not a separate option). */
export type GrammaticalGender = 'f' | 'm'

/**
 * How the child is answering right now.
 * pen      = Apple Pencil / S Pen (pointerType 'pen')
 * touch    = finger writing on the ink canvas
 * keyboard = physical keyboard digits
 * keypad   = on-screen number buttons (fallback, accessibility, or chosen in settings)
 * tap      = choice/tap based activities (maze, memory, bubbles...) that have no written answer
 */
export type InputMode = 'pen' | 'touch' | 'keyboard' | 'keypad' | 'tap'

/** Deterministic random generator returning a float in [0, 1). See engine/createRng. */
export type Rng = () => number
