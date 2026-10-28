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

describe('MoneyPiece bimetal coins', () => {
  it('the 1 € has a silver rim and a gold centre', () => {
    const [rim, centre] = fills(100)
    expect(rim).toBe('#b9c1cc')
    expect(centre).toBe('#e5b84a')
  })

  it('the 2 € is the other way round: gold rim and silver centre', () => {
    const [rim, centre] = fills(200)
    expect(rim).toBe('#c99a3c')
    expect(centre).toBe('#b9c1cc')
  })
})
