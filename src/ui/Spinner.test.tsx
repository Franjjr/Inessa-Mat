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

  it('after a while it says the data did not load and offers another try', () => {
    render(<Spinner />)
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS) })
    expect(screen.getByRole('status')).toHaveTextContent('Algo no ha cargado')
    expect(screen.getByRole('button', { name: 'Probar otra vez' })).toBeInTheDocument()
  })

  it('a wait that ends in time never shows the message', () => {
    const { unmount } = render(<Spinner />)
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS - 100) })
    unmount()
    act(() => { vi.advanceTimersByTime(SPINNER_SLOW_MS) })
    expect(screen.queryByText(/Algo no ha cargado/)).toBeNull()
  })
})
