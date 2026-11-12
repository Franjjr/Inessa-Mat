/* Revisión de «escritura y teclado»: los arreglos que pidió el revisor.
   - «No, yo he escrito otra cosa» se puede decir una sola vez por ejercicio y solo cuando una mala lectura es creíble.
   - Una pregunta abierta se cierra cuando su ejercicio cambia: nunca califica un ejercicio que ya no está.
   - La tarjeta del adulto enseña el número en el orden de la pantalla, sin las llevadas.
   - El tecleo tipo calculadora avisa de que hay que tocar el número siguiente.
   - Con barra de respuesta, el teclado de números no trae su propio ✓.
   - PlaceValueView con cuatro casillas: como mucho un «¿Sin lápiz? ¡Toca aquí!». */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeColumnAdd, makeColumnSub } from '@/engine'
import { makePlaceValue } from '@/engine/numeric'
import type { DigitRecognition, ExerciseOutcome, FactMulExercise, WordProblemExercise } from '@/types'
import ColumnView from '@/activities/views/ColumnView'
import FactView from '@/activities/views/FactView'
import PlaceValueView from '@/activities/views/PlaceValueView'
import WordProblemView from '@/activities/views/WordProblemView'
import { CellGroup, NEXT_NUMBER_TIP } from '../CellGroup'
import { CONTINUE_MS, IDLE_MS, PEN_SEEN_KEY } from '../constants'
import type { LearningStore } from '../context'
import { DigitCell } from '../DigitCell'
import { useInkStore, useInputMode } from '../hooks'
import { InkProvider } from '../InkProvider'
import { notePenContact } from '../policy'
import { readsOnScreen } from '../questions'
import { takeInkReading } from '../readLog'
import { replayStrokes } from '../dev/autoplay'
import { scriptedRecognizer, type ScriptedAnswer } from '../dev/scripted'
import { asTablet, fixedElementSize, mockCanvas } from '../dev/testing'
import { handwrite, handwriteNumber } from '../fixtures'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}), stop: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const W = 320
const H = 120
let restore: () => void
let restoreTablet: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H); restoreTablet = asTablet() })
afterAll(() => { restore(); restoreTablet() })
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); localStorage.clear() })

let store: LearningStore
function StoreProbe() { store = useInkStore(); store.random = () => 0.99; return null }
function KeypadMode() {
  const { setPreferred } = useInputMode()
  useEffect(() => { setPreferred('keypad') }, [setPreferred])
  return null
}

const withInk = (answers: ScriptedAnswer[], ui: React.ReactNode) =>
  render(<InkProvider recognizer={scriptedRecognizer(answers)}><StoreProbe />{ui}</InkProvider>)
const surfaceOf = (name: RegExp | string) => screen.getByRole('textbox', { name })
const writeNumber = (el: HTMLElement, n: string, seed = 5) =>
  act(() => replayStrokes(el, handwriteNumber(n, { x: 40, y: 0, w: 100 * n.length, h: H }, { seed, pointerType: 'pen' })))
const writeDigit = (el: HTMLElement, d: number) =>
  act(() => replayStrokes(el, handwrite(d, { x: 0, y: 0, w: W, h: H }, { pointerType: 'pen' })))
const idle = () => act(() => { vi.advanceTimersByTime(Math.max(IDLE_MS, CONTINUE_MS) + 40) })
const comprobar = () => fireEvent.click(screen.getByRole('button', { name: /Comprobar/ }))
const disputeButton = () => screen.queryByRole('button', { name: 'No, yo he escrito otra cosa' })
function typeKeys(keys: string) {
  for (const k of keys) fireEvent.keyDown(document.activeElement as HTMLElement, { key: k })
}

const fact = (a: number, b: number): FactMulExercise =>
  ({ id: `f-${a}x${b}`, kind: 'fact-mul', skill: `mul:${a}x${b}` as FactMulExercise['skill'], difficulty: 1, a, b, answer: a * b })
/** A confident 7 whose second choice is the 2: no question before grading, but a misread is believable. */
const SEVEN: ScriptedAnswer = { digit: 7, alternatives: [7, 2] }

