/* «Inténtalo otra vez», view by view (P2, P4): each view starts with what the child wrote (initialAnswer) and marks in soft
   red the boxes the corrector found wrong (wrongColumns) or, when it names none, the ones that differ from the right
   answer. A mark goes as soon as the child changes that box. The answer the child sends goes out with the outcome, so the
   screen around the view can give it back. NumberInput is a plain box here (aria-invalid = status 'wrong'). */
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  createRng, genBarProblem, genCheckCalc, genErrorHunt, genFractionAdd, genFractionEqual, genFractionOf, genFractionRead, makeColumnAdd,
  makeColumnSub, makeLongMul,
} from '@/engine'
import { makeMental } from '@/engine/calc'
import { makeConvert as makeMeasureConvert, makeEstimate, makeUnit, THINGS, UNITS } from '@/engine/measure'
import { makeChange, makeCompare as makeMoneyCompare, makePay, makeRecognise, SHOP } from '@/engine/money'
import { makeCompare, makeLineTick, makeOrder, makePlaceValue, makeRound } from '@/engine/numeric'
import type {
  Answer, DecimalExercise, DecimalOpExercise, EquationExercise, ExerciseViewProps, FractionShadeExercise, WordProblemExercise,
} from '@/types'
import BarProblemView from '@/activities/views/BarProblemView'
import CheckCalcView from '@/activities/views/CheckCalcView'
import ColumnView from '@/activities/views/ColumnView'
import CompareView from '@/activities/views/CompareView'
import DecimalOpView from '@/activities/views/DecimalOpView'
import DecimalView from '@/activities/views/DecimalView'
import EquationView from '@/activities/views/EquationView'
import ErrorHuntView from '@/activities/views/ErrorHuntView'
import FractionAddView from '@/activities/views/FractionAddView'
import FractionEqualView from '@/activities/views/FractionEqualView'
import FractionOfView from '@/activities/views/FractionOfView'
import FractionReadView from '@/activities/views/FractionReadView'
import FractionShadeView from '@/activities/views/FractionShadeView'
import LongMulView from '@/activities/views/LongMulView'
import MeasureView from '@/activities/views/MeasureView'
import MentalView from '@/activities/views/MentalView'
import MoneyView from '@/activities/views/MoneyView'
import NumberLineView from '@/activities/views/NumberLineView'
import OrderView from '@/activities/views/OrderView'
import PlaceValueView from '@/activities/views/PlaceValueView'
import RoundView from '@/activities/views/RoundView'
import SubtractionView from '@/activities/views/SubtractionView'
import WordProblemView from '@/activities/views/WordProblemView'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { digitsOf, wrongEntries } from './TrySlotRetry'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/ink', async () => {
  const actual = await vi.importActual<typeof import('@/ink')>('@/ink')
  return {
    ...actual,
    NumberInput: (p: {
      value: number | null
      onChange: (v: number | null) => void
      onSubmit: (v: number | null) => void
      ariaLabel?: string
      status?: string
      disabled?: boolean
    }) => (
      <input
        aria-label={p.ariaLabel}
        aria-invalid={p.status === 'wrong' || undefined}
        value={p.value ?? ''}
        disabled={p.disabled}
        onChange={(e) => p.onChange(e.target.value === '' ? null : Number(e.target.value))}
        onKeyDown={(e) => { if (e.key === 'Enter') p.onSubmit(p.value) }}
      />
    ),
  }
})

type View = (props: ExerciseViewProps) => ReactElement | null
const show = (V: View, props: Omit<ExerciseViewProps, 'onAnswered'> & { onAnswered?: ExerciseViewProps['onAnswered'] }) =>
  render(<V onAnswered={vi.fn()} showFeedback={false} {...props} />)

const box = (name: RegExp | string) => screen.getByRole('textbox', { name }) as HTMLInputElement
const invalid = (el: HTMLElement) => el.getAttribute('aria-invalid') === 'true'
const marked = (el: HTMLElement) => /wrongPick/.test(el.className)
const type = (name: RegExp | string, value: string) => fireEvent.change(box(name), { target: { value } })

