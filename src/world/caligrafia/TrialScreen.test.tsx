import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PEN_SEEN_KEY } from '@/ink/constants'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'
import { replayStrokes } from '@/ink/dev/autoplay'
import { fixedElementSize, mockCanvas } from '@/ink/dev/testing'
import { exactStrokes, scaledStrokes, toInk } from '@/ink/cursive/fixtures'
import { joinWord } from '@/ink/cursive/join'
import { fitPauta } from '@/ink/cursive/score'
import { CURSIVE_THRESHOLDS } from '@/ink/cursive/thresholds'
import TrialScreen from './TrialScreen'

const saves = vi.hoisted(() => ({ recordAttempt: vi.fn(), saveMastery: vi.fn(), updateProgress: vi.fn(), updateChild: vi.fn() }))
vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: saves.updateChild,
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
  recordAttempt: saves.recordAttempt,
  saveMastery: saves.saveMastery,
  updateProgress: saves.updateProgress,
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/art/worlds/StarIcon', () => ({ StarIcon: ({ filled }: { filled?: boolean }) => <i data-testid={filled ? 'star-on' : 'star-off'} /> }))

const W = 640
const H = 380
let restore: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H) })
afterAll(() => restore())
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(PEN_SEEN_KEY, '2026-10-01')
  Object.values(saves).forEach((m) => m.mockClear())
})

function renderTrial() {
  render(
    <InkProvider recognizer={scriptedRecognizer([])}>
      <MemoryRouter>
        <TrialScreen />
      </MemoryRouter>
    </InkProvider>,
  )
}

/** Writes `strokes` for the item shown (the Repasar step first, as a child does), then presses «¡Listo!». */
function writeTry(text: string, strokes = exactStrokes(text)) {
  if (screen.queryByRole('button', { name: '¡A repasar!' })) fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
  if (screen.queryByRole('button', { name: '¡A escribir!' })) fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
  const fit = fitPauta(W, H, joinWord(text).width)
  act(() => replayStrokes(screen.getByRole('img', { name: /escribir/i }), toInk(strokes, fit)))
  fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
}

/** The row of the trial table for one criterion (the header cell names it). */
const rowOf = (label: string) => within(screen.getByRole('table')).getByRole('rowheader', { name: label }).closest('tr') as HTMLElement
/** Column 0 is the limit, column 1 the first try, column 2 the second. */
const cellOf = (label: string, column: number) => rowOf(label).querySelectorAll('td')[column] as HTMLElement

describe('TrialScreen (ensayo de caligrafía)', () => {
  it('shows the four raw values next to their thresholds, the pass or fail, the stars and the tip', () => {
    renderTrial()
    fireEvent.change(screen.getByRole('combobox', { name: 'Qué escribir' }), { target: { value: 'calig:letra:a' } })
    writeTry('a')

    const table = screen.getByRole('table')
    for (const label of ['Forma', 'Línea', 'Tamaño', 'Inicio']) {
      expect(within(table).getByRole('rowheader', { name: label })).toBeInTheDocument()
    }
    // The limits come from the thresholds file, not from copies in the page.
    expect(rowOf('Línea').textContent).toContain(String(CURSIVE_THRESHOLDS.line).replace('.', ','))
    expect(rowOf('Inicio').textContent).toContain(String(CURSIVE_THRESHOLDS.start).replace('.', ','))
    expect(rowOf('Tamaño').textContent).toContain(String(CURSIVE_THRESHOLDS.size.min).replace('.', ','))
    expect(rowOf('Tamaño').textContent).toContain(String(CURSIVE_THRESHOLDS.size.max).replace('.', ','))
    // A replayed exact model passes every criterion, gets three stars and the praise tip.
    expect(within(cellOf('Tamaño', 1)).getByText('Pasa')).toBeInTheDocument()
    expect(within(table).getAllByText('Pasa')).toHaveLength(4)
    expect(screen.getByRole('img', { name: '3 de 3 estrellas' })).toBeInTheDocument()
    expect(screen.getAllByText(/¡Muy bien!/).length).toBeGreaterThan(0)
  })

  it('shows a too big try as a failed size with its raw value above the limit', () => {
    renderTrial()
    fireEvent.change(screen.getByRole('combobox', { name: 'Qué escribir' }), { target: { value: 'calig:letra:a' } })
    writeTry('a', scaledStrokes('a', 1.4))
    expect(within(cellOf('Tamaño', 1)).getByText('No pasa')).toBeInTheDocument()
    const value = Number(cellOf('Tamaño', 1).querySelector('span')?.textContent?.replace(',', '.'))
    expect(value).toBeGreaterThan(CURSIVE_THRESHOLDS.size.max)
    expect(screen.getByRole('img', { name: /de 3 estrellas/ })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '3 de 3 estrellas' })).toBeNull()
  })

  it('keeps every try of the same item in the table, and saves nothing', () => {
    renderTrial()
    fireEvent.change(screen.getByRole('combobox', { name: 'Qué escribir' }), { target: { value: 'calig:letra:a' } })
    writeTry('a')
    fireEvent.click(screen.getByRole('button', { name: 'Otra vez' }))
    writeTry('a', scaledStrokes('a', 1.4))
    // One header row, one row per criterion and the stars; a column per try.
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(1 + 5)
    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(4)
    expect(within(cellOf('Tamaño', 2)).getByText('No pasa')).toBeInTheDocument()
    expect(saves.recordAttempt).not.toHaveBeenCalled()
    expect(saves.saveMastery).not.toHaveBeenCalled()
    expect(saves.updateProgress).not.toHaveBeenCalled()
    expect(saves.updateChild).not.toHaveBeenCalled()
  })
})
