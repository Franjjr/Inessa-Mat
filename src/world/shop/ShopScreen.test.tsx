import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeChild, progressWithCrystals } from '@/world/rewards/testing'
import type { ChildProfile, ProgressState } from '@/types'
import ShopScreen from './ShopScreen'

const state = vi.hoisted(() => ({
  child: null as ChildProfile | null,
  progress: null as ProgressState | null,
}))

vi.mock('@/data', () => ({
  useActiveChild: () => ({ child: state.child, loading: false, setActiveChild: () => {} }),
  useProgress: () => state.progress ?? undefined,
  updateChild: vi.fn(async (_id: string, patch: Partial<ChildProfile>) => ({ ...state.child!, ...patch })),
  updateProgress: vi.fn(async (_id: string, updater: (p: ProgressState) => ProgressState) => {
    state.progress = updater(structuredClone(state.progress!))
    return state.progress
  }),
}))

vi.mock('@/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/ui')>()
  return { ...actual, toast: vi.fn() }
})

import * as data from '@/data'

function renderShop() {
  return render(
    <MemoryRouter>
      <ShopScreen />
    </MemoryRouter>,
  )
}

function card(name: string) {
  const grid = screen.getByRole('region', { name: 'Accesorios' })
  return within(grid).getByRole('button', { name: new RegExp(`^${name}`) })
}

beforeEach(() => {
  vi.clearAllMocks()
  state.child = makeChild()
  state.progress = { ...progressWithCrystals([]), stars: 20, starsSpent: 0 }
})

describe('ShopScreen', () => {
  it('buying asks first, then spends the stars and saves the purchase', async () => {
    const user = userEvent.setup()
    renderShop()

    await user.click(card('Gorra'))
    await user.click(screen.getByRole('button', { name: 'Comprar por 8 estrellas' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, comprar' }))

    expect(data.updateProgress).toHaveBeenCalledTimes(1)
    expect(state.progress!.starsSpent).toBe(8)
    expect(state.progress!.accessoriesOwned).toContain('cap')
  })

  it('cancelling the question spends nothing', async () => {
    const user = userEvent.setup()
    renderShop()

    await user.click(card('Gorra'))
    await user.click(screen.getByRole('button', { name: 'Comprar por 8 estrellas' }))
    await user.click(await screen.findByRole('button', { name: 'Ahora no' }))

    expect(data.updateProgress).not.toHaveBeenCalled()
    expect(state.progress!.starsSpent).toBe(0)
  })

  it('equips an owned accessory and saves it on the companion', async () => {
    state.progress = { ...state.progress!, accessoriesOwned: ['bow'], starsSpent: 6 }
    const user = userEvent.setup()
    renderShop()

    await user.click(card('Lazo'))
    await user.click(screen.getByRole('button', { name: 'Ponérselo' }))

    expect(data.updateChild).toHaveBeenCalledWith(state.child!.id, {
      companion: expect.objectContaining({ equipped: ['bow'] }),
    })
  })

  it('takes a worn accessory off and saves that too', async () => {
    state.child = makeChild({ companion: { ...makeChild().companion, equipped: ['bow'] } })
    state.progress = { ...state.progress!, accessoriesOwned: ['bow'], starsSpent: 6 }
    const user = userEvent.setup()
    renderShop()

    await user.click(card('Lazo'))
    await user.click(screen.getByRole('button', { name: 'Quitárselo' }))

    expect(data.updateChild).toHaveBeenCalledWith(state.child!.id, {
      companion: expect.objectContaining({ equipped: [] }),
    })
  })

  it('a locked accessory cannot be bought and says which crystal unlocks it', async () => {
    const user = userEvent.setup()
    renderShop()

    await user.click(card('Corona real'))
    expect(screen.queryByRole('button', { name: /Comprar por/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Gana el cristal/)).toBeInTheDocument()
  })
})
