import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { initialProgress } from '@/content'
import { CHILD_ID, makeChild } from '@/world/rewards/testing'
import ChildHomeScreen from './ChildHomeScreen'

const state = vi.hoisted(() => ({ flags: {} as Record<string, boolean> }))

vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return {
    ...actual,
    useActiveChild: () => ({ child: makeChild({ grade: 3 }), loading: false, setActiveChild: () => {} }),
    useProgress: () => ({ ...initialProgress(CHILD_ID), flags: state.flags }),
    useMastery: () => ({}),
    useSyncStatus: () => ({ state: 'idle' }),
    listAssignmentsForChild: async () => [],
    updateProgress: vi.fn(async () => undefined),
  }
})

function primaries() {
  return [...document.querySelectorAll('[data-primary="true"]')].map((el) => el.textContent ?? '')
}

describe('ChildHomeScreen: one main action on the first day', () => {
  it('a new girl (placement test pending) has a single primary button: the test', () => {
    state.flags = {}
    render(<MemoryRouter><ChildHomeScreen /></MemoryRouter>)
    const found = primaries()
    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/prueba inicial/)
    expect(screen.getByText('¡Empezar la clase!').closest('button')).not.toHaveAttribute('data-primary')
  })

  it('once the test is done, «Hoy» is the single primary button', () => {
    state.flags = { placement: true }
    render(<MemoryRouter><ChildHomeScreen /></MemoryRouter>)
    const found = primaries()
    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/Hoy aprendemos/)
  })
})
