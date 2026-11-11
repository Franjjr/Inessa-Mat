import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Assignment, ChildProfile } from '@/types'
import MissionScreen from './MissionScreen'

const CHILD = { id: 'c1', nickname: 'Lía', gender: 'f', grade: 3, companion: { name: 'Luna', gender: 'f' }, settings: {} } as unknown as ChildProfile
const MISSION: Assignment = {
  id: 'as-7', classId: 'class-1', title: 'Tabla del 7', selector: { skills: ['mul:7x8'] },
  startsAt: '2026-11-01T00:00:00.000Z', dueAt: null, createdBy: 't1',
}
let missions: Assignment[] | 'hang' = []
const flagged: string[] = []
let lateList: Promise<Assignment[]> | null = null
const hostProps: Record<string, unknown>[] = []

vi.mock('@/data', () => ({
  MISSION_DONE_ATTEMPTS: 10,
  useActiveChild: () => ({ child: CHILD, loading: false, setActiveChild() {} }),
  listAssignmentsForChild: () => (lateList ?? (missions === 'hang' ? new Promise(() => undefined) : Promise.resolve(missions))),
  updateProgress: async (_id: string, fn: (p: { flags?: Record<string, boolean> }) => { flags?: Record<string, boolean> }) => {
    flagged.push(...Object.keys(fn({ flags: {} }).flags ?? {}))
  },
}))
vi.mock('@/world/host/GameHost', () => ({
  GameHostProvider: ({ children, ...props }: { children: React.ReactNode }) => {
    hostProps.push(props)
    return <>{children}</>
  },
}))
vi.mock('@/activities', () => ({
  ActivityRunner: ({ config, onDone, onExit }: { config: { title: string; count: number }; onDone: (r: unknown) => void; onExit: () => void }) => (
    <div>
      <p>Actividad: {config.title} ({config.count})</p>
      <button type="button" onClick={() => onDone({ stars: 3, correct: 9, total: 10 })}>terminar</button>
      <button type="button" onClick={onExit}>Salir</button>
    </div>
  ),
}))

function renderAt(id: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/play/mision/${id}`, state }]}>
      <Routes>
        <Route path="/play/mision/:assignmentId" element={<MissionScreen />} />
        <Route path="/play" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  missions = [MISSION]
  hostProps.length = 0
  flagged.length = 0
  lateList = null
})

describe('MissionScreen', () => {
  it('plays the mission marked with its id, then says it is done and goes home', async () => {
    renderAt('as-7')
    expect(await screen.findByText('Actividad: Tabla del 7 (10)')).toBeInTheDocument()
    expect(hostProps.at(-1)).toMatchObject({ activity: 'mission', assignmentId: 'as-7' })
    fireEvent.click(screen.getByRole('button', { name: 'terminar' }))
    expect(await screen.findByRole('heading', { name: '¡Misión hecha!' })).toBeInTheDocument()
    expect(screen.getByText(/Has acertado 9 de 10/)).toBeInTheDocument()
    // The home bar then says «¡Hecha!» (a flag in the child's progress).
    expect(flagged).toEqual(['mision:as-7'])
    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('«Salir» goes back home at any time', async () => {
    renderAt('as-7')
    await screen.findByText('Actividad: Tabla del 7 (10)')
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('a mission that is not current any more sends the child home', async () => {
    missions = []
    renderAt('as-7')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('plays at once the mission handed over by the home, without waiting for the network', async () => {
    missions = 'hang'
    renderAt('as-7', { mission: MISSION })
    expect(await screen.findByText('Actividad: Tabla del 7 (10)')).toBeInTheDocument()
  })

  it('a mission handed over that is past its due date is not played', async () => {
    missions = []
    renderAt('as-7', { mission: { ...MISSION, dueAt: '2026-11-02T00:00:00.000Z' } })
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('«Salir» while loading wins over a list that arrives just after', async () => {
    let arrive: (l: Assignment[]) => void = () => undefined
    missions = 'hang'
    const late = new Promise<Assignment[]>((r) => { arrive = r })
    lateList = late
    renderAt('as-7')
    fireEvent.click(screen.getByRole('button', { name: /Salir/ }))
    await act(async () => { arrive([MISSION]); await late })
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('while it loads there is a «Salir» that goes home', async () => {
    missions = 'hang'
    renderAt('as-7')
    expect(screen.getByText('Preparando la misión…')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Salir/ }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('a network that hangs sends the child home after a few seconds, never stuck', async () => {
    vi.useFakeTimers()
    try {
      missions = 'hang'
      renderAt('as-7')
      expect(screen.getByText('Preparando la misión…')).toBeInTheDocument()
      await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
      expect(screen.getByText('Inicio')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
