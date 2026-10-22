import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { check, makeColumnAdd, makeFactMul } from '@/engine'
import type { ActivityHost, ActivityConfig, ExerciseOutcome } from '@/types'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { useOpsRun } from './useOpsRun'

const config: ActivityConfig = { kind: 'column', title: 't', instructions: '', selector: {} }

function outcomeFor(ex: ReturnType<typeof makeColumnAdd>, correct: boolean): ExerciseOutcome {
  return {
    check: correct
      ? check(ex, { type: 'digits', digits: [5, 2, 6] })
      : check(ex, { type: 'digits', digits: [9, 9, 9] }),
    ms: 1200,
    inputMode: 'keyboard',
    hintsUsed: 0,
    recognitionFixes: 0,
  }
}

describe('useOpsRun', () => {
  it('reports every attempt through the host and ends with the stars after the last round', () => {
    const reportAttempt = vi.fn()
    const react = vi.fn()
    const host: ActivityHost = { ...defaultActivityHost, reportAttempt, react }
    const onDone = vi.fn()
    const exercises = [makeColumnAdd([368, 257]), makeColumnAdd([124, 432])]
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ActivityHostProvider value={host}>{children}</ActivityHostProvider>
    )
    const { result } = renderHook(() => useOpsRun(exercises, config, onDone), { wrapper })

    act(() => result.current.record(outcomeFor(exercises[0], true)))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ exercise: exercises[0], ms: 1200, inputMode: 'keyboard' })
    expect(react).toHaveBeenLastCalledWith('correct', expect.any(Object))
    expect(onDone).not.toHaveBeenCalled()

    act(() => result.current.record(outcomeFor(exercises[1], false)))
    expect(reportAttempt).toHaveBeenCalledTimes(2)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone.mock.calls[0][0]).toMatchObject({ correct: 1, total: 2, stars: 0 })
  })

  it('uses the fact exercise shape too (kept for the board race)', () => {
    expect(makeFactMul(6, 7).answer).toBe(42)
  })
})
