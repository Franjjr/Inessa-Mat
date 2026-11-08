/* Teaching after a wrong multiplication fact: the clue (the trick) counts as a hint; with copyOnReveal the child writes
   the shown answer before the exercise ends, graded wrong, with the time of the answer and no extra retry. FactView
   shows the clue and the worked step even when it hides its own feedback. */
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { speech } from '@/audio'
import { ActivityHostProvider } from '../../host'
import { describe, expect, it, vi } from 'vitest'
import { makeFactMul } from '@/engine'
import type { Answer, ExerciseOutcome } from '@/types'
import { useAnswerFlow } from '../shared/flow'
import FactView from '../../views/FactView'

vi.mock('@/data', () => ({ addInkSample: vi.fn(async () => {}) }))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() }, speech: { say: vi.fn(async () => {}) } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const ex = makeFactMul(7, 8) // 56
const num = (value: number): Answer => ({ type: 'number', value })

describe('facts answer flow · teaching', () => {
  it('without copyOnReveal, two wrong tries end the exercise as before', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow({ exercise: ex, onAnswered }))
    act(() => result.current.submit(num(49)))
    act(() => result.current.submit(num(54)))
    expect(result.current.phase).toBe('done')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].hintsUsed).toBe(0)
  })

  it('the clue after a wrong try counts as a hint when the child sees it', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow({ exercise: ex, onAnswered, clueCountsAsHint: true }))
    act(() => result.current.submit(num(49)))
    expect(result.current.clue).toMatch(/49 es 7 × 7, la de al lado: te faltan 7/)
    act(() => result.current.submit(num(56)))
    const o = onAnswered.mock.calls[0][0]
    expect(o.check.correct).toBe(true)
    expect(o.hintsUsed).toBe(1)
    expect(o.retries).toBe(1)
  })

  it('with copyOnReveal the child writes the answer; the exercise ends graded wrong, with one retry', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow({ exercise: ex, onAnswered, copyOnReveal: true }))
    act(() => result.current.submit(num(49)))
    act(() => result.current.submit(num(54)))
    expect(result.current.phase).toBe('copy')
    expect(result.current.clue).toBe('Es 56. ¡Escríbelo tú!')
    expect(onAnswered).not.toHaveBeenCalled()
    act(() => result.current.submit(num(56)))
    expect(result.current.phase).toBe('done')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    const o = onAnswered.mock.calls[0][0]
    expect(o.check.correct).toBe(false)
    expect(o.check.given).toBe('54')
    expect(o.retries).toBe(1)
  })

  it('two misses while copying end the exercise anyway', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const { result } = renderHook(() => useAnswerFlow({ exercise: ex, onAnswered, copyOnReveal: true }))
    act(() => result.current.submit(num(49)))
    act(() => result.current.submit(num(54)))
    act(() => result.current.submit(num(65)))
    expect(result.current.phase).toBe('copy')
    expect(result.current.clue).toBe('Es 56. Escríbelo igual que está.')
    act(() => result.current.submit(num(65)))
    expect(result.current.phase).toBe('done')
    expect(onAnswered).toHaveBeenCalledTimes(1)
  })
})

function host(voice = false) {
  return {
    reportAttempt: vi.fn(), react: vi.fn(), rng: () => 0.5, mastery: {}, t: (s: string) => s,
    prefs: { timedActivities: true, bigCells: false, voice, handedness: 'right' },
  } as never
}

describe('FactView · teach', () => {
  it('hidden feedback and no teach: nothing shows after a wrong try (placement, the check before a class)', async () => {
    const user = userEvent.setup()
    render(<ActivityHostProvider value={host()}><FactView exercise={ex} onAnswered={() => {}} showFeedback={false} /></ActivityHostProvider>)
    await user.keyboard('49{Enter}')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('«full»: the trick after the first miss; the worked step and copying after the second', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    render(<ActivityHostProvider value={host(true)}><FactView exercise={ex} onAnswered={onAnswered} showFeedback={false} teach="full" /></ActivityHostProvider>)
    await user.keyboard('49{Enter}')
    expect(screen.getByRole('status').textContent).toMatch(/5, 6, 7, 8/)
    expect(speech.say).toHaveBeenCalledWith(expect.stringContaining('49 es 7 por 7'))
    await user.keyboard('54{Enter}')
    expect(screen.getByRole('status').textContent).toBe('Es 56. ¡Escríbelo tú!')
    expect(screen.getByTestId('fact-worked').textContent).toContain('35 + 21 = 56')
    expect(screen.queryByRole('button', { name: /Pista/ })).toBeNull()
    expect(onAnswered).not.toHaveBeenCalled()
    await user.keyboard('56{Enter}')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('«clue» (warm-up): the trick after the first miss, and no copying', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    render(<ActivityHostProvider value={host()}><FactView exercise={ex} onAnswered={onAnswered} showFeedback={false} allowHints={false} teach="clue" /></ActivityHostProvider>)
    await user.keyboard('49{Enter}')
    expect(screen.getByRole('status').textContent).toMatch(/5, 6, 7, 8/)
    await user.keyboard('54{Enter}')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('fact-worked')).toBeNull()
  })
})
