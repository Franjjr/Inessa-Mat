/* «Ahora dilo tú» (eng-speak): press to talk, press again to stop (or the 10 s limit), 1 to 3 stars with an encouraging line.
   «Saltar» is always there and reports nothing. A denied microphone or a service that refuses skips the item without a penalty,
   and that day no more speaking items are tried. The microphone and the service are mocked: no audio in tests. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EngSpeakExercise, ExerciseOutcome } from '@/types'

const mocks = vi.hoisted(() => ({
  startTake: vi.fn(),
  scoreSpeech: vi.fn(),
  recordSpeaking: vi.fn(async () => {}),
  updateProgress: vi.fn(async () => ({})),
  say: vi.fn(async () => {}),
}))

vi.mock('@/audio/recorder', () => ({ startTake: mocks.startTake, TAKE_MAX_SECONDS: 10 }))
vi.mock('@/audio/pronunciation', () => ({ scoreSpeech: mocks.scoreSpeech }))
vi.mock('@/audio', () => ({
  speech: { say: mocks.say, available: () => true },
}))
vi.mock('@/data', () => ({
  useActiveChild: () => ({ child: { id: 'child-speak', settings: { sound: true, voice: false } }, loading: false, setActiveChild() {} }),
  recordSpeaking: mocks.recordSpeaking,
  updateProgress: mocks.updateProgress,
}))

import SpeakView, { __resetSpeakOffForTests } from './SpeakView'

const ex: EngSpeakExercise = { id: 'eng-speak:eng:voc:animales:cat', kind: 'eng-speak', skill: 'eng:voc:animales', difficulty: 2, word: 'cat', es: 'gato', theme: 'animales' }

/** A take the test ends by hand (the press again, or the 10 s limit in the real recorder). */
function fakeTake() {
  let finish!: (b: Blob) => void
  const done = new Promise<Blob>((resolve) => { finish = resolve })
  const stop = vi.fn(() => finish(new Blob([new Uint8Array([1])], { type: 'audio/wav' })))
  return { stop, done, finish: () => finish(new Blob([new Uint8Array([1])], { type: 'audio/wav' })) }
}

const onAnswered = vi.fn<(o: ExerciseOutcome) => void>()
const renderView = () => render(<SpeakView exercise={ex} onAnswered={onAnswered} showFeedback={false} allowHints={false} />)
const press = () => screen.getByRole('button', { name: /Pulsa y dilo|Ya he terminado/ })

beforeEach(() => {
  __resetSpeakOffForTests()
  mocks.startTake.mockReset()
  mocks.scoreSpeech.mockReset()
  mocks.recordSpeaking.mockClear()
  mocks.updateProgress.mockClear()
  mocks.say.mockClear()
  onAnswered.mockClear()
})
afterEach(() => cleanup())

