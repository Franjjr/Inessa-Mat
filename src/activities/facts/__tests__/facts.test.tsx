/* Tests for the facts views and the calm-practice activity, with a mock activity host. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { makeFactMul, makeSkipCount, makeMissingFactor } from '@/engine'
import type { ActivityHost, ActivityConfig } from '@/types'
import { ActivityHostProvider } from '../../host'
import FactView from '../../views/FactView'
import MissingFactorView from '../../views/MissingFactorView'
import SkipCountView from '../../views/SkipCountView'
import FactsActivity from '../index'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}) },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

function mockHost(overrides: Partial<ActivityHost> = {}): ActivityHost & { reportAttempt: ReturnType<typeof vi.fn>; react: ReturnType<typeof vi.fn> } {
  let seed = 7
  return {
    reportAttempt: vi.fn(),
    react: vi.fn(),
    rng: () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    },
    mastery: {},
    t: (s: string) => s.replace(/\{child\}/g, 'Inessa'),
    prefs: { timedActivities: true, bigCells: false, voice: false, handedness: 'right' },
    ...overrides,
  } as never
}

function wrap(host: ActivityHost, node: React.ReactNode) {
  return <ActivityHostProvider value={host}>{node}</ActivityHostProvider>
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('FactView', () => {
  it('accepts keyboard input and finishes on a correct answer', async () => {
    const onAnswered = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(wrap(mockHost(), <FactView exercise={makeFactMul(7, 6)} onAnswered={onAnswered} />))
    await user.keyboard('42{Enter}')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    const outcome = onAnswered.mock.calls[0][0]
    expect(outcome.check.correct).toBe(true)
    expect(outcome.hintsUsed).toBe(0)
  })

  it('gives one retry after a wrong answer, then reveals and finishes', async () => {
    const onAnswered = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(wrap(mockHost(), <FactView exercise={makeFactMul(7, 6)} onAnswered={onAnswered} />))
    await user.keyboard('40{Enter}')
    expect(onAnswered).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).not.toBe('')
    await user.keyboard('41{Enter}')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('escalates hints one level per press', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(wrap(mockHost(), <FactView exercise={makeFactMul(6, 7)} onAnswered={vi.fn()} />))
    const btn = screen.getByRole('button', { name: /Pista/ })
    await user.click(btn)
    expect(screen.getByRole('note').textContent).toContain('Pista 1 de 3')
    fireEvent.click(btn)
    expect(btn.textContent).toContain('Pista 2 de 3')
  })
})

describe('MissingFactorView and SkipCountView', () => {
  it('finishes the missing factor with a typed answer', async () => {
    const onAnswered = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(wrap(mockHost(), <MissingFactorView exercise={makeMissingFactor(6, 7, 'b')} onAnswered={onAnswered} />))
    await user.keyboard('7{Enter}')
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('fills skip-count beads one at a time', async () => {
    const onAnswered = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const ex = makeSkipCount(6, 1, 6, [2, 4])
    render(wrap(mockHost(), <SkipCountView exercise={ex} onAnswered={onAnswered} />))
    await user.keyboard(`${ex.answer[0]}{Enter}`)
    await user.keyboard(`${ex.answer[1]}{Enter}`)
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('facts activity', () => {
  const config: ActivityConfig = {
    kind: 'facts',
    title: 'Práctica tranquila',
    instructions: 'Resuelve con calma.',
    selector: { kinds: ['fact-mul'], tables: [6] },
    count: 2,
  }

  it('reports every attempt and finishes with a result', async () => {
    const host = mockHost()
    const onDone = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(wrap(host, <FactsActivity config={config} onDone={onDone} />))
    for (let i = 0; i < 2; i++) {
      // Two wrong answers finish an item (one clue in between), whatever the fact is.
      await act(async () => {
        await user.keyboard('0{Enter}')
        await user.keyboard('0{Enter}')
      })
      await act(async () => {
        vi.advanceTimersByTime(1500)
      })
    }
    expect(host.reportAttempt).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Seguir' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone.mock.calls[0][0].total).toBe(2)
  })
})
