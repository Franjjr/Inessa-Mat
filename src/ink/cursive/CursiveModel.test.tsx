import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CursiveModel } from './CursiveModel'

describe('<CursiveModel>', () => {
  it('renders a start dot and at least one direction arrow for "a"', () => {
    const html = renderToStaticMarkup(<CursiveModel text="a" />)
    expect(html).toContain('<circle')
    expect(html).toMatch(/transform="translate\([^)]*\) rotate\(/)
  })

  it('draws the pauta lines and no animation when play is 0', () => {
    const html = renderToStaticMarkup(<CursiveModel text="mi" />)
    expect(html).toContain('<line')
    expect(html).not.toContain('pathLength')
  })
})
