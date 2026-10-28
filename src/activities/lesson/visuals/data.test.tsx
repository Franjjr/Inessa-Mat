import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'

const icons = (container: HTMLElement) => container.querySelectorAll('[aria-hidden="true"]').length

describe('pictogram visual', () => {
  it("'Gatos:3,Perros:5' renders 8 icons, one per dibujo", () => {
    const Pictogram = LESSON_VISUALS.pictogram
    const { container, unmount } = render(<Pictogram params={{ rows: 'Gatos:3,Perros:5' }} phase={FINAL} runLength={1} reduced />)
    expect(icons(container)).toBe(8)
    expect(container.textContent).toContain('Gatos')
    expect(container.textContent).toContain('Perros')
    unmount()
  })

  it('with unit 2, Gatos:4 renders 2 icons, each worth 2', () => {
    const Pictogram = LESSON_VISUALS.pictogram
    const { container, unmount } = render(<Pictogram params={{ rows: 'Gatos:4', unit: 2 }} phase={FINAL} runLength={1} reduced />)
    expect(icons(container)).toBe(2)
    expect(container.textContent).toContain('Cada dibujo vale 2.')
    unmount()
  })

  it('a row may name its icon: Gatos:2:🐱 draws the cat', () => {
    const Pictogram = LESSON_VISUALS.pictogram
    const { container, unmount } = render(<Pictogram params={{ rows: 'Gatos:2:🐱' }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).toContain('🐱🐱')
    unmount()
  })

  it('draws nothing broken without params', () => {
    const Pictogram = LESSON_VISUALS.pictogram
    const { container, unmount } = render(<Pictogram params={{}} phase={FINAL} runLength={1} reduced />)
    expect(container.firstChild).not.toBeNull()
    unmount()
  })
})

describe('bar-chart visual', () => {
  it('draws one bar per row, named under it, with a numbered scale', () => {
    const Bars = LESSON_VISUALS['bar-chart']
    const { container, unmount } = render(<Bars params={{ rows: 'Gatos:3,Perros:5' }} phase={FINAL} runLength={1} reduced />)
    expect(container.querySelectorAll('rect').length).toBe(2)
    expect(container.textContent).toContain('Gatos')
    expect(container.textContent).toContain('Perros')
    const scale = [...container.querySelectorAll('text')].map((t) => t.textContent)
    expect(scale).toContain('0')
    expect(scale).toContain('5')
    unmount()
  })
})

describe('chance-bag visual', () => {
  it("'red:3,blue:0' is a bag of 3 red balls and no blue one", () => {
    const Bag = LESSON_VISUALS['chance-bag']
    const { container, unmount } = render(<Bag params={{ balls: 'red:3,blue:0' }} phase={FINAL} runLength={1} reduced />)
    expect(icons(container)).toBe(3)
    expect(container.textContent).toContain('🔴')
    expect(container.textContent).not.toContain('🔵')
    expect(container.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('En la bolsa hay 3 rojas')
    unmount()
  })
})
