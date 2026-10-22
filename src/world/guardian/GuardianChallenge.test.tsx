import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGuardian, getWorld } from '@/content'
import GuardianChallenge from './GuardianChallenge'

// The exercise views are covered by the activities module. Here a stub answers on click, and the test decides
// whether each answer is right, so the challenge's own rules are what get exercised.
const hooks = vi.hoisted(() => ({ decide: (_index: number): boolean => true, calls: 0 }))

vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  function ExerciseView({ exercise, onAnswered }: { exercise: { kind: string }; onAnswered: (o: unknown) => void }) {
    return React.createElement(
      'button',
      {
        type: 'button',
        'data-kind': exercise.kind,
        onClick: () => {
          const index = hooks.calls++
          onAnswered({
            check: { correct: hooks.decide(index), given: '0', expected: '0' },
            ms: 900,
            inputMode: 'keypad',
            hintsUsed: 0,
            recognitionFixes: 0,
          })
        },
      },
      'Responder',
    )
  }
  return { ...actual, ExerciseView }
})

vi.mock('@/audio', () => ({
  music: { play: vi.fn() },
  sfx: { play: vi.fn() },
}))

const owl = () => getGuardian('w1-guardian')!
const world = () => getWorld('w1')!

function renderChallenge() {
  const onPass = vi.fn<(r: { correct: number; total: number; letter: string }) => void>()
  const onFail = vi.fn<(r: { correct: number; total: number }) => void>()
  const onExit = vi.fn<() => void>()
  render(
    <MemoryRouter>
      <GuardianChallenge guardian={owl()} world={world()} onPass={onPass} onFail={onFail} onExit={onExit} />
    </MemoryRouter>,
  )
  return { onPass, onFail, onExit }
}

beforeEach(() => {
  hooks.calls = 0
  hooks.decide = () => true
})

describe('GuardianChallenge', () => {
  it('passes the owl with every round right and the spell: onPass gives the letter V', async () => {
    const user = userEvent.setup()
    const { onPass, onFail } = renderChallenge()

    await user.click(screen.getByRole('button', { name: '¡Acepto el desafío!' }))
    const rounds = owl().rounds.reduce((n, r) => n + r.count, 0)
    for (let i = 0; i < rounds; i++) {
      await user.click(await screen.findByRole('button', { name: 'Responder' }))
      const next = i + 1 < rounds ? 'Siguiente' : 'Ver el hechizo'
      await user.click(await screen.findByRole('button', { name: next }))
    }

    await user.click(await screen.findByRole('button', { name: 'Responder' }))
    await user.click(await screen.findByRole('button', { name: '¡Cristal conseguido!' }))

    expect(onPass).toHaveBeenCalledTimes(1)
    expect(onPass.mock.calls[0][0]).toMatchObject({ letter: 'V', total: rounds + 1 })
    expect(onFail).not.toHaveBeenCalled()
  })

  it('fails when fewer than passMin rounds are right, encourages and retries with a fresh set', async () => {
    const user = userEvent.setup()
    // The first two answers are wrong: 6 of 8 right, one short of the owl's pass mark (7).
    hooks.decide = (index) => index >= 2
    const { onPass, onFail } = renderChallenge()

    await user.click(screen.getByRole('button', { name: '¡Acepto el desafío!' }))
    const rounds = owl().rounds.reduce((n, r) => n + r.count, 0)
    for (let i = 0; i < rounds; i++) {
      await user.click(await screen.findByRole('button', { name: 'Responder' }))
      const next = i + 1 < rounds ? 'Siguiente' : 'Ver el hechizo'
      await user.click(await screen.findByRole('button', { name: next }))
    }

    expect(await screen.findByText(/Casi lo tienes/)).toBeInTheDocument()
    expect(onPass).not.toHaveBeenCalled()
    await waitFor(() => expect(onFail).toHaveBeenCalledWith({ correct: 6, total: rounds }))

    hooks.decide = () => true
    await user.click(screen.getByRole('button', { name: 'Intentarlo otra vez' }))
    expect(await screen.findByRole('button', { name: 'Responder' })).toBeInTheDocument()
  })

  it('gives the spell a second try before stopping', async () => {
    const user = userEvent.setup()
    const { onPass, onFail } = renderChallenge()
    // All rounds right; the spell is the last call: wrong once, then wrong again.
    const rounds = owl().rounds.reduce((n, r) => n + r.count, 0)
    hooks.decide = (index) => index < rounds

    await user.click(screen.getByRole('button', { name: '¡Acepto el desafío!' }))
    for (let i = 0; i < rounds; i++) {
      await user.click(await screen.findByRole('button', { name: 'Responder' }))
      await user.click(await screen.findByRole('button', { name: i + 1 < rounds ? 'Siguiente' : 'Ver el hechizo' }))
    }

    await user.click(await screen.findByRole('button', { name: 'Responder' }))
    await user.click(await screen.findByRole('button', { name: 'Probar otra vez' }))
    await user.click(await screen.findByRole('button', { name: 'Responder' }))
    await user.click(await screen.findByRole('button', { name: 'Seguir' }))

    expect(onPass).not.toHaveBeenCalled()
    expect(onFail).toHaveBeenCalledTimes(1)
  })

  it('leaves through the exit button', async () => {
    const user = userEvent.setup()
    const { onExit } = renderChallenge()
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    expect(onExit).toHaveBeenCalled()
  })
})
