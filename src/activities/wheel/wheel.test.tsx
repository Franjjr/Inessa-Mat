/* The wheel: a wrong fact comes back later in the run, its product shows in the ring only when it has no more chances,
   and after the help the child writes the answer (teach 'full'). */
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActivityConfig, ActivityHost } from '@/types'
import { ActivityHostProvider } from '@/activities/host'
import WheelActivity from './index'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}) },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const config: ActivityConfig = {
  kind: 'wheel', title: 'La rueda del 6', instructions: '', selector: { kinds: ['fact-mul'], tables: [6] }, count: 2,
  params: { center: 6, numbers: [2, 3] },
}

function host(): ActivityHost & { reportAttempt: ReturnType<typeof vi.fn> } {
  return {
    reportAttempt: vi.fn(),
    react: vi.fn(),
    rng: () => 0.5,
    mastery: {},
    t: (s: string) => s,
    prefs: { timedActivities: true, bigCells: false, voice: false, handedness: 'right', subMethod: 'borrow', divMethod: 'galera', tableMethod: null },
  } as never
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
})

function renderWheel(h: ReturnType<typeof host>) {
  return render(
    <ActivityHostProvider value={h}>
      <WheelActivity config={config} onDone={() => {}} onExit={() => {}} />
    </ActivityHostProvider>,
  )
}

describe('WheelActivity', () => {
  it('asks a wrong number again later in the run, and the product stays hidden until then', async () => {
    const h = host()
    const { container } = renderWheel(h)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    // 6 × 2: two wrong tries, then the child writes the answer after the help.
    await user.keyboard('1{Enter}')
    await user.keyboard('1{Enter}')
    await user.keyboard('12{Enter}')
    expect(h.reportAttempt).toHaveBeenCalledTimes(1)
    expect(h.reportAttempt.mock.calls[0][0].check.correct).toBe(false)
    // Still a chance to come back: the slot is not revealed yet.
    expect(container.querySelector('[data-state="revealed"]')).toBeNull()

    // 6 × 3 right, then the re-ask of 6 × 2 comes up.
    await act(() => vi.advanceTimersByTimeAsync(1200))
    await user.keyboard('18{Enter}')
    await act(() => vi.advanceTimersByTimeAsync(1200))
    expect(screen.getByText(/Otra vez/)).toBeTruthy()
    expect(screen.getByText(/Número 1 de 2: 2/)).toBeTruthy()

    // The re-ask is answered right: it is practice, so it is not reported again.
    await user.keyboard('12{Enter}')
    expect(h.reportAttempt).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[data-state="done"]')).not.toBeNull()
  })

  it('reveals the product in its slot once a wrong fact has no more chances', async () => {
    const h = host()
    const { container } = renderWheel(h)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    // The first fact: wrong, then the re-ask wrong too (two tries and the copy step each time).
    await user.keyboard('1{Enter}')
    await user.keyboard('1{Enter}')
    await user.keyboard('12{Enter}')
    await act(() => vi.advanceTimersByTimeAsync(1200))
    await user.keyboard('18{Enter}')
    await act(() => vi.advanceTimersByTimeAsync(1200))
    await user.keyboard('1{Enter}')
    await user.keyboard('1{Enter}')
    await user.keyboard('12{Enter}')
    expect(container.querySelector('[data-state="revealed"]')).not.toBeNull()
  })
})
