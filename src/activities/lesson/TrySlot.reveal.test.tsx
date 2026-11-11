/* A try step that gives up after its misses shows the exercise solved step by step (the solution panel), and the exercise
   is asked with teach='full' so that a missed fact is copied before the lesson goes on. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import { makeDivision, makeFactMul } from '@/engine'
import type { ExerciseViewProps, SkillSelector } from '@/types'
import TrySlot, { SOLVED_LINE, shownAnswerOf } from './TrySlot'

const seen: { teach?: string; guided?: boolean }[] = []

vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  // A stand-in for the real view: every tap is a wrong answer, and the view exposes the teaching it was given.
  const ExerciseView = (props: ExerciseViewProps) => {
    seen.push({ teach: props.teach, guided: props.guided })
    const exercise = props.exercise as { answer: number }
    return createElement('div', { 'data-testid': 'fake-exercise', 'data-answer': String(exercise.answer) },
      createElement('button', {
        type: 'button',
        onClick: () => props.onAnswered({ check: { correct: false, given: '1', expected: String(exercise.answer) }, ms: 1, inputMode: 'keyboard', hintsUsed: 0, recognitionFixes: 0 }),
      }, 'Responder mal'),
      // The copy step ended well: the answer was shown and written right (revealed, graded wrong).
      createElement('button', {
        type: 'button',
        onClick: () => props.onAnswered({ check: { correct: false, given: '1', expected: String(exercise.answer) }, ms: 1, inputMode: 'keyboard', hintsUsed: 0, recognitionFixes: 0, revealed: true }),
      }, 'Copia bien'))
  }
  return { ExerciseView, useActivityHost: host.useActivityHost }
})

const selector: SkillSelector = { kinds: ['fact-mul'], tables: [6], factorRange: [6, 7] }

const renderTry = (props: Partial<Parameters<typeof TrySlot>[0]> = {}) => {
  const onSettled = vi.fn()
  render(
    <ActivityHostProvider value={defaultActivityHost}>
      <TrySlot selector={selector} seedKey="reveal" onSettled={onSettled} {...props} />
    </ActivityHostProvider>,
  )
  return onSettled
}

describe('TrySlot: the copy step is not a new miss', () => {
  it('a copy written right gives up the step at once with the solution: no «¡Casi!» and no second try', () => {
    const onSettled = renderTry({ seedKey: 'reveal-copy' })
    fireEvent.click(screen.getByRole('button', { name: 'Copia bien' }))
    const answer = screen.getByTestId('fake-exercise').getAttribute('data-answer')
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled.mock.calls[0][0]).toBe(false)
    expect(onSettled.mock.calls[0][1]).toContain(`= ${answer}`)
    expect(screen.queryByText(/Casi/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    expect(screen.getByTestId('solution-panel')).toHaveTextContent(`= ${answer}`)
  })

  it('a miss, a retry, then a copy written right: the copy ends the step with no «Casi» left on screen', () => {
    const onSettled = renderTry({ seedKey: 'reveal-after-miss' })
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(screen.getByText(/Casi\. Fíjate/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copia bien' }))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled.mock.calls[0][0]).toBe(false)
    expect(screen.queryByText(/Casi/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
  })
})

describe('TrySlot: the answer shown after giving up', () => {
  it('is the solution answer for every kind: a fact, and a division with what is left over', () => {
    expect(shownAnswerOf(makeFactMul(6, 7))).toBe('6 × 7 = 42')
    expect(shownAnswerOf(makeDivision(22, 5))).toBe('4, y sobran 2')
    expect(shownAnswerOf(makeDivision(84, 4))).toBe('21, y no sobra nada')
  })
})

describe('TrySlot: teaching after the misses', () => {
  it('asks the exercise with teach full, so a miss ends in the copy step', () => {
    seen.length = 0
    renderTry({ seedKey: 'reveal-teach' })
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((p) => p.teach === 'full')).toBe(true)
  })

  it('a step without hints does not open the exercise with its trick on screen', () => {
    seen.length = 0
    renderTry({ seedKey: 'reveal-nohints', allowHints: false })
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((p) => p.guided === false)).toBe(true)
  })

  it('a step with hints opens the exercise guided', () => {
    seen.length = 0
    renderTry({ seedKey: 'reveal-hints' })
    expect(seen.every((p) => p.guided === true)).toBe(true)
  })

  it('after giving up, the exercise stays and the solution says the right answer', () => {
    const onSettled = renderTry({ seedKey: 'reveal-line' })
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    const answer = screen.getByTestId('fake-exercise').getAttribute('data-answer')
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled.mock.calls[0][1]).toContain(`= ${answer}`)
    expect(screen.getByText(SOLVED_LINE)).toBeTruthy()
    expect(screen.getByTestId('solution-panel')).toHaveTextContent(`= ${answer}`)
    expect(screen.queryByText(/No pasa nada/)).toBeNull()
  })

  it('a step given up before, shown again from the lesson, shows the exercise solved', () => {
    renderTry({ seedKey: 'reveal-back', settled: false, givenUpAnswer: '6 × 7 = 42' })
    expect(screen.getByText(SOLVED_LINE)).toBeTruthy()
    expect(screen.getByTestId('solution-panel')).toHaveTextContent(/Respuesta:/)
    expect(screen.queryByTestId('fake-exercise')).toBeNull()
  })
})