describe('TrySlotRetry helpers', () => {
  it('compares boxes one by one and splits a number into units-first boxes', () => {
    expect(wrongEntries([3, 9, 7], [3, 5, 7])).toEqual([1])
    expect(wrongEntries([3, null], [3, 5])).toEqual([1])
    expect(digitsOf(245, 4)).toEqual([5, 4, 2, null])
    expect(digitsOf(null, 2)).toEqual([null, null])
  })
})

describe('the outcome carries the answer the child sent', () => {
  it('RoundView: outcome.answer is what she wrote', () => {
    const onAnswered = vi.fn()
    show(RoundView, { exercise: makeRound(347, 10), onAnswered })
    type('Número redondeado', '340')
    fireEvent.keyDown(box('Número redondeado'), { key: 'Enter' })
    expect(onAnswered.mock.calls[0][0].answer).toEqual({ type: 'number', value: 340 })
  })
})

describe('ColumnView and SubtractionView', () => {
  it('a sum starts with the digits written; the corrector\'s wrong column is marked until it changes', () => {
    const ex = makeColumnAdd([368, 257])
    const initialAnswer: Answer = { type: 'digits', digits: [5, 1, 6], carries: [null, 1, null] }
    show(ColumnView, { exercise: ex, initialAnswer, wrongColumns: [1] })
    const tens = screen.getByRole('textbox', { name: /^decenas del resultado/ })
    expect(invalid(tens)).toBe(true)
    expect(invalid(screen.getByRole('textbox', { name: /^unidades del resultado/ }))).toBe(false)
    expect(tens.textContent).toContain('1')
    expect(screen.getByRole('textbox', { name: /llevada de decenas/ }).textContent).toContain('1')
    act(() => { fireEvent.keyDown(tens, { key: '2' }) })
    expect(invalid(screen.getByRole('textbox', { name: /^decenas del resultado/ }))).toBe(false)
  })

  it('a subtraction with no columns from the corrector compares digit by digit with the answer', () => {
    // 503 − 128 = 375; the child wrote 485.
    show(SubtractionView, { exercise: makeColumnSub(503, 128), initialAnswer: { type: 'digits', digits: [5, 8, 4], method: 'borrow' } })
    expect(invalid(screen.getByRole('textbox', { name: /^unidades del resultado/ }))).toBe(false)
    expect(invalid(screen.getByRole('textbox', { name: /^decenas del resultado/ }))).toBe(true)
    expect(invalid(screen.getByRole('textbox', { name: /^centenas del resultado/ }))).toBe(true)
  })
})

describe('LongMulView', () => {
  it('starts with the rows and the total written; the wrong columns of the total are marked', () => {
    // 23 × 14 = 322; the child wrote the rows right and the total 312.
    const initialAnswer: Answer = { type: 'long-mul', rows: [[2, 9, null], [0, 3, 2]], total: [2, 1, 3] }
    show(LongMulView, { exercise: makeLongMul(23, 14), initialAnswer })
    expect(screen.getByRole('textbox', { name: /parcial 1, decenas/ }).textContent).toContain('9')
    expect(invalid(screen.getByRole('textbox', { name: /^decenas del resultado/ }))).toBe(true)
    expect(invalid(screen.getByRole('textbox', { name: /^unidades del resultado/ }))).toBe(false)
  })
})

describe('CompareView', () => {
  it('starts with the sign picked, marked; another sign takes the mark away', () => {
    show(CompareView, { exercise: makeCompare(4325, 4235), initialAnswer: { type: 'sign', sign: '<' } })
    const less = screen.getByRole('button', { name: 'menor que' })
    expect(less.getAttribute('aria-pressed')).toBe('true')
    expect(marked(less)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'mayor que' }))
    expect(marked(screen.getByRole('button', { name: 'menor que' }))).toBe(false)
  })
})

