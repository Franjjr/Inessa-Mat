import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { classForTopic } from '@/content/classes'
import { initialProgress } from '@/content'
import { recordAttempt, updateProgress } from '@/data'
import type { ProgressState } from '@/types'
import { CHILD_ID, makeChild } from '@/world/rewards/testing'
import ClassScreen from './ClassScreen'

const TOPIC = 'resta-3d-prestando'

// The real exercise view is replaced by a button that answers right or wrong from a script (one entry per exercise).
// The lesson is replaced by its first step text and two buttons: finish, and leave.
const state = vi.hoisted(() => ({ answers: [] as boolean[], calls: 0 }))

vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  return {
    ...actual,
    ExerciseView: ({ onAnswered }: { onAnswered: (o: unknown) => void }) => React.createElement('button', {
      type: 'button',
      onClick: () => {
        const correct = state.answers[state.calls++] ?? true
        onAnswered({
          check: { correct, given: '0', expected: '0', errorType: correct ? undefined : 'fact' },
          ms: 1000,
          inputMode: 'keyboard',
          hintsUsed: 0,
          recognitionFixes: 0,
        })
      },
    }, 'Responder'),
    LessonPlayer: ({ lesson, onDone, onExit }: { lesson: { steps: { text: string }[] }; onDone: () => void; onExit: () => void }) =>
      React.createElement('div', null,
        React.createElement('p', null, lesson.steps[0].text),
        React.createElement('button', { type: 'button', onClick: onDone }, 'Terminar la lección'),
        React.createElement('button', { type: 'button', onClick: onExit }, 'Salir de la lección'),
      ),
  }
})

vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return {
    ...actual,
    useActiveChild: () => ({ child: makeChild({ grade: 3 }), loading: false, setActiveChild: () => {} }),
    updateProgress: vi.fn(async (_id: string, update: (p: ProgressState) => ProgressState) =>
      update(initialProgress(CHILD_ID))),
    recordAttempt: vi.fn(async () => undefined),
  }
})

beforeEach(() => {
  state.answers = []
  state.calls = 0
  vi.mocked(updateProgress).mockClear()
  vi.mocked(recordAttempt).mockClear()
})

function renderAt(topicId = TOPIC) {
  render(
    <MemoryRouter initialEntries={[`/play/clase/${topicId}`]}>
      <Routes>
        <Route path="/play/clase/:topicId" element={<ClassScreen />} />
        <Route path="/play" element={<div>HOME</div>} />
        <Route path="/play/sesion" element={<div>SESSION</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ClassScreen', () => {
  it('the lesson done marks the class and offers the session', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: '¡Empezar la clase!' }))
    await user.click(screen.getByRole('button', { name: 'Terminar la lección' }))
    expect(await screen.findByText('¡Clase terminada!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Seguir con la sesión' }))
    expect(await screen.findByText('SESSION')).toBeInTheDocument()

    expect(updateProgress).toHaveBeenCalledTimes(1)
    const [id, update] = vi.mocked(updateProgress).mock.calls[0]
    expect(id).toBe(CHILD_ID)
    expect(update(initialProgress(CHILD_ID)).flags[`clase:${TOPIC}`]).toBe(true)
  })

  it('«Ya lo sé» with all three right skips the class', async () => {
    state.answers = [true, true, true]
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: 'Ya lo sé' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Terminar' }))

    expect(await screen.findByText('¡Clase terminada!')).toBeInTheDocument()
    await waitFor(() => expect(recordAttempt).toHaveBeenCalledTimes(3))
    expect(updateProgress).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Terminar la lección' })).not.toBeInTheDocument()
  })

  it('«Ya lo sé» with one wrong starts the class from its first step', async () => {
    state.answers = [true, false]
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: 'Ya lo sé' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('¡Vamos a verlo juntos!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '¡Empezar la clase!' }))
    expect(screen.getByText(classForTopic(TOPIC)!.lesson.steps[0].text)).toBeInTheDocument()
    expect(recordAttempt).toHaveBeenCalledTimes(2)
    expect(updateProgress).not.toHaveBeenCalled()
  })

  it('leaving half-way does not mark the class', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: '¡Empezar la clase!' }))
    await user.click(screen.getByRole('button', { name: 'Salir de la lección' }))
    expect(await screen.findByText('HOME')).toBeInTheDocument()
    expect(updateProgress).not.toHaveBeenCalled()
  })

  it('a topic without class goes back home', async () => {
    renderAt('tema-que-no-existe')
    expect(await screen.findByText('HOME')).toBeInTheDocument()
  })
})
