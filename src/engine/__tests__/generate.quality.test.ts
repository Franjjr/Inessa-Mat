/* Quality of the generated exercises: the answer of every item is checked with independent arithmetic, and the
   level asked for (digits, tables, weights, ramp, adaptive plan) is what the child actually gets. */
import { describe, expect, it } from 'vitest'
import { createRng, generate, newMastery } from '@/engine'
import type { DivisionExercise, Exercise, ExerciseKind, MasteryMap, ShapeChoiceExercise } from '@/types'
import { buildSense, genWordSense } from '@/engine/wordProblems'
import { factDifficulty, makeFactMul } from '@/engine/make'

const digitsOf = (n: number) => String(n).length

describe('fact division: the answer is not the table being practised', () => {
  it('with a table asked, no fact has that table as its quotient (except the squares, 6 ÷ 6 type)', () => {
    for (const table of [2, 3, 4, 5, 6, 7, 8, 9]) {
      for (let seed = 1; seed <= 120; seed++) {
        for (const ex of generate({ kinds: ['fact-div'], tables: [table] }, 10, { rng: createRng(seed) })) {
          if (ex.kind !== 'fact-div') continue
          if (ex.divisor === table) continue // the table as divisor (42 ÷ 6 = 7 in the table of 6) is the normal case
          expect(ex.answer, `${ex.id} in table ${table}`).not.toBe(table)
        }
      }
    }
  })
})

describe('non-adaptive plans: the weights change how often a fact comes', () => {
  it('3 × 1 comes clearly less often than 3 × 8 when the plan has more items than facts', () => {
    let easy = 0
    let normal = 0
    for (let seed = 1; seed <= 400; seed++) {
      for (const ex of generate({ kinds: ['fact-mul'], tables: [3] }, 30, { rng: createRng(seed) })) {
        if (ex.kind !== 'fact-mul') continue
        if (ex.a === 1 || ex.b === 1) easy++
        if (ex.skill === 'mul:3x8') normal++
      }
    }
    expect(normal).toBeGreaterThan(0)
    expect(easy / normal).toBeLessThan(0.6)
  })

  it('every skill of the universe still appears when the plan is at least as long as the universe', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const skills = new Set(generate({ kinds: ['fact-mul'], tables: [6] }, 10, { rng: createRng(seed) }).map((e) => e.skill))
      expect(skills.size).toBe(10)
    }
  })
})

describe('adaptive by default when the child history is given', () => {
  const mastery: MasteryMap = {
    'add:3d:c1': { ...newMastery('add:3d:c1', new Date('2026-01-01T00:00:00Z')), box: 0, dueAt: '2026-01-02T00:00:00Z' },
  }
  const sel = { kinds: ['column-add' as ExerciseKind], digits: 3 as const }

  it('with mastery and no adaptive flag, the plan is the adaptive one', () => {
    const now = new Date('2026-06-01T00:00:00Z')
    let differs = 0
    for (let seed = 1; seed <= 40; seed++) {
      const implicit = generate(sel, 6, { rng: createRng(seed), mastery, now })
      const explicit = generate({ ...sel, adaptive: true }, 6, { rng: createRng(seed), mastery, now })
      expect(implicit).toEqual(explicit)
      const uniform = generate({ ...sel, adaptive: false }, 6, { rng: createRng(seed), mastery, now })
      if (JSON.stringify(uniform) !== JSON.stringify(explicit)) differs++
    }
    expect(differs).toBeGreaterThan(0)
  })

  it('without mastery nothing changes: no adaptive planning', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(generate(sel, 6, { rng: createRng(seed) })).toEqual(generate({ ...sel, adaptive: false }, 6, { rng: createRng(seed) }))
    }
  })

  it('an empty history (a new child) changes nothing: the plan stays uniform', () => {
    const now = new Date('2026-06-01T00:00:00Z')
    for (let seed = 1; seed <= 40; seed++) {
      const withEmpty = generate({ kinds: ['fact-mul'], factorRange: [2, 9] }, 10, { rng: createRng(seed), mastery: {}, now })
      const without = generate({ kinds: ['fact-mul'], factorRange: [2, 9] }, 10, { rng: createRng(seed), now })
      expect(withEmpty, `seed ${seed}`).toEqual(without)
    }
  })
})

