import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ useAuth: vi.fn(), acceptInvite: vi.fn(), useChildren: vi.fn() }))
vi.mock('@/data', () => data)

import SignupScreen from './SignupScreen'
import { validateSignup, validateNewPassword, type SignupInput } from './validation'

const EMPTY: SignupInput = {
  displayName: '',
  email: '',
  password: '',
  confirm: '',
  orgKind: null,
  orgName: '',
  acceptedPrivacy: false,
}

describe('validateSignup', () => {
  it('reports every missing field in Spanish', () => {
    const errors = validateSignup(EMPTY)
    expect(errors.displayName).toBe('Escribe tu nombre.')
    expect(errors.email).toBe('Escribe tu correo electrónico.')
    expect(errors.password).toBe('La contraseña necesita al menos 8 caracteres.')
    expect(errors.orgKind).toBe('Elige si lo usarás en familia o en colegio.')
    expect(errors.acceptedPrivacy).toMatch(/política de privacidad/)
  })

  it('accepts a complete family sign-up', () => {
    const errors = validateSignup({
      displayName: 'Fran',
      email: 'fran@example.com',
      password: 'abcdef12',
      confirm: 'abcdef12',
      orgKind: 'family',
      orgName: 'Familia Julián',
      acceptedPrivacy: true,
    })
    expect(errors).toEqual({})
  })

  it('asks for the school name only in the school case, and checks the passwords match', () => {
    const errors = validateSignup({
      ...EMPTY,
      displayName: 'Profe',
      email: 'profe@colegio.es',
      password: 'abcdef12',
      confirm: 'otra12345',
      orgKind: 'school',
      orgName: ' ',
      acceptedPrivacy: true,
    })
    expect(errors.confirm).toBe('Las contraseñas no coinciden.')
    expect(errors.orgName).toBe('Escribe el nombre del colegio.')
  })

  it('wants letters and numbers in the password', () => {
    expect(validateNewPassword('solotextos')).toMatch(/Mezcla letras y números/)
    expect(validateNewPassword('12345678')).toMatch(/Mezcla letras y números/)
    expect(validateNewPassword('abc12345')).toBeNull()
  })

  it('rejects malformed e-mail addresses', () => {
    expect(validateSignup({ ...EMPTY, email: 'no-es-correo' }).email).toMatch(/no parece válido/)
  })
})

describe('SignupScreen form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    data.useAuth.mockReturnValue({ status: 'anonymous', backendAvailable: true, signUp: vi.fn().mockResolvedValue(undefined) })
    data.useChildren.mockReturnValue([])
  })

  it('shows validation messages instead of submitting an empty form', async () => {
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Escribe tu nombre.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu correo electrónico.')).toBeInTheDocument()
    expect(screen.getByText('Elige si lo usarás en familia o en colegio.')).toBeInTheDocument()
    expect(data.useAuth.mock.results[0]!.value.signUp).not.toHaveBeenCalled()
  })

  it('creates the account with the chosen organisation kind', async () => {
    const signUp = vi.fn().mockResolvedValue(undefined)
    data.useAuth.mockReturnValue({ status: 'anonymous', backendAvailable: true, signUp })
    render(
      <MemoryRouter>
        <SignupScreen />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave1234' } })
    fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: 'clave1234' } })
    fireEvent.click(screen.getByRole('radio', { name: /Colegio/ }))
    fireEvent.change(screen.getByLabelText('Nombre del colegio'), { target: { value: 'CEIP Numeria' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'clave1234',
        displayName: 'Ana',
        orgKind: 'school',
        orgName: 'CEIP Numeria',
      }),
    )
    expect(await screen.findByText('Te hemos enviado un correo de confirmación')).toBeInTheDocument()
  })
})