describe('«No, yo he escrito otra cosa»: una vez y solo si es creíble', () => {
  it('dos disputas seguidas no son posibles y el segundo fallo de verdad lleva a la solución', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    // 47 · (dispute) · 43 · 47
    withInk([{ digit: 4 }, SEVEN, { digit: 4 }, { digit: 3 }, { digit: 4 }, SEVEN], <FactView exercise={fact(6, 7)} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    comprobar()
    fireEvent.click(disputeButton()!)
    writeNumber(pad, '42', 9)
    idle()
    comprobar()
    expect(screen.getByRole('status')).toHaveTextContent(/^Has escrito 43\./)
    expect(disputeButton()).toBeNull() // once per exercise
    writeNumber(pad, '42', 13)
    idle()
    comprobar()
    expect(screen.getByRole('status')).toHaveTextContent('Tú: 47 · Solución: 42')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: false })
  })

  it('un «5» leído con seguridad para 42 no es una mala lectura: no se ofrece y se llega a la solución', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 5, confidence: 0.99, alternatives: [5, 6, 3] }], <FactView exercise={fact(6, 7)} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '5')
    idle()
    comprobar()
    expect(screen.getByRole('status')).toHaveTextContent(/^Has escrito 5\./)
    expect(disputeButton()).toBeNull()
    writeNumber(pad, '5', 9)
    idle()
    comprobar()
    expect(screen.getByRole('status')).toHaveTextContent('Tú: 5 · Solución: 42')
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: false, given: '5' })
  })

  it('tras la disputa, teclear otra respuesta distinta cuenta el intento', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 4 }, SEVEN], <FactView exercise={fact(6, 7)} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    comprobar()
    fireEvent.click(disputeButton()!)
    fireEvent.keyDown(pad, { key: '3' })
    fireEvent.keyDown(pad, { key: '6' })
    fireEvent.keyDown(pad, { key: 'Enter' })
    // 36 is not 47 with one digit fixed: the try taken back counts again, and this is the second one.
    expect(screen.getByRole('status')).toHaveTextContent('Tú: 36 · Solución: 42')
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: false, given: '36' })
  })
})

describe('una pregunta abierta se cierra al cambiar de ejercicio', () => {
  it('FactView: «He leído 47» abierta, llega 8 × 9 → la pregunta se va y 72 se califica', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const ui = (ex: FactMulExercise) => (
      <InkProvider recognizer={rec}><StoreProbe /><FactView exercise={ex} onAnswered={onAnswered} /></InkProvider>
    )
    const rec = scriptedRecognizer([{ digit: 4 }, { digit: 7, confidence: 0.85, alternatives: [7, 2, 1] }])
    const { rerender } = render(ui(fact(6, 7)))
    writeNumber(surfaceOf('Producto de 6 por 7'), '42')
    idle()
    comprobar()
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('He leído 47')
    rerender(ui(fact(8, 9)))
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    const pad = surfaceOf('Producto de 8 por 9')
    pad.focus()
    fireEvent.keyDown(pad, { key: '7' })
    fireEvent.keyDown(pad, { key: '2' })
    fireEvent.keyDown(pad, { key: 'Enter' })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, given: '72' })
  })

  it('ColumnView sin pausa: «¿Querías escribir 225?» abierta, llega otra cuenta → se va y la nueva se califica', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    const rec = scriptedRecognizer([])
    const ui = (ex: ReturnType<typeof makeColumnSub>) => (
      <InkProvider recognizer={rec}><ColumnView exercise={ex} onAnswered={onAnswered} showFeedback={false} /></InkProvider>
    )
    const { rerender } = render(ui(makeColumnSub(352, 127)))
    surfaceOf(/unidades del resultado/).focus()
    typeKeys('225')
    act(() => { fireEvent.keyDown(surfaceOf(/unidades del resultado/), { key: 'Enter' }) })
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('¿Querías escribir 225?')
    rerender(ui(makeColumnSub(468, 123)))
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    surfaceOf(/unidades del resultado/).focus()
    typeKeys('543')
    act(() => { fireEvent.keyDown(surfaceOf(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, given: '345' })
  })
})

