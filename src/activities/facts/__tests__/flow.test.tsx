import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeFactMul } from '@/engine'
import { InkContext, LearningStore, type InkContextValue } from '@/ink/context'
import type { Answer, ExerciseOutcome } from '@/types'
import { useAnswerFlow } from '../shared/flow'

vi.mock('@/data', () => ({ addInkSample: vi.fn(async () => {}) }))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const ex = makeFactMul(6, 7) // 42
const num = (value: number): Answer => ({ type: 'number', value })

describe('facts answer flow · digits in doubt', () => {
  it('a held answer is not graded and not counted as a try until the child confirms the digit', () => {
    const store = new LearningStore()
    const value: InkContextValue = {
      recognizer: null, ready: false, childId: null, mode: 'pen', preference: 'auto', setPreferred() {},
      isTouchDevice: false, penSeen: true, forgetPen() {}, noteKeyboard() {}, bigCells: false, handedness: 'right',
      learning: store, provided: true,
    }
    const wrapper = ({ children }: { children: ReactNode }) => <InkContext.Provider value={value}>{children}</InkContext.Provider>
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow({ exercise: ex, onAnswered }), { wrapper })
    store.doubt('pad:0', 4)

    act(() => result.current.submit(num(42)))
    expect(result.current.phase).toBe('asking')
    expect(result.current.last).toBeNull()
    expect(store.isPromptOpen()).toBe(true)

    act(() => store.confirmDoubts())
    act(() => result.current.submit(num(42)))
    expect(result.current.phase).toBe('done')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
