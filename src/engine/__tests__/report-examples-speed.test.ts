import { describe, expect, it } from 'vitest'
import type { AttemptRecord, MasteryMap, SkillMastery } from '@/types'
import { errorReport, speedReport } from '../report'

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
let n = 0
function attempt(over: Partial<AttemptRecord>): AttemptRecord {
  n += 1
  return {
    id: `r${n}`, childId: 'c', sessionId: null, skill: 'mul:7x8', kind: 'fact-mul', correct: false, given: '54', expected: '56',
    ms: 2000, inputMode: 'keypad', hintsUsed: 0, errorType: 'fact', context: {}, createdAt: new Date(now.getTime() - DAY).toISOString(), ...over,
  }
}

describe('errorReport: examples of the wrong answers', () => {
  it('keeps the latest wrong answers of each group, with what was written and what was right', () => {
    const list = [
      attempt({ skill: 'mul:7x8', given: '54', expected: '56', createdAt: new Date(now.getTime() - 1 * DAY).toISOString() }),
      attempt({ skill: 'mul:6x9', given: '50', expected: '54', createdAt: new Date(now.getTime() - 2 * DAY).toISOString() }),
      attempt({ skill: 'mul:4x4', given: '', expected: '16', createdAt: new Date(now.getTime() - 3 * DAY).toISOString() }),
      attempt({ skill: 'mul:3x3', given: '8', expected: '9', createdAt: new Date(now.getTime() - 4 * DAY).toISOString() }),
    ]
    const group = errorReport(list, now).groups.find((g) => g.id === 'tablas')!
    expect(group.count).toBe(4)
    expect(group.examples).toEqual([
      { skill: 'mul:7x8', given: '54', expected: '56' },
      { skill: 'mul:6x9', given: '50', expected: '54' },
      { skill: 'mul:4x4', given: '', expected: '16' },
    ])
  })

  it('never offers «No lo sé» as an example: it is not a mistake', () => {
    const list = [attempt({ errorType: 'dont-know', given: '', expected: '56' })]
    expect(errorReport(list, now).groups).toEqual([])
  })
})

describe('speedReport: the tables answered from memory', () => {
  /** A dominated fact (box 2 or more) with its average time. */
  const fact = (a: number, b: number, avgMs: number | null, box = 3): [string, SkillMastery] => [
    `mul:${a}x${b}`,
    { skill: `mul:${a}x${b}`, box, attempts: 3, correct: 3, streak: 3, avgMs, lastSeenAt: null, dueAt: null, updatedAt: '' } as SkillMastery,
  ]

  it('calls a table quick when its dominated facts are answered fast, and slow when not', () => {
    const mastery: MasteryMap = Object.fromEntries([
      fact(1, 2, 1500), fact(2, 2, 1800), fact(2, 3, 2100),
      fact(7, 7, 9000), fact(7, 8, 8000), fact(7, 9, 8500),
    ])
    expect(speedReport(mastery)).toEqual({ quick: [2], slow: [7] })
  })

  it('says nothing about a table with fewer than three dominated facts with a time', () => {
    const mastery: MasteryMap = Object.fromEntries([fact(5, 5, 1000), fact(5, 6, 1000), fact(5, 7, null), fact(5, 8, 1000, 1)])
    expect(speedReport(mastery)).toEqual({ quick: [], slow: [] })
  })
})
