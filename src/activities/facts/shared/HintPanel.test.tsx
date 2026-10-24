import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { hintsFor, makeFactDiv, makeFactMul } from '@/engine'
import { HintVisual } from './HintPanel'

describe('hint visuals never draw the answer', () => {
  it('the ten-fact skip count stops before the product: the last chip is «?»', () => {
    for (const n of [2, 3, 7]) {
      const hint = hintsFor(makeFactMul(n, 10))[1]
      const { container } = render(<HintVisual hint={hint} />)
      const chips = [...container.querySelectorAll('span')].map((c) => c.textContent)
      expect(chips.at(-1), `${n} × 10`).toBe('?')
      expect(chips.slice(0, -1), `${n} × 10`).toEqual(Array.from({ length: n - 1 }, (_, i) => String(10 * (i + 1))))
      expect(container.textContent).not.toContain(String(10 * n))
    }
  })

  it('the division share draws one group of the divisor, not the number of groups (the quotient)', () => {
    const hint = hintsFor(makeFactDiv(42, 6))[1]
    const { container } = render(<HintVisual hint={hint} />)
    // One group: the container has a single group element, with the six objects of the group.
    expect(container.firstElementChild?.children.length).toBe(1)
    expect(container.firstElementChild?.firstElementChild?.children.length).toBe(6)
  })
})
