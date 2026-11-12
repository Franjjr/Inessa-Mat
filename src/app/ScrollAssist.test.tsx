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

  it('P6: «Más abajo» shows when a button is cut by the bottom of the window by only a few pixels', async () => {
    // The game shrunk to its smallest scale overflows by 12 px, and those 12 px are the bottom of «No lo sé».
    setPageHeight(window.innerHeight + 12)
    const button = document.createElement('button')
    button.textContent = 'No lo sé'
    button.getBoundingClientRect = () => ({ top: window.innerHeight - 44, bottom: window.innerHeight + 12, left: 400, right: 500, width: 100, height: 56, x: 400, y: window.innerHeight - 44, toJSON: () => ({}) })
    document.body.appendChild(button)
    render(<ScrollAssist />)
    await waitFor(() => expect(screen.getByRole('button', { name: DOWN })).toBeTruthy())
  })

  it('a few pixels of empty page under the window do not bring «Más abajo»', async () => {
    setPageHeight(window.innerHeight + 12)
    render(<ScrollAssist />)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('button', { name: DOWN })).toBeNull()
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
  /** A page 2000 px tall whose last 84 px are the spacer, with a browser that clamps the scroll when the page gets shorter,
      as WebKit (Safari, iPad) does on the forced layout of a reading. Returns the reads made with the spacer taken out. */
  function webkitLikePage(startY: number) {
    let y = startY
    const reads = { hidden: 0 }
    const scrollYDesc = Object.getOwnPropertyDescriptor(window, 'scrollY')
    Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true })
    vi.spyOn(window, 'scrollTo').mockImplementation(((a: number | ScrollToOptions, b?: number) => {
      y = typeof a === 'number' ? (b ?? 0) : (a.top ?? y)
    }) as typeof window.scrollTo)
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: () => {
        const spacer = document.querySelector<HTMLElement>('[data-scroll-spacer]')
        if (spacer && spacer.style.display !== 'none') return 2000
        if (spacer) {
          reads.hidden++
          y = Math.min(y, 2000 - 84 - window.innerHeight) // the clamp of the shorter page
        }
        return 2000 - 84
      },
    })
    return {
      reads,
      y: () => y,
      setY: (v: number) => { y = v },
      restore: () => { if (scrollYDesc) Object.defineProperty(window, 'scrollY', scrollYDesc) },
    }
  }

  it('P6 (Safari/iPad): reading the page height never moves the page, also at the very bottom', async () => {
    const bottom = 2000 - window.innerHeight
    const page = webkitLikePage(bottom)
    try {
      const { container } = render(<ScrollAssist />)
      await waitFor(() => expect(container.querySelector('[data-scroll-spacer]')).toBeTruthy())
      // The content changes (a feedback box): the height is read again, with the child at the end of the page.
      act(() => { document.body.appendChild(document.createElement('div')) })
      await waitFor(() => expect(page.reads.hidden).toBeGreaterThan(0))
      await new Promise((r) => setTimeout(r, 50))
      expect(page.y()).toBe(bottom)
    } finally {
      page.restore()
    }
  })

  it('scrolling does not re-read the page height (no forced layout on every frame of a swipe)', async () => {
    const page = webkitLikePage(0)
    try {
      const { container } = render(<ScrollAssist />)
      await waitFor(() => expect(container.querySelector('[data-scroll-spacer]')).toBeTruthy())
      await new Promise((r) => setTimeout(r, 50))
      page.reads.hidden = 0
      for (const v of [100, 300, 600, 900]) {
        page.setY(v)
        act(() => { window.dispatchEvent(new Event('scroll')) })
        await new Promise((r) => setTimeout(r, 20))
      }
      expect(page.reads.hidden).toBe(0)
      // Near the end the buttons still follow the scroll: «Más abajo» goes once nothing is below.
      page.setY(2000 - 84 - window.innerHeight)
      act(() => { window.dispatchEvent(new Event('scroll')) })
      await waitFor(() => expect(screen.queryByRole('button', { name: DOWN })).toBeNull())
      expect(page.reads.hidden).toBe(0)
    } finally {
      page.restore()
    }
  })
})
