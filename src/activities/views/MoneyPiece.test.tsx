import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MoneyPiece } from './MoneyPiece'

/** The fills of the drawn circles of a coin, outer first. */
function fills(value: number): string[] {
  const { container, unmount } = render(<MoneyPiece value={value} size="md" />)
  const out = [...container.querySelectorAll('circle')].map((c) => c.getAttribute('fill') ?? '')
  unmount()
  return out
}

/* Real euro coins: the 1 € has a GOLD rim and a SILVER centre; the 2 € has a SILVER rim and a GOLD centre. */
const GOLD_RIM = '#c99a3c'
const SILVER = '#b9c1cc'
const GOLD_CENTRE = '#e5b84a'

describe('MoneyPiece bimetal coins', () => {
  it('the 1 € has a gold rim and a silver centre', () => {
    expect(fills(100)).toEqual([GOLD_RIM, SILVER])
  })

  it('the 2 € has a silver rim and a gold centre', () => {
    expect(fills(200)).toEqual([SILVER, GOLD_CENTRE])
  })
})
