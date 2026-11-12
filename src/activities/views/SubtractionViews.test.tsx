/* The subtraction view by method: the column (borrow and carry marks, the +10 gift); the retired parts and number-line
   views of old data become the borrow column. Typing goes through the digit cells, as in ColumnView.test.tsx. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeColumnSub } from '@/engine'
import SubtractionView from './SubtractionView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const cell = (name: RegExp | string) => screen.getByRole('textbox', { name })

/** Types the digits of n (units first) into the cells named `${place} ${tail}`, e.g. tail "de salto 1". */
function type(n: number, tail: string, places = ['unidades', 'decenas', 'centenas', 'millares']) {
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

  it('borrow: an unexpected lender mark never turns a right result into a wrong one', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} method="borrow" />)
    fireEvent.keyDown(cell(/marca de decenas \(opcional\)/), { key: '3' })
    expect(screen.queryByText('+10')).toBeNull()
    type(225, 'del resultado')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('carry: 996 − 377 with the carried 1 written under the tens is right (the tablet case)', () => {
    const onAnswered = vi.fn()
    render(<SubtractionView exercise={makeColumnSub(996, 377)} onAnswered={onAnswered} showFeedback={false} method="carry" />)
    fireEvent.keyDown(cell(/compensación de decenas \(opcional\)/), { key: '1' })
    type(619, 'del resultado')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
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

describe('retired methods of old data', () => {
  it('«por partes» and «saltos en la recta» show the borrow column: 212 − 40 = 172 is right', () => {
    for (const method of ['parts', 'line'] as const) {
      const onAnswered = vi.fn()
      const { unmount } = render(<SubtractionView exercise={makeColumnSub(212, 40)} onAnswered={onAnswered} method={method} showFeedback={false} />)
      expect(screen.getByRole('region', { name: 'Operación en columna' })).toBeTruthy()
      expect(screen.getByRole('textbox', { name: /marca de decenas/ })).toBeTruthy()
      type(172, 'del resultado')
      act(() => { fireEvent.keyDown(cell(/^centenas del resultado/), { key: 'Enter' }) })
      expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
      unmount()
    }
  })
})
