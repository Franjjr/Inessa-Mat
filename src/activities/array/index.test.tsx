import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig } from '@/types'
import ArrayActivity from './index'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const config: ActivityConfig = {
  kind: 'array', title: 'Construye el rectángulo', instructions: '', selector: { kinds: ['array'] }, count: 1,
  params: { mirror: true },
}

describe('ArrayActivity build slots', () => {
  it('names every empty slot by its row and column, not by a generic label', async () => {
    const user = userEvent.setup()
    render(<ArrayActivity config={config} onDone={() => {}} onExit={() => {}} />)
    const frame = screen.getByRole('group', { name: /Rectángulo de \d+ filas y \d+ columnas/ })
    const slots = within(frame).getAllByRole('button')
    expect(slots.length).toBeGreaterThan(1)
    const names = slots.map((b) => b.getAttribute('aria-label'))
    expect(new Set(names).size).toBe(names.length)
    expect(names.every((n) => /^Fila \d+, columna \d+$/.test(n ?? ''))).toBe(true)
    expect(screen.queryByRole('button', { name: 'hueco vacío' })).toBeNull()

    // Filling a slot keeps its name and only flips aria-pressed.
    const first = slots[0]
    const firstName = first.getAttribute('aria-label')
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveAttribute('aria-label', firstName)
  })
})
