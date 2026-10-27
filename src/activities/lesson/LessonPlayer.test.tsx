import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { lessons } from '@/content'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { ActivityHost, LessonDef, LessonStep } from '@/types'
import LessonPlayer from './LessonPlayer'

// The real ExerciseView is lazy-loaded from the activity views; lesson tests use a fake that answers on demand.
vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const fake = await import('./testing/FakeExerciseView')
  return { ExerciseView: fake.FakeExerciseView, useActivityHost: host.useActivityHost }
})

// Speech and sound are browser features; the player only calls them, so they are stubbed here.
vi.mock('@/audio', () => ({
  speech: { say: vi.fn(() => Promise.resolve()), stop: vi.fn() },
  sfx: { play: vi.fn() },
}))

const NEXT = /Siguiente|Lo he entendido/

function nextButton() {
  return screen.getByRole('button', { name: NEXT })
}

function expectStepText(step: LessonStep) {
  expect(screen.getByTestId('lesson-text').textContent).toBe(defaultActivityHost.t(step.text))
}

/** Plays a whole lesson: taps through "tap" steps and answers "try" steps correctly. */
async function playThrough(lesson: LessonDef) {
  const user = userEvent.setup()
  const onDone = vi.fn()
  // SafeVisual hides a crashing visual; React reports the caught error through console.error, so a silent crash fails here.
  const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  render(<LessonPlayer lesson={lesson} onDone={onDone} />)
  for (const step of lesson.steps) {
    expectStepText(step)
    if (step.interaction === 'try') {
      expect(nextButton()).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Responder bien' }))
      expect(nextButton()).toBeEnabled()
    }
    if (step.interaction === 'choose') {
      // A choice: nothing to go on with until one option is picked; the pick is saved through the host.
      expect(nextButton()).toBeDisabled()
      await user.click(screen.getByRole('radio', { name: step.choices?.[0].label }))
      expect(nextButton()).toBeEnabled()
    }
    await user.click(nextButton())
  }
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(errors).not.toHaveBeenCalled()
  errors.mockRestore()
}

const small: LessonDef = {
  id: 'test-small',
  title: 'Prueba',
  steps: [
    { visual: 'groups', params: { groups: 2, perGroup: 3, emoji: '🍄' }, text: 'Primero: {child}.', interaction: 'tap' },
    { visual: 'groups', params: { groups: 2, perGroup: 3, emoji: '🍄' }, text: 'Segundo.', interaction: 'tap' },
    { visual: 'carry', params: { a: 368, b: 257 }, text: 'Tercero.', interaction: 'tap', speaker: 'owl' },
  ],
}

describe('LessonPlayer: Season 1', () => {
  it.each(lessons.map((l) => [l.id, l] as const))('plays every step of %s', async (_id, lesson) => {
    await playThrough(lesson)
  }, 30000)
})

