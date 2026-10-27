import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { SyncStatus } from '@/data'
import EntryScreen, { FIRST_PULL_WAIT_MS } from './EntryScreen'

const state = vi.hoisted(() => ({
  auth: { status: 'signed-in' } as { status: string },
  children: [] as unknown[] | undefined,
  sync: { state: 'syncing', pending: 0, lastSyncedAt: null } as SyncStatus,
}))
vi.mock('@/data', () => ({
  useAuth: () => state.auth,
  useChildren: () => state.children,
  useSyncStatus: () => state.sync,
}))

function renderEntry() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<EntryScreen />} />
        <Route path="/kids/new" element={<div>NEW</div>} />
        <Route path="/kids" element={<div>KIDS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EntryScreen on a new device of a signed-in adult', () => {
  beforeEach(() => {
    state.auth = { status: 'signed-in' }
    state.children = []
    state.sync = { state: 'syncing', pending: 0, lastSyncedAt: null }
  })

  it('waits for the account children instead of sending the adult to create one again', () => {
    const { rerender } = renderEntry()
    expect(screen.getByRole('status')).toHaveTextContent('Buscando los perfiles de tu cuenta')
    expect(screen.queryByText('NEW')).toBeNull()
    // The first pull brings the child created on the other device.
    state.children = [{ id: 'kid' }]
    state.sync = { state: 'idle', pending: 0, lastSyncedAt: '2026-10-27T10:00:00Z' }
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<EntryScreen />} />
          <Route path="/kids/new" element={<div>NEW</div>} />
          <Route path="/kids" element={<div>KIDS</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('KIDS')).toBeInTheDocument()
  })

  it('offers to create a child once a sync has finished and the account has none', () => {
    state.sync = { state: 'idle', pending: 0, lastSyncedAt: '2026-10-27T10:00:00Z' }
    renderEntry()
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('does not wait when offline, nor forever', () => {
    state.sync = { state: 'offline', pending: 0, lastSyncedAt: null }
    const first = renderEntry()
    expect(screen.getByText('NEW')).toBeInTheDocument()
    first.unmount()
    vi.useFakeTimers()
    state.sync = { state: 'syncing', pending: 0, lastSyncedAt: null }
    renderEntry()
    expect(screen.queryByText('NEW')).toBeNull()
    act(() => { vi.advanceTimersByTime(FIRST_PULL_WAIT_MS + 1) })
    expect(screen.getByText('NEW')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
