/* Auditoría P2 y vistas de tablas: el resto de criterios del grupo «escritura y teclado».
   - P2-02: la pregunta de lectura dudosa sale también, a veces, cuando no cambia la nota (no delata la respuesta).
   - P2-05: la nota de una respuesta mal escrita a mano guarda lo leído; la tarjeta de Ajustes enseña el trazo.
   - P2-06: 1 leído 8 con poco margen es dudoso.
   - B1, L-w5-double, P3PE-17, P6-09 y V13: vistas de tablas, avisos y voz. */
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { speech } from '@/audio'
import type { DigitRecognition, DoubleChainExercise, ExerciseOutcome, FactDivExercise, FactFamilyExercise, FactMulExercise } from '@/types'
import { ActivityHostProvider } from '@/activities/host'
import { misreadToAsk, MASK_RATE, type ReadDigit } from '@/activities/shared/recognition'
import FactView from '@/activities/views/FactView'
import DoubleChainView from '@/activities/views/DoubleChainView'
import FactFamilyView, { FAMILY_INSTRUCTION } from '@/activities/views/FactFamilyView'
import { isDoubtfulRead } from '../confusable'
import { mulberry32 } from '../fixtures'
import { NudgeBubble, useNudge } from '../Nudge'
import { decodeImage28, encodeImage28, leaveInkReading, takeInkReading, type InkReading } from '../readLog'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}), stop: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

function host(voice = false) {
  return {
    reportAttempt: vi.fn(), react: vi.fn(), rng: () => 0.5, mastery: {}, t: (s: string) => s,
    prefs: { timedActivities: true, bigCells: false, voice, handedness: 'right' },
  } as never
}

describe('P2-02 · la pregunta también sale a veces cuando no cambia la nota', () => {
  it('con 100 lecturas dudosas que no cambian la nota, pregunta entre 15 y 35 veces', () => {
    const random = mulberry32(2026)
    const reads: ReadDigit[] = [{ key: 'a', digit: 4, confidence: 0.75, alternatives: [9, 1] }, { key: 'b', digit: 2, confidence: 0.97, alternatives: [7] }]
    let asked = 0
    for (let i = 0; i < 100; i++) {
      // 42 is right: no swap is needed; the question is only the mask.
      const q = misreadToAsk({ type: 'number', value: 42 }, true, reads, (a) => a.type === 'number' && a.value === 42, random)
      if (q) { asked++; expect(q).toEqual({ key: 'a', fixes: false, alt: 9 }) }
    }
    expect(MASK_RATE).toBe(0.25)
    expect(asked).toBeGreaterThanOrEqual(15)
    expect(asked).toBeLessThanOrEqual(35)
  })

  it('una lectura segura nunca se pregunta; una cifra dudosa que arregla la respuesta, siempre', () => {
    const right = (a: { type: string; value?: number | null }) => a.type === 'number' && a.value === 42
    const sure: ReadDigit[] = [{ key: 'a', digit: 4, confidence: 0.97, alternatives: [] }, { key: 'b', digit: 7, confidence: 0.99, alternatives: [2], altP: [0.005] }]
    // 47 read with 0.99 and a negligible alternative 2: graded as it is (the question must not mean «you are wrong»).
    expect(misreadToAsk({ type: 'number', value: 47 }, false, sure, right as never, () => 0)).toBeNull()
    expect(misreadToAsk({ type: 'number', value: 42 }, true, sure, right as never, () => 0)).toBeNull()
    // The same 7 with doubts (below 0.9), or with a likely alternative (0.2): always asked, offering the 2.
    const unsure: ReadDigit[] = [sure[0], { ...sure[1], confidence: 0.85 }]
    expect(misreadToAsk({ type: 'number', value: 47 }, false, unsure, right as never, () => 0.99)).toEqual({ key: 'b', fixes: true, alt: 2 })
    const likely: ReadDigit[] = [sure[0], { ...sure[1], confidence: 0.92, altP: [0.2] }]
    expect(misreadToAsk({ type: 'number', value: 47 }, false, likely, right as never, () => 0.99)).toEqual({ key: 'b', fixes: true, alt: 2 })
  })
})

describe('P2-05 · lo que la app leyó se guarda con la respuesta marcada como mal', () => {
  it('la lectura se entrega una sola vez y solo a su respuesta', () => {
    const img = new Float32Array(784)
    img[100] = 1
    img[101] = 0.5
    const reading: InkReading = {
      kind: 'fact-mul', given: '47', recognitionFixes: 1, method: 'five-plus-one', oneDigitFix: true,
      digits: [
        { digit: 4, confidence: 0.97, alternatives: [9], doubtful: false, confirmed: false, image28: encodeImage28(img) },
        { digit: 7, confidence: 0.81, alternatives: [2, 1], doubtful: true, confirmed: false },
      ],
    }
    leaveInkReading(reading)
    expect(takeInkReading('fact-mul', '48')).toBeNull() // another answer
    const got = takeInkReading('fact-mul', '47')
    expect(got).toMatchObject({ oneDigitFix: true, recognitionFixes: 1, method: 'five-plus-one' })
    expect(got?.digits[1]).toMatchObject({ digit: 7, confidence: 0.81, alternatives: [2, 1], doubtful: true, confirmed: false })
    const px = decodeImage28(got!.digits[0].image28!)
    expect(px).toHaveLength(784)
    expect(px[100]).toBe(1)
    expect(px[101]).toBeCloseTo(0.5, 1)
    expect(takeInkReading('fact-mul', '47')).toBeNull() // once
  })
})

