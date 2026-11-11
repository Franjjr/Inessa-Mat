import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ getPersistenceState: vi.fn() }))
vi.mock('@/data', () => data)

import { PersistenceNotice } from './PersistenceNotice'

const WARNING = 'Este navegador podría borrar el progreso si se queda sin espacio. Si puedes, añade la app a la pantalla de inicio.'

beforeEach(() => data.getPersistenceState.mockReset())

describe('the adult notice about browser storage', () => {
  it('appears when the browser refused persistent storage', async () => {
    data.getPersistenceState.mockResolvedValue('denied')
    render(<PersistenceNotice />)
    expect(await screen.findByText(WARNING)).toBeInTheDocument()
  })

  it.each(['granted', 'unsupported', 'unknown'] as const)('stays hidden when the answer is %s', async (state) => {
    data.getPersistenceState.mockResolvedValue(state)
    render(<PersistenceNotice />)
    await vi.waitFor(() => expect(data.getPersistenceState).toHaveBeenCalled())
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
  })
})
