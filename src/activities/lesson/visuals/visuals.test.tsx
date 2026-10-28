import contentSource from '@/types/content.ts?raw'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LessonVisualId } from '@/types'
import { FINAL } from './types'
import { LESSON_VISUALS, LESSON_VISUAL_IDS } from './index'
import { planBorrow } from './subtraction'
import { longDivision } from './division'

/** Sample params for every visual, as Season 1 lessons use them. */
const SAMPLE: Record<LessonVisualId, Record<string, number | string>> = {
  groups: { groups: 4, perGroup: 3, emoji: '🍄' },
  'array-rotate': { rows: 3, cols: 5, emoji: '🌸' },
  'easy-tables': {},
  'place-value': { n: 2486 },
  carry: { a: 368, b: 257 },
  borrow: { a: 352, b: 127 },
  'zero-borrow': { a: 503, b: 128 },
  'sub-check': { a: 352, b: 127 },
  'sub-carry': { a: 352, b: 127 },
  'sub-parts': { a: 352, b: 127 },
  'sub-line': { a: 352, b: 127 },
  'five-plus-one': { b: 7 },
  'even-six-rhyme': {},
  'double-chain': { start: 3, steps: 3 },
  'pattern-units': { table: 8 },
  'known-facts': { table: 8 },
  'nine-trick': { a: 7 },
  'square-rhyme': {},
  'five-six-seven-eight': {},
  'split-multiply': { n: 23, m: 3 },
  'column-mul': { top: 47, bottom: 6 },
  share: { total: 12, groups: 3, emoji: '💎' },
  'fact-family': { a: 6, b: 7 },
  galera: { dividend: 84, divisor: 4 },
  'division-check': { dividend: 17, divisor: 5 },
  'bar-model': { a: 5, b: 3, total: 8 },
  'div-parts': { dividend: 84, divisor: 4 },
  'div-climb': { divisor: 4, quotient: 7 },
  'lng-sentence': { text: 'El perro come pan en el parque.', highlight: 'perro', mark: 'noun' },
  'lng-word': { word: 'mariposa', parts: 'ma-ri-po-sa', mark: 'ri' },
  'big-text': { text: '4 325 = 4 000 + 300 + 20 + 5' },
  'number-line': { from: 3400, to: 3500, step: 10, mark: 3456, jump: 4 },
  'fraction-shape': { parts: 4, shaded: 1, shape: 'circle' },
  'fraction-groups': { total: 20, parts: 4, take: 1 },
  money: { items: '500,200,20', price: 320 },
  clock: { h: 7, m: 5, digital: 1 },
  timeline: { start: 600, end: 645 },
  ruler: { cm: 8, object: '✏️' },
  units: { kind: 'length' },
  polygon: { sides: 5, mark: 'sides' },
  lines: { kind: 'paralelas' },
  angle: { deg: 90 },
  solid: { name: 'cilindro' },
  perimeter: { sides: '3,4,3,4' },
  'grid-route': { route: 'R,R,U,U,L' },
  pictogram: { rows: 'Gatos:3,Perros:5' },
  'bar-chart': { rows: 'Gatos:3,Perros:5' },
  'chance-bag': { balls: 'red:3,blue:0' },
}

/** Reads the LessonVisualId union straight from the shared types, so the test cannot drift from them. */
function visualIdsFromTypes(): string[] {
  const file = contentSource
  const start = file.indexOf('export type LessonVisualId =')
  const end = file.indexOf('export interface LessonStep', start)
  const block = file.slice(start, end)
  return [...block.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1])
}

describe('lesson visuals: exhaustiveness', () => {
  it('has a component for every LessonVisualId declared in src/types/content.ts', () => {
    const declared = visualIdsFromTypes().sort()
    expect(declared.length).toBeGreaterThan(20)
    expect(LESSON_VISUAL_IDS.slice().sort()).toEqual(declared)
    for (const id of declared) {
      expect(typeof LESSON_VISUALS[id as LessonVisualId]).toBe('function')
    }
  })

  it('has sample params for every visual', () => {
    expect(Object.keys(SAMPLE).sort()).toEqual(LESSON_VISUAL_IDS.slice().sort())
  })
})

