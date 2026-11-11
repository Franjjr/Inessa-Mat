import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { WordProblemExercise } from '@/types'
import WordProblemView from './WordProblemView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const exercise: WordProblemExercise = {
  id: 'wp-3-2', kind: 'word-problem', skill: 'word:add:3' as WordProblemExercise['skill'], difficulty: 2,
  text: 'Ana tiene 3 estrellas y le dan 2 más. ¿Cuántas tiene ahora?', op: 'add', operands: [3, 2], answer: 5, unit: 'estrellas',
}

describe('WordProblemView operation choice', () => {
  it('a wrong operation is a clue: the right answer after it counts a hint used', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={exercise} onAnswered={onAnswered} showFeedback={false} chooseOp />)
    await user.click(screen.getByRole('button', { name: /Quitar/ }))
    expect(screen.getByText(/Esa no es la que toca/)).toBeInTheDocument()
    // The clue never names the operation.
    expect(screen.queryByText(/Juntar/, { selector: 'p' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /Juntar/ }))
    await user.type(screen.getByRole('textbox', { name: 'Respuesta' }), '5{Enter}')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(1)
  })

  it('trying every operation counts one clue, and the child can still go on with the right one', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={exercise} onAnswered={onAnswered} showFeedback={false} chooseOp />)
    await user.click(screen.getByRole('button', { name: /Quitar/ }))
    await user.click(screen.getByRole('button', { name: /Repetir/ }))
    await user.click(screen.getByRole('button', { name: /Repartir/ }))
    await user.click(screen.getByRole('button', { name: /Juntar/ }))
    await user.type(screen.getByRole('textbox', { name: 'Respuesta' }), '5{Enter}')
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(1)
  })

  it('choosing the right operation first uses no hint', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<WordProblemView exercise={exercise} onAnswered={onAnswered} showFeedback={false} chooseOp />)
    await user.click(screen.getByRole('button', { name: /Juntar/ }))
    expect(screen.queryByText(/Esa no es la que toca/)).toBeNull()
    await user.type(screen.getByRole('textbox', { name: 'Respuesta' }), '5{Enter}')
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(0)
  })
})
