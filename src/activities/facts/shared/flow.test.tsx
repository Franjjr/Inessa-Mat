import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeFactMul } from '@/engine'
import type { ExerciseOutcome } from '@/types'
import { useAnswerFlow } from './flow'

describe('facts answer flow: the hint shown at the start', () => {
  it('a guided exercise with hints on counts its first hint as used, so a quick right answer is not taken as known by heart', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const exercise = makeFactMul(6, 7)
    const { result } = renderHook(() => useAnswerFlow({ exercise, onAnswered, guided: true }))
    expect(result.current.hintsShown).toBe(1)
    act(() => { result.current.submit({ type: 'number', value: 42 }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(1)
  })

  it('an exercise without hints shows no hint at the start, even when it is guided', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const exercise = makeFactMul(6, 7)
    const { result } = renderHook(() => useAnswerFlow({ exercise, onAnswered, guided: true, allowHints: false }))
    expect(result.current.hintsShown).toBe(0)
    expect(result.current.canHint).toBe(false)
    act(() => { result.current.submit({ type: 'number', value: 42 }) })
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(0)
  })

  it('an unguided exercise counts no hint when it is answered at once', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const exercise = makeFactMul(6, 7)
    const { result } = renderHook(() => useAnswerFlow({ exercise, onAnswered }))
    act(() => { result.current.submit({ type: 'number', value: 42 }) })
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(0)
  })
})