describe('P2-06 · pares que se confunden', () => {
  function read(digit: number, probs: Partial<Record<number, number>>): DigitRecognition {
    const full = Array.from({ length: 10 }, (_, d) => probs[d] ?? 0.001)
    return {
      digit, confidence: full[digit], probs: full,
      alternatives: full.map((p, d) => ({ digit: d, p })).sort((a, b) => b.p - a.p).slice(0, 3),
      embedding: [], image28: new Float32Array(784),
    }
  }
  it('1 leído 8 con margen < 0,3 es dudoso (también 1/3, 3/9 y 2/7)', () => {
    expect(isDoubtfulRead(read(8, { 8: 0.62, 1: 0.36 }))).toBe(true)
    expect(isDoubtfulRead(read(3, { 3: 0.63, 1: 0.35 }))).toBe(true)
    expect(isDoubtfulRead(read(3, { 3: 0.63, 9: 0.35 }))).toBe(true)
    expect(isDoubtfulRead(read(7, { 7: 0.62, 2: 0.36 }))).toBe(true)
    expect(isDoubtfulRead(read(8, { 8: 0.9, 1: 0.08 }))).toBe(false)
  })
})

describe('B1 · la división también enseña (teach «full»)', () => {
  it('15 ÷ 3 mal dos veces → aparece la solución y se pide copiarla', async () => {
    const user = userEvent.setup()
    const ex: FactDivExercise = { id: 'd-15-3', kind: 'fact-div', skill: 'div:15/3' as FactDivExercise['skill'], difficulty: 1, dividend: 15, divisor: 3, answer: 5 }
    const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
    render(<ActivityHostProvider value={host()}><FactView exercise={ex} onAnswered={onAnswered} showFeedback={false} teach="full" /></ActivityHostProvider>)
    await user.keyboard('4{Enter}')
    await user.keyboard('6{Enter}')
    expect(document.querySelector('[data-phase]')).toHaveAttribute('data-phase', 'copy')
    expect(screen.getByRole('status')).toHaveTextContent('Has escrito 6. Es 5. ¡Escríbelo tú!')
    expect(screen.getByTestId('fact-worked')).toBeInTheDocument()
    expect(onAnswered).not.toHaveBeenCalled()
    await user.keyboard('5{Enter}')
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0]).toMatchObject({ revealed: true, check: { correct: false, given: '6' } })
  })
})

describe('V13 · la pista de la tabla se dice cortando lo anterior', () => {
  it('con voz, la pista tras un fallo se dice con interrupt', async () => {
    const user = userEvent.setup()
    const ex: FactMulExercise = { id: 'f-7x8', kind: 'fact-mul', skill: 'mul:7x8' as FactMulExercise['skill'], difficulty: 1, a: 7, b: 8, answer: 56 }
    vi.mocked(speech.say).mockClear()
    const { unmount } = render(<ActivityHostProvider value={host(true)}><FactView exercise={ex} onAnswered={() => {}} showFeedback={false} teach="clue" /></ActivityHostProvider>)
    await user.keyboard('54{Enter}')
    expect(speech.say).toHaveBeenCalledWith(expect.stringContaining('Has escrito 54.'), { interrupt: true })
    unmount()
    expect(speech.stop).toHaveBeenCalled() // a new exercise never hears the old clue
  })
})

describe('L-w5-double · la cadena de dobles dice qué multiplicación resuelve', () => {
  it('start 4, steps 3: arriba «8 × 4 = ?» y al terminar «8 × 4 = 32»', async () => {
    const user = userEvent.setup()
    const ex: DoubleChainExercise = { id: 'dc-4-3', kind: 'double-chain', skill: 'mul:8x4' as DoubleChainExercise['skill'], difficulty: 1, start: 4, steps: 3, answer: [8, 16, 32] }
    render(<ActivityHostProvider value={host()}><DoubleChainView exercise={ex} onAnswered={() => {}} /></ActivityHostProvider>)
    expect(screen.getByTestId('double-goal')).toHaveTextContent('8 × 4 = ?')
    await user.keyboard('8{Enter}')
    await user.keyboard('16{Enter}')
    await user.keyboard('32{Enter}')
    expect(screen.getByTestId('double-goal')).toHaveTextContent('8 × 4 = 32')
  })
})

describe('P3PE-17 · la familia de números dice qué hay que hacer', () => {
  it('instrucción «Escribe las cuatro cuentas que salen con estos tres números.»', () => {
    const ex: FactFamilyExercise = { id: 'ff-6-7', kind: 'fact-family', skill: 'mul:6x7' as FactFamilyExercise['skill'], difficulty: 1, a: 6, b: 7, product: 42 } as FactFamilyExercise
    render(<ActivityHostProvider value={host()}><FactFamilyView exercise={ex} onAnswered={() => {}} /></ActivityHostProvider>)
    expect(FAMILY_INSTRUCTION).toBe('Escribe las cuatro cuentas que salen con estos tres números.')
    expect(screen.getByText(FAMILY_INSTRUCTION)).toBeInTheDocument()
  })
})

describe('P6-09 · un solo aviso «¿Sin lápiz?» por pantalla', () => {
  it('con cuatro casillas que lo piden, como máximo se ve uno', () => {
    const triggers: (() => void)[] = []
    function Box({ i }: { i: number }) {
      const [visible, trigger] = useNudge()
      triggers[i] = trigger
      return visible ? <NudgeBubble /> : null
    }
    render(<>{[0, 1, 2, 3].map((i) => <Box key={i} i={i} />)}</>)
    act(() => { for (const t of triggers) t() })
    expect(screen.getAllByText('¿Sin lápiz? ¡Toca aquí!')).toHaveLength(1)
    const { result } = renderHook(() => useNudge())
    act(() => result.current[1]())
    expect(screen.queryAllByText('¿Sin lápiz? ¡Toca aquí!')).toHaveLength(0) // the newest one took its place
  })
})
