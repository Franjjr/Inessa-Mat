/* «Completa tu cuenta»: the name comes from Google, ready to change; it asks family or school, its name and the privacy
   policy before saving. After sign-in, an account with no organisation sees it first. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({
  useAuth: vi.fn(), useAuthExtras: vi.fn(), useChildren: vi.fn(), useSyncStatus: vi.fn(),
  completeAccount: vi.fn(), suggestedDisplayName: vi.fn(), claimLocalData: vi.fn(), lockAdultArea: vi.fn(),
}))
vi.mock('@/data', () => data)

import { CompleteAccountPanel } from './CompleteAccountPanel'
import { AfterSignIn } from './AfterSignIn'

function auth(over: Record<string, unknown> = {}) {
  const a = { status: 'signed-in', user: { id: 'u1', email: 'marta@gmail.com' }, profile: { displayName: 'marta' }, memberships: [], organizations: [], activeOrg: null, signOut: vi.fn(), ...over }
  data.useAuth.mockReturnValue(a)
  return a
}

beforeEach(() => {
  vi.clearAllMocks()
  data.useAuthExtras.mockReturnValue({ offline: false, passwordRecovery: false })
  data.useChildren.mockReturnValue([])
  data.useSyncStatus.mockReturnValue({ lastSyncedAt: null })
  data.suggestedDisplayName.mockResolvedValue('Marta Ruiz')
  data.completeAccount.mockResolvedValue(undefined)
})

describe('CompleteAccountPanel', () => {
  it('fills the name from Google and asks for the rest before saving', async () => {
    auth()
    render(<MemoryRouter><CompleteAccountPanel /></MemoryRouter>)
    expect(await screen.findByDisplayValue('Marta Ruiz')).toBeInTheDocument()
    expect(screen.getByText('marta@gmail.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(await screen.findByText('Elige si lo usarás en familia o en colegio.')).toBeInTheDocument()
    expect(screen.getByText(/lee y acepta la política de privacidad/)).toBeInTheDocument()
    expect(data.completeAccount).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('radio', { name: /Familia/ }))
    fireEvent.change(screen.getByLabelText('Nombre de tu familia'), { target: { value: 'Familia Ruiz' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    await waitFor(() => expect(data.completeAccount).toHaveBeenCalledWith({ displayName: 'Marta Ruiz', orgKind: 'family', orgName: 'Familia Ruiz' }))
  })

  it('«No es mi cuenta» signs out', () => {
    const a = auth()
    render(<MemoryRouter><CompleteAccountPanel /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'No es mi cuenta: cerrar sesión' }))
    expect(a.signOut).toHaveBeenCalled()
  })
})

describe('AfterSignIn', () => {
  it('an account with no family or school completes it first', () => {
    auth()
    render(<MemoryRouter><AfterSignIn next="/adult" /></MemoryRouter>)
    expect(screen.getByRole('form', { name: 'Completa tu cuenta' })).toBeInTheDocument()
  })

  it('offline, or when the account did not load, it does not ask (it could create a second family)', () => {
    auth({ profile: null })
    const { unmount } = render(<MemoryRouter><AfterSignIn next="/adult" /></MemoryRouter>)
    expect(screen.queryByRole('form', { name: 'Completa tu cuenta' })).not.toBeInTheDocument()
    unmount()
    auth()
    data.useAuthExtras.mockReturnValue({ offline: true, passwordRecovery: false })
    render(<MemoryRouter><AfterSignIn next="/adult" /></MemoryRouter>)
    expect(screen.queryByRole('form', { name: 'Completa tu cuenta' })).not.toBeInTheDocument()
  })
})
