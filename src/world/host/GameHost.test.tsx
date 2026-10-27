import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useActivityHost } from '@/activities'
import { createChild, getMastery, listAttempts, useActiveChild } from '@/data'
import type { ActivityHost, Exercise } from '@/types'
import { flushTimers, useLocalOnlyAuth } from '../host/testing'
import { GameHostProvider } from './GameHost'
import CompanionBuddy from './CompanionBuddy'

// The activities index also loads the lesson module, which another agent is still building. These tests only need
// the host context and stubs for the two players, so the index is replaced here.
vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  return {
    ActivityHostProvider: host.ActivityHostProvider,
    useActivityHost: host.useActivityHost,
    defaultActivityHost: host.defaultActivityHost,
    ActivityRunner: ({ config }: { config: { kind: string } }) => createElement('div', { 'data-testid': 'activity' }, config.kind),
    LessonPlayer: ({ lesson }: { lesson: { id: string } }) => createElement('div', { 'data-testid': 'lesson' }, lesson.id),
  }
})

/** Makes a child the active one on this device, then unmounts the probe. */
async function activate(childId: string) {
  let set: ((id: string | null) => void) | null = null
  function Probe() {
    const { setActiveChild } = useActiveChild()
    useEffect(() => { set = setActiveChild })
    return null
  }
  const { unmount } = render(<Probe />)
  await waitFor(() => expect(set).not.toBeNull())
  set!(childId)
  await flushTimers(30)
  unmount()
}

const exercise: Exercise = { id: 'mul-6x7', kind: 'fact-mul', skill: 'mul:6x7', difficulty: 2, a: 6, b: 7, answer: 42 }

function Capture({ onHost }: { onHost: (h: ActivityHost) => void }) {
  const host = useActivityHost()
  useEffect(() => { onHost(host) }, [host, onHost])
  return null
}

describe('GameHostProvider', () => {
  useLocalOnlyAuth()

  it('persists attempts and updates mastery for the active child', async () => {
    const child = await createChild({
      nickname: 'Host Test', gender: 'f', companion: { species: 'cat', name: 'Miso', gender: 'f', colorway: 'default', equipped: [] },
    })
    await activate(child.id)

    let host: ActivityHost | null = null
    render(
      <GameHostProvider worldId="w3" nodeId="lesson-x" activity="facts">
        <Capture onHost={(h) => { host = h }} />
      </GameHostProvider>,
    )
    await waitFor(() => expect(host).not.toBeNull())

    // The child may not be loaded yet: keep reporting until the host has a child to write for.
    await waitFor(async () => {
      host!.reportAttempt({ exercise, check: { correct: true, given: '42', expected: '42' }, ms: 2100, inputMode: 'keypad', hintsUsed: 0 })
      const attempts = await listAttempts(child.id)
      expect(attempts.length).toBeGreaterThan(0)
    }, { timeout: 3000 })

    const attempts = await listAttempts(child.id)
    const latest = attempts[0]
    expect(latest.skill).toBe('mul:6x7')
    expect(latest.correct).toBe(true)
    expect(latest.context).toMatchObject({ worldId: 'w3', nodeId: 'lesson-x', activity: 'facts' })

    const mastery = await getMastery(child.id)
    expect(mastery['mul:6x7']).toBeDefined()
    expect(mastery['mul:6x7'].correct).toBeGreaterThan(0)
    expect(mastery['mul:6x7'].attempts).toBeGreaterThan(0)
  })

  it('a non-graded retry is saved with its retries but does not change mastery', async () => {
    const child = await createChild({
      nickname: 'Retry Test', gender: 'f', companion: { species: 'cat', name: 'Nube', gender: 'f', colorway: 'default', equipped: [] },
    })
    await activate(child.id)

    let host: ActivityHost | null = null
    render(
      <GameHostProvider worldId="w3" nodeId="lesson-x" activity="lesson">
        <Capture onHost={(h) => { host = h }} />
      </GameHostProvider>,
    )
    await waitFor(() => expect(host).not.toBeNull())
    const wrong = { correct: false, given: '48', expected: '42' }
    await waitFor(async () => {
      host!.reportAttempt({ exercise, check: wrong, ms: 2000, inputMode: 'keypad', hintsUsed: 0 })
      expect((await listAttempts(child.id)).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    const before = await getMastery(child.id)
    host!.reportAttempt({ exercise, check: { correct: true, given: '42', expected: '42' }, ms: 1500, inputMode: 'keypad', hintsUsed: 0, retries: 1, solvedOnRetry: true, graded: false })

    await waitFor(async () => {
      const latest = (await listAttempts(child.id))[0]
      expect(latest.retries).toBe(1)
      expect(latest.solvedOnRetry).toBe(true)
    })
    const after = await getMastery(child.id)
    expect(after['mul:6x7'].attempts).toBe(before['mul:6x7'].attempts)
    expect(after['mul:6x7'].correct).toBe(before['mul:6x7'].correct)
  })

  it('shows the companion reaction in the buddy when the activity reacts', async () => {
    const child = await createChild({
      nickname: 'Buddy Test', gender: 'm', companion: { species: 'dog', name: 'Toby', gender: 'm', colorway: 'mint', equipped: [] },
    })
    await activate(child.id)

    let host: ActivityHost | null = null
    render(
      <GameHostProvider>
        <Capture onHost={(h) => { host = h }} />
        <CompanionBuddy />
      </GameHostProvider>,
    )
    await waitFor(() => expect(host).not.toBeNull())
    // The child loads asynchronously, so let it arrive before the reaction (a phrase needs a child).
    await flushTimers(150)
    act(() => { host!.react('correct') })
    const bubble = await screen.findByRole('status')
    expect(bubble.textContent?.length ?? 0).toBeGreaterThan(0)
  })

  it('keeps a single speech bubble when reactions follow each other', async () => {
    const child = await createChild({
      nickname: 'Bubble Test', gender: 'f', companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
    })
    await activate(child.id)

    let host: ActivityHost | null = null
    render(
      <GameHostProvider>
        <Capture onHost={(h) => { host = h }} />
        <CompanionBuddy />
      </GameHostProvider>,
    )
    await waitFor(() => expect(host).not.toBeNull())
    await flushTimers(150)
    for (let i = 0; i < 6; i++) act(() => { host!.react(i % 2 ? 'correct' : 'encourage') })
    await screen.findByRole('status')
    // Regression: the bubble and the figures shared a React key, which left orphaned bubbles stacked on screen.
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })
})
