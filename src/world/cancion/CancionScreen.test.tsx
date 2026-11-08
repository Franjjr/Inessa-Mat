/* The song screen with the sound mocked: say resolves at once, the bar clock says 0, preload is scripted. */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const audio = vi.hoisted(() => ({
  speech: { preload: vi.fn(), say: vi.fn(), stop: vi.fn() },
  music: { play: vi.fn(), current: vi.fn(() => 'map'), nextBarIn: vi.fn(() => 0) },
}))
vi.mock('@/audio', () => audio)

const data = vi.hoisted(() => ({
  useActiveChild: vi.fn(),
  useMastery: vi.fn(),
  useProgress: vi.fn(),
  updateProgress: vi.fn(async () => ({})),
}))
vi.mock('@/data', () => data)
vi.mock('@/art', () => ({ CompanionArt: () => null, StarIcon: () => null, Sparkles: () => null }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const host = vi.hoisted(() => ({ reportAttempt: vi.fn() }))
vi.mock('@/world/host/GameHost', async () => {
  const { ActivityHostProvider, defaultActivityHost } = await import('@/activities')
  return {
    GameHostProvider: ({ children }: { children: React.ReactNode }) => (
      <ActivityHostProvider value={{ ...defaultActivityHost, reportAttempt: host.reportAttempt }}>{children}</ActivityHostProvider>
    ),
  }
})

import CancionScreen from './CancionScreen'

const child = { id: 'c1', nickname: 'Inés', grade: 3, companion: { name: 'Luna', species: 'cat', colorway: 'a', gender: 'f', equipped: [] } }

function renderAt(path = '/play/cancion/7') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/play/cancion/:table" element={<CancionScreen />} />
        <Route path="/play/free" element={<p>Jugar</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Lets the song run until it asks: the bubbles show. */
async function untilBubbles() {
  await screen.findByRole('group', { name: /Elige el resultado/ }, { timeout: 3000 })
}

/** The right bubble of the gap on screen. */
function rightBubble(): HTMLElement {
  const lead = screen.getByTestId('song-ask').textContent ?? ''
  const m = /(\d+) × (\d+)/.exec(lead)!
  return screen.getByRole('button', { name: String(Number(m[1]) * Number(m[2])) })
}

beforeEach(() => {
  vi.clearAllMocks()
  data.useActiveChild.mockReturnValue({ child })
  data.useMastery.mockReturnValue({})
  data.useProgress.mockReturnValue({ flags: {} })
  audio.speech.preload.mockResolvedValue(true)
  audio.speech.say.mockResolvedValue(undefined)
  audio.music.current.mockReturnValue('map')
  audio.music.nextBarIn.mockReturnValue(0)
})

describe('CancionScreen', () => {
  it('plays round 1 then asks the gaps with three bubbles', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    expect(audio.music.play).toHaveBeenCalledWith('song', { force: true })
    expect(audio.speech.say).toHaveBeenCalledWith('Siete por ocho, cincuenta y seis', expect.objectContaining({ force: true, deviceOnly: false }))
    expect(screen.getAllByRole('button').filter((b) => b.dataset.bubble)).toHaveLength(3)
  })

  it('a wrong bubble dims it and says the trick; the right one goes on', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    const right = rightBubble()
    const wrong = screen.getAllByRole('button').find((b) => b.dataset.bubble && b !== right)!
    await act(async () => { fireEvent.click(wrong) })
    expect(wrong).toBeDisabled()
    expect(host.reportAttempt).toHaveBeenLastCalledWith(expect.objectContaining({ graded: false, inputMode: 'tap', check: expect.objectContaining({ correct: false }) }))
    await act(async () => { fireEvent.click(right) })
    expect(host.reportAttempt).toHaveBeenLastCalledWith(expect.objectContaining({ check: expect.objectContaining({ correct: true }) }))
  })

  it('one answer per tap even when tapped twice quickly', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    const right = rightBubble()
    await act(async () => {
      fireEvent.click(right)
      fireEvent.click(right)
    })
    expect(host.reportAttempt).toHaveBeenCalledTimes(1)
  })

  it('all gaps right first time marks the next star flag', async () => {
    data.useProgress.mockReturnValue({ flags: { 'cancion:7:1': true } })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    for (let i = 0; i < 5; i++) {
      await untilBubbles()
      await act(async () => { fireEvent.click(rightBubble()) })
    }
    expect(await screen.findByText(/¡Tabla del 7 cantada!/)).toBeInTheDocument()
    expect(data.updateProgress).toHaveBeenCalledTimes(1)
    const updater = (data.updateProgress.mock.calls[0] as unknown as [string, (p: { flags: Record<string, boolean> }) => { flags: Record<string, boolean> }])[1]
    expect(updater({ flags: { 'cancion:7:1': true } }).flags['cancion:7:2']).toBe(true)
  })

  it('preload false: every say goes with deviceOnly', async () => {
    audio.speech.preload.mockResolvedValue(false)
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    for (const call of audio.speech.say.mock.calls) expect(call[1]).toMatchObject({ deviceOnly: true })
  })

  it('Salir stops speech and restores the previous music', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    fireEvent.click(screen.getByRole('button', { name: /Salir/ }))
    expect(audio.speech.stop).toHaveBeenCalled()
    expect(audio.music.play).toHaveBeenLastCalledWith('map')
    expect(await screen.findByText('Jugar')).toBeInTheDocument()
  })

  it('hiding the tab aborts the song and goes back to ready', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    hidden.mockRestore()
    expect(audio.speech.stop).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: /¡A cantar!/ })).toBeInTheDocument()
  })

  it('an unknown table redirects to /play/free', async () => {
    renderAt('/play/cancion/13')
    expect(await screen.findByText('Jugar')).toBeInTheDocument()
  })

  it('attempts are reported with graded false', async () => {
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: /¡A cantar!/ }))
    await untilBubbles()
    await act(async () => { fireEvent.click(rightBubble()) })
    await waitFor(() => expect(host.reportAttempt).toHaveBeenCalled())
    for (const c of host.reportAttempt.mock.calls) expect(c[0]).toMatchObject({ graded: false })
  })
})
