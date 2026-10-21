/* Contract file (owned by the integrator). Activities read services through useActivityHost();
   the world module provides the real implementation with <ActivityHostProvider value={...}>. */
import { createContext, useContext } from 'react'
import type { ActivityHost } from '@/types'

let seed = 1234567
function fallbackRng() {
  // mulberry32 — only used when no host is mounted (gallery / tests)
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const defaultActivityHost: ActivityHost = {
  reportAttempt: (a) => {
    if (import.meta.env.DEV) console.debug('[activity-host] attempt', a.exercise.skill, a.check.correct)
  },
  react: () => {},
  rng: fallbackRng,
  mastery: {},
  t: (s) => s.replace(/\{child\}/g, 'Inessa').replace(/\{pet\}/g, 'Bigotes'),
  prefs: { timedActivities: true, bigCells: false, voice: false, handedness: 'right' },
}

const ActivityHostContext = createContext<ActivityHost>(defaultActivityHost)

export const ActivityHostProvider = ActivityHostContext.Provider

export function useActivityHost(): ActivityHost {
  return useContext(ActivityHostContext)
}
