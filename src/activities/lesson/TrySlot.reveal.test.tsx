/* A try step that gives up after its misses shows the right answer in a fixed line, and the exercise is asked with
   teach='full' so that the child copies the answer before the lesson goes on. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { ExerciseViewProps, SkillSelector } from '@/types'
import TrySlot, { shownAnswerOf } from './TrySlot'

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

describe('TrySlot: the copy step is not a new miss', () => {
  it('a copy written right gives up the step at once: no «¡Casi!» and no second try', () => {
    const onSettled = vi.fn()
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-copy" onSettled={onSettled} />
      </ActivityHostProvider>,
    )
    // With teach full the view only ends an exercise at its copy step, so this outcome is the first one of the step.
    fireEvent.click(screen.getByRole('button', { name: 'Copia bien' }))
    const answer = screen.getByTestId('fake-exercise').getAttribute('data-answer')
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenLastCalledWith(false, Number(answer))
    expect(screen.queryByText(/Casi/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
    expect(screen.getByText(`La respuesta es ${answer}.`)).toBeTruthy()
  })
})

describe('TrySlot: no «¡Casi!» once the child has copied the answer', () => {
  it('a miss, a retry, then a copy written right: the copy ends the step with no «¡Casi!» left on screen', () => {
    const onSettled = vi.fn()
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-after-miss" onSettled={onSettled} />
      </ActivityHostProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(screen.getByText(/¡Casi!/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copia bien' }))
    const answer = screen.getByTestId('fake-exercise').getAttribute('data-answer')
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenLastCalledWith(false, Number(answer))
    expect(screen.queryByText(/Casi/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Inténtalo otra vez' })).toBeNull()
  })
})

describe('TrySlot: the answer line only shows a plain number answer', () => {
  it('shows a counted answer', () => {
    expect(shownAnswerOf({ kind: 'fact-mul', a: 6, b: 7, answer: 42 } as never)).toBe(42)
  })

  it('shows no bare number for a time problem, whose number is minutes', () => {
    expect(shownAnswerOf({ kind: 'time-duration', answer: 45 } as never)).toBeNull()
  })
})

describe('TrySlot: teaching after the misses', () => {
  it('asks the exercise with teach full, so a miss ends in the copy step', () => {
    seen.length = 0
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-teach" onSettled={vi.fn()} />
      </ActivityHostProvider>,
    )
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((p) => p.teach === 'full')).toBe(true)
  })

  it('a step without hints does not open the exercise with its trick on screen', () => {
    seen.length = 0
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-nohints" onSettled={vi.fn()} allowHints={false} />
      </ActivityHostProvider>,
    )
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((p) => p.guided === false)).toBe(true)
  })

  it('a step with hints opens the exercise guided', () => {
    seen.length = 0
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-hints" onSettled={vi.fn()} />
      </ActivityHostProvider>,
    )
    expect(seen.every((p) => p.guided === true)).toBe(true)
  })

  it('after giving up, a fixed line says the right answer', () => {
    const onSettled = vi.fn()
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-line" onSettled={onSettled} />
      </ActivityHostProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    const answer = screen.getByTestId('fake-exercise').getAttribute('data-answer')
    expect(onSettled).toHaveBeenLastCalledWith(false, Number(answer))
    expect(screen.getByText(`La respuesta es ${answer}.`)).toBeTruthy()
  })

  it('a step given up before, shown again from the lesson, still says the right answer', () => {
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-back" onSettled={vi.fn()} settled={false} givenUpAnswer={42} />
      </ActivityHostProvider>,
    )
    expect(screen.getByText('La respuesta es 42.')).toBeTruthy()
    expect(screen.getByText(/No pasa nada/)).toBeTruthy()
  })

  it('a step given up without a shown answer (a time problem) says no number', () => {
    render(
      <ActivityHostProvider value={defaultActivityHost}>
        <TrySlot selector={selector} seedKey="reveal-back-none" onSettled={vi.fn()} settled={false} givenUpAnswer={null} />
      </ActivityHostProvider>,
    )
    expect(screen.queryByText(/La respuesta es/)).toBeNull()
    expect(screen.getByText(/No pasa nada/)).toBeTruthy()
  })
})
