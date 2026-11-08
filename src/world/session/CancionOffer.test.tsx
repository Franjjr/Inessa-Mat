import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CancionOffer } from './CancionOffer'

describe('CancionOffer', () => {
  it('offers the song of the table and opens it', () => {
    render(
      <MemoryRouter initialEntries={['/play/sesion']}>
        <Routes>
          <Route path="/play/sesion" element={<CancionOffer table={7} onLater={() => {}} />} />
          <Route path="/play/cancion/:table" element={<p>Canción del 7</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('¿Cantamos la del 7?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cantar la del 7' }))
    expect(screen.getByText('Canción del 7')).toBeInTheDocument()
  })

  it('«Ahora no» calls onLater', () => {
    const onLater = vi.fn()
    render(<MemoryRouter><CancionOffer table={8} onLater={onLater} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(onLater).toHaveBeenCalled()
  })
})
