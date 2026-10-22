import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import type { DigitCellProps } from '@/types'
import { CONTINUE_MS, IDLE_MS, PEN_SEEN_KEY } from './constants'
import { InkProvider } from './InkProvider'
import { DigitCell, type InkChangeInfo } from './DigitCell'
import { useInkLearning } from './hooks'
import { scriptedRecognizer, type ScriptedAnswer } from './dev/scripted'
import { replayStrokes, tap } from './dev/autoplay'
import { fixedElementSize, mockCanvas } from './dev/testing'
import { handwrite, scribble } from './fixtures'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))

const W = 80
const H = 96
let restore: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H) })
afterAll(() => restore())
beforeEach(() => { vi.useFakeTimers(); localStorage.clear() })
afterEach(() => { vi.useRealTimers() })

let learning: ReturnType<typeof useInkLearning>
function LearningProbe() { learning = useInkLearning(); return null }

function setup(answers: ScriptedAnswer[], props: Partial<DigitCellProps> = {}) {
  const rec = scriptedRecognizer(answers)
  const onChange = vi.fn<(d: number | null, info?: InkChangeInfo) => void>()
  function Host() {
    const [v, setV] = useState<number | null>(props.value ?? null)
    return <DigitCell {...props} value={v} onChange={(d, i) => { onChange(d, i as InkChangeInfo); setV(d) }} ariaLabel="cifra" />
  }
  const utils = render(<InkProvider recognizer={rec}><LearningProbe /><Host /></InkProvider>)
  const surface = screen.getByRole('textbox', { name: 'cifra' })
  const cell = surface.parentElement as HTMLElement
  return { ...utils, rec, onChange, surface, cell }
}

const write = (el: HTMLElement, d: number, pointerType: 'pen' | 'touch' = 'pen') =>
  act(() => replayStrokes(el, handwrite(d, { x: 0, y: 0, w: W, h: H }, { pointerType })))
const idle = (ms = IDLE_MS + 20) => act(() => { vi.advanceTimersByTime(ms) })

describe('DigitCell · handwriting', () => {
  it('recognises the digit after a short pause and typesets it over the faded ink', () => {
    const { rec, onChange, cell } = setup([{ digit: 7 }])
    write(cell.firstElementChild as HTMLElement, 7)
    expect(onChange).not.toHaveBeenCalled()
    expect(cell).toHaveAttribute('data-phase', 'pending')
    idle()
    expect(rec.calls).toHaveLength(1)
    expect(rec.calls[0].strokes).toHaveLength(2)
    expect(rec.calls[0].zone).toEqual({ width: W, height: H })
    expect(onChange).toHaveBeenCalledWith(7, expect.objectContaining({ via: 'pen', confidence: 0.97 }))
    expect(cell).toHaveAttribute('data-phase', 'recognized')
    expect(within(cell).getByText('7')).toBeInTheDocument()
  })

  it('waits for the second stroke of a slow 4', () => {
    const { rec, onChange, surface } = setup([{ digit: 4 }])
    const [a, b] = handwrite(4, { x: 0, y: 0, w: W, h: H })
    act(() => replayStrokes(surface, [a]))
    idle(IDLE_MS - 200)
    act(() => replayStrokes(surface, [b]))
    idle(IDLE_MS - 200)
    expect(onChange).not.toHaveBeenCalled()
    idle(300)
    expect(rec.calls).toHaveLength(1)
    expect(rec.calls[0].strokes).toHaveLength(2)
    expect(onChange).toHaveBeenCalledWith(4, expect.anything())
  })

  it('low confidence: shows "?" and offers alternatives; picking one is a recognition fix', () => {
    const { onChange, surface, cell } = setup([{ digit: 7, confidence: 0.42, alternatives: [7, 1, 2] }])
    write(surface, 7)
    idle()
    expect(cell).toHaveAttribute('data-phase', 'unsure')
    expect(within(cell).getByText('?')).toBeInTheDocument()
    act(() => tap(surface, 40, 40))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Es un 7', 'Es un 1', 'Es un 2', 'Escribirlo otra vez'])
    fireEvent.click(within(dialog).getByRole('button', { name: 'Es un 1' }))
    expect(onChange).toHaveBeenLastCalledWith(1, expect.objectContaining({ recognitionFix: true, confidence: 1 }))
    expect(learning.recognitionFixes()).toBe(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cell).toHaveAttribute('data-phase', 'recognized')
  })

  it('unreadable ink: no value, "?" and the full digit picker', () => {
    const { onChange, surface, cell } = setup([{ digit: null }])
    write(surface, 8)
    idle()
    expect(cell).toHaveAttribute('data-phase', 'unknown')
    expect(onChange).not.toHaveBeenCalled()
    act(() => tap(surface, 40, 40))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Es un 8' }))
    expect(onChange).toHaveBeenLastCalledWith(8, expect.anything())
  })

  it('scribble-out clears the cell', () => {
    const { onChange, surface, cell } = setup([{ digit: 3 }])
    write(surface, 3)
    idle()
    expect(onChange).toHaveBeenLastCalledWith(3, expect.anything())
    act(() => replayStrokes(surface, [scribble({ x: 8, y: 8, w: W - 16, h: H - 16 }, 5)]))
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
    expect(cell).toHaveAttribute('data-phase', 'empty')
  })

  it('writing again later replaces the digit; a quick extra stroke continues it', () => {
    const { rec, onChange, surface } = setup([{ digit: 1 }, { digit: 7 }, { digit: 4 }])
    const [one] = handwrite(1, { x: 0, y: 0, w: W, h: H })
    act(() => replayStrokes(surface, [one]))
    idle()
    expect(onChange).toHaveBeenLastCalledWith(1, expect.anything())
    // the crossbar of a 7, right after: continues the same digit
    const [, bar] = handwrite(7, { x: 0, y: 0, w: W, h: H })
    act(() => replayStrokes(surface, [bar]))
    idle()
    expect(rec.calls[1].strokes).toHaveLength(2)
    expect(onChange).toHaveBeenLastCalledWith(7, expect.anything())
    // much later, a full new digit: replaces the old ink
    act(() => { vi.advanceTimersByTime(CONTINUE_MS + 200) })
    act(() => replayStrokes(surface, [one]))
    idle()
    expect(rec.calls[2].strokes).toHaveLength(1)
  })

  it('a quick tap on a recognised cell lets the child rewrite it', () => {
    const { onChange, surface, cell } = setup([{ digit: 6 }])
    write(surface, 6)
    idle()
    act(() => tap(surface, 40, 40))
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
    expect(cell).toHaveAttribute('data-phase', 'empty')
  })

  it('the pen eraser clears the cell', () => {
    const { onChange, surface } = setup([{ digit: 2 }])
    write(surface, 2)
    idle()
    act(() => {
      surface.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, pointerType: 'pen', buttons: 32, button: 5, clientX: 30, clientY: 30 }))
      surface.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9, pointerType: 'pen', clientX: 30, clientY: 30 }))
    })
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
  })

  it('palm rejection: once a pen was used, finger strokes do not write', () => {
    localStorage.setItem(PEN_SEEN_KEY, '2026-10-01')
    const { rec, onChange, surface } = setup([{ digit: 1 }])
    write(surface, 1, 'touch')
    idle()
    expect(rec.calls).toHaveLength(0)
    expect(onChange).not.toHaveBeenCalled()
    write(surface, 1, 'pen')
    idle()
    expect(onChange).toHaveBeenCalledWith(1, expect.objectContaining({ via: 'pen' }))
  })

  it('confirm() after a correct answer stores the recognised digits as personal samples', async () => {
    const data = await import('@/data')
    const add = vi.mocked(data.addInkSample)
    add.mockClear()
    const rec = scriptedRecognizer([{ digit: 5 }])
    rec.recognize = ((orig) => (s, z) => ({ ...orig(s, z), embedding: [0.1, 0.2] }))(rec.recognize)
    render(<InkProvider recognizer={rec} childId="kid"><LearningProbe /><DigitCell value={null} onChange={() => {}} ariaLabel="c" /></InkProvider>)
    write(screen.getByRole('textbox', { name: 'c' }), 5)
    idle()
    act(() => learning.confirm())
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ digit: 5, source: 'confirmed', childId: 'kid' }))
  })
})

