/* «Inténtalo otra vez» brings back the SAME exercise with what the child wrote (P2, P4): TrySlot passes the answer the view
   sent (outcome.answer) as initialAnswer, and the corrector's wrong boxes as wrongColumns. A real column view checks it
   end to end: the digits are still there and the wrong column is marked. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { Answer, ColumnAddExercise, ExerciseViewProps, SkillSelector } from '@/types'
import TrySlot from './TrySlot'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn(), speaking: () => false } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const seen: ExerciseViewProps[] = []

vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  const real = await import('@/activities/views/ColumnView')
  const realWord = await import('@/activities/views/WordProblemView')
  // The fake view sends a wrong answer with the digits it wrote; a column exercise and a word problem are drawn by the real view.
  const ExerciseView = (props: ExerciseViewProps) => {
    seen.push(props)
    if (props.exercise.kind === 'column-add') return createElement(real.default, props)
    if (props.exercise.kind === 'word-problem') return createElement(realWord.default, props as Parameters<typeof realWord.default>[0])
    const answer: Answer = { type: 'digits', digits: [7, 2] }
    return createElement('div', { 'data-testid': 'fake-exercise', 'data-id': props.exercise.id },
      createElement('button', {
        type: 'button',
        onClick: () => props.onAnswered({
          check: { correct: false, given: '27', expected: '29', wrongColumns: [0] }, ms: 1, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0,
          answer,
        } as Parameters<ExerciseViewProps['onAnswered']>[0]),
      }, 'Responder mal'))
  }
  return { ExerciseView, useActivityHost: host.useActivityHost }
})

const renderTry = (selector: SkillSelector, seedKey: string) =>
  render(
    <ActivityHostProvider value={defaultActivityHost}>
      <TrySlot selector={selector} seedKey={seedKey} onSettled={vi.fn()} />
    </ActivityHostProvider>,
  )

describe('TrySlot «Inténtalo otra vez» keeps what the child wrote', () => {
  it('passes the answer and the wrong columns back to the SAME exercise; the first try has none', () => {
    seen.length = 0
    renderTry({ kinds: ['fact-mul'], tables: [6], factorRange: [6, 7] }, 'retry-fake')
    const id = screen.getByTestId('fake-exercise').getAttribute('data-id')
    expect(seen.at(-1)?.initialAnswer).toBeUndefined()
    expect(seen.at(-1)?.wrongColumns).toBeUndefined()
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' }))
    const last = seen.at(-1)!
    expect(last.exercise.id).toBe(id)
    expect(screen.getByTestId('fake-exercise').getAttribute('data-id')).toBe(id)
    expect(last.initialAnswer).toEqual({ type: 'digits', digits: [7, 2] })
    expect(last.wrongColumns).toEqual([0])
  })

  it('a real column view comes back with the digits written and the wrong column marked', () => {
    seen.length = 0
    renderTry({ kinds: ['column-add'], digits: 3, regroup: 'one' }, 'retry-column')
    const ex = seen.at(-1)!.exercise as ColumnAddExercise
    const right = String(ex.answer).split('').reverse().map(Number)
    // The child writes the right result with a wrong tens digit.
    const written = right.map((d, i) => (i === 1 ? (d + 1) % 10 : d))
    const names = ['unidades', 'decenas', 'centenas', 'millares']
    const cell = (i: number) => screen.getByRole('textbox', { name: new RegExp(`^${names[i]} del resultado`) })
    written.forEach((d, i) => { act(() => { fireEvent.keyDown(cell(i), { key: String(d) }) }) })
    act(() => { fireEvent.keyDown(cell(0), { key: 'Enter' }) })
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Inténtalo otra vez' })) })
    expect(seen.at(-1)!.exercise.id).toBe(ex.id)
    expect(seen.at(-1)?.initialAnswer).toMatchObject({ type: 'digits', digits: written })
    written.forEach((d, i) => {
      expect(cell(i).getAttribute('aria-invalid')).toBe(i === 1 ? 'true' : null)
      expect(cell(i).textContent).toContain(String(d))
    })
  })

  it('a word problem has one «Escuchar» with the voice on (its own) and with the voice off (the common one)', () => {
    const voiceOn = { ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, voice: true } }
    render(
      <ActivityHostProvider value={voiceOn}>
        <TrySlot selector={{ kinds: ['word-problem'] }} seedKey="retry-listen" onSettled={vi.fn()} />
      </ActivityHostProvider>,
    )
    expect(screen.getAllByRole('button', { name: /Escuchar/ })).toHaveLength(1)
    cleanup()
    render(<TrySlot selector={{ kinds: ['word-problem'] }} seedKey="retry-listen" onSettled={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /Escuchar/ })).toHaveLength(1)
  })

  it('«No lo sé» is there from the start and after a miss; it settles the step with the solution and records one «No lo sé»', () => {
    seen.length = 0
    const onSettled = vi.fn()
    const reportAttempt = vi.fn()
    render(
      <ActivityHostProvider value={{ ...defaultActivityHost, reportAttempt }}>
        <TrySlot selector={{ kinds: ['fact-mul'], tables: [6], factorRange: [6, 7] }} seedKey="retry-dontknow" onSettled={onSettled} />
      </ActivityHostProvider>,
    )
    expect(screen.getByRole('button', { name: 'No lo sé' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Responder mal' }))
    expect(screen.getByRole('button', { name: 'No lo sé' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'No lo sé' }))
    expect(onSettled).toHaveBeenCalledWith(false, expect.anything())
    expect(screen.queryByRole('button', { name: 'No lo sé' })).toBeNull()
    expect(screen.getByTestId('solution-panel')).toBeInTheDocument()
    // The wrong answer was the graded one; «No lo sé» after it adds nothing.
    expect(reportAttempt).toHaveBeenCalledTimes(1)
    expect(reportAttempt.mock.calls[0][0].check.errorType).not.toBe('dont-know')
  })
})
