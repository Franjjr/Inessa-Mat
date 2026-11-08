/* The sign-in screen: a wrong password offers a reset code, the sign-in and reset codes are typed in the app, and ?email=
   fills the address. */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ useAuth: vi.fn(), useAuthExtras: vi.fn(), updatePassword: vi.fn(), acceptInvite: vi.fn(), useChildren: vi.fn(), googleClientId: () => null }))
vi.mock('@/data', () => data)

import LoginScreen from './LoginScreen'

const dataError = (code: string, message: string) => Object.assign(new Error(message), { name: 'DataError', code })

function auth(over: Record<string, unknown> = {}) {
  const a = {
    status: 'anonymous', backendAvailable: true,
    signInWithPassword: vi.fn().mockResolvedValue(undefined), sendMagicLink: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined), verifyEmailCode: vi.fn().mockResolvedValue(undefined), ...over,
  }
  data.useAuth.mockReturnValue(a)
  return a
}

const renderAt = (url = '/login') => render(<MemoryRouter initialEntries={[url]}><LoginScreen /></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  data.useAuthExtras.mockReturnValue({ offline: false, passwordRecovery: false })
  data.useChildren.mockReturnValue([])
})

describe('LoginScreen', () => {
  it('?email= fills the address', () => {
    auth()
    renderAt('/login?email=fran%40example.com')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('fran@example.com')
  })

  it('a wrong password offers a code to choose a new one, which leads to the code step', async () => {
    const a = auth({ signInWithPassword: vi.fn().mockRejectedValue(dataError('invalid-credentials', 'El correo o la contraseña no son correctos.')) })
    renderAt('/login?email=fran%40example.com')
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    fireEvent.click(await screen.findByRole('button', { name: /La has olvidado/ }))
    await waitFor(() => expect(a.resetPassword).toHaveBeenCalledWith('fran@example.com'))
    fireEvent.change(await screen.findByLabelText('Código del correo'), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    await waitFor(() => expect(a.verifyEmailCode).toHaveBeenCalledWith('fran@example.com', '654321', 'recovery'))
  })

  it('«Entrar con un código por correo» sends the code and signs in with it; a wrong code says so', async () => {
    const verifyEmailCode = vi.fn()
      .mockRejectedValueOnce(dataError('wrong-otp', 'Ese código no es correcto o ha caducado. Revisa los números o pide otro.'))
      .mockResolvedValueOnce(undefined)
    const a = auth({ verifyEmailCode })
    renderAt('/login?email=fran%40example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar con un código por correo' }))
    await waitFor(() => expect(a.sendMagicLink).toHaveBeenCalledWith('fran@example.com'))
    expect(await screen.findByText(/Escribe aquí el código que trae/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Código del correo'), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese código no es correcto o ha caducado')
    fireEvent.change(screen.getByLabelText('Código del correo'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(verifyEmailCode).toHaveBeenLastCalledWith('fran@example.com', '123456', 'login'))
  })

  it('other sign-in errors do not offer the reset', async () => {
    auth({ signInWithPassword: vi.fn().mockRejectedValue(dataError('rate-limited', 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.')) })
    renderAt('/login?email=fran%40example.com')
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos')
    expect(screen.queryByRole('button', { name: /La has olvidado/ })).not.toBeInTheDocument()
  })
})
