/* The money and measure views: what the child sees and what they send. NumberInput (handwriting) is covered by its own
   tests; here it is a plain box, so the views' logic is what gets tested. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, buildMeasure, THINGS, UNITS } from '@/engine'
import { makeAdd, makeBudget, makeChange, makeCompare, makeConvert as makeMoneyConvert, makePay, makeRecognise, SHOP } from '@/engine/money'
import { makeConvert, makeEstimate, makeRuler, makeUnit } from '@/engine/measure'
import MeasureView from './MeasureView'
import MoneyView from './MoneyView'

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

describe('MoneyView', () => {
  it('recognise: the child taps the value of the piece and checks it', () => {
    const onAnswered = vi.fn()
    const ex = makeRecognise(200, [5, 200, 20, 1000])
    render(<MoneyView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: '2 €' }))
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('pay: tapping pieces builds the tray; quitar undoes; the exact tray is correct and a short one is not', () => {
    const onAnswered = vi.fn()
    render(<MoneyView exercise={makePay(350)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByLabelText('Precio: 3,50 €')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 2 €' }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 1 €' }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 50 céntimos' }))
    // The tray shows the pieces, never a running total.
    expect(screen.queryByText(/3,50 €.*paga/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar 50 céntimos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 50 céntimos' }))
    fireEvent.click(screen.getByRole('button', { name: '↶ Quitar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 50 céntimos' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('pay: a tray one coin short is reported as short, without a running total', () => {
    const onAnswered = vi.fn()
    render(<MoneyView exercise={makePay(350)} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 2 €' }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 1 €' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
    expect(onAnswered.mock.calls[0][0].check.feedback).toContain('Te falta')
  })

  it('change: the euros and the céntimos are two boxes that must both be filled', () => {
    const onAnswered = vi.fn()
    render(<MoneyView exercise={makeChange(340, 500, 'un cuaderno')} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(/Paga con 5 €/)).toBeTruthy()
    expect(comprobar().hasAttribute('disabled')).toBe(true)
    fireEvent.change(box('Euros'), { target: { value: '1' } })
    expect(comprobar().hasAttribute('disabled')).toBe(true)
    fireEvent.change(box('Céntimos'), { target: { value: '60' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('add: the cards show the prices and the total is typed in euros and céntimos', () => {
    const onAnswered = vi.fn()
    const items = [SHOP[0], SHOP[1]]
    render(<MoneyView exercise={makeAdd(items, false)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('2,50 €')).toBeTruthy()
    expect(screen.getByText('1,35 €')).toBeTruthy()
    fireEvent.change(box('Euros'), { target: { value: '3' } })
    fireEvent.change(box('Céntimos'), { target: { value: '85' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('compare: the child taps the dearer one', () => {
    const onAnswered = vi.fn()
    const items = [SHOP[2], SHOP[6]]
    render(<MoneyView exercise={makeCompare(items, 'more')} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: /una pelota/ }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('convert: céntimos from euros (one box) and euros plus céntimos from céntimos (two boxes)', () => {
    const first = vi.fn()
    const { unmount } = render(<MoneyView exercise={makeMoneyConvert('to-cents', 235)} onAnswered={first} showFeedback={false} />)
    fireEvent.change(box('Céntimos'), { target: { value: '235' } })
    fireEvent.click(comprobar())
    expect(first.mock.calls[0][0].check.correct).toBe(true)
    unmount()
    const second = vi.fn()
    render(<MoneyView exercise={makeMoneyConvert('to-euros', 350)} onAnswered={second} showFeedback={false} />)
    fireEvent.change(box('Euros'), { target: { value: '3' } })
    fireEvent.change(box('Céntimos'), { target: { value: '50' } })
    fireEvent.click(comprobar())
    expect(second.mock.calls[0][0].check.correct).toBe(true)
  })

  it('budget: «¿Te llega?» is answered with Sí or No; the right one is correct', () => {
    const onAnswered = vi.fn()
    // 2,50 € + 1,35 € = 3,85 €, with 5 € it is enough.
    render(<MoneyView exercise={makeBudget('enough', 500, [SHOP[0], SHOP[1]])} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('¿Te llega?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('budget: «¿Te llega?» answered No when the total is more than the money', () => {
    const onAnswered = vi.fn()
    render(<MoneyView exercise={makeBudget('enough', 300, [SHOP[0], SHOP[1]])} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('budget: «¿Cuánto te falta?» is typed in euros and céntimos; the difference is correct', () => {
    const onAnswered = vi.fn()
    // 2,50 € + 1,35 € = 3,85 €; with 2 € we are short by 1,85 €.
    render(<MoneyView exercise={makeBudget('short', 200, [SHOP[0], SHOP[1]])} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('¿Cuánto te falta?')).toBeTruthy()
    fireEvent.change(box('Euros'), { target: { value: '1' } })
    fireEvent.change(box('Céntimos'), { target: { value: '85' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('MeasureView', () => {
  it('unit: the child taps the unit of the object (a wrong unit is reported as wrong)', () => {
    const onAnswered = vi.fn()
    const thing = THINGS[0]
    const ex = makeUnit(thing, UNITS.length.map((unit) => ({ value: thing.value, unit })))
    render(<MeasureView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getAllByText(/un lápiz/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: '15 m' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('unit: the right unit is correct', () => {
    const onAnswered = vi.fn()
    const thing = THINGS[0]
    const ex = makeUnit(thing, UNITS.length.map((unit) => ({ value: thing.value, unit })))
    render(<MeasureView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: '15 cm' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('convert: one box after the given amount', () => {
    const onAnswered = vi.fn()
    render(<MeasureView exercise={makeConvert('length', '1 m', 'cm', 100, null, false, 100, 1)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('1 m')).toBeTruthy()
    fireEvent.change(box('Cantidad en cm'), { target: { value: '100' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('ruler: the object starts at 4 and ends at 12; reading the end alone is not the length', () => {
    const onAnswered = vi.fn()
    const { unmount } = render(<MeasureView exercise={makeRuler(4, 12)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByRole('img', { name: /empieza en 4 y acaba en 12/ })).toBeTruthy()
    fireEvent.change(box('Centímetros'), { target: { value: '12' } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
    unmount()
    const second = vi.fn()
    render(<MeasureView exercise={makeRuler(4, 12)} onAnswered={second} showFeedback={false} />)
    fireEvent.change(box('Centímetros'), { target: { value: '8' } })
    fireEvent.click(comprobar())
    expect(second.mock.calls[0][0].check.correct).toBe(true)
  })

  it('add: the story sentence and the total in the unit of the answer', () => {
    const onAnswered = vi.fn()
    const ex = buildMeasure('add', 'length', createRng(5), new Set())
    if (ex.kind !== 'measure' || ex.mode !== 'add') throw new Error('mode')
    render(<MeasureView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.text)).toBeTruthy()
    fireEvent.change(box(`Total en ${ex.unit}`), { target: { value: String(ex.answer) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('estimate: the child says whether the claim is reasonable', () => {
    const onAnswered = vi.fn()
    const sobre = THINGS.find((t) => t.object.startsWith('un sobre'))!
    render(<MeasureView exercise={makeEstimate(sobre, 'kg', false)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(/Un sobre de galletas pesa 200 kg\./)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'No, no es razonable' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
