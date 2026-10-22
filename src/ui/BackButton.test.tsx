import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { BackButton, TopBar } from './index'

describe('BackButton', () => {
  it('shows a visible «Volver» label by default and calls onClick', () => {
    const onClick = vi.fn()
    render(<BackButton onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Volver' })
    expect(button).toHaveTextContent('Volver')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('exit variant reads «Salir»; an explicit aria-label keeps the visible word inside it', () => {
    render(<BackButton variant="exit" aria-label="Salir de la lección" onClick={() => {}} />)
    const button = screen.getByRole('button', { name: 'Salir de la lección' })
    expect(button).toHaveTextContent('Salir')
  })

  it('custom label replaces the default text', () => {
    render(<BackButton label="Volver a la zona de niños" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Volver a la zona de niños' })).toBeInTheDocument()
  })
})

describe('TopBar back', () => {
  it('uses the same back button and navigates back one screen', () => {
    render(
      <MemoryRouter initialEntries={['/a', '/b']} initialIndex={1}>
        <TopBar title="Álbum" back />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })
})
