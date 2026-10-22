import { describe, expect, it } from 'vitest'
import { MIN_FIT_SCALE, fitScale } from './TrySlot'

describe('fitScale', () => {
  it('leaves an exercise that already fits at full size', () => {
    expect(fitScale(600, 500)).toBe(1)
    expect(fitScale(500, 0)).toBe(1)
  })

  it('shrinks a taller exercise to the available height', () => {
    expect(fitScale(400, 500)).toBeCloseTo(0.8)
  })

  it('never shrinks below the tap-target floor', () => {
    expect(fitScale(100, 600)).toBe(MIN_FIT_SCALE)
  })
})
