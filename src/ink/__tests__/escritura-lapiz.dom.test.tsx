/* Auditoría P2 (escritura a mano): la app califica exactamente lo que la niña escribió.
   Reescritas a partir de los hallazgos (las pruebas originales del worktree ba6-5 se perdieron). */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeColumnAdd } from '@/engine'
import type { ExerciseOutcome, FactMulExercise, WordProblemExercise } from '@/types'
import ColumnView from '@/activities/views/ColumnView'
import FactView from '@/activities/views/FactView'
import WordProblemView from '@/activities/views/WordProblemView'
import { READ_PAUSE_MS } from '@/activities/groups/AnswerBar'
import { CONTINUE_MS, IDLE_MS } from '../constants'
import type { LearningStore } from '../context'
import { DigitCell, TWO_DIGITS_TEXT } from '../DigitCell'
import { useInkStore } from '../hooks'
import { InkProvider } from '../InkProvider'
import { NumberInput, tooManyDigitsText } from '../NumberInput'
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
afterEach(() => { vi.useRealTimers() })

let store: LearningStore
function StoreProbe() { store = useInkStore(); store.random = () => 0.99; return null }

function withInk(answers: ScriptedAnswer[] | ((strokes: Parameters<typeof replayStrokes>[1]) => ScriptedAnswer), ui: React.ReactNode) {
  const rec = scriptedRecognizer(answers)
  render(<InkProvider recognizer={rec}><StoreProbe />{ui}</InkProvider>)
  return rec
}

const surfaceOf = (name: RegExp | string) => screen.getByRole('textbox', { name })
const writeDigit = (el: HTMLElement, d: number) =>
  act(() => replayStrokes(el, handwrite(d, { x: 0, y: 0, w: W, h: H }, { pointerType: 'pen' })))
const writeNumber = (el: HTMLElement, n: string, x = 40, seed = 5) =>
  act(() => replayStrokes(el, handwriteNumber(n, { x, y: 0, w: 100 * n.length, h: H }, { seed, pointerType: 'pen' })))
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const idle = () => wait(Math.max(IDLE_MS, CONTINUE_MS) + 40)

const fact67: FactMulExercise = { id: 'f-6x7', kind: 'fact-mul', skill: 'mul:6x7' as FactMulExercise['skill'], difficulty: 1, a: 6, b: 7, answer: 42 }

describe('P2-01 · «Comprobar» justo después de escribir: la última cifra cuenta', () => {
  it('ColumnView 368 + 257 escrito a mano y Comprobar enseguida → se califica 625', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 5 }, { digit: 2 }, { digit: 6 }], <ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={onAnswered} showFeedback={false} />)
    writeDigit(surfaceOf(/unidades del resultado/), 5)
    writeDigit(surfaceOf(/decenas del resultado/), 2)
    writeDigit(surfaceOf(/centenas del resultado/), 6)
    // No pause: the last digits are still waiting to be read.
    const check = screen.getByRole('button', { name: /Comprobar|Leyendo/ })
    fireEvent.click(check)
    expect(onAnswered).not.toHaveBeenCalled() // the digits just read show first
    wait(READ_PAUSE_MS + 10)
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, given: '625' })
  })

  it('WordProblemView: escribe «3», pausa, «0» y toca Comprobar → se califica 30', () => {
    const ex: WordProblemExercise = {
      id: 'wp-20-10', kind: 'word-problem', skill: 'word:add:2' as WordProblemExercise['skill'], difficulty: 1,
      text: 'Ana tiene 20 cromos y le dan 10 más. ¿Cuántos tiene ahora?', op: 'add', operands: [20, 10], answer: 30, unit: 'cromos',
    }
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    // The 3 is read after the pause; then both digits are read again: 3 and 0.
    withInk([{ digit: 3 }, { digit: 3 }, { digit: 0 }], <WordProblemView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const pad = surfaceOf('Respuesta')
    act(() => replayStrokes(pad, handwrite(3, { x: 40, y: 0, w: 100, h: H }, { pointerType: 'pen' })))
    idle()
    act(() => replayStrokes(pad, handwrite(0, { x: 160, y: 0, w: 100, h: H }, { pointerType: 'pen', t0: 9000 })))
    fireEvent.click(screen.getByRole('button', { name: /Comprobar|Leyendo/ }))
    wait(READ_PAUSE_MS + 10)
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ given: '30', correct: true })
  })

  it('dentro de una pantalla con barra de respuesta solo hay un botón «Comprobar»', () => {
    const ex: WordProblemExercise = {
      id: 'wp-3-2', kind: 'word-problem', skill: 'word:add:3' as WordProblemExercise['skill'], difficulty: 2,
      text: 'Ana tiene 3 estrellas y le dan 2 más. ¿Cuántas tiene ahora?', op: 'add', operands: [3, 2], answer: 5, unit: 'estrellas',
    }
    withInk([], <WordProblemView exercise={ex} onAnswered={() => {}} />)
    expect(screen.getAllByRole('button', { name: /Comprobar/ })).toHaveLength(1)
  })
})

