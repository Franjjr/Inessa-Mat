import { render, screen, waitFor } from '@testing-library/react'
import { ScrollAssist } from './ScrollAssist'

describe('ScrollAssist · no polling', () => {
  it('checks the page when it changes, not on a timer', () => {
    const setInterval = vi.spyOn(window, 'setInterval')
    const { unmount } = render(<ScrollAssist />)
    expect(setInterval).not.toHaveBeenCalledWith(expect.any(Function), 500)
    unmount()
    setInterval.mockRestore()
  })
})

describe('ScrollAssist · reacts to the page changing', () => {
  // jsdom has no layout: the page height is faked on the root element, then the body is changed to fire the observer.
  let pageHeight = 0
  beforeEach(() => {
    pageHeight = 400
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => pageHeight })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 })
  })
  afterEach(() => {
    delete (document.documentElement as unknown as Record<string, unknown>).scrollHeight
  })

  it('shows «Más abajo» when the content grows past the screen, and hides it when it fits again', async () => {
    render(<ScrollAssist />)
    expect(screen.queryByRole('button', { name: 'Ver lo de abajo' })).toBeNull()

    pageHeight = 1500
    const note = document.createElement('div')
    note.textContent = 'Un comentario nuevo'
    document.body.appendChild(note)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ver lo de abajo' })).toBeInTheDocument())

    pageHeight = 400
    note.remove()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ver lo de abajo' })).toBeNull())
  })
})