describe('OrderView', () => {
  it('starts with the numbers written; the corrector\'s wrong boxes are marked', () => {
    const ex = makeOrder([300, 120, 450], 'asc')
    show(OrderView, { exercise: ex, initialAnswer: { type: 'numbers', values: [120, 450, 300] }, wrongColumns: [1, 2] })
    expect(box('1.º número').value).toBe('120')
    expect(invalid(box('1.º número'))).toBe(false)
    expect(invalid(box('2.º número'))).toBe(true)
    expect(invalid(box('3.º número'))).toBe(true)
    type('2.º número', '300')
    expect(invalid(box('2.º número'))).toBe(false)
  })
})

describe('the views with one number box', () => {
  it('RoundView, MentalView, NumberLineView and EquationView start with the number, marked until it changes', () => {
    const cases: [View, ExerciseViewProps['exercise'], string, string][] = [
      [RoundView, makeRound(347, 10), 'Número redondeado', '340'],
      [MentalView, makeMental('suma', 40, 30, 70, '40 + 30'), 'Respuesta de cabeza', '60'],
      [NumberLineView, makeLineTick(10, [10, 20, 30, 40, 50], 2), 'Marca que falta', '35'],
      [EquationView, { id: 'eq', kind: 'equation', skill: 'eq:flex', difficulty: 2, left: [5, '+', 3], right: [null, '+', 6], answer: 2 } as EquationExercise, 'Número que falta', '3'],
    ]
    for (const [V, exercise, label, wrong] of cases) {
      const { unmount } = show(V, { exercise, initialAnswer: { type: 'number', value: Number(wrong) } })
      expect(box(label).value).toBe(wrong)
      expect(invalid(box(label))).toBe(true)
      type(label, '1')
      expect(invalid(box(label))).toBe(false)
      unmount()
    }
  })

  it('a right number given back (a try again for another reason) is not marked', () => {
    show(RoundView, { exercise: makeRound(347, 10), initialAnswer: { type: 'number', value: 350 } })
    expect(invalid(box('Número redondeado'))).toBe(false)
  })
})

describe('EquationView (igual o distinto)', () => {
  it('starts with the sign picked, marked', () => {
    const ex: EquationExercise = { id: 'eq-s', kind: 'equation', skill: 'eq:same', difficulty: 2, mode: 'same', left: [5, '+', 3], right: [4, '+', 4], answer: '=' }
    show(EquationView, { exercise: ex, initialAnswer: { type: 'sign', sign: '≠' } })
    expect(marked(screen.getByRole('button', { name: 'distinto de' }))).toBe(true)
    expect(marked(screen.getByRole('button', { name: 'igual a' }))).toBe(false)
  })
})

describe('PlaceValueView', () => {
  it('expanded: the parts written come back; a wrong part is marked (a digit alone under its place is right)', () => {
    const ex = makePlaceValue(4325, 'expanded')
    show(PlaceValueView, { exercise: ex, initialAnswer: { type: 'numbers', values: [4000, 3, 200, 5] } })
    expect(box('Valor de las centenas').value).toBe('3')
    expect(invalid(box('Valor de los millares'))).toBe(false)
    expect(invalid(box('Valor de las centenas'))).toBe(false)
    expect(invalid(box('Valor de las decenas'))).toBe(true)
    expect(invalid(box('Valor de las unidades'))).toBe(false)
  })

  it('words: the number written comes back, marked', () => {
    show(PlaceValueView, { exercise: makePlaceValue(4325, 'words'), initialAnswer: { type: 'number', value: 4352 } })
    expect(box('Número en cifras').value).toBe('4352')
    expect(invalid(box('Número en cifras'))).toBe(true)
  })
})

describe('CheckCalcView', () => {
  it('starts with the verdict and the check written; the wrong ones are marked', () => {
    const ex = genCheckCalc('sub', createRng(9), false)
    show(CheckCalcView, { exercise: ex, initialAnswer: { type: 'verdict', ok: true, value: ex.answer + 1 } })
    const yes = screen.getByRole('button', { name: /Sí, está bien/ })
    expect(yes.getAttribute('aria-pressed')).toBe('true')
    expect(marked(yes)).toBe(true)
    expect(box('Resultado de la comprobación').value).toBe(String(ex.answer + 1))
    expect(invalid(box('Resultado de la comprobación'))).toBe(true)
  })
})

