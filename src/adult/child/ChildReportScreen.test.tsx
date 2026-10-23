import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile, ChildSummary, ProgressState } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'

const data = vi.hoisted(() => ({
  getChildSummary: vi.fn(),
  getProgress: vi.fn(),
  getRewards: vi.fn(),
  useChildren: vi.fn(),
  updateChild: vi.fn(),
  clearInkSamples: vi.fn(),
  eraseChild: vi.fn(),
  exportChildData: vi.fn(),
  setChestReward: vi.fn(),
  markRewardClaimed: vi.fn(),
  getMastery: vi.fn(),
  listAttempts: vi.fn(),
  updateProgress: vi.fn(),
}))

vi.mock('@/data', () => data)

import ChildReportScreen from './ChildReportScreen'

const CHILD: ChildProfile = {
  id: 'c1',
  orgId: null,
  nickname: 'Inessa',
  gender: 'f',
  grade: 2,
  companion: { species: 'fox', name: 'Pipo', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

/** 10×10 grid: everything unseen except a few facts with known boxes. */
function seededGrid(): number[][] {
  const grid = Array.from({ length: 10 }, () => Array(10).fill(-1))
  const set = (a: number, b: number, box: number) => {
    grid[a - 1][b - 1] = box
    grid[b - 1][a - 1] = box
  }
  set(2, 3, 5) // mastered
  set(7, 7, 1) // struggling
  set(6, 8, 3) // learning
  return grid
}

const SUMMARY: ChildSummary = {
  childId: 'c1',
  nickname: 'Inessa',
  companionSpecies: 'fox',
  worldsCompleted: 1,
  currentWorld: 'w2',
  minutesLast7Days: 42,
  accuracyLast7Days: 0.8,
  factGrid: seededGrid(),
  topErrors: [{ errorType: 'fact', count: 4 }],
  lastPlayedAt: null,
}

const PROGRESS = {
  childId: 'c1',
  seasonId: 'season1',
  worlds: { w1: { unlocked: true, crystal: true, nodes: {} }, w2: { unlocked: true, crystal: false, nodes: {} } },
} as unknown as ProgressState

function renderReport() {
  return render(
    <MemoryRouter initialEntries={['/adult/child/c1']}>
      <Routes>
        <Route path="/adult/child/:childId" element={<ChildReportScreen />} />
        <Route path="/adult" element={<p>Zona de adultos</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ChildReportScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    data.useChildren.mockReturnValue([CHILD])
    data.getChildSummary.mockResolvedValue(SUMMARY)
    data.getProgress.mockResolvedValue(PROGRESS)
    data.getRewards.mockResolvedValue([])
    data.getMastery.mockResolvedValue({})
    // Four wrong times-table answers in the last days.
    data.listAttempts.mockResolvedValue(Array.from({ length: 4 }, (_, i) => ({
      id: `a${i}`, childId: 'c1', sessionId: 's', skill: 'mul:7x7', kind: 'fact-mul', correct: false, given: '48', expected: '49',
      ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType: 'fact', context: {}, createdAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
    })))
  })

  it('renders the 10×10 times-table heatmap from the seeded summary', async () => {
    renderReport()

    const heatmap = await screen.findByRole('table', { name: /Mapa de las tablas de Inessa/ })
    expect(within(heatmap).getAllByRole('cell')).toHaveLength(55)

    // Each state has a label, not only a colour.
    expect(within(heatmap).getByRole('cell', { name: '2 × 3 = 6: Dominada' })).toBeInTheDocument()
    expect(within(heatmap).getByRole('cell', { name: '7 × 7 = 49: Hay que repasarla' })).toBeInTheDocument()
    expect(within(heatmap).getByRole('cell', { name: '6 × 8 = 48: En camino' })).toBeInTheDocument()
    expect(within(heatmap).getByRole('cell', { name: '9 × 9 = 81: Sin practicar' })).toBeInTheDocument()
  })

  it('explains the mistakes by kind with what helps, and shows 7-day time and accuracy', async () => {
    renderReport()

    expect(await screen.findByRole('heading', { name: 'Tablas y cálculo básico' })).toBeInTheDocument()
    expect(screen.getByText('4 veces')).toBeInTheDocument()
    expect(screen.getByText(/Repasar un rato esas tablas/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Temario de 2.º' })).toBeInTheDocument()
    expect(screen.getByText('42 min')).toBeInTheDocument()
    expect(screen.getByText('80 %')).toBeInTheDocument()
    expect(screen.getByText('1 de 8')).toBeInTheDocument()
  })

  it('shows the real prize setup when there is no reward yet', async () => {
    renderReport()
    expect(await screen.findByText('¿Qué premio será?')).toBeInTheDocument()
  })
})
