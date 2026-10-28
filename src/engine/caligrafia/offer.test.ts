import { describe, expect, it } from 'vitest'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile } from '@/types'
import { caligrafiaOffered } from './offer'

const child = (over: Partial<ChildProfile> & { handwriting?: unknown } = {}): ChildProfile => {
  const { handwriting, ...rest } = over
  return {
    id: 'c1', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
    companion: { species: 'fox', name: 'Pipo', gender: 'm', colorway: 'default', equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language'], ...(handwriting !== undefined ? { handwriting } : {}) } as ChildProfile['settings'],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...rest,
  }
}

describe('caligrafiaOffered', () => {
  it('is offered when the pen was seen on this device', () => {
    expect(caligrafiaOffered(child(), { penSeen: true, mode: 'keypad' })).toBe(true)
  })

  it('is offered when the child is writing with the pen now', () => {
    expect(caligrafiaOffered(child(), { penSeen: false, mode: 'pen' })).toBe(true)
  })

  it('is not offered on a touch device where the pen was never used', () => {
    expect(caligrafiaOffered(child(), { penSeen: false, mode: 'touch' })).toBe(false)
  })

  it('is not offered when the adult switched the handwriting off', () => {
    expect(caligrafiaOffered(child({ handwriting: false }), { penSeen: true, mode: 'pen' })).toBe(false)
  })

  it('stays on for a profile saved before the setting existed', () => {
    expect(caligrafiaOffered(child({ handwriting: undefined }), { penSeen: true, mode: 'pen' })).toBe(true)
  })

  it('is not offered when Lengua is not on for the child', () => {
    const c = child()
    c.settings = { ...c.settings, subjects: ['math'] }
    expect(caligrafiaOffered(c, { penSeen: true, mode: 'pen' })).toBe(false)
  })
})
