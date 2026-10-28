import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile } from '@/types'

const updateChild = vi.hoisted(() => vi.fn(async () => ({})))
vi.mock('@/data', () => ({ updateChild }))

import { ChildSettingsCard } from './ChildSettingsCard'

const renderCard = (c: ChildProfile) => render(<MemoryRouter><ChildSettingsCard child={c} /></MemoryRouter>)

const child = (settings: Partial<ChildProfile['settings']> = {}): ChildProfile => ({
  id: 'c1', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'fox', name: 'Pipo', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, ...settings },
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})

beforeEach(() => updateChild.mockClear())

describe('the adult switch «Caligrafía con lápiz»', () => {
  it('has a link under the switch to the trial page of the grading', () => {
    renderCard(child())
    const link = screen.getByRole('link', { name: 'Probar la nota de caligrafía' })
    expect(link).toHaveAttribute('href', '/adult/caligrafia-ensayo')
  })

  it('is on by default and switching it off writes settings.handwriting', () => {
    renderCard(child())
    const sw = screen.getByRole('switch', { name: 'Caligrafía con lápiz' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(sw)
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ handwriting: false }) })
  })

  it('is on for a profile saved before the setting existed, and switching it on writes true', () => {
    const old = child()
    delete (old.settings as Partial<ChildProfile['settings']>).handwriting
    renderCard(old)
    const sw = screen.getByRole('switch', { name: 'Caligrafía con lápiz' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('shows off when the setting is false, and switching it on writes true', () => {
    renderCard(child({ handwriting: false }))
    const sw = screen.getByRole('switch', { name: 'Caligrafía con lápiz' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(sw)
    expect(updateChild).toHaveBeenCalledWith('c1', { settings: expect.objectContaining({ handwriting: true }) })
  })
})
