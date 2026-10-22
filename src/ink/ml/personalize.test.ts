import { describe, expect, it } from 'vitest'
import { DEFAULT_PERSONALIZATION, PersonalIndex } from './personalize'

const DIM = 8
const unit = (i: number, noise = 0) => Array.from({ length: DIM }, (_, k) => (k === i ? 1 : 0) + noise * Math.sin(k * 7 + i))
const cnn = (top: number, p: number) => {
  const out = Array(11).fill((1 - p) / 10)
  out[top] = p
  return out
}
const sum = (a: ArrayLike<number>) => Array.from(a).reduce((x, y) => x + y, 0)

describe('PersonalIndex', () => {
  it('leaves the CNN untouched without samples or when nothing is similar', () => {
    const idx = new PersonalIndex()
    const p = cnn(7, 0.9)
    expect(Array.from(idx.blend(p, unit(0)).probs)).toEqual(p)
    idx.set([{ digit: 1, embedding: unit(1) }, { digit: 1, embedding: unit(1, 0.01) }], DIM)
    const r = idx.blend(p, unit(5)) // orthogonal to the "1" samples
    expect(r.personalWeight).toBeLessThan(1e-6)
    expect(r.probs[7]).toBeCloseTo(0.9, 6)
  })

  it('keeps a valid distribution (incl. the reject class) and respects the cap', () => {
    const idx = new PersonalIndex()
    idx.set(Array.from({ length: 30 }, () => ({ digit: 4, embedding: unit(4) })), DIM)
    const r = idx.blend(cnn(9, 0.99), unit(4))
    expect(sum(r.probs)).toBeCloseTo(1, 9)
    expect(r.personalWeight).toBeLessThanOrEqual(DEFAULT_PERSONALIZATION.cap + 1e-9)
    expect(r.probs[4]).toBeGreaterThan(r.probs[9]) // many consistent samples win
    expect(r.probs[9]).toBeGreaterThanOrEqual(0.99 * (1 - DEFAULT_PERSONALIZATION.cap) - 1e-9)
  })

  it('weight grows with the number of samples of a class', () => {
    const w = (n: number) => {
      const idx = new PersonalIndex()
      idx.set(Array.from({ length: n }, () => ({ digit: 3, embedding: unit(3) })), DIM)
      return idx.blend(cnn(8, 0.95), unit(3)).personalWeight
    }
    expect(w(1)).toBeLessThan(w(2))
    expect(w(2)).toBeLessThan(w(4))
    expect(w(4)).toBeLessThan(w(12))
    expect(w(1)).toBeLessThan(0.35)
  })

  it('a single wrong sample cannot overturn a confident CNN', () => {
    const idx = new PersonalIndex()
    idx.set([{ digit: 1, embedding: unit(7) }], DIM) // a "7" stored as "1"
    const r = idx.blend(cnn(7, 0.95), unit(7))
    expect(r.probs[7]).toBeGreaterThan(r.probs[1])
  })

  it('top-2 averaging: one odd sample inside a class with good samples matters little', () => {
    const idx = new PersonalIndex()
    idx.set([
      { digit: 1, embedding: unit(1) }, { digit: 1, embedding: unit(1, 0.02) }, { digit: 1, embedding: unit(7) }, // last one is wrong
      { digit: 7, embedding: unit(7, 0.02) }, { digit: 7, embedding: unit(7, 0.03) },
    ], DIM)
    const r = idx.blend(cnn(7, 0.6), unit(7))
    expect(r.probs[7]).toBeGreaterThan(0.6)
    expect(r.probs[1]).toBeLessThan(0.1)
  })

  it('ignores invalid samples and keeps only the newest per class', () => {
    const idx = new PersonalIndex(10, { maxPerClass: 3 })
    idx.set([
      { digit: -1, embedding: unit(0) }, { digit: 10, embedding: unit(0) }, { digit: 2.5, embedding: unit(0) },
      { digit: 2, embedding: [1, 2] }, { digit: 2, embedding: Array(DIM).fill(0) },
      ...Array.from({ length: 5 }, () => ({ digit: 6, embedding: unit(6) })),
    ], DIM)
    expect(idx.counts()).toEqual([0, 0, 0, 0, 0, 0, 3, 0, 0, 0])
  })
})
