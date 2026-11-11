import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('share activity · guiding highlight', () => {
  it('keeps the highlight on the friend who is next, also after the sharing can be skipped', async () => {
    const user = userEvent.setup()
    render(<ShareActivity config={{ ...config, count: 5 }} onDone={() => {}} onExit={() => {}} />)
    for (let round = 0; round < 3; round++) {
      // Hand out every object, always to the friend with the fewest.
      while (screen.queryAllByRole('button', { name: /^Amiga \d+:/ }).length > 0) {
        const bins = screen.getAllByRole('button', { name: /^Amiga \d+:/ })
        const counts = bins.map((b) => Number(/: (\d+)/.exec(b.getAttribute('aria-label') ?? '')?.[1]))
        fireEvent.click(bins[counts.indexOf(Math.min(...counts))])
      }
      const equation = /(\d+) ÷ (\d+) = \?/.exec(screen.getByText(/÷/).textContent ?? '')
      expect(equation).not.toBeNull()
      await user.click(screen.getByRole('textbox', { name: 'Cuántos le tocan a cada amiga' }))
      await user.keyboard(String(Number(equation?.[1]) / Number(equation?.[2])))
      await user.click(screen.getByRole('button', { name: '✓ Comprobar' }))
      await user.click(screen.getByRole('button', { name: 'Siguiente →' }))
    }
    // Three rounds right: the skip button appears, and the friend who is next keeps its highlight.
    expect(screen.getByRole('button', { name: 'Ya lo sé, ¿cuántos le tocan?' })).toBeTruthy()
    const bins = screen.getAllByRole('button', { name: /^Amiga \d+:/ })
    expect(bins[0].className).toMatch(/next/)
  })
})
