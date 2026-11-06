/* Inglés de 3.º views: what the child sees and what they send. The speech is mocked (no audio in tests); NumberInput is a
   plain box here (its own tests cover the handwriting). The listening views never render the spoken text before the answer. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { speech } from '@/audio'
import { createRng, generate, numberToEnglish } from '@/engine'
import type { EnglishExercise, EngListenPickExercise, EngMatchExercise, EngNumListenExercise, EngOpListenExercise } from '@/types'
import CompleteView from './CompleteView'
import ListenPickView from './ListenPickView'
import MatchView from './MatchView'
import NumberListenView from './NumberListenView'
import NumberWriteView from './NumberWriteView'
import OperationListenView from './OperationListenView'
import WriteWordView from './WriteWordView'

const cfg = vi.hoisted(() => ({ sound: true, voice: false }))

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  speech: { say: vi.fn(async () => {}), available: vi.fn(() => true) },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: { settings: { sound: cfg.sound, voice: cfg.voice } }, loading: false, setActiveChild() {} }),
}))
vi.mock('@/ink', () => ({
  NumberInput: (p: {
    value: number | null
    onChange: (v: number | null) => void
    onSubmit: (v: number | null) => void
    ariaLabel?: string
  }) => (
    <input
      aria-label={p.ariaLabel}
      value={p.value ?? ''}
      onChange={(e) => p.onChange(e.target.value === '' ? null : Number(e.target.value))}
      onKeyDown={(e) => { if (e.key === 'Enter') p.onSubmit(p.value) }}
    />
  ),
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

afterEach(() => {
  cleanup()
  cfg.sound = true
  cfg.voice = false
  vi.mocked(speech.say).mockClear()
})

const comprobar = () => screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)!
const pageText = () => document.body.textContent ?? ''

/** The first exercise of a kind for a skill (deterministic). */
function first<K extends EnglishExercise['kind']>(kind: K, skill: string): Extract<EnglishExercise, { kind: K }> {
  const [ex] = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(7) })
  if (!ex || ex.kind !== kind) throw new Error(`no ${kind} for ${skill}`)
  return ex as Extract<EnglishExercise, { kind: K }>
}

