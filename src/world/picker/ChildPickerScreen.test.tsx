/* «¿Quién juega hoy?»: with an account, «Cerrar sesión» asks first; confirming locks the adult area, signs out and goes
   to the front page. Without an account there is no such button. */
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ useAuth: vi.fn(), useChildren: vi.fn(), useActiveChild: vi.fn() }))
vi.mock('@/data', () => data)
vi.mock('@/art', () => ({ CompanionArt: () => null, WorldBackground: () => null }))
vi.mock('@/content', () => ({ speciesNoun: () => ({ noun: 'gato' }) }))
const gate = vi.hoisted(() => ({ lockAdultArea: vi.fn() }))
vi.mock('@/adult/gate/AdultGate', () => gate)

import ChildPickerScreen from './ChildPickerScreen'

const child = { id: 'c1', nickname: 'Inés', companion: { name: 'Luna', species: 'cat', colorway: 'a', gender: 'f', equipped: [] } }

function renderPicker() {
  return render(
    <MemoryRouter initialEntries={['/kids']}>
      <Routes>
        <Route path="/kids" element={<ChildPickerScreen />} />
        <Route path="/welcome" element={<p>Portada</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  data.useChildren.mockReturnValue([child])
  data.useActiveChild.mockReturnValue({ setActiveChild: vi.fn() })
})

describe('ChildPickerScreen · cerrar sesión', () => {
  it('asks first; cancelling keeps the session', () => {
    const signOut = vi.fn()
    data.useAuth.mockReturnValue({ status: 'signed-in', user: { id: 'u', email: 'fran@example.com' }, signOut })
    renderPicker()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByText(/fran@example.com/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(signOut).not.toHaveBeenCalled()
  })

  it('confirming locks the adult area, signs out and goes to the front page', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    data.useAuth.mockReturnValue({ status: 'signed-in', user: { id: 'u', email: 'fran@example.com' }, signOut })
    renderPicker()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    const buttons = screen.getAllByRole('button', { name: 'Cerrar sesión' })
    fireEvent.click(buttons[buttons.length - 1])
    expect(await screen.findByText('Portada')).toBeInTheDocument()
    expect(gate.lockAdultArea).toHaveBeenCalled()
    expect(signOut).toHaveBeenCalled()
  })

  it('without an account there is no «Cerrar sesión»', () => {
    data.useAuth.mockReturnValue({ status: 'local-only', user: null, signOut: vi.fn() })
    renderPicker()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })
})
