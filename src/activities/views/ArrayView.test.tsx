import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ArrayExercise } from '@/types'
import ArrayView from './ArrayView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const exercise: ArrayExercise = {
  id: 'arr-2x3', kind: 'array', skill: 'array:2x3' as ArrayExercise['skill'], difficulty: 2,
  rows: 2, cols: 3, emoji: '🍎', answer: 6,
}

describe('ArrayView accessibility', () => {
  it('uses a plain group of toggle buttons, not a grid with gridcells', () => {
    render(<ArrayView exercise={exercise} onAnswered={() => {}} showFeedback={false} />)
    expect(screen.queryByRole('grid')).toBeNull()
    expect(screen.queryByRole('gridcell')).toBeNull()
    const group = screen.getByRole('group', { name: '2 filas de 3' })
    expect(within(group).getAllByRole('button')).toHaveLength(6)
  })

  it('names each object by its position and exposes counted state with aria-pressed', async () => {
    const user = userEvent.setup()
    render(<ArrayView exercise={exercise} onAnswered={() => {}} showFeedback={false} />)
    const first = screen.getByRole('button', { name: '🍎, fila 1, columna 1' })
    expect(first).toHaveAttribute('aria-pressed', 'false')
    await user.click(first)
    // The name stays the same: only the pressed state changes.
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '🍎, fila 1, columna 1' })).toBe(first)
    expect(screen.queryByRole('button', { name: /contado/ })).toBeNull()
  })
})
