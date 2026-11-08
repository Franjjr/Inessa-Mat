import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CancionesSection } from './CancionesSection'

const renderIt = (grade: number | undefined, flags?: Record<string, boolean>) => render(
  <MemoryRouter initialEntries={['/play/free']}>
    <Routes>
      <Route path="/play/free" element={<CancionesSection grade={grade} flags={flags} />} />
      <Route path="/play/cancion/:table" element={<p>Canción</p>} />
    </Routes>
  </MemoryRouter>,
)

describe('CancionesSection', () => {
  it('2.º: five songs', () => {
    renderIt(2)
    expect(screen.getAllByRole('button', { name: /^La canción del \d+/ })).toHaveLength(5)
    expect(screen.getByRole('button', { name: /^La canción del 10/ })).toBeInTheDocument()
  })

  it('the stars come from the flags', () => {
    renderIt(3, { 'cancion:7:1': true, 'cancion:7:2': true })
    expect(screen.getByRole('button', { name: /^La canción del 7/ })).toHaveAccessibleName('La canción del 7, 2 de 3 estrellas')
  })

  it('a card opens its song', () => {
    renderIt(3)
    fireEvent.click(screen.getByRole('button', { name: /^La canción del 7/ }))
    expect(screen.getByText('Canción')).toBeInTheDocument()
  })
})
