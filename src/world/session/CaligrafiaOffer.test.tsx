import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'
import { CaligrafiaOffer } from './CaligrafiaOffer'

/** Renders the offer as the Lengua end does: the decision is made by the screen, the card only shows the two actions. */
function renderOffer(onLater = vi.fn()) {
  render(
    <InkProvider recognizer={scriptedRecognizer([])}>
      <MemoryRouter initialEntries={['/play/lengua']}>
        <Routes>
          <Route path="/play/lengua" element={<CaligrafiaOffer onLater={onLater} />} />
          <Route path="/play/caligrafia" element={<p>Practica de letra</p>} />
        </Routes>
      </MemoryRouter>
    </InkProvider>,
  )
  return onLater
}

describe('CaligrafiaOffer at the end of Lengua', () => {
  it('shows the question and the two actions', () => {
    renderOffer()
    expect(screen.getByText('¿Practicamos la letra con el lápiz? Son 5 minutos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Caligrafía (con lápiz)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ahora no' })).toBeInTheDocument()
  })

  it('«Caligrafía (con lápiz)» goes to the practice', () => {
    renderOffer()
    fireEvent.click(screen.getByRole('button', { name: 'Caligrafía (con lápiz)' }))
    expect(screen.getByText('Practica de letra')).toBeInTheDocument()
  })

  it('«Ahora no» leaves the offer for the home', () => {
    const onLater = renderOffer()
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(onLater).toHaveBeenCalledTimes(1)
  })
})
