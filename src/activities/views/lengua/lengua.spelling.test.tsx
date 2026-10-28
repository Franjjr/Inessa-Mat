/* Lengua de 3.º views for spelling, syllables, dictation and vocabulary. The dictation never shows its text; the speech
   service is mocked (no audio in tests). */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { speech } from '@/audio'
import { createRng, generate } from '@/engine'
import type { LenguaExercise } from '@/types'
import DictationView from './DictationView'
import MissingLetterView from './MissingLetterView'
import OrderWordsView from './OrderWordsView'
import PairWordsView from './PairWordsView'
import PunctuationView from './PunctuationView'
import SyllableView from './SyllableView'

const voice = vi.hoisted(() => ({ on: false, sound: true }))

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}), available: vi.fn(() => true) }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: { settings: { voice: voice.on, sound: voice.sound } }, loading: false, setActiveChild() {} }),
}))
vi.mock('@/ink', () => ({
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

afterEach(() => {
  cleanup()
  voice.on = false
  voice.sound = true
  vi.mocked(speech.say).mockClear()
})

const comprobar = () => screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)!

/** The first generated exercise of a kind for a skill at a box (deterministic). */
function first<K extends LenguaExercise['kind']>(kind: K, skill: string, box = 0): Extract<LenguaExercise, { kind: K }> {
  for (let seed = 1; seed < 300; seed++) {
    const ex = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(seed), mastery: { [skill]: { box } } as never })[0] as LenguaExercise
    if (ex.kind === kind) return ex as Extract<LenguaExercise, { kind: K }>
  }
  throw new Error(`no ${kind} for ${skill}`)
}

describe('MissingLetterView', () => {
  it('the word shows its gap; the wrong letters are graded with the spelling error; the right ones pass', () => {
    const ex = first('lng-missing-letter', 'lng:orto:c-qu')
    const onAnswered = vi.fn()
    render(<MissingLetterView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.shown)).toBeTruthy()
    const wrong = ex.options.find((o) => o !== ex.answer)!
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('spelling')
  })

  it('typed (from box 2): the whole word, compared exactly', () => {
    const ex = first('lng-missing-letter', 'lng:orto:mayusculas', 2)
    const onAnswered = vi.fn()
    render(<MissingLetterView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra completa' })
    for (const ch of ex.word.toLowerCase()) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('capital')
  })
})