describe('ErrorHuntView', () => {
  it('starts with «Hay un error», the column and the result; a right column is not marked, a wrong result is', () => {
    const ex = genErrorHunt('sub', createRng(31), true)
    const column = ex.wrongColumn as number
    show(ErrorHuntView, { exercise: ex, initialAnswer: { type: 'hunt', ok: false, column, value: ex.answer + 10 }, wrongColumns: [column] })
    expect(screen.getByRole('button', { name: /Hay un error/ }).getAttribute('aria-pressed')).toBe('true')
    const picked = screen.getAllByRole('button', { pressed: true }).find((b) => /columna de/.test(b.getAttribute('aria-label') ?? ''))
    expect(picked).toBeTruthy()
    expect(marked(picked!)).toBe(false)
    expect(invalid(box('Resultado correcto'))).toBe(true)
  })

  it('a wrong verdict is marked', () => {
    const ex = genErrorHunt('add', createRng(5), true)
    show(ErrorHuntView, { exercise: ex, initialAnswer: { type: 'hunt', ok: true, column: null, value: null } })
    expect(marked(screen.getByRole('button', { name: /Está bien/ }))).toBe(true)
  })
})

describe('WordProblemView', () => {
  const story: WordProblemExercise = {
    id: 'wp-r', kind: 'word-problem', skill: 'word:add:3' as WordProblemExercise['skill'], difficulty: 2,
    text: 'Ana tiene 3 estrellas y le dan 2 más. ¿Cuántas tiene ahora?', op: 'add', operands: [3, 2], answer: 5, unit: 'estrellas',
  }
  it('starts with the number written (and the operation already found), marked', () => {
    show(WordProblemView as View, { exercise: story, initialAnswer: { type: 'number', value: 6 }, chooseOp: true } as ExerciseViewProps)
    expect(box('Respuesta').value).toBe('6')
    expect(box('Respuesta').disabled).toBe(false)
    expect(invalid(box('Respuesta'))).toBe(true)
  })

  it('has no «Escuchar» of its own, also with the voice on (the common one of the screen reads it)', () => {
    const voiceOn = { ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, voice: true } }
    render(<ActivityHostProvider value={voiceOn}><WordProblemView exercise={story} onAnswered={vi.fn()} showFeedback={false} /></ActivityHostProvider>)
    expect(screen.queryByRole('button', { name: /Leer en voz alta|Escuchar/ })).toBeNull()
    expect(screen.queryByText(/Escuchar/)).toBeNull()
  })
})

describe('BarProblemView', () => {
  it('starts with the operations and the results, on the screen of the step the corrector found wrong', () => {
    const ex = genBarProblem('add', createRng(3), false)
    const last = ex.steps.length - 1
    show(BarProblemView, {
      exercise: ex,
      initialAnswer: { type: 'bar', placed: ex.bar.map(() => null), ops: ex.steps.map((s) => s.op), results: ex.steps.map((s, k) => (k === last ? s.result + 1 : s.result)) },
    })
    expect(box('Respuesta').value).toBe(String(ex.answer + 1))
    expect(invalid(box('Respuesta'))).toBe(true)
  })

  it('has no «Escuchar» of its own, also with the voice on', () => {
    const voiceOn = { ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, voice: true } }
    render(<ActivityHostProvider value={voiceOn}><BarProblemView exercise={genBarProblem('add', createRng(3), true)} onAnswered={vi.fn()} showFeedback={false} /></ActivityHostProvider>)
    expect(screen.queryByText(/Escuchar/)).toBeNull()
  })

  it('with the drawing: the numbers go back on the bar and a piece with another number is marked', () => {
    const ex = genBarProblem('add', createRng(3), true)
    const known = ex.bar.flatMap((b, i) => (b.value === null ? [] : [i]))
    // The two given numbers swapped on the bar (when they differ), the steps right.
    const placed = ex.bar.map((b) => b.value)
    const [a, b] = known
    ;[placed[a], placed[b]] = [placed[b], placed[a]]
    show(BarProblemView, { exercise: ex, initialAnswer: { type: 'bar', placed, ops: ex.steps.map((s) => s.op), results: ex.steps.map(() => 0) } })
    const swapped = ex.bar[a].value !== ex.bar[b].value
    const slots = known.map((i) => screen.getByRole('button', { name: new RegExp(`^${ex.bar[i].name}: `) }))
    expect(slots.every((el) => !/pon aquí/.test(el.getAttribute('aria-label') ?? ''))).toBe(true)
    expect(slots.some(marked)).toBe(swapped)
  })
})

