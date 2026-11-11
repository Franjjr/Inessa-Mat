import { describe, expect, it } from 'vitest'
import type { AttemptRecord, SessionSubject } from '@/types'
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

describe('statsFromLocal: «No lo sé» is not a most frequent error', () => {
  it('leaves dont-know out of the top errors, and keeps the real mistakes', () => {
    const list = [
      attempt({ correct: false, errorType: 'dont-know' }),
      attempt({ correct: false, errorType: 'dont-know' }),
      attempt({ correct: false, errorType: 'fact' }),
    ]
    expect(statsFromLocal(list, list, [], null).topErrors).toEqual([{ errorType: 'fact', count: 1 }])
  })
})

describe('statsFromLocal: Lengua sessions are not maths minutes (R5)', () => {
  const session = (minutes: number, subject?: SessionSubject) => ({
    id: `ses-${minutes}-${subject ?? 'math'}`, childId: 'c', startedAt: new Date(now).toISOString(), endedAt: null, minutes,
    summary: subject ? { attempts: 0, correct: 0, starsEarned: 0, nodesCompleted: [], subject } : null,
  })

  it('counts the maths sessions only (a session with no mark is maths)', () => {
    const sessions = [session(10), session(6, 'language'), session(4)]
    expect(statsFromLocal([], [], sessions, null).minutes).toBe(14)
  })

  it('a Lengua session on its own gives no maths minutes', () => {
    expect(statsFromLocal([], [], [session(9, 'language')], null).minutes).toBe(0)
  })

  it('the activity of every subject is counted apart: graded answers and minutes', () => {
    const attempts = [
      attempt({ skill: 'lng:ort:bv' }),
      attempt({ skill: 'lng:ort:bv', graded: false }),
      attempt({ skill: 'eng:voc:animales' }),
      attempt({ skill: 'calig:a' }),
      attempt({ skill: 'mul:6x7' }),
      attempt({ skill: 'cal:weekday' }), // the calendar is maths, not Caligrafía
    ]
    const stats = statsFromLocal(attempts, attempts, [session(6, 'language'), session(3, 'handwriting'), session(2)], null)
    expect(stats.bySubject).toEqual({
      language: { attempts: 1, minutes: 6 },
      english: { attempts: 1, minutes: 0 },
      handwriting: { attempts: 1, minutes: 3 },
      math: { attempts: 2, minutes: 2 },
    })
  })

  it('English and Caligrafía sessions give no maths minutes either', () => {
    expect(statsFromLocal([], [], [session(5, 'english'), session(3, 'handwriting'), session(2)], null).minutes).toBe(2)
  })
})
