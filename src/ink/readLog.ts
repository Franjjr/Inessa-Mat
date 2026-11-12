/* What the app read from the child's handwriting for the answer it is about to log as wrong. The answer flows leave it
   here right before they report the outcome; the review log (src/data/review.ts) takes it when it stores the note of
   that wrong answer, so an adult can see the ink next to «la app leyó 47». No imports: the data layer reads it. */

export interface InkReadingDigit {
  digit: number
  /** 0..1 */
  confidence: number
  /** The next most likely digits, best first (at most 3). */
  alternatives: number[]
  /** The app asked the child to confirm it. */
  doubtful: boolean
  /** The child confirmed or picked it. */
  confirmed: boolean
  /** The 28×28 image the recogniser saw, one byte per pixel, base64 (784 bytes). */
  image28?: string
}

export interface InkReading {
  /** Exercise kind and the answer as graded, to match the attempt the host stores next. */
  kind: string
  given: string
  digits: InkReadingDigit[]
  recognitionFixes: number
  method?: string
  /** Changing one digit to one of its alternatives would have made the answer right. */
  oneDigitFix: boolean
}

const MAX_AGE_MS = 60_000
let last: { reading: InkReading; at: number } | null = null

/** 28×28 floats (0..1) → base64 of one byte per pixel. */
export function encodeImage28(img: ArrayLike<number>): string {
  let bin = ''
  for (let i = 0; i < img.length; i++) bin += String.fromCharCode(Math.max(0, Math.min(255, Math.round(img[i] * 255))))
  return typeof btoa === 'function' ? btoa(bin) : ''
}

/** base64 of 784 bytes → pixel values 0..1 (empty when it does not decode). */
export function decodeImage28(b64: string): number[] {
  try {
    const bin = atob(b64)
    return Array.from(bin, (c) => c.charCodeAt(0) / 255)
  } catch {
    return []
  }
}

export function leaveInkReading(reading: InkReading): void {
  last = { reading, at: Date.now() }
}

/** The reading of the wrong answer `kind`/`given`, once (null when there is none, or it belongs to another answer). */
export function takeInkReading(kind: string, given: string): InkReading | null {
  const l = last
  if (!l || Date.now() - l.at > MAX_AGE_MS || l.reading.kind !== kind || l.reading.given !== given) return null
  last = null
  return l.reading
}
