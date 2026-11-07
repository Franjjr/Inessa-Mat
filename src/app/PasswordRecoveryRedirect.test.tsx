/* A reset e-mail's link that lands on any page takes the adult to the new-password step. */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ useAuthExtras: vi.fn(), useActiveChild: vi.fn() }))
vi.mock('@/data', () => data)
vi.mock('./EntryScreen', () => ({ default: () => <p>ENTRY</p> }))
vi.mock('@/adult/auth/LoginScreen', () => ({ default: () => <p>LOGIN</p> }))

import { AppRoutes } from './routes'

describe('PasswordRecoveryRedirect', () => {
  it('in recovery mode, the landing page goes to /login', async () => {
    data.useAuthExtras.mockReturnValue({ offline: false, passwordRecovery: true })
    render(<MemoryRouter initialEntries={['/']}><AppRoutes /></MemoryRouter>)
    expect(await screen.findByText('LOGIN')).toBeInTheDocument()
  })

  it('otherwise the landing page stays', async () => {
    data.useAuthExtras.mockReturnValue({ offline: false, passwordRecovery: false })
    render(<MemoryRouter initialEntries={['/']}><Routes><Route path="*" element={<AppRoutes />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('ENTRY')).toBeInTheDocument()
  })
})
