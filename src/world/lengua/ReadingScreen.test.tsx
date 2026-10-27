import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities'
import { readingById } from '@/content/lengua/stories'
import type { AttemptInput, ChildProfile, ExerciseOutcome } from '@/types'
import { ReadingScreen } from './ReadingScreen'

// No audio in tests: the speech service is a spy that resolves at once.
const speechMock = vi.hoisted(() => ({ say: vi.fn(async (_text: string, _opts?: unknown) => {}), stop: vi.fn() }))
vi.mock('@/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/audio')>()
  return { ...actual, speech: { ...actual.speech, say: speechMock.say, stop: speechMock.stop } }
})

const child = { id: 'c1', nickname: 'Inessa', gender: 'f', settings: { sound: true, voice: false }, companion: { species: 'dragon', gender: 'm', name: 'Chispa' } } as unknown as ChildProfile
const sound = { current: true }
vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return { ...actual, useActiveChild: () => ({ child: { ...child, settings: { ...child.settings, sound: sound.current } }, loading: false, setActiveChild: () => {} }) }
})

// The game host wraps the step in the tests (the activity host is the one given to the screen).
vi.mock('../host/GameHost', () => ({ GameHostProvider: ({ children }: { children: React.ReactNode }) => children }))

// The exercise view is covered by the activities module: a stub answers with the next scripted outcome (correct when empty).
const script = vi.hoisted(() => ({ outcomes: [] as unknown[] }))
vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  function ExerciseView({ exercise, onAnswered }: { exercise: { question?: string }; onAnswered: (o: unknown) => void }) {
    return React.createElement('div', { 'data-testid': 'view' },
      React.createElement('p', null, exercise.question),
      React.createElement('button', {
        type: 'button',
        onClick: () => onAnswered(script.outcomes.shift() ?? { check: { correct: true, given: 'ok', expected: 'ok' }, ms: 800, inputMode: 'tap', hintsUsed: 0, recognitionFixes: 0 }),
      }, 'Responder'))
  }
  return { ...actual, ExerciseView }
})

beforeEach(() => {
  script.outcomes = []
  sound.current = true
  speechMock.say.mockClear()
  speechMock.stop.mockClear()
})

function renderScreen(id: string, onDone = vi.fn()) {
  const reportAttempt = vi.fn<(a: AttemptInput) => void>()
  const reading = readingById(id)!
  render(
    <ActivityHostProvider value={{ ...defaultActivityHost, reportAttempt }}>
      <ReadingScreen reading={reading} onDone={onDone} />
    </ActivityHostProvider>,
  )
  return { reading, onDone, reportAttempt }
}

const wrong = (): ExerciseOutcome => ({ check: { correct: false, given: 'x', expected: 'y', errorType: 'reading' }, ms: 900, inputMode: 'tap', hintsUsed: 0, recognitionFixes: 0 })

describe('ReadingScreen: the text', () => {
  it('shows the title and every paragraph, with the child\'s name, before the questions', () => {
    const { reading } = renderScreen('historia-tarta')
    expect(screen.getByRole('heading', { name: reading.title })).toBeInTheDocument()
    expect(screen.getByText(/Era la víspera de la fiesta de Lumi/)).toBeInTheDocument()
    expect(screen.getByText(/Inessa se acercó despacio/)).toBeInTheDocument()
    expect(screen.queryByTestId('view')).not.toBeInTheDocument()
  })

  it('reads the paragraphs in order, each press with force (the explicit press ignores the voice setting)', async () => {
    const user = userEvent.setup()
    const { reading } = renderScreen('historia-tarta')
    await user.click(screen.getByRole('button', { name: /Escuchar/ }))
    await waitFor(() => expect(speechMock.say).toHaveBeenCalledTimes(reading.text.length))
    const spoken = speechMock.say.mock.calls.map((c) => c[0] as string)
    expect(spoken[0]).toMatch(/Era la víspera/)
    expect(spoken.at(-1)).toMatch(/Chispa se llevó la cereza/)
    for (const call of speechMock.say.mock.calls) {
      expect(call[1]).toMatchObject({ force: true })
      expect((call[0] as string).length).toBeLessThanOrEqual(400)
    }
  })

  it('shows a line instead of the button when the sound setting is off', () => {
    sound.current = false
    renderScreen('historia-tarta')
    expect(screen.queryByRole('button', { name: /Escuchar/ })).not.toBeInTheDocument()
    expect(screen.getByText('Activa el sonido para escuchar el texto')).toBeInTheDocument()
  })

  it('keeps the poem\'s line breaks', () => {
    renderScreen('poema-lluvia')
    const stanza = screen.getByText(/Hoy llueve sin parar,/)
    expect(stanza.textContent).toMatch(/Hoy llueve sin parar,\s*y el sol se fue a jugar/)
  })
})

describe('ReadingScreen: the questions', () => {
  it('moves from the text to the questions and reports every answer with its skill', async () => {
    const user = userEvent.setup()
    const { reading, onDone, reportAttempt } = renderScreen('historia-tarta')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByText('Pregunta 1 de 4')).toBeInTheDocument()
    expect(screen.getByText(reading.questions[0].prompt)).toBeInTheDocument()

    for (let i = 0; i < reading.questions.length; i++) {
      const view = screen.getByTestId('view')
      expect(within(view).getByText(reading.questions[i].prompt)).toBeInTheDocument()
      await user.click(within(view).getByRole('button', { name: 'Responder' }))
      const last = i + 1 === reading.questions.length
      await user.click(screen.getByRole('button', { name: last ? 'Terminar' : 'Siguiente' }))
    }

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(reportAttempt).toHaveBeenCalledTimes(reading.questions.length)
    const skills = reportAttempt.mock.calls.map((c) => c[0].exercise.skill)
    expect(skills).toEqual(reading.questions.map((q) => q.skill))
    for (const call of reportAttempt.mock.calls) expect(call[0].exercise.kind).toMatch(/^lng-read-/)
  })

  it('offers «Inténtalo otra vez» after a wrong first answer, and reports one attempt for the question', async () => {
    const user = userEvent.setup()
    const { reportAttempt } = renderScreen('historia-tarta')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    script.outcomes.push(wrong())
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(screen.getByRole('button', { name: 'Inténtalo otra vez' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0].retries).toBe(1)
    expect(reportAttempt.mock.calls[0][0].solvedOnRetry).toBe(true)
  })

  it('has the text again under «Leer el texto otra vez» in the questions', async () => {
    const user = userEvent.setup()
    renderScreen('fabula-camaleon')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByText('Leer el texto otra vez'))
    expect(screen.getByText(/Lumi quiere contar una fábula/)).toBeInTheDocument()
  })
})
