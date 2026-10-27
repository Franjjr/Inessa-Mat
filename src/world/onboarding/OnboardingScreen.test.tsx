import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createElement, forwardRef } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { listChildren } from '@/data'
import { useLocalOnlyAuth } from '../host/testing'
import OnboardingScreen from './OnboardingScreen'

// Motion is replaced by plain elements: the test only checks the steps, not the animation timing.
vi.mock('motion/react', async () => {
  const cache = new Map<string, unknown>()
  const passthrough = (tag: string) => {
    if (!cache.has(tag)) {
      cache.set(tag, forwardRef<HTMLElement, Record<string, unknown>>(
        ({ initial: _i, animate: _a, exit: _e, transition: _t, ...rest }, ref) => createElement(tag, { ...rest, ref }),
      ))
    }
    return cache.get(tag)
  }
  const motion = new Proxy({}, { get: (_target, tag: string) => passthrough(tag) })
  return {
    motion,
    AnimatePresence: ({ children }: { children: unknown }) => children,
    MotionConfig: ({ children }: { children: unknown }) => children,
  }
})

// The handwriting calibration loads a model; the onboarding only needs its completion callback here.
const input = vi.hoisted(() => ({ mode: 'touch' }))
vi.mock('@/ink', () => ({
  CalibrationFlow: ({ onDone }: { onDone: () => void }) => createElement('button', { onClick: onDone }, 'Calibración simulada'),
  useInputMode: () => ({ mode: input.mode }),
}))

beforeAll(() => {
  useLocalOnlyAuth()
})

describe('OnboardingScreen', () => {
  it('creates the child with her companion and sends her to the home screen', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/kids/new']}>
        <Routes>
          <Route path="/kids/new" element={<OnboardingScreen />} />
          <Route path="/play" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText('Tu nombre'), 'Inessa')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Como a una niña' }))
    await user.click(await screen.findByRole('button', { name: '3º de Primaria' }))
    await user.click(await screen.findByRole('button', { name: /Gatito/ }))
    await user.click(await screen.findByRole('button', { name: /Original/ }))
    await user.type(await screen.findByLabelText('Nombre del compañero'), 'Bigotes')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Es una niña' }))
    await user.click(await screen.findByRole('button', { name: '¡Vamos!' }))
    await user.click(await screen.findByRole('button', { name: 'Calibración simulada' }))
    await user.click(await screen.findByRole('button', { name: 'Saltar' }))
    expect(await screen.findByText('HOME')).toBeInTheDocument()

    const created = (await listChildren()).filter((c) => c.nickname === 'Inessa').at(-1)
    expect(created).toBeDefined()
    expect(created!.gender).toBe('f')
    expect(created!.grade).toBe(3)
    expect(created!.companion).toMatchObject({ species: 'cat', name: 'Bigotes', gender: 'f', colorway: 'default' })
  })

  it('lets the child skip the handwriting calibration', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/kids/new']}>
        <Routes>
          <Route path="/kids/new" element={<OnboardingScreen />} />
          <Route path="/play" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(await screen.findByLabelText('Tu nombre'), 'Lia')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Como a un niño' }))
    await user.click(await screen.findByRole('button', { name: 'No lo sé' }))
    await user.click(await screen.findByRole('button', { name: /Zorrito/ }))
    await user.click(await screen.findByRole('button', { name: /Dorado/ }))
    await user.type(await screen.findByLabelText('Nombre del compañero'), 'Canela')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Es un niño' }))
    await user.click(await screen.findByRole('button', { name: '¡Vamos!' }))
    await user.click(await screen.findByRole('button', { name: 'Ahora no' }))
    await user.click(await screen.findByRole('button', { name: 'Saltar' }))
    expect(await screen.findByText('HOME')).toBeInTheDocument()
    const created = (await listChildren()).filter((c) => c.nickname === 'Lia').at(-1)
    expect(created?.companion.colorway).toBe('sunny')
    expect(created?.grade).toBeUndefined()
  })

  it('goes straight to the story where the child answers with the keypad (a computer without a touch screen)', async () => {
    input.mode = 'keypad'
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/kids/new']}>
        <Routes>
          <Route path="/kids/new" element={<OnboardingScreen />} />
          <Route path="/play" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(await screen.findByLabelText('Tu nombre'), 'Teo')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Como a un niño' }))
    await user.click(await screen.findByRole('button', { name: 'No lo sé' }))
    await user.click(await screen.findByRole('button', { name: /Zorrito/ }))
    await user.click(await screen.findByRole('button', { name: /Dorado/ }))
    await user.type(await screen.findByLabelText('Nombre del compañero'), 'Canela')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Es un niño' }))
    await user.click(await screen.findByRole('button', { name: '¡Vamos!' }))
    expect(await screen.findByRole('button', { name: 'Saltar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ahora no' })).toBeNull()
    input.mode = 'touch'
  })

  it('reads the review question without a gendered adjective (girl and female companion)', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/kids/new']}>
        <Routes>
          <Route path="/kids/new" element={<OnboardingScreen />} />
          <Route path="/play" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(await screen.findByLabelText('Tu nombre'), 'Inessa')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Como a una niña' }))
    await user.click(await screen.findByRole('button', { name: '3º de Primaria' }))
    await user.click(await screen.findByRole('button', { name: /Gatito/ }))
    await user.click(await screen.findByRole('button', { name: /Original/ }))
    await user.type(await screen.findByLabelText('Nombre del compañero'), 'Lola')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Es una niña' }))
    expect(await screen.findByText(/Todo listo, Inessa y Lola/)).toBeInTheDocument()
    expect(screen.queryByText(/ya están listos/)).not.toBeInTheDocument()
  })

  it('creates one profile even when "¡Vamos!" is tapped twice quickly', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/kids/new']}>
        <Routes>
          <Route path="/kids/new" element={<OnboardingScreen />} />
          <Route path="/play" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(await screen.findByLabelText('Tu nombre'), 'Doble')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Como a un niño' }))
    await user.click(await screen.findByRole('button', { name: 'No lo sé' }))
    await user.click(await screen.findByRole('button', { name: /Gatito/ }))
    await user.click(await screen.findByRole('button', { name: /Original/ }))
    await user.type(await screen.findByLabelText('Nombre del compañero'), 'Nube')
    await user.click(screen.getByRole('button', { name: 'Siguiente ›' }))
    await user.click(await screen.findByRole('button', { name: 'Es un niño' }))
    const go = await screen.findByRole('button', { name: '¡Vamos!' })
    fireEvent.click(go)
    fireEvent.click(go)
    await user.click(await screen.findByRole('button', { name: 'Calibración simulada' }))
    await user.click(await screen.findByRole('button', { name: 'Saltar' }))
    expect(await screen.findByText('HOME')).toBeInTheDocument()
    const created = (await listChildren()).filter((c) => c.nickname === 'Doble')
    expect(created).toHaveLength(1)
  })
})
