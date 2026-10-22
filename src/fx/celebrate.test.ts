import type confettiNs from 'canvas-confetti'

const h = vi.hoisted(() => {
  const resolvers: (() => void)[] = []
  const fire = Object.assign(
    vi.fn((_o?: unknown) => new Promise<void>((r) => resolvers.push(r))),
    { reset: vi.fn() },
  )
  return { fire, create: vi.fn((_c?: unknown, _o?: unknown) => fire), resolvers }
})

vi.mock('canvas-confetti', () => ({ default: { create: h.create } }))

import { celebrate, recipe, stopCelebrations, type CelebrationKind } from './celebrate'

const KINDS: CelebrationKind[] = ['small', 'big', 'stars', 'crystal', 'chest']
const HEX = /^#[0-9a-f]{6}$/

type Opts = confettiNs.Options

function firedOptions(): Opts[] {
  return h.fire.mock.calls.map((c) => c[0] as Opts)
}

function setReducedMotion(on: boolean) {
  window.matchMedia = vi.fn((q: string) => ({
    matches: on && q.includes('reduce'), media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  vi.useFakeTimers()
  h.fire.mockClear()
  h.create.mockClear()
  h.resolvers.length = 0
  setReducedMotion(false)
  Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true })
})

afterEach(() => {
  stopCelebrations()
  vi.useRealTimers()
})

describe('celebration recipes', () => {
  it.each(KINDS)('%s uses star-shaped particles and hex colours only', (kind) => {
    const bursts = recipe(kind, {}, () => 0.5)
    expect(bursts.length).toBeGreaterThan(0)
    for (const b of bursts) {
      expect(b.opts.shapes).toContain('star')
      expect(b.opts.colors!.length).toBeGreaterThan(0)
      for (const c of b.opts.colors!) expect(c).toMatch(HEX)
      expect(b.opts.particleCount!).toBeGreaterThan(0)
    }
  })

  it("'chest' is the biggest celebration and 'small' the smallest", () => {
    const total = (k: CelebrationKind) => recipe(k, {}, () => 0.5).reduce((s, b) => s + (b.opts.particleCount ?? 0), 0)
    const totals = Object.fromEntries(KINDS.map((k) => [k, total(k)]))
    for (const k of KINDS) if (k !== 'chest') expect(totals.chest).toBeGreaterThan(totals[k])
    for (const k of KINDS) if (k !== 'small') expect(totals.small).toBeLessThan(totals[k])
  })

  it("'crystal' uses the world colour (CSS variable) and its tints", () => {
    document.documentElement.style.setProperty('--w2', '#123456')
    const colors = recipe('crystal', { colors: ['var(--w2)'] })[0].opts.colors!
    expect(colors[0]).toBe('#123456')
    expect(colors.length).toBeGreaterThan(3)
    document.documentElement.style.removeProperty('--w2')
    // Without a colour it falls back to Lumi's rainbow.
    expect(recipe('crystal')[0].opts.colors!.length).toBeGreaterThan(5)
  })

  it('fires from the requested origin', () => {
    const b = recipe('small', { origin: { x: 0.2, y: 0.3 } })
    expect(b[0].opts.origin).toEqual({ x: 0.2, y: 0.3 })
    expect(recipe('small', { origin: { x: 9, y: -9 } })[0].opts.origin).toEqual({ x: 1.2, y: -0.2 })
  })
})

describe('celebrate()', () => {
  it('draws on its own crisp canvas, scaled for retina screens', () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true })
    celebrate('small')
    const canvas = document.querySelector('canvas')!
    expect(canvas).not.toBeNull()
    expect(canvas.width).toBe(window.innerWidth * 2)
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    const [first] = firedOptions()
    const plain = recipe('small')[0].opts
    expect(first.scalar).toBeCloseTo((plain.scalar ?? 1) * 2)
    expect(first.startVelocity).toBeCloseTo((plain.startVelocity ?? 45) * 2)
    expect(h.create).toHaveBeenCalledWith(canvas, expect.objectContaining({ useWorker: false }))
  })

  it('plays multi-stage celebrations over time', () => {
    celebrate('chest')
    const immediate = h.fire.mock.calls.length
    vi.advanceTimersByTime(2500)
    expect(h.fire.mock.calls.length).toBeGreaterThan(immediate + 4)
  })

  it('removes the canvas once idle', async () => {
    celebrate('small')
    expect(document.querySelector('canvas')).not.toBeNull()
    for (const r of h.resolvers) r()
    await Promise.resolve()
    await Promise.resolve()
    vi.advanceTimersByTime(700)
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('keeps a particle budget under rapid repeats', () => {
    for (let i = 0; i < 30; i++) celebrate('big')
    vi.advanceTimersByTime(500)
    const total = firedOptions().reduce((s, o) => s + (o.particleCount ?? 0), 0)
    expect(total).toBeLessThanOrEqual(650)
  })

  it('does nothing while the tab is hidden', () => {
    const spy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    celebrate('big')
    vi.advanceTimersByTime(1000)
    expect(h.fire).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('reduced motion: no confetti; a gentle glow that only fades, then cleans up', () => {
    setReducedMotion(true)
    celebrate('small')
    expect(document.querySelector('[data-fx]')).toBeNull()
    celebrate('crystal', { colors: ['#2563eb'] })
    expect(h.fire).not.toHaveBeenCalled()
    const overlay = document.querySelector('[data-fx="crystal"]') as HTMLElement
    expect(overlay).not.toBeNull()
    expect(overlay.getAttribute('aria-hidden')).toBe('true')
    expect(overlay.querySelectorAll('svg').length).toBeGreaterThan(3)
    vi.advanceTimersByTime(2500)
    expect(document.querySelector('[data-fx]')).toBeNull()
  })

  it('stopCelebrations cancels pending stages', () => {
    celebrate('chest')
    const n = h.fire.mock.calls.length
    stopCelebrations()
    vi.advanceTimersByTime(3000)
    expect(h.fire.mock.calls.length).toBe(n)
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('never throws, even if confetti fails', () => {
    h.fire.mockImplementationOnce(() => { throw new Error('boom') })
    expect(() => celebrate('stars')).not.toThrow()
  })
})