describe('DigitCell · keyboard and props', () => {
  it('digits fill the cell, Backspace clears it', () => {
    const { onChange, surface } = setup([])
    surface.focus()
    fireEvent.keyDown(surface, { key: '5' })
    expect(onChange).toHaveBeenLastCalledWith(5, { confidence: 1, via: 'keyboard' })
    expect(within(surface).getByText('5')).toBeInTheDocument()
    fireEvent.keyDown(surface, { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
  })

  it('given cells are read-only and not focusable', () => {
    const onChange = vi.fn()
    render(<DigitCell variant="given" value={4} onChange={onChange} ariaLabel="dada" />)
    const surface = screen.getByRole('textbox', { name: 'dada' })
    expect(surface).not.toHaveAttribute('tabindex')
    fireEvent.keyDown(surface, { key: '7' })
    expect(onChange).not.toHaveBeenCalled()
    expect(within(surface).getByText('4')).toBeInTheDocument()
  })

  it('an external value change replaces the ink', () => {
    const rec = scriptedRecognizer([{ digit: 9 }])
    const onChange = vi.fn()
    const { rerender } = render(<InkProvider recognizer={rec}><DigitCell value={null} onChange={onChange} ariaLabel="x" /></InkProvider>)
    const surface = screen.getByRole('textbox', { name: 'x' })
    write(surface, 9)
    idle()
    rerender(<InkProvider recognizer={rec}><DigitCell value={3} onChange={onChange} ariaLabel="x" /></InkProvider>)
    expect(surface.parentElement).toHaveAttribute('data-phase', 'typed')
    expect(within(surface).getByText('3')).toBeInTheDocument()
  })

  it('disabled cells ignore input; status is exposed', () => {
    const onChange = vi.fn()
    render(<DigitCell value={null} onChange={onChange} disabled status="wrong" ariaLabel="d" />)
    const surface = screen.getByRole('textbox', { name: 'd' })
    fireEvent.keyDown(surface, { key: '1' })
    write(surface, 1)
    idle()
    expect(onChange).not.toHaveBeenCalled()
    expect(surface).toHaveAttribute('aria-invalid', 'true')
  })
})
