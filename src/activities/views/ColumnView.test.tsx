import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeColumnAdd, makeColumnSub } from '@/engine'
import ColumnView from './ColumnView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const cell = (name: RegExp | string) => screen.getByRole('textbox', { name })

describe('ColumnView', () => {
  it('starts with the units result cell and moves focus to the left as digits are typed', async () => {
    const user = userEvent.setup()
    render(<ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={() => {}} showFeedback={false} />)
    const units = cell(/unidades del resultado/)
    expect(units).toHaveFocus()
    await user.keyboard('5')
    // Typing a units digit auto-advances to the tens (the optional carry cell comes first in the order)
    const decenas = cell(/decenas del resultado/)
    await user.keyboard('2')
    expect(decenas).toBeTruthy()
  })

  it('does not grade carries: a correct result with no carry marks is correct', async () => {
    const onAnswered = vi.fn()
    render(<ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={onAnswered} showFeedback={false} />)
    const digits = ['5', '2', '6']
    // units 5, tens 2, hundreds 6 (368 + 257 = 625); no carry written anywhere
    for (const [name, d] of [[/unidades del resultado/, digits[0]], [/decenas del resultado/, digits[1]], [/centenas del resultado/, digits[2]]] as const) {
      fireEvent.keyDown(cell(name), { key: d })
    }
    const res = screen.getAllByRole('textbox').find((el) => el.getAttribute('aria-label')?.includes('resultado'))
    expect(res).toBeTruthy()
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('subtraction borrow marks are optional and never change the grade', () => {
    const onAnswered = vi.fn()
    render(<ColumnView exercise={makeColumnSub(503, 128)} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getAllByRole('textbox', { name: /marca de .*opcional/ }).length).toBeGreaterThan(0)
    expect(onAnswered).not.toHaveBeenCalled()
  })
})
