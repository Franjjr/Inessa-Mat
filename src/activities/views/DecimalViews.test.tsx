/* The décimas and the sums of decimals: what the child sees and what they send. NumberInput (handwriting) is covered by
   its own tests; here it is a plain box, so the views' logic is what gets tested. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DecimalExercise, DecimalOpExercise } from '@/types'
import DecimalOpView from './DecimalOpView'
import DecimalView from './DecimalView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/ink', () => ({
  NumberInput: (p: {
    value: number | null
    onChange: (v: number | null) => void
    onSubmit: (v: number | null) => void
    ariaLabel?: string
    placeholder?: string
  }) => (
    <input
      aria-label={p.ariaLabel}
      value={p.value ?? ''}
      placeholder={p.placeholder}
      onChange={(e) => p.onChange(e.target.value === '' ? null : Number(e.target.value))}
      onKeyDown={(e) => { if (e.key === 'Enter') p.onSubmit(p.value) }}
    />
  ),
  // The column of decimal-op: one digit box per place (DigitCell) inside a CellGroup; here plain boxes too.
  CellGroup: (p: { children: unknown }) => p.children,
  DigitCell: (p: { value: number | null; onChange: (v: number | null) => void; ariaLabel: string }) => (
    <input
      aria-label={p.ariaLabel}
      value={p.value ?? ''}
      onChange={(e) => p.onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  ),
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

const comprobar = () => screen.getByRole('button', { name: /Comprobar/ })
const box = (name: string) => screen.getByRole('textbox', { name })

describe('DecimalOpView (P3PE-10: a column with one box per digit, the comma fixed)', () => {
  const sum: DecimalOpExercise = { id: 'dec-op-1', kind: 'decimal-op', skill: 'dec:add:2', difficulty: 3, op: 'add', places: 2, left: 125, right: 250, answer: 375 }

  it('1,25 + 2,50: every digit in its column, the commas printed one under the other; 3, 7, 5 in the boxes is correct', () => {
    const onAnswered = vi.fn()
    const { container } = render(<DecimalOpView exercise={sum} onAnswered={onAnswered} showFeedback={false} />)
    // One box per digit of the result, named by its place; no box for the comma.
    expect(screen.getAllByRole('textbox').map((b) => b.getAttribute('aria-label'))).toEqual(['unidades del resultado', 'décimas del resultado', 'centésimas del resultado'])
    expect(container.querySelectorAll('[aria-hidden]').length).toBeGreaterThan(0)
    expect([...container.querySelectorAll('span')].filter((e) => e.textContent === ',').length).toBe(3)
    fireEvent.change(box('unidades del resultado'), { target: { value: '3' } })
    fireEvent.change(box('décimas del resultado'), { target: { value: '7' } })
    fireEvent.change(box('centésimas del resultado'), { target: { value: '5' } })
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong decimal part is not correct (the empty centésimas count as 0: 3,70 is not 3,75)', () => {
    const onAnswered = vi.fn()
    render(<DecimalOpView exercise={sum} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('unidades del resultado'), { target: { value: '3' } })
    fireEvent.change(box('décimas del resultado'), { target: { value: '7' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('a sum that carries into the tens gets a tens box: 9,5 + 2,5 = 12,0', () => {
    const big: DecimalOpExercise = { id: 'dec-op-3', kind: 'decimal-op', skill: 'dec:add:1', difficulty: 3, op: 'add', places: 1, left: 950, right: 250, answer: 1200 }
    const onAnswered = vi.fn()
    render(<DecimalOpView exercise={big} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('decenas del resultado'), { target: { value: '1' } })
    fireEvent.change(box('unidades del resultado'), { target: { value: '2' } })
    fireEvent.change(box('décimas del resultado'), { target: { value: '0' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a subtraction with décimas: one box for the tenth', () => {
    const diff: DecimalOpExercise = { id: 'dec-op-2', kind: 'decimal-op', skill: 'dec:sub:1', difficulty: 3, op: 'sub', places: 1, left: 430, right: 180, answer: 250 }
    const onAnswered = vi.fn()
    render(<DecimalOpView exercise={diff} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('unidades del resultado'), { target: { value: '2' } })
    fireEvent.change(box('décimas del resultado'), { target: { value: '5' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('DecimalView: the boxes are really empty (P3PE-10)', () => {
  it('no «0», «00» or «€» written in an empty box', () => {
    const ex: DecimalExercise = { id: 'dec-r', kind: 'decimal', skill: 'dec:read:2', difficulty: 3, mode: 'read', places: 2, value: 125, answer: 125 }
    render(<DecimalView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    for (const b of screen.getAllByRole('textbox')) expect(b.getAttribute('placeholder')).toBe('')
  })
})

describe('DecimalView', () => {
  it('compare: 4 décimas is more than 3 décimas, so «mayor que» is right and «menor que» is not', () => {
    const ex: DecimalExercise = { id: 'dec-c', kind: 'decimal', skill: 'dec:compare', difficulty: 3, mode: 'compare', places: 1, value: 40, other: 30, answer: '>' }
    const onAnswered = vi.fn()
    render(<DecimalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('0,4')).toBeTruthy()
    expect(screen.getByText('0,3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'menor que' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('compare: «mayor que» for 0,4 and 0,3 is correct', () => {
    const ex: DecimalExercise = { id: 'dec-c2', kind: 'decimal', skill: 'dec:compare', difficulty: 3, mode: 'compare', places: 1, value: 40, other: 30, answer: '>' }
    const onAnswered = vi.fn()
    render(<DecimalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'mayor que' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('money: 2,45 € is written as 2 euros and 45 céntimos in two boxes', () => {
    const ex: DecimalExercise = { id: 'dec-m', kind: 'decimal', skill: 'dec:money', difficulty: 3, mode: 'money', places: 2, value: 245, answer: 245 }
    const onAnswered = vi.fn()
    render(<DecimalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('Euros'), { target: { value: '2' } })
    fireEvent.change(box('Céntimos'), { target: { value: '45' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('centésimas: 0,05 is written 0 , 0 5; 0,5 is written 0 , 5 with the centésimas empty or 0 and is graded right', () => {
    const five: DecimalExercise = { id: 'dec-s5', kind: 'decimal', skill: 'dec:read:2', difficulty: 3, mode: 'read', places: 2, value: 5, answer: 5 }
    const onAnswered = vi.fn()
    const { unmount } = render(<DecimalView exercise={five} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('Parte entera'), { target: { value: '0' } })
    fireEvent.change(box('Décimas'), { target: { value: '0' } })
    fireEvent.change(box('Centésimas'), { target: { value: '5' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    unmount()

    const half: DecimalExercise = { id: 'dec-s50', kind: 'decimal', skill: 'dec:read:2', difficulty: 3, mode: 'read', places: 2, value: 50, answer: 50 }
    const second = vi.fn()
    render(<DecimalView exercise={half} onAnswered={second} showFeedback={false} />)
    fireEvent.change(box('Parte entera'), { target: { value: '0' } })
    fireEvent.change(box('Décimas'), { target: { value: '5' } })
    fireEvent.click(comprobar())
    expect(second.mock.calls[0][0].check.correct).toBe(true)
  })

  it('shade: the bar of ten parts is drawn without the count, so the drawing does not give the answer', () => {
    const ex: DecimalExercise = { id: 'dec-s', kind: 'decimal', skill: 'dec:shade:1', difficulty: 2, mode: 'shade', places: 1, value: 40, answer: 40 }
    render(<DecimalView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    const bar = screen.getByRole('img', { name: 'Barra dividida en diez partes iguales' })
    expect(bar.children).toHaveLength(10)
    expect(bar.textContent).toBe('')
  })

  it('read: the words are shown and the number is written in the boxes', () => {
    const ex: DecimalExercise = { id: 'dec-r', kind: 'decimal', skill: 'dec:read:1', difficulty: 3, mode: 'read', places: 1, value: 30, answer: 30 }
    const onAnswered = vi.fn()
    render(<DecimalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('tres décimas')).toBeTruthy()
    fireEvent.change(box('Parte entera'), { target: { value: '0' } })
    fireEvent.change(box('Décimas'), { target: { value: '3' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
