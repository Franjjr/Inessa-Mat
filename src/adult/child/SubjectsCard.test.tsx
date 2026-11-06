/* The subjects card of a child: English is on offer to 3.º (or a child with no course), with its description; a child of
   another course sees it disabled. */
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChildProfile } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { SubjectsCard } from './SubjectsCard'

vi.mock('@/data', () => ({ updateChild: vi.fn(async () => undefined) }))

const child = (grade: number | undefined, subjects: ChildProfile['settings']['subjects']): ChildProfile => ({
  id: 'child-subjects', orgId: null, nickname: 'Lía', gender: 'f', grade,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects }, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
})

/** The row of a subject: its label and its switch. */
const rowOf = (name: string) => screen.getByText(name, { selector: 'span' }).parentElement!.parentElement as HTMLElement

describe('SubjectsCard: English', () => {
  it('a 3.º child can switch English on, with its description', () => {
    render(<SubjectsCard child={child(3, ['math'])} />)
    const row = within(rowOf('Inglés'))
    expect(row.getByText('Vocabulario, frases y números en inglés.')).toBeTruthy()
    expect(row.getByRole('switch').hasAttribute('disabled')).toBe(false)
  })

  it('a child with no course can switch English on too', () => {
    render(<SubjectsCard child={child(undefined, ['math'])} />)
    expect(within(rowOf('Inglés')).getByRole('switch').hasAttribute('disabled')).toBe(false)
  })

  it('a 4.º child sees English disabled, with «Pronto»', () => {
    render(<SubjectsCard child={child(4, ['math'])} />)
    const row = within(rowOf('Inglés'))
    expect(row.getByRole('switch').hasAttribute('disabled')).toBe(true)
    expect(row.getByText(/Pronto/)).toBeTruthy()
  })
})
