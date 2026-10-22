import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig } from '@/types'
import ShareActivity from './index'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const config: ActivityConfig = {
  kind: 'share',
  title: 'Repartos justos',
  instructions: '',
  selector: { kinds: ['fact-div'] },
  count: 1,
}

describe('share activity', () => {
  it('hands out every object to the friends, one at a time, and then asks how many each friend got', () => {
    render(<ShareActivity config={config} onDone={() => {}} onExit={() => {}} />)
    const prompt = screen.getByText(/Reparte \d+/)
    const total = Number(/Reparte (\d+)/.exec(prompt.textContent ?? '')?.[1])
    const friends = Number(/entre (\d+) amigas/.exec(prompt.textContent ?? '')?.[1])
    expect(total).toBeGreaterThan(0)
    expect(friends).toBeGreaterThan(0)

    for (let i = 0; i < total; i++) {
      const bins = screen.getAllByRole('button', { name: /^Amiga \d+:/ })
      // The next object goes to the friend with the fewest objects (fair sharing).
      const counts = bins.map((b) => Number(/: (\d+)/.exec(b.getAttribute('aria-label') ?? '')?.[1]))
      const fewest = Math.min(...counts)
      fireEvent.click(bins[counts.indexOf(fewest)])
      // Fair at every step: the friends never differ by more than one object.
      const sofar = counts.map((c, k) => (k === counts.indexOf(fewest) ? c + 1 : c))
      expect(Math.max(...sofar) - Math.min(...sofar)).toBeLessThanOrEqual(1)
    }

    // All objects are handed out: the answer step opens.
    expect(screen.getByText('¿Cuántos le tocan a cada amiga?')).toBeTruthy()
    expect(screen.getByText(/÷/)).toBeTruthy()
  })

  it('takes an object back when it is tapped', () => {
    render(<ShareActivity config={config} onDone={() => {}} onExit={() => {}} />)
    const firstBin = screen.getAllByRole('button', { name: /^Amiga \d+:/ })[0]
    fireEvent.click(firstBin)
    expect(firstBin.getAttribute('aria-label')).toMatch(/: 1/)
    const item = firstBin.querySelector('[role="presentation"]') as HTMLElement
    fireEvent.click(item)
    expect(screen.getAllByRole('button', { name: /^Amiga \d+:/ })[0].getAttribute('aria-label')).toMatch(/: 0/)
  })
})
