/* Bubbles: the countdown only runs for facts the child knows; a wrong tap spends its bubble and the second one shows the
   answer; running out of time is not logged as a wrong fact. */
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActivityConfig, ActivityHost, MasteryMap } from '@/types'
import { ActivityHostProvider } from '@/activities/host'
import BubblesActivity, { distractors } from './index'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}), stop: vi.fn() },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const config: ActivityConfig = {
  kind: 'bubbles', title: 'Burbujas del bosque', instructions: '', selector: { kinds: ['fact-mul'], tables: [6] }, count: 2,
  params: { choices: 4 },
}

/** A host whose every fact has the given mastery box (or none at all). */
function host(box: number | null): ActivityHost & { reportAttempt: ReturnType<typeof vi.fn> } {
  const mastery: MasteryMap = box === null
    ? {}
    : new Proxy({} as MasteryMap, {
      get: () => ({ box, attempts: 5, correct: 5, streak: 3, avgMs: 900, lastSeenAt: null, dueAt: null, skill: 'x' }) as never,
    })
  return {
    reportAttempt: vi.fn(),
    react: vi.fn(),
    rng: (() => {
      let seed = 11
      return () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
      }
    })(),
    mastery,
    t: (s: string) => s,
    prefs: { timedActivities: true, bigCells: false, voice: false, handedness: 'right', subMethod: 'borrow', divMethod: 'galera', tableMethod: null },
  } as never
}

/** Advances the fake clock in small steps: each step lets React render the effects it schedules. */
async function wait(ms: number) {
  for (let t = 0; t < ms; t += 100) await act(() => vi.advanceTimersByTimeAsync(100))
}

/** The product of the question on screen, read from its equation. */
function productOnScreen(container: HTMLElement): number {
  const eq = container.querySelector('[class*="equation"]')!
  const [a, , b] = [...eq.querySelectorAll('span')].map((x) => Number(x.textContent))
  return a * b
}

function bubble(value: number) {
  return screen.getByRole('button', { name: `Burbuja ${value}` }) as HTMLButtonElement
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
})

function renderBubbles(h: ReturnType<typeof host>) {
  return render(
    <ActivityHostProvider value={h}>
      <BubblesActivity config={config} onDone={() => {}} onExit={() => {}} />
    </ActivityHostProvider>,
  )
}

describe('BubblesActivity timing', () => {
  it('a fact the child does not know yet is never timed', async () => {
    const h = host(null)
    const { container } = renderBubbles(h)
    expect(screen.getByText('Sin prisa')).toBeTruthy()
    expect(container.querySelector('[class*="timer"]')).toBeNull()
    await wait(13000)
    expect(screen.queryByText(/Se fueron volando/)).toBeNull()
  })

  it('running out of time on a known fact is not logged as a wrong fact', async () => {
    const h = host(3)
    renderBubbles(h)
    await wait(12500)
    expect(screen.getByText(/Se fueron volando/)).toBeTruthy()
    expect(h.reportAttempt).not.toHaveBeenCalled()
  })
})

describe('BubblesActivity wrong taps', () => {
  it('a wrong tap spends its bubble, and the second wrong tap shows the answer', async () => {
    const h = host(null)
    const { container } = renderBubbles(h)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const answer = productOnScreen(container)
    const wrong = [...screen.getAllByRole('button')].filter((b) => /^Burbuja /.test(b.getAttribute('aria-label') ?? '') && b.getAttribute('aria-label') !== `Burbuja ${answer}`)
    const first = Number(wrong[0].getAttribute('aria-label')!.replace('Burbuja ', ''))
    const second = Number(wrong[1].getAttribute('aria-label')!.replace('Burbuja ', ''))

    await user.click(bubble(first))
    expect(bubble(first).disabled).toBe(true)
    expect(bubble(answer).disabled).toBe(false)

    await user.click(bubble(second))
    expect(screen.getByText(new RegExp(`La respuesta era ${answer}`))).toBeTruthy()
    // One logged attempt for the question, however many taps it took.
    expect(h.reportAttempt).toHaveBeenCalledTimes(1)
    expect(h.reportAttempt.mock.calls[0][0].check.correct).toBe(false)
  })
})

describe('MD-8: no bubble is a + b', () => {
  it('for the facts of the tables (1 to 10 by 1 to 10), no distractor equals a + b, and there are always enough', () => {
    const bad: string[] = []
    let facts = 0
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        facts++
        const d = distractors(a, b)
        if (a * b !== a + b && d.includes(a + b)) bad.push(`${a}×${b}`)
        expect(d.length).toBeGreaterThanOrEqual(5)
        expect(d).not.toContain(a * b)
      }
    }
    expect(facts).toBe(100)
    expect(bad).toEqual([])
  })
})
