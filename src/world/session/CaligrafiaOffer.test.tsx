import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile } from '@/types'
import { CaligrafiaOffer } from './CaligrafiaOffer'

const child = (handwriting?: boolean): ChildProfile => ({
  id: 'c1', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'fox', name: 'Pipo', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language'], ...(handwriting === undefined ? {} : { handwriting }) },
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})

/** The pen is seen on this device (the forced flag) or not; the mode follows from it in the provider. */
function renderOffer(c: ChildProfile, penSeen: boolean, onLater = vi.fn()) {
  render(
    <InkProvider recognizer={scriptedRecognizer([])} penSeen={penSeen}>
      <MemoryRouter initialEntries={['/play/lengua']}>
        <Routes>
          <Route path="/play/lengua" element={<CaligrafiaOffer child={c} onLater={onLater} />} />
          <Route path="/play/caligrafia" element={<p>Practica de letra</p>} />
        </Routes>
      </MemoryRouter>
    </InkProvider>,
  )
  return onLater
}

describe('CaligrafiaOffer at the end of Lengua', () => {
  it('is shown when the pen was seen and the setting is on', () => {
    renderOffer(child(), true)
    expect(screen.getByText('¿Practicamos la letra con el lápiz? Son 5 minutos.')).toBeInTheDocument()
  })

  it('is not shown on a device where the pen was never used', () => {
    renderOffer(child(), false)
    expect(screen.queryByText('¿Practicamos la letra con el lápiz? Son 5 minutos.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Caligrafía (con lápiz)' })).toBeNull()
  })

  it('is not shown when the adult switched the handwriting off', () => {
    renderOffer(child(false), true)
    expect(screen.queryByText('¿Practicamos la letra con el lápiz? Son 5 minutos.')).toBeNull()
  })

  it('«Caligrafía (con lápiz)» goes to the practice', () => {
    renderOffer(child(), true)
    fireEvent.click(screen.getByRole('button', { name: 'Caligrafía (con lápiz)' }))
    expect(screen.getByText('Practica de letra')).toBeInTheDocument()
  })

  it('«Ahora no» leaves the offer for the home', () => {
    const onLater = renderOffer(child(), true)
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(onLater).toHaveBeenCalledTimes(1)
  })
})
