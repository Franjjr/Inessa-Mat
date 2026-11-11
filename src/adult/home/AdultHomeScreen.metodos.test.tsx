/* The grown-ups' start page asks how the child's school subtracts (from 2.º, until answered, never blocking), and
   tells once that a retired method (saltos en la recta) is now the school one. */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile } from '@/types'

const store = vi.hoisted(() => ({ kids: [] as ChildProfile[] }))
const updateChild = vi.hoisted(() => vi.fn(async (id: string, patch: { settings?: Partial<ChildProfile['settings']> }) => {
  store.kids = store.kids.map((k) => (k.id === id ? { ...k, settings: { ...k.settings, ...(patch.settings ?? {}) } } : k))
  return store.kids.find((k) => k.id === id)
}))
vi.mock('@/data', () => ({
  updateChild,
  useChildren: () => store.kids,
  getChildSummary: () => new Promise(() => {}),
  useAuth: () => ({ status: 'local-only', activeOrg: null, organizations: [], setActiveOrg: () => {}, backendAvailable: false }),
}))
vi.mock('../auth/CompleteAccountPanel', () => ({ CompleteAccountPanel: () => null, useNeedsAccountSetup: () => false }))
vi.mock('../shared/ClaimLocalPanel', () => ({ ClaimLocalPanel: () => null }))
vi.mock('../shared/SyncBadge', () => ({ SyncBadge: () => null }))
vi.mock('../shared/PersistenceNotice', () => ({ PersistenceNotice: () => null }))
vi.mock('../gate/AdultGate', () => ({ lockAdultArea: () => {} }))
vi.mock('@/art', () => ({ CompanionArt: () => null }))

import AdultHomeScreen from './AdultHomeScreen'

const kid = (settings: Partial<ChildProfile['settings']> = {}, grade = 3): ChildProfile => ({
  id: 'k1', orgId: null, nickname: 'Inés', gender: 'f', grade,
  companion: { species: 'fox', name: 'Pipo', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, ...settings },
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})

const page = () => <MemoryRouter><AdultHomeScreen /></MemoryRouter>
const QUESTION = /Falta un dato para que las restas de Inés sean como en su cole/

beforeEach(() => updateChild.mockClear())

describe('the school-method question on the start page', () => {
  it('shows with schoolMethodAsked false and 2.º or more, and goes away once answered', async () => {
    store.kids = [kid({ schoolMethodAsked: false }, 2)]
    const { rerender } = render(page())
    expect(screen.getByRole('heading', { name: QUESTION })).toBeTruthy()
    // Not blocking: the rest of the page is still there.
    expect(screen.getByRole('heading', { name: 'Tablas de multiplicar' })).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Como en A' })) })
    expect(updateChild).toHaveBeenCalledWith('k1', { settings: expect.objectContaining({ subMethod: 'borrow', schoolMethodAsked: true }) })
    rerender(page())
    await waitFor(() => expect(screen.queryByRole('heading', { name: QUESTION })).toBeNull())
  })

  it('a profile saved before the question existed (no field) is asked too; 1.º is not', () => {
    const old = kid({}, 3)
    delete (old.settings as Partial<ChildProfile['settings']>).schoolMethodAsked
    store.kids = [old]
    const { unmount } = render(page())
    expect(screen.getByRole('heading', { name: QUESTION })).toBeTruthy()
    unmount()
    store.kids = [kid({}, 1)]
    render(page())
    expect(screen.queryByRole('heading', { name: QUESTION })).toBeNull()
  })

  it('answered: no question', () => {
    store.kids = [kid({ schoolMethodAsked: true }, 3)]
    render(page())
    expect(screen.queryByRole('heading', { name: QUESTION })).toBeNull()
  })
})

describe('the note about the retired methods', () => {
  it('a profile with «line» saved shows «Hemos quitado los saltos» once: after «Entendido» it never comes back', async () => {
    store.kids = [kid({ subMethod: 'line', schoolMethodAsked: true })]
    const { rerender, unmount } = render(page())
    const note = screen.getByRole('region', { name: 'Cambio en las restas' })
    expect(note.textContent).toContain('Hemos quitado los saltos: ahora resta como en el cole.')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entendido' })) })
    expect(updateChild).toHaveBeenCalledWith('k1', { settings: expect.objectContaining({ subMethod: 'borrow' }) })
    expect(store.kids[0].settings.subMethod).toBe('borrow')
    rerender(page())
    expect(screen.queryByRole('region', { name: 'Cambio en las restas' })).toBeNull()
    // Opening the page again later: still gone.
    unmount()
    render(page())
    expect(screen.queryByText(/Hemos quitado/)).toBeNull()
  })

  it('a retired division method tells about the galera; a school method shows nothing', () => {
    store.kids = [kid({ divMethod: 'climb', schoolMethodAsked: true })]
    const { unmount } = render(page())
    expect(screen.getByRole('region', { name: 'Cambio en las restas' }).textContent).toMatch(/dividirá con la galera/)
    unmount()
    store.kids = [kid({ subMethod: 'carry', divMethod: 'galera-short', schoolMethodAsked: true })]
    render(page())
    expect(screen.queryByText(/Hemos quitado/)).toBeNull()
  })
})
