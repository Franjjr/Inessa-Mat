/* Building the groups is optional after several right rounds, like the rectangle of «array». The run is mocked so the
   test can start a round with the child already known to be right several times. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig, Exercise } from '@/types'
import GroupsActivity from './index'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const run = { correct: 0 }
vi.mock('./useOpsRun', () => ({
  useOpsRun: (exercises: Exercise[]) => ({ index: 1, total: 4, exercise: exercises[0], retry: false, correct: run.correct, record: () => {} }),
}))

const config: ActivityConfig = { kind: 'groups', title: 'Haz grupos', instructions: '', selector: { kinds: ['groups'] }, count: 4 }
const SKIP = 'Ya lo sé, ¿cuántos hay?'

describe('groups · building step', () => {
  it('cannot be skipped before several right rounds', () => {
    run.correct = 1
    render(<GroupsActivity config={config} onDone={() => {}} onExit={() => {}} />)
    expect(screen.queryByRole('button', { name: SKIP })).toBeNull()
  })

  it('can be skipped after several right rounds, and the skip goes straight to the question', () => {
    run.correct = 3
    render(<GroupsActivity config={config} onDone={() => {}} onExit={() => {}} />)
    expect(screen.getByLabelText('Haz grupos iguales')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: SKIP }))
    expect(screen.queryByLabelText('Haz grupos iguales')).toBeNull()
  })
})
