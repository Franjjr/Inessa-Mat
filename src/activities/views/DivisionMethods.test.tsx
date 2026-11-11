/* The two written division methods (repartir por partes, multiplicar hacia arriba) when the division is exact: the
   remainder box may stay empty, because nothing is left over (3.11). */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeDivision } from '@/engine'
import { DivisionClimbView, DivisionPartsView } from './DivisionMethods'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const type = (name: RegExp | string, n: number) => {
  const cell = () => screen.getByRole('textbox', { name })
  for (const d of String(n).split('')) act(() => { fireEvent.keyDown(cell(), { key: d }) })
}

describe('división por partes con resto vacío', () => {
  it('84 ÷ 4 = 21 sin resto: el resto puede quedar vacío y la respuesta es correcta', () => {
    const onAnswered = vi.fn()
    render(<DivisionPartsView exercise={makeDivision(84, 4)} onAnswered={onAnswered} showFeedback={false} />)
    type(/cociente de la parte 1/, 20)
    type(/cociente de la parte 2/, 1)
    type(/cociente total/, 21)
    act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name: /cociente total/ }), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('the text guide says to write 0 when nothing is left over', () => {
    render(<DivisionPartsView exercise={makeDivision(84, 4)} onAnswered={() => {}} showFeedback={false} />)
    expect(screen.getByText('Escribe 0 si no sobra nada.')).toBeTruthy()
  })
})

describe('multiplicar hacia arriba con resto vacío', () => {
  it('28 ÷ 4 = 7 sin resto: subir hasta 28 y dejar el resto vacío es correcto', () => {
    const onAnswered = vi.fn()
    render(<DivisionClimbView exercise={makeDivision(28, 4)} onAnswered={onAnswered} showFeedback={false} />)
    for (const p of [4, 8, 12, 16, 20, 24, 28]) {
      type(new RegExp(`producto de 4 por ${p / 4}`), p)
      act(() => { fireEvent.click(screen.getByRole('button', { name: 'Fila lista' })) })
    }
    act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name: 'resto' }), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
