/* «Continuar con Google»: hidden without a client ID or when Google's script cannot load; the credential goes to the data
   layer with the raw nonce (Google got its hash); a failure says so and offers a fresh button. */
import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ googleClientId: vi.fn(), signInWithGoogle: vi.fn() }))
vi.mock('@/data', () => data)
const gis = vi.hoisted(() => ({ loadGoogleIdentity: vi.fn(), makeNonce: vi.fn() }))
vi.mock('./google', () => gis)

import { GoogleButton } from './GoogleButton'

type Init = { client_id: string; nonce: string; callback: (r: { credential?: string }) => void }
let inits: Init[] = []
const fakeId = {
  initialize: vi.fn((c: Init) => inits.push(c)),
  renderButton: vi.fn((el: HTMLElement) => {
    const b = document.createElement('div')
    b.textContent = 'Botón de Google'
    el.appendChild(b)
  }),
  cancel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  inits = []
  data.googleClientId.mockReturnValue('cliente.apps.googleusercontent.com')
  gis.loadGoogleIdentity.mockResolvedValue(fakeId)
  let n = 0
  gis.makeNonce.mockImplementation(async () => { n += 1; return { raw: `raw${n}`, hashed: `hash${n}` } })
})

describe('GoogleButton', () => {
  it('shows nothing without a client ID, and never loads Google', () => {
    data.googleClientId.mockReturnValue(null)
    const { container } = render(<GoogleButton context="signin" />)
    expect(container).toBeEmptyDOMElement()
    expect(gis.loadGoogleIdentity).not.toHaveBeenCalled()
  })

  it('shows nothing when the script cannot load', async () => {
    gis.loadGoogleIdentity.mockRejectedValue(new Error('blocked'))
    const { container } = render(<GoogleButton context="signin" />)
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('gives Google the hashed nonce and the data layer the raw one', async () => {
    data.signInWithGoogle.mockResolvedValue(undefined)
    render(<GoogleButton context="signin" />)
    expect(await screen.findByText('Botón de Google')).toBeInTheDocument()
    expect(screen.getByText('o con tu correo')).toBeInTheDocument()
    expect(inits[0]).toMatchObject({ client_id: 'cliente.apps.googleusercontent.com', nonce: 'hash1' })
    await act(async () => inits[0]!.callback({ credential: 'token-de-google' }))
    expect(data.signInWithGoogle).toHaveBeenCalledWith('token-de-google', 'raw1')
  })

  it('a failure is shown, and the next try uses a new nonce', async () => {
    data.signInWithGoogle.mockRejectedValue(Object.assign(new Error('No hemos podido entrar con Google. Vuelve a intentarlo o entra con un código por correo.'), { name: 'DataError', code: 'google-failed' }))
    render(<GoogleButton context="signup" />)
    await screen.findByText('Botón de Google')
    await act(async () => inits[0]!.callback({ credential: 't' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido entrar con Google')
    await waitFor(() => expect(inits).toHaveLength(2))
    expect(inits[1]!.nonce).toBe('hash2')
  })
})
