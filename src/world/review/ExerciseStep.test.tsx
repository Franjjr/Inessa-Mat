import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Exercise } from '@/types'
import { ExerciseStep } from './ExerciseStep'

// The exercise view is covered by the activities module. Here a stub answers on click, so only the step is tested.
vi.mock('@/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/activities')>()
  const React = await import('react')
  function ExerciseView({ onAnswered }: { onAnswered: (o: unknown) => void }) {
    return React.createElement('button', {
      type: 'button',
      onClick: () => onAnswered({ check: { correct: true, given: '4', expected: '4' }, ms: 900, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0 }),
    }, 'Responder')
  }
  return { ...actual, ExerciseView }
})

const exercise = { id: 'add:2+2', kind: 'fact', skill: 'add:2+2', difficulty: 1, topic: 'add', prompt: '2 + 2', options: [], answer: '4' } as unknown as Exercise

describe('ExerciseStep «Ahora no»', () => {
  it('offers «Ahora no» before the child answers, and calls onSkip when tapped', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<ExerciseStep exercise={exercise} allowHints okLabel="Siguiente" onContinue={() => {}} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('does not offer «Ahora no» after the child answers', async () => {
    const user = userEvent.setup()
    render(<ExerciseStep exercise={exercise} allowHints okLabel="Siguiente" onContinue={() => {}} onSkip={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ahora no' })).toBeNull()
  })

  it('is not offered when the step has no onSkip (the daily review)', () => {
    render(<ExerciseStep exercise={exercise} allowHints okLabel="Siguiente" onContinue={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Ahora no' })).toBeNull()
  })
})
