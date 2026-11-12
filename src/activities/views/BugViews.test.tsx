/* Encuentra el error and Comprobar (p1n-01, p1n-02): the sign above a calculation that may be wrong on purpose, and the
   proof box that is optional when the engine grades a right verdict without it. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, genCheckCalc, genErrorHunt } from '@/engine'
import type { Answer, CheckCalcExercise, Exercise } from '@/types'
import ErrorHuntView, { HUNT_SIGN } from './ErrorHuntView'
import CheckCalcView, { CHECK_SIGN, proofOptional } from './CheckCalcView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn(), tap: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

// The grading of a right verdict without the proof is the engine's (p1n-02, src/engine/bugs.ts). Here the engine is told to
// accept it when the test asks, so the view is tested both ways.
// `half`: the engine grades only the right verdict without the proof (the wrong one comes back incomplete).
const engine = vi.hoisted(() => ({ proofOptional: false, half: false }))
vi.mock('@/engine', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/engine')>()
  return {
    ...real,
    check: (ex: Exercise, a: Answer) => {
      if (engine.proofOptional && ex.kind === 'check-calc' && a.type === 'verdict' && a.value === null) {
        const right = a.ok === (ex as CheckCalcExercise).ok
        if (engine.half && !right) return { correct: false, given: '?', expected: '', errorType: 'incomplete' as const }
        return { correct: right, given: right ? 'bien' : 'mal', expected: '' }
      }
      return real.check(ex, a)
    },
  }
})

const comprobar = () => screen.getAllByRole('button', { name: /Comprobar/ }).at(-1) as HTMLButtonElement

describe('the sign above a calculation that may be wrong (p1n-01)', () => {
  it('encuentra el error: the sign is above the calculation, and it never says whether this one is wrong', () => {
    for (const wrong of [true, false]) {
      const { container, unmount } = render(<ErrorHuntView exercise={genErrorHunt('sub', createRng(31), wrong)} onAnswered={vi.fn()} showFeedback={false} />)
      const sign = container.querySelector('[data-cartel]')
      expect(sign?.textContent).toBe(HUNT_SIGN)
      expect(sign?.textContent).toMatch(/Dani ha hecho esta cuenta/)
      // Above the calculation.
      const calc = screen.getByRole('table', { name: 'Cuenta' })
      expect(sign!.compareDocumentPosition(calc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      unmount()
    }
  })

  it('comprobar: the sign says the calculation may be right or wrong', () => {
    const { container } = render(<CheckCalcView exercise={genCheckCalc('sub', createRng(9), false)} onAnswered={vi.fn()} showFeedback={false} />)
    expect(container.querySelector('[data-cartel]')?.textContent).toBe(CHECK_SIGN)
    expect(CHECK_SIGN).toBe('Esta cuenta puede estar bien o mal. ¿Lo compruebas?')
  })
})

describe('comprobar: the proof box (p1n-02)', () => {
  it('the label names the school proof: the result minus one addend', () => {
    render(<CheckCalcView exercise={genCheckCalc('add', createRng(9), false)} onAnswered={vi.fn()} showFeedback={false} />)
    expect(screen.getByText(/La prueba: el resultado menos un sumando/)).toBeTruthy()
  })

  it('while the engine needs the proof, Comprobar waits for it', () => {
    engine.proofOptional = false
    const ex = genCheckCalc('sub', createRng(9), false)
    expect(proofOptional(ex)).toBe(false)
    render(<CheckCalcView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: /No está bien/ }))
    expect(comprobar().disabled).toBe(true)
  })

  it('when the engine grades a right verdict alone, «No está bien» without the proof can be checked, and it is right', () => {
    engine.proofOptional = true
    const ex = genCheckCalc('sub', createRng(9), false)
    expect(ex.ok).toBe(false)
    const onAnswered = vi.fn()
    render(<CheckCalcView exercise={ex} onAnswered={onAnswered} showFeedback={false} />)
    fireEvent.click(screen.getByRole('button', { name: /No está bien/ }))
    expect(comprobar().disabled).toBe(false)
    fireEvent.click(comprobar())
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
    engine.proofOptional = false
  })

  it('the real engine: the box is required for a right and for a wrong calculation alike (no «si quieres» either way)', () => {
    engine.proofOptional = false
    for (const ok of [true, false]) {
      const ex = genCheckCalc('add', createRng(5), ok)
      expect(proofOptional(ex)).toBe(false)
      const { unmount } = render(<CheckCalcView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
      expect(screen.queryByText(/si quieres/)).toBeNull()
      unmount()
    }
  })

  it('«(si quieres)» never tells the answer: an engine that grades only one verdict alone keeps the box required for both', () => {
    engine.proofOptional = true
    engine.half = true
    for (const ok of [true, false]) {
      const ex = genCheckCalc('add', createRng(5), ok)
      expect(ex.ok).toBe(ok)
      expect(proofOptional(ex)).toBe(false)
      const { unmount } = render(<CheckCalcView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
      expect(screen.queryByText(/si quieres/)).toBeNull()
      unmount()
    }
    engine.half = false
    // An engine that grades both verdicts alone: the label shows for a right and for a wrong calculation alike.
    for (const ok of [true, false]) {
      const ex = genCheckCalc('add', createRng(5), ok)
      expect(proofOptional(ex)).toBe(true)
      const { unmount } = render(<CheckCalcView exercise={ex} onAnswered={vi.fn()} showFeedback={false} />)
      expect(screen.getByText(/si quieres/)).toBeTruthy()
      unmount()
    }
    engine.proofOptional = false
  })
})
