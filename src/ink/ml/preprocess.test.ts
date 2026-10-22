import { describe, expect, it } from 'vitest'
import type { InkStroke } from '@/types'
import { centerOfMass, decodeImage28, dropStrayStrokes, encodeImage28, imageBBox, minInkExtent, PREPROCESS, preprocessStrokes } from './preprocess'
import { decodeSparseImage, maxAbsDiff, readFixture, type FixtureCase } from './testUtils'

const { cases } = readFixture<{ cases: FixtureCase[] }>('cases.json')
const byName = (n: string) => cases.find((c) => c.name === n)!

const line = (x0: number, y0: number, x1: number, y1: number, n = 30): InkStroke => ({
  pointerType: 'pen',
  points: Array.from({ length: n }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / (n - 1), y: y0 + ((y1 - y0) * i) / (n - 1), t: i * 8 })),
})

describe('preprocess: parity with ml/preprocess.py', () => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const r = preprocessStrokes(c.strokes, c.zone)
    if (c.reference.image === null) {
      expect(r.image).toBeNull()
      return
    }
    expect(r.image).not.toBeNull()
    expect(maxAbsDiff(r.image!, decodeSparseImage(c.reference.image))).toBeLessThan(1e-5)
  })
})

describe('preprocess: invariants', () => {
  it('returns no image for empty input', () => {
    expect(preprocessStrokes([], { width: 100, height: 100 })).toMatchObject({ image: null, reason: 'empty' })
    const blank: InkStroke = { points: [], pointerType: 'pen' }
    expect(preprocessStrokes([blank], { width: 100, height: 100 }).reason).toBe('empty')
  })

  it('treats a dot or a tiny mark as no digit (relative to the zone)', () => {
    expect(preprocessStrokes(byName('dot').strokes, byName('dot').zone).reason).toBe('tiny')
    expect(preprocessStrokes(byName('tiny-stroke').strokes, byName('tiny-stroke').zone).reason).toBe('tiny')
    // the same 5 px mark is a real attempt inside a small carry box but not inside a big pad
    const mark = [line(10, 10, 10, 15)]
    expect(preprocessStrokes(mark, { width: 30, height: 30 }).reason).toBe('ok')
    expect(preprocessStrokes(mark, { width: 300, height: 300 }).reason).toBe('tiny')
    expect(minInkExtent(null)).toBe(PREPROCESS.minInkPx)
  })

  it('keeps the aspect ratio: a thin "1" stays thin and tall', () => {
    const r = preprocessStrokes([line(50, 10, 51, 110)], { width: 100, height: 120 })
    const bb = imageBBox(r.image!)!
    expect(bb.y1 - bb.y0 + 1).toBeGreaterThanOrEqual(19)
    expect(bb.x1 - bb.x0 + 1).toBeLessThanOrEqual(4)
  })

  it('fits the larger side into the 20 px box and keeps values in 0..1', () => {
    const r = preprocessStrokes([line(0, 50, 200, 50)], { width: 220, height: 120 })
    const bb = imageBBox(r.image!, 0.5)!
    expect(bb.x1 - bb.x0 + 1).toBeGreaterThanOrEqual(18)
    expect(bb.x1 - bb.x0 + 1).toBeLessThanOrEqual(21)
    for (const v of r.image!) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('centres every digit by centre of mass', () => {
    for (const c of cases.filter((c) => c.expected !== null)) {
      const r = preprocessStrokes(c.strokes, c.zone)
      const com = centerOfMass(r.image!)
      expect(Math.abs(com.x - 14)).toBeLessThan(0.35)
      expect(Math.abs(com.y - 14)).toBeLessThan(0.35)
    }
  })

  it('is translation invariant and nearly scale invariant', () => {
    const c = byName('digit-5-0')
    const a = preprocessStrokes(c.strokes, c.zone).image!
    const moved = c.strokes.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p, x: p.x + 37, y: p.y - 12 })) }))
    expect(maxAbsDiff(a, preprocessStrokes(moved, c.zone).image!)).toBeLessThan(1e-6)
    const big = c.strokes.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p, x: p.x * 3, y: p.y * 3 })) }))
    expect(maxAbsDiff(a, preprocessStrokes(big, { width: c.zone.width * 3, height: c.zone.height * 3 }).image!)).toBeLessThan(1e-4)
    const s = preprocessStrokes(byName('one-small').strokes, byName('one-small').zone).image!
    const l = preprocessStrokes(byName('one-large').strokes, byName('one-large').zone).image!
    expect(maxAbsDiff(s, l)).toBeLessThan(0.05)
  })

  it('ignores a stray tap far from the digit, but keeps small parts that belong to it', () => {
    const seven = byName('digit-7-0')
    const tapped = byName('tap-then-7')
    expect(maxAbsDiff(preprocessStrokes(seven.strokes, seven.zone).image!, preprocessStrokes(tapped.strokes, tapped.zone).image!)).toBe(0)
    expect(dropStrayStrokes(tapped.strokes)).toHaveLength(seven.strokes.length)
    // a short crossbar inside the digit is never removed
    const withBar = [line(10, 10, 60, 10), line(60, 10, 30, 110), line(38, 60, 46, 60, 3)]
    expect(dropStrayStrokes(withBar)).toHaveLength(3)
    // only dots: nothing is dropped (the classifier decides)
    expect(dropStrayStrokes(byName('dots-only').strokes)).toHaveLength(3)
  })

  it('ignores the on-screen pen width: input pressure does not matter', () => {
    const c = byName('digit-2-0')
    const withPressure = c.strokes.map((s) => ({ ...s, points: s.points.map((p, i) => ({ ...p, p: (i % 10) / 10 })) }))
    expect(maxAbsDiff(preprocessStrokes(c.strokes, c.zone).image!, preprocessStrokes(withPressure, c.zone).image!)).toBe(0)
  })

  it('encodes image28 for InkSample storage (0..255 base64) and decodes it back', () => {
    const img = preprocessStrokes(byName('digit-8-0').strokes, byName('digit-8-0').zone).image!
    const b64 = encodeImage28(img)
    const back = decodeImage28(b64)!
    expect(back).toHaveLength(784)
    expect(maxAbsDiff(img, back)).toBeLessThanOrEqual(0.5 / 255 + 1e-6)
    expect(decodeImage28('not base64!')).toBeNull()
    expect(decodeImage28(btoa('short'))).toBeNull()
  })
})
