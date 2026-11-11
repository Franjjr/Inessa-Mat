import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActivityConfig } from '@/types'
import BoardActivity from './index'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/activities', () => ({
  // The question shows its id, and two buttons answer it right or wrong.
  ExerciseView: ({ exercise, onAnswered }: { exercise: { id: string }; onAnswered: (o: unknown) => void }) => (
    <div data-testid="question" data-id={exercise.id}>
      <button type="button" onClick={() => onAnswered({ check: { correct: false }, ms: 1, inputMode: 'tap', hintsUsed: 0 })}>fallar</button>
      <button type="button" onClick={() => onAnswered({ check: { correct: true }, ms: 1, inputMode: 'tap', hintsUsed: 0 })}>acertar</button>
    </div>
  ),
}))
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

describe('board: a wrong answer comes back', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks the question again later in the race, and the message only promises that', async () => {
    // A long board: four turns of up to six squares must not reach the castle.
    const threeQuestions: ActivityConfig = { ...config, count: 3, params: { squares: 30, opponent: 'lumi' } }
    render(<BoardActivity config={threeQuestions} onDone={() => {}} onExit={() => {}} />)
    // Small steps: each timer of the walk schedules the next one only after React has rendered it.
    const wait = async (ms: number) => {
      for (let t = 0; t < ms; t += 100) await act(() => vi.advanceTimersByTimeAsync(100))
    }
    const ids: string[] = []
    for (let turn = 0; turn < 4; turn++) {
      await wait(3000)
      fireEvent.click(screen.getByRole('button', { name: /dado/i }))
      await wait(1000)
      ids.push(screen.getByTestId('question').getAttribute('data-id') ?? '')
      if (turn === 0) {
        fireEvent.click(screen.getByRole('button', { name: 'fallar' }))
        expect(screen.getByText(/volverá a salir más adelante/)).toBeTruthy()
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'acertar' }))
      }
    }
    expect(new Set(ids.slice(0, 3)).size).toBe(3)
    expect(ids[3]).toBe(ids[0])
  })
})