describe('PunctuationView', () => {
  it('the sentence is shown without its marks, and the written sentence is right', () => {
    const ex = first('lng-punctuation', 'lng:orto:signos:pregunta')
    const onAnswered = vi.fn()
    render(<PunctuationView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.bare)).toBeTruthy()
    const box = screen.getByRole('textbox', { name: 'Escribe la frase con sus signos' })
    for (const ch of ex.answer) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('DictationView', () => {
  it('with the voice off: «🔊 Escuchar» speaks when pressed (an explicit press), and the text is never on the screen', () => {
    const ex = first('lng-dictation', 'lng:escr:dictado', 2)
    render(<DictationView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(speech.say).not.toHaveBeenCalled()
    expect(document.body.textContent ?? '').not.toContain(ex.answer)
    fireEvent.click(screen.getByRole('button', { name: '🔊 Escuchar' }))
    expect(speech.say).toHaveBeenCalledWith(ex.answer, expect.objectContaining({ force: true }))
    expect(document.body.textContent ?? '').not.toContain(ex.answer)
  })

  it('with the voice on: the sentence is read when the exercise opens, and the button reads it again', () => {
    voice.on = true
    const ex = first('lng-dictation', 'lng:escr:dictado', 0)
    render(<DictationView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(speech.say).toHaveBeenCalledWith(ex.answer, expect.objectContaining({ interrupt: true }))
    fireEvent.click(screen.getByRole('button', { name: '🔊 Escuchar' }))
    expect(vi.mocked(speech.say).mock.calls.length).toBe(2)
    expect(document.body.textContent ?? '').not.toContain(ex.answer)
  })

  it('with the sound off: the button is replaced by the activation message, and nothing is spoken', () => {
    voice.sound = false
    voice.on = true
    const ex = first('lng-dictation', 'lng:escr:dictado', 0)
    render(<DictationView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.queryByRole('button', { name: '🔊 Escuchar' })).toBeNull()
    expect(screen.getByText('Activa el sonido para hacer el dictado')).toBeTruthy()
    expect(speech.say).not.toHaveBeenCalled()
    expect(document.body.textContent ?? '').not.toContain(ex.answer)
  })

  it('with no Spanish voice on the device: nothing is spoken, the view asks for a reader, and the text stays hidden (R27)', () => {
    vi.mocked(speech.available).mockReturnValueOnce(false)
    voice.on = true
    const ex = first('lng-dictation', 'lng:escr:dictado', 0)
    render(<DictationView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.queryByRole('button', { name: '🔊 Escuchar' })).toBeNull()
    expect(screen.getByText('Este aparato no tiene voz: pide a alguien que lea la frase en voz alta')).toBeTruthy()
    expect(speech.say).not.toHaveBeenCalled()
    expect(document.body.textContent ?? '').not.toContain(ex.answer)
  })

  it('a wrong typed answer is graded, and the text stays hidden after the answer', () => {
    const ex = first('lng-dictation', 'lng:escr:dictado', 2)
    const onAnswered = vi.fn()
    render(<DictationView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const box = screen.getByRole('textbox', { name: 'Escribe lo que oyes' })
    for (const ch of 'zz') fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('dictation')
    expect(document.body.textContent ?? '').not.toContain(ex.answer)
  })
})

describe('OrderWordsView', () => {
  it('tapping the words in alphabetical order is right; another order is wrong', () => {
    const ex = first('lng-alphabet', 'lng:voc:abecedario')
    const onAnswered = vi.fn()
    render(<OrderWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    for (const i of ex.targets) fireEvent.click(screen.getByRole('button', { name: ex.words[i] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('an order that is not alphabetical is graded with the alphabet error', () => {
    const ex = first('lng-alphabet', 'lng:voc:abecedario', 2)
    expect(ex.mode).toBeUndefined()
    const onAnswered = vi.fn()
    render(<OrderWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    for (const i of [...ex.targets].reverse()) fireEvent.click(screen.getByRole('button', { name: ex.words[i] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('alphabet')
  })

  it('the mini diccionario asks which word comes first: tapping it and checking is right, the other one is an alphabet error', () => {
    const ex = first('lng-alphabet', 'lng:voc:abecedario', 0)
    expect(ex.mode).toBe('first')
    const onAnswered = vi.fn()
    render(<OrderWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(/¿Qué palabra sale antes en el diccionario\?/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.words[ex.targets[0]] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('the mini diccionario: the other word is wrong', () => {
    const ex = first('lng-alphabet', 'lng:voc:abecedario', 0)
    const onAnswered = vi.fn()
    render(<OrderWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const other = ex.words.find((_, i) => i !== ex.targets[0]) ?? ''
    fireEvent.click(screen.getByRole('button', { name: other }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('alphabet')
  })
})

describe('PairWordsView', () => {
  it('the right option is graded right; a wrong one is a word-pair error', () => {
    const ex = first('lng-pair-words', 'lng:voc:antonimos')
    const onAnswered = vi.fn()
    render(<PairWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.question)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.options.find((o) => o !== ex.answer)! }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('word-pair')
  })

  it('a typed form (diminutive) is compared with its one spelling', () => {
    const ex = first('lng-pair-words', 'lng:voc:diminutivos')
    const onAnswered = vi.fn()
    render(<PairWordsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const box = screen.getByRole('textbox', { name: 'Escribe la palabra' })
    for (const ch of ex.answer) fireEvent.keyDown(box, { key: ch })
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('SyllableView', () => {
  it('tapping the stressed syllable is right; another syllable is a stress error', () => {
    const ex = first('lng-stress', 'lng:orto:tonica')
    const onAnswered = vi.fn()
    render(<SyllableView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const wrong = ex.syllables.findIndex((_, i) => i !== ex.stressed)
    fireEvent.click(screen.getByRole('button', { name: ex.syllables[wrong] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.errorType).toBe('stress')
  })

  it('counting the syllables: the right number is graded right', () => {
    const ex = first('lng-syllables', 'lng:gram:silabas')
    const onAnswered = vi.fn()
    render(<SyllableView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(ex.word)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.answer }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
