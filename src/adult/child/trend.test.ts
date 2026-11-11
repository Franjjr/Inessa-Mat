import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '@/types'
import { weeklyTrend } from './trend'

const now = new Date(2026, 9, 22, 12)
const DAY = 24 * 60 * 60 * 1000

function attempt(daysAgo: number, over: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    id: `t${daysAgo}-${Math.random()}`, childId: 'c', sessionId: null, skill: 'mul:7x8', kind: 'fact-mul', correct: true, given: '56', expected: '56',
    ms: 2000, inputMode: 'keypad', hintsUsed: 0, errorType: null, context: {}, createdAt: new Date(now.getTime() - daysAgo * DAY).toISOString(), ...over,
  }
}

describe('weeklyTrend', () => {
  it('counts answers, correct answers and days per week, newest week first', () => {
    const list = [
      attempt(1), attempt(1, { correct: false, errorType: 'fact' }), attempt(2),
      attempt(9), attempt(10, { correct: false, errorType: 'fact' }),
    ]
    const weeks = weeklyTrend(list, now, 3)
    expect(weeks[0]).toEqual({ weeksAgo: 0, answered: 3, correct: 2, days: 2 })
    expect(weeks[1]).toEqual({ weeksAgo: 1, answered: 2, correct: 1, days: 2 })
    expect(weeks[2]).toEqual({ weeksAgo: 2, answered: 0, correct: 0, days: 0 })
  })

  it('leaves out retry rows, recognition slips and attempts in the future', () => {
    const list = [
      attempt(1),
      attempt(1, { graded: false, retries: 1 }),
      attempt(1, { correct: false, errorType: 'recognition' }),
      attempt(-2),
    ]
    expect(weeklyTrend(list, now, 2)[0]).toEqual({ weeksAgo: 0, answered: 1, correct: 1, days: 1 })
  })

  it('only counts maths: a Lengua or English attempt is not here', () => {
    const list = [attempt(1, { skill: 'lng:algo', kind: 'fact-mul' }), attempt(1)]
    expect(weeklyTrend(list, now, 1)[0].answered).toBe(1)
  })
})
