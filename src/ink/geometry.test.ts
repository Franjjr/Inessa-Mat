import type { InkStroke } from '@/types'
import { countReversals, isNoise, isScribble, isTap, segmentStrokes, segmentZone, spreadCentres, strokesNear, strokeBBox } from './geometry'
import { handwrite, handwriteNumber, scribble } from './fixtures'

const H = 120
const zone = { width: 100, height: 120 }

/** Digits of a number written into a pad of height H, each in its own slot. */
function written(n: string, opts: { slot?: number; gap?: number; seed?: number } = {}) {
  const slot = opts.slot ?? 80
  return handwriteNumber(n, { x: 20, y: 0, w: slot * n.length, h: H }, { seed: opts.seed ?? 3, gap: opts.gap })
}

describe('segmentStrokes', () => {
  it('keeps the two strokes of a 4, 5 and 7 together', () => {
    for (const d of [4, 5, 7]) {
      const strokes = handwrite(d, { x: 10, y: 0, w: 90, h: H })
      expect(strokes.length).toBe(2)
      const segs = segmentStrokes(strokes, { zoneHeight: H })
      expect(segs, `digit ${d}`).toHaveLength(1)
      expect(segs[0].strokes).toHaveLength(2)
    }
  })

  it('splits a written number into digits left to right', () => {
    for (const n of ['42', '57', '74', '100', '11', '648', '9']) {
      const segs = segmentStrokes(written(n), { zoneHeight: H })
      expect(segs.map((s) => s.strokes.length), n).toHaveLength(n.length)
      const xs = segs.map((s) => s.bbox.cx)
      expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    }
  })

  it('is robust to strokes written out of order (the 4 finished after the 2)', () => {
    const four = handwrite(4, { x: 20, y: 0, w: 80, h: H })
    const two = handwrite(2, { x: 100, y: 0, w: 80, h: H })
    const segs = segmentStrokes([four[0], ...two, four[1]], { zoneHeight: H })
    expect(segs).toHaveLength(2)
    expect(segs[0].strokes).toEqual([four[0], four[1]])
  })

  it('tolerates neighbours that slightly overlap', () => {
    // squeeze the slots so the 4's bar reaches into the 2
    const segs = segmentStrokes(written('42', { slot: 62, gap: 8 }), { zoneHeight: H })
    expect(segs).toHaveLength(2)
  })

  it('merges a detached hat of a 5 into its digit and drops tiny dots', () => {
    const [stem, hat] = handwrite(5, { x: 20, y: 0, w: 80, h: H })
    const detachedHat: InkStroke = { ...hat, points: hat.points.map((p) => ({ ...p, x: p.x + 14 })) }
    const dot: InkStroke = { pointerType: 'pen', points: [{ x: 150, y: 60, t: 0 }, { x: 151, y: 61, t: 5 }] }
    const segs = segmentStrokes([stem, detachedHat, dot], { zoneHeight: H })
    expect(segs).toHaveLength(1)
    expect(segs[0].strokes).toHaveLength(2)
  })

  it('returns nothing for no ink', () => {
    expect(segmentStrokes([], { zoneHeight: H })).toEqual([])
  })

  it('re-centres a segment into a single-digit zone', () => {
    const [seg] = segmentStrokes(handwrite(7, { x: 300, y: 0, w: 80, h: H }), { zoneHeight: H })
    const { strokes, zone: z } = segmentZone(seg, H)
    const b = strokeBBox({ pointerType: 'pen', points: strokes.flatMap((s) => s.points) })
    expect(Math.abs(b.cx - z.width / 2)).toBeLessThan(1)
    expect(z.height).toBe(H)
  })
})

describe('gestures', () => {
  it('detects a tap but not a short real stroke', () => {
    const tap: InkStroke = { pointerType: 'pen', points: [{ x: 40, y: 40, t: 0 }, { x: 42, y: 41, t: 90 }] }
    expect(isTap(tap, zone)).toBe(true)
    const slowPress: InkStroke = { pointerType: 'pen', points: [{ x: 40, y: 40, t: 0 }, { x: 41, y: 41, t: 900 }] }
    expect(isTap(slowPress, zone)).toBe(false)
    const one = handwrite(1, { x: 0, y: 0, w: 100, h: 120 })[0]
    expect(isTap(one, zone)).toBe(false)
  })

  it('recognises a scribble-out but never a digit (incl. a 0 traced twice, 3 and 8)', () => {
    expect(isScribble(scribble({ x: 10, y: 10, w: 80, h: 90 }, 5), zone)).toBe(true)
    for (let d = 0; d <= 9; d++) {
      for (const s of handwrite(d, { x: 0, y: 0, w: 100, h: 120 }, { wobble: 3 })) expect(isScribble(s, zone), `digit ${d}`).toBe(false)
    }
    const zero = handwrite(0, { x: 0, y: 0, w: 100, h: 120 })[0]
    const twice: InkStroke = { pointerType: 'pen', points: [...zero.points, ...zero.points.slice(1)] }
    expect(isScribble(twice, zone)).toBe(false)
  })

  it('counts reversals with hysteresis', () => {
    expect(countReversals([0, 10, 0, 10, 0], 5)).toBe(3)
    expect(countReversals([0, 1, 0, 1, 0, 1], 5)).toBe(0)
  })

  it('flags tiny marks as noise', () => {
    expect(isNoise({ pointerType: 'pen', points: [{ x: 0, y: 0, t: 0 }, { x: 2, y: 2, t: 1 }] }, 120)).toBe(true)
    expect(isNoise(handwrite(1, { x: 0, y: 0, w: 100, h: 120 })[0], 120)).toBe(false)
  })

  it('finds strokes under the eraser', () => {
    const [a] = handwrite(1, { x: 0, y: 0, w: 100, h: 120 })
    const [b] = handwrite(1, { x: 200, y: 0, w: 100, h: 120 })
    const p = a.points[5]
    expect(strokesNear([a, b], p.x, p.y, 6)).toEqual([a])
  })
})

describe('spreadCentres', () => {
  it('keeps typeset digits apart and inside the pad', () => {
    const out = spreadCentres([100, 105], 40, 300)
    expect(out[1] - out[0]).toBeGreaterThanOrEqual(40)
    const edge = spreadCentres([280, 290], 40, 300)
    expect(edge[1]).toBeLessThanOrEqual(280)
  })
})
