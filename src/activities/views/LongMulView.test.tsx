import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeLongMul } from '@/engine'
import LongMulView from './LongMulView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const cell = (name: RegExp | string) => screen.getByRole('textbox', { name })
const type = (name: RegExp | string, digit: string) => fireEvent.keyDown(cell(name), { key: digit })

describe('LongMulView', () => {
  it('23 × 14: writing 92, 230 and 322 by rows is correct', () => {
    const onAnswered = vi.fn()
    render(<LongMulView exercise={makeLongMul(23, 14)} onAnswered={onAnswered} showFeedback={false} />)
    // Row 1 (× 4): 92, written units first.
    type(/parcial 1, unidades/, '2')
    type(/parcial 1, decenas/, '9')
    // Row 2 (× 1 decena): the zero of the units is already written; 230.
    type(/parcial 2, decenas/, '3')
    type(/parcial 2, centenas/, '2')
    // Total: 322.
    type(/unidades del resultado/, '2')
    type(/decenas del resultado/, '2')
    type(/centenas del resultado/, '3')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('typed in turn, the keypad fills row 1, row 2 and the total in order (the empty places past a row are skipped)', () => {
    const onAnswered = vi.fn()
    render(<LongMulView exercise={makeLongMul(23, 14)} onAnswered={onAnswered} showFeedback={false} />)
    cell(/parcial 1, unidades/).focus()
    // 2 and 9 are row 1 (92); the hundreds of row 1 are not written, so the next digit goes to row 2.
    for (const digit of ['2', '9', '3', '2', '2', '2', '3']) fireEvent.keyDown(document.activeElement as Element, { key: digit })
    expect(cell(/parcial 1, unidades/)).toHaveTextContent('2')
    expect(cell(/parcial 1, decenas/)).toHaveTextContent('9')
    expect(cell(/parcial 2, decenas/)).toHaveTextContent('3')
    expect(cell(/parcial 2, centenas/)).toHaveTextContent('2')
    expect(cell(/unidades del resultado/)).toHaveTextContent('2')
    expect(cell(/decenas del resultado/)).toHaveTextContent('2')
    expect(cell(/centenas del resultado/)).toHaveTextContent('3')
  })

  it('the zero that shifts the second row is already written and is not an input', () => {
    render(<LongMulView exercise={makeLongMul(23, 14)} onAnswered={() => {}} showFeedback={false} />)
    expect(screen.getByLabelText('cero de desplazamiento')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /parcial 2, unidades/ })).toBeNull()
  })

  it('a wrong total is not correct', () => {
    const onAnswered = vi.fn()
    render(<LongMulView exercise={makeLongMul(23, 14)} onAnswered={onAnswered} showFeedback={false} />)
    type(/unidades del resultado/, '3')
    type(/decenas del resultado/, '2')
    type(/centenas del resultado/, '3')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })
})
