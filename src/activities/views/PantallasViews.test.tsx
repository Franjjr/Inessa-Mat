/* Every exercise screen explains itself (P3PE-06, P3PE-13, P3PE-17, H8): the one statement style, the names on the
   columns and rows, and the texts the audit asked for. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeClockSet, makeColumnAdd, makeColumnSub, makeLongMul } from '@/engine'
import { makeCalendarUnits } from '@/engine/clock'
import type { EquationExercise } from '@/types'
import CalendarView, { howMany } from './CalendarView'
import ClockSetView from './ClockSetView'
import ColumnView, { columnAuxCaption, columnPrompt } from './ColumnView'
import EquationView from './EquationView'
import { ExerciseLayout, followShift, scaledBox } from './ExerciseLayout'
import LongMulView, { partialLabel } from './LongMulView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

describe('ExerciseLayout (P3PE-06)', () => {
  it('one statement style: .ex-prompt (and .ex-prompt-sub), first in the screen, then the work, then the answer bar', () => {
    const { container } = render(
      <ExerciseLayout prompt="¿Qué figura es?" sub="Toca una." actions={<button type="button">✓ Comprobar</button>} aria-label="Prueba">
        <p>trabajo</p>
      </ExerciseLayout>,
    )
    const section = screen.getByRole('region', { name: 'Prueba' })
    expect(section.firstElementChild?.querySelector('.ex-prompt')?.textContent).toBe('¿Qué figura es?')
    expect(container.querySelector('.ex-prompt-sub')?.textContent).toBe('Toca una.')
    const parts = [...section.children].map((c) => c.className)
    expect(parts).toEqual(['ex-head', 'ex-work', 'ex-actions'])
  })
})

describe('the answer bar follows the window on a short screen (P3PE-01)', () => {
  it('in view: it stays where it is', () => {
    expect(followShift(120, 60, 400, 0.7)).toBe(0)
  })
  it('gone above the window: it comes down to 8 px from the top, in its own (unscaled) pixels', () => {
    expect(followShift(-62, 60, 400, 0.7)).toBeCloseTo(70 / 0.7, 5)
  })
  it('never further down than the end of its section, unless that is the only way to see it', () => {
    expect(followShift(-20, 60, 60, 1)).toBe(28)
    expect(followShift(-200, 60, -100, 1)).toBe(208)
  })
  it('the scaled box it watches: FitToScreen\'s inner box, or a lesson\'s box drawn with transform: scale', () => {
    const fit = document.createElement('div')
    fit.setAttribute('data-fit-inner', '')
    const lesson = document.createElement('div')
    lesson.style.transform = 'scale(0.8)'
    const plain = document.createElement('div')
    const a = document.createElement('section')
    const b = document.createElement('section')
    const c = document.createElement('section')
    fit.appendChild(document.createElement('div')).appendChild(a)
    lesson.appendChild(b)
    plain.appendChild(c)
    expect(scaledBox(a)).toBe(fit)
    expect(scaledBox(b)).toBe(lesson)
    expect(scaledBox(c)).toBeNull()
  })
})

describe('column calculations explain themselves (P3PE-13)', () => {
  it('the names of the columns are always on top, whole words', () => {
    const { container } = render(<ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={() => {}} showFeedback={false} />)
    for (const name of ['unidades', 'decenas', 'centenas']) expect(screen.getByText(name)).toBeTruthy()
    expect(container.querySelector('[data-aux-caption]')?.textContent).toBe('Las casillas pequeñas de arriba: aquí apunta la que te llevas (si hace falta).')
  })

  it('the subtraction statement says where to start and what to do when the top digit is smaller', () => {
    expect(columnPrompt('column-sub', 'borrow')).toMatchInlineSnapshot(`"Resta en columna. Empieza por la derecha, por las unidades. Si arriba hay menos que abajo, pide 1 a la vecina."`)
    expect(columnPrompt('column-sub', 'carry')).toMatchInlineSnapshot(`"Resta en columna. Empieza por la derecha, por las unidades. Si arriba hay menos que abajo, pon un 1 delante y me llevo una abajo."`)
    expect(columnAuxCaption('column-sub', 'carry')).toMatch(/^Las casillas pequeñas de abajo/)
    const { container } = render(<ColumnView exercise={makeColumnSub(704, 258)} onAnswered={() => {}} showFeedback={false} method="borrow" />)
    expect(container.querySelector('.ex-prompt')?.textContent).toBe(columnPrompt('column-sub', 'borrow'))
  })

  it('the result is typed units first: an arrow «←» sits over the cell that types next (column and long multiplication)', () => {
    const { unmount } = render(<ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={() => {}} showFeedback={false} />)
    act(() => { screen.getByRole('textbox', { name: /unidades del resultado/ }).focus() })
    expect(screen.getAllByTestId('column-arrow').length).toBe(1)
    unmount()
    render(<LongMulView exercise={makeLongMul(38, 74)} onAnswered={() => {}} showFeedback={false} />)
    act(() => { screen.getAllByRole('textbox').find((b) => b.closest('[data-row-label]') === null && /unidades/.test(b.getAttribute('aria-label') ?? ''))!.focus() })
    expect(screen.getAllByTestId('column-arrow').length).toBe(1)
  })

  it('after a wrong subtraction there is one message only (no second bubble), and it teaches the borrowing', () => {
    // 742 − 258 = 484; the child writes 494: the decenas did not give back the ten they lent.
    const write = (ex: ReturnType<typeof makeColumnSub>, digits: [string, string, string]) => {
      const { container, unmount } = render(<ColumnView exercise={ex} onAnswered={() => {}} method="borrow" />)
      const cell = (name: RegExp) => screen.getByRole('textbox', { name })
      fireEvent.keyDown(cell(/unidades del resultado/), { key: digits[0] })
      fireEvent.keyDown(cell(/decenas del resultado/), { key: digits[1] })
      fireEvent.keyDown(cell(/centenas del resultado/), { key: digits[2] })
      act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
      const bubbles = [...container.querySelectorAll('[aria-live="polite"] p')].map((p) => p.textContent ?? '')
      unmount()
      return bubbles
    }
    const tens = write(makeColumnSub(742, 258), ['4', '9', '4'])
    expect(tens.length).toBe(1)
    expect(tens[0]).toMatch(/vecina/)
    // 528 − 143 = 385; the child writes 485: the lender is the centenas, and the message names it.
    const hundreds = write(makeColumnSub(528, 143), ['5', '8', '4'])
    expect(hundreds.length).toBe(1)
    expect(hundreds[0]).toMatch(/centena/)
  })

  it('long multiplication: each row says what it is («38 × 4 =», «38 × 70 =», «suma») and the columns are named', () => {
    const { container } = render(<LongMulView exercise={makeLongMul(38, 74)} onAnswered={() => {}} showFeedback={false} />)
    const labels = [...container.querySelectorAll('[data-row-label]')].map((e) => e.textContent)
    expect(labels).toEqual(['38 × 4 =', '38 × 70 =', 'suma'])
    expect(partialLabel(213, 5, 1)).toBe('213 × 50 =')
    expect(screen.getByText('unidades')).toBeTruthy()
  })
})

describe('texts of the screens (P3PE-17)', () => {
  it('calendar: the card asks «¿cuántos segundos?», never a bare «¿?»', () => {
    expect(howMany('segundos')).toBe('¿cuántos segundos?')
    expect(howMany('horas')).toBe('¿cuántas horas?')
    const { container } = render(<CalendarView exercise={makeCalendarUnits({ from: 'minuto', to: 'segundos', amount: 7, answer: 420, prompt: '¿Cuántos segundos son 7 minutos?' })} onAnswered={() => {}} showFeedback={false} />)
    expect(container.textContent).toContain('¿cuántos segundos?')
    expect(container.textContent).not.toContain('¿? ')
  })

  it('equation, same or not: «¿Valen lo mismo los dos lados? Toca = si valen lo mismo, o ≠ si no»', () => {
    const ex: EquationExercise = { id: 'eq:same', kind: 'equation', skill: 'eq:flex', difficulty: 2, mode: 'same', left: [5, '+', 3], right: [4, '+', 4], answer: '=' }
    const { container } = render(<EquationView exercise={ex} onAnswered={() => {}} showFeedback={false} />)
    expect(container.querySelector('.ex-prompt')?.textContent).toMatchInlineSnapshot(`"¿Valen lo mismo los dos lados?"`)
    expect(container.querySelector('.ex-prompt-sub')?.textContent).toMatchInlineSnapshot(`"Toca = si valen lo mismo, o ≠ si no."`)
  })

  it('setting the clock with «menos»: the short hand is almost on the number of the phrase (H8)', () => {
    const { container } = render(<ClockSetView exercise={makeClockSet(3, 50)} onAnswered={() => {}} showFeedback={false} />)
    expect(container.textContent).toMatch(/menos diez/)
    expect(container.textContent).toContain('Con «menos», la aguja corta está casi en el número que dice la frase.')
  })
})
