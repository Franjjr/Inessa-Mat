import { act, render, screen } from '@testing-library/react'
import { focusPad, useIsActivePad } from './activePad'

function Pad({ id }: { id: string }) {
  return <span data-testid={id}>{useIsActivePad(id) ? 'keypad' : '-'}</span>
}

describe('one keypad per screen', () => {
  it('the first box shows it, then the box touched last; a removed box hands it back', () => {
    const { rerender } = render(<><Pad id="top" /><Pad id="bottom" /></>)
    expect(screen.getByTestId('top').textContent).toBe('keypad')
    expect(screen.getByTestId('bottom').textContent).toBe('-')
    act(() => focusPad('bottom'))
    expect(screen.getByTestId('top').textContent).toBe('-')
    expect(screen.getByTestId('bottom').textContent).toBe('keypad')
    rerender(<Pad id="top" />)
    expect(screen.getByTestId('top').textContent).toBe('keypad')
  })
})