describe('MoneyView', () => {
  it('recognise: the value tapped comes back, marked', () => {
    show(MoneyView, { exercise: makeRecognise(50, [20, 50, 100]), initialAnswer: { type: 'option', value: '20' } })
    const picked = screen.getAllByRole('button', { pressed: true })[0]
    expect(marked(picked)).toBe(true)
  })

  it('change: the euros and céntimos written come back; only the wrong box is marked', () => {
    // 3,40 € paid with 5 €: the change is 1,60 €. The child wrote 1,50.
    show(MoneyView, { exercise: makeChange(340, 500, 'un libro'), initialAnswer: { type: 'numbers', values: [1, 50] } })
    expect(box('Euros').value).toBe('1')
    expect(invalid(box('Euros'))).toBe(false)
    expect(invalid(box('Céntimos'))).toBe(true)
  })

  it('pay: the coins come back to the tray, marked', () => {
    show(MoneyView, { exercise: makePay(120), initialAnswer: { type: 'pieces', pieces: [100, 10] } })
    expect(screen.getAllByRole('button', { name: /^Quitar / })).toHaveLength(2)
    expect(marked(screen.getByRole('group', { name: 'Bandeja' }))).toBe(true)
  })

  it('compare: the item tapped comes back, marked', () => {
    const ex = makeMoneyCompare(SHOP.slice(0, 3), 'more')
    const other = SHOP.slice(0, 3).find((it) => it.name !== ex.answer)!.name
    show(MoneyView, { exercise: ex, initialAnswer: { type: 'option', value: other } })
    expect(marked(screen.getByRole('button', { name: new RegExp(other) }))).toBe(true)
  })
})

describe('MeasureView', () => {
  it('unit: the unit tapped comes back, marked', () => {
    const thing = THINGS[0]
    const ex = makeUnit(thing, UNITS.length.map((unit) => ({ value: thing.value, unit })))
    const wrong = ex.options.find((o) => o.unit !== ex.answer)!
    show(MeasureView, { exercise: ex, initialAnswer: { type: 'option', value: wrong.unit } })
    expect(marked(screen.getByRole('button', { pressed: true }))).toBe(true)
  })

  it('convert: the number comes back, marked', () => {
    const ex = makeMeasureConvert('length', '1 m', 'cm', 100, null, false)
    show(MeasureView, { exercise: ex, initialAnswer: { type: 'number', value: 10 } })
    expect(box(/Cantidad en/).value).toBe('10')
    expect(invalid(box(/Cantidad en/))).toBe(true)
  })

  it('estimate: the verdict comes back, marked', () => {
    const ex = makeEstimate(THINGS[0], 'm', false)
    show(MeasureView, { exercise: ex, initialAnswer: { type: 'verdict', ok: true, value: null } })
    expect(marked(screen.getByRole('button', { name: /Sí, es razonable/ }))).toBe(true)
  })
})

