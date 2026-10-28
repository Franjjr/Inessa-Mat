import { act, fireEvent, render, screen } from '@testing-library/react'
import { PEN_SEEN_KEY } from '../constants'
import { InkProvider } from '../InkProvider'
import { scriptedRecognizer } from '../dev/scripted'
import { replayStrokes } from '../dev/autoplay'
import { fixedElementSize, mockCanvas } from '../dev/testing'
import type { CalItem } from '@/content/caligrafia/curriculum'
import { CAL_CURRICULUM } from '@/content/caligrafia/curriculum'
import { stopCelebrations } from '@/fx'
import { TraceCursive } from './TraceCursive'
import { exactStrokes, scaledStrokes, shiftedStrokes, toInk } from './fixtures'
import { joinWord } from './join'
import { fitPauta } from './score'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn(), stopCelebrations: vi.fn() }))
vi.mock('@/art/worlds/StarIcon', () => ({ StarIcon: ({ filled }: { filled?: boolean }) => <i data-testid={filled ? 'star-on' : 'star-off'} /> }))

const W = 640
const H = 380
const LETRA_A: CalItem = { skill: 'calig:letra:a', text: 'a', kind: 'letra', family: 'redondas' }
const PALABRA_SOL: CalItem = { skill: 'calig:palabra:sol', text: 'sol', kind: 'palabra' }

let restore: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(W, H) })
afterAll(() => restore())
beforeEach(() => { localStorage.clear(); localStorage.setItem(PEN_SEEN_KEY, '2026-10-01') })

function setup(item: CalItem = LETRA_A, gender?: 'f' | 'm') {
  const onDone = vi.fn()
  render(
    <InkProvider recognizer={scriptedRecognizer([])}>
      <TraceCursive item={item} onDone={onDone} gender={gender} />
    </InkProvider>,
  )
  const fit = fitPauta(W, H, joinWord(item.text).width)
  const toScreen = (strokes: ReturnType<typeof exactStrokes>, pointerType: 'pen' | 'touch' = 'pen') =>
    toInk(strokes, fit).map((s) => ({ ...s, pointerType }))
  const writeArea = () => screen.getByRole('img', { name: /escribir/i })
  const traceArea = () => screen.getByRole('img', { name: /repasar/i })
  const writeOnce = (strokes: ReturnType<typeof exactStrokes>) => act(() => replayStrokes(writeArea(), toScreen(strokes)))
  const toWrite = () => {
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
  }
  return { onDone, fit, toScreen, traceArea, writeArea, writeOnce, toWrite }
}

