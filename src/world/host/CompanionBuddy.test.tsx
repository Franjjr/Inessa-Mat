import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactionEvent } from './GameHost'
import CompanionBuddy from './CompanionBuddy'

// The buddy only needs the bus: a fake one lets the test push reactions straight into it.
const listeners = new Set<(e: ReactionEvent) => void>()
vi.mock('./GameHost', () => ({
  useBuddyBus: () => ({
    subscribe: (l: (e: ReactionEvent) => void) => {
      listeners.add(l)
      return () => { listeners.delete(l) }
    },
  }),
}))

function emit(event: ReactionEvent) {
  act(() => { listeners.forEach((l) => l(event)) })
}

describe('CompanionBuddy live region', () => {
  it('announces a reaction once: one role=status and no nested aria-live wrapper', () => {
    const { container } = render(<CompanionBuddy />)
    emit({ id: 1, kind: 'correct', phrase: '¡Muy bien, Inessa!' })

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('¡Muy bien, Inessa!')
    const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
    expect(liveRegions).toHaveLength(1)
    expect(liveRegions[0]).toBe(status)
  })

  it('hides the animated figures from assistive technology', () => {
    const { container } = render(<CompanionBuddy />)
    const figures = container.querySelector('[aria-hidden="true"]')
    expect(figures).not.toBeNull()
    expect(figures!.querySelector('svg, img, canvas')).not.toBeNull()
  })
})
