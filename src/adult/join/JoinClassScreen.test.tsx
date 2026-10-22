import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile, ClassRoom } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'

const data = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useChildren: vi.fn(),
  joinClassWithCode: vi.fn(),
  listClassesForChild: vi.fn(),
}))
vi.mock('@/data', () => data)

import JoinClassScreen from './JoinClassScreen'
import { cleanClassCode, validateJoin } from './joinValidation'

const CHILD: ChildProfile = {
  id: 'c1',
  orgId: 'org-family',
  nickname: 'Lucía',
  gender: 'f',
  companion: { species: 'bunny', name: 'Copo', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const ROOM: ClassRoom = {
  id: 'room1',
  orgId: 'org-school',
  name: '3ºB',
  grade: 3,
  joinCode: 'AB12CD',
  teacherId: 't1',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function renderJoin() {
  return render(
    <MemoryRouter>
      <JoinClassScreen />
    </MemoryRouter>,
  )
}

describe('joinValidation', () => {
  it('cleans codes typed with spaces or dashes', () => {
    expect(cleanClassCode(' ab-12 cd ')).toBe('AB12CD')
  })

  it('requires a 6-character code, a child and the consent', () => {
    expect(validateJoin({ code: 'AB12', childId: '', consent: false })).toEqual({
      code: expect.stringContaining('6 letras'),
      childId: expect.any(String),
      consent: expect.stringContaining('consentimiento'),
    })
    expect(validateJoin({ code: 'AB12CD', childId: 'c1', consent: true })).toEqual({})
  })
})

describe('JoinClassScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    data.useAuth.mockReturnValue({ status: 'signed-in', backendAvailable: true, activeOrg: { id: 'org-family', kind: 'family', name: 'Familia' } })
    data.useChildren.mockReturnValue([CHILD])
    data.listClassesForChild.mockResolvedValue([])
    data.joinClassWithCode.mockResolvedValue(ROOM)
  })

  it('does not join without the parent consent', async () => {
    renderJoin()
    fireEvent.change(screen.getByLabelText('Código de la clase'), { target: { value: 'ab12cd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unirse a la clase' }))

    expect(await screen.findByText(/Para unirlo a la clase necesitamos/)).toBeInTheDocument()
    expect(data.joinClassWithCode).not.toHaveBeenCalled()
  })

  it('links the child with the cleaned code once the parent consents', async () => {
    renderJoin()
    fireEvent.change(screen.getByLabelText('Código de la clase'), { target: { value: 'ab-12 cd' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Unirse a la clase' }))

    await waitFor(() => expect(data.joinClassWithCode).toHaveBeenCalledWith('AB12CD', 'c1'))
    expect(await screen.findByText(/Lucía ya está en 3ºB/)).toBeInTheDocument()
  })

  it('shows the server message when the code is not valid', async () => {
    data.joinClassWithCode.mockRejectedValue(Object.assign(new Error('Ese código de clase no existe o ya no está activo. Revisa las letras con el profe.'), { name: 'DataError' }))
    renderJoin()
    fireEvent.change(screen.getByLabelText('Código de la clase'), { target: { value: 'ZZ99ZZ' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Unirse a la clase' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese código de clase no existe')
  })

  it('asks for an account when signed out', () => {
    data.useAuth.mockReturnValue({ status: 'local-only', backendAvailable: true })
    renderJoin()
    expect(screen.getByText('Necesitas una cuenta de familia')).toBeInTheDocument()
  })
})
