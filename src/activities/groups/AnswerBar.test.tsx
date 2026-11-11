import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
    submit: () => ({ correct: false, given: '', expected: '' }),
    finish: vi.fn(),
    showFeedback: true,
    allowHints: true,
    ...overrides,
  }
}

describe('AnswerBar hint after a check', () => {
  it('keeps the revealed hint visible after the child has checked a wrong answer', () => {
    render(<AnswerBar flow={flowAfterWrongCheck()} onCheck={vi.fn()} canCheck />)
    expect(screen.getByText('Revisa las unidades.')).toBeTruthy()
    expect(screen.getByText('Empieza por las unidades.')).toBeTruthy()
  })

  it('shows the hint on its own when there is no result yet', () => {
    render(<AnswerBar flow={flowAfterWrongCheck({ submitted: false, result: null })} onCheck={vi.fn()} canCheck />)
    expect(screen.getByText('Empieza por las unidades.')).toBeTruthy()
  })
})
