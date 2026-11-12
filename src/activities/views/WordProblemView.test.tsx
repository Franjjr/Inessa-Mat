import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { WordProblemExercise } from '@/types'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'
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

describe('WordProblemView with a remainder (H19)', () => {
  const withRest: WordProblemExercise = {
    id: 'wp-17-5', kind: 'word-problem', skill: 'word:div' as WordProblemExercise['skill'], difficulty: 3,
    text: 'Hay 17 cromos para 5 amigos. ¿Cuántos le tocan a cada uno?', op: 'div', operands: [17, 5], answer: 3, remainder: 2, unit: 'cromos',
  }

  it('the quotient and the remainder share one «Comprobar»: no ✓ of their own', () => {
    // With a pen (no on-screen keypad) each box would show its own ✓ beside it.
    render(<InkProvider recognizer={scriptedRecognizer([])} penSeen><WordProblemView exercise={withRest} onAnswered={vi.fn()} showFeedback={false} /></InkProvider>)
    // The on-screen keypad's own ✓ key (src/ink/Keypad, shown in keypad mode) is the ink's: left out here.
    const checks = screen.getAllByRole('button', { name: /Comprobar/ }).filter((b) => !/_key_/.test(b.className))
    expect(checks).toHaveLength(1)
    expect(checks[0].textContent).toMatch(/Comprobar/)
  })

  it('without a remainder the box keeps its ✓ beside it (one answer, one box)', () => {
    render(<WordProblemView exercise={exercise} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.getAllByRole('button', { name: /Comprobar/ }).length).toBeGreaterThanOrEqual(1)
  })
})
