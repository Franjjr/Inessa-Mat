import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialProgress } from '@/content'
import { updateProgress } from '@/data'
import { placedTopicIds, placementRunFlags } from '@/engine'
import type { ProgressState } from '@/types'
import { CHILD_ID, makeChild } from '@/world/rewards/testing'
import PlacementScreen from './PlacementScreen'

// The real exercise view is replaced by a button that answers right or wrong (state.right).
const state = vi.hoisted(() => ({ right: true, progress: null as ProgressState | null }))

vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  return {
    ...actual,
    ExerciseView: ({ onAnswered }: { onAnswered: (o: unknown) => void }) => React.createElement('button', {
      type: 'button',
      onClick: () => onAnswered({
        check: { correct: state.right, given: '0', expected: '0', errorType: state.right ? undefined : 'fact' },
        ms: 1000, inputMode: 'keyboard', hintsUsed: 0, recognitionFixes: 0,
      }),
    }, 'Responder'),
  }
})

vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return {
    ...actual,
    useActiveChild: () => ({ child: makeChild({ grade: 3 }), loading: false, setActiveChild: () => {} }),
    useProgress: () => state.progress,
    updateProgress: vi.fn(async (_id: string, update: (p: ProgressState) => ProgressState) => update(state.progress!)),
    recordAttempt: vi.fn(async () => undefined),
  }
})

beforeEach(() => {
  state.right = true
  state.progress = initialProgress(CHILD_ID)
  vi.mocked(updateProgress).mockClear()
})

async function runToEnd(answer: 'Responder' | 'No lo sé') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/play/prueba']}>
      <Routes>
        <Route path="/play/prueba" element={<PlacementScreen />} />
        <Route path="/play" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>,
  )
  for (let i = 0; i < 40; i++) {
    await user.click(await screen.findByRole('button', { name: answer }))
    const end = screen.queryByRole('button', { name: 'Terminar' })
    if (end) {
      await user.click(end)
      break
    }
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  }
}

describe('PlacementScreen (the test places the child)', () => {
  it('all right: the clearly known topics are flagged to confirm, no star or crystal, and the end text says it', async () => {
    await runToEnd('Responder')
    expect(await screen.findByText(/Ya sabemos qué te sale bien/)).toBeInTheDocument()
    const [, update] = vi.mocked(updateProgress).mock.calls[0]
    const after = update(state.progress!)
    expect(after.flags.placement).toBe(true)
    expect(placedTopicIds(after).has('suma-3d-sin-llevar')).toBe(true)
    // A topic with a skill the test does not ask is never set aside.
    expect(placedTopicIds(after).has('descomponer-9999')).toBe(false)
    expect(after.stars).toBe(state.progress!.stars)
    expect(Object.values(after.worlds).some((w) => w.crystal)).toBe(false)
  })

  it('«No lo sé» everywhere: nothing is flagged as known, and the end text does not claim it', async () => {
    await runToEnd('No lo sé')
    expect(await screen.findByText(/Ya sabemos lo que te toca aprender/)).toBeInTheDocument()
    const [, update] = vi.mocked(updateProgress).mock.calls[0]
    expect(placedTopicIds(update(state.progress!)).size).toBe(0)
  })

  it('a new test asked by the adult replaces the old known topics of the subject (and keeps the other subjects\')', async () => {
    state.progress = {
      ...initialProgress(CHILD_ID),
      flags: { placement: true, placementRequested: true, ...placementRunFlags('math', '1000', ['tabla-2']), ...placementRunFlags('language', '1000', ['lng-articulo']) },
    }
    state.right = false
    await runToEnd('Responder')
    await screen.findByText(/Ya sabemos lo que te toca aprender/)
    const [, update] = vi.mocked(updateProgress).mock.calls[0]
    const after = update(state.progress!)
    expect(placedTopicIds(after).has('tabla-2')).toBe(false)
    expect(placedTopicIds(after).has('lng-articulo')).toBe(true)
    expect(after.flags.placementRequested).toBe(false)
  })

  it('a test done again without the adult asking changes no flag', async () => {
    state.progress = { ...initialProgress(CHILD_ID), flags: { placement: true, ...placementRunFlags('math', '1000', ['tabla-2']) } }
    state.right = false
    await runToEnd('Responder')
    await screen.findByText(/Ya sabemos lo que te toca aprender/)
    expect(updateProgress).not.toHaveBeenCalled()
  })
})