describe('lo que la app leyó, en el orden de la pantalla', () => {
  it('ColumnView 368 + 257 escrito empezando por las unidades → la lectura guardada es 7, 2, 5 (no 5, 2, 7)', () => {
    const ex = makeColumnAdd([368, 257])
    withInk([{ digit: 5 }, { digit: 2 }, { digit: 7 }], <ColumnView exercise={ex} onAnswered={() => {}} showFeedback={false} />)
    writeDigit(surfaceOf(/unidades del resultado/), 5)
    writeDigit(surfaceOf(/decenas del resultado/), 2)
    writeDigit(surfaceOf(/centenas del resultado/), 7)
    idle()
    act(() => { vi.advanceTimersByTime(1000) })
    fireEvent.click(screen.getByRole('button', { name: /Comprobar/ }))
    act(() => { vi.advanceTimersByTime(1000) })
    const reading = takeInkReading(ex.kind, '725')
    expect(reading?.digits.map((d) => d.digit)).toEqual([7, 2, 5])
  })

  it('las casillas de llevada no entran en la lectura', () => {
    withInk([], null)
    const rec = (digit: number): DigitRecognition => ({ digit, confidence: 0.97, probs: [], alternatives: [], embedding: [], image28: new Float32Array(784) })
    const off = [store.registerSurface('c', { flush: () => false, rewrite() {}, pick() {} }),
      store.registerSurface('u', { flush: () => false, rewrite() {}, pick() {} })]
    store.noteRead('c', rec(1), false, { carry: true })
    store.noteRead('u', rec(5), false)
    expect(readsOnScreen(store).map(({ read }) => read.digit)).toEqual([5])
    off.forEach((f) => f())
  })
})

describe('tecleo tipo calculadora: el número siguiente', () => {
  it('dos saltos de 3 casillas: tras teclear «40» se avisa de tocar la casilla siguiente', () => {
    function Host() {
      const [a, setA] = useState<(number | null)[]>([null, null, null])
      const [b, setB] = useState<(number | null)[]>([null, null, null])
      const cells = (id: string, d: (number | null)[], set: typeof setA) => [2, 1, 0].map((i) => (
        <DigitCell key={`${id}${i}`} numberId={id} cellId={`${id}${i}`} value={d[i]}
          onChange={(v) => set((p) => p.map((x, j) => (j === i ? v : x)))} ariaLabel={`${id} cifra ${i}`} />
      ))
      return <CellGroup keypad="show">{cells('a', a, setA)}{cells('b', b, setB)}</CellGroup>
    }
    withInk([], <Host />)
    surfaceOf('a cifra 0').focus()
    typeKeys('4')
    expect(screen.getByText(NEXT_NUMBER_TIP)).toBeInTheDocument()
    typeKeys('0')
    expect(screen.getByText(NEXT_NUMBER_TIP)).toBeInTheDocument()
    expect(document.activeElement).toBe(surfaceOf('a cifra 0')) // the cursor waits on the number
    fireEvent.focus(surfaceOf('b cifra 0'))
    surfaceOf('b cifra 0').focus()
    typeKeys('5')
    // The second number has nothing after it: no tip.
    expect(screen.queryByText(NEXT_NUMBER_TIP)).toBeNull()
  })
})

describe('un solo botón de comprobar', () => {
  it('con el teclado de números en una pantalla con barra, el teclado no trae su ✓', () => {
    const ex: WordProblemExercise = {
      id: 'wp-3-2', kind: 'word-problem', skill: 'word:add:3' as WordProblemExercise['skill'], difficulty: 2,
      text: 'Ana tiene 3 estrellas y le dan 2 más. ¿Cuántas tiene ahora?', op: 'add', operands: [3, 2], answer: 5, unit: 'estrellas',
    }
    withInk([], <><KeypadMode /><WordProblemView exercise={ex} onAnswered={() => {}} /></>)
    surfaceOf('Respuesta').focus()
    expect(screen.getByRole('group', { name: 'Teclado de números' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Comprobar/ })).toHaveLength(1)
  })
})

describe('P6-09 · PlaceValueView con cuatro casillas', () => {
  it('el dedo en las cuatro casillas tras usar el lápiz: como mucho un «¿Sin lápiz? ¡Toca aquí!»', () => {
    localStorage.setItem(PEN_SEEN_KEY, '2026-10-01')
    withInk([{ digit: 4 }], <PlaceValueView exercise={makePlaceValue(4325, 'expanded')} onAnswered={() => {}} showFeedback={false} />)
    notePenContact(false, performance.now() - 10_000)
    const boxes = screen.getAllByRole('textbox', { name: /Valor de/ })
    expect(boxes).toHaveLength(4)
    for (const b of boxes) {
      act(() => replayStrokes(b, handwriteNumber('4', { x: 40, y: 0, w: 100, h: H }, { pointerType: 'touch' })))
      expect(screen.getAllByText('¿Sin lápiz? ¡Toca aquí!').length).toBeLessThanOrEqual(1)
    }
    expect(screen.getAllByText('¿Sin lápiz? ¡Toca aquí!')).toHaveLength(1)
  })
})
