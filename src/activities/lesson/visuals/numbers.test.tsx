import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BigTextVisual, NumberLineVisual } from './numbers'
import { formatNumber, noBreakGroups } from './format'

const NBSP = ' '

describe('no-break thousands groups', () => {
  it('joins the digits of a thousands group, and leaves the other spaces alone', () => {
    expect(noBreakGroups('4 325 = 4 000 + 300')).toBe(`4${NBSP}325 = 4${NBSP}000 + 300`)
    expect(noBreakGroups('5 + 3 = 8')).toBe('5 + 3 = 8')
  })

  it('formats whole numbers for labels: groups, and a true minus sign', () => {
    expect(formatNumber(3400)).toBe(`3${NBSP}400`)
    expect(formatNumber(7)).toBe('7')
    expect(formatNumber(-20)).toBe('−20')
  })
})

describe('big-text renders «4 325» without a breaking space', () => {
  it('the thousands group is one unit in the drawn text and in the sub line', () => {
    const { container, unmount } = render(
      <BigTextVisual params={{ text: '4 325 = 4 000 + 300 + 20 + 5', sub: 'cuatro mil trescientos veinticinco 4 325' }} phase={0} runLength={1} reduced />,
    )
    const text = container.querySelector('[data-testid="big-text"]')!.textContent!
    expect(text).toContain(`4${NBSP}325`)
    expect(text).not.toContain('4 325')
    expect(container.textContent).not.toContain('4 325')
    unmount()
  })
})

describe('number-line labels use the same groups', () => {
  it('a 3 400 to 3 500 ruler labels its ends as «3 400» and «3 500»', () => {
    const { container, unmount } = render(<NumberLineVisual params={{ from: 3400, to: 3500, step: 10, mark: 3456, jump: 4 }} phase={0} runLength={1} reduced />)
    const text = container.querySelector('[data-testid="number-line"]')!.textContent!
    expect(text).toContain(`3${NBSP}400`)
    expect(text).toContain(`3${NBSP}500`)
    expect(container.querySelector('[data-testid="number-line-mark"]')!.textContent).toBe(`3${NBSP}456`)
    unmount()
  })
})
