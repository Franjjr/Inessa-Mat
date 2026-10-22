import { describe, expect, it } from 'vitest'
import { childFromRow } from '../mappers'

describe('child gender mapping', () => {
  it('reads the legacy neutral value stored in local or cloud rows as masculine', () => {
    const c = childFromRow({
      id: 'k1', org_id: null, nickname: 'Lia', gender: 'n', grade: 2,
      companion: { species: 'cat', name: 'Luna', gender: 'n' }, settings: {},
      created_at: '2026-10-01T10:00:00.000Z', updated_at: '2026-10-01T10:00:00.000Z', deleted_at: null,
    })
    expect(c.gender).toBe('m')
    expect(c.companion.gender).toBe('m')
  })

  it('keeps feminine and masculine values as they are', () => {
    const c = childFromRow({
      id: 'k2', org_id: null, nickname: 'Inessa', gender: 'f',
      companion: { species: 'dog', name: 'Toby', gender: 'm' }, settings: {},
      created_at: '2026-10-01T10:00:00.000Z', updated_at: '2026-10-01T10:00:00.000Z', deleted_at: null,
    })
    expect(c.gender).toBe('f')
    expect(c.companion.gender).toBe('m')
  })
})
