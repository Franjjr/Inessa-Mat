/* The grow decision of a try step: TrySlot asks the lesson to grow (onOverflow) only when the exercise is taller than the board at
   its smallest scale AND «Comprobar» would be out of reach without growing (below the board or below the window). jsdom has no
   layout, so the board, the exercise, «Comprobar» and the window are sized here. */
import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { SkillSelector } from '@/types'
import TrySlot from './TrySlot'

vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  // The exercise's answer bar: a «Comprobar» button (its position is set per render through the sizes). A tap answers wrong,
  // which makes the footer show «Inténtalo otra vez».
  const ExerciseView = (props: { onAnswered?: (o: unknown) => void }) => createElement('div', { 'data-testid': 'fake-exercise' },
    createElement('button', { type: 'button', onClick: () => props.onAnswered?.({ check: { correct: false, given: '1', expected: '2' }, ms: 1, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0 }) }, '✓ Comprobar'))
  return { ExerciseView, useActivityHost: host.useActivityHost }
})

const selector: SkillSelector = { kinds: ['fact-mul'], tables: [2], factorRange: [2, 5] }

/** The footer under the exercise (its status line, and «Inténtalo otra vez» after a miss), in the page's coordinates. */
interface FooterSizes {
  /** The footer's offset height (the space it takes in the board). */
  height: number
  top: number
  bottom: number
  /** «Inténtalo otra vez» (the footer's button). */
  button: { top: number; bottom: number }
}

interface Sizes {
  /** The board's inner height (the wrap's clientHeight). */
  board: number
  /** The exercise's natural height (unscaled). */
  natural: number
  /** Unscaled bottom of «Comprobar» inside the exercise. Default: the exercise's bottom. */
  comprobar?: number
  /** The window's height. Default: tall enough not to matter. */
  window?: number
  /** The footer, when the test needs its controls. Default: no footer space and no footer control. */
  footer?: FooterSizes
}

const originals = {
  clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
  offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
  getBoundingClientRect: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getBoundingClientRect'),
  innerHeight: Object.getOwnPropertyDescriptor(window, 'innerHeight'),
}

const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 0, x: 0, y: top, width: 0, height: bottom - top, toJSON() { return this } })

/** The scale the exercise is drawn with (the inline transform TrySlot sets). */
function scaleOf(el: HTMLElement): number {
  const inner = el.closest<HTMLElement>('div[style*="scale("]')
  return inner ? parseFloat(inner.style.transform.slice(6)) : 1
}

function sizeBoard({ board, natural, comprobar, window: windowHeight, footer }: Sizes) {
  // The wrap is the element with data-status; the exercise is the one drawn with a scale transform; the footer has no size.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) { return this.hasAttribute('data-status') ? board : 0 },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      if (footer && this.getAttribute('role') === 'status') return footer.height
      return this.style.transform.startsWith('scale(') ? natural : 0
    },
  })
  // Positions: the wrap spans the board from the top of the page; the exercise's top stays put when it is scaled (top centre);
  // «Comprobar» is drawn at its unscaled bottom times the current scale.
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value(this: HTMLElement) {
      if (this.hasAttribute('data-status')) return rect(0, board)
      if (footer && this.getAttribute('role') === 'status') return rect(footer.top, footer.bottom)
      if (footer && this.tagName === 'BUTTON' && this.closest('[role="status"]')) return rect(footer.button.top, footer.button.bottom)
      if (this.style.transform.startsWith('scale(')) return rect(0, natural * scaleOf(this))
      if (this.tagName === 'BUTTON') return rect(0, (comprobar ?? natural) * scaleOf(this))
      return rect(0, 0)
    },
  })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: windowHeight ?? 10000 })
}

function renderTry(sizes: Sizes, extra: { grown?: boolean; onOverflow?: () => void } = {}) {
  sizeBoard(sizes)
  const onOverflow = extra.onOverflow ?? vi.fn()
  render(
    <ActivityHostProvider value={defaultActivityHost}>
      <TrySlot selector={selector} seedKey="grow-test" onSettled={() => undefined} settled={undefined} allowHints grown={extra.grown} onOverflow={onOverflow} />
    </ActivityHostProvider>,
  )
  return onOverflow
}

beforeEach(() => {
  // Padding and the row gap are read from the computed style; jsdom has no layout, so both are zero.
  vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({ paddingTop: '0px', paddingBottom: '0px', rowGap: '0px' }) as unknown as CSSStyleDeclaration)
})

