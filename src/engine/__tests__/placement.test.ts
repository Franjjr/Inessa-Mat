import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '@/types'
import { PLACEMENT_ACTIVITY, PLACEMENT_COUNT, buildPlacement, placementBlockOf, summarizePlacement } from '../placement'

const now = new Date('2026-10-22T10:00:00.000Z')

describe('buildPlacement (prueba inicial)', () => {
  it('has about twenty items in the eight blocks, one of each need (the newer blocks: one item each)', () => {
    const items = buildPlacement('child-1|2026-10-22', now)
    expect(items).toHaveLength(PLACEMENT_COUNT)
    const blocks = new Set(items.map((i) => i.block))
    expect([...blocks].sort()).toEqual(['dinero-medida', 'dividir', 'fracciones-geometria', 'numeros', 'problemas', 'sumas-restas', 'tablas', 'tiempo'].sort())
    // The newer blocks add one item each, so the placement stays about ten minutes.
    for (const block of ['tiempo', 'fracciones-geometria', 'dinero-medida']) expect(items.filter((i) => i.block === block)).toHaveLength(1)
    expect(items.find((i) => i.block === 'dinero-medida')?.exercise.kind).toBe('money')
    expect(items.filter((i) => i.block === 'tablas').length).toBe(4)
    expect(items.filter((i) => i.block === 'problemas').every((i) => i.exercise.kind === 'bar-problem')).toBe(true)
  })

  it('is deterministic for a seed, and its items are real exercises with answers', () => {
    const a = buildPlacement('x', now).map((i) => i.exercise.id)
    const b = buildPlacement('x', now).map((i) => i.exercise.id)
    expect(a).toEqual(b)
    for (const { exercise } of buildPlacement('x', now)) expect(typeof exercise.skill).toBe('string')
  })

  it('maps every skill to its block', () => {
    expect(placementBlockOf('add:3d:c1')).toBe('sumas-restas')
    expect(placementBlockOf('sub:3d:b0')).toBe('sumas-restas')
    expect(placementBlockOf('mul:6x7')).toBe('tablas')
    expect(placementBlockOf('div:42/6')).toBe('dividir')
    expect(placementBlockOf('div:2x1:exact')).toBe('dividir')
    expect(placementBlockOf('word:add')).toBe('problemas')
    expect(placementBlockOf('concept:placevalue')).toBe('numeros')
    expect(placementBlockOf('concept:groups')).toBeNull()
  })
})

describe('summarizePlacement', () => {
  const attempt = (skill: string, correct: boolean, i: number, activity: string | undefined = PLACEMENT_ACTIVITY): AttemptRecord => ({
    id: `a${i}`, childId: 'c', sessionId: null, skill, kind: 'fact-mul', correct, given: '', expected: '', ms: 1000,
    inputMode: 'keypad', hintsUsed: 0, context: activity ? { activity } : {}, createdAt: now.toISOString(),
  })

  it('counts per block for the latest run only, ignoring other activities', () => {
    const list = [
      attempt('mul:6x7', true, 1), attempt('mul:3x4', false, 2), attempt('add:3d:c1', true, 3),
      attempt('mul:2x2', true, 4, 'facts'), attempt('sub:3d:b0', false, 5),
    ]
    const s = summarizePlacement(list)
    expect(s.answered).toBe(4)
    expect(s.complete).toBe(false)
    const tablas = s.blocks.find((b) => b.id === 'tablas')!
    expect(tablas).toMatchObject({ correct: 1, total: 2 })
    expect(s.blocks.find((b) => b.id === 'sumas-restas')).toMatchObject({ correct: 1, total: 2 })
  })

  it('a full run is complete', () => {
    const list = Array.from({ length: PLACEMENT_COUNT }, (_, i) => attempt('mul:6x7', i % 2 === 0, i))
    expect(summarizePlacement(list).complete).toBe(true)
  })
})
