/* The views of the new exercises: the bar (tap a number, then its piece), encuentra el error (verdict, then the column),
   comprobar (verdict and check), and the division methods chosen by the child. The result is never on the screen. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { checkCheckCalc, createRng, genBarProblem, genCheckCalc, genErrorHunt, makeDivision3 } from '@/engine'
import BarProblemView from './BarProblemView'
import ErrorHuntView from './ErrorHuntView'
import CheckCalcView from './CheckCalcView'
import DivisionView from './DivisionView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn(), tap: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

describe('bar problem view', () => {
  it('shows the given numbers as chips, the unknown piece as «?», and never the answer', () => {
    const ex = genBarProblem('add', createRng(3), true)
    const { container } = render(<BarProblemView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    const chips = screen.getAllByRole('button', { name: /^Número \d+$/ })
    expect(chips.length).toBe(ex.bar.filter((b) => b.value !== null).length)
    expect(container.textContent).toContain('?')
    expect(screen.queryByRole('button', { name: new RegExp(`^Número ${ex.answer}$`) })).toBeNull()
    expect(screen.queryByText(String(ex.answer), { exact: true })).toBeNull()
  })

  it('a tapped number goes to its piece, and the check stays disabled until everything is written', () => {
    const ex = genBarProblem('add', createRng(3), true)
    render(<BarProblemView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    const before = screen.getAllByRole('button', { name: /^Número \d+$/ }).length
    const chip = screen.getAllByRole('button', { name: /^Número \d+$/ })[0]
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    const piece = document.querySelector('[data-slot]') as HTMLElement
    fireEvent.click(piece)
    expect(screen.getAllByRole('button', { name: /^Número \d+$/ }).length).toBe(before - 1)
    const check = screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)!
    expect((check as HTMLButtonElement).disabled).toBe(true)
  })

  it('without the drawing there are no chips, but the operation choice is there', () => {
    const ex = genBarProblem('sub', createRng(8), false)
    render(<BarProblemView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.queryByRole('button', { name: /^Número \d+$/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Quitar/ })).toBeTruthy()
  })
})

describe('encuentra el error view', () => {
  it('a calculation is written out; «Hay un error» asks for the column, and the check waits for it', () => {
    const ex = genErrorHunt('add', createRng(4), true)
    render(<ErrorHuntView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.queryByRole('button', { name: /columna de las/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Hay un error/ }))
    expect(screen.getAllByRole('button', { name: /columna de las/ }).length).toBeGreaterThan(1)
    expect((screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)! as HTMLButtonElement).disabled).toBe(true)
  })

  it('«Está bien» on a right calculation is answered at once, with the verdict', () => {
    const ex = genErrorHunt('sub', createRng(6), false)
    const onAnswered = vi.fn()
    render(<ErrorHuntView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Está bien/ }))
    act(() => { fireEvent.click(screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)!) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})

describe('comprobar view', () => {
  it('shows the claim and the check to write; the check waits for the verdict and the value', () => {
    const ex = genCheckCalc('sub', createRng(9), false)
    render(<CheckCalcView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.getByLabelText(`Cuenta: ${ex.left} − ${ex.right} = ${ex.claimed}`)).toBeTruthy()
    expect(screen.getByText(`${ex.claimed} + ${ex.right} = ?`)).toBeTruthy()
    expect((screen.getAllByRole('button', { name: /Comprobar/ }).at(-1)! as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /No está bien/ }))
    expect(screen.getByRole('button', { name: /No está bien/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('the verdict logic of the checker: a true claim with the right check is correct, a false one is not', () => {
    const ok = genCheckCalc('add', createRng(2), true)
    expect(checkCheckCalc(ok, { type: 'verdict', ok: true, value: ok.answer }).correct).toBe(true)
    const bad = genCheckCalc('add', createRng(2), false)
    expect(checkCheckCalc(bad, { type: 'verdict', ok: true, value: bad.answer }).correct).toBe(false)
  })
})

describe('division views by the child\'s method', () => {
  it('repartir por partes shows the parts; the climb shows the rows (for a small quotient)', () => {
    const parts = makeDivision3(384, 4)
    const { unmount } = render(<DivisionView exercise={parts} onAnswered={vi.fn()} divMethod="div-parts" />)
    expect(screen.getByRole('region', { name: 'Repartir por partes' })).toBeTruthy()
    unmount()
    const climb = makeDivision3(28, 4)
    render(<DivisionView exercise={climb} onAnswered={vi.fn()} divMethod="climb" />)
    expect(screen.getByRole('region', { name: 'Multiplicar hacia arriba' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /producto de 4 por 1/ })).toBeTruthy()
  })

  it('climb falls back to the galera when the quotient is too big for the rows', () => {
    render(<DivisionView exercise={makeDivision3(384, 4)} onAnswered={vi.fn()} divMethod="climb" />)
    expect(screen.getByRole('region', { name: 'División en galera' })).toBeTruthy()
  })

  it('la galera sin restas writes no product rows: only the quotient digits and the final remainder', () => {
    render(<DivisionView exercise={makeDivision3(384, 4)} onAnswered={vi.fn()} divMethod="galera-short" />)
    expect(screen.queryByRole('group', { name: /producto/ })).toBeNull()
    expect(screen.getByRole('region', { name: 'División en galera' })).toBeTruthy()
  })

  it('the default galera keeps its product rows', () => {
    render(<DivisionView exercise={makeDivision3(384, 4)} onAnswered={vi.fn()} />)
    expect(screen.getAllByRole('group', { name: /producto/ }).length).toBeGreaterThan(0)
  })
})
