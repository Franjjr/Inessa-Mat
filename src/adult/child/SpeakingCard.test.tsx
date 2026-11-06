/* The adult switch «Hablar en voz alta (micrófono)»: only with English on, off by default, and on only after the adult confirms. */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile, SubjectId } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'

const updateChild = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock('@/data', () => ({ updateChild }))

import { SpeakingCard } from './SpeakingCard'

const child = (subjects: SubjectId[], speaking?: ChildProfile['settings']['speaking']): ChildProfile => ({
  id: 'c-speak', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects, ...(speaking ? { speaking } : {}) },
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
})

const sw = () => screen.getByRole('switch', { name: 'Hablar en voz alta (micrófono)' })
const dialog = () => screen.queryByRole('dialog')

beforeEach(() => updateChild.mockClear())

describe('SpeakingCard', () => {
  it('is hidden when English is off', () => {
    render(<SpeakingCard child={child(['math', 'language'])} />)
    expect(screen.queryByRole('switch', { name: 'Hablar en voz alta (micrófono)' })).toBeNull()
  })

  it('is off by default when English is on', () => {
    render(<SpeakingCard child={child(['math', 'english'])} />)
    expect(sw()).toHaveAttribute('aria-checked', 'false')
  })

  it('turning it on without confirming leaves it off and writes nothing', () => {
    render(<SpeakingCard child={child(['math', 'english'])} />)
    fireEvent.click(sw())
    const d = within(dialog()!)
    expect(d.getByText(/Microsoft Azure/)).toBeTruthy()
    fireEvent.click(d.getByRole('button', { name: 'Cancelar' }))
    expect(dialog()).toBeNull()
    expect(sw()).toHaveAttribute('aria-checked', 'false')
    expect(updateChild).not.toHaveBeenCalled()
  })

  it('confirming with «Activar» sets on and consentAt, keeping the other settings', async () => {
    render(<SpeakingCard child={child(['math', 'english'])} />)
    fireEvent.click(sw())
    fireEvent.click(within(dialog()!).getByRole('button', { name: 'Activar' }))
    await waitFor(() => expect(updateChild).toHaveBeenCalledTimes(1))
    const [id, patch] = updateChild.mock.calls[0] as unknown as [string, { settings: ChildProfile['settings'] }]
    expect(id).toBe('c-speak')
    expect(patch.settings.speaking?.on).toBe(true)
    expect(patch.settings.speaking?.consentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(patch.settings.subjects).toEqual(['math', 'english'])
  })

  it('turning it off clears on and keeps the consent date, without asking again', async () => {
    render(<SpeakingCard child={child(['english'], { on: true, consentAt: '2026-11-01T09:00:00.000Z' })} />)
    expect(sw()).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(sw())
    expect(dialog()).toBeNull()
    await waitFor(() => expect(updateChild).toHaveBeenCalledTimes(1))
    const [, patch] = updateChild.mock.calls[0] as unknown as [string, { settings: ChildProfile['settings'] }]
    expect(patch.settings.speaking).toEqual({ on: false, consentAt: '2026-11-01T09:00:00.000Z' })
  })

  it('turning it on again after switching off asks for confirmation again', () => {
    render(<SpeakingCard child={child(['english'], { on: false, consentAt: '2026-11-01T09:00:00.000Z' })} />)
    fireEvent.click(sw())
    expect(dialog()).not.toBeNull()
    expect(updateChild).not.toHaveBeenCalled()
  })

  it('the switch is disabled while the save is pending, so a second tap cannot write twice', async () => {
    let finish: () => void = () => {}
    updateChild.mockImplementationOnce(() => new Promise<undefined>((resolve) => { finish = () => resolve(undefined) }))
    render(<SpeakingCard child={child(['english'])} />)
    fireEvent.click(sw())
    fireEvent.click(within(dialog()!).getByRole('button', { name: 'Activar' }))
    await waitFor(() => expect(sw().hasAttribute('disabled')).toBe(true))
    fireEvent.click(sw())
    expect(updateChild).toHaveBeenCalledTimes(1)
    finish()
    await waitFor(() => expect(sw().hasAttribute('disabled')).toBe(false))
  })

  it('the confirmation says what the microphone is for, where the audio goes and who can turn it off', () => {
    render(<SpeakingCard child={child(['english'])} />)
    fireEvent.click(sw())
    const text = dialog()!.textContent ?? ''
    expect(text).toMatch(/puntuar cómo .* pronuncia/)
    expect(text).toMatch(/Irlanda/)
    expect(text).toMatch(/Unión Europea/)
    expect(text).toMatch(/Repasitos no guarda el audio/)
    expect(text).toMatch(/[Ss]olo un adulto puede activarlo/)
    expect(text).toMatch(/en cualquier momento/)
    expect(text).toMatch(/nunca bloquea/)
    expect(text).toMatch(/10 intentos/)
  })
})
