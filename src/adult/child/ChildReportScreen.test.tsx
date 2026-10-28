import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile, ChildSummary, ProgressState } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, LENGUA3_SYLLABUS } from '@/content/syllabus'
import { LENGUA_PLACEMENT_ACTIVITY, LENGUA_PLACEMENT_COUNT, newMastery, syllabusReport } from '@/engine'

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
  listSessions: vi.fn(),
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
    data.listSessions.mockResolvedValue([])
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

  describe('Lengua', () => {
    const LENGUA_CHILD: ChildProfile = { ...CHILD, grade: 3, settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language'] } }
    const LENGUA_PROGRESS = { ...PROGRESS, flags: { 'lectura:historia-tarta': true, 'lectura:fabula-camaleon': true } } as unknown as ProgressState
    const GRAM = ['lng:gram:sustantivo:genero', 'lng:gram:articulo', 'lng:gram:adjetivo', 'lng:gram:verbo:presente']
    const ORTO = ['lng:orto:mayusculas', 'lng:orto:c-qu', 'lng:orto:signos:punto', 'lng:orto:tonica']
    const VOC = ['lng:voc:abecedario', 'lng:voc:sinonimos', 'lng:voc:familias', 'lng:voc:compuestas']
    const DAY = 86_400_000
    const ago = (d: number) => new Date(Date.now() - d * DAY).toISOString()

    /** Four wrong times-table answers, as in the maths tests above. */
    function mathRows() {
      return Array.from({ length: 4 }, (_, i) => ({
        id: `a${i}`, childId: 'c1', sessionId: 's', skill: 'mul:7x7', kind: 'fact-mul', correct: false, given: '48', expected: '49',
        ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType: 'fact', context: {}, createdAt: ago(i + 1),
      }))
    }

    /** Lengua rows: two wrong spellings, a «No lo sé» and a placement run. */
    function lenguaRows() {
      const wrong = [
        { id: 'l1', skill: 'lng:orto:c-qu', correct: false, errorType: 'spelling', createdAt: ago(1) },
        { id: 'l2', skill: 'lng:orto:c-qu', correct: false, errorType: 'spelling', createdAt: ago(2) },
        { id: 'l3', skill: 'lng:gram:silabas', correct: false, errorType: 'dont-know', createdAt: ago(3) },
      ]
      const placement = [...GRAM, ...ORTO, ...VOC].slice(0, LENGUA_PLACEMENT_COUNT).map((skill, i) => ({
        id: `p${i}`, skill, sessionId: 'lp1', correct: i < 6, errorType: i < 6 ? null : 'other', createdAt: new Date(Date.now() - 5 * DAY + i * 30_000).toISOString(),
        context: { activity: LENGUA_PLACEMENT_ACTIVITY },
      }))
      return [...wrong, ...placement].map((a) => ({
        childId: 'c1', kind: 'lengua', given: '', expected: '', ms: 1000, inputMode: 'keypad', hintsUsed: 0, context: {}, sessionId: 'l', ...a,
      }))
    }

    it('shows the Lengua cards next to the maths ones, with the maths figures unchanged', async () => {
      const mixed = { 'lng:gram:silabas': newMastery('lng:gram:silabas', new Date()), 'mul:6x7': newMastery('mul:6x7', new Date()) }
      data.useChildren.mockReturnValue([LENGUA_CHILD])
      data.getProgress.mockResolvedValue(LENGUA_PROGRESS)
      data.getMastery.mockResolvedValue({ ...mixed, 'lng:gram:silabas': { ...mixed['lng:gram:silabas'], box: 2 } })
      data.listAttempts.mockResolvedValue([...mathRows(), ...lenguaRows()])
      data.listSessions.mockResolvedValue([{ id: 'sl', minutes: 12, summary: { subject: 'language' }, startedAt: ago(1) }])
      renderReport()

      expect(await screen.findByRole('heading', { name: 'Temario de Lengua de 3.º' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'En qué falla en Lengua' })).toBeInTheDocument()
      expect(screen.getByText(/Ha leído 2 de 10 lecturas/)).toBeInTheDocument()
      expect(screen.getByText('12 min en los últimos 7 días')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Prueba inicial de Lengua' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Ortografía y sílabas' })).toBeInTheDocument()
      expect(screen.getByText('No lo sabía: 1')).toBeInTheDocument()

      // The maths temario reads only maths rows: the Lengua mastery is not in it.
      const maths = syllabusReport(GRADE3_SYLLABUS, { 'mul:6x7': mixed['mul:6x7'] })
      expect(screen.getByText(`${maths.mastered} de ${maths.available} temas dominados`)).toBeInTheDocument()
      const lengua = syllabusReport(LENGUA3_SYLLABUS, { 'lng:gram:silabas': { ...mixed['lng:gram:silabas'], box: 2 } }, 'language')
      expect(lengua.mastered).toBe(1)
      expect(screen.getByRole('heading', { name: 'Temario de 3.º' })).toBeInTheDocument()

      // Element ids stay unique on the page (the two subjects render the same cards).
      const ids = Array.from(document.querySelectorAll('[id]'), (e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('leaves the Lengua cards out for a child who is not on Lengua and has no Lengua rows', async () => {
      data.useChildren.mockReturnValue([{ ...LENGUA_CHILD, settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math'] } }])
      renderReport()
      expect(await screen.findByRole('heading', { name: 'Temario de 3.º' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Lengua/ })).toBeNull()
    })

    it('leaves the Lengua cards out for a 2.º child even when Lengua is switched on', async () => {
      data.useChildren.mockReturnValue([{ ...CHILD, settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language'] } }])
      renderReport()
      expect(await screen.findByRole('heading', { name: 'Temario de 2.º' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Lengua/ })).toBeNull()
    })
  })
})
