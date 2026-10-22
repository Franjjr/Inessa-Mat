/* Digits offered as chips for an unsure recognition. */
import type { DigitRecognition } from '@/types'
import { ALT_CHIPS } from './constants'

/** All digits in keypad order (1…9, 0) for the full picker. */
export const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

/** Top alternatives (best guess first) from a recognition. */
export function alternativeDigits(rec: DigitRecognition | null, n = ALT_CHIPS): number[] {
  if (!rec) return ALL_DIGITS
  let list = rec.alternatives?.length
    ? [...rec.alternatives].sort((a, b) => b.p - a.p).map((a) => a.digit)
    : rec.probs.map((p, d) => ({ p, d })).sort((a, b) => b.p - a.p).map((x) => x.d)
  if (rec.digit != null) list = [rec.digit, ...list.filter((d) => d !== rec.digit)]
  return list.filter((d, i, arr) => d >= 0 && d <= 9 && arr.indexOf(d) === i).slice(0, n)
}
