/* Handwriting doubt beyond the confidence threshold. A read whose two best candidates are a pair that children's
   handwriting often blurs (CONFUSABLE_PAIRS: 1/7, 4/9, 0/6, 5/6, 3/8, 1/8, 1/3, 3/9, 2/7) is doubtful when the margin between them is narrow, even if the
   top candidate is above LOW_CONFIDENCE. The child then confirms the digit before the answer is graded. */
import type { DigitRecognition } from '@/types'
import { CONFUSABLE_MARGIN, CONFUSABLE_PAIRS, LOW_CONFIDENCE } from './constants'

export function isDoubtfulRead(r: Pick<DigitRecognition, 'digit' | 'confidence' | 'probs'>): boolean {
  if (r.digit == null) return false
  if (r.confidence < LOW_CONFIDENCE) return true
  const ranked = r.probs.map((_, d) => d).sort((a, b) => r.probs[b] - r.probs[a])
  const [first, second] = ranked
  if (second === undefined) return false
  const pair = CONFUSABLE_PAIRS.some(([a, b]) => (first === a && second === b) || (first === b && second === a))
  return pair && r.probs[first] - r.probs[second] < CONFUSABLE_MARGIN
}
