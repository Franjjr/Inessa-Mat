import { describe, expect, it } from 'vitest'
import { childText } from './childText'
import { worldHex } from './worldColors'

describe('childText', () => {
  it('renders the child name with the neutral fallback when no child is loaded', () => {
    expect(childText(null, '¡Muy bien, {child}!')).toBe('¡Muy bien, Peque!')
  })

  it('leaves plain text untouched', () => {
    expect(childText(null, 'Seguir')).toBe('Seguir')
  })
})

describe('worldHex', () => {
  it('maps every season-1 world and falls back to brand violet', () => {
    expect(worldHex('w1')).toBe('#15803d')
    expect(worldHex('w8')).toBe('#a16207')
    expect(worldHex('w99')).toBe('#7c3aed')
  })
})
