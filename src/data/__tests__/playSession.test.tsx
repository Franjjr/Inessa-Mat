/* usePlaySession: a screen outside GameHostProvider (Caligrafía) writes its play session down, marked with its subject. */
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createChild, listSessions, usePlaySession } from '@/data'
import { LUNA, resetAll } from './helpers'

beforeEach(async () => {
  await resetAll()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePlaySession', () => {
  it('starts a session marked handwriting on mount and ends it with the tally on unmount', async () => {
    const c = await createChild({ nickname: 'Lía', gender: 'f', companion: LUNA })
    const { result, unmount } = renderHook(() => usePlaySession(c.id, 'handwriting'))
    await waitFor(() => expect(result.current.current.id).toBeTruthy())
    const id = result.current.current.id
    const [open] = await listSessions(c.id)
    expect(open).toMatchObject({ id, endedAt: null, summary: { subject: 'handwriting' } })

    result.current.current.attempts = 3
    result.current.current.correct = 2
    unmount()
    await waitFor(async () => expect((await listSessions(c.id))[0].endedAt).toBeTruthy())
    const [done] = await listSessions(c.id)
    expect(done.summary).toMatchObject({ attempts: 3, correct: 2, subject: 'handwriting' })
  })

  it('a maths session carries no subject mark', async () => {
    const c = await createChild({ nickname: 'Lía', gender: 'f', companion: LUNA })
    const { result, unmount } = renderHook(() => usePlaySession(c.id, 'math'))
    await waitFor(() => expect(result.current.current.id).toBeTruthy())
    expect((await listSessions(c.id))[0].summary).toBeNull()
    unmount()
    await waitFor(async () => expect((await listSessions(c.id))[0].endedAt).toBeTruthy())
    expect((await listSessions(c.id))[0].summary?.subject).toBeUndefined()
  })

  it('does nothing without a child', () => {
    const { result } = renderHook(() => usePlaySession(null, 'handwriting'))
    expect(result.current.current.id).toBeNull()
  })

  it('counts active time, not the wall clock: a screen left open for hours writes at most a few minutes', async () => {
    const c = await createChild({ nickname: 'Lía', gender: 'f', companion: LUNA })
    const { result, unmount } = renderHook(() => usePlaySession(c.id, 'handwriting'))
    await waitFor(() => expect(result.current.current.id).toBeTruthy())
    const later = Date.now() + 3 * 60 * 60_000
    vi.spyOn(Date, 'now').mockReturnValue(later)
    unmount()
    await waitFor(async () => expect((await listSessions(c.id))[0].endedAt).toBeTruthy())
    const [done] = await listSessions(c.id)
    expect(done.minutes).toBeLessThanOrEqual(10)
  })
})
