/* Division in the galera, closing round: the digits of a number are typed like a calculator, the words of the galera
   are named (explained the first time), the question of the step sits in a bubble, and «Inténtalo otra vez» starts with
   what she wrote and marks what was wrong. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeDivision } from '@/engine'
import type { DivisionExercise } from '@/types'
import DivisionView from './DivisionView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const key = (name: RegExp | string, k: string) => act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name }), { key: k }) })
const box = (name: RegExp | string) => screen.getByRole('textbox', { name })
/** The digit written in a box ('' when empty). */
const digit = (name: RegExp | string) => box(name).closest('[data-value]')?.getAttribute('data-value') ?? ''
const isWrong = (name: RegExp | string) => box(name).getAttribute('aria-invalid') === 'true'
const wide: DivisionExercise = { id: 'division:583/23', kind: 'division', skill: 'div:3x2:rem', difficulty: 6, dividend: 583, divisor: 23, quotient: 25, remainder: 8, variant: 'rem' }

beforeEach(() => { try { window.localStorage.clear() } catch { /* no storage */ } })

describe('DivisionView: layout and keys', () => {
  it('lives in the exercise layout: statement on top, one «Comprobar» in the answer bar', () => {
    const { container } = render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} />)
    expect(container.querySelector('.ex-layout .ex-prompt')?.textContent).toBe('Reparte 84 entre 4.')
    expect(within(screen.getByRole('group', { name: 'Respuesta' })).getAllByRole('button', { name: /Comprobar/ })).toHaveLength(1)
  })

  it('the digits of a remainder are typed like a calculator (units first, pushed to the left)', () => {
    render(<DivisionView exercise={wide} onAnswered={vi.fn()} />)
    key(/^cociente, cifra 1$/, '2')
    key(/^resto del paso 1$/, '1')
    key(/^resto del paso 1$/, '2')
    expect(digit(/^resto del paso 1, decenas$/)).toBe('1')
    expect(digit(/^resto del paso 1$/)).toBe('2')
  })

  it('a written quotient digit is replaced, not started again, when she types over it', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} />)
    key(/cociente, cifra 1/, '2')
    key(/resto del paso 1/, '0')
    key(/cociente, cifra 2/, '1')
    key(/cociente, cifra 2/, '5')
    expect(digit(/cociente, cifra 1/)).toBe('2')
    expect(digit(/cociente, cifra 2/)).toBe('5')
  })
})

/** Types digits on whatever has the focus, like a child with the keyboard. */
const typeOnFocus = (...keys: string[]) => keys.forEach((k) => act(() => { fireEvent.keyDown(document.activeElement as Element, { key: k }) }))

describe('DivisionView: typing the answer in one go', () => {
  it('without subtractions «1, 2, 0» is a quotient of 12 and a remainder of 0 (96 ÷ 8)', () => {
    render(<DivisionView exercise={makeDivision(96, 8)} onAnswered={vi.fn()} divMethod="galera-short" />)
    typeOnFocus('1', '2', '0')
    expect(digit(/cociente, cifra 1/)).toBe('1')
    expect(digit(/cociente, cifra 2/)).toBe('2')
    expect(digit(/^resto/)).toBe('0')
  })

  it('with subtractions «2, 0, 1, 0» is 21 with its remainders (84 ÷ 4 → 21)', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} />)
    typeOnFocus('2', '0', '2', '0')
    expect(digit(/cociente, cifra 1/)).toBe('2')
    expect(digit(/cociente, cifra 2/)).toBe('2')
  })

  it('a remainder of one digit that cannot grow moves on to the next quotient digit (990 ÷ 90)', () => {
    render(<DivisionView exercise={makeDivision(990, 90)} onAnswered={vi.fn()} />)
    typeOnFocus('1', '9', '1', '0')
    expect(digit(/cociente, cifra 1/)).toBe('1')
    expect(digit(/cociente, cifra 2/)).toBe('1')
    expect(digit(/^resto del paso 1, decenas$/)).toBe('')
    expect(digit(/^resto del paso 1$/)).toBe('9')
  })
})

describe('DivisionView: the words of the galera', () => {
  it('the first time the four words come with what they mean; once she has checked one, only the words', () => {
    const first = render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} />)
    const legend = screen.getByLabelText('Palabras de la división')
    expect(legend.textContent).toContain('lo que le toca a cada uno')
    expect(legend.textContent).toContain('lo que sobra')
    key(/cociente, cifra 1/, '2'); key(/resto del paso 1/, '0'); key(/cociente, cifra 2/, '1'); key(/resto del paso 2/, '0')
    act(() => { fireEvent.click(within(screen.getByRole('group', { name: 'Respuesta' })).getByRole('button', { name: /Comprobar/ })) })
    first.unmount()
    render(<DivisionView exercise={makeDivision(96, 4)} onAnswered={vi.fn()} />)
    const again = screen.getByLabelText('Palabras de la división')
    expect(again.textContent).not.toContain('lo que sobra')
    expect(again.textContent).toContain('resto')
  })
})

describe('DivisionView: the question of the step', () => {
  it('a bubble asks the question of the active step and moves on with the next step', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} />)
    expect(screen.getByTestId('galera-ask').textContent).toBe('¿Cuántas veces cabe el 4 en 8?')
    key(/cociente, cifra 1/, '2')
    key(/resto del paso 1/, '0')
    expect(screen.getByTestId('galera-ask').textContent).toBe('Baja el 4. ¿Cuántas veces cabe el 4 en 4?')
  })
})

describe('DivisionView: «Inténtalo otra vez»', () => {
  it('starts with the quotient and the remainder she wrote and marks the digits that were wrong', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} initialAnswer={{ type: 'division', quotient: 25, remainder: 0 }} />)
    expect(digit(/cociente, cifra 1/)).toBe('2')
    expect(digit(/cociente, cifra 2/)).toBe('5')
    expect(isWrong(/cociente, cifra 1/)).toBe(false)
    expect(isWrong(/cociente, cifra 2/)).toBe(true)
  })

  it('a digit stops being marked as soon as she changes it', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} initialAnswer={{ type: 'division', quotient: 25, remainder: 0 }} />)
    key(/cociente, cifra 2/, '1')
    expect(isWrong(/cociente, cifra 2/)).toBe(false)
  })

  it('wrongColumns names the steps to mark', () => {
    render(<DivisionView exercise={makeDivision(84, 4)} onAnswered={vi.fn()} initialAnswer={{ type: 'division', quotient: 21, remainder: 0 }} wrongColumns={[0]} />)
    expect(isWrong(/cociente, cifra 1/)).toBe(true)
  })
})
