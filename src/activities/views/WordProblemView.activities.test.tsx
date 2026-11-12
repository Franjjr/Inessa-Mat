/* The problems in the activities that add no «Escuchar» of their own: «word» (worlds w2 and w7) and «exercises» (w4, word
   and bar problems). With the voice on, the problem's view reads it: exactly one «Escuchar», so a child who still reads with
   difficulty can hear the story. */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { ActivityConfig } from '@/types'
import WordActivity from '../word'
import ExercisesActivity from '../exercises'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(() => Promise.resolve()), stop: vi.fn(), speaking: () => false } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const voiceOn = { ...defaultActivityHost, prefs: { ...defaultActivityHost.prefs, voice: true } }

const config = (kind: ActivityConfig['kind'], kinds: ActivityConfig['selector']['kinds']): ActivityConfig => ({
  kind, title: 'El problema', instructions: 'Lee despacio.', selector: { kinds }, count: 1,
})

describe('a problem with the voice on has one «Escuchar»', () => {
  it('in the «word» activity', () => {
    render(<ActivityHostProvider value={voiceOn}><WordActivity config={config('word', ['word-problem'])} onDone={vi.fn()} /></ActivityHostProvider>)
    expect(screen.getByRole('region', { name: 'Problema' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Escuchar/ })).toHaveLength(1)
  })

  // ExerciseView loads each view lazily: wait for it.
  it('in the «exercises» activity, a word problem', async () => {
    render(<ActivityHostProvider value={voiceOn}><ExercisesActivity config={config('exercises', ['word-problem'])} onDone={vi.fn()} /></ActivityHostProvider>)
    expect(await screen.findByRole('region', { name: 'Problema' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Escuchar/ })).toHaveLength(1)
  })

  it('in the «exercises» activity, a bar problem', async () => {
    render(<ActivityHostProvider value={voiceOn}><ExercisesActivity config={config('exercises', ['bar-problem'])} onDone={vi.fn()} /></ActivityHostProvider>)
    expect(await screen.findAllByRole('button', { name: /Escuchar/ })).toHaveLength(1)
  })
})
