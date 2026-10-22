import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({
  hasAdultPin: vi.fn(),
  verifyAdultPin: vi.fn(),
  setAdultPin: vi.fn(),
  clearAdultPin: vi.fn(),
  signInWithPassword: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('@/data', () => data)

import { AdultGate, __resetAdultGateForTests, isAdultAreaUnlocked, makeMathQuestion } from './AdultGate'

async function tapPin(pin: string) {
  await screen.findByRole('group', { name: 'Teclado numérico' })
  for (const d of pin) fireEvent.click(screen.getByRole('button', { name: d }))
}

function renderGate() {
  return render(
    <MemoryRouter>
      <AdultGate>
        <p>Contenido de adultos</p>
      </AdultGate>
    </MemoryRouter>,
  )
}

describe('AdultGate', () => {
  beforeEach(() => {
    __resetAdultGateForTests()
    window.localStorage.clear()
    vi.clearAllMocks()
    data.useAuth.mockReturnValue({ status: 'local-only', user: null, backendAvailable: false, signInWithPassword: vi.fn() })
    data.clearAdultPin.mockResolvedValue(undefined)
    data.setAdultPin.mockResolvedValue(undefined)
  })

  it('blocks the adult area while the PIN is wrong', async () => {
    data.hasAdultPin.mockResolvedValue(true)
    data.verifyAdultPin.mockResolvedValue(false)
    renderGate()

    await tapPin('0000')
    fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Ese PIN no es correcto. Inténtalo otra vez.')).toBeInTheDocument()
    expect(screen.queryByText('Contenido de adultos')).not.toBeInTheDocument()
    expect(isAdultAreaUnlocked()).toBe(false)
  })

  it('keeps the lock after five wrong PINs even when the page is reloaded', async () => {
    data.hasAdultPin.mockResolvedValue(true)
    data.verifyAdultPin.mockResolvedValue(false)
    const first = renderGate()
    for (let i = 0; i < 5; i++) {
      await tapPin('0000')
      fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }))
      await waitFor(() => expect(data.verifyAdultPin).toHaveBeenCalledTimes(i + 1))
    }
    expect(await screen.findByText(/Demasiados intentos seguidos/)).toBeInTheDocument()
    first.unmount()

    // A reload must not reset the limit: the keypad is still paused.
    renderGate()
    expect(await screen.findByText(/Puedes volver a probar en/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled()
  })

  it('lets the adult through with the right PIN', async () => {
    data.hasAdultPin.mockResolvedValue(true)
    data.verifyAdultPin.mockResolvedValue(true)
    renderGate()

    await tapPin('1234')
    fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Contenido de adultos')).toBeInTheDocument()
    expect(data.verifyAdultPin).toHaveBeenCalledWith('1234')
    expect(isAdultAreaUnlocked()).toBe(true)
  })

  it('asks to create a PIN on first use and requires it to be confirmed', async () => {
    data.hasAdultPin.mockResolvedValue(false)
    renderGate()

    expect(await screen.findByText('Crea tu PIN')).toBeInTheDocument()
    await tapPin('12')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(screen.getByText('El PIN debe tener entre 4 y 8 números.')).toBeInTheDocument()

    await tapPin('5678')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    await tapPin('5679')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.getByText('Los PIN no coinciden. Empecemos otra vez.')).toBeInTheDocument()
    expect(data.setAdultPin).not.toHaveBeenCalled()
  })

  it('stores the new PIN and opens the area once it is confirmed', async () => {
    data.hasAdultPin.mockResolvedValue(false)
    renderGate()
    await screen.findByText('Crea tu PIN')

    await tapPin('5678')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    await tapPin('5678')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Contenido de adultos')).toBeInTheDocument()
    expect(data.setAdultPin).toHaveBeenCalledWith('5678')
  })

  it('offers a maths question when forgetting the PIN without an account', async () => {
    data.hasAdultPin.mockResolvedValue(true)
    data.verifyAdultPin.mockResolvedValue(false)
    renderGate()

    fireEvent.click(await screen.findByRole('button', { name: 'He olvidado el PIN' }))
    expect(await screen.findByText(/× .* = \?/)).toBeInTheDocument()

    // Wrong answer keeps the area closed.
    await tapPin('1')
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(await screen.findByText(/Ese resultado no es correcto/)).toBeInTheDocument()
    expect(data.clearAdultPin).not.toHaveBeenCalled()
  })

  it('creates the question with two 2-digit factors', () => {
    const q = makeMathQuestion(() => 0.5)
    expect(q.a).toBeGreaterThanOrEqual(12)
    expect(q.b).toBeLessThanOrEqual(19)
    expect(q.answer).toBe(q.a * q.b)
  })

  it('reaches the password route when signed in', async () => {
    data.hasAdultPin.mockResolvedValue(true)
    data.useAuth.mockReturnValue({
      status: 'signed-in',
      user: { id: 'u1', email: 'madre@example.com' },
      backendAvailable: true,
      signInWithPassword: data.signInWithPassword,
    })
    data.signInWithPassword.mockResolvedValue(undefined)
    renderGate()

    fireEvent.click(await screen.findByRole('button', { name: 'He olvidado el PIN' }))
    fireEvent.change(await screen.findByLabelText('Contraseña de tu cuenta'), { target: { value: 'secreta123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => expect(data.signInWithPassword).toHaveBeenCalledWith('madre@example.com', 'secreta123'))
    await waitFor(() => expect(data.clearAdultPin).toHaveBeenCalled())
    expect(await screen.findByText('Crea tu PIN')).toBeInTheDocument()
  })
})
