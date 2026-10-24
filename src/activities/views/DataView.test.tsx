import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, generate } from '@/engine'
import type { ChartExercise, Exercise } from '@/types'
import DataView from './DataView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const one = (skill: string, seed: number): Exercise => generate({ skills: [skill] }, 1, { rng: createRng(seed) })[0]

describe('DataView: chart:table', () => {
  it('draws the double-entry table inside a wrapper, with an emoji and a label per option and one row per group', () => {
    const ex = one('chart:table', 2) as ChartExercise
    const t = ex.table!
    render(<DataView exercise={ex} onAnswered={() => {}} showFeedback={false} allowHints={false} />)
    const table = screen.getByRole('table')
    expect(table.parentElement?.className).toMatch(/tableWrap/)
    expect(within(table).getAllByRole('columnheader')).toHaveLength(t.cols.length + 1)
    expect(within(table).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(t.rows)
    const cells = within(table).getAllByRole('cell')
    expect(cells).toHaveLength(t.rows.length * t.cols.length)
    expect(cells.map((c) => Number(c.textContent))).toEqual(t.cells.flat())
    expect(screen.getByText(ex.question)).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Respuesta' })).toBeTruthy()
  })
})
