/* The method registry (subtraction, division, tables tricks), its normalisers, the tricks that apply to a fact, the
   place of the new kinds in the daily session and in the placement test. */
import { describe, expect, it } from 'vitest'
import type { ChildProfile } from '@/types'
import { trickUsed } from '@/activities/facts/shared/flow'
import {
  DIV_METHODS, METHODS, SUB_METHODS, TABLE_METHODS, DEFAULT_METHOD, isDivMethod, isTableMethod, makeFactMul,
  normaliseDivMethod, normaliseSubMethod, normaliseTableMethod, placementBlockOf, planDailySession, tricksFor,
  methodLabel, methodFor, isSubMethod, retiredMethodsIn,
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
    expect(DIV_METHODS.map((m) => m.id)).toEqual(['galera', 'galera-short'])
    expect(methodLabel('div', 'galera-short')).toBe('La galera sin restas')
  })

  it('the defaults and the normalisers accept only known ids (older settings fall back safely)', () => {
    expect(DEFAULT_METHOD).toEqual({ sub: 'borrow', div: 'galera' })
    expect(normaliseSubMethod('nope')).toBe('borrow')
    expect(normaliseDivMethod('nope')).toBe('galera')
    expect(normaliseDivMethod('galera-short')).toBe('galera-short')
    expect(normaliseSubMethod('carry')).toBe('carry')
    expect(normaliseTableMethod(undefined)).toBeNull()
    expect(normaliseTableMethod('double')).toBe('double')
    expect(isDivMethod('parts')).toBe(false) // the subtraction id is not a division method
    expect(isTableMethod('climb')).toBe(false)
  })

  it('one method per operation, the school ones: the retired methods of old settings become the default', () => {
    expect(SUB_METHODS.map((m) => m.id)).toEqual(['borrow', 'carry'])
    expect(DIV_METHODS.map((m) => m.id)).toEqual(['galera', 'galera-short'])
    expect(normaliseSubMethod('line')).toBe('borrow')
    expect(normaliseSubMethod('parts')).toBe('borrow')
    expect(normaliseDivMethod('climb')).toBe('galera')
    expect(normaliseDivMethod('div-parts')).toBe('galera')
    expect(isSubMethod('line')).toBe(false)
    expect(isDivMethod('climb')).toBe(false)
    // Old attempt logs keep a readable name in the report.
    expect(methodLabel('sub', 'line')).toBe('Saltos en la recta')
    expect(methodLabel('div', 'climb')).toBe('Multiplicar hacia arriba')
    expect(retiredMethodsIn({ subMethod: 'line', divMethod: 'galera' })).toEqual({ sub: true, div: false })
    expect(retiredMethodsIn({ subMethod: 'borrow', divMethod: 'div-parts' })).toEqual({ sub: false, div: true })
    expect(retiredMethodsIn(undefined)).toEqual({ sub: false, div: false })
  })

  it('methodFor gives the school method the grown-up saved, or the default; never a retired one', () => {
    expect(methodFor('sub', { subMethod: 'carry' })).toBe('carry')
    expect(methodFor('sub', { subMethod: 'line' })).toBe('borrow')
    expect(methodFor('sub', undefined)).toBe('borrow')
    expect(methodFor('div', { divMethod: 'galera-short' })).toBe('galera-short')
    expect(methodFor('div', { divMethod: 'climb' })).toBe('galera')
    expect(methodFor('div', null)).toBe('galera')
  })

  it('every school method has its notebook example in words, always shown to the grown-up', () => {
    for (const m of [...SUB_METHODS, ...DIV_METHODS]) {
      expect(m.example.length, m.id).toBeGreaterThan(4)
      expect(m.notebook.length, m.id).toBeGreaterThan(30)
    }
    // The sentences end with the right result of their example.
    for (const m of SUB_METHODS) expect(m.notebook).toMatch(/25\.$/)
    for (const m of DIV_METHODS) expect(m.notebook).toMatch(/24\.$/)
  })

  it('each trick applies to the facts of its table, and the mirror applies to any two different factors', () => {
    const ids = (a: number, b: number) => tricksFor(a, b).map((t) => t.id)
    expect(ids(6, 7)).toEqual(expect.arrayContaining(['five-plus-one', 'mirror']))
    expect(ids(5, 8)).toContain('half-ten')
    expect(ids(9, 7)).toEqual(expect.arrayContaining(['ten-minus-one', 'mirror']))
    expect(ids(4, 8)).toEqual(expect.arrayContaining(['double-double']))
    expect(ids(2, 2)).toEqual(['double'])
    expect(ids(7, 7)).not.toContain('mirror')
    for (const t of TABLE_METHODS) expect((typeof t.hint === 'function' ? t.hint(4, 8) : t.hint).length, t.id).toBeGreaterThan(10)
    // The trick's first hint names only its factor: for 2 × 4 (the answer is 8) and 2 × 5 (the answer is 10) it leaves the product out.
    const text = (id: string, a: number, b: number) => {
      const trick = TABLE_METHODS.find((t) => t.id === id)!
      return typeof trick.hint === 'function' ? trick.hint(a, b) : trick.hint
    }
    expect(text('double-double', 2, 4)).not.toMatch(/\b8\b/)
    expect(text('half-ten', 2, 5)).not.toMatch(/\b10\b/)
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
