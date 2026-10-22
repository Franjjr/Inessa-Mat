import { act, fireEvent, render, screen } from '@testing-library/react'
import type { DigitRecognition } from '@/types'
import { IDLE_MS_SLOW, PEN_SEEN_KEY } from './constants'
import { InkProvider } from './InkProvider'
import { CalibrationFlow } from './CalibrationFlow'
import { notePenContact } from './policy'
import { scriptedRecognizer, type ScriptedAnswer } from './dev/scripted'
import { replayStrokes } from './dev/autoplay'
import { fixedElementSize, mockCanvas } from './dev/testing'
import { handwrite, scribble } from './fixtures'

const addInkSample = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/data', () => ({
  addInkSample,
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/art', () => ({ CompanionArt: ({ pose }: { pose?: string }) => <span data-testid="pet" data-pose={pose} /> }))

const W = 240
const H = 300
let restore: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H) })
afterAll(() => restore())
beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); addInkSample.mockClear() })
afterEach(() => { vi.useRealTimers() })

/** A recogniser that returns embeddings (needed to store samples) and an optional ml `reason`. */
function recognizer(answers: (ScriptedAnswer & { reason?: string })[]) {
  const rec = scriptedRecognizer(answers)
  let i = 0
  const orig = rec.recognize
  rec.recognize = (st, z) => {
    const a = answers[i++ % answers.length]
    return { ...orig(st, z), embedding: [0.2, 0.4], reason: a.reason ?? 'ok' } as DigitRecognition
  }
  return rec
}

function setup(rec = recognizer([{ digit: 1 }]), onDone = vi.fn()) {
  render(<InkProvider recognizer={rec}><CalibrationFlow childId="new-kid" companionName="Coco" onDone={onDone} /></InkProvider>)
  return { rec, onDone }
}

const pad = (d: number) => screen.getByRole('img', { name: `Escribe aquí el número ${d}` })
const write = (d: number) => act(() => replayStrokes(pad(d), handwrite(d, { x: 0, y: 0, w: W, h: H }, { fill: 0.7 })))
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe('CalibrationFlow', () => {
  it('stores each written digit as a calibration sample of the child being calibrated', () => {
    setup()
    expect(screen.getByText('Enséñale a Coco cómo escribes los números')).toBeInTheDocument()
    expect(screen.getByText('¡Escribe el 1!')).toBeInTheDocument()
    write(1)
    wait(IDLE_MS_SLOW + 10)
    // the provider has no active child yet (onboarding): the sample still goes to the calibrated child
    expect(addInkSample).toHaveBeenCalledWith(expect.objectContaining({ childId: 'new-kid', digit: 1, source: 'calibration' }))
    expect(screen.getByTestId('pet')).toHaveAttribute('data-pose', 'happy')
    wait(800)
    expect(screen.getByText('¡Otra vez el 1!')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Número 2 de 20' })).toBeInTheDocument()
  })

  it('asks once more when the ink is not digit-like, then accepts the child’s writing', () => {
    setup(recognizer([{ digit: null, reason: 'scribble' }]))
    write(1)
    wait(IDLE_MS_SLOW + 10)
    expect(screen.getByText('¡Uy! No lo he visto bien. ¿Otra vez?')).toBeInTheDocument()
    expect(addInkSample).not.toHaveBeenCalled()
    wait(1400)
    write(1)
    wait(IDLE_MS_SLOW + 10)
    expect(addInkSample).toHaveBeenCalledTimes(1)
  })

  it('waits for the recogniser if it is still loading instead of losing the sample', async () => {
    const rec = recognizer([{ digit: 1 }])
    rec.ready = false
    rec.load = () => new Promise<void>((resolve) => setTimeout(() => { rec.ready = true; resolve() }, 1200))
    setup(rec)
    write(1)
    wait(IDLE_MS_SLOW + 10)
    expect(addInkSample).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(1300) }) // the model arrives
    await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    expect(addInkSample).toHaveBeenCalledWith(expect.objectContaining({ digit: 1, source: 'calibration' }))
  })

  it('too-small ink asks for a bigger digit; a scribble-out clears the pad', () => {
    setup()
    act(() => replayStrokes(pad(1), handwrite(1, { x: 10, y: 10, w: 40, h: 50 }, { fill: 0.7 })))
    wait(IDLE_MS_SLOW + 10)
    expect(screen.getByText('Hazlo un poco más grande, porfa.')).toBeInTheDocument()
    expect(addInkSample).not.toHaveBeenCalled()
    wait(1200)
    write(1)
    act(() => replayStrokes(pad(1), [scribble({ x: 20, y: 20, w: W - 40, h: H - 40 }, 5)]))
    wait(IDLE_MS_SLOW + 10)
    expect(addInkSample).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeDisabled()
  })

  it('Saltar finishes; a palm on it while the pen writes does not', () => {
    const { onDone } = setup()
    const skip = screen.getByRole('button', { name: 'Saltar' })
    notePenContact(true)
    fireEvent.pointerDown(skip, { pointerType: 'touch' })
    fireEvent.click(skip)
    expect(onDone).not.toHaveBeenCalled()
    notePenContact(false, performance.now() - 5000)
    fireEvent.pointerDown(skip, { pointerType: 'touch' })
    fireEvent.click(skip)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('once a pen was used, a finger gets a friendly hint instead of ink', () => {
    localStorage.setItem(PEN_SEEN_KEY, '2026-10-01')
    setup()
    act(() => replayStrokes(pad(1), handwrite(1, { x: 0, y: 0, w: W, h: H }, { pointerType: 'touch' })))
    expect(screen.getByText('¡Escribe con el lápiz!')).toBeInTheDocument()
    wait(IDLE_MS_SLOW + 10)
    expect(addInkSample).not.toHaveBeenCalled()
  })

  it('celebrates at the end', () => {
    const onDone = vi.fn()
    render(<InkProvider recognizer={recognizer([{ digit: 0 }])}><CalibrationFlow childId="k" companionName="Coco" onDone={onDone} repeats={1} /></InkProvider>)
    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
      write(d)
      wait(IDLE_MS_SLOW + 10)
      wait(800)
    }
    expect(screen.getByText('¡Coco ya conoce tu letra!')).toBeInTheDocument()
    expect(addInkSample).toHaveBeenCalledTimes(10)
    fireEvent.click(screen.getByRole('button', { name: '¡Vamos!' }))
    expect(onDone).toHaveBeenCalled()
  })
})
