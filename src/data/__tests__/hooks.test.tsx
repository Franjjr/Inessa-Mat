import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createChild, saveMastery, updateChild, updateProgress, useActiveChild, useAuth, useChildren, useMastery, useProgress,
  useSyncStatus,
} from '@/data'
import { db } from '../db'
import { setAuth } from '../store'
import { LUNA, org, resetAll, signIn } from './helpers'

beforeEach(async () => {
  await resetAll()
})

describe('live hooks', () => {
  it('useChildren reacts to writes', async () => {
    const { result } = renderHook(() => useChildren())
    await waitFor(() => expect(result.current).toEqual([]))
    let id = ''
    await act(async () => {
      id = (await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })).id
    })
    await waitFor(() => expect(result.current?.map((c) => c.nickname)).toEqual(['Inessa']))
    await act(async () => {
      await updateChild(id, { nickname: 'Ine' })
    })
    await waitFor(() => expect(result.current?.[0].nickname).toBe('Ine'))
  })

  it('useChildren is undefined while auth is loading', async () => {
    setAuth({ status: 'loading' })
    const { result } = renderHook(() => useChildren())
    await new Promise((r) => setTimeout(r, 30))
    expect(result.current).toBeUndefined()
    act(() => setAuth({ status: 'local-only' }))
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('useActiveChild persists the selection and hides children outside the active org', async () => {
    const a = await createChild({ nickname: 'A', gender: 'f', companion: LUNA })
    const b = await createChild({ nickname: 'B', gender: 'm', companion: LUNA })
    const { result } = renderHook(() => useActiveChild())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.child?.id).toBe(a.id) // first child became active automatically
    act(() => result.current.setActiveChild(b.id))
    await waitFor(() => expect(result.current.child?.id).toBe(b.id))
    expect((await db.meta.get('activeChildId'))?.value).toBe(b.id)
    act(() => result.current.setActiveChild(null))
    await waitFor(() => expect(result.current.child).toBeNull())
  })

  it('useActiveChild returns null for a child of another organization', async () => {
    signIn('u1', [org('fam-a'), org('fam-b')])
    const c = await createChild({ nickname: 'De A', gender: 'f', companion: LUNA })
    const { result } = renderHook(() => useActiveChild())
    await waitFor(() => expect(result.current.child?.id).toBe(c.id))
    act(() => signIn('u1', [org('fam-b'), org('fam-a')]))
    await waitFor(() => expect(result.current.child).toBeNull())
  })

  it('useProgress creates the initial progress and follows updates', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const { result } = renderHook(() => useProgress(c.id))
    await waitFor(() => expect(result.current?.worlds.w1.unlocked).toBe(true))
    await act(async () => {
      await updateProgress(c.id, (s) => ({ ...s, stars: 7 }))
    })
    await waitFor(() => expect(result.current?.stars).toBe(7))
  })

  it('useProgress / useMastery are undefined without a child', async () => {
    const { result } = renderHook(() => [useProgress(null), useMastery(undefined)] as const)
    await new Promise((r) => setTimeout(r, 30))
    expect(result.current).toEqual([undefined, undefined])
  })

  it('useMastery follows saveMastery', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const { result } = renderHook(() => useMastery(c.id))
    await waitFor(() => expect(result.current).toEqual({}))
    const t = new Date().toISOString()
    await act(async () => {
      await saveMastery(c.id, [{ skill: 'mul:7x8', box: 1, attempts: 1, correct: 0, streak: 0, avgMs: null, lastSeenAt: t, dueAt: t, updatedAt: t }])
    })
    await waitFor(() => expect(result.current?.['mul:7x8']?.box).toBe(1))
  })

  it('useAuth exposes a local-only state without backend; useSyncStatus says local-only', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), sync: useSyncStatus() }))
    expect(result.current.auth.backendAvailable).toBe(false)
    expect(result.current.auth.status).toBe('local-only')
    expect(result.current.sync.state).toBe('local-only')
    await expect(result.current.auth.signInWithPassword('a@b.es', 'x')).rejects.toMatchObject({ code: 'no-backend' })
  })
})
