import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { applyNodeResult } from '@/content'
import { useActiveChild, createChild, updateProgress } from '@/data'
import { flushTimers } from '@/data/__tests__/helpers'
import { useLocalOnlyAuth } from '../host/testing'
import WorldMapScreen from './WorldMapScreen'

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
})
