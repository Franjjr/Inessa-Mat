import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'
import { moneyLabel } from './money'

describe('money visual', () => {
  it('money draws only real euro coins and notes', () => {
    const Money = LESSON_VISUALS.money
    const { container, unmount } = render(<Money params={{ items: '200,50,20,3' }} phase={FINAL} runLength={1} reduced />)
    expect(container.querySelectorAll('[data-piece]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-piece="3"]')).toHaveLength(0)
    unmount()
  })

  it('moneyLabel writes euros with a comma', () => {
    expect(moneyLabel(125)).toBe('1,25 €')
    expect(moneyLabel(50)).toBe('50 cént.')
    expect(moneyLabel(500)).toBe('5 €')
  })

  it('money with price shows the change', () => {
    const Money = LESSON_VISUALS.money
    const { container, unmount } = render(<Money params={{ items: '500', price: 320 }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).toContain('1,80 €')
    unmount()
  })

  it('money with price and no change line when the items do not pay more', () => {
    const Money = LESSON_VISUALS.money
    const { container, unmount } = render(<Money params={{ items: '200,50', price: 250 }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).not.toContain('Te devuelven')
    unmount()
  })
})
