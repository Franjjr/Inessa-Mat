import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressState, Reward } from '@/types'
import { progressWithCrystals } from '@/world/rewards/testing'
import ChestScreen from './ChestScreen'

vi.mock('@/fx', () => ({ celebrate: vi.fn(), stopCelebrations: vi.fn() }))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, music: { play: vi.fn() } }))

const state = vi.hoisted(() => ({
  progress: null as ProgressState | null,
  rewards: [] as Reward[],
}))

vi.mock('@/data', () => ({
  useActiveChild: () => ({
    child: { id: 'child-test-1', nickname: 'Inessa', gender: 'f', companion: { species: 'cat', name: 'Bigotes', gender: 'm', colorway: 'default', equipped: [] } },
    loading: false,
    setActiveChild: () => {},
  }),
  useProgress: () => state.progress ?? undefined,
  getRewards: vi.fn(async () => state.rewards.map((r) => ({ ...r }))),
  markRewardUnlocked: vi.fn(async (id: string) => {
    state.rewards = state.rewards.map((r) => (r.id === id ? { ...r, unlockedAt: '2026-10-22T10:00:00.000Z' } : r))
  }),
  markRewardClaimed: vi.fn(async (id: string) => {
    state.rewards = state.rewards.map((r) => (r.id === id ? { ...r, claimedAt: '2026-10-22T11:00:00.000Z' } : r))
  }),
  updateProgress: vi.fn(async (_id: string, updater: (p: ProgressState) => ProgressState) => {
    state.progress = updater(structuredClone(state.progress!))
    return state.progress
  }),
}))

import * as data from '@/data'

const chestReward: Reward = { id: 'r1', childId: 'child-test-1', kind: 'chest', title: 'Una tarde de cine contigo', description: null, createdBy: null }

function renderChest() {
  return render(
    <MemoryRouter>
      <ChestScreen />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  state.rewards = [{ ...chestReward }]
  state.progress = progressWithCrystals(['w1', 'w2', 'w3'])
})

describe('ChestScreen', () => {
  it('is locked until all 8 crystals are collected: no prize shown, nothing marked', async () => {
    renderChest()
    expect(await screen.findByText(/Cada cristal te da una letra/)).toBeInTheDocument()
    expect(screen.queryByText('Una tarde de cine contigo')).not.toBeInTheDocument()
    expect(data.markRewardUnlocked).not.toHaveBeenCalled()
    expect(data.updateProgress).not.toHaveBeenCalled()
  })

  it('opens with 8 crystals: shows the adult prize and the secret word, and records the opening once', async () => {
    state.progress = progressWithCrystals(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'])
    renderChest()

    expect(await screen.findByText('Una tarde de cine contigo')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Palabra secreta: VALIENTE' })).toBeInTheDocument()
    await waitFor(() => expect(data.markRewardUnlocked).toHaveBeenCalledWith('r1'))
    await waitFor(() => expect(data.updateProgress).toHaveBeenCalledTimes(1))
    expect(state.progress!.chestOpened).toBe(true)
  })

  it('only the adult marks the prize as delivered: the child is told to ask for it', async () => {
    state.progress = progressWithCrystals(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'])
    renderChest()

    expect(await screen.findByText('¡Te lo has ganado! Pídeselo a tu familia.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /premio/ })).toBeNull()
    expect(data.markRewardClaimed).not.toHaveBeenCalled()
  })
})
