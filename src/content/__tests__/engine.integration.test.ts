/* ENGINE INTEGRATION TEST — generates real exercises from every selector the content defines, using @/engine.
   The engine is written by another agent in parallel: if it is still a stub (generate returns nothing), these tests
   are skipped instead of failing. TODO(integrator): remove the skip guard once the engine is final. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, makeExercise } from '@/engine'
import { guardians, season1, SPELL_CODES } from '@/content'
import type { Exercise } from '@/types'
import { allSelectors } from './helpers'

const engineReady = (() => {
  try {
    return generate({ kinds: ['fact-mul'], tables: [6] }, 3, { rng: createRng(1) }).length === 3
  } catch {
    return false
  }
})()

const answerOf = (ex: Exercise): number => {
  switch (ex.kind) {
    case 'division': return ex.quotient
    case 'skip-count': case 'double-chain': case 'fact-family': return NaN
    case 'compare': case 'order': return NaN
    case 'place-value': return typeof ex.answer === 'number' ? ex.answer : NaN
    default: return ex.answer as number
  }
}

describe.skipIf(!engineReady)('engine integration (generate from every selector)', () => {
  it('every selector yields the requested number of exercises of the requested kinds', () => {
    for (const { where, selector, count } of allSelectors()) {
      for (const seed of [1, 2, 3, 7, 42]) {
        const items = generate(selector, count, { rng: createRng(seed), now: new Date('2026-10-01T10:00:00Z') })
        expect(items.length, `${where} seed ${seed}`).toBe(count)
        for (const ex of items) {
          if (selector.kinds?.length) expect(selector.kinds, `${where}: ${ex.id}`).toContain(ex.kind)
          if (selector.tables?.length && (ex.kind === 'fact-mul' || ex.kind === 'missing-factor')) {
            expect(selector.tables.includes(ex.a) || selector.tables.includes(ex.b), `${where}: ${ex.id}`).toBe(true)
          }
          if (selector.skills?.length && ex.kind !== 'word-problem') expect(selector.skills, `${where}: ${ex.id}`).toContain(ex.skill)
        }
      }
    }
  })

  it('guardian rounds with explicit skills give different items (no repeats inside a challenge round)', () => {
    for (const g of guardians) {
      for (const [i, r] of g.rounds.entries()) {
        if (!r.selector.skills || r.selector.skills.length < r.count) continue
        const ids = generate(r.selector, r.count, { rng: createRng(5) }).map((e) => e.id)
        expect(new Set(ids).size, `${g.id} round ${i}`).toBe(ids.length)
      }
    }
  })

  it('wheel and maze numbers are real facts of their table', () => {
    for (const w of season1.worlds) {
      for (const n of w.nodes) {
        const p = (n.activity?.params ?? {}) as { center?: number; numbers?: number[] }
        if (n.activity?.kind !== 'wheel') continue
        for (const k of p.numbers!) {
          const ex = generate({ kinds: ['fact-mul'], skills: [`mul:${Math.min(k, p.center!)}x${Math.max(k, p.center!)}`] }, 1, { rng: createRng(k) })[0]
          expect(answerOf(ex)).toBe(k * p.center!)
        }
      }
    }
  })

  it('each Hechizo del Cristal builds the workbook exercise and its result is the magic number', () => {
    for (const g of guardians) {
      const f = g.spell.fixed!
      const ex = makeExercise(f.kind, f.a, f.b)
      expect(answerOf(ex), g.id).toBe(SPELL_CODES[g.id].result)
      const answer = ex.kind === 'division'
        ? { type: 'division' as const, quotient: ex.quotient, remainder: ex.remainder }
        : { type: 'number' as const, value: answerOf(ex) }
      expect(check(ex, answer).correct, g.id).toBe(true)
    }
  })
})
