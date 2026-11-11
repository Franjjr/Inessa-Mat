/* The drawings of fractions and solids (P3PE-05, H21): the coloured parts are told from the white ones at a glance, and
   the cylinder of «¿rueda?» lies on its side. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FigureSvg, PART_ON_TOKEN } from './FigureSvg'

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('fraction parts (P3PE-05)', () => {
  it('the colour of a coloured part has a contrast of at least 3:1 against white', () => {
    const tokens = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf8')
    const hex = tokens.match(new RegExp(`${PART_ON_TOKEN}:\\s*(#[0-9a-fA-F]{6})`))?.[1]
    expect(hex).toBeTruthy()
    expect(contrast(hex!, '#ffffff')).toBeGreaterThanOrEqual(3)
  })

  it('a coloured part is filled with the striped full colour; a white part stays white', () => {
    const { container } = render(<FigureSvg figure={{ type: 'fraction', shape: 'rect', weights: [1, 1, 1, 1], colored: [0, 2], axis: 'x' }} label="Fracción" />)
    const pattern = container.querySelector('pattern')!
    expect(pattern.querySelector('rect')?.getAttribute('fill')).toBe(`var(${PART_ON_TOKEN})`)
    expect(pattern.querySelector('line')).toBeTruthy()
    const parts = [...container.querySelectorAll('[data-colored]')]
    expect(parts.filter((p) => p.getAttribute('data-colored') === 'yes').every((p) => p.getAttribute('fill') === `url(#${pattern.id})`)).toBe(true)
    expect(parts.filter((p) => p.getAttribute('data-colored') === 'no').every((p) => p.getAttribute('fill') === 'var(--c-surface)')).toBe(true)
  })

  it('two drawings on one page never share a pattern id', () => {
    const { container } = render(
      <>
        <FigureSvg figure={{ type: 'fraction', shape: 'rect', weights: [1, 1], colored: [0], axis: 'x' }} label="A" />
        <FigureSvg figure={{ type: 'fraction', shape: 'rect', weights: [1, 1], colored: [1], axis: 'x' }} label="B" />
      </>,
    )
    const ids = [...container.querySelectorAll('pattern')].map((p) => p.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('«¿rueda?» (H21)', () => {
  it('the cylinder lies on its side on the table', () => {
    const { container } = render(<FigureSvg figure={{ type: 'solid', name: 'cilindro' }} label="Cilindro" lying />)
    expect(container.querySelector('[data-lying]')).toBeTruthy()
    expect(container.querySelector('svg')?.innerHTML).toMatchInlineSnapshot(`"<g data-lying=""><path d="M 60 72 L 150 72 A 18 36 0 0 1 150 144 L 60 144" fill="var(--c-surface)" stroke="var(--c-ink)" stroke-width="4" stroke-linejoin="round"></path><ellipse cx="60" cy="108" rx="18" ry="36" fill="var(--c-magic-soft)" stroke="var(--c-ink)" stroke-width="4" stroke-linejoin="round"></ellipse><line x1="24" y1="147" x2="180" y2="147" stroke="var(--c-ink)" stroke-width="3" stroke-linecap="round" opacity="0.5"></line></g>"`)
  })

  it('standing, as in the other questions, when not asked to roll', () => {
    const { container } = render(<FigureSvg figure={{ type: 'solid', name: 'cilindro' }} label="Cilindro" />)
    expect(container.querySelector('[data-lying]')).toBeNull()
  })
})
