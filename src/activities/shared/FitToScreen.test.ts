import { MIN_SCREEN_FIT_MOUSE, MIN_SCREEN_FIT_TOUCH, screenFitScale } from './FitToScreen'

describe('screenFitScale', () => {
  it('leaves a game that fits at full size', () => {
    expect(screenFitScale(600, 500, MIN_SCREEN_FIT_TOUCH)).toBe(1)
    expect(screenFitScale(600, 600, MIN_SCREEN_FIT_TOUCH)).toBe(1)
  })

  it('shrinks a taller game just enough to fit (never rounding up past the space)', () => {
    const s = screenFitScale(450, 600, MIN_SCREEN_FIT_TOUCH)
    expect(s).toBeCloseTo(0.75, 3)
    expect(600 * s).toBeLessThanOrEqual(450)
  })

  it('never goes below the minimum: then the page scrolls (with the «⬇» button)', () => {
    expect(screenFitScale(300, 900, MIN_SCREEN_FIT_TOUCH)).toBe(MIN_SCREEN_FIT_TOUCH)
    expect(screenFitScale(300, 900, MIN_SCREEN_FIT_MOUSE)).toBe(MIN_SCREEN_FIT_MOUSE)
    expect(MIN_SCREEN_FIT_MOUSE).toBeLessThan(MIN_SCREEN_FIT_TOUCH)
  })

  it('ignores a box that has not been laid out yet', () => {
    expect(screenFitScale(600, 0, MIN_SCREEN_FIT_TOUCH)).toBe(1)
    expect(screenFitScale(0, 600, MIN_SCREEN_FIT_TOUCH)).toBe(1)
  })
})
