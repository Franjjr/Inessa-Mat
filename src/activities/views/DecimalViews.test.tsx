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
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

const comprobar = () => screen.getByRole('button', { name: /Comprobar/ })
const box = (name: string) => screen.getByRole('textbox', { name })

describe('DecimalOpView', () => {
  const sum: DecimalOpExercise = { id: 'dec-op-1', kind: 'decimal-op', skill: 'dec:add:2', difficulty: 3, op: 'add', places: 2, left: 125, right: 250, answer: 375 }

  it('1,25 + 2,5: the commas are shown one under the other; 3 and 75 in the two boxes are correct', () => {
    const onAnswered = vi.fn()
    render(<DecimalOpView exercise={sum} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('25')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    fireEvent.change(box('Parte entera del resultado'), { target: { value: '3' } })
    fireEvent.change(box('Parte decimal del resultado'), { target: { value: '75' } })
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong decimal part is not correct', () => {
    const onAnswered = vi.fn()
    render(<DecimalOpView exercise={sum} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('Parte entera del resultado'), { target: { value: '3' } })
    fireEvent.change(box('Parte decimal del resultado'), { target: { value: '7' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('a subtraction with décimas: one box for the tenth', () => {
    const diff: DecimalOpExercise = { id: 'dec-op-2', kind: 'decimal-op', skill: 'dec:sub:1', difficulty: 3, op: 'sub', places: 1, left: 430, right: 180, answer: 250 }
    const onAnswered = vi.fn()
    render(<DecimalOpView exercise={diff} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(box('Parte entera del resultado'), { target: { value: '2' } })
    fireEvent.change(box('Parte decimal del resultado'), { target: { value: '5' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
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
