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

  it('shows «Más abajo» when the page grows without a scroll or a resize, and does not poll the layout', async () => {
    const intervalSpy = vi.spyOn(window, 'setInterval')
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
    await waitFor(() => expect(screen.getByRole('button', { name: DOWN })).toBeTruthy(), { timeout: 300 })
    expect(intervalSpy).not.toHaveBeenCalledWith(expect.any(Function), 500)
  })
})
