/* Multiplicar por partes: the labels say each line, and a right total is never graded as a mistake. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeMulParts } from '@/engine'
import MulPartsView from './MulPartsView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const typeNumber = (name: string, n: number) => {
  for (const d of String(n)) act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name }), { key: d }) })
}
const checkButton = () => within(screen.getByRole('group', { name: 'Respuesta' })).getByRole('button', { name: /Comprobar/ })

describe('MulPartsView (23 × 14)', () => {
  it('the lines say «23 × 4 =», «23 × 10 =» and «Suma =»', () => {
    render(<MulPartsView exercise={makeMulParts(23, 14)} onAnswered={vi.fn()} />)
    expect(screen.getByText('23 × 4 =')).toBeTruthy()
    expect(screen.getByText('23 × 10 =')).toBeTruthy()
    expect(screen.getByText('Suma =')).toBeTruthy()
  })

  it('with only the total 322 nothing is graded: Comprobar waits for the three lines (no «incomplete» mistake)', () => {
    const onAnswered = vi.fn()
    render(<MulPartsView exercise={makeMulParts(23, 14)} onAnswered={onAnswered} showFeedback={false} />)
    expect(checkButton()).toBeDisabled()
    typeNumber('La suma', 322)
    expect(checkButton()).toBeDisabled()
    act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name: 'La suma' }), { key: 'Enter' }) })
    act(() => { fireEvent.click(checkButton()) })
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('with the three lines right, the answer is right', () => {
    const onAnswered = vi.fn()
    render(<MulPartsView exercise={makeMulParts(23, 14)} onAnswered={onAnswered} showFeedback={false} />)
    typeNumber('23 por 4', 92)
    typeNumber('23 por 10', 230)
    typeNumber('La suma', 322)
    expect(checkButton()).not.toBeDisabled()
    act(() => { fireEvent.click(checkButton()) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
