import { describe, expect, it } from 'vitest'
import { clockText } from './DailySession'

describe('the session counter', () => {
  it('says the minutes done out of the minutes of the session, in words', () => {
    expect(clockText(0, 15)).toBe('0 de 15 minutos')
    expect(clockText(3, 15)).toBe('0 de 15 minutos')
    expect(clockText(185, 15)).toBe('3 de 15 minutos')
    expect(clockText(900, 15)).toBe('15 de 15 minutos')
  })
})
