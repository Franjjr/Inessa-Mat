/* PUBLIC API of the digit recogniser (agent: ml). Pure TS (no React): preprocessing strokes → 28×28,
   CNN inference from /models/digits/model.json, personalised kNN blending.
   Contract:
     createRecognizer(): DigitRecognizer           — singleton-friendly, call load() once
     setPersonalSamples(samples: {digit, embedding}[]) — child's calibration / confirmed samples
   The ink agent builds UI on top of this; it must not reimplement preprocessing or inference. */
import type { DigitRecognizer, DigitRecognition, InkStroke } from '@/types'

export interface PersonalSample { digit: number; embedding: number[] }

export function createRecognizer(): DigitRecognizer & { setPersonalSamples(samples: PersonalSample[]): void } {
  return {
    ready: false,
    async load() {},
    recognize(_strokes: InkStroke[], _zone: { width: number; height: number }): DigitRecognition {
      return { digit: null, confidence: 0, probs: Array(10).fill(0.1), alternatives: [], embedding: [], image28: new Float32Array(784) }
    },
    setPersonalSamples() {},
  }
}
