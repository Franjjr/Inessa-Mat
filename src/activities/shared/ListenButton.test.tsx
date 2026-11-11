import { act, fireEvent, render, screen } from '@testing-library/react'
import { speech } from '@/audio'
import { ListenButton } from './ListenButton'

let finish: () => void = () => undefined
vi.mock('@/audio', () => ({
  speech: {
    say: vi.fn(() => new Promise<void>((resolve) => { finish = resolve })),
    stop: vi.fn(() => finish()),
  },
}))

describe('ListenButton', () => {
  beforeEach(() => {
    vi.mocked(speech.say).mockClear()
    vi.mocked(speech.stop).mockClear()
  })

  it('reads the text even when the automatic voice is off, and turns into «Parar» while it speaks', async () => {
    render(<ListenButton text="¿Cuánto es 6 × 7?" />)
    const button = screen.getByRole('button', { name: /Escuchar/ })
    fireEvent.click(button)
    expect(speech.say).toHaveBeenCalledWith('¿Cuánto es 6 × 7?', { voice: 'lumi', force: true, interrupt: true })
    expect(screen.getByRole('button', { name: /Parar/ })).toBeInTheDocument()
    await act(async () => { finish() })
    expect(screen.getByRole('button', { name: /Escuchar/ })).toBeInTheDocument()
  })

  it('a second press stops the voice', () => {
    render(<ListenButton text="Hola" />)
    fireEvent.click(screen.getByRole('button', { name: /Escuchar/ }))
    fireEvent.click(screen.getByRole('button', { name: /Parar/ }))
    expect(speech.stop).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Escuchar/ })).toBeInTheDocument()
  })

  it('stops the voice when the exercise goes away', () => {
    const { unmount } = render(<ListenButton text="Hola" />)
    fireEvent.click(screen.getByRole('button', { name: /Escuchar/ }))
    vi.mocked(speech.stop).mockClear()
    unmount()
    expect(speech.stop).toHaveBeenCalled()
  })

  it('does not touch the voice when it never spoke', () => {
    const { unmount } = render(<ListenButton text="Hola" />)
    unmount()
    expect(speech.stop).not.toHaveBeenCalled()
  })
})
