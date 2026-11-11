import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINAL } from './types'
import { PlaceValueVisual } from './addition'

const show = (n: number) => render(<PlaceValueVisual params={{ n }} phase={FINAL} runLength={1} reduced />)

describe('place-value houses: the names of the houses of 3.º', () => {
  it('a four-digit number has the houses U, D, C and M (millares), never «UM»', () => {
    const { getByTestId } = show(2486)
    const names = within(getByTestId('houses')).getAllByText(/^(U|D|C|M|DM)$/).map((el) => el.textContent)
    expect(names).toEqual(['M', 'C', 'D', 'U'])
  })

  it('a five-digit number adds the decenas de millar (DM) instead of a second «UM» house', () => {
    const { getByTestId, container } = show(12345)
    const names = within(getByTestId('houses')).getAllByText(/^(U|D|C|M|DM)$/).map((el) => el.textContent)
    expect(names).toEqual(['DM', 'M', 'C', 'D', 'U'])
    expect(container.textContent).not.toContain('UM')
  })
})