describe('ListenPickView', () => {
  it('the word is not written before the answer; the cards are numbered, not named', () => {
    const ex: EngListenPickExercise = first('eng-listen-pick', 'eng:voc:animales')
    render(<ListenPickView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(pageText()).not.toContain(ex.word)
    expect(screen.getByRole('button', { name: 'Dibujo 1' })).toBeTruthy()
  })

  it('«Otra vez» says the word again in the English voice, and is not an answer', () => {
    const ex = first('eng-listen-pick', 'eng:voc:animales')
    const onAnswered = vi.fn()
    render(<ListenPickView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Otra vez/ }))
    fireEvent.click(screen.getByRole('button', { name: /Otra vez/ }))
    expect(speech.say).toHaveBeenLastCalledWith(ex.word, expect.objectContaining({ voice: 'english', force: true }))
    expect(vi.mocked(speech.say).mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('with the sound off it says so and shows no text', () => {
    cfg.sound = false
    const ex = first('eng-listen-pick', 'eng:voc:animales')
    render(<ListenPickView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.queryByRole('button', { name: /Otra vez/ })).toBeNull()
    expect(screen.getByText(/Activa el sonido/)).toBeTruthy()
    expect(pageText()).not.toContain(ex.word)
  })

  it('the right card is graded right; a wrong card shows and says the word', () => {
    const ex = first('eng-listen-pick', 'eng:voc:animales')
    const onAnswered = vi.fn()
    render(<ListenPickView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: `Dibujo ${ex.answer + 1}` }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong card gives the right word in the feedback and says it in English', () => {
    const ex = first('eng-listen-pick', 'eng:voc:animales')
    render(<ListenPickView exercise={ex} onAnswered={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: `Dibujo ${((ex.answer + 1) % ex.cards.length) + 1}` }))
    fireEvent.click(comprobar())
    expect(pageText()).toContain(`«${ex.word}»`)
    expect(speech.say).toHaveBeenCalledWith(ex.word, expect.objectContaining({ voice: 'english' }))
  })
})

describe('MatchView', () => {
  it('four pairs are sent as marks; all right is graded right', () => {
    const ex: EngMatchExercise = first('eng-match', 'eng:voc:comida')
    const onAnswered = vi.fn()
    render(<MatchView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    ex.words.forEach((w, i) => {
      fireEvent.click(screen.getByRole('button', { name: w }))
      fireEvent.click(screen.getByRole('button', { name: `Dibujo ${ex.answer[i] + 1}` }))
    })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong pair is graded wrong and the feedback names the right pairs', () => {
    const ex = first('eng-match', 'eng:voc:comida')
    render(<MatchView exercise={ex} onAnswered={vi.fn()} />)
    ex.words.forEach((w, i) => {
      fireEvent.click(screen.getByRole('button', { name: w }))
      fireEvent.click(screen.getByRole('button', { name: `Dibujo ${((ex.answer[i] + 1) % ex.cards.length) + 1}` }))
    })
    fireEvent.click(comprobar())
    expect(pageText()).toContain('Las parejas son:')
  })
})

describe('WriteWordView', () => {
  it('the typed word is sent as text; the right one is graded right', () => {
    const ex = first('eng-write-word', 'eng:voc:ropa')
    const onAnswered = vi.fn()
    render(<WriteWordView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra en inglés' })
    for (const ch of ex.answer) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a letter away is «¡Casi!»; a wrong word shows the right one and says it', () => {
    const ex = first('eng-write-word', 'eng:voc:ropa')
    render(<WriteWordView exercise={ex} onAnswered={vi.fn()} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra en inglés' })
    for (const ch of `${ex.answer}x`) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(pageText()).toContain('¡Casi!')
    expect(pageText()).not.toContain('¡Mal')
  })

  it('a wrong word shows and says the right word', () => {
    const ex = first('eng-write-word', 'eng:voc:ropa')
    render(<WriteWordView exercise={ex} onAnswered={vi.fn()} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra en inglés' })
    for (const ch of 'qqqqq') fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(pageText()).toContain(`«${ex.answer}»`)
    expect(speech.say).toHaveBeenCalledWith(ex.answer, expect.objectContaining({ voice: 'english' }))
  })
})

describe('CompleteView', () => {
  it('the Spanish cue shows above the English sentence, and the sentence is not read out', () => {
    const ex = first('eng-complete', 'eng:frase:where-is:under')
    render(<CompleteView exercise={ex} onAnswered={vi.fn()} />)
    const cue = screen.getByText(ex.es ?? '')
    const sentence = screen.getByLabelText(`Frase: ${ex.sentence}`)
    expect(cue.compareDocumentPosition(sentence) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(speech.say).not.toHaveBeenCalled()
  })

  it('the word tapped is sent as a choice; the right one is graded right', () => {
    const ex = first('eng-complete', 'eng:frase:i-like')
    const onAnswered = vi.fn()
    render(<CompleteView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: ex.options[ex.answer] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a wrong word says the whole right sentence in English', () => {
    const ex = first('eng-complete', 'eng:frase:i-like')
    render(<CompleteView exercise={ex} onAnswered={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: ex.options[(ex.answer + 1) % ex.options.length] }))
    fireEvent.click(comprobar())
    const right = ex.sentence.replace('___', ex.options[ex.answer])
    expect(pageText()).toContain(right)
    expect(speech.say).toHaveBeenCalledWith(right, expect.objectContaining({ voice: 'english' }))
  })
})

describe('NumberWriteView', () => {
  it('the number is shown in digits; the English word typed is graded', () => {
    const ex = first('eng-num-write', 'eng:num:0-20')
    const onAnswered = vi.fn()
    render(<NumberWriteView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(String(ex.value))).toBeTruthy()
    const box = screen.getByRole('textbox', { name: 'Escribe el número en inglés' })
    for (const ch of ex.answer) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(numberToEnglish(ex.value)).toBe(ex.answer)
  })
})

describe('NumberListenView and OperationListenView', () => {
  it('the digits are typed with the number input; the spoken number is never written', () => {
    const ex: EngNumListenExercise = first('eng-num-listen', 'eng:num:21-100')
    const onAnswered = vi.fn()
    render(<NumberListenView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(pageText()).not.toContain(ex.spoken)
    fireEvent.change(screen.getByRole('textbox', { name: 'Número que oyes' }), { target: { value: String(ex.answer) } })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('«Otra vez» repeats the number in English and is not an answer', () => {
    const ex = first('eng-num-listen', 'eng:num:0-20')
    const onAnswered = vi.fn()
    render(<NumberListenView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Otra vez/ }))
    expect(speech.say).toHaveBeenLastCalledWith(ex.spoken, expect.objectContaining({ voice: 'english', force: true }))
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('a wrong result says the right number in English; the operation is never written before the answer', () => {
    const ex: EngOpListenExercise = first('eng-op-listen', 'eng:num:ops:plus')
    render(<OperationListenView exercise={ex} onAnswered={vi.fn()} />)
    expect(pageText()).not.toContain(ex.spoken)
    fireEvent.change(screen.getByRole('textbox', { name: 'Resultado de la operación' }), { target: { value: String(ex.answer + 1) } })
    fireEvent.click(comprobar())
    expect(speech.say).toHaveBeenCalledWith(numberToEnglish(ex.answer), expect.objectContaining({ voice: 'english' }))
    expect(pageText()).toContain(String(ex.answer))
  })

  it('the operation results of the times skill are the tables of 2, 5 and 10', () => {
    const ex: EngOpListenExercise = first('eng-op-listen', 'eng:num:ops:times')
    expect([2, 5, 10]).toContain(ex.a)
    expect(ex.answer).toBe(ex.a * ex.b)
  })
})
