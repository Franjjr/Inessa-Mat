/* P6-09: un solo aviso «¿Sin lápiz? ¡Toca aquí!» por pantalla. En la descomposición de 4 325 (cuatro casillas), un dedo
   que intenta escribir en cada casilla, con un lápiz usado hace poco en este aparato, deja como mucho un aviso. */
import { act, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makePlaceValue } from '@/engine/numeric'
import PlaceValueView from '@/activities/views/PlaceValueView'
import { PEN_SEEN_KEY } from '../constants'
import { InkProvider } from '../InkProvider'
import { NUDGE_TEXT } from '../Nudge'
import { notePenContact } from '../policy'
import { scriptedRecognizer } from '../dev/scripted'
import { replayStrokes } from '../dev/autoplay'
import { asTablet, fixedElementSize, mockCanvas } from '../dev/testing'
import { handwriteNumber } from '../fixtures'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}), stop: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

let restore: () => void
let restoreTablet: () => void
beforeAll(() => { mockCanvas(); restore = fixedElementSize(320, 120); restoreTablet = asTablet() })
afterAll(() => { restore(); restoreTablet() })
beforeEach(() => { vi.useFakeTimers(); localStorage.setItem(PEN_SEEN_KEY, '2026-10-01') })
afterEach(() => { vi.useRealTimers(); localStorage.clear() })

describe('el aviso del lápiz perdido, en una pantalla con varias casillas', () => {
  it('en PlaceValueView con 4 casillas hay como máximo un aviso', () => {
    render(
      <InkProvider recognizer={scriptedRecognizer([])}>
        <PlaceValueView exercise={makePlaceValue(4325, 'expanded')} onAnswered={vi.fn()} />
      </InkProvider>,
    )
    const boxes = screen.getAllByRole('textbox', { name: /^Valor de/ })
    expect(boxes.length).toBe(4)
    notePenContact(false, performance.now() - 10_000)
    for (const box of boxes) {
      act(() => replayStrokes(box, handwriteNumber('4', { x: 40, y: 0, w: 100, h: 120 }, { pointerType: 'touch' })))
    }
    expect(screen.getAllByText(NUDGE_TEXT).length).toBeLessThanOrEqual(1)
    expect(screen.getAllByText(NUDGE_TEXT)).toHaveLength(1) // the finger was told once, on the last box it tried
  })
})
