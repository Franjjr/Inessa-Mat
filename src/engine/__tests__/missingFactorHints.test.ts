/* The third hint of a missing factor does not give the product away by listing the whole series. */
import { describe, expect, it } from 'vitest'
import { hintsFor, makeMissingFactor } from '@/engine'

describe('missing factor · third hint', () => {
  it('stops the series before the product, so counting it is not the answer', () => {
    const ex = makeMissingFactor(6, 7, 'b') // 6 × ? = 42
    const third = hintsFor(ex)[2]
    expect(third.text).toContain('6, 12, 18, 24, 30, 36')
    expect(third.text).not.toContain('42')
    expect(third.text).toContain('¿Qué número sigue?')
  })

  it('when the missing factor is 1 there is no series before the product: the hint asks the fact instead', () => {
    const ex = makeMissingFactor(7, 1, 'b') // 7 × ? = 7, the missing factor is 1
    const third = hintsFor(ex)[2]
    expect(third.text).toBe('Piensa: ¿7 por cuánto da 7?')
  })
})