describe('LessonPlayer: navigation', () => {
  it('moves forward and back with the buttons and shows the child name through host.t', async () => {
    const user = userEvent.setup()
    render(<LessonPlayer lesson={small} onDone={() => undefined} />)
    expect(screen.getByTestId('lesson-text').textContent).toBe('Primero: Inessa.')
    expect(screen.getByRole('button', { name: '‹ Atrás' })).toBeDisabled()
    await user.click(nextButton())
    expect(screen.getByTestId('lesson-text').textContent).toBe('Segundo.')
    await user.click(screen.getByRole('button', { name: '‹ Atrás' }))
    expect(screen.getByTestId('lesson-text').textContent).toBe('Primero: Inessa.')
  })

  it('moves with the keyboard: arrows, Enter and Escape', () => {
    const onExit = vi.fn()
    const onDone = vi.fn()
    render(<LessonPlayer lesson={small} onDone={onDone} onExit={onExit} />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(screen.getByTestId('lesson-text').textContent).toBe('Segundo.')
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(screen.getByTestId('lesson-text').textContent).toBe('Primero: Inessa.')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    fireEvent.keyDown(document.body, { key: 'PageDown' })
    expect(screen.getByTestId('lesson-text').textContent).toBe('Tercero.')
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(onDone).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('ignores arrows while typing in a field', () => {
    render(
      <>
        <input aria-label="respuesta" />
        <LessonPlayer lesson={small} onDone={() => undefined} />
      </>,
    )
    fireEvent.keyDown(screen.getByLabelText('respuesta'), { key: 'ArrowRight' })
    expect(screen.getByTestId('lesson-text').textContent).toBe('Primero: Inessa.')
  })

  it('offers an exit button only when an exit handler is given', () => {
    const { unmount } = render(<LessonPlayer lesson={small} onDone={() => undefined} />)
    expect(screen.queryByRole('button', { name: 'Salir de la lección' })).toBeNull()
    unmount()
    render(<LessonPlayer lesson={small} onDone={() => undefined} onExit={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Salir de la lección' })).toBeInTheDocument()
  })

  it('exposes the step as a progress bar', () => {
    render(<LessonPlayer lesson={small} onDone={() => undefined} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '1')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
  })
})

const tryLesson: LessonDef = {
  id: 'test-try',
  title: 'Intentos',
  steps: [
    { visual: 'groups', params: { groups: 2, perGroup: 3, emoji: '🍄' }, text: 'Mira.', interaction: 'tap' },
    { visual: 'groups', params: { groups: 2, perGroup: 5, emoji: '🍓' }, text: 'Te toca.', interaction: 'try', trySelector: { kinds: ['fact-mul'], tables: [2], factorRange: [2, 5] } },
    { visual: 'carry', params: { a: 1, b: 2 }, text: 'Fin.', interaction: 'tap' },
  ],
}

describe('LessonPlayer: try steps', () => {
  it('waits for a correct answer, then continues', async () => {
    const user = userEvent.setup()
    const reportAttempt = vi.fn()
    const host: ActivityHost = { ...defaultActivityHost, reportAttempt }
    render(
      <ActivityHostProvider value={host}>
        <LessonPlayer lesson={tryLesson} onDone={() => undefined} />
      </ActivityHostProvider>,
    )
    await user.click(nextButton())
    expect(nextButton()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Responder bien' }))
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(nextButton()).toBeEnabled()
    await user.click(nextButton())
    expect(screen.getByTestId('lesson-text').textContent).toBe('Fin.')
  })

  it('records the retry: the second try of a step carries retries: 1', async () => {
    const user = userEvent.setup()
    const reportAttempt = vi.fn()
    const host: ActivityHost = { ...defaultActivityHost, reportAttempt }
    render(
      <ActivityHostProvider value={host}>
        <LessonPlayer lesson={tryLesson} onDone={() => undefined} />
      </ActivityHostProvider>,
    )
    await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: 'Responder mal' }))
    await user.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    await user.click(screen.getByRole('button', { name: 'Responder bien' }))
    expect(reportAttempt).toHaveBeenCalledTimes(2)
    expect(reportAttempt.mock.calls[0][0].retries).toBeUndefined()
    expect(reportAttempt.mock.calls[1][0]).toMatchObject({ retries: 1, solvedOnRetry: true, graded: false })
    expect(reportAttempt.mock.calls[0][0].graded).toBeUndefined() // the first answer grades
  })

  it('offers a retry after a miss and lets the lesson go on after two misses', async () => {
    const user = userEvent.setup()
    render(<LessonPlayer lesson={tryLesson} onDone={() => undefined} />)
    await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(nextButton()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    await user.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(nextButton()).toBeEnabled()
    await user.click(nextButton())
    expect(screen.getByTestId('lesson-text').textContent).toBe('Fin.')
  })
})

describe('LessonPlayer: going back to a settled try step', () => {
  it('keeps a solved try step solved when the child goes back to it', async () => {
    const user = userEvent.setup()
    render(<LessonPlayer lesson={tryLesson} onDone={() => undefined} />)
    await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: 'Responder bien' }))
    await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: '‹ Atrás' }))
    expect(screen.getByTestId('lesson-text').textContent).toBe('Te toca.')
    // No exercise is offered again, so the step cannot be skipped by re-answering it.
    expect(screen.queryByRole('button', { name: 'Responder bien' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Responder mal' })).toBeNull()
    expect(screen.getByText(/¡Muy bien/)).toBeInTheDocument()
    expect(nextButton()).toBeEnabled()
  })

  it('keeps a given-up try step given up', async () => {
    const user = userEvent.setup()
    render(<LessonPlayer lesson={tryLesson} onDone={() => undefined} />)
    await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: 'Responder mal' }))
    await user.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    await user.click(screen.getByRole('button', { name: 'Responder mal' }))
    await user.click(nextButton())
    await user.click(screen.getByRole('button', { name: '‹ Atrás' }))
    expect(screen.queryByRole('button', { name: 'Responder bien' })).toBeNull()
    expect(screen.getByText(/Seguimos con la lección/)).toBeInTheDocument()
    expect(nextButton()).toBeEnabled()
  })
})

describe('LessonPlayer: empty lesson', () => {
  it('still lets the child leave', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<LessonPlayer lesson={{ id: 'empty', title: 'Vacía', steps: [] }} onDone={onDone} />)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

describe('LessonPlayer: choose step', () => {
  it('saves the picked method through the host and only then goes on', async () => {
    const user = userEvent.setup()
    const setPreference = vi.fn()
    const onDone = vi.fn()
    const choose: LessonDef = {
      id: 'test-choose',
      title: 'Elige',
      steps: [
        {
          visual: 'sub-check',
          params: { a: 352, b: 127 },
          text: '¿Cuál te ha resultado más fácil?',
          interaction: 'choose',
          choices: [
            { label: 'Por partes', value: 'parts' },
            { label: 'Saltos en la recta', value: 'line' },
          ],
        },
      ],
    }
    render(
      <ActivityHostProvider value={{ ...defaultActivityHost, setPreference }}>
        <LessonPlayer lesson={choose} onDone={onDone} />
      </ActivityHostProvider>,
    )
    expect(screen.getByRole('button', { name: /Lo he entendido/ })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'Saltos en la recta' }))
    expect(setPreference).toHaveBeenCalledWith('subMethod', 'line')
    expect(screen.getByRole('status')).toHaveTextContent('Saltos en la recta')
    await user.click(screen.getByRole('button', { name: /Lo he entendido/ }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

describe('LessonPlayer: hints on try steps', () => {
  const withHints: LessonDef = {
    id: 'test-hints',
    title: 'Pistas',
    steps: [{ visual: 'borrow', params: { a: 52, b: 21 }, text: 'Con pista.', interaction: 'try', trySelector: { kinds: ['column-sub'], digits: 2, regroup: 'one', zeros: false } }],
  }
  const noHints: LessonDef = {
    id: 'test-no-hints',
    title: 'Sin pistas',
    steps: [{ visual: 'borrow', params: { a: 52, b: 21 }, text: 'Sin pista.', interaction: 'try', trySelector: { kinds: ['column-sub'], digits: 2, regroup: 'one', zeros: false }, hints: false }],
  }

  it('a try step with hints: false shows no «Pista» button', () => {
    render(<LessonPlayer lesson={noHints} onDone={() => undefined} />)
    expect(screen.getByTestId('fake-exercise')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pista' })).toBeNull()
  })

  it('a try step without the flag keeps its «Pista» button', () => {
    render(<LessonPlayer lesson={withHints} onDone={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Pista' })).toBeInTheDocument()
  })
})
