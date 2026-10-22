/* The method registry (subtraction, division, tables tricks), its normalisers, the tricks that apply to a fact, the
   place of the new kinds in the daily session and in the placement test. */
import { describe, expect, it } from 'vitest'
import type { ChildProfile } from '@/types'
import { trickUsed } from '@/activities/facts/shared/flow'
import {
  DIV_METHODS, METHODS, SUB_METHODS, TABLE_METHODS, DEFAULT_METHOD, isDivMethod, isTableMethod, makeFactMul,
  normaliseDivMethod, normaliseSubMethod, normaliseTableMethod, placementBlockOf, planDailySession, tricksFor,
  methodLabel,
} from '@/engine'
import { GRADE3_SYLLABUS } from '@/content/syllabus'

describe('method registry', () => {
  it('method ids are unique across the operations (the attempt log keys its tallies by id)', () => {
    const ids = [...SUB_METHODS, ...DIV_METHODS, ...TABLE_METHODS].map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every method has a child label and an adult summary; the registry is exposed per operation', () => {
    for (const op of Object.keys(METHODS) as (keyof typeof METHODS)[]) {
      for (const m of METHODS[op]) {
        expect(m.label.length, m.id).toBeGreaterThan(3)
        expect(m.summary.length, m.id).toBeGreaterThan(10)
      }
    }
    expect(DIV_METHODS.map((m) => m.id)).toEqual(['galera', 'galera-short', 'div-parts', 'climb'])
    expect(methodLabel('div', 'galera-short')).toBe('La galera sin restas')
  })

  it('the defaults and the normalisers accept only known ids (older settings fall back safely)', () => {
    expect(DEFAULT_METHOD).toEqual({ sub: 'borrow', div: 'galera' })
    expect(normaliseSubMethod('nope')).toBe('borrow')
    expect(normaliseDivMethod('nope')).toBe('galera')
    expect(normaliseDivMethod('climb')).toBe('climb')
    expect(normaliseTableMethod(undefined)).toBeNull()
    expect(normaliseTableMethod('double')).toBe('double')
    expect(isDivMethod('parts')).toBe(false) // the subtraction id is not a division method
    expect(isTableMethod('climb')).toBe(false)
  })

  it('each trick applies to the facts of its table, and the mirror applies to any two different factors', () => {
    const ids = (a: number, b: number) => tricksFor(a, b).map((t) => t.id)
    expect(ids(6, 7)).toEqual(expect.arrayContaining(['five-plus-one', 'mirror']))
    expect(ids(5, 8)).toContain('half-ten')
    expect(ids(9, 7)).toEqual(expect.arrayContaining(['ten-minus-one', 'mirror']))
    expect(ids(4, 8)).toEqual(expect.arrayContaining(['double-double']))
    expect(ids(2, 2)).toEqual(['double'])
    expect(ids(7, 7)).not.toContain('mirror')
    for (const t of TABLE_METHODS) expect(t.hint.length, t.id).toBeGreaterThan(10)
  })

  it('a favourite trick is used on a fact only when it applies to that fact', () => {
    expect(trickUsed(makeFactMul(6, 7), 'five-plus-one')).toBe('five-plus-one')
    expect(trickUsed(makeFactMul(3, 8), 'five-plus-one')).toBeUndefined()
    expect(trickUsed(makeFactMul(6, 7), null)).toBeUndefined()
    expect(trickUsed(makeFactMul(6, 7), undefined)).toBeUndefined()
  })
})

describe('the new kinds in the planner and the placement', () => {
  const child = { id: 'kid-methods' } as ChildProfile
  const now = new Date('2026-10-22T09:00:00Z')

  it('the mix holds one «encuentra el error», and the problem block is a bar problem', () => {
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const mix = plan.blocks.find((b) => b.id === 'mix')!.items
    expect(mix.filter((i) => i.exercise.kind === 'error-hunt').length).toBe(1)
    expect(mix.filter((i) => !i.filler).length).toBeLessThanOrEqual(8)
    const problem = plan.blocks.find((b) => b.id === 'problem')!.items
    expect(problem).toHaveLength(1)
    expect(problem[0].exercise.kind).toBe('bar-problem')
  })

  it('the placement maps the bars to the problems and the 3-digit division to the division block', () => {
    expect(placementBlockOf('bar:add')).toBe('problemas')
    expect(placementBlockOf('bar:two')).toBe('problemas')
    expect(placementBlockOf('div:3x1:exact')).toBe('dividir')
    expect(placementBlockOf('hunt:add')).toBeNull()
  })
})
