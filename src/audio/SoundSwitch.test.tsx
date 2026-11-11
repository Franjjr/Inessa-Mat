import { fireEvent, render, screen } from '@testing-library/react'
import type { ChildProfile } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { SoundSwitch } from './SoundSwitch'

const state = vi.hoisted(() => ({ child: null as ChildProfile | null }))
const updateChild = vi.hoisted(() => vi.fn(async () => ({})))
vi.mock('@/data', () => ({
  updateChild,
  useActiveChild: () => ({ child: state.child, loading: false, setActiveChild() {} }),
}))

function kid(settings: Partial<ChildProfile['settings']>): ChildProfile {
  return {
    id: 'kid', orgId: null, nickname: 'Inessa', gender: 'f',
    companion: { species: 'cat', name: 'Coco', gender: 'm', colorway: 'default', equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS, ...settings },
    createdAt: '2026-10-01', updatedAt: '2026-10-01',
  }
}

describe('SoundSwitch · the child can turn the sound and the voice off and on', () => {
  beforeEach(() => {
    updateChild.mockClear()
    window.localStorage.clear()
  })

  it('is visible with its state written out, and turns sound and voice off together', () => {
    state.child = kid({ sound: true, voice: true })
    render(<SoundSwitch />)
    const button = screen.getByRole('button', { name: /Apagar el sonido/ })
    expect(button).toHaveTextContent('Sonido')
    fireEvent.click(button)
    expect(updateChild).toHaveBeenCalledWith('kid', expect.objectContaining({
      settings: expect.objectContaining({ sound: false, voice: false }),
    }))
  })

  it('with the sound off, it says so and turns it back on', () => {
    state.child = kid({ sound: false, voice: false })
    render(<SoundSwitch />)
    const button = screen.getByRole('button', { name: /Activar el sonido/ })
    expect(button).toHaveTextContent('Sin sonido')
    fireEvent.click(button)
    expect(updateChild).toHaveBeenCalledWith('kid', expect.objectContaining({
      settings: expect.objectContaining({ sound: true, voice: true }),
    }))
  })

  it('turning the sound on restores a voice that was off before, and turns it on if there was no memory', () => {
    state.child = kid({ sound: true, voice: false })
    const { unmount } = render(<SoundSwitch />)
    fireEvent.click(screen.getByRole('button', { name: /Apagar el sonido/ }))
    unmount()
    state.child = kid({ sound: false, voice: false })
    render(<SoundSwitch />)
    fireEvent.click(screen.getByRole('button', { name: /Activar el sonido/ }))
    expect(updateChild).toHaveBeenLastCalledWith('kid', expect.objectContaining({
      settings: expect.objectContaining({ sound: true, voice: false }),
    }))
  })

  it('keeps the other settings of the child (music, cells, hand) when it saves', () => {
    state.child = kid({ sound: true, music: false, handedness: 'left' })
    render(<SoundSwitch />)
    fireEvent.click(screen.getByRole('button', { name: /Apagar el sonido/ }))
    expect(updateChild).toHaveBeenCalledWith('kid', expect.objectContaining({
      settings: expect.objectContaining({ music: false, handedness: 'left' }),
    }))
  })

  it('shows nothing when no child is active', () => {
    state.child = null
    const { container } = render(<SoundSwitch />)
    expect(container).toBeEmptyDOMElement()
  })

  it('a voice the adult turned on meanwhile stays on, and the old memory is cleared', () => {
    window.localStorage.setItem('repasitos:voice-before-mute:kid', '0')
    state.child = kid({ sound: false, voice: true })
    render(<SoundSwitch />)
    fireEvent.click(screen.getByRole('button', { name: /Activar el sonido/ }))
    expect(updateChild).toHaveBeenLastCalledWith('kid', expect.objectContaining({
      settings: expect.objectContaining({ sound: true, voice: true }),
    }))
    expect(window.localStorage.getItem('repasitos:voice-before-mute:kid')).toBeNull()
  })
})
