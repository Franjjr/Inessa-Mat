import { fireEvent, render, screen } from '@testing-library/react'
import { Keypad } from './Keypad'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn() } }))

describe('Keypad', () => {
  it('has 0–9, ⌫ and ✓ and calls the handlers', () => {
    const onDigit = vi.fn()
    const onDelete = vi.fn()
    const onSubmit = vi.fn()
    render(<Keypad onDigit={onDigit} onDelete={onDelete} onSubmit={onSubmit} />)
    for (let d = 0; d <= 9; d++) fireEvent.click(screen.getByRole('button', { name: String(d) }))
    expect(onDigit.mock.calls.map((c) => c[0])).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not steal focus from the cell it types into', () => {
    render(<><input aria-label="cell" /><Keypad onDigit={() => {}} onDelete={() => {}} /></>)
    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    screen.getByRole('button', { name: '3' }).dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })

  it('without onSubmit there is no ✓; disabled ignores presses', () => {
    const onDigit = vi.fn()
    render(<Keypad onDigit={onDigit} onDelete={() => {}} disabled layout="wide" />)
    expect(screen.queryByRole('button', { name: 'Comprobar' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onDigit).not.toHaveBeenCalled()
  })
})
