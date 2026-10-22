import type { InkStroke } from '@/types'
import { MODEL_H, MODEL_W } from './digitModels'
import { handwrite } from './fixtures'
import { fitModel, scoreTrace } from './trace'

const W = 330
const H = 420
const fit = fitModel(W, H)
const box = { x: fit.ox, y: fit.oy, w: MODEL_W * fit.scale, h: MODEL_H * fit.scale }

describe('scoreTrace', () => {
  it('gives 3 stars to a careful trace of every digit', () => {
    for (let d = 0; d <= 9; d++) {
      const r = scoreTrace(d, handwrite(d, box, { fill: 1, slant: 0, wobble: 1.5, seed: d }), fit)
      expect(r.stars, `digit ${d} score ${r.score.toFixed(2)}`).toBe(3)
      expect(r.startOk).toBe(true)
    }
  })

  it('is gentle with a wobbly trace and low for the wrong digit', () => {
    const wobbly = scoreTrace(7, handwrite(7, box, { fill: 1, slant: 0.12, wobble: 6, seed: 2 }), fit)
    expect(wobbly.stars).toBeGreaterThanOrEqual(2)
    const wrong = scoreTrace(7, handwrite(0, box, { fill: 1, slant: 0, wobble: 1 }), fit)
    expect(wrong.stars).toBe(1)
  })

  it('caps at 2 stars when the trace starts at the wrong end', () => {
    const reversed: InkStroke[] = handwrite(1, box, { fill: 1, slant: 0, wobble: 1 }).map((s) => ({ ...s, points: [...s.points].reverse() }))
    const r = scoreTrace(1, reversed, fit)
    expect(r.startOk).toBe(false)
    expect(r.stars).toBeLessThanOrEqual(2)
  })

  it('handles no ink', () => {
    expect(scoreTrace(3, [], fit).stars).toBe(1)
  })
})
