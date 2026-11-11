import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { applyNodeResult, season1, unlockThroughWorld } from '@/content'
import { createChild, getProgress, updateProgress, useActiveChild } from '@/data'
import { flushTimers, useLocalOnlyAuth } from '../host/testing'
import NodeScreen from './NodeScreen'

// Each playing component is replaced by a stub that names its kind, so the test checks the dispatch only.
// The activities index also loads the lesson module, which another agent is still building. These tests only need
// the host context and stubs for the two players, so the index is replaced here.
// The activity's result is set by each test: a button «Terminar» ends the activity with it.
const activityResult = vi.hoisted(() => ({ value: { correct: 6, total: 6, stars: 3, ms: 1000 } as { correct: number; total: number; stars: 0 | 1 | 2 | 3; ms: number } }))

vi.mock('@/activities', async () => {
  const host = await import('@/activities/host')
  const { createElement } = await import('react')
  return {
    ActivityHostProvider: host.ActivityHostProvider,
    useActivityHost: host.useActivityHost,
    defaultActivityHost: host.defaultActivityHost,
    ActivityRunner: ({ config, onDone }: { config: { kind: string }; onDone: (r: unknown) => void }) =>
      createElement('div', { 'data-testid': 'activity' }, config.kind, createElement('button', { type: 'button', onClick: () => onDone(activityResult.value) }, 'Terminar actividad')),
    LessonPlayer: ({ lesson }: { lesson: { id: string } }) => createElement('div', { 'data-testid': 'lesson' }, lesson.id),
  }
})
vi.mock('@/world/story/StoryPlayer', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ story, onDone, onSkip }: { story: { id: string }; onDone: () => void; onSkip?: () => void }) =>
      createElement(
        'div',
        { 'data-testid': 'story' },
        story.id,
        createElement('button', { type: 'button', onClick: onDone }, 'Terminar historia'),
        createElement('button', { type: 'button', onClick: onSkip ?? onDone }, 'Saltar'),
      ),
  }
})
vi.mock('@/world/guardian/GuardianChallenge', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ guardian, onPass }: { guardian: { id: string }; onPass: (r: unknown) => void }) =>
      createElement(
        'div',
        { 'data-testid': 'guardian' },
        guardian.id,
        createElement('button', { type: 'button', onClick: () => onPass({ correct: 6, total: 6, letter: 'X' }) }, 'Ganar guardián'),
      ),
  }
})
vi.mock('@/world/review/DailyReview', async () => {
  const { createElement } = await import('react')
  return { default: () => createElement('div', { 'data-testid': 'review' }, 'review') }
})
vi.mock('@/world/rewards/RewardOverlay', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ stars, bestStars, improved }: { stars: number; bestStars?: number; improved?: boolean }) =>
      createElement('div', { 'data-testid': 'reward' }, `esta vez ${stars} · mejor ${bestStars ?? '-'} · ${improved ? 'mejorado' : 'sin mejora'}`),
  }
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
    gender: 'm',
    companion: { species: 'fox', name: 'Canela', gender: 'm', colorway: 'default', equipped: [] },
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

  return Object.assign(
    render(
      <MemoryRouter initialEntries={[`/play/w/${worldId}/${nodeId}`]}>
        <Routes>
          <Route path="/play/w/:worldId/:nodeId" element={<NodeScreen />} />
          <Route path="/play/w/:worldId" element={<div>MAP</div>} />
          <Route path="/play" element={<div>HOME</div>} />
          <Route path="/kids" element={<div>KIDS</div>} />
        </Routes>
      </MemoryRouter>,
    ),
    { childId: child.id },
  )
}

