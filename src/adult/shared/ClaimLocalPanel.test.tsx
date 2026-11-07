/* Saving this device's profiles into the account: a profile whose name the account already has is left unticked, so the
   same child is not saved twice. */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChildProfile } from '@/types'

const data = vi.hoisted(() => ({ useAuth: vi.fn(), useChildren: vi.fn() }))
vi.mock('@/data', () => data)
vi.mock('@/ui', async (orig) => ({ ...(await orig<typeof import('@/ui')>()), toast: vi.fn() }))

import { ClaimLocalPanel } from './ClaimLocalPanel'

const kid = (id: string, nickname: string, orgId: string | null) => ({ id, nickname, orgId }) as ChildProfile
const ORG = { id: 'org-1', name: 'Familia Julián' }

beforeEach(() => vi.clearAllMocks())

function setup(children: ChildProfile[]) {
  const claimLocalData = vi.fn().mockResolvedValue({ children: 1 })
  data.useAuth.mockReturnValue({ status: 'signed-in', activeOrg: ORG, claimLocalData })
  data.useChildren.mockReturnValue(children)
  render(<ClaimLocalPanel />)
  return claimLocalData
}

describe('ClaimLocalPanel', () => {
  it('a profile the account already has (same name) is unticked and only the others are saved', async () => {
    const claim = setup([kid('local-lia', 'Lía', null), kid('local-leo', 'Leo', null), kid('cloud-lia', 'lía ', 'org-1')])
    expect(screen.getByRole('checkbox', { name: /Lía/ })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Leo/ })).toBeChecked()
    expect(screen.getByText(/se duplicaría/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardarlo en mi cuenta' }))
    await waitFor(() => expect(claim).toHaveBeenCalledWith(['local-leo']))
  })

  it('with only the same child, nothing is saved until the adult ticks it', () => {
    setup([kid('local-lia', 'Lía', null), kid('cloud-lia', 'Lía', 'org-1')])
    const save = screen.getByRole('button', { name: /Guardar/ })
    expect(save).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /Lía/ }))
    expect(screen.getByRole('button', { name: 'Guardarlo en mi cuenta' })).toBeEnabled()
  })

  it('without a profile of the same name there is no list and every profile is saved', async () => {
    const claim = setup([kid('local-lia', 'Lía', null), kid('local-leo', 'Leo', null)])
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardarlos en mi cuenta' }))
    await waitFor(() => expect(claim).toHaveBeenCalledWith(['local-lia', 'local-leo']))
  })
})
