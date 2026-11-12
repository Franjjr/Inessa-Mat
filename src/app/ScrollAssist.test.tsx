import { render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScrollAssist } from './ScrollAssist'

const DOWN = 'Ver lo de abajo'

function setPageHeight(px: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: px, configurable: true })
}

describe('ScrollAssist', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete (document.documentElement as unknown as Record<string, unknown>).scrollHeight
    document.body.innerHTML = ''
  })

  it('shows «Más abajo» when the page grows without a scroll or a resize, at once (the observers), before the safety-net check', async () => {
    setPageHeight(500) // fits: no button yet
    render(<ScrollAssist />)
    expect(screen.queryByRole('button', { name: DOWN })).toBeNull()

    // A new round or a feedback box makes the page longer: only the DOM changes.
    setPageHeight(2000)
    act(() => {
      const extra = document.createElement('div')
      extra.textContent = 'Nueva ronda'
      document.body.appendChild(extra)
    })
    // Well under the 500 ms safety-net check: the observers react to the DOM change itself.
    await waitFor(() => expect(screen.getByRole('button', { name: DOWN })).toBeTruthy(), { timeout: 300 })
  })

  it('P6: «Más abajo» stays while anything is below the window, also when the spacer did not make the page longer', async () => {
    // A screen whose content overflows a box of the window's height (the placement): the spacer sits inside that height and
    // adds nothing to the page. The child went down, then the next question is taller: 60 px of it are under the window.
    // Taking the spacer off the page height would hide «Más abajo» with «Siguiente» out of reach.
    setPageHeight(2000)
    const scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
    const { container } = render(<ScrollAssist />)
    await waitFor(() => expect(container.querySelector('[data-scroll-spacer]')).toBeTruthy())
    try {
      Object.defineProperty(window, 'scrollY', { value: 2000 - window.innerHeight - 60, configurable: true })
      act(() => { window.dispatchEvent(new Event('scroll')) })
      await new Promise((r) => setTimeout(r, 50))
      expect(screen.getByRole('button', { name: DOWN })).toBeTruthy()
      // At the very end of the page it goes.
      Object.defineProperty(window, 'scrollY', { value: 2000 - window.innerHeight, configurable: true })
      act(() => { window.dispatchEvent(new Event('scroll')) })
      await waitFor(() => expect(screen.queryByRole('button', { name: DOWN })).toBeNull())
    } finally {
      if (scrollY) Object.defineProperty(window, 'scrollY', scrollY)
    }
  })

  it('P3PE-12: «Más abajo» never sits on a control: it takes the other corner when the bottom-left one is taken', async () => {
    setPageHeight(2000)
    const control = document.createElement('button')
    control.textContent = 'Pista'
    document.body.appendChild(control)
    // Under the left half of the window there is a control; the right half is free.
    const original = document.elementsFromPoint
    document.elementsFromPoint = ((x: number) => (x < window.innerWidth / 2 ? [control] : [])) as typeof document.elementsFromPoint
    try {
      render(<ScrollAssist />)
      await waitFor(() => expect(screen.getByRole('button', { name: DOWN }).className).toMatch(/atRight/))
    } finally {
      document.elementsFromPoint = original
    }
  })

  it('P3PE-12: with nothing under it, «Más abajo» stays bottom left; a page that scrolls ends with a free space', async () => {
    setPageHeight(2000)
    const original = document.elementsFromPoint
    document.elementsFromPoint = (() => []) as typeof document.elementsFromPoint
    try {
      const { container } = render(<ScrollAssist />)
      await waitFor(() => expect(screen.getByRole('button', { name: DOWN }).className).toMatch(/atLeft/))
      expect(container.querySelector('[data-scroll-spacer]')).toBeTruthy()
    } finally {
      document.elementsFromPoint = original
    }
  })
})