describe('P2-02 · una cifra que se pudo leer mal: se pregunta antes de calificar', () => {
  it('42 leído 47 (alternativa 2): «He leído 47» sin contar intento; «No» y reescribir bien → correcto, errorType recognition', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    // 4, then a 7 read with doubts (0.85) whose second choice is 2; after the rewrite, a clear 2.
    const rec = withInk([{ digit: 4 }, { digit: 7, confidence: 0.85, alternatives: [7, 2, 1] }, { digit: 4 }, { digit: 4 }, { digit: 2 }],
      <FactView exercise={fact67} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    const prompt = screen.getByTestId('ink-doubt-prompt')
    expect(prompt).toHaveTextContent('He leído 47. ¿Es lo que has escrito?')
    expect(onAnswered).not.toHaveBeenCalled()
    expect(screen.queryByText(/Has escrito/)).toBeNull() // no try was counted
    fireEvent.click(screen.getByRole('button', { name: 'No, lo escribo otra vez' }))
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    // The 7 was erased; she writes a 2 in its place.
    act(() => replayStrokes(pad, handwrite(2, { x: 140, y: 0, w: 100, h: H }, { pointerType: 'pen', t0: 20000 })))
    idle()
    expect(rec.calls.length).toBeGreaterThanOrEqual(4)
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, errorType: 'recognition' })
  })

  it('«Sí» califica lo leído tal cual (47 está mal)', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 4 }, { digit: 7, confidence: 0.85, alternatives: [7, 2, 1] }], <FactView exercise={fact67} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }))
    expect(screen.getByRole('status')).toHaveTextContent(/^Has escrito 47\./)
    // She has just said the app read her well: «No, yo he escrito otra cosa» makes no sense now.
    expect(screen.queryByRole('button', { name: 'No, yo he escrito otra cosa' })).toBeNull()
  })

  it('«No, el 7 es un 2» cambia esa cifra; al comprobar otra vez está bien (errorType recognition)', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 4 }, { digit: 7, confidence: 0.85, alternatives: [7, 2, 1] }], <FactView exercise={fact67} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'No, el 7 es un 2' }))
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    expect(pad.closest('[data-value]')).toHaveAttribute('data-value', '42')
    expect(onAnswered).not.toHaveBeenCalled() // nothing is graded until she checks again
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, errorType: 'recognition' })
  })

  it('47 leído con seguridad 0,99 (la alternativa 2 casi no cuenta): se califica sin preguntar', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 4, confidence: 0.99 }, { digit: 7, confidence: 0.99, alternatives: [7, 2] }], <FactView exercise={fact67} onAnswered={onAnswered} />)
    writeNumber(surfaceOf('Producto de 6 por 7'), '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/^Has escrito 47\./)
  })
})

describe('P2-03 · tras un fallo lo escrito se queda y el mensaje dice lo leído', () => {
  it('FactView: 42 leído 47 con seguridad → el campo conserva 47, «Has escrito 47»; al final «Tú: 47»', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    // A confident 7 whose second choice is the 2 (0.03): no question, but a misread is believable.
    withInk([{ digit: 4 }, { digit: 7, alternatives: [7, 2] }], <FactView exercise={fact67} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(screen.getByRole('status')).toHaveTextContent(/^Has escrito 47\./)
    // The pad still shows what she wrote, as read.
    expect(pad.closest('[data-value]')).toHaveAttribute('data-value', '47')
    expect(within(pad).getByText('4')).toBeInTheDocument()
    expect(within(pad).getByText('7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No, yo he escrito otra cosa' })).toBeInTheDocument()
    // Writing again starts afresh: the same misread a second time ends the exercise.
    writeNumber(pad, '42', 40, 9)
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Tú: 47 · Solución: 42')
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: false, given: '47' })
  })

  it('«No, yo he escrito otra cosa» deshace el intento: escribirlo otra vez y acertar cuenta como acierto (recognition)', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    // A confident 7 (no question before grading); after the dispute she writes the number again.
    withInk([{ digit: 4 }, { digit: 7, alternatives: [7, 2] }, { digit: 4 }, { digit: 2 }], <FactView exercise={fact67} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'No, yo he escrito otra cosa' }))
    expect(screen.getByRole('status')).toHaveTextContent(/Toca la cifra/)
    // She writes the number again: now it is read 42 (one digit changed, the one in dispute).
    writeNumber(pad, '42', 40, 9)
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    const o = onAnswered.mock.calls[0][0]
    expect(o.check).toMatchObject({ correct: true, errorType: 'recognition' })
    expect(o.retries ?? 0).toBe(0)
  })
})