describe('TraceCursive', () => {
  it('goes Mirar → Repasar → Escribir solo (masculine when the gender is unknown)', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Mira' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    expect(screen.getByRole('heading', { name: 'Repasa' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
    expect(screen.getByRole('heading', { name: 'Escribe solo' })).toBeInTheDocument()
  })

  it('the writing step says «Escribe sola» for a girl and «Escribe solo» for a boy or when the gender is unknown', () => {
    setup(LETRA_A, 'f')
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
    expect(screen.getByRole('heading', { name: 'Escribe sola' })).toBeInTheDocument()
  })

  it('the writing step says «Escribe solo» for a boy', () => {
    setup(LETRA_A, 'm')
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
    expect(screen.getByRole('heading', { name: 'Escribe solo' })).toBeInTheDocument()
  })

  it('a try made with a mouse (no pen stroke) asks for the pen and is not scored', () => {
    const { toScreen, writeArea, toWrite } = setup()
    toWrite()
    act(() => replayStrokes(writeArea(), toScreen(exactStrokes('a'), 'touch').map((st) => ({ ...st, pointerType: 'mouse' as const }))))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.getByRole('status')).toHaveTextContent('¡Escribe con el lápiz!')
    expect(screen.queryAllByTestId('star-on')).toHaveLength(0)
  })

  it('the time of an attempt counts from the writing step, not from the model', () => {
    const now = vi.spyOn(Date, 'now')
    const { onDone, writeOnce } = setup()
    now.mockReturnValue(1_000)
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    now.mockReturnValue(9_000)
    fireEvent.click(screen.getByRole('button', { name: '¡A escribir!' }))
    now.mockReturnValue(11_500)
    writeOnce(exactStrokes('a'))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ ms: 2_500 }))
    now.mockRestore()
  })

  it('a celebration stops when the item moves on to the next step', () => {
    vi.mocked(stopCelebrations).mockClear()
    setup()
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    expect(stopCelebrations).toHaveBeenCalled()
  })

  it('the exact fixture written alone earns 3 stars', () => {
    const { writeOnce, toWrite } = setup()
    toWrite()
    writeOnce(exactStrokes('a'))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.getAllByTestId('star-on')).toHaveLength(3)
  })

  it('a scaled letter shows at most 2 stars and the size tip', () => {
    const { writeOnce, toWrite } = setup()
    toWrite()
    writeOnce(scaledStrokes('a', 1.4))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.getAllByTestId('star-on').length).toBeLessThanOrEqual(2)
    expect(screen.getByText(/muy grande/)).toBeInTheDocument()
  })

  it('a touch stroke is ignored (palm), the pen writing still scores 3 stars', () => {
    const { toScreen, writeArea, toWrite } = setup()
    toWrite()
    const palm = toScreen(shiftedStrokes(exactStrokes('a'), 10), 'touch')
    act(() => replayStrokes(writeArea(), [...toScreen(exactStrokes('a')), ...palm]))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.getAllByTestId('star-on')).toHaveLength(3)
  })

  it('a finger touching down in the middle of a pen stroke does not break it (palm)', () => {
    const { toScreen, writeArea, toWrite } = setup()
    toWrite()
    const area = writeArea()
    const pts = toScreen(exactStrokes('a'))[0].points
    const half = Math.floor(pts.length / 2)
    const at = (el: Element, type: string, p: { x: number; y: number }, pointerType: string, pointerId: number, buttons: number) => {
      const r = el.getBoundingClientRect()
      el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true, pointerId, pointerType, isPrimary: true,
        pressure: buttons ? 0.5 : 0, buttons, button: type === 'pointermove' ? -1 : 0,
        clientX: r.left + p.x, clientY: r.top + p.y,
      }))
    }
    act(() => {
      pts.slice(0, half).forEach((p, i) => at(area, i === 0 ? 'pointerdown' : 'pointermove', p, 'pen', 41, 1))
      at(area, 'pointerdown', { x: 5, y: 5 }, 'touch', 42, 1)
      at(area, 'pointermove', { x: 60, y: 5 }, 'touch', 42, 1)
      at(area, 'pointerup', { x: 60, y: 5 }, 'touch', 42, 0)
      pts.slice(half).forEach((p) => at(area, 'pointermove', p, 'pen', 41, 1))
      const last = pts[pts.length - 1]
      at(area, 'pointerup', last, 'pen', 41, 0)
    })
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.getAllByTestId('star-on')).toHaveLength(3)
  })

  it('a reversed stroke in Repasar shows «Al revés: sigue la flecha»', () => {
    const { toScreen, traceArea } = setup()
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    const reversed = exactStrokes('a').map((st) => [...st].reverse())
    act(() => replayStrokes(traceArea(), toScreen(reversed)))
    expect(screen.getByRole('status')).toHaveTextContent('Al revés: sigue la flecha')
  })

  it('a stroke far off the model in Repasar shows «Te has salido»', () => {
    const { toScreen, traceArea } = setup()
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    act(() => replayStrokes(traceArea(), toScreen(shiftedStrokes(exactStrokes('a'), 30))))
    expect(screen.getByRole('status')).toHaveTextContent('Te has salido: vuelve a la línea gris')
  })

  it('a stroke that wandered off and came back shows «Te has salido» only while it is off', () => {
    const { toScreen, traceArea } = setup()
    fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
    // The model's stroke, with a middle part pushed 30 units below the baseline (where no part of «a» lies: pushed up it
    // would land on the bowl's own top, which is on the line, not off it); the stroke ends back on the line.
    const [first, ...rest] = exactStrokes('a')
    const wander = first.map((p, i) => (i >= 8 && i <= 14 ? { x: p.x, y: p.y + 30 } : p))
    act(() => replayStrokes(traceArea(), toScreen([wander, ...rest])))
    expect(screen.getByRole('status')).toHaveTextContent('Repasa la línea gris con el lápiz')
  })

  it('the exact model of every curriculum item, traced in Repasar, raises no notice', () => {
    for (const item of CAL_CURRICULUM) {
      const onDone = vi.fn()
      const { unmount } = render(
        <InkProvider recognizer={scriptedRecognizer([])}>
          <TraceCursive item={item} onDone={onDone} />
        </InkProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: '¡A repasar!' }))
      const fit = fitPauta(W, H, joinWord(item.text).width)
      act(() => replayStrokes(screen.getByRole('img', { name: /repasar/i }), toInk(exactStrokes(item.text), fit)))
      expect(screen.getByRole('status'), item.text).toHaveTextContent('Repasa la línea gris con el lápiz')
      unmount()
    }
  })

  it('a letter has two tries: the best one is reported with the tries used', () => {
    const { onDone, writeOnce, toWrite } = setup()
    toWrite()
    writeOnce(scaledStrokes('a', 1.4))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    fireEvent.click(screen.getByRole('button', { name: 'Otra vez' }))
    writeOnce(exactStrokes('a'))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.queryByRole('button', { name: 'Otra vez' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onDone).toHaveBeenCalledWith({ score: expect.objectContaining({ stars: 3 }), tries: 2, ms: expect.any(Number) })
  })

  it('a word has one try only', () => {
    const { writeOnce, toWrite } = setup(PALABRA_SOL)
    toWrite()
    writeOnce(exactStrokes('sol'))
    fireEvent.click(screen.getByRole('button', { name: '¡Listo!' }))
    expect(screen.queryByRole('button', { name: 'Otra vez' })).toBeNull()
  })
})
