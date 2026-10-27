import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '@/types'
import { statsFromLocal } from '../summary'

const now = Date.parse('2026-10-22T10:00:00.000Z')
let n = 0
function attempt(over: Partial<AttemptRecord>): AttemptRecord {
  n += 1
  return {
    id: `s${n}`, childId: 'c', sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42', expected: '42',
    ms: 2000, inputMode: 'keypad', hintsUsed: 0, errorType: null, context: {}, createdAt: new Date(now - 3600_000).toISOString(), ...over,
  }
}

describe('statsFromLocal: ungraded retry rows do not count in accuracy', () => {
  it('a retry row (graded: false) is left out of attempts, correct and the method tally', () => {
    const list = [
      attempt({ correct: false, errorType: 'fact' }), // graded first answer: wrong
      attempt({ correct: true, retries: 1, solvedOnRetry: true, graded: false, context: { method: 'borrow' } }),
      attempt({ correct: true, context: { method: 'borrow' } }),
    ]
    const stats = statsFromLocal(list, list, [], null)
    expect(stats.attempts).toBe(2)
    expect(stats.correct).toBe(1)
    expect(stats.methods).toEqual([{ method: 'borrow', attempts: 1, correct: 1 }])
  })

  it('a wrong retry row is not a mistake in the top errors either', () => {
    const list = [attempt({ correct: false, errorType: 'carry-forgot', graded: false, retries: 1 })]
    expect(statsFromLocal(list, list, [], null).topErrors).toEqual([])
  })
})