describe('lesson visuals: rendering', () => {
  it.each(LESSON_VISUAL_IDS.map((id) => [id]))('%s draws every phase, animated and reduced', (id) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Visual = LESSON_VISUALS[id]
    for (const reduced of [false, true]) {
      for (const phase of [0, 1, 2, 3, 4]) {
        const { container, unmount } = render(<Visual params={SAMPLE[id]} phase={phase} runLength={5} reduced={reduced} />)
        expect(container.firstChild).not.toBeNull()
        unmount()
      }
      const { container, unmount } = render(<Visual params={SAMPLE[id]} phase={0} runLength={1} reduced={reduced} />)
      expect(container.firstChild).not.toBeNull()
      unmount()
    }
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('renders correctly with params missing (defaults)', () => {
    for (const id of LESSON_VISUAL_IDS) {
      const Visual = LESSON_VISUALS[id]
      const { container, unmount } = render(<Visual params={{}} phase={FINAL} runLength={1} reduced />)
      expect(container.firstChild).not.toBeNull()
      unmount()
    }
  })
})

describe('column subtraction plan', () => {
  it('352 − 127 borrows once from the tens', () => {
    const plan = planBorrow(352, 127)
    expect(plan.result.slice().reverse().join('')).toBe('225')
    expect(plan.snapshots).toEqual([[12, 4, 3]])
  })

  it('503 − 128 lends through the zero: the zero becomes 10 first', () => {
    const plan = planBorrow(503, 128)
    expect(plan.result.slice().reverse().join('')).toBe('375')
    expect(plan.snapshots).toEqual([
      [3, 10, 4],
      [13, 9, 4],
    ])
  })

  it('4352 − 1728 = 2624 with two borrows', () => {
    const plan = planBorrow(4352, 1728)
    expect(plan.result.slice().reverse().join('')).toBe('2624')
    expect(plan.snapshots.length).toBe(2)
  })

  it('needs no borrow when every digit is large enough', () => {
    const plan = planBorrow(578, 143)
    expect(plan.snapshots).toEqual([])
    expect(plan.result.slice().reverse().join('')).toBe('435')
  })
})

describe('column multiplication with a three-digit top', () => {
  it('213 × 3: the units phase shows 3 × 3 = 9, and the end shows 639', () => {
    const Visual = LESSON_VISUALS['column-mul']
    const first = render(<Visual params={{ top: 213, bottom: 3 }} phase={0} runLength={4} reduced />)
    expect(first.container.querySelector('[data-testid="work"]')?.textContent).toBe('3 × 3 = 9')
    first.unmount()
    const end = render(<Visual params={{ top: 213, bottom: 3 }} phase={FINAL} runLength={1} reduced />)
    expect(end.container.querySelector('[data-testid="work"]')?.textContent).toBe('213 × 3 = 639')
    end.unmount()
  })
})

describe('division galera', () => {
  it('84 ÷ 4 = 21 with no remainder, digit by digit', () => {
    const plan = longDivision(84, 4)
    expect(plan.quotient).toBe(21)
    expect(plan.remainder).toBe(0)
    expect(plan.steps).toEqual([
      { cur: 8, digit: 2 },
      { cur: 4, digit: 1 },
    ])
  })

  it('17 ÷ 5 = 3 remainder 2', () => {
    const plan = longDivision(17, 5)
    expect(plan.quotient).toBe(3)
    expect(plan.remainder).toBe(2)
  })

  it('72 ÷ 3 = 24', () => {
    expect(longDivision(72, 3).quotient).toBe(24)
  })

  it('written: each step shows its partial, product and remainder, one step per phase', () => {
    const Galera = LESSON_VISUALS.galera
    const written = { dividend: 384, divisor: 4, written: 1 }
    const at = (phase: number, runLength: number) => render(<Galera params={written} phase={phase} runLength={runLength} reduced />)
    const first = at(0, 3)
    expect(first.getAllByTestId('galera-step').map((n) => n.textContent)).toEqual(['38− 362'])
    expect(first.getByTestId('quotient').textContent).toBe('9')
    expect(first.getByTestId('remainder').textContent).toBe('2')
    first.unmount()
    const second = at(1, 3)
    expect(second.getAllByTestId('galera-step').map((n) => n.textContent)).toEqual(['38− 362', 'bajo el 424− 240'])
    expect(second.getByTestId('quotient').textContent).toBe('96')
    expect(second.getByTestId('remainder').textContent).toBe('0')
    second.unmount()
    const end = at(FINAL, 1)
    expect(end.getAllByTestId('galera-step')).toHaveLength(2)
    end.unmount()
  })

  it('without written, the galera keeps its picture (no step list with products)', () => {
    const Galera = LESSON_VISUALS.galera
    const plain = render(<Galera params={{ dividend: 17, divisor: 5 }} phase={FINAL} runLength={1} reduced />)
    expect(plain.queryByTestId('galera-step')).toBeNull()
    expect(plain.getByTestId('galera-product').textContent).toBe('3 × 5 = 15 · 17 − 15 = 2')
    plain.unmount()
  })
})

describe('fraction visuals', () => {
  it('fraction-shape draws parts slices and shades shaded of them', () => {
    const Shape = LESSON_VISUALS['fraction-shape']
    const { container, unmount } = render(<Shape params={{ parts: 3, shaded: 2, shape: 'bar' }} phase={FINAL} runLength={1} reduced />)
    expect(container.querySelectorAll('[data-part]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-shaded="true"]')).toHaveLength(2)
    unmount()
  })

  it('fraction-groups deals total dots into parts groups', () => {
    const Groups = LESSON_VISUALS['fraction-groups']
    const { container, unmount } = render(<Groups params={{ total: 12, parts: 3, take: 1 }} phase={FINAL} runLength={1} reduced />)
    const groups = container.querySelectorAll('[data-group]')
    expect(groups).toHaveLength(3)
    for (const group of groups) expect(group.querySelectorAll('[data-dot]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-group][data-taken="true"]')).toHaveLength(1)
    unmount()
  })
})
