import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ getPersistenceState: vi.fn() }))
vi.mock('@/data', () => data)

import { PERSISTENCE_DISMISS_KEY, PersistenceNotice } from './PersistenceNotice'

const WARNING = 'Este navegador podría borrar el progreso si se queda sin espacio. Si puedes, añade la app a la pantalla de inicio.'

beforeEach(() => {
  data.getPersistenceState.mockReset()
  window.localStorage.clear()
})

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

  it('«Entendido» hides it and it stays hidden on the next visit', async () => {
    data.getPersistenceState.mockResolvedValue('denied')
    const first = render(<PersistenceNotice />)
    fireEvent.click(await screen.findByRole('button', { name: 'Entendido' }))
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
    first.unmount()
    render(<PersistenceNotice />)
    await vi.waitFor(() => expect(data.getPersistenceState).toHaveBeenCalledTimes(2))
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
  })

  it('comes back after 30 days if the browser still refuses', async () => {
    data.getPersistenceState.mockResolvedValue('denied')
    window.localStorage.setItem(PERSISTENCE_DISMISS_KEY, String(Date.now() - 31 * 24 * 60 * 60 * 1000))
    render(<PersistenceNotice />)
    expect(await screen.findByText(WARNING)).toBeInTheDocument()
  })

  it('still shows (and does not crash) when localStorage is blocked', async () => {
    data.getPersistenceState.mockResolvedValue('denied')
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    render(<PersistenceNotice />)
    expect(await screen.findByText(WARNING)).toBeInTheDocument()
    spy.mockRestore()
  })
})
