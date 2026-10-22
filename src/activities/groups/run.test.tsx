import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { check, makeColumnAdd, makeFactMul } from '@/engine'
import type { ActivityHost, ActivityConfig, ExerciseOutcome } from '@/types'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { useOpsRun } from './useOpsRun'

const config: ActivityConfig = { kind: 'column', title: 't', instructions: '', selector: {} }

function outcomeFor(ex: ReturnType<typeof makeColumnAdd>, correct: boolean): ExerciseOutcome {
  // The written digits, units first: the right sum or a wrong one.
  const right = String(ex.answer).split('').reverse().map(Number)
  return {
    check: check(ex, { type: 'digits', digits: correct ? right : [9, 9, 9] }),
    ms: 1200,
    inputMode: 'keyboard',
    hintsUsed: 0,
    recognitionFixes: 0,
  }
}

function setup(exercises: ReturnType<typeof makeColumnAdd>[]) {
  const reportAttempt = vi.fn()
  const react = vi.fn()
  const host: ActivityHost = { ...defaultActivityHost, reportAttempt, react }
  const onDone = vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ActivityHostProvider value={host}>{children}</ActivityHostProvider>
  )
  const hook = renderHook(() => useOpsRun(exercises, config, onDone), { wrapper })
  return { reportAttempt, react, onDone, result: hook.result }
}

describe('useOpsRun', () => {
  it('reports every attempt through the host and ends with the stars after the last round', () => {
    const exercises = [makeColumnAdd([368, 257]), makeColumnAdd([124, 432])]
    const { reportAttempt, react, onDone, result } = setup(exercises)

    act(() => result.current.record(outcomeFor(exercises[0], true)))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0]).toMatchObject({ exercise: exercises[0], ms: 1200, inputMode: 'keyboard' })
    expect(react).toHaveBeenLastCalledWith('correct', expect.any(Object))
    expect(onDone).not.toHaveBeenCalled()

    // Wrong: the same round comes back later, so the run is not over yet.
    act(() => result.current.record(outcomeFor(exercises[1], false)))
    expect(reportAttempt).toHaveBeenCalledTimes(2)
    expect(onDone).not.toHaveBeenCalled()
    expect(result.current.retry).toBe(true)
    expect(result.current.exercise).toBe(exercises[1])
    expect(result.current.total).toBe(2)
    act(() => result.current.record(outcomeFor(exercises[1], true)))
    expect(reportAttempt).toHaveBeenCalledTimes(2)
    expect(onDone.mock.calls[0][0]).toMatchObject({ correct: 1, total: 2, stars: 0 })
  })

  it('brings a wrong round back later, without a second mastery report, and counts only planned rounds', () => {
    const exercises = [makeColumnAdd([368, 257]), makeColumnAdd([124, 432]), makeColumnAdd([111, 222]), makeColumnAdd([300, 400])]
    const { reportAttempt, onDone, result } = setup(exercises)

    act(() => result.current.record(outcomeFor(exercises[0], false))) // wrong: comes back 2 rounds later
    act(() => result.current.record(outcomeFor(exercises[1], true)))
    act(() => result.current.record(outcomeFor(exercises[2], true)))
    // The re-ask of exercises[0] is the next round: answering it right is practice only.
    expect(result.current.retry).toBe(true)
    expect(result.current.exercise).toBe(exercises[0])
    act(() => result.current.record(outcomeFor(exercises[0], true)))
    expect(result.current.exercise).toBe(exercises[3])
    act(() => result.current.record(outcomeFor(exercises[3], true)))

    expect(reportAttempt).toHaveBeenCalledTimes(4)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone.mock.calls[0][0]).toMatchObject({ correct: 3, total: 4 })
  })

  it('uses the fact exercise shape too (kept for the board race)', () => {
    expect(makeFactMul(6, 7).answer).toBe(42)
  })
})
