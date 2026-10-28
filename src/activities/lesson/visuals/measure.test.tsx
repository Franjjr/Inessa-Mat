import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'

describe('ruler visual', () => {
  it('ruler draws cm + 1 numbered ticks', () => {
    const Ruler = LESSON_VISUALS.ruler
    const { container, unmount } = render(<Ruler params={{ cm: 8 }} phase={FINAL} runLength={1} reduced />)
    const labels = [...container.querySelectorAll('text')].map((t) => t.textContent)
    expect(labels).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8'])
    unmount()
  })

  it('the object lies from 0 to cm, with its emoji on it', () => {
    const Ruler = LESSON_VISUALS.ruler
    const { container, unmount } = render(<Ruler params={{ cm: 4, object: '🧽' }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).toContain('🧽')
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('acaba en 4')
    unmount()
  })
})

describe('ruler visual: where the object starts', () => {
  it('an object from 2 to 7 lies from the 2 to the 7, five centimetres long', () => {
    const Ruler = LESSON_VISUALS.ruler
    const { container, unmount } = render(<Ruler params={{ cm: 7, from: 2, object: '🖍️' }} phase={FINAL} runLength={1} reduced />)
    const thing = container.querySelectorAll('rect')[1]
    expect(Number(thing.getAttribute('x'))).toBeCloseTo(14 + 2 * 24, 3)
    expect(Number(thing.getAttribute('width'))).toBeCloseTo(5 * 24, 3)
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('empieza en 2 y acaba en 7')
    unmount()
  })
})

describe('units visual', () => {
  it('units lists g and kg for mass', () => {
    const Units = LESSON_VISUALS.units
    const { container, unmount } = render(<Units params={{ kind: 'mass' }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).toContain('1 g')
    expect(container.textContent).toContain('1 kg')
    expect(container.textContent).not.toContain('1 ml')
    unmount()
  })

  it('units lists m and km for length, and ml and l for capacity', () => {
    const Units = LESSON_VISUALS.units
    const length = render(<Units params={{ kind: 'length' }} phase={FINAL} runLength={1} reduced />)
    expect(length.container.textContent).toContain('1 cm')
    expect(length.container.textContent).toContain('1 m')
    expect(length.container.textContent).toContain('1 km')
    length.unmount()
    const capacity = render(<Units params={{ kind: 'capacity' }} phase={FINAL} runLength={1} reduced />)
    expect(capacity.container.textContent).toContain('1 ml')
    expect(capacity.container.textContent).toContain('1 l')
    capacity.unmount()
  })
})
