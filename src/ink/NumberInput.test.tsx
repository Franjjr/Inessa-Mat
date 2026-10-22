import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { IDLE_MS } from './constants'
import { InkProvider } from './InkProvider'
import { NumberInput } from './NumberInput'
import { useInkLearning } from './hooks'
import { notePenContact } from './policy'
import { scriptedRecognizer, type ScriptedAnswer } from './dev/scripted'
import { replayStrokes, tap } from './dev/autoplay'
import { fixedElementSize, mockCanvas } from './dev/testing'
import { handwriteNumber, scribble } from './fixtures'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))

const W = 320
const H = 120
let restore: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H) })
afterAll(() => restore())
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

let learning: ReturnType<typeof useInkLearning>
function Probe() { learning = useInkLearning(); return null }

function setup(answers: ScriptedAnswer[], maxDigits = 3) {
  const rec = scriptedRecognizer(answers)
  const onChange = vi.fn()
  const onSubmit = vi.fn()
  function Host() {
    const [v, setV] = useState<number | null>(null)
    return <NumberInput value={v} onChange={(x) => { onChange(x); setV(x) }} onSubmit={onSubmit} maxDigits={maxDigits} ariaLabel="respuesta" />
  }
  render(<InkProvider recognizer={rec}><Probe /><Host /></InkProvider>)
  return { rec, onChange, onSubmit, pad: screen.getByRole('textbox', { name: 'respuesta' }) }
}

const write = (pad: HTMLElement, n: string) =>
  act(() => replayStrokes(pad, handwriteNumber(n, { x: 40, y: 0, w: 100 * n.length, h: H }, { seed: 5 })))
const idle = () => act(() => { vi.advanceTimersByTime(IDLE_MS + 20) })

describe('NumberInput · handwriting', () => {
  it('segments the strokes into digits, recognises each and shows the number', () => {
    const { rec, onChange, pad } = setup([{ digit: 4 }, { digit: 2 }])
    write(pad, '42')
    idle()
    expect(rec.calls).toHaveLength(2)
    expect(rec.calls[0].strokes).toHaveLength(2) // the 4 has two strokes
    expect(onChange).toHaveBeenLastCalledWith(42)
    expect(within(pad).getByText('4')).toBeInTheDocument()
    expect(within(pad).getByText('2')).toBeInTheDocument()
  })

  it('✓ submits, recognising pending ink first', () => {
    const { onSubmit, pad } = setup([{ digit: 5 }, { digit: 6 }])
    write(pad, '56')
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onSubmit).toHaveBeenCalledWith(56)
  })

  it('a palm on ✓ while the pen writes does not submit; a later finger tap does', () => {
    const { onSubmit, pad } = setup([{ digit: 5 }, { digit: 6 }])
    write(pad, '56')
    idle()
    const check = screen.getByRole('button', { name: 'Comprobar' })
    notePenContact(true) // the pen is writing somewhere and the palm lands on ✓
    fireEvent.pointerDown(check, { pointerType: 'touch' })
    fireEvent.click(check)
    expect(onSubmit).not.toHaveBeenCalled()
    notePenContact(false, performance.now() - 5000)
    fireEvent.pointerDown(check, { pointerType: 'touch' })
    fireEvent.click(check)
    expect(onSubmit).toHaveBeenCalledWith(56)
  })

  it('an unsure digit offers alternatives; picking one fixes the number', () => {
    const { onChange, pad } = setup([{ digit: 5, confidence: 0.4, alternatives: [5, 6, 3] }, { digit: 6 }])
    write(pad, '56')
    idle()
    expect(onChange).toHaveBeenLastCalledWith(56)
    act(() => tap(pad, 90, 60))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Es un 6' }))
    expect(onChange).toHaveBeenLastCalledWith(66)
    expect(learning.recognitionFixes()).toBe(1)
  })

  it('scribbling over a digit erases just that digit', () => {
    const { onChange, pad } = setup([{ digit: 4 }, { digit: 2 }, { digit: 2 }])
    write(pad, '42')
    idle()
    act(() => replayStrokes(pad, [scribble({ x: 45, y: 10, w: 80, h: H - 20 }, 5)]))
    act(() => { vi.advanceTimersByTime(5) })
    expect(onChange).toHaveBeenLastCalledWith(2)
  })

  it('the eraser button clears everything', () => {
    const { onChange, pad } = setup([{ digit: 4 }, { digit: 2 }])
    write(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(within(pad).queryByText('4')).toBeNull()
  })
})

describe('NumberInput · keyboard', () => {
  it('types digits up to maxDigits, Backspace deletes, Enter submits', () => {
    const { onChange, onSubmit, pad } = setup([], 2)
    pad.focus()
    for (const k of ['4', '2', '7']) fireEvent.keyDown(pad, { key: k })
    expect(onChange).toHaveBeenLastCalledWith(42)
    fireEvent.keyDown(pad, { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith(4)
    fireEvent.keyDown(pad, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith(4)
    fireEvent.keyDown(pad, { key: 'Escape' })
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('the keypad fallback types into the pad', () => {
    const { onChange, onSubmit } = setup([])
    fireEvent.click(screen.getByRole('button', { name: 'Usar el teclado de números' }))
    const keypad = screen.getByRole('group', { name: 'Teclado de números' })
    fireEvent.click(within(keypad).getByRole('button', { name: '8' }))
    fireEvent.click(within(keypad).getByRole('button', { name: '1' }))
    expect(onChange).toHaveBeenLastCalledWith(81)
    fireEvent.click(within(keypad).getByRole('button', { name: 'Comprobar' }))
    expect(onSubmit).toHaveBeenCalledWith(81)
  })
})
