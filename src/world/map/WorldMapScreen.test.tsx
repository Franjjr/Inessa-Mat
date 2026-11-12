import { cleanup, render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { applyNodeResult, season1, unlockThroughWorld } from '@/content'
import { useActiveChild, createChild, updateProgress } from '@/data'
import { flushTimers } from '@/data/__tests__/helpers'
import { useLocalOnlyAuth } from '../host/testing'
import WorldMapScreen from './WorldMapScreen'

// The companion's rescue is what the Predicament art receives: the test reads it from the last render.
const rescueSeen = vi.hoisted(() => ({ values: [] as number[] }))
vi.mock('@/art', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/art')>()
  const { createElement } = await import('react')
  return {
    ...actual,
    Predicament: ({ rescue, children }: { rescue: number; children?: unknown }) => {
      rescueSeen.values.push(rescue)
      return createElement('div', null, children as never)
    },
  }
})

vi.mock('motion/react', async () => {
  const { createElement, forwardRef } = await import('react')
  const cache = new Map<string, unknown>()
  const passthrough = (tag: string) => {
    if (!cache.has(tag)) {
      cache.set(tag, forwardRef<HTMLElement, Record<string, unknown>>(
        ({ initial: _i, animate: _a, exit: _e, transition: _t, ...rest }, ref) => createElement(tag, { ...rest, ref }),
      ))
    }
    return cache.get(tag)
  }
  return {
    motion: new Proxy({}, { get: (_target, tag: string) => passthrough(tag) }),
    AnimatePresence: ({ children }: { children: unknown }) => children,
    MotionConfig: ({ children }: { children: unknown }) => children,
  }
})

let activate: ((id: string | null) => void) | null = null
function Probe() {
  const { setActiveChild } = useActiveChild()
  useEffect(() => { activate = setActiveChild })
  return null
}

async function childAt(worldId: string) {
  const child = await createChild({
    nickname: `Mapa ${Math.random().toString(36).slice(2, 7)}`,
    gender: 'f',
    companion: { species: 'bunny', name: 'Nube', gender: 'f', colorway: 'mint', equipped: [] },
  })
  const probe = render(<Probe />)
  await waitFor(() => expect(activate).not.toBeNull())
  activate!(child.id)
  await flushTimers(40)
  probe.unmount()
  return { child, worldId }
}

function renderMap(worldId: string) {
  return render(
    <MemoryRouter initialEntries={[`/play/w/${worldId}`]}>
      <Routes>
        <Route path="/play/w/:worldId" element={<WorldMapScreen />} />
        <Route path="/play/w/:worldId/:nodeId" element={<div>NODE</div>} />
        <Route path="/play" element={<div>HOME</div>} />
        <Route path="/kids" element={<div>KIDS</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** The node buttons are plain buttons whose accessible name carries the lock and current state. */
function nodeLabels(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('button[aria-label]')).map((b) => b.getAttribute('aria-label') ?? '')
}

describe('WorldMapScreen lock states', () => {
  useLocalOnlyAuth()

  it('opens the first node and locks the rest of world 1', async () => {
    const { child } = await childAt('w1')
    renderMap('w1')
    await waitFor(() => expect(nodeLabels().some((l) => l.includes('aquí estás'))).toBe(true))
    const labels = nodeLabels()
    expect(labels.find((l) => l.includes('aquí estás'))).toContain('Las lianas de las hadas')
    expect(labels.filter((l) => l.includes('bloqueado')).length).toBeGreaterThanOrEqual(8)
    expect(labels.some((l) => l.includes('hecho'))).toBe(false)
    void child
  })

  it('marks finished nodes and unlocks the next one', async () => {
    const { child } = await childAt('w1')
    await updateProgress(child.id, (p) => applyNodeResult(p, 'w1', 'arrival', { stars: 3, passed: true }))
    renderMap('w1')
    await waitFor(() => expect(nodeLabels().some((l) => l.includes('hecho'))).toBe(true))
    const labels = nodeLabels()
    expect(labels.find((l) => l.includes('hecho'))).toContain('Las lianas de las hadas')
    expect(labels.find((l) => l.includes('aquí estás'))).toContain('¿Qué es multiplicar?')
  })

  it('the companion is freed more by practice than by reading the same number of stops', async () => {
    // World 1 has stops to read and to practise. One stop finished: a reading (1 star) for one child, a full practice
    // (3 stars) for the other. The practice frees the companion more.
    const reading = await childAt('w1')
    await updateProgress(reading.child.id, (p) => applyNodeResult(p, 'w1', 'arrival', { stars: 3, passed: true }))
    rescueSeen.values = []
    renderMap('w1')
    await waitFor(() => expect(rescueSeen.values.length).toBeGreaterThan(0))
    const readRescue = rescueSeen.values[rescueSeen.values.length - 1]
    cleanup()

    const practice = await childAt('w1')
    await updateProgress(practice.child.id, (p) => applyNodeResult(p, 'w1', 'groups', { stars: 3, passed: true }))
    rescueSeen.values = []
    renderMap('w1')
    await waitFor(() => expect(rescueSeen.values.length).toBeGreaterThan(0))
    const practiceRescue = rescueSeen.values[rescueSeen.values.length - 1]

    expect(readRescue).toBeGreaterThan(0)
    expect(practiceRescue).toBeGreaterThan(readRescue)
    expect(practiceRescue).toBeCloseTo(readRescue * 3, 5)
  })

  it('an optional stop says it can be skipped, and the next step is the guardian', async () => {
    const { child } = await childAt('w4')
    const w4 = season1.worlds.find((w) => w.id === 'w4')!
    await updateProgress(child.id, (p) => {
      let q = unlockThroughWorld(p, 'w4')
      for (const n of w4.nodes) if (n.kind !== 'guardian' && n.optional !== true) q = applyNodeResult(q, 'w4', n.id, { stars: 3, passed: true })
      return q
    })
    renderMap('w4')
    await waitFor(() => expect(nodeLabels().some((l) => l.includes('puedes saltarla'))).toBe(true))
    const labels = nodeLabels()
    const optional = labels.find((l) => l.includes('Dos formas de restar del cole'))!
    expect(optional).toContain('puedes saltarla')
    expect(optional).not.toContain('bloqueado')
    expect(labels.find((l) => l.includes('aquí estás'))).toContain('El desafío de la osa Nieve')
    expect(document.body.textContent).toContain('Puedes saltarla')
    // The guardian is the current stop: its pill marks it, and no «¡Ayúdame!» is drawn under that pill.
    expect(document.body.textContent).toContain('Aquí sigue')
    expect(document.body.textContent).not.toContain('¡Ayúdame!')
  })

  it('a guardian that is not the current stop still asks for help', async () => {
    await childAt('w1')
    renderMap('w1')
    await waitFor(() => expect(nodeLabels().some((l) => l.includes('aquí estás'))).toBe(true))
    expect(document.body.textContent).toContain('¡Ayúdame!')
  })
})
