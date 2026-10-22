/* Test fixtures shared by world-meta tests (not used by the app). */
import { initialProgress } from '@/content'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type ProgressState } from '@/types'

export const CHILD_ID = 'child-test-1'

export function makeChild(overrides: Partial<ChildProfile> = {}): ChildProfile {
  return {
    id: CHILD_ID,
    orgId: null,
    nickname: 'Inessa',
    gender: 'f',
    companion: { species: 'cat', name: 'Bigotes', gender: 'm', colorway: 'default', equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS },
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  }
}

/** Progress with the given world crystals won (letters come from content). */
export function progressWithCrystals(worldIds: string[], extra: Partial<ProgressState> = {}): ProgressState {
  const base = initialProgress(CHILD_ID, new Date('2026-10-01T10:00:00.000Z'))
  const worlds = { ...base.worlds }
  for (const id of worldIds) {
    worlds[id] = { ...(worlds[id] ?? { unlocked: true, nodes: {}, crystal: false }), unlocked: true, crystal: true }
  }
  return { ...base, worlds, ...extra }
}
