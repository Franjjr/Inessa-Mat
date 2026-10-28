/* Lengua de 3.º, copiar una frase (CopyView) and the escritura guiada (GuidedView): the child writes the blanks one at a time,
   and the text is checked once at the end. No audio in these views. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRng, generate } from '@/engine'
import type { LenguaExercise } from '@/types'
import CopyView from './CopyView'
import GuidedView from './GuidedView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}) }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: { settings: { voice: false, sound: true } }, loading: false, setActiveChild() {} }),
}))
vi.mock('@/ink', () => ({
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

afterEach(() => cleanup())

const comprobar = () => screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)!

function first<K extends LenguaExercise['kind']>(kind: K, skill: string): Extract<LenguaExercise, { kind: K }> {
  for (let seed = 1; seed < 100; seed++) {
    const ex = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(seed) })[0] as LenguaExercise
    if (ex.kind === kind) return ex as Extract<LenguaExercise, { kind: K }>
  }
  throw new Error(`no ${kind}`)
}

describe('CopyView', () => {
  it('the sentence is on the card; the copied sentence is right', () => {
    const ex = first('lng-copy', 'lng:escr:copia')
    const onAnswered = vi.fn()
    render(<CopyView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByLabelText(`Frase para copiar: ${ex.answer}`)).toBeTruthy()
    const box = screen.getByRole('textbox', { name: 'Escribe la frase' })
    for (const ch of ex.answer) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a copy with a wrong capital is graded with the capital error', () => {
    const ex = first('lng-copy', 'lng:escr:copia')
    const onAnswered = vi.fn()
    render(<CopyView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la frase' })
    const lower = ex.answer.charAt(0).toLowerCase() + ex.answer.slice(1)
    for (const ch of lower) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    const r = onAnswered.mock.calls[0][0].check
    if (lower !== ex.answer) expect(r.errorType).toBe('capital')
  })
})

describe('GuidedView', () => {
  it('the blanks are written one at a time; the check comes after the last one', () => {
    const ex = first('lng-guided', 'lng:escr:guiada')
    const onAnswered = vi.fn()
    render(<GuidedView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const blanks = ex.prompts.length
    expect(screen.getByText(ex.prompts[0])).toBeTruthy()
    expect(comprobar().hasAttribute('disabled')).toBe(true)
    for (let i = 0; i < blanks; i++) {
      const box = screen.getByRole('textbox', { name: new RegExp(`Hueco ${i + 1} de ${blanks}`) })
      for (const ch of 'mesa') fireEvent.keyDown(box, { key: ch })
      fireEvent.click(screen.getByRole('button', { name: /Siguiente hueco/ }))
    }
    expect(comprobar().hasAttribute('disabled')).toBe(false)
    fireEvent.click(comprobar())
    const outcome = onAnswered.mock.calls[0][0]
    expect(outcome.check.correct).toBe(true)
    expect(outcome.check.given).toContain('mesa')
    expect(outcome.check.given.startsWith(ex.parts[0])).toBe(true)
  })

  it('a blank with nothing written cannot be passed on', () => {
    const ex = first('lng-guided', 'lng:escr:guiada')
    render(<GuidedView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.getByRole('button', { name: /Siguiente hueco/ }).hasAttribute('disabled')).toBe(true)
  })
})
