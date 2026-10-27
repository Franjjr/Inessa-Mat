/* Lengua de 3.º views: tapping words (sustantivos, the subject), choosing a class, and typing the changed word. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, generate } from '@/engine'
import type { LenguaExercise } from '@/types'
import ClassifyView from './ClassifyView'
import TapWordsView from './TapWordsView'
import TransformWordView from './TransformWordView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/ink', () => ({
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

// The answer bar comes after the on-screen keyboard, so its button is the last «Comprobar».
const comprobar = () => screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)!

/** The first generated exercise of a kind for a skill (deterministic). */
function first<K extends LenguaExercise['kind']>(kind: K, skill: string): Extract<LenguaExercise, { kind: K }> {
  for (let seed = 1; seed < 200; seed++) {
    const ex = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(seed) })[0] as LenguaExercise
    if (ex.kind === kind) return ex as Extract<LenguaExercise, { kind: K }>
  }
  throw new Error(`no ${kind} for ${skill}`)
}

describe('TapWordsView', () => {
  it('tapping the target nouns and checking is right; the sentence is shown as words, not as the answer', () => {
    const ex = first('lng-tap-words', 'lng:gram:sustantivo:clase')
    const onAnswered = vi.fn()
    render(<TapWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const words = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') !== null)
    expect(words.map((b) => b.textContent)).toEqual(ex.words)
    for (const i of ex.targets) fireEvent.click(words[i])
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('tapping a word that is not a target is wrong, and the check cannot run with nothing tapped', () => {
    const ex = first('lng-sentence-parts', 'lng:gram:oracion:predicado')
    const onAnswered = vi.fn()
    render(<TapWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect((comprobar() as HTMLButtonElement).disabled).toBe(true)
    const words = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') !== null)
    const other = ex.words.findIndex((_, i) => !ex.targets.includes(i))
    fireEvent.click(words[other])
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('sentence-part')
  })
})

describe('ClassifyView', () => {
  it('shows the word big and the options; the right option is graded right', () => {
    const ex = first('lng-classify', 'lng:gram:sustantivo:genero')
    const onAnswered = vi.fn()
    render(<ClassifyView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.word)).toBeTruthy()
    expect(screen.getByText(ex.question)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.options[ex.answer] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('another option is graded wrong with a word-class error', () => {
    const ex = first('lng-classify', 'lng:gram:verbo:futuro')
    const onAnswered = vi.fn()
    render(<ClassifyView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: ex.options[(ex.answer + 1) % ex.options.length] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('word-class')
  })
})

describe('TransformWordView', () => {
  it('the instruction and the word are shown; a typed answer is graded exactly', () => {
    const ex = first('lng-transform', 'lng:gram:sustantivo:numero')
    const onAnswered = vi.fn()
    render(<TransformWordView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(`Escribe en ${ex.change}:`)).toBeTruthy()
    expect(screen.getByText(ex.word)).toBeTruthy()
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra cambiada' })
    for (const ch of ex.answer) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong word is graded as a wrong form', () => {
    const ex = first('lng-transform', 'lng:gram:adjetivo')
    const onAnswered = vi.fn()
    render(<TransformWordView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra cambiada' })
    for (const ch of 'zz') fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('word-form')
  })
})
