/* Maze: after two wrong taps the whole fact with its result is shown before the right cell is highlighted, and the
   step taken with that help is reported as a hint (it does not count as known). */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig } from '@/types'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import MazeActivity from './index'
import { buildMaze } from './grid'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}) },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const config: ActivityConfig = { kind: 'maze', title: 'Laberinto', instructions: '', selector: { kinds: ['fact-mul'], tables: [7] }, params: { table: 7 }, count: 1 }

function seededRng() {
  let seed = 5
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

describe('MazeActivity', () => {
  it('shows the full fact after two misses and reports the helped step as a hint', async () => {
    const reportAttempt = vi.fn()
    // Rebuild the same maze the activity will build (same seed, same first rng draws).
    const maze = buildMaze(7, 6, 6, seededRng())
    const expected = maze.path[1]
    const wrong = maze.values.findIndex((v, i) => i !== 0 && i !== maze.values.length - 1 && !maze.path.includes(i) && v % 7 !== 0)
    const user = userEvent.setup()
    render(
      <ActivityHostProvider value={{ ...defaultActivityHost, rng: seededRng(), reportAttempt }}>
        <MazeActivity config={config} onDone={() => {}} onExit={() => {}} />
      </ActivityHostProvider>,
    )
    const cell = (c: number) => screen.getByRole('button', { name: `Casilla ${maze.values[c]}` })
    await user.click(cell(wrong))
    await user.click(cell(wrong))
    const k = maze.values[expected] / 7
    expect(screen.getByRole('status').textContent).toContain(`7 × ${k} = ${maze.values[expected]}`)
    await user.click(cell(expected))
    expect(reportAttempt).toHaveBeenLastCalledWith(expect.objectContaining({ hintsUsed: 1 }))
    expect(screen.getByRole('status').textContent).toContain(`7 × ${k} = ${maze.values[expected]}`)
  })
})
