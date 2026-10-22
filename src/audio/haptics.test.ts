import { __resetHapticsForTests, haptics } from './haptics'

let clock = 1000

function installVibrate() {
  const fn = vi.fn(() => true)
  Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true, writable: true })
  return fn
}

beforeEach(() => {
  __resetHapticsForTests()
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (navigator as unknown as Record<string, unknown>).vibrate
  delete (navigator as unknown as Record<string, unknown>).userActivation
})

describe('haptics', () => {
  it('is a silent no-op without navigator.vibrate (iOS)', () => {
    expect(haptics.supported()).toBe(false)
    expect(() => { haptics.tap(); haptics.success(); haptics.error() }).not.toThrow()
  })

  it('uses short, soft patterns on Android', () => {
    const v = installVibrate()
    haptics.tap()
    haptics.success()
    haptics.error()
    expect(v).toHaveBeenNthCalledWith(1, 8)
    expect(v).toHaveBeenNthCalledWith(2, [14, 70, 22])
    expect(v).toHaveBeenNthCalledWith(3, [22, 90, 22])
    // Gentle: every vibration pulse (even indexes; odd ones are pauses) lasts at most 30 ms.
    for (const [p] of v.mock.calls as unknown as [number | number[]][]) {
      ;[p].flat().forEach((ms, i) => { if (i % 2 === 0) expect(ms).toBeLessThanOrEqual(30) })
    }
  })

  it('rate-limits taps', () => {
    const v = installVibrate()
    haptics.tap()
    clock += 10
    haptics.tap()
    clock += 50
    haptics.tap()
    expect(v).toHaveBeenCalledTimes(2)
  })

  it('waits for a user gesture (Chrome blocks vibration before one)', () => {
    const v = installVibrate()
    Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: false }, configurable: true })
    haptics.success()
    expect(v).not.toHaveBeenCalled()
  })

  it('can be turned off', () => {
    const v = installVibrate()
    haptics.setEnabled(false)
    haptics.success()
    expect(v).toHaveBeenCalledTimes(1)
    expect(v).toHaveBeenCalledWith(0)
  })
})