describe('SpeakView', () => {
  it('shows the word, its Spanish gloss, the press button and «Saltar», and no text box', () => {
    renderView()
    expect(screen.getByText('Ahora dilo tú')).toBeTruthy()
    expect(screen.getByText('cat')).toBeTruthy()
    expect(screen.getByText('gato')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Saltar' })).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('«Saltar» reports nothing as an attempt: no recording, no score, no record, no flag', async () => {
    renderView()
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(mocks.startTake).not.toHaveBeenCalled()
    expect(mocks.scoreSpeech).not.toHaveBeenCalled()
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    expect(mocks.updateProgress).not.toHaveBeenCalled()
  })

  it('press to talk, press again to stop, then shows the stars and records the result (no audio)', async () => {
    const take = fakeTake()
    mocks.startTake.mockResolvedValue(take)
    mocks.scoreSpeech.mockResolvedValue({ score: 72 })
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(screen.getByRole('button', { name: /Ya he terminado/ })).toBeTruthy())
    fireEvent.click(press())
    expect(take.stop).toHaveBeenCalled()
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(mocks.scoreSpeech).toHaveBeenCalledWith('cat', expect.any(Blob))
    expect(mocks.recordSpeaking).toHaveBeenCalledWith('child-speak', 'cat', 2)
    expect(mocks.updateProgress).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('img', { name: '2 estrellas' })).toBeTruthy()
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('the 10 s limit ends the take by itself (the recorder resolves it) and the clip is scored', async () => {
    const take = fakeTake()
    mocks.startTake.mockResolvedValue(take)
    mocks.scoreSpeech.mockResolvedValue({ score: 91 })
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalled())
    take.finish()
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('img', { name: '3 estrellas' })).toBeTruthy()
  })

  it('one star still praises the try, and records one star', async () => {
    const take = fakeTake()
    mocks.startTake.mockResolvedValue(take)
    mocks.scoreSpeech.mockResolvedValue({ score: 30 })
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalled())
    take.finish()
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered.mock.calls[0][0].check.feedback).toMatch(/intentarlo/)
    expect(mocks.recordSpeaking).toHaveBeenCalledWith('child-speak', 'cat', 1)
  })

  it('a denied microphone skips without penalty, records nothing, and switches speaking off for the day', async () => {
    mocks.startTake.mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' }))
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(mocks.scoreSpeech).not.toHaveBeenCalled()
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    expect(mocks.updateProgress).toHaveBeenCalledTimes(1)
  })

  it('a service that refuses (skipped) moves on without a penalty and is not retried that day', async () => {
    const take = fakeTake()
    mocks.startTake.mockResolvedValue(take)
    mocks.scoreSpeech.mockResolvedValue({ skipped: true })
    const first = renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalled())
    take.finish()
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    first.unmount()

    // The next speaking item of the same day: it does not even open the microphone.
    renderView()
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(2))
    expect(mocks.startTake).toHaveBeenCalledTimes(1)
  })

  it('«Saltar» while the microphone permission is still pending: the take that opens later is released, and nothing is written', async () => {
    const take = fakeTake()
    let grant!: (t: typeof take) => void
    mocks.startTake.mockReturnValue(new Promise((resolve) => { grant = resolve }))
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    grant(take)
    await waitFor(() => expect(take.stop).toHaveBeenCalled())
    expect(mocks.scoreSpeech).not.toHaveBeenCalled()
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    expect(mocks.updateProgress).not.toHaveBeenCalled()
    expect(onAnswered).toHaveBeenCalledTimes(1)
  })

  it('«Saltar» while the clip is being scored: the late result is ignored (no record, no attempt flag)', async () => {
    const take = fakeTake()
    mocks.startTake.mockResolvedValue(take)
    let score!: (r: { score: number }) => void
    mocks.scoreSpeech.mockReturnValue(new Promise((resolve) => { score = resolve }))
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalled())
    take.finish()
    await waitFor(() => expect(mocks.scoreSpeech).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    score({ score: 95 })
    await new Promise((r) => setTimeout(r, 0))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    expect(mocks.updateProgress).not.toHaveBeenCalled()
  })

  it('silence («nothing heard») asks to try again: no record, no attempt, the item is not done', async () => {
    const take = fakeTake()
    mocks.startTake.mockResolvedValue(take)
    mocks.scoreSpeech.mockResolvedValue({ noSpeech: true })
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalled())
    take.finish()
    await waitFor(() => expect(screen.getByText(/No te he oído/)).toBeTruthy())
    expect(onAnswered).not.toHaveBeenCalled()
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    expect(mocks.updateProgress).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Otra vez/ })).toBeTruthy()

    // «Otra vez» opens the microphone again; «Saltar» after the silence reports nothing either.
    fireEvent.click(screen.getByRole('button', { name: /Otra vez/ }))
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
  })

  it('two silent tries in one item move on without a third recording (the child never loops on one word)', async () => {
    const first = fakeTake()
    const second = fakeTake()
    mocks.startTake.mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    mocks.scoreSpeech.mockResolvedValue({ noSpeech: true })
    renderView()
    fireEvent.click(press())
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalledTimes(1))
    first.finish()
    await waitFor(() => expect(screen.getByText(/No te he oído/)).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /Otra vez/ }))
    await waitFor(() => expect(mocks.startTake).toHaveBeenCalledTimes(2))
    second.finish()
    await waitFor(() => expect(onAnswered).toHaveBeenCalledTimes(1))
    expect(mocks.startTake).toHaveBeenCalledTimes(2)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    expect(mocks.recordSpeaking).not.toHaveBeenCalled()
    expect(mocks.updateProgress).not.toHaveBeenCalled()
  })
})
