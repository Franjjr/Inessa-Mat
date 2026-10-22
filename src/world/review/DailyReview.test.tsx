import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialProgress } from '@/content'
import { createRng, dueSkills } from '@/engine'
import { makeChild } from '@/world/rewards/testing'
import { buildReviewSession } from './logic'
import DailyReview from './DailyReview'

const state = vi.hoisted(() => ({ mastery: {} as Record<string, unknown> }))

vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return {
    ...actual,
    useActiveChild: () => ({ child: makeChild(), loading: false, setActiveChild: () => {} }),
    useProgress: () => initialProgress('child-test-1', new Date('2026-10-22T10:00:00.000Z')),
    useMastery: () => state.mastery,
  }
})

beforeEach(() => {
  state.mastery = {}
})

describe('buildReviewSession', () => {
  it('with nothing due and nothing weak there is nothing to review', () => {
    const plan = buildReviewSession({
      child: makeChild(),
      progress: initialProgress('child-test-1'),
      mastery: {},
      now: new Date('2026-10-22T10:00:00.000Z'),
      rng: createRng(3),
    })
    expect(plan.exercises).toHaveLength(0)
    expect(plan.dueCount).toBe(0)
  })

  it('with a skill due now the session is built from that skill', () => {
    const now = new Date('2026-10-22T10:00:00.000Z')
    const mastery = {
      'mul:6x7': { skill: 'mul:6x7', box: 1, attempts: 2, correct: 1, streak: 0, avgMs: null, lastSeenAt: '2026-10-01T10:00:00.000Z', dueAt: '2026-10-02T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' },
    }
    expect(dueSkills(mastery as never, now, 5)).toContain('mul:6x7')
    const plan = buildReviewSession({ child: makeChild(), progress: initialProgress('child-test-1'), mastery: mastery as never, now, rng: createRng(3) })
    expect(plan.dueCount).toBe(1)
    expect(plan.exercises.length).toBeGreaterThan(0)
    expect(plan.exercises.every((e) => e.skill === 'mul:6x7')).toBe(true)
  })
})

describe('DailyReview screen', () => {
  it('shows a friendly message, not an error, when nothing is due', async () => {
    render(
      <MemoryRouter>
        <DailyReview onDone={() => {}} onExit={() => {}} />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Hoy no tienes repasos pendientes, Inessa/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })
})
