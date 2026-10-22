/* The fraction and geometry views: what the child sees and what they send. NumberInput (handwriting) is covered by its own
   tests; here it is a plain box so the views' logic is what gets tested. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, genFractionOf, genFractionRead, genFractionEqual, genGeometry, genFractionName, genAngleTap } from '@/engine'
import { correctAnswer } from '@/engine/__tests__/helpers'
import type {
  AngleTapExercise, FractionEqualExercise, FractionOfExercise, FractionReadExercise, FractionShadeExercise, PerimeterExercise, ShapeChoiceExercise,
} from '@/types'
import AngleTapView from './AngleTapView'
import FigureNumberView from './FigureNumberView'
import FractionEqualView from './FractionEqualView'
import FractionOfView from './FractionOfView'
import FractionReadView from './FractionReadView'
import FractionShadeView from './FractionShadeView'
import ShapeChoiceView from './ShapeChoiceView'

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

describe('ShapeChoiceView', () => {
  it('the option tapped is sent and graded; the right one is correct', () => {
    const ex: ShapeChoiceExercise = genFractionName(createRng(3), 4)
    const onAnswered = vi.fn()
    render(<ShapeChoiceView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.question)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.options[ex.answer] }))
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong option is not correct', () => {
    const ex = genGeometry('poly:name', createRng(6))
    if (ex.kind !== 'shape-choice') throw new Error('expected shape-choice')
    const onAnswered = vi.fn()
    render(<ShapeChoiceView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const wrong = ex.options.find((_, i) => i !== ex.answer) as string
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })
})

describe('FractionShadeView', () => {
  it('tapping the parts colours them; the right number of parts is correct', () => {
    const shade: FractionShadeExercise = {
      kind: 'fraction-shade', id: 'fraction-shade:3/4:test', skill: 'frac:shade:4', difficulty: 1,
      numerator: 3, denominator: 4,
      figure: { type: 'fraction', shape: 'rect', weights: [1, 1, 1, 1], colored: [], axis: 'x' },
    }
    const onAnswered = vi.fn()
    render(<FractionShadeView exercise={shade} onAnswered={onAnswered} showFeedback={false} />)
    const parts = screen.getAllByRole('button', { name: /Parte/ })
    expect(parts).toHaveLength(4)
    fireEvent.click(parts[0])
    expect(parts[0].getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(parts[0])
    expect(parts[0].getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(parts[0]); fireEvent.click(parts[1]); fireEvent.click(parts[2])
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('FractionReadView', () => {
  it('the numerator and the denominator are written and graded together', () => {
    const ex: FractionReadExercise = genFractionRead(createRng(4), 6)
    const onAnswered = vi.fn()
    render(<FractionReadView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Número de arriba' }), { target: { value: String(ex.numerator + 1) } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Número de abajo' }), { target: { value: String(ex.denominator) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('the right fraction is correct', () => {
    const ex = genFractionRead(createRng(8), 3)
    const onAnswered = vi.fn()
    render(<FractionReadView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Número de arriba' }), { target: { value: String(ex.numerator) } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Número de abajo' }), { target: { value: String(ex.denominator) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('FractionOfView', () => {
  it('drawing mode: the groups asked for are the coloured ones, and the count is graded', () => {
    const ex: FractionOfExercise = genFractionOf(createRng(5), 4, 'drawing', '🍬')
    const onAnswered = vi.fn()
    const { container } = render(<FractionOfView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(container.querySelectorAll('[data-group="on"]')).toHaveLength(ex.numerator)
    expect(container.querySelectorAll('[data-group]')).toHaveLength(ex.denominator)
    fireEvent.change(screen.getByRole('textbox', { name: 'Cuántos son' }), { target: { value: String(ex.answer) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('numbers mode: the calculation alone', () => {
    const ex = genFractionOf(createRng(12), 3, 'numbers', '🌸')
    const onAnswered = vi.fn()
    const { container } = render(<FractionOfView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(container.querySelector('[data-mode="numbers"]')).toBeTruthy()
    fireEvent.change(screen.getByRole('textbox', { name: 'Cuántos son' }), { target: { value: String(ex.total) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: false, errorType: 'fraction-count' })
  })
})

describe('FractionEqualView', () => {
  it('tapping the figures that are not in equal parts is correct', () => {
    const ex: FractionEqualExercise = genFractionEqual(createRng(9))
    const onAnswered = vi.fn()
    render(<FractionEqualView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    for (const i of ex.unequal) fireEvent.click(screen.getByRole('button', { name: `Figura ${i + 1}` }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('AngleTapView', () => {
  it('tapping the right corners is correct', () => {
    const ex: AngleTapExercise = genAngleTap(createRng(7))
    const onAnswered = vi.fn()
    render(<AngleTapView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    for (const i of ex.rightCorners) fireEvent.click(screen.getByRole('button', { name: `Esquina ${i + 1}` }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(correctAnswer(ex)).toEqual({ type: 'marks', marked: ex.rightCorners })
  })
})

describe('FigureNumberView', () => {
  it('the perimeter is written and graded', () => {
    const ex: PerimeterExercise = genGeometry('perimeter', createRng(10), 'drawing') as PerimeterExercise
    const onAnswered = vi.fn()
    render(<FigureNumberView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Medida del contorno' }), { target: { value: String(ex.answer) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('the story problem shows the text and the number of sides asks for a count', () => {
    const story = genGeometry('perimeter', createRng(11), 'story') as PerimeterExercise
    render(<FigureNumberView exercise={story} onAnswered={() => {}} showFeedback={false} />)
    expect(screen.getByText(/metros de valla/)).toBeTruthy()
  })
})
