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

  it('the division share draws the first round of the sharing (one for each), not how many each gets (the result)', () => {
    const hint = hintsFor(makeFactDiv(42, 6))[1]
    const { container } = render(<HintVisual hint={hint} />)
    // Six plates (the divisor), one object on each: the rounds, which are the answer, are the child's to count.
    expect(container.firstElementChild?.children.length).toBe(6)
    expect(container.firstElementChild?.firstElementChild?.children.length).toBe(1)
  })

  it('the 5 and one more draws 5 rows and the extra row apart; the 9 trick draws one less and the «?»', () => {
    const five = render(<HintVisual hint={hintsFor(makeFactMul(6, 7))[1]} />)
    const rows = five.getByTestId('dots-five-plus-one').children
    expect(rows.length).toBe(6)
    expect([...rows].filter((r) => r.getAttribute('data-extra') === 'true').length).toBe(1)
    expect(rows[0].children.length).toBe(7)
    const nine = render(<HintVisual hint={hintsFor(makeFactMul(7, 9))[1]} />)
    expect(nine.container.textContent).toBe('6+?=9')
    expect(nine.container.textContent).not.toContain('63')
  })

  it('the Lengua card shows its examples as chips, one per word, and nothing when it has none', () => {
    const hint = { level: 2 as const, text: 'Mira estos ejemplos.', visual: 'words' as const, params: { words: ['perro → perra', 'pato → pata'] } }
    const { container } = render(<HintVisual hint={hint} />)
    expect([...container.querySelectorAll('span')].map((c) => c.textContent)).toEqual(['perro → perra', 'pato → pata'])
    const empty = render(<HintVisual hint={{ ...hint, params: { words: [] } }} />)
    expect(empty.container.firstElementChild).toBeNull()
  })
})
