/* The grow decision of a try step: TrySlot asks the lesson to grow (onOverflow) only when the exercise is still taller than the
   board at its smallest scale (MIN_FIT_SCALE). jsdom has no layout, so the board, the exercise and the footer are sized here. */
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { SkillSelector } from '@/types'
import TrySlot from './TrySlot'

vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const fake = await import('./testing/FakeExerciseView')
  return { ExerciseView: fake.FakeExerciseView, useActivityHost: host.useActivityHost }
})

const selector: SkillSelector = { kinds: ['fact-mul'], tables: [2], factorRange: [2, 5] }

/** The sizes of one render: the board's inner height (the wrap's clientHeight), the exercise's natural height. */
interface Sizes { board: number; natural: number }

const originals = {
  clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
  offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
}

function sizeBoard({ board, natural }: Sizes) {
  // The wrap is the element with data-status; the exercise is the one drawn with a scale transform; the footer has no size.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) { return this.hasAttribute('data-status') ? board : 0 },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) { return this.style.transform.startsWith('scale(') ? natural : 0 },
  })
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
    if (desc) Object.defineProperty(HTMLElement.prototype, name, desc)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
  }
})

describe('TrySlot: the lesson grows for a try that does not fit the board', () => {
  it('asks the lesson to grow when the exercise is taller than the board even at the smallest scale', () => {
    // 700 px of exercise on a 400 px board: 0.8 × 700 = 560 px, still taller than the board.
    const onOverflow = renderTry({ board: 400, natural: 700 })
    expect(onOverflow).toHaveBeenCalled()
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
})
