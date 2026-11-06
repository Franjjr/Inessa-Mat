/* The grow decision of a try step belongs to its lesson: when the lesson changes, the state of the previous one (its step
   index, its outcomes and the step that grew) does not carry over. TrySlot is stubbed: the test drives onOverflow itself. */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LessonDef, SkillSelector } from '@/types'
import LessonPlayer from './LessonPlayer'

vi.mock('./TrySlot', async () => {
  const { createElement } = await import('react')
  type Props = { grown?: boolean; onOverflow?: () => void; onSettled: (solved: boolean) => void }
  // A stub try: «desbordar» asks the lesson to grow, «resolver» settles the step as solved.
  return {
    default: (props: Props) => createElement('div', { 'data-testid': 'try', 'data-grown': String(!!props.grown) },
      createElement('button', { type: 'button', onClick: () => props.onOverflow?.() }, 'desbordar'),
      createElement('button', { type: 'button', onClick: () => props.onSettled(true) }, 'resolver')),
  }
})

vi.mock('@/audio', () => ({
  speech: { say: vi.fn(() => Promise.resolve()), stop: vi.fn() },
  sfx: { play: vi.fn() },
}))

const selector: SkillSelector = { kinds: ['fact-mul'], tables: [2], factorRange: [2, 5] }
const tryStep = { visual: 'groups' as const, params: {}, text: 'Prueba.', interaction: 'try' as const, trySelector: selector }

const lessonA: LessonDef = { id: 'lesson-a', title: 'A', steps: [tryStep, { ...tryStep, text: 'Otra.' }] }
const lessonB: LessonDef = { id: 'lesson-b', title: 'B', steps: [tryStep, { ...tryStep, text: 'Otra.' }] }

describe('LessonPlayer: the grown try belongs to its lesson', () => {
  it('a try that asked the lesson to grow grows the lesson; the next lesson starts without the grow', () => {
    const { rerender } = render(<LessonPlayer lesson={lessonA} onDone={() => undefined} />)
    expect(screen.getByTestId('try').getAttribute('data-grown')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'desbordar' }))
    expect(screen.getByTestId('try').getAttribute('data-grown')).toBe('true')
    // The same player, another lesson, the same step index: the new lesson's try is not grown.
    rerender(<LessonPlayer lesson={lessonB} onDone={() => undefined} />)
    expect(screen.getByTestId('try').getAttribute('data-grown')).toBe('false')
  })

  it('the step outcomes of the previous lesson do not carry over either', () => {
    const { rerender } = render(<LessonPlayer lesson={lessonA} onDone={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'resolver' }))
    expect(screen.getByRole('button', { name: /Siguiente|Lo he entendido/ })).not.toBeDisabled()
    rerender(<LessonPlayer lesson={lessonB} onDone={() => undefined} />)
    expect(screen.getByRole('button', { name: /Siguiente|Lo he entendido/ })).toBeDisabled()
  })
})
