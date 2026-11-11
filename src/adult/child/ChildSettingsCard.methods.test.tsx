/* The school methods in the child's settings: only pedir prestado / me llevo una and the galera with or without the
   subtractions, each with its notebook drawing and its sentence visible (no title tooltips); «La app decide» for the
   tables; and the question «¿Cómo resta … en el colegio?» while the grown-up has not answered it. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DIV_METHODS, SUB_METHODS, TABLE_METHODS } from '@/engine'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile } from '@/types'

const updateChild = vi.hoisted(() => vi.fn(async () => ({})))
vi.mock('@/data', () => ({ updateChild }))

import { ChildSettingsCard } from './ChildSettingsCard'

const renderCard = (c: ChildProfile) => render(<MemoryRouter><ChildSettingsCard child={c} /></MemoryRouter>)

const child = (settings: Partial<ChildProfile['settings']> = {}, grade = 3): ChildProfile => ({
  id: 'c1', orgId: null, nickname: 'Lía', gender: 'f', grade,
  companion: { species: 'fox', name: 'Pipo', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, ...settings },
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})

beforeEach(() => updateChild.mockClear())

describe('the school methods in the settings', () => {
  it('offers only the school methods, each with its drawing and its sentence visible; nothing hides in a title', () => {
    const { container } = renderCard(child({ schoolMethodAsked: true }))
    const sub = screen.getByRole('radiogroup', { name: 'Cómo resta en su colegio' })
    expect(within(sub).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Pedir prestado arriba', 'Me llevo una abajo'])
    const div = screen.getByRole('radiogroup', { name: 'Cómo divide en su colegio' })
    expect(within(div).getAllByRole('radio').map((r) => r.textContent)).toEqual(['La galera con restas', 'La galera sin restas'])
    for (const m of [...SUB_METHODS, ...DIV_METHODS]) expect(screen.getByText(m.notebook)).toBeTruthy()
    expect(within(sub).getAllByRole('img')).toHaveLength(2)
    expect(container.querySelectorAll('[title]')).toHaveLength(0)
    for (const m of [...SUB_METHODS, ...DIV_METHODS, ...TABLE_METHODS]) expect(container.innerHTML).not.toContain(`title="${m.summary}"`)
    expect(container.textContent).not.toMatch(/El niño puede cambiarlo|Saltos en la recta|Por partes|Multiplicar hacia arriba|Repartir por partes/)
  })

  it('an old profile with «saltos en la recta» shows pedir prestado as chosen', () => {
    renderCard(child({ subMethod: 'line', divMethod: 'climb', schoolMethodAsked: true }))
    expect(screen.getByRole('radio', { name: 'Pedir prestado arriba' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'La galera con restas' })).toHaveAttribute('aria-checked', 'true')
  })

  it('changing another setting keeps the old method as saved, so the start page can still tell once it was removed', () => {
    renderCard(child({ subMethod: 'line', divMethod: 'climb', schoolMethodAsked: true }))
    fireEvent.click(screen.getByLabelText('Casillas grandes para escribir'))
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ bigCells: true, subMethod: 'line', divMethod: 'climb' }) })
  })

  it('choosing me llevo una saves it and marks the question as answered', () => {
    renderCard(child({ schoolMethodAsked: true }))
    fireEvent.click(screen.getByRole('radio', { name: 'Me llevo una abajo' }))
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ subMethod: 'carry', schoolMethodAsked: true }) })
  })

  it('the tables have «La app decide»: it is chosen when there is no trick, and choosing it saves null', () => {
    renderCard(child({ tableMethod: 'double', schoolMethodAsked: true }))
    const appDecides = screen.getByRole('radio', { name: 'La app decide' })
    expect(appDecides).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(appDecides)
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ tableMethod: null }) })
  })

  it('«La app decide» is checked for a profile without a trick', () => {
    renderCard(child({ tableMethod: null, schoolMethodAsked: true }))
    expect(screen.getByRole('radio', { name: 'La app decide' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('the question «¿Cómo resta en el colegio?» in the settings', () => {
  it('shows for a child of 2.º or more who has no answer yet, and not for 1.º or once answered', () => {
    const { unmount } = renderCard(child({}, 2))
    expect(screen.getByText('¿Cómo resta Lía en el colegio cuando arriba hay menos?')).toBeTruthy()
    unmount()
    const first = renderCard(child({}, 1))
    expect(screen.queryByText(/¿Cómo resta Lía en el colegio/)).toBeNull()
    first.unmount()
    renderCard(child({ schoolMethodAsked: true }, 3))
    expect(screen.queryByText(/¿Cómo resta Lía en el colegio/)).toBeNull()
  })

  it('2.º: «Como en B» saves me llevo una and the answer at once', () => {
    renderCard(child({}, 2))
    fireEvent.click(screen.getByRole('button', { name: 'Como en B' }))
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ subMethod: 'carry', schoolMethodAsked: true }) })
  })

  it('3.º: after the subtraction it asks about the galera, then saves both', () => {
    renderCard(child({}, 3))
    fireEvent.click(screen.getByRole('button', { name: 'Como en A' }))
    expect(updateChild).not.toHaveBeenCalled()
    expect(screen.getByText(/¿Lía escribe las restas debajo de la galera o las hace de cabeza\?/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Como en B' }))
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ subMethod: 'borrow', divMethod: 'galera-short', schoolMethodAsked: true }) })
  })

  it('«Otro» keeps pedir prestado and explains that a correct answer always counts', () => {
    renderCard(child({}, 2))
    fireEvent.click(screen.getByRole('button', { name: 'Otro (ABN u otro método)' }))
    expect(screen.getByRole('status').textContent).toMatch(/pidiendo prestado.*Si la respuesta final está bien, siempre vale/)
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ subMethod: 'borrow', schoolMethodAsked: true }) })
  })
})
