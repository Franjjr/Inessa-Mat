import { describe, expect, it } from 'vitest'
import type { DigitRecognition } from '@/types'
import { isDoubtfulRead } from './confusable'

/** Recognition with a given distribution over 0..9 (the rest of the mass spread over the other digits). */
function read(digit: number, probs: Partial<Record<number, number>>): DigitRecognition {
  const full = Array.from({ length: 10 }, (_, d) => probs[d] ?? 0.001)
  const confidence = full[digit]
  return {
    digit,
    confidence,
    probs: full,
    alternatives: full.map((p, d) => ({ digit: d, p })).sort((a, b) => b.p - a.p).slice(0, 3),
    embedding: [],
    image28: new Float32Array(784),
  }
}

describe('isDoubtfulRead · handwriting doubt', () => {
  it('a confident, clear read is not in doubt', () => {
    expect(isDoubtfulRead(read(7, { 7: 0.95, 1: 0.03 }))).toBe(false)
  })

  it('a low-confidence read is in doubt whatever its candidates', () => {
    expect(isDoubtfulRead(read(7, { 7: 0.42, 2: 0.4 }))).toBe(true)
  })

  it('a 7 read as 1 with a narrow margin is in doubt even when the model sounds confident', () => {
    // 0.62 vs 0.35: above LOW_CONFIDENCE, but the two best candidates are a confusable pair with a narrow margin
    expect(isDoubtfulRead(read(7, { 7: 0.62, 1: 0.35 }))).toBe(true)
    expect(isDoubtfulRead(read(1, { 1: 0.62, 7: 0.35 }))).toBe(true)
  })

  it('every confusable pair is checked in both orders', () => {
    for (const [a, b] of [[4, 9], [0, 6], [5, 6], [3, 8]]) {
      expect(isDoubtfulRead(read(a, { [a]: 0.63, [b]: 0.34 }))).toBe(true)
      expect(isDoubtfulRead(read(b, { [b]: 0.63, [a]: 0.34 }))).toBe(true)
    }
  })

  it('a narrow margin between digits that are not a confusable pair is not in doubt', () => {
    expect(isDoubtfulRead(read(2, { 2: 0.66, 3: 0.32 }))).toBe(false)
    expect(isDoubtfulRead(read(4, { 4: 0.66, 2: 0.32 }))).toBe(false)
  })

  it('a wide margin inside a confusable pair is not in doubt', () => {
    expect(isDoubtfulRead(read(1, { 1: 0.9, 7: 0.07 }))).toBe(false)
  })

  it('no digit means nothing to confirm here', () => {
    expect(isDoubtfulRead({ ...read(7, { 7: 0.9 }), digit: null })).toBe(false)
  })
})
