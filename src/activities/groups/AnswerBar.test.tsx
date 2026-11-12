import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeColumnSub } from '@/engine'
import type { AnswerFlow } from './flow'
import { AnswerBar } from './AnswerBar'

// A flow after a wrong check, with the first hint already revealed.
function flowAfterWrongCheck(overrides: Partial<AnswerFlow> = {}): AnswerFlow {
  return {
    result: { correct: false, given: '', expected: '', feedback: 'Revisa las unidades.' },
    graded: null,
    submitted: true,
    hints: [{ level: 1, text: 'Empieza por las unidades.', visual: 'none' }, { level: 2, text: 'Suma 8 y 7.', visual: 'none' }],
    hintsShown: 1,
    showNextHint: () => null,
    countClue: () => {},
    submit: () => ({ correct: false, given: '', expected: '' }),
    finish: vi.fn(),
    showFeedback: true,
    allowHints: true,
    ...overrides,
  }
}

describe('AnswerBar: one message at a time (P3PE-13)', () => {
  it('after a wrong check with a hint open there is one message: the feedback, which names the column', () => {
    render(<AnswerBar flow={flowAfterWrongCheck()} onCheck={vi.fn()} canCheck />)
    expect(screen.getByText('Revisa las unidades.')).toBeTruthy()
    expect(screen.queryByText('Empieza por las unidades.')).toBeNull()
  })

  it('a hint asked for after the check takes the place of the feedback', () => {
    const flow = flowAfterWrongCheck()
    const { rerender } = render(<AnswerBar flow={flow} onCheck={vi.fn()} canCheck />)
    rerender(<AnswerBar flow={{ ...flow, hintsShown: 2 }} onCheck={vi.fn()} canCheck />)
    expect(screen.getByText('Suma 8 y 7.')).toBeTruthy()
    expect(screen.queryByText('Revisa las unidades.')).toBeNull()
  })

  it('shows the hint on its own when there is no result yet', () => {
    render(<AnswerBar flow={flowAfterWrongCheck({ submitted: false, result: null })} onCheck={vi.fn()} canCheck />)
    expect(screen.getByText('Empieza por las unidades.')).toBeTruthy()
  })
})

describe('AnswerBar: the solution after the second wrong check (P4)', () => {
  const exercise = makeColumnSub(352, 127)

  it('shows «Así se resuelve» under the bar after two wrong checks', () => {
    render(<AnswerBar flow={flowAfterWrongCheck({ exercise, wrongTries: 2 })} onCheck={vi.fn()} canCheck />)
    expect(screen.getByTestId('solution-panel')).toHaveTextContent('225')
    // The buttons stay: the panel comes after the bar, never over it.
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeTruthy()
  })

  it('not after the first wrong check', () => {
    render(<AnswerBar flow={flowAfterWrongCheck({ exercise, wrongTries: 1 })} onCheck={vi.fn()} canCheck />)
    expect(screen.queryByTestId('solution-panel')).toBeNull()
  })

  it('not in a lesson or a review, whose host owns the result (feedback off)', () => {
    render(<AnswerBar flow={flowAfterWrongCheck({ exercise, wrongTries: 2, showFeedback: false })} onCheck={vi.fn()} canCheck />)
    expect(screen.queryByTestId('solution-panel')).toBeNull()
  })

  it('not once the answer is right', () => {
    const result = { correct: true, given: '225', expected: '225' }
    render(<AnswerBar flow={flowAfterWrongCheck({ exercise, wrongTries: 2, result })} onCheck={vi.fn()} canCheck />)
    expect(screen.queryByTestId('solution-panel')).toBeNull()
  })
})
