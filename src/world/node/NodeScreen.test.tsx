import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { applyNodeResult, season1, unlockThroughWorld } from '@/content'
import { createChild, updateProgress, useActiveChild } from '@/data'
import { flushTimers, useLocalOnlyAuth } from '../host/testing'
import NodeScreen from './NodeScreen'

// Each playing component is replaced by a stub that names its kind, so the test checks the dispatch only.
// The activities index also loads the lesson module, which another agent is still building. These tests only need
// the host context and stubs for the two players, so the index is replaced here.
vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  return {
    ActivityHostProvider: host.ActivityHostProvider,
    useActivityHost: host.useActivityHost,
    defaultActivityHost: host.defaultActivityHost,
    ActivityRunner: ({ config }: { config: { kind: string } }) => createElement('div', { 'data-testid': 'activity' }, config.kind),
    LessonPlayer: ({ lesson }: { lesson: { id: string } }) => createElement('div', { 'data-testid': 'lesson' }, lesson.id),
  }
})
vi.mock('@/world/story/StoryPlayer', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ story }: { story: { id: string } }) => createElement('div', { 'data-testid': 'story' }, story.id),
  }
})
vi.mock('@/world/guardian/GuardianChallenge', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ guardian }: { guardian: { id: string } }) => createElement('div', { 'data-testid': 'guardian' }, guardian.id),
  }
})
vi.mock('@/world/review/DailyReview', async () => {
  const { createElement } = await import('react')
  return { default: () => createElement('div', { 'data-testid': 'review' }, 'review') }
})
vi.mock('@/world/rewards/RewardOverlay', async () => {
  const { createElement } = await import('react')
  return { default: () => createElement('div', { 'data-testid': 'reward' }, 'reward') }
})

/** Unlocks worlds up to `worldId` and marks every non-guardian node of those worlds as done. */
async function markWorldDone(childId: string, worldId: string) {
  const index = season1.worlds.find((w) => w.id === worldId)!.index
  await updateProgress(childId, (p) => unlockThroughWorld(p, worldId))
  for (const w of season1.worlds.filter((x) => x.index <= index)) {
    await updateProgress(childId, (p) => {
      let next = p
      for (const n of w.nodes) {
        if (n.kind === 'guardian' || n.kind === 'review') continue
        next = applyNodeResult(next, w.id, n.id, { stars: 3, passed: true })
      }
      return next
    })
  }
}

let counter = 0

async function renderNode(worldId: string, nodeId: string, prepare?: (childId: string) => Promise<void>) {
  counter += 1
  const child = await createChild({
    nickname: `Nodo${counter}`,
    gender: 'n',
    companion: { species: 'fox', name: 'Canela', gender: 'n', colorway: 'default', equipped: [] },
  })
  if (prepare) await prepare(child.id)

  let activate: ((id: string | null) => void) | null = null
  function Probe() {
    const { setActiveChild } = useActiveChild()
    useEffect(() => { activate = setActiveChild })
    return null
  }
  const probe = render(<Probe />)
  await waitFor(() => expect(activate).not.toBeNull())
  activate!(child.id)
  await flushTimers(40)
  probe.unmount()

  return render(
    <MemoryRouter initialEntries={[`/play/w/${worldId}/${nodeId}`]}>
      <Routes>
        <Route path="/play/w/:worldId/:nodeId" element={<NodeScreen />} />
        <Route path="/play/w/:worldId" element={<div>MAP</div>} />
        <Route path="/play" element={<div>HOME</div>} />
        <Route path="/kids" element={<div>KIDS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NodeScreen dispatch', () => {
  useLocalOnlyAuth()

  it('plays a story node with StoryPlayer', async () => {
    await renderNode('w1', 'arrival')
    expect(await screen.findByTestId('story')).toHaveTextContent('w1-arrival')
  })

  it('plays a lesson node with LessonPlayer', async () => {
    await renderNode('w1', 'lesson-groups', (id) => markWorldDone(id, 'w1'))
    expect(await screen.findByTestId('lesson')).toHaveTextContent('w1-groups')
  })

  it('plays an activity node with ActivityRunner', async () => {
    await renderNode('w1', 'groups', (id) => markWorldDone(id, 'w1'))
    expect(await screen.findByTestId('activity')).toHaveTextContent('groups')
  })

  it('plays a guardian node with GuardianChallenge', async () => {
    await renderNode('w1', 'guardian', (id) => markWorldDone(id, 'w1'))
    expect(await screen.findByTestId('guardian')).toHaveTextContent('w1-guardian')
  })

  it('plays a review node with DailyReview', async () => {
    await renderNode('w7', 'review', (id) => markWorldDone(id, 'w7'))
    expect(await screen.findByTestId('review')).toBeInTheDocument()
  })

  it('sends a locked node back to the map', async () => {
    await renderNode('w1', 'guardian')
    expect(await screen.findByText('MAP')).toBeInTheDocument()
  })
})