describe('division with 3 and 4 digits in the generic selector', () => {
  it('digits 3 gives 3-digit dividends by one digit', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const ex of generate({ kinds: ['division'], digits: 3 }, 6, { rng: createRng(seed) }) as DivisionExercise[]) {
        expect(ex.skill, ex.id).toMatch(/^div:3x1:(exact|rem)$/)
        expect(ex.dividend >= 100 && ex.dividend <= 999, ex.id).toBe(true)
        expect(ex.quotient * ex.divisor + ex.remainder, ex.id).toBe(ex.dividend)
        expect(ex.divisor >= 2 && ex.divisor <= 9, ex.id).toBe(true)
      }
    }
  })

  it('digits 4 gives 4-digit dividends by one digit', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const ex of generate({ kinds: ['division'], digits: 4 }, 5, { rng: createRng(seed) }) as DivisionExercise[]) {
        expect(ex.skill, ex.id).toMatch(/^div:4x1:(exact|rem)$/)
        expect(ex.dividend >= 1000 && ex.dividend <= 9999, ex.id).toBe(true)
        expect(ex.quotient * ex.divisor + ex.remainder, ex.id).toBe(ex.dividend)
      }
    }
  })

  it('digits 3 with a table asked: 3-digit dividends whose divisor is the table', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const ex of generate({ kinds: ['division'], digits: 3, tables: [6] }, 5, { rng: createRng(seed) }) as DivisionExercise[]) {
        expect(ex.skill, ex.id).toMatch(/^div:3x1:(exact|rem)$/)
        expect(ex.dividend >= 100 && ex.dividend <= 999, ex.id).toBe(true)
        expect(ex.divisor, ex.id).toBe(6)
        expect(ex.quotient * ex.divisor + ex.remainder, ex.id).toBe(ex.dividend)
      }
    }
  })

  it('divisionVariants long alone with 3 digits: there is no 3-digit long division yet, so exact and remainder', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const ex of generate({ kinds: ['division'], digits: 3, divisionVariants: ['long'] }, 4, { rng: createRng(seed) }) as DivisionExercise[]) {
        expect(ex.skill, ex.id).toMatch(/^div:3x1:(exact|rem)$/)
      }
    }
  })

  it('without digits the generic division stays with 2 digits', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const ex of generate({ kinds: ['division'] }, 4, { rng: createRng(seed) }) as DivisionExercise[]) {
        expect(ex.dividend >= 10 && ex.dividend <= 99, ex.id).toBe(true)
      }
    }
  })
})

describe('the level is ramped inside a session when the selector does not fix one', () => {
  it('within each skill, difficulty never goes down along the session', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const exs = generate({ kinds: ['word-problem'] }, 12, { rng: createRng(seed) })
      const bySkill = new Map<string, number[]>()
      for (const e of exs) bySkill.set(e.skill, [...(bySkill.get(e.skill) ?? []), e.difficulty])
      for (const [skill, levels] of bySkill) {
        for (let i = 1; i < levels.length; i++) expect(levels[i], `${skill} seed ${seed}`).toBeGreaterThanOrEqual(levels[i - 1])
      }
    }
  })

  it('the ramp keeps the interleaving: no skill twice in a row', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const exs = generate({ kinds: ['word-problem', 'column-add'] }, 12, { rng: createRng(seed) })
      for (let i = 1; i < exs.length; i++) expect(exs[i].skill).not.toBe(exs[i - 1].skill)
    }
  })
})

describe('difficulty of 9 × 9', () => {
  it('is rated like 6 × 6 (not like 3 × 9)', () => {
    expect(factDifficulty(9, 9)).toBe(factDifficulty(6, 6))
    expect(makeFactMul(9, 9).difficulty).toBe(4)
  })
})

