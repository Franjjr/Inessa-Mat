/* The hidden picture asks every coloured group with a usable fact, whatever the count: no group is revealed without a
   question, and none is cut so that it could never open. */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig } from '@/types'
import PixelActivity from './index'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}) },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const legend = {
  P: { product: 6, color: 'red', name: 'rosa' },
  M: { product: 42, color: 'blue', name: 'morado' },
  Y: { product: 56, color: 'gold', name: 'amarillo' },
}

describe('PixelActivity', () => {
  it('asks every coloured group even when the count is smaller', () => {
    const config: ActivityConfig = {
      kind: 'pixel', title: 'El cristal escondido', instructions: '', selector: { kinds: ['fact-mul'], tables: [6, 7, 8] },
      count: 1, params: { picture: ['PMY.'], legend },
    }
    render(<PixelActivity config={config} onDone={() => {}} onExit={() => {}} />)
    // Three coloured groups and the generic fact of the '.' cell: four questions, none of them cut.
    expect(screen.getByText(/1 \/ 4/)).toBeTruthy()
  })
})
