import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeColumnAdd } from '@/engine'
import { InkContext, LearningStore, type InkContextValue } from '@/ink/context'
import type { Answer, ExerciseOutcome } from '@/types'
import { useAnswerFlow } from './flow'

vi.mock('@/data', () => ({ addInkSample: vi.fn(async () => {}) }))

const ex = makeColumnAdd([368, 257]) // 625
const digits = (d: (number | null)[]): Answer => ({ type: 'digits', digits: d })

describe('ops answer flow and handwriting misreads', () => {
  it('a misread digit that the child rewrites is not graded as a maths error', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow(ex, { onAnswered }))
    act(() => { result.current.submit(digits([9, 9, 9])) }) // misread: first read looked wrong
    act(() => { result.current.submit(digits([5, 2, 6])) }) // child fixed the digits
    act(() => result.current.finish())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a right first answer stays graded as right after a later re-check', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow(ex, { onAnswered }))
    act(() => { result.current.submit(digits([5, 2, 6])) })
    act(() => { result.current.submit(digits([9, 9, 9])) })
    act(() => result.current.finish())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('without feedback the first submission is reported at once', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow(ex, { onAnswered, showFeedback: false }))
    act(() => { result.current.submit(digits([9, 9, 9])) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('a digit in doubt holds the answer: nothing is graded until the child confirms it', () => {
    const store = new LearningStore()
    const value: InkContextValue = {
      recognizer: null, ready: false, childId: null, mode: 'keyboard', preference: 'auto', setPreferred() {},
      isTouchDevice: false, penSeen: false, forgetPen() {}, noteKeyboard() {}, bigCells: false, handedness: 'right',
      learning: store, provided: true,
    }
    const wrapper = ({ children }: { children: ReactNode }) => <InkContext.Provider value={value}>{children}</InkContext.Provider>
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow(ex, { onAnswered }), { wrapper })
    store.doubt('cell-units', 9) // a misread units digit, read with low confidence

    act(() => { result.current.submit(digits([5, 2, 6])) }) // the right answer, but a digit is still in doubt
    expect(result.current.submitted).toBe(false)
    expect(result.current.result).toBeNull()
    expect(store.isPromptOpen()).toBe(true)
    act(() => result.current.finish())
    expect(onAnswered).not.toHaveBeenCalled()

    act(() => store.confirmDoubts()) // "Sí, es así"
    act(() => { result.current.submit(digits([5, 2, 6])) })
    act(() => result.current.finish())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
