import { describe, expect, it } from 'vitest'
import { attemptFromRow, attemptToRow, childFromRow } from '../mappers'
import type { AttemptRecord } from '@/types'

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

describe('attempt retries', () => {
  const base: AttemptRecord = {
    id: 'a1', childId: 'k1', sessionId: null, skill: 'add:2+2', kind: 'fact-mul', correct: false, given: '5', expected: '4',
    ms: 1200, inputMode: 'keypad', hintsUsed: 0, errorType: 'fact', context: { activity: 'sesion' }, createdAt: '2026-10-01T10:00:00.000Z',
  }

  it('stores the retries inside the context json, so no column is needed', () => {
    const row = attemptToRow({ ...base, retries: 1, solvedOnRetry: true })
    expect(row.context).toEqual({ activity: 'sesion', retries: 1, solvedOnRetry: true })
  })

  it('reads them back into the record', () => {
    const back = attemptFromRow(attemptToRow({ ...base, retries: 2, solvedOnRetry: false }))
    expect(back.retries).toBe(2)
    expect(back.solvedOnRetry).toBeUndefined()
    expect(back.context).toEqual({ activity: 'sesion' })
  })

  it('leaves the context alone when the attempt had no retry', () => {
    const row = attemptToRow(base)
    expect(row.context).toEqual({ activity: 'sesion' })
    const back = attemptFromRow(row)
    expect(back.retries).toBeUndefined()
    expect(back.context).toEqual({ activity: 'sesion' })
  })
})