describe('"¿tiene sentido?" problems: the wrong answers are never the true result', () => {
  it('a proposed answer equal to the true result is the right option; any other proposal is wrong', () => {
    const rng = createRng(77)
    let near = 0
    let total = 0
    for (let i = 0; i < 1500; i++) {
      const p = buildSense(rng)
      total++
      const correct = p.exercise.options[p.exercise.answer]
      if (p.shown === p.right) expect(correct, p.exercise.id).toBe('Sí, tiene sentido')
      else expect(correct, p.exercise.id).toBe('No, no tiene sentido')
      expect(p.shown > 0, p.exercise.id).toBe(true)
      if (p.shown !== p.right && Math.abs(p.shown - p.right) <= 100 && p.shown !== p.right * 10 && p.shown * 10 !== p.right) near++
    }
    // Close wrong answers (a forgotten carry, a digit slip) are part of the mix, not only the absurd ones.
    expect(near / total).toBeGreaterThan(0.1)
  })

  it('close wrong answers come with hints that describe the method for that error (a full calculation)', () => {
    const rng = createRng(12)
    let checked = 0
    for (let i = 0; i < 1500; i++) {
      const p = buildSense(rng)
      if (p.shown === p.right || p.near !== true) continue
      checked++
      expect(p.exercise.hints[1].toLowerCase()).toContain('cuenta completa')
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('the generator is deterministic for a given seed', () => {
    const a = genWordSense(createRng(9)) as ShapeChoiceExercise
    const b = genWordSense(createRng(9)) as ShapeChoiceExercise
    expect(a).toEqual(b)
  })
})

describe('property: every item of the main generators has one correct answer and respects its level', () => {
  it('the stated answer is the arithmetic of the operands, and the division has one quotient and a remainder under the divisor', () => {
    const sels: Parameters<typeof generate>[0][] = [
      { kinds: ['fact-mul', 'fact-div', 'missing-factor'] },
      { kinds: ['column-add', 'column-sub', 'column-mul'], digits: 3 },
      { kinds: ['division'], digits: 2 },
      { kinds: ['division'], digits: 4 },
      { kinds: ['word-problem'] },
    ]
    let checked = 0
    for (const sel of sels) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const e of generate(sel, 8, { rng: createRng(seed) })) {
          checked++
          const id = `${e.id} seed ${seed}`
          if (e.kind === 'fact-mul') expect(e.a * e.b, id).toBe(e.answer)
          if (e.kind === 'fact-div') expect(e.dividend / e.divisor, id).toBe(e.answer)
          if (e.kind === 'column-add') expect(e.operands.reduce((s, x) => s + x, 0), id).toBe(e.answer)
          if (e.kind === 'column-sub') expect(e.minuend - e.subtrahend, id).toBe(e.answer)
          if (e.kind === 'column-mul') expect(e.top * e.bottom, id).toBe(e.answer)
          if (e.kind === 'division') {
            expect(e.quotient * e.divisor + e.remainder, id).toBe(e.dividend)
            expect(e.remainder >= 0 && e.remainder < e.divisor, id).toBe(true)
          }
          if (e.kind === 'word-problem') expect(e.answer, id).toBeGreaterThan(0)
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })

  it('a sample of the generic kinds with explicit levels gives exactly the asked digits', () => {
    const cases: [Parameters<typeof generate>[0], (e: Exercise) => boolean][] = [
      [{ kinds: ['column-add'], digits: 2 }, (e) => e.kind === 'column-add' && e.operands.every((o) => digitsOf(o) <= 2)],
      [{ kinds: ['column-sub'], digits: 3 }, (e) => e.kind === 'column-sub' && digitsOf(e.minuend) === 3],
      [{ kinds: ['division'], digits: 3 }, (e) => e.kind === 'division' && digitsOf(e.dividend) === 3],
      [{ kinds: ['fact-mul'], tables: [7] }, (e) => e.kind === 'fact-mul' && (e.a === 7 || e.b === 7)],
    ]
    for (const [sel, ok] of cases) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const e of generate(sel, 6, { rng: createRng(seed) })) expect(ok(e), `${e.id} ${JSON.stringify(sel)}`).toBe(true)
      }
    }
  })
})
