/* The maths session opens the class first and counts in minutes (reviews H18 and P6-17, component level). */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { initialProgress } from '@/content'
import { classForTopic, markClassDone } from '@/content/classes'
import { planDailySession } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import type { ProgressState } from '@/types'
import { CHILD_ID, makeChild } from '@/world/rewards/testing'
import DailySession from './DailySession'

const state = vi.hoisted(() => ({ done: false, topic: '' }))

vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return {
    ...actual,
    useActiveChild: () => ({ child: makeChild({ grade: 3 }), loading: false, setActiveChild: () => {} }),
    useMastery: () => ({}),
    useProgress: () => {
      const base = initialProgress(CHILD_ID)
      if (!state.done) return base
      const plan = planDailySession({ child: makeChild({ grade: 3 }), mastery: {}, attempts: [], syllabus: syllabusForGrade(3), now: new Date(), progress: base })
      return markClassDone(base, classForTopic(plan.classTopicId!, 3)!, 'skip') as ProgressState
    },
    listAttempts: async () => [],
    updateProgress: vi.fn(async () => undefined),
  }
})

function renderSession() {
  render(
    <MemoryRouter initialEntries={['/play/sesion']}>
      <Routes>
        <Route path="/play/sesion" element={<DailySession onDone={() => {}} onExit={() => {}} />} />
        <Route path="/play/clase/:topicId" element={<div>CLASE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DailySession (maths)', () => {
  it('with today\'s class pending, the button is «¡Empezar la clase!» and it opens the class', async () => {
    state.done = false
    const user = userEvent.setup()
    renderSession()
    expect(await screen.findByRole('button', { name: '¡Empezar la clase!' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '¡Empezar!' })).toBeNull()
    await user.click(screen.getByRole('button', { name: '¡Empezar la clase!' }))
    expect(await screen.findByText('CLASE')).toBeInTheDocument()
  })

  it('with the class done, «¡Empezar!» starts the run and the counter reads «0 de 15 minutos»', async () => {
    state.done = true
    const user = userEvent.setup()
    renderSession()
    await user.click(await screen.findByRole('button', { name: '¡Empezar!' }))
    expect(await screen.findByText(/^0 de 15 minutos$/)).toBeInTheDocument()
  })
})
