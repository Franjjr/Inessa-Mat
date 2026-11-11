/* Race: the clock and the record only exist when every fact of the run is already practised. */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityConfig, MasteryMap } from '@/types'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import RaceActivity from './index'

vi.mock('@/audio', () => ({
  sfx: { play: vi.fn() },
  haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() },
  speech: { say: vi.fn(async () => {}) },
}))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const config: ActivityConfig = { kind: 'race', title: 'Carrera', instructions: '', selector: { kinds: ['fact-mul'], tables: [6] }, count: 3 }

function mastery(box: number | null): MasteryMap {
  return box === null
    ? {}
    : new Proxy({} as MasteryMap, { get: () => ({ box, attempts: 5, correct: 5, streak: 3, avgMs: 900, lastSeenAt: null, dueAt: null, skill: 'x' }) as never })
}

function renderRace(box: number | null) {
  return render(
    <ActivityHostProvider value={{ ...defaultActivityHost, mastery: mastery(box) }}>
      <RaceActivity config={config} onDone={() => {}} onExit={() => {}} />
    </ActivityHostProvider>,
  )
}

describe('RaceActivity', () => {
  it('shows no clock and says "Sin prisa" while a fact is still being learnt', () => {
    renderRace(null)
    expect(screen.getByText('Sin prisa')).toBeInTheDocument()
    expect(screen.queryByText(/⏱/)).toBeNull()
  })

  it('shows the clock when every fact is already practised', () => {
    renderRace(4)
    expect(screen.getByText(/⏱/)).toBeInTheDocument()
  })
})