afterEach(() => {
  vi.restoreAllMocks()
  for (const [name, desc] of Object.entries(originals)) {
    if (name === 'innerHeight') {
      if (desc) Object.defineProperty(window, name, desc)
    } else if (name === 'getBoundingClientRect') {
      if (desc) Object.defineProperty(HTMLElement.prototype, name, desc)
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
    } else if (desc) Object.defineProperty(HTMLElement.prototype, name, desc)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
  }
})

/** Renders a try, answers it wrong (the footer shows «Inténtalo otra vez»), and returns the onOverflow mock. */
function renderMissed(sizes: Sizes) {
  sizeBoard(sizes)
  const onOverflow = vi.fn()
  const { getByText } = render(
    <ActivityHostProvider value={defaultActivityHost}>
      <TrySlot selector={selector} seedKey="grow-test" onSettled={() => undefined} settled={undefined} allowHints onOverflow={onOverflow} />
    </ActivityHostProvider>,
  )
  fireEvent.click(getByText('✓ Comprobar'))
  expect(getByText('Inténtalo otra vez')).toBeTruthy()
  return onOverflow
}

describe('TrySlot: the lesson grows for a try whose «Comprobar» would be out of reach', () => {
  it('asks the lesson to grow when the exercise is taller than the board even at the smallest scale', () => {
    // 700 px of exercise on a 400 px board: 0.8 × 700 = 560 px, and «Comprobar» at the bottom is out of the board.
    expect(renderTry({ board: 400, natural: 700 })).toHaveBeenCalled()
  })

  it('does not ask when the exercise fits the board at a scale of at least the smallest one', () => {
    // 450 px on 400 px: it is shrunk to 0.89 and fits, so the lesson keeps its size.
    expect(renderTry({ board: 400, natural: 450 })).not.toHaveBeenCalled()
  })

  it('does not ask when the exercise fits exactly at the smallest scale', () => {
    // 500 px on 400 px: 0.8 × 500 = 400 px, the board's height.
    expect(renderTry({ board: 400, natural: 500 })).not.toHaveBeenCalled()
  })

  it('does not ask again once the lesson has grown to hold the try', () => {
    expect(renderTry({ board: 400, natural: 700 }, { grown: true })).not.toHaveBeenCalled()
  })

  it('does not ask when the exercise overflows the board but «Comprobar» is reachable inside it (a maths try at 1000 × 490)', () => {
    // 700 px of exercise, but «Comprobar» sits at 300 px: at 0.8 it is at 240 px, inside the 400 px board. The rest scrolls.
    expect(renderTry({ board: 400, natural: 700, comprobar: 300 })).not.toHaveBeenCalled()
  })

  it('asks when «Comprobar» is below the board even though the exercise above it fits', () => {
    // «Comprobar» at 600 px: at 0.8 it is at 480 px, below the 400 px board.
    expect(renderTry({ board: 400, natural: 1000, comprobar: 600 })).toHaveBeenCalled()
  })

  it('asks when «Comprobar» is inside the board but below the window', () => {
    // «Comprobar» at 350 px: at 0.8 it is at 280 px, inside the 400 px board, but the window ends at 250 px.
    expect(renderTry({ board: 400, natural: 700, comprobar: 350, window: 250 })).toHaveBeenCalled()
  })

  it('asks after a miss when «Inténtalo otra vez» under the try is out of reach (the footer control counts)', () => {
    // 380 px of exercise on a 400 px board with a 120 px footer: 280 px left, so the exercise is shrunk to 0.8 (304 px) and «Comprobar»
    // sits at 304 px. Once missed, the footer's button is 100 px below the exercise's bottom: 404 px, below the 400 px board.
    // Before the miss the footer has no control yet: the try is reachable, so the lesson does not grow.
    const footer = { height: 120, top: 200, bottom: 320, button: { top: 260, bottom: 300 } }
    expect(renderTry({ board: 400, natural: 380, footer })).not.toHaveBeenCalled()
  })

  it('does not ask when «Inténtalo otra vez» is inside the board and the window', () => {
    const footer = { height: 120, top: 200, bottom: 320, button: { top: 200, bottom: 220 } }
    expect(renderMissed({ board: 400, natural: 380, footer })).not.toHaveBeenCalled()
  })

  it('asks after a miss when «Inténtalo otra vez» is below the board', () => {
    const footer = { height: 120, top: 200, bottom: 320, button: { top: 260, bottom: 300 } }
    expect(renderMissed({ board: 400, natural: 380, footer })).toHaveBeenCalled()
  })
})
