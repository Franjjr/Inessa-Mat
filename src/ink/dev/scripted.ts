/* Dev/test helpers: a scripted recogniser (deterministic results without the CNN). */
import type { DigitRecognition, InkStroke } from '@/types'
import type { Recognizer } from '../context'

export interface ScriptedAnswer { digit: number | null; confidence?: number; alternatives?: number[] }

export function recognition(a: ScriptedAnswer): DigitRecognition {
  const confidence = a.confidence ?? (a.digit == null ? 0 : 0.97)
  const alts = a.alternatives ?? (a.digit == null ? [] : [a.digit])
  const probs = Array.from({ length: 10 }, (_, d) => (d === a.digit ? confidence : alts.includes(d) ? (1 - confidence) / Math.max(1, alts.length - 1) : 0.001))
  return {
    digit: a.digit,
    confidence,
    probs,
    alternatives: alts.map((digit) => ({ digit, p: probs[digit] })),
    embedding: [],
    image28: new Float32Array(784),
  }
}

/**
 * Answers come from a queue (in call order, cycling) or from a function of the strokes.
 * `calls` records every call so tests can assert on what the UI sent to the recogniser.
 */
export function scriptedRecognizer(script: ScriptedAnswer[] | ((strokes: InkStroke[], zone: { width: number; height: number }) => ScriptedAnswer)) {
  let i = 0
  const calls: { strokes: InkStroke[]; zone: { width: number; height: number } }[] = []
  const rec: Recognizer & { calls: typeof calls; personal: unknown[] } = {
    ready: true,
    calls,
    personal: [],
    async load() {},
    recognize(strokes, zone) {
      calls.push({ strokes, zone })
      const a = typeof script === 'function' ? script(strokes, zone) : script[i++ % script.length]
      return recognition(a)
    },
    setPersonalSamples(samples) {
      rec.personal = samples
    },
  }
  return rec
}
