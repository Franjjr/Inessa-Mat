/* 3.º ordinales view: the row taps the n-th from the exit, read and write send the option picked. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, genOrdinal, ordinalNumeral, ordinalWord } from '@/engine'
import type { OrdinalExercise } from '@/types'
import OrdinalView from './OrdinalView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/ink', () => ({
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

const comprobar = () => screen.getByRole('button', { name: /Comprobar/ })
const ofMode = (mode: OrdinalExercise['mode'], top: 10 | 20 | 30): OrdinalExercise => {
  for (let seed = 1; ; seed++) {
    const ex = genOrdinal(createRng(seed), top)
    if (ex.mode === mode) return ex
  }
}

describe('OrdinalView', () => {
  it('row: the n-th counted from the exit is correct; another place is not', () => {
    const ex = ofMode('row', 10)
    const onAnswered = vi.fn()
    render(<OrdinalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(`Toca el ${ordinalWord(ex.n)}`)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /^Lugar \d+$/ })).toHaveLength(ex.items.length)
    fireEvent.click(screen.getByRole('button', { name: `Lugar ${ex.n}` }))
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('row: a wrong place is graded as wrong', () => {
    const ex = ofMode('row', 10)
    const onAnswered = vi.fn()
    render(<OrdinalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    const other = ex.n === 1 ? 2 : 1
    fireEvent.click(screen.getByRole('button', { name: `Lugar ${other}` }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('read: the numeral is shown and the word picked is graded', () => {
    const ex = ofMode('read', 30)
    const onAnswered = vi.fn()
    render(<OrdinalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(`¿Cómo se dice el ${ordinalNumeral(ex.n)}?`)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.options[ex.answer] }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('write: the word is shown and the numeral picked is graded', () => {
    const ex = ofMode('write', 30)
    const onAnswered = vi.fn()
    render(<OrdinalView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    expect(screen.getByText(`¿Qué número es «${ordinalWord(ex.n)}»?`)).toBeTruthy()
    const wrong = ex.options.find((_, i) => i !== ex.answer) as string
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })
})
