import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile, StoryDef } from '@/types'
import StoryPlayer from './StoryPlayer'

let finish: () => void = () => undefined
const speechMock = vi.hoisted(() => ({ say: vi.fn(), stop: vi.fn() }))
vi.mock('@/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/audio')>()
  return { ...actual, speech: { ...actual.speech, say: speechMock.say, stop: speechMock.stop } }
})

const settings = { sound: true, voice: true, storyVoice: true }
vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  const child = { id: 'c1', nickname: 'Inessa', gender: 'f', companion: { species: 'dragon', gender: 'm', name: 'Chispa' } }
  return { ...actual, useActiveChild: () => ({ child: { ...child, settings } as unknown as ChildProfile, loading: false, setActiveChild: () => {} }) }
})

// The art is not under test.
vi.mock('@/art', () => ({
  Character: () => null, CompanionArt: () => null, Predicament: () => null, WorldBackground: () => null,
}))

const story: StoryDef = {
  id: 't',
  title: 'Prueba',
  scenes: [{
    background: 'home',
    cast: [{ id: 'lumi', pose: 'idle', position: 'center' }],
    lines: [{ speaker: 'lumi', text: 'Hola, {child}. Hoy restamos 352 − 127.' }, { speaker: 'lumi', text: 'Vamos.' }],
  }],
}

beforeEach(() => {
  speechMock.say.mockReset()
  speechMock.stop.mockReset()
  speechMock.say.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve }))
  speechMock.stop.mockImplementation(() => finish())
  settings.voice = true
  settings.storyVoice = true
})

describe('StoryPlayer · escuchar', () => {
  it('with automatic reading on, the line is read and «Escuchar otra vez» is there, with «Parar» while it speaks', async () => {
    render(<StoryPlayer story={story} onDone={() => undefined} />)
    expect(speechMock.say).toHaveBeenCalledTimes(1)
    // It is speaking: the button offers to stop it.
    const stop = screen.getByRole('button', { name: /Parar/ })
    fireEvent.click(stop)
    expect(speechMock.stop).toHaveBeenCalled()
    await act(async () => { finish() })
    expect(screen.getByRole('button', { name: /Escuchar otra vez/ })).toBeInTheDocument()
  })

  it('«Escuchar otra vez» reads the line again', async () => {
    render(<StoryPlayer story={story} onDone={() => undefined} />)
    await act(async () => { finish() })
    fireEvent.click(screen.getByRole('button', { name: /Escuchar otra vez/ }))
    expect(speechMock.say).toHaveBeenCalledTimes(2)
    expect(speechMock.say.mock.calls[1][1]).toMatchObject({ interrupt: true, force: true })
  })

  it('with automatic reading off, «Escuchar» speaks even so (force)', () => {
    settings.storyVoice = false
    render(<StoryPlayer story={story} onDone={() => undefined} />)
    expect(speechMock.say).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^🔊 Escuchar$/ }))
    expect(speechMock.say).toHaveBeenCalledTimes(1)
    expect(speechMock.say.mock.calls[0][1]).toMatchObject({ force: true })
  })

  it('with the voice off, the button is still there', () => {
    settings.voice = false
    render(<StoryPlayer story={story} onDone={() => undefined} />)
    expect(screen.getByRole('button', { name: /Escuchar/ })).toBeInTheDocument()
  })
})
