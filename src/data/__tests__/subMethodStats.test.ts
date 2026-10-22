/* Subtraction method results: the attempts' context.method is tallied (recognition errors left out) and the child's
   favourite method comes from her settings (borrow when unset). */
import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ChildProfile } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { buildSummary, statsFromLocal } from '../summary'

function attempt(over: Partial<AttemptRecord> & { method?: string }): AttemptRecord {
  const { method, ...rest } = over
  return {
    id: Math.random().toString(36).slice(2),
    childId: 'c1',
    sessionId: null,
    skill: 'sub:3d:b1',
    kind: 'column-sub',
    correct: true,
    given: '225',
    expected: '225',
    ms: 1000,
    inputMode: 'pen',
    hintsUsed: 0,
    errorType: null,
    context: method ? { activity: 'column-3d', method } : { activity: 'column-3d' },
    createdAt: '2026-10-20T10:00:00.000Z',
    ...rest,
  }
}

const child = (subMethod?: ChildProfile['settings']['subMethod']): ChildProfile => ({
  id: 'c1', orgId: null, nickname: 'Lía', gender: 'f', companion: { species: 'cat', name: 'Bigotes', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, ...(subMethod ? { subMethod } : {}) },
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
})

describe('subtraction methods in the summary', () => {
  it('tallies attempts and correct answers per method, leaving out recognition errors', () => {
    const list = [
      attempt({ correct: true, context: { method: 'borrow' } as AttemptRecord['context'] }),
      attempt({ correct: false, errorType: 'borrow-forgot', context: { method: 'borrow' } as AttemptRecord['context'] }),
      attempt({ correct: false, errorType: 'recognition', context: { method: 'borrow' } as AttemptRecord['context'] }),
      attempt({ correct: true, context: { method: 'parts' } as AttemptRecord['context'] }),
      attempt({ correct: true }),
    ]
    const stats = statsFromLocal(list, list, [], null)
    expect(stats.methods).toEqual([
      { method: 'borrow', attempts: 2, correct: 1 },
      { method: 'parts', attempts: 1, correct: 1 },
    ])
  })

  it('the report reads the favourite from the settings, and borrow when none is stored', () => {
    const list = [attempt({ correct: true, context: { method: 'line' } as AttemptRecord['context'] })]
    const stats = statsFromLocal(list, list, [], null)
    expect(buildSummary(child('line'), null, {}, stats).subtractionMethods).toEqual({
      preferred: 'line',
      byMethod: [{ method: 'line', attempts: 1, correct: 1 }],
    })
    expect(buildSummary(child(), null, {}, null).subtractionMethods).toEqual({ preferred: 'borrow', byMethod: [] })
  })
})
