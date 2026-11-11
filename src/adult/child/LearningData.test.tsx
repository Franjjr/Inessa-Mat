import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PLACEMENT_ACTIVITY } from '@/engine'
import type { AttemptRecord } from '@/types'
import { useLearningData, withPlacements } from './LearningCards'

// The reads of the report: what the device returns is set per test, the calls are what this file checks.
const mocks = vi.hoisted(() => ({
  getMastery: vi.fn(),
  listAttempts: vi.fn(),
  listSessions: vi.fn(),
  listPlacementAttempts: vi.fn(),
  updateProgress: vi.fn(),
}))
vi.mock('@/data', () => mocks)

function attempt(id: string, skill: string, createdAt: string, activity?: string): AttemptRecord {
  return {
    id, childId: 'c', sessionId: null, skill, kind: 'fact-mul', correct: true, given: '1', expected: '1', ms: 1000,
    inputMode: 'keypad', hintsUsed: 0, errorType: null, context: activity ? { activity } : {}, createdAt,
  }
}

const OLD = '2025-01-05T10:00:00.000Z'
const NEW = '2026-03-01T10:00:00.000Z'

describe('useLearningData: what the report reads from the device', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getMastery.mockResolvedValue({})
    mocks.listSessions.mockResolvedValue([])
    mocks.listAttempts.mockImplementation(async (_id: string, opts?: { skipHandwriting?: boolean }) => (opts?.skipHandwriting
      ? [attempt('recent', 'mul:6x7', NEW)]
      : [attempt('recent', 'mul:6x7', NEW), attempt('pen', 'calig:letra:a', NEW)]))
    mocks.listPlacementAttempts.mockResolvedValue([attempt('test', 'mul:6x8', OLD, PLACEMENT_ACTIVITY)])
  })

  it('reads the recent attempts leaving the handwriting tries out, so they do not use up the window', async () => {
    const { result } = renderHook(() => useLearningData('c'))
    await waitFor(() => expect(result.current.data).not.toBeNull())
    expect(mocks.listAttempts).toHaveBeenCalledWith('c', expect.objectContaining({ limit: 5000, skipHandwriting: true }))
  })

  it('keeps the placement test of the past, out of the recent window, in the attempts', async () => {
    const { result } = renderHook(() => useLearningData('c'))
    await waitFor(() => expect(result.current.data).not.toBeNull())
    expect(mocks.listPlacementAttempts).toHaveBeenCalledWith('c', [PLACEMENT_ACTIVITY, expect.any(String), expect.any(String)])
    expect(result.current.data!.attempts.map((a) => a.id)).toEqual(['recent', 'test'])
    expect(result.current.data!.handwriting?.map((a) => a.id)).toEqual(['pen'])
  })
})

describe('withPlacements', () => {
  it('adds only the placement tests that are not in the recent list, newest first', () => {
    const recent = [attempt('a', 'mul:1x1', NEW), attempt('b', 'mul:1x2', '2025-06-01T10:00:00.000Z')]
    const placed = [attempt('b', 'mul:1x2', '2025-06-01T10:00:00.000Z', PLACEMENT_ACTIVITY), attempt('t', 'mul:2x2', OLD, PLACEMENT_ACTIVITY)]
    expect(withPlacements(recent, placed).map((a) => a.id)).toEqual(['a', 'b', 't'])
  })

  it('returns the recent list itself when there is nothing to add', () => {
    const recent = [attempt('a', 'mul:1x1', NEW)]
    expect(withPlacements(recent, [])).toBe(recent)
  })
})
