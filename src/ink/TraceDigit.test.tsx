import { act, fireEvent, render, screen } from '@testing-library/react'
import { IDLE_MS_SLOW, PEN_SEEN_KEY } from './constants'
import { InkProvider } from './InkProvider'
import { TraceDigit } from './TraceDigit'
import { MODEL_H, MODEL_W } from './digitModels'
import { notePenContact } from './policy'
import { fitModel } from './trace'
import { scriptedRecognizer } from './dev/scripted'
import { replayStrokes } from './dev/autoplay'
import { fixedElementSize, mockCanvas } from './dev/testing'
import { handwrite } from './fixtures'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/art/worlds/StarIcon', () => ({ StarIcon: ({ filled }: { filled?: boolean }) => <i data-testid={filled ? 'star-on' : 'star-off'} /> }))

const W = 330
const H = 420
let restore: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H) })
afterAll(() => restore())
beforeEach(() => { vi.useFakeTimers(); localStorage.clear() })
afterEach(() => { vi.useRealTimers() })

function setup(digit: number) {
  const onDone = vi.fn()
  render(<InkProvider recognizer={scriptedRecognizer([])}><TraceDigit digit={digit} onDone={onDone} /></InkProvider>)
  const area = screen.getByRole('img', { name: new RegExp(`repasar el ${digit}`) })
  const fit = fitModel(W, H)
  const trace = (pointerType: 'pen' | 'touch' = 'pen', wobble = 1.5) =>
    act(() => replayStrokes(area, handwrite(digit, { x: fit.ox, y: fit.oy, w: MODEL_W * fit.scale, h: MODEL_H * fit.scale }, { fill: 1, slant: 0, wobble, seed: 3, pointerType })))
  return { onDone, area, trace }
}

describe('TraceDigit', () => {
  it('scores a careful trace with 3 stars once all strokes are done, then Seguir reports it', () => {
    const { onDone, trace } = setup(4)
    expect(screen.getByText('Repasa el')).toBeInTheDocument()
    trace()
    act(() => { vi.advanceTimersByTime(IDLE_MS_SLOW + 20) })
    expect(screen.getAllByTestId('star-on')).toHaveLength(3)
    expect(screen.getByRole('status')).toHaveTextContent('¡Perfecto! ¡Qué 4 tan bonito!')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(onDone).toHaveBeenCalledWith({ stars: 3, score: expect.any(Number) })
  })

  it('Otra vez starts again; a palm on the buttons while the pen writes is ignored', () => {
    const { trace } = setup(7)
    trace()
    const erase = screen.getByRole('button', { name: 'Borrar' })
    notePenContact(true)
    fireEvent.pointerDown(erase, { pointerType: 'touch' })
    fireEvent.click(erase)
    expect(erase).toBeEnabled() // still has ink: the palm did not erase it
    notePenContact(false, performance.now() - 5000)
    act(() => { vi.advanceTimersByTime(IDLE_MS_SLOW + 20) })
    fireEvent.click(screen.getByRole('button', { name: 'Otra vez' }))
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: '¡Listo!' })).toBeDisabled()
  })

  it('once a pen was used, a finger is reminded to trace with the pen', () => {
    localStorage.setItem(PEN_SEEN_KEY, '2026-10-01')
    const { trace } = setup(1)
    trace('touch')
    expect(screen.getByText('¡Repasa con el lápiz!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '¡Listo!' })).toBeDisabled()
  })
})
