/* The subtraction views by method: the column (borrow and carry marks, the +10 gift), the parts view and the number-line
   view. Typing goes through the digit cells, as in ColumnView.test.tsx. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeColumnSub } from '@/engine'
import SubtractionView from './SubtractionView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const cell = (name: RegExp | string) => screen.getByRole('textbox', { name })

/** Types the digits of n (units first) into the cells named `${place} ${tail}`, e.g. tail "de salto 1". */
function type(n: number, tail: string, places = ['unidades', 'decenas', 'centenas', 'unidades de mil']) {
  const digits = String(n).split('').reverse()
  digits.forEach((d, i) => {
    fireEvent.keyDown(cell(new RegExp(`^${places[i]} ${tail}`)), { key: d })
  })
}

describe('column view by method', () => {
  it('borrow: the lender mark is graded where written, and the +10 appears once it is right', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="borrow" />)
    expect(screen.queryByText('+10')).toBeNull()
    fireEvent.keyDown(cell(/marca de decenas \(opcional\)/), { key: '4' })
    expect(screen.getByText('+10')).toBeTruthy()
    type(225, 'del resultado')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].method).toBe('borrow')
  })

  it('borrow: a wrong lender mark makes the answer wrong, even with the right result', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="borrow" />)
    fireEvent.keyDown(cell(/marca de decenas \(opcional\)/), { key: '3' })
    expect(screen.queryByText('+10')).toBeNull()
    type(225, 'del resultado')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('carry: the +1 goes under the subtrahend, and its place is named for the child', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="carry" />)
    expect(screen.getByText(/Me llevo una abajo|me llevo una/i, { exact: false, selector: 'p' })).toBeTruthy()
    fireEvent.keyDown(cell(/compensación de decenas \(opcional\)/), { key: '3' })
    type(225, 'del resultado')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    const outcome = onAnswered.mock.calls[0][0]
    expect(outcome.check.correct).toBe(true)
    expect(outcome.method).toBe('carry')
  })

  it('without the method, subtraction is the borrow column', () => {
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={() => {}} showFeedback={false} />)
    expect(screen.getByRole('textbox', { name: /marca de decenas/ })).toBeTruthy()
  })
})

describe('parts view', () => {
  it('352 − 127: three steps, each taken from the result of the step before', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="parts" />)
    expect(screen.getByText('352 − 127 = 352 − 100 − 20 − 7')).toBeTruthy()
    type(252, 'de resultado del paso 1', ['unidades', 'decenas', 'centenas'])
    type(232, 'de resultado del paso 2', ['unidades', 'decenas', 'centenas'])
    type(225, 'de resultado del paso 3', ['unidades', 'decenas', 'centenas'])
    act(() => { fireEvent.keyDown(cell(/unidades de resultado del paso 1/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].method).toBe('parts')
  })

  it('a wrong step is wrong, and the answer is not graded as correct', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="parts" />)
    type(252, 'de resultado del paso 1', ['unidades', 'decenas', 'centenas'])
    type(230, 'de resultado del paso 2', ['unidades', 'decenas', 'centenas'])
    type(223, 'de resultado del paso 3', ['unidades', 'decenas', 'centenas'])
    act(() => { fireEvent.keyDown(cell(/unidades de resultado del paso 1/), { key: 'Enter' }) })
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })
})

describe('number-line view', () => {
  it('352 − 127: the stops 130, 300, 350 and the total 225', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="line" />)
    type(130, 'de salto 1', ['unidades', 'decenas', 'centenas'])
    type(300, 'de salto 2', ['unidades', 'decenas', 'centenas'])
    type(350, 'de salto 3', ['unidades', 'decenas', 'centenas'])
    type(225, 'de total saltado', ['unidades', 'decenas', 'centenas'])
    act(() => { fireEvent.keyDown(cell(/unidades de salto 1/), { key: 'Enter' }) })
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(onAnswered.mock.calls[0][0].method).toBe('line')
  })
})
