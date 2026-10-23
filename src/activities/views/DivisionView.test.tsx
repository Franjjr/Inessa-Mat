import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeDivision } from '@/engine'
import DivisionView from './DivisionView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

describe('DivisionView (galera)', () => {
  it('opens one step at a time: 84 ÷ 4 has two steps, the second opens after the first is written', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={() => {}} showFeedback={false} />)
    expect(screen.getAllByRole('textbox', { name: /cociente/ })).toHaveLength(1)
    expect(screen.getAllByRole('textbox', { name: /resto del paso 1/ })).toHaveLength(1)
    fireEvent.keyDown(screen.getByRole('textbox', { name: /cociente, cifra 1/ }), { key: '2' })
    fireEvent.keyDown(screen.getByRole('textbox', { name: /resto del paso 1/ }), { key: '0' })
    expect(screen.getAllByRole('textbox', { name: /cociente/ })).toHaveLength(2)
  })

  it('reports the quotient and remainder of 72 ÷ 3 = 24 with no remainder', () => {
    const onAnswered = vi.fn()
    render(<DivisionView exercise={makeDivision(72, 3)} onAnswered={onAnswered} showFeedback={false} />)
    const type = (name: RegExp, key: string) => fireEvent.keyDown(screen.getByRole('textbox', { name }), { key })
    type(/cociente, cifra 1/, '2')
    type(/resto del paso 1/, '1')
    type(/cociente, cifra 2/, '4')
    type(/resto del paso 2/, '0')
    fireEvent.keyDown(screen.getByRole('textbox', { name: /cociente, cifra 2/ }), { key: 'Enter' })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    const outcome = onAnswered.mock.calls[0][0]
    expect(outcome.check.correct).toBe(true)
    expect(outcome.check.given).toBe('24 resto 0')
  })

  it('leaves the result and the forward button to the host when feedback is off (guardian, daily review)', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={() => {}} showFeedback={false} />)
    const type = (name: RegExp, key: string) => fireEvent.keyDown(screen.getByRole('textbox', { name }), { key })
    type(/cociente, cifra 1/, '2')
    type(/resto del paso 1/, '0')
    type(/cociente, cifra 2/, '1')
    type(/resto del paso 2/, '0')
    fireEvent.keyDown(screen.getByRole('textbox', { name: /cociente, cifra 2/ }), { key: 'Enter' })
    // Regression: the view showed its own "Siguiente" next to the host's, and it did nothing.
    expect(screen.queryByRole('button', { name: /Siguiente/ })).toBeNull()
  })

  it('a 2-digit divisor: each remainder has a tens cell, and a blank tens cell counts as 0 (583 ÷ 23 = 25 resto 8)', () => {
    const onAnswered = vi.fn()
    const ex = { id: 'division:583/23', kind: 'division', skill: 'div:3x2:rem', difficulty: 6, dividend: 583, divisor: 23, quotient: 25, remainder: 8, variant: 'rem' } as const
    render(<DivisionView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const type = (name: RegExp, key: string) => fireEvent.keyDown(screen.getByRole('textbox', { name }), { key })
    type(/^cociente, cifra 1$/, '2')
    type(/^resto del paso 1$/, '2')
    type(/^resto del paso 1, decenas$/, '1')
    type(/^cociente, cifra 2$/, '5')
    type(/^resto$/, '8')
    expect(screen.getByRole('textbox', { name: /^resto, decenas$/ })).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('textbox', { name: /^cociente, cifra 2$/ }), { key: 'Enter' })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].check.given).toBe('25 resto 8')
  })
})
