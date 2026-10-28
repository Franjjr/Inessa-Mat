import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'

const draw = (id: 'polygon' | 'lines' | 'angle' | 'solid' | 'perimeter' | 'grid-route', params: Record<string, number | string>) => {
  const Visual = LESSON_VISUALS[id]
  return render(<Visual params={params} phase={FINAL} runLength={1} reduced />)
}

describe('polygon visual', () => {
  it('numbers the five sides 1 to 5 with mark sides', () => {
    const { container, unmount } = draw('polygon', { sides: 5, mark: 'sides' })
    const labels = [...container.querySelectorAll('text')].map((t) => t.textContent)
    expect(labels).toEqual(['1', '2', '3', '4', '5'])
    expect(container.querySelectorAll('polygon')[0].getAttribute('points')!.trim().split(' ')).toHaveLength(5)
    unmount()
  })

  it('numbers the corners with mark corners, and draws no numbers without a mark', () => {
    const corners = draw('polygon', { sides: 6, mark: 'corners' })
    expect([...corners.container.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['1', '2', '3', '4', '5', '6'])
    corners.unmount()
    const plain = draw('polygon', { sides: 4 })
    expect(plain.container.querySelectorAll('text')).toHaveLength(0)
    plain.unmount()
  })

  it('draws the heptagon and the octagon too', () => {
    for (const n of [7, 8]) {
      const { container, unmount } = draw('polygon', { sides: n, mark: 'sides' })
      expect(container.querySelectorAll('text')).toHaveLength(n)
      unmount()
    }
  })
})

describe('angle visual', () => {
  it('draws the right-angle square at 90 degrees', () => {
    const { container, unmount } = draw('angle', { deg: 90 })
    expect(container.querySelectorAll('[data-mark="right"]')).toHaveLength(1)
    unmount()
  })

  it('draws no square at 45 degrees, and none at 135', () => {
    const acute = draw('angle', { deg: 45 })
    expect(acute.container.querySelectorAll('[data-mark="right"]')).toHaveLength(0)
    acute.unmount()
    const obtuse = draw('angle', { deg: 135 })
    expect(obtuse.container.querySelectorAll('[data-mark="right"]')).toHaveLength(0)
    obtuse.unmount()
  })
})

describe('lines visual', () => {
  it('a recta, a semirrecta and a segmento are one line figure each, with their own ends', () => {
    for (const kind of ['recta', 'semirrecta', 'segmento', 'curva', 'poligonal']) {
      const { container, unmount } = draw('lines', { kind })
      expect(container.querySelector('svg')!.getAttribute('data-figure'), kind).toBe('line')
      unmount()
    }
  })

  it('paralelas and perpendiculares draw two straight lines each', () => {
    for (const kind of ['paralelas', 'perpendiculares']) {
      const { container, unmount } = draw('lines', { kind })
      expect(container.querySelector('svg')!.getAttribute('data-figure'), kind).toBe('lines')
      expect(container.querySelectorAll('line'), kind).toHaveLength(2)
      unmount()
    }
  })
})

describe('solid visual', () => {
  it('draws the solid the exercises draw', () => {
    for (const name of ['cubo', 'prisma', 'piramide', 'cilindro', 'cono', 'esfera']) {
      const { container, unmount } = draw('solid', { name })
      expect(container.querySelector('svg')!.getAttribute('data-figure'), name).toBe('solid')
      expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain(name)
      unmount()
    }
  })
})

describe('perimeter visual', () => {
  it('writes each length on its side and the sum: 3 + 4 + 3 + 4 = 14 cm', () => {
    const { container, unmount } = draw('perimeter', { sides: '3,4,3,4' })
    const labels = [...container.querySelectorAll('text')].map((t) => t.textContent)
    expect(labels).toEqual(['3 cm', '4 cm', '3 cm', '4 cm'])
    expect(container.textContent).toContain('3 + 4 + 3 + 4 = 14 cm')
    unmount()
  })

  it('a triangle of 3, 4 and 5 cm sums to 12 cm', () => {
    const { container, unmount } = draw('perimeter', { sides: '3,4,5' })
    expect(container.textContent).toContain('3 + 4 + 5 = 12 cm')
    expect(container.querySelectorAll('text')).toHaveLength(3)
    unmount()
  })
})

describe('grid-route visual', () => {
  it('draws one path step per letter: R,R,U gives 3 steps from the gold start cell', () => {
    const { container, unmount } = draw('grid-route', { route: 'R,R,U' })
    expect(container.querySelectorAll('[data-step]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-start]')).toHaveLength(1)
    unmount()
  })

  it('draws the 4 by 5 grid of the exercise, with the start cell in gold', () => {
    const { container, unmount } = draw('grid-route', { route: 'D,L' })
    expect(container.querySelectorAll('rect')).toHaveLength(20)
    expect(container.querySelectorAll('[data-start]')).toHaveLength(1)
    unmount()
  })

  it('lists the steps as arrows, one chip per move: R,R,U is →→ then ↑', () => {
    const { container, unmount } = draw('grid-route', { route: 'R,R,U' })
    expect([...container.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['→→', '↑'])
    unmount()
  })
})
