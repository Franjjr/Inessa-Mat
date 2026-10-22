import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig } from '@/types'
import BoardActivity from './index'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/activities', () => ({ ExerciseView: () => <div data-testid="question" /> }))
vi.mock('@/art', () => ({ Character: () => <span aria-hidden /> }))

const config: ActivityConfig = {
  kind: 'board',
  title: 'Carrera al Castillo',
  instructions: '',
  selector: { kinds: ['fact-mul'] },
  count: 3,
  params: { squares: 12, opponent: 'lumi' },
}

describe('board activity (Carrera al Castillo)', () => {
  it('draws a board with one square per step, the child piece on the start and the opponent', () => {
    render(<BoardActivity config={config} onDone={() => {}} onExit={() => {}} />)
    expect(screen.getByLabelText('Carrera al castillo')).toBeTruthy()
    expect(screen.getAllByLabelText(/^casilla \d+/).length).toBe(12)
    expect(screen.getByLabelText('Tú')).toBeTruthy()
    expect(screen.getByLabelText('Lumi')).toBeTruthy()
  })

  it('rolls the die and then shows the question for the rolled move', async () => {
    render(<BoardActivity config={config} onDone={() => {}} onExit={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tirar el dado' }))
    await waitFor(() => expect(screen.getByTestId('question')).toBeTruthy(), { timeout: 3000 })
  })
})