describe('the fraction views', () => {
  it('FractionReadView and FractionAddView: the fraction comes back; only the wrong number is marked', () => {
    const read = genFractionRead(createRng(4), 6)
    const r = show(FractionReadView, { exercise: read, initialAnswer: { type: 'fraction', numerator: read.numerator, denominator: read.denominator + 1 } })
    expect(box('Número de arriba').value).toBe(String(read.numerator))
    expect(invalid(box('Número de arriba'))).toBe(false)
    expect(invalid(box('Número de abajo'))).toBe(true)
    r.unmount()
    const add = genFractionAdd(createRng(2), 'add', 'numbers')
    show(FractionAddView, { exercise: add, initialAnswer: { type: 'fraction', numerator: add.answer + 1, denominator: add.denominator } })
    expect(invalid(box('Número de arriba'))).toBe(true)
    expect(invalid(box('Número de abajo'))).toBe(false)
  })

  it('FractionOfView: the number comes back, marked', () => {
    const ex = genFractionOf(createRng(5), 4, 'numbers', '🍬')
    show(FractionOfView, { exercise: ex, initialAnswer: { type: 'number', value: ex.answer + 1 } })
    expect(invalid(screen.getByRole('textbox'))).toBe(true)
  })

  it('FractionShadeView: the parts coloured come back and the figure is marked until they change', () => {
    const ex: FractionShadeExercise = {
      id: 'fs', kind: 'fraction-shade', skill: 'frac:shade' as FractionShadeExercise['skill'], difficulty: 1, numerator: 1, denominator: 4,
      figure: { type: 'fraction', shape: 'rect', weights: [1, 1, 1, 1], colored: [], axis: 'x' },
    }
    const { container } = show(FractionShadeView, { exercise: ex, initialAnswer: { type: 'shade', chosen: [0, 1] } })
    expect(container.querySelector('[data-retry-wrong]')).not.toBeNull()
  })

  it('FractionEqualView: a figure tapped that is split in equal parts is marked', () => {
    const ex = genFractionEqual(createRng(9))
    const equal = ex.figures.findIndex((_, i) => !ex.unequal.includes(i))
    show(FractionEqualView, { exercise: ex, initialAnswer: { type: 'marks', marked: [equal, ex.unequal[0]] } })
    expect(marked(screen.getByRole('button', { name: `Figura ${equal + 1}` }))).toBe(true)
    expect(marked(screen.getByRole('button', { name: `Figura ${ex.unequal[0] + 1}` }))).toBe(false)
  })
})

describe('the decimal views', () => {
  it('DecimalView: the boxes come back; only the wrong one is marked (an empty centésimas box is 0)', () => {
    const ex: DecimalExercise = { id: 'dec-r', kind: 'decimal', skill: 'dec:read:2', difficulty: 3, mode: 'read', places: 2, value: 125, answer: 125 }
    show(DecimalView, { exercise: ex, initialAnswer: { type: 'numbers', values: [1, 3, 5] } })
    expect(box('Parte entera').value).toBe('1')
    expect(invalid(box('Parte entera'))).toBe(false)
    expect(invalid(box('Décimas'))).toBe(true)
    expect(invalid(box('Centésimas'))).toBe(false)
  })

  it('DecimalView compare: the sign comes back, marked', () => {
    const ex: DecimalExercise = { id: 'dec-c', kind: 'decimal', skill: 'dec:compare', difficulty: 3, mode: 'compare', places: 1, value: 40, other: 30, answer: '>' }
    show(DecimalView, { exercise: ex, initialAnswer: { type: 'sign', sign: '<' } })
    expect(marked(screen.getByRole('button', { name: 'menor que' }))).toBe(true)
  })

  it('DecimalOpView: the digits come back in their boxes; the wrong ones are marked', () => {
    // 1,25 + 2,50 = 3,75; the child wrote 3,85.
    const ex: DecimalOpExercise = { id: 'dec-op-1', kind: 'decimal-op', skill: 'dec:add:2', difficulty: 3, op: 'add', places: 2, left: 125, right: 250, answer: 375 }
    show(DecimalOpView, { exercise: ex, initialAnswer: { type: 'numbers', values: [3, 8, 5] } })
    expect(screen.getByRole('textbox', { name: /unidades del resultado/ }).textContent).toContain('3')
    expect(invalid(screen.getByRole('textbox', { name: /unidades del resultado/ }))).toBe(false)
    expect(invalid(screen.getByRole('textbox', { name: /décimas del resultado/ }))).toBe(true)
    expect(invalid(screen.getByRole('textbox', { name: /centésimas del resultado/ }))).toBe(false)
  })
})
