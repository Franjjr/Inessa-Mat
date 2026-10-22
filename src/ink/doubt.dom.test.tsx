import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { CONTINUE_MS, IDLE_MS } from './constants'
import { InkProvider } from './InkProvider'
import { DigitCell, type InkChangeInfo } from './DigitCell'
import { useInkLearning } from './hooks'
import { replayStrokes } from './dev/autoplay'
import { scriptedRecognizer, type ScriptedAnswer } from './dev/scripted'
import { fixedElementSize, mockCanvas } from './dev/testing'
import { handwrite } from './fixtures'

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

function setup(answers: ScriptedAnswer[]) {
  const rec = scriptedRecognizer(answers)
  function Host() {
    const [v, setV] = useState<number | null>(null)
    return <DigitCell value={v} onChange={(d: number | null, _i?: InkChangeInfo) => setV(d)} ariaLabel="cifra" />
  }
  render(<InkProvider recognizer={rec}><LearningProbe /><Host /></InkProvider>)
  const surface = screen.getByRole('textbox', { name: 'cifra' })
  return { cell: surface.parentElement as HTMLElement, surface }
}

const write = (el: HTMLElement, d: number) =>
  act(() => replayStrokes(el, handwrite(d, { x: 0, y: 0, w: W, h: H }, { pointerType: 'pen' })))
const idle = () => act(() => { vi.advanceTimersByTime(Math.max(IDLE_MS, CONTINUE_MS) + 40) })

describe('ink · a low-confidence digit must be confirmed before grading', () => {
  it('a doubtful read puts the digit in doubt and the prompt asks the child to confirm it', () => {
    const { cell } = setup([{ digit: 7, confidence: 0.35 }])
    write(cell.firstElementChild as HTMLElement, 7)
    idle()
    expect(learning.uncertain()).toBe(1)
    expect(learning.uncertainDigits()).toEqual([7])
    act(() => { expect(learning.requestConfirm()).toBe(true) })
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('¿Has escrito un 7? Si no, bórralo y escríbelo otra vez')
    fireEvent.click(screen.getByRole('button', { name: 'Sí, es así' }))
    expect(learning.uncertain()).toBe(0)
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
  })

  it('a confident read is never in doubt', () => {
    const { cell } = setup([{ digit: 7, confidence: 0.95 }])
    write(cell.firstElementChild as HTMLElement, 7)
    idle()
    expect(learning.uncertain()).toBe(0)
    act(() => { expect(learning.requestConfirm()).toBe(false) })
  })

  it('typing a digit with the keyboard is certain: nothing is in doubt', () => {
    const { surface } = setup([])
    fireEvent.keyDown(surface, { key: '5' })
    expect(learning.uncertain()).toBe(0)
  })
})
