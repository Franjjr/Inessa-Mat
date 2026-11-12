/* The division is always the school galera (with or without the subtractions), whatever method old data names; the
   product of a step appears only after its quotient digit; the child can check with the quotient and the last remainder;
   the galera without subtractions gets hints without «resta». The retired views, if mounted by old data, fit every
   expected number in its box. */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, generate, hintsFor, makeDivision } from '@/engine'
import type { DivMethod, DivisionExercise } from '@/types'
import DivisionView, { effectiveDivMethod } from './DivisionView'
import { DivisionPartsView } from './DivisionMethods'
import { divisionParts } from '@/engine'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const type = (name: RegExp, key: string) => act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name }), { key }) })
const typeNumber = (name: RegExp, n: number) => { for (const d of String(n)) type(name, d) }

const DIV_SKILLS = [
  'div:2x1', 'div:2x1:exact', 'div:2x1:long', 'div:2x1:rem', 'div:3x1', 'div:3x1:exact', 'div:3x1:rem',
  'div:3x2:exact', 'div:3x2:rem', 'div:3x2:round', 'div:4x1', 'div:4x1:exact', 'div:4x1:rem',
]
const ALL_METHODS: (DivMethod | undefined)[] = [undefined, 'galera', 'galera-short', 'div-parts', 'climb']

const divisionsOf = (skill: string, count = 6): DivisionExercise[] =>
  generate({ skills: [skill] }, count, { rng: createRng(7) }).filter((e): e is DivisionExercise => e.kind === 'division')

describe('one division method, the galera of the school', () => {
  it('every division skill, with any saved method (also the retired ones), is shown as a galera', () => {
    let seen = 0
    for (const skill of DIV_SKILLS) {
      for (const ex of divisionsOf(skill, 2)) {
        for (const m of ALL_METHODS) {
          expect(['galera', 'galera-short']).toContain(effectiveDivMethod(m))
          const { unmount } = render(<DivisionView exercise={ex} onAnswered={vi.fn()} divMethod={m} showFeedback={false} />)
          expect(screen.getByRole('region', { name: 'División en galera' })).toBeTruthy()
          expect(screen.queryByRole('region', { name: 'Repartir por partes' })).toBeNull()
          expect(screen.queryByRole('region', { name: 'Multiplicar hacia arriba' })).toBeNull()
          unmount()
          seen++
        }
      }
    }
    expect(seen).toBeGreaterThan(50)
  }, 30_000)

  it('96 ÷ 4 with the quotient 24 and the remainder 0, without the middle remainder: Comprobar is on and it is right', () => {
    const onAnswered = vi.fn()
    render(<DivisionView exercise={makeDivision(96, 4)} onAnswered={onAnswered} showFeedback={false} />)
    type(/cociente, cifra 1/, '2')
    // The second step opens with the quotient digit alone.
    type(/cociente, cifra 2/, '4')
    type(/resto del paso 2/, '0')
    const button = within(screen.getByRole('group', { name: 'Respuesta' })).getByRole('button', { name: /Comprobar/ })
    expect(button).not.toBeDisabled()
    act(() => { fireEvent.click(button) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('the prompt says what to write in each step', () => {
    render(<DivisionView exercise={makeDivision(96, 4)} onAnswered={vi.fn()} />)
    expect(screen.getByText(/Ejemplo con 85 ÷ 4: en 8 cabe 2/)).toBeTruthy()
  })

  it('65 ÷ 7: before the quotient digit there is no «63»; after it, «7 × 9 = 63»', () => {
    const { container } = render(<DivisionView exercise={makeDivision(65, 7)} onAnswered={vi.fn()} />)
    expect(container.textContent).not.toContain('63')
    expect(screen.queryByRole('group', { name: /63/ })).toBeNull()
    // The question of the step is in the list of steps and in the bubble beside the active quotient box.
    expect(screen.getAllByText(/¿Cuántas veces cabe el 7 en 65\?/)).toHaveLength(2)
    expect(screen.getByTestId('galera-ask').textContent).toBe('¿Cuántas veces cabe el 7 en 65?')
    type(/cociente, cifra 1/, '9')
    expect(screen.getByRole('group', { name: 'producto del paso 1: 7 × 9 = 63' })).toBeTruthy()
    expect(screen.getByText(/7 × 9 = 63\./)).toBeTruthy()
  })

  it('a digit too big gets a gentle word, not a mark: 7 × 9 is more than 60', () => {
    render(<DivisionView exercise={makeDivision(60, 7)} onAnswered={vi.fn()} />)
    type(/cociente, cifra 1/, '9')
    expect(screen.getByText(/Es más que 60: prueba un número más pequeño\./)).toBeTruthy()
  })

  it('the galera without subtractions shows its own hints: none asks to «resta» on paper', () => {
    const ex = makeDivision(96, 4)
    const shortHints = hintsFor(ex, undefined, { divMethod: 'galera-short' }).map((h) => h.text)
    const fullHints = hintsFor(ex, undefined, { divMethod: 'galera' }).map((h) => h.text)
    // Its own hints: the step of the galera with subtractions («réstalo») is not the one without them.
    expect(shortHints).not.toEqual(fullHints)
    expect(fullHints.join(' ')).toMatch(/résta|resta/i)
    // No hint of the galera without subtractions speaks of subtracting (not even «restas»).
    for (const text of shortHints) expect(text).not.toMatch(/résta|resta/i)
    render(<DivisionView exercise={ex} onAnswered={vi.fn()} divMethod="galera-short" />)
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Pista' })) })
    const note = screen.getByRole('note')
    expect(note.textContent).toBe(shortHints[0])
    expect(note.textContent).not.toMatch(/resta/i)
  })
})

describe('the retired view «repartir por partes», if old data mounts it', () => {
  it('every expected number fits in its box (also the 4-digit divisions)', () => {
    for (const skill of DIV_SKILLS) {
      for (const ex of divisionsOf(skill, 1)) {
        if (ex.divisor >= 10) continue // the parts were only for one-digit divisors
        const onAnswered = vi.fn()
        const { unmount } = render(<DivisionPartsView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
        divisionParts(ex.dividend, ex.divisor).forEach((st, k) => typeNumber(new RegExp(`cociente de la parte ${k + 1}$`), st.quotient))
        typeNumber(/cociente total/, ex.quotient)
        if (ex.remainder > 0) typeNumber(/^resto$/, ex.remainder)
        act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name: /cociente total/ }), { key: 'Enter' }) })
        expect(onAnswered.mock.calls[0]?.[0].check.correct, `${ex.dividend} ÷ ${ex.divisor}`).toBe(true)
        unmount()
      }
    }
  }, 30_000)
})