/** Unlocks the world and gives every node before `nodeId` 3 stars, then `nodeId` the best `stars` (its previous best). */
async function bestBefore(childId: string, worldId: string, nodeId: string, stars: number) {
  await updateProgress(childId, (p) => {
    const w = season1.worlds.find((x) => x.id === worldId)!
    let next = unlockThroughWorld(p, worldId)
    for (const n of w.nodes.slice(0, w.nodes.findIndex((x) => x.id === nodeId))) {
      next = applyNodeResult(next, worldId, n.id, { stars: 3, passed: true })
    }
    return applyNodeResult(next, worldId, nodeId, { stars, passed: true })
  })
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

describe('NodeScreen rewards and passing', () => {
  useLocalOnlyAuth()

  it('shows this attempt next to the best kept, and says «mejorado» only when the best rises', async () => {
    const { findByTestId } = await renderNode('w1', 'groups', (id) => bestBefore(id, 'w1', 'groups', 1))
    activityResult.value = { correct: 6, total: 6, stars: 3, ms: 900 }
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar actividad' }))
    expect(await findByTestId('reward')).toHaveTextContent('esta vez 3 · mejor 3 · mejorado')
  })

  it('keeps the best when this attempt is lower, and does not celebrate it', async () => {
    const { findByTestId } = await renderNode('w1', 'groups', (id) => bestBefore(id, 'w1', 'groups', 3))
    activityResult.value = { correct: 5, total: 6, stars: 2, ms: 900 }
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar actividad' }))
    expect(await findByTestId('reward')).toHaveTextContent('esta vez 2 · mejor 3 · sin mejora')
  })

  it('below 80 % shows how many were right, saves nothing and offers the review and the retry', async () => {
    const { childId } = await renderNode('w1', 'groups', (id) => markWorldDone(id, 'w1'))
    // markWorldDone gives every node 3 stars: use a node that is not yet done instead.
    await updateProgress(childId, (p) => ({ ...p, worlds: { ...p.worlds, w1: { ...p.worlds.w1, nodes: { ...p.worlds.w1.nodes, groups: { done: false, stars: 0 } } } } }))
    activityResult.value = { correct: 4, total: 6, stars: 1, ms: 900 }
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar actividad' }))

    expect(await screen.findByText(/Has acertado 4 de 6/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Repasar con Lumi' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Seguir por ahora' })).not.toBeInTheDocument()
    const after = await getProgress(childId)
    expect(after.worlds.w1.nodes.groups?.done).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Volver a intentarlo' }))
    expect(await screen.findByTestId('activity')).toBeInTheDocument()
  })

  it('after several tries below the mark, the child may move on', async () => {
    const { childId } = await renderNode('w1', 'groups', (id) => markWorldDone(id, 'w1'))
    await updateProgress(childId, (p) => ({ ...p, worlds: { ...p.worlds, w1: { ...p.worlds.w1, nodes: { ...p.worlds.w1.nodes, groups: { done: false, stars: 0 } } } } }))
    activityResult.value = { correct: 4, total: 6, stars: 1, ms: 900 }
    for (let i = 0; i < 3; i++) {
      await userEvent.click(await screen.findByRole('button', { name: 'Terminar actividad' }))
      if (i < 2) await userEvent.click(await screen.findByRole('button', { name: 'Volver a intentarlo' }))
    }
    await userEvent.click(await screen.findByRole('button', { name: 'Seguir por ahora' }))
    expect(await screen.findByTestId('reward')).toBeInTheDocument()
    expect((await getProgress(childId)).worlds.w1.nodes.groups).toMatchObject({ done: true })
  })

  it('reading a story gives one star at most; skipping it gives none and goes back to the map', async () => {
    const { childId } = await renderNode('w1', 'arrival')
    await userEvent.click(await screen.findByRole('button', { name: 'Saltar' }))
    expect(await screen.findByText('MAP')).toBeInTheDocument()
    expect(await getProgress(childId)).toMatchObject({ stars: 0, worlds: { w1: { nodes: { arrival: { done: true, stars: 0 } } } } })
  })

  it('reading a story to the end gives its one star and the reward', async () => {
    await renderNode('w1', 'arrival')
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar historia' }))
    expect(await screen.findByTestId('reward')).toHaveTextContent('esta vez 1')
  })
})

describe('NodeScreen finale of the 3.º adventure', () => {
  useLocalOnlyAuth()

  it('after the last guardian, offers «Enséñale a Borrón» before the season reward, and can be skipped', async () => {
    await renderNode('w8', 'guardian', (id) => markWorldDone(id, 'w8'))
    await userEvent.click(await screen.findByRole('button', { name: 'Ganar guardián' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar historia' })) // the rescue
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar historia' })) // the finale
    expect(await screen.findByText('Borrón quiere aprender. ¿Le enseñas un truco?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(await screen.findByTestId('reward')).toHaveTextContent('esta vez 3')
  })

  it('plays the teach-back game when the child accepts it', async () => {
    await renderNode('w8', 'guardian', (id) => markWorldDone(id, 'w8'))
    await userEvent.click(await screen.findByRole('button', { name: 'Ganar guardián' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar historia' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar historia' }))
    await userEvent.click(await screen.findByRole('button', { name: '¡Sí, enséñale!' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar actividad' }))
    expect(await screen.findByTestId('reward')).toBeInTheDocument()
  })
})

