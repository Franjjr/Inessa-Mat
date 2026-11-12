/* The params the classes of problems, fractions and polygons need instead of a «big-text»: the bar with the whole
   unknown, the struck take-away part and the two bars to compare; a pizza cut into unequal pieces; the rhombus, and
   the circumference (the line) against the circle (the line and its inside). */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LESSON_VISUALS } from './index'
import type { LessonVisualId } from '@/types'

afterEach(cleanup)

const draw = (id: LessonVisualId, params: Record<string, number | string>, phase = 0, runLength = 1) => {
  const V = LESSON_VISUALS[id]
  return render(<V params={params} phase={phase} runLength={runLength} reduced />)
}

describe('bar-model for the classes', () => {
  it('ask total: the whole is «?» until the last step, which writes the sum', () => {
    const first = draw('bar-model', { a: 12, b: 9, ask: 'total' }, 0, 2)
    expect(first.getByTestId('bar-total').textContent).toBe('El total es ?')
    first.unmount()
    const last = draw('bar-model', { a: 12, b: 9, ask: 'total' }, 1, 2)
    expect(last.getByTestId('bar-total').textContent).toBe('12 + 9 = 21')
  })

  it('cross: the part that goes away is struck through in a take-away', () => {
    const { container } = draw('bar-model', { a: 4, b: 0, total: 13, cross: 1 })
    expect(container.querySelectorAll('[data-struck="yes"]')).toHaveLength(1)
  })

  it('compare: two bars, the missing piece is «?» and the last step writes the difference', () => {
    const first = draw('bar-model', { a: 8, b: 5, compare: 1 }, 0, 2)
    expect(first.getByTestId('bar-diff').textContent).toBe('?')
    expect(first.getByTestId('bar-total').textContent).toBe('¿Cuántos más?')
    first.unmount()
    const last = draw('bar-model', { a: 8, b: 5, compare: 1 }, 1, 2)
    expect(last.getByTestId('bar-diff').textContent).toBe('3')
    expect(last.getByTestId('bar-total').textContent).toBe('8 − 5 = 3')
  })
})

describe('fraction-shape with unequal pieces', () => {
  it('cuts the pizza into pieces of different size and writes no fraction', () => {
    const { container } = draw('fraction-shape', { parts: 3, unequal: 1 })
    expect(container.querySelectorAll('[data-part]')).toHaveLength(3)
    expect(container.textContent).toContain('No son partes iguales')
    expect(container.textContent).not.toMatch(/\d/)
  })
})

describe('polygon shapes', () => {
  it('rombo: 4 equal sides and no right corner', () => {
    const { container } = draw('polygon', { shape: 'rombo' })
    const pts = container.querySelector('polygon')!.getAttribute('points')!.trim().split(' ').map((p) => p.split(',').map(Number))
    expect(pts).toHaveLength(4)
    const side = (i: number) => Math.hypot(pts[(i + 1) % 4][0] - pts[i][0], pts[(i + 1) % 4][1] - pts[i][1])
    for (let i = 1; i < 4; i++) expect(side(i)).toBeCloseTo(side(0), 1)
    const [p0, p1, p2] = pts
    const dot = (p0[0] - p1[0]) * (p2[0] - p1[0]) + (p0[1] - p1[1]) * (p2[1] - p1[1])
    expect(Math.abs(dot)).toBeGreaterThan(100)
  })

  it('circunferencia is only the line; círculo is the line and its inside', () => {
    const ring = draw('polygon', { shape: 'aro' })
    expect(ring.container.querySelector('circle')!.getAttribute('data-filled')).toBe('no')
    ring.unmount()
    const disc = draw('polygon', { shape: 'circulo' })
    expect(disc.container.querySelector('circle')!.getAttribute('data-filled')).toBe('yes')
  })
})
