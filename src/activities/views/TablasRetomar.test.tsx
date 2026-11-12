/* «Inténtalo otra vez» in the table views: each one starts with what she wrote, marks it as wrong only while she has not
   changed it, and never marks a right answer. The worked example of the family is never the exercise. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeDoubleChain, makeFactDiv, makeFactFamily, makeFactMul, makeMissingFactor, makeMulParts, makeSkipCount } from '@/engine'
import type { Answer, Exercise } from '@/types'
import FactView from './FactView'
import MissingFactorView from './MissingFactorView'
import SkipCountView from './SkipCountView'
import DoubleChainView from './DoubleChainView'
import FactFamilyView, { familyExample } from './FactFamilyView'
import MulPartsView from './MulPartsView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

type ViewProps = { exercise: Exercise; onAnswered: () => void; initialAnswer?: Answer; wrongColumns?: number[] }
const marked = () => screen.getAllByRole('textbox').filter((b) => b.getAttribute('aria-invalid') === 'true')
const valueOf = (b: HTMLElement) => b.closest('[data-value]')?.getAttribute('data-value') ?? ''
const press = (b: HTMLElement, k: string) => act(() => { fireEvent.keyDown(b, { key: k }) })
const as = (v: unknown) => v as ComponentType<ViewProps>

interface Case { name: string; View: ComponentType<ViewProps>; ex: Exercise; wrong: Answer; right: Answer; shown: string }
const cases: Case[] = [
  { name: 'FactView', View: as(FactView), ex: makeFactMul(6, 7), wrong: { type: 'number', value: 41 }, right: { type: 'number', value: 42 }, shown: '1' },
  { name: 'FactView (÷)', View: as(FactView), ex: makeFactDiv(42, 6), wrong: { type: 'number', value: 8 }, right: { type: 'number', value: 7 }, shown: '8' },
  { name: 'MissingFactorView', View: as(MissingFactorView), ex: makeMissingFactor(6, 7, 'b'), wrong: { type: 'number', value: 8 }, right: { type: 'number', value: 7 }, shown: '8' },
  { name: 'SkipCountView', View: as(SkipCountView), ex: makeSkipCount(5, 1, 6, [2]), wrong: { type: 'numbers', values: [16] }, right: { type: 'numbers', values: [15] }, shown: '6' },
  { name: 'DoubleChainView', View: as(DoubleChainView), ex: makeDoubleChain(5, 2), wrong: { type: 'numbers', values: [11] }, right: { type: 'numbers', values: [10] }, shown: '1' },
  { name: 'FactFamilyView', View: as(FactFamilyView), ex: makeFactFamily(2, 5), wrong: { type: 'facts', facts: ['2x5=9'] }, right: { type: 'facts', facts: ['2x5=10'] }, shown: '1' },
  { name: 'MulPartsView', View: as(MulPartsView), ex: makeMulParts(23, 14), wrong: { type: 'numbers', values: [92, 230, 312] }, right: { type: 'numbers', values: [92, 230, 322] }, shown: '2' },
]

describe.each(cases)('$name: «Inténtalo otra vez»', ({ View, ex, wrong, right }) => {
  it('starts with what she wrote and marks it', () => {
    render(<View exercise={ex} onAnswered={vi.fn()} initialAnswer={wrong} />)
    expect(marked().length).toBeGreaterThan(0)
  })

  it('stops marking as soon as she changes it', () => {
    render(<View exercise={ex} onAnswered={vi.fn()} initialAnswer={wrong} />)
    press(marked()[0], '9')
    expect(marked()).toHaveLength(0)
  })

  it('never marks a right answer', () => {
    render(<View exercise={ex} onAnswered={vi.fn()} initialAnswer={right} />)
    expect(screen.queryAllByRole('textbox').filter((b) => b.getAttribute('aria-invalid') === 'true')).toHaveLength(0)
  })

  it('an empty list of wrong columns marks what differs from the right answer', () => {
    render(<View exercise={ex} onAnswered={vi.fn()} initialAnswer={wrong} wrongColumns={[]} />)
    expect(marked().length).toBeGreaterThan(0)
  })
})

describe('the box starts with what she wrote', () => {
  it('shows the value of the previous try', () => {
    render(<FactView exercise={makeFactMul(6, 7)} onAnswered={vi.fn()} initialAnswer={{ type: 'number', value: 41 }} />)
    expect(valueOf(marked()[0])).toBeTruthy()
  })
})

describe('FactFamilyView: the worked example', () => {
  it.each([[3, 4], [4, 3], [2, 3], [3, 2], [2, 5], [5, 7]])('is not the exercise %i, %i', (a, b) => {
    const f = makeFactFamily(a, b)
    const text = familyExample(a, b)
    const mine = [`${f.a} × ${f.b} = ${f.product}`, `${f.b} × ${f.a} = ${f.product}`, `${f.product} ÷ ${f.a} = ${f.b}`, `${f.product} ÷ ${f.b} = ${f.a}`]
    expect(mine.every((m) => text.includes(m))).toBe(false)
  })
})