describe('P2-04 · tinta que no se pudo leer: nunca se califica como vacía', () => {
  it('ColumnView con la centena ilegible → no se califica y aparece el selector «¿Qué número es?»', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 5 }, { digit: 2 }, { digit: null }], <ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={onAnswered} showFeedback={false} />)
    writeDigit(surfaceOf(/unidades del resultado/), 5)
    writeDigit(surfaceOf(/decenas del resultado/), 2)
    writeDigit(surfaceOf(/centenas del resultado/), 6)
    idle()
    fireEvent.click(screen.getByRole('button', { name: /Comprobar/ }))
    expect(onAnswered).not.toHaveBeenCalled()
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('No he entendido este número. Toca el que has escrito o escríbelo otra vez.')
    expect(screen.getByText('¿Qué número es?')).toBeInTheDocument()
  })

  it('FactView con «?» → aparece el aviso', () => {
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    withInk([{ digit: 4 }, { digit: null }], <FactView exercise={fact67} onAnswered={onAnswered} />)
    const pad = surfaceOf('Producto de 6 por 7')
    writeNumber(pad, '42')
    idle()
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAnswered).not.toHaveBeenCalled()
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('No he entendido este número.')
  })
})

describe('P2-07 · dos cifras en una casilla', () => {
  it('«12» en una casilla no se lee como 2: se avisa de que va una sola cifra', () => {
    const onChange = vi.fn()
    function Host() {
      const [v, setV] = useState<number | null>(null)
      return <DigitCell value={v} onChange={(d) => { onChange(d); setV(d) }} ariaLabel="cifra" />
    }
    withInk([{ digit: 2 }], <Host />)
    act(() => replayStrokes(surfaceOf('cifra'), handwriteNumber('12', { x: 0, y: 0, w: W, h: H }, { pointerType: 'pen' })))
    idle()
    expect(onChange).not.toHaveBeenCalledWith(2, expect.anything())
    expect(screen.getByText(TWO_DIGITS_TEXT)).toBeInTheDocument()
  })
})

describe('P2-08 · escribir encima de una cifra leída la sustituye', () => {
  it('47 + escribir 2 encima del 7 → 42 (solo la tinta nueva va al reconocedor)', () => {
    const onChange = vi.fn()
    function Host() {
      const [v, setV] = useState<number | null>(null)
      return <NumberInput value={v} onChange={(x) => { onChange(x); setV(x) }} onSubmit={() => {}} ariaLabel="respuesta" />
    }
    const rec = withInk([{ digit: 4 }, { digit: 7 }, { digit: 4 }, { digit: 2 }], <Host />)
    const pad = surfaceOf('respuesta')
    writeNumber(pad, '47')
    idle()
    expect(onChange).toHaveBeenLastCalledWith(47)
    const two = handwrite(2, { x: 140, y: 0, w: 100, h: H }, { pointerType: 'pen', t0: 30000 })
    act(() => replayStrokes(pad, two))
    idle()
    expect(onChange).toHaveBeenLastCalledWith(42)
    expect(rec.calls[rec.calls.length - 1].strokes).toHaveLength(two.length)
  })
})

describe('P2-11 · «La escribo otra vez» borra la cifra dudosa y la deja lista', () => {
  it('la casilla queda vacía y con el foco', () => {
    function Host() {
      const [v, setV] = useState<number | null>(null)
      return <DigitCell value={v} onChange={(d) => setV(d)} ariaLabel="cifra" />
    }
    withInk([{ digit: 7, confidence: 0.35 }], <Host />)
    const cell = surfaceOf('cifra')
    writeDigit(cell, 7)
    idle()
    act(() => { store.requestConfirm() })
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('¿Has escrito un 7?')
    fireEvent.click(screen.getByRole('button', { name: 'La escribo otra vez' }))
    expect(cell.parentElement).toHaveAttribute('data-phase', 'empty')
    expect(cell).toHaveFocus()
    expect(store.uncertain()).toBe(0)
  })
})

describe('H5 · maxDigits también para la escritura a mano', () => {
  it('escribir «54» en una casilla de una cifra no deja el valor 54', () => {
    const onChange = vi.fn()
    function Host() {
      const [v, setV] = useState<number | null>(null)
      return <NumberInput value={v} onChange={(x) => { onChange(x); setV(x) }} onSubmit={() => {}} maxDigits={1} ariaLabel="respuesta" />
    }
    withInk([{ digit: 5 }, { digit: 4 }], <Host />)
    writeNumber(surfaceOf('respuesta'), '54')
    idle()
    expect(onChange).not.toHaveBeenCalledWith(54)
    expect(screen.getByText(tooManyDigitsText(1))).toHaveTextContent('Aquí solo cabe una cifra.')
  })
})
