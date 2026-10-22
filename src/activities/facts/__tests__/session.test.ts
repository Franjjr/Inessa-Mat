import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSession } from '../shared/session'

describe('useSession with re-asks', () => {
  it('a re-ask extends the run by one item and does not count as a planned answer', () => {
    const { result } = renderHook(() => useSession({ total: 2 }))
    act(() => result.current.answered(false, true)) // planned 1, wrong, re-ask scheduled
    expect(result.current.result).toBeNull()
    act(() => result.current.answered(true, false)) // planned 2
    expect(result.current.result).toBeNull()
    act(() => result.current.answered(false, false)) // the re-ask (not counted as correct)
    expect(result.current.result).toMatchObject({ correct: 1, total: 2 })
  })

  it('without re-asks the run ends after the planned items as before', () => {
    const { result } = renderHook(() => useSession({ total: 2 }))
    act(() => result.current.answered(true))
    act(() => result.current.answered(true))
    expect(result.current.result).toMatchObject({ correct: 2, total: 2, stars: 3 })
    vi.restoreAllMocks()
  })
})
