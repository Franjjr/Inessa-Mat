import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PEN_SEEN_KEY } from '@/ink/constants'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'
import { replayStrokes } from '@/ink/dev/autoplay'
import { fixedElementSize, mockCanvas } from '@/ink/dev/testing'
import { exactStrokes, scaledStrokes, toInk } from '@/ink/cursive/fixtures'
import { joinWord } from '@/ink/cursive/join'
import { fitPauta } from '@/ink/cursive/score'
import { planCaligrafia } from '@/engine/caligrafia/plan'
import { caligrafiaRewardKey, CALIG_STARS } from '@/world/session/logic'
import type { ChildProfile } from '@/types'
import CaligrafiaScreen from './CaligrafiaScreen'

const recordAttempt = vi.fn(async (_attempt: unknown) => {})
const saveMastery = vi.fn(async (_childId: string, _items: unknown[]) => {})
let progress: { stars: number; flags: Record<string, boolean> }
const updateProgress = vi.fn(async (_id: string, fn: (p: typeof progress) => typeof progress) => {
  progress = fn(progress)
  return progress
})
const CHILD = { id: 'c1', name: 'Lucía', grade: 3, settings: { handwriting: true } } as unknown as ChildProfile

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: CHILD, loading: false, setActiveChild() {} }),
  useMastery: () => ({}),
  recordAttempt: (a: unknown) => recordAttempt(a),
  saveMastery: (id: string, items: unknown[]) => saveMastery(id, items),
  updateProgress: (id: string, fn: (p: typeof progress) => typeof progress) => updateProgress(id, fn),
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
  progress = { stars: 5, flags: {} }
  recordAttempt.mockClear()
  saveMastery.mockClear()
  updateProgress.mockClear()
})

function renderScreen() {
  return render(
    <InkProvider recognizer={scriptedRecognizer([])}>
      <MemoryRouter initialEntries={['/play/caligrafia']}>
        <Routes>
          <Route path="/play/caligrafia" element={<CaligrafiaScreen />} />
          <Route path="/play" element={<p>Inicio</p>} />
        </Routes>
      </MemoryRouter>
    </InkProvider>,
  )
}

/** Runs the whole plan of the day: every item written exactly (or scaled for the first one when `firstScaled`). */
async function runPlan(firstScaled = false) {
  const items = planCaligrafia({ childId: CHILD.id, mastery: {}, now: new Date() })
  for (const [i, item] of items.entries()) {
    fireEvent.click(await screen.findByRole('button', { name: '¡A repasar!' }))
    fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
    const fit = fitPauta(W, H, joinWord(item.text).width)
    const strokes = i === 0 && firstScaled ? scaledStrokes(item.text, 1.4) : exactStrokes(item.text)
    act(() => replayStrokes(screen.getByRole('img', { name: /escribir/i }), toInk(strokes, fit)))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  }
  return items
}

describe('CaligrafiaScreen', () => {
  it('records one calig: attempt per item and grants the daily stars once', async () => {
    const items = planCaligrafia({ childId: CHILD.id, mastery: {}, now: new Date() })
    renderScreen()
    await runPlan()
    expect(await screen.findByText('¡Terminado!')).toBeInTheDocument()

    expect(recordAttempt).toHaveBeenCalledTimes(items.length)
    recordAttempt.mock.calls.forEach((call, i) => {
      const a = call[0] as { skill: string; correct: boolean; errorType: unknown; context: { stars: number }; childId: string }
      expect(a.skill).toBe(items[i].skill)
      expect(a.skill.startsWith('calig:')).toBe(true)
      expect(a.correct).toBe(true)
      expect(a.errorType).toBeNull()
      expect(a.context.stars).toBe(3)
      expect(a.childId).toBe(CHILD.id)
    })
    expect(saveMastery).toHaveBeenCalledTimes(items.length)

    const key = caligrafiaRewardKey(new Date())
    expect(progress.stars).toBe(5 + CALIG_STARS)
    expect(progress.flags[key]).toBe(true)
  })

  it('a second finish the same day grants no stars', async () => {
    const { unmount } = renderScreen()
    await runPlan()
    await screen.findByText('¡Terminado!')
    const starsAfterFirst = progress.stars
    unmount()

    renderScreen()
    await runPlan()
    await screen.findByText('¡Terminado!')
    expect(progress.stars).toBe(starsAfterFirst)
  })

  it('a near miss is recorded as wrong with its calig- error type and the stars in the context', async () => {
    renderScreen()
    await runPlan(true)
    await screen.findByText('¡Terminado!')
    const first = recordAttempt.mock.calls[0][0] as { correct: boolean; errorType: string; context: { stars: number } }
    expect(first.correct).toBe(false)
    expect(first.errorType).toMatch(/^calig-/)
    expect(first.context.stars).toBeLessThanOrEqual(2)
    await waitFor(() => expect(recordAttempt).toHaveBeenCalled())
  })
})
