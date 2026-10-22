import { act, render, screen } from '@testing-library/react'
import type { ChildProfile, InkSample } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { PEN_SEEN_KEY } from './constants'
import { InkProvider } from './InkProvider'
import { useInputMode } from './hooks'
import { scriptedRecognizer } from './dev/scripted'

const state = vi.hoisted(() => ({ child: null as ChildProfile | null, samples: [] as InkSample[] }))
const updateChild = vi.hoisted(() => vi.fn(async () => ({})))
vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => state.samples),
  updateChild,
  useActiveChild: () => ({ child: state.child, loading: false, setActiveChild() {} }),
}))

function kid(inputPreference: ChildProfile['settings']['inputPreference']): ChildProfile {
  return {
    id: 'kid', orgId: null, nickname: 'Inessa', gender: 'f',
    companion: { species: 'cat', name: 'Coco', gender: 'm', colorway: 'default', equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS, inputPreference },
    createdAt: '2026-10-01', updatedAt: '2026-10-01',
  }
}

let api: ReturnType<typeof useInputMode>
function Probe() {
  api = useInputMode()
  return <output data-testid="mode">{api.mode}</output>
}

describe('InkProvider', () => {
  beforeEach(() => { localStorage.clear(); updateChild.mockClear() })

  it('setPreferred applies at once and is saved; a later change of the stored setting wins', () => {
    state.child = kid('auto')
    const rec = scriptedRecognizer([])
    const { rerender } = render(<InkProvider recognizer={rec} childId="kid"><Probe /></InkProvider>)
    act(() => api.setPreferred('keypad'))
    expect(screen.getByTestId('mode')).toHaveTextContent('keypad')
    expect(updateChild).toHaveBeenCalledWith('kid', expect.objectContaining({ settings: expect.objectContaining({ inputPreference: 'keypad' }) }))
    // an adult changes the setting elsewhere (e.g. the settings screen): it is not masked by the old override
    state.child = kid('keyboard')
    rerender(<InkProvider recognizer={rec} childId="kid"><Probe /></InkProvider>)
    expect(screen.getByTestId('mode')).toHaveTextContent('keyboard')
  })

  it('loads the child personal samples into the recogniser', async () => {
    state.child = null
    state.samples = [
      { id: 'a', childId: 'kid', digit: 7, embedding: [1, 2], source: 'calibration', createdAt: '2026-10-01' },
      { id: 'b', childId: 'kid', digit: 4, embedding: [3, 4], source: 'confirmed', createdAt: '2026-10-02' },
    ]
    const rec = scriptedRecognizer([])
    render(<InkProvider recognizer={rec} childId="kid"><Probe /></InkProvider>)
    await act(async () => { await Promise.resolve() })
    expect(rec.personal).toEqual([{ digit: 7, embedding: [1, 2] }, { digit: 4, embedding: [3, 4] }])
  })

  it('a real (trusted) pen marks the device as pen-using; synthetic events do not', () => {
    state.child = null
    render(<InkProvider recognizer={scriptedRecognizer([])}><Probe /></InkProvider>)
    act(() => { window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'pen', bubbles: true })) })
    expect(api.penSeen).toBe(false) // untrusted (scripts, tests) never switch palm rejection on
    expect(localStorage.getItem(PEN_SEEN_KEY)).toBeNull()
  })

  it('forgetPen() lets fingers write again', () => {
    localStorage.setItem(PEN_SEEN_KEY, '2026-10-01')
    state.child = null
    render(<InkProvider recognizer={scriptedRecognizer([])}><Probe /></InkProvider>)
    expect(api.penSeen).toBe(true)
    act(() => api.forgetPen())
    expect(api.penSeen).toBe(false)
    expect(localStorage.getItem(PEN_SEEN_KEY)).toBeNull()
  })
})
