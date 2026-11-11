import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Assignment, ChildProfile } from '@/types'
import MissionScreen from './MissionScreen'

const CHILD = { id: 'c1', nickname: 'Lía', gender: 'f', grade: 3, companion: { name: 'Luna', gender: 'f' }, settings: {} } as unknown as ChildProfile
const MISSION: Assignment = {
  id: 'as-7', classId: 'class-1', title: 'Tabla del 7', selector: { skills: ['mul:7x8'] },
  startsAt: '2026-11-01T00:00:00.000Z', dueAt: null, createdBy: 't1',
}
let missions: Assignment[] = []
const hostProps: Record<string, unknown>[] = []

vi.mock('@/data', () => ({
  MISSION_DONE_ATTEMPTS: 10,
  useActiveChild: () => ({ child: CHILD, loading: false, setActiveChild() {} }),
  listAssignmentsForChild: async () => missions,
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

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/play/mision/${id}`]}>
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
})

describe('MissionScreen', () => {
  it('plays the mission marked with its id, then says it is done and goes home', async () => {
    renderAt('as-7')
    expect(await screen.findByText('Actividad: Tabla del 7 (10)')).toBeInTheDocument()
    expect(hostProps.at(-1)).toMatchObject({ activity: 'mission', assignmentId: 'as-7' })
    fireEvent.click(screen.getByRole('button', { name: 'terminar' }))
    expect(await screen.findByRole('heading', { name: '¡Misión hecha!' })).toBeInTheDocument()
    expect(screen.getByText(/Has acertado 9 de 10/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('«Salir» goes back home at any time', async () => {
    renderAt('as-7')
    fireEvent.click(await screen.findByRole('button', { name: 'Salir' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('a mission that is not current any more sends the child home', async () => {
    missions = []
    renderAt('as-7')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })
})
