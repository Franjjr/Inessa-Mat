/* The numeric and cálculo mental views: what the child sees and what they send. NumberInput (handwriting) is covered
   by its own tests; here it is a plain box so the views' logic is what gets tested. */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { EquationExercise } from '@/types'
import { makeMental } from '@/engine/calc'
import { makeCompare, makeLineJump, makeLineTick, makeOrder, makePlaceValue, makeRound } from '@/engine/numeric'
import CompareView from './CompareView'
import EquationView from './EquationView'
import MentalView from './MentalView'
import NumberLineView from './NumberLineView'
import OrderView from './OrderView'
import PlaceValueView from './PlaceValueView'
import RoundView from './RoundView'

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

const box = (name: RegExp | string) => screen.getByRole('textbox', { name })
const comprobar = () => screen.getByRole('button', { name: /Comprobar/ })

/** A balance written by hand: 5 + 3 = __ + 6 (answer 2). */
const equation = (): EquationExercise => ({
  id: 'equation:5+3=?+6', kind: 'equation', skill: 'eq:flex', difficulty: 2, left: [5, '+', 3], right: [null, '+', 6], answer: 2,
})

describe('CompareView', () => {
  it('taps the sign and checks it: one tap of the right sign is correct', () => {
    const onAnswered = vi.fn()
    render(<CompareView exercise={makeCompare(4325, 4235)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('4 325')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'mayor que' }))
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong sign is not correct, and the child can change it before checking', () => {
    const onAnswered = vi.fn()
    render(<CompareView exercise={makeCompare(4325, 4235)} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'menor que' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('the equal sign is offered for equal numbers', () => {
    const onAnswered = vi.fn()
    render(<CompareView exercise={makeCompare(2000, 2000)} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'igual a' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('PlaceValueView', () => {
  it('expanded form: one box per part, with the place names', () => {
    render(<PlaceValueView exercise={makePlaceValue(4325, 'expanded')} onAnswered={() => {}} showFeedback={false} />)
    expect(box(/Valor de los millares/)).toBeTruthy()
    expect(box(/Valor de las unidades/)).toBeTruthy()
  })

  it('expanded form is correct when every box holds its part (zeros included)', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<PlaceValueView exercise={makePlaceValue(4025, 'expanded')} onAnswered={onAnswered} showFeedback={false} />)
    await user.type(box(/Valor de los millares/), '4000')
    await user.type(box(/Valor de las centenas/), '0')
    await user.type(box(/Valor de las decenas/), '20')
    await user.type(box(/Valor de las unidades/), '5')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('expanded form flags the wrong box', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<PlaceValueView exercise={makePlaceValue(4325, 'expanded')} onAnswered={onAnswered} showFeedback={false} />)
    await user.type(box(/Valor de los millares/), '4000')
    await user.type(box(/Valor de las centenas/), '30')
    await user.type(box(/Valor de las decenas/), '20')
    await user.type(box(/Valor de las unidades/), '5')
    fireEvent.click(comprobar())
    const r = onAnswered.mock.calls[0][0].check
    expect(r.correct).toBe(false)
    expect(r.wrongColumns).toEqual([1])
  })

  it('words mode: the number in words is shown and the digits are the answer', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<PlaceValueView exercise={makePlaceValue(1021, 'words')} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('mil veintiuno')).toBeTruthy()
    await user.type(box('Número en cifras'), '1021')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('blocks mode: shows the blocks and checks the number written', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    const { container } = render(<PlaceValueView exercise={makePlaceValue(2305, 'blocks')} onAnswered={onAnswered} showFeedback={false} />)
    // 2 cuadros de mil, 3 placas, 0 barras, 5 cubitos: the tiles are drawn (aria-hidden), the groups carry the count.
    expect(container.querySelectorAll('[title="2 millares"]').length).toBe(1)
    await user.type(box('Número de los bloques'), '2305')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('blocks mode up to 99 999: the decenas de millar are piles of ten blocks of mil, and the box takes five digits', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    const { container } = render(<PlaceValueView exercise={makePlaceValue(45300, 'blocks', 99999)} onAnswered={onAnswered} showFeedback={false} />)
    // 4 decenas de millar (four piles of ten mil blocks), 5 millares, 3 centenas, no decenas, no unidades.
    expect(container.querySelectorAll('[title="4 decenas de millar"]').length).toBe(1)
    expect(container.querySelectorAll('[title="4 decenas de millar"] > div > span').length).toBe(4)
    expect(screen.getByText('Decenas de millar')).toBeTruthy()
    await user.type(box('Número de los bloques'), '45300')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('OrderView', () => {
  it('writes the numbers from the smallest and is correct in order', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<OrderView exercise={makeOrder([4325, 2870, 5004], 'asc')} onAnswered={onAnswered} showFeedback={false} />)
    await user.type(box(/1\.º número/), '2870')
    await user.type(box(/2\.º número/), '4325')
    await user.type(box(/3\.º número/), '5004')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('RoundView', () => {
  it('shows the number to round and checks the rounded value', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<RoundView exercise={makeRound(3746, 10)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('3 746')).toBeTruthy()
    await user.type(box('Número redondeado'), '3750')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('NumberLineView', () => {
  it('tick mode: the blank mark is the input, the other marks are labels', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<NumberLineView exercise={makeLineTick(100, [3600, 3700, 3800, 3900, 4000], 2)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('3 700')).toBeTruthy()
    expect(screen.queryByText('3 800')).toBeNull()
    await user.type(box('Marca que falta'), '3800')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('jump mode: starts on a point and asks where the child lands', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<NumberLineView exercise={makeLineJump(100, [3500, 3600, 3700, 3800, 3900], 3646, 100)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(/Empiezas en 3 646/)).toBeTruthy()
    await user.type(box('Adónde caes'), '3746')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('MentalView and EquationView', () => {
  it('mental: the prompt is the question and the number is the only input', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<MentalView exercise={makeMental('dobles', 35, 0, 70, '¿Cuánto es el doble de 35?')} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText('¿Cuánto es el doble de 35?')).toBeTruthy()
    await user.type(box('Respuesta de cabeza'), '70')
    fireEvent.keyDown(box('Respuesta de cabeza'), { key: 'Enter' })
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('equation: the blank sits inside the sentence, and the answer closes the balance', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    render(<EquationView exercise={equation()} onAnswered={onAnswered} showFeedback={false} />)
    await user.type(box('Número que falta'), '2')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('equation, same: no blank box; the child taps = or ≠ and checks it', () => {
    const onAnswered = vi.fn()
    const same: EquationExercise = {
      id: 'equation:same:2+3?4+2', kind: 'equation', skill: 'eq:same', difficulty: 2, mode: 'same', left: [2, '+', 3], right: [4, '+', 2], answer: '≠',
    }
    render(<EquationView exercise={same} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'distinto de' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('equation, same: the wrong sign is judged wrong', () => {
    const onAnswered = vi.fn()
    const same: EquationExercise = {
      id: 'equation:same:2+3?4+2', kind: 'equation', skill: 'eq:same', difficulty: 2, mode: 'same', left: [2, '+', 3], right: [4, '+', 2], answer: '≠',
    }
    render(<EquationView exercise={same} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'igual a' }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })
})
