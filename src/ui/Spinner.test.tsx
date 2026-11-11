import { act, render, screen } from '@testing-library/react'
import { Spinner, SPINNER_SLOW_MS } from './index'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Spinner · a wait that never ends', () => {
  it('only spins at first, with no button', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
    expect(screen.queryByRole('button', { name: 'Probar otra vez' })).toBeNull()
  })

  it('after a while it says it takes longer than usual and offers another try', () => {
    render(<Spinner />)
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS) })
    // A slow network is not always a failed load, so the message does not claim that nothing loaded.
    expect(screen.getByRole('status')).toHaveTextContent('Esto tarda más de lo normal')
    expect(screen.queryByText(/Algo no ha cargado/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Probar otra vez' })).toBeInTheDocument()
  })

  it('inside an activity (retry off) it says it takes longer but never offers a reload that would lose the work', () => {
    render(<Spinner retry={false} />)
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS) })
    expect(screen.getByRole('status')).toHaveTextContent('Esto tarda más de lo normal')
    expect(screen.queryByRole('button', { name: 'Probar otra vez' })).toBeNull()
  })

  it('a wait that ends in time never shows the message', () => {
    const { unmount } = render(<Spinner />)
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS - 100) })
    unmount()
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS) })
    expect(screen.queryByText(/tarda más de lo normal/)).toBeNull()
  })
})
