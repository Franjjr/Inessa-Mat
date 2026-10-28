import { describe, expect, it } from 'vitest'
import { createRng, generate, newMastery, parseSkill } from '@/engine'
import type {
  ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, DivisionExercise, Exercise, ExerciseKind, MasteryMap,
  SkillSelector, WordProblemExercise,
} from '@/types'
import { refBorrowed, refCarries, refCarryCount, refZeroBorrow } from './helpers'

const ALL_KINDS: ExerciseKind[] = [
  'fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'groups', 'array', 'double-chain', 'fact-family',
  'column-add', 'column-sub', 'column-mul', 'division', 'word-problem',
  'lng-tap-words', 'lng-sentence-parts', 'lng-classify', 'lng-transform',
  'lng-missing-letter', 'lng-punctuation', 'lng-stress', 'lng-syllables', 'lng-dictation', 'lng-alphabet', 'lng-pair-words',
]

const len = (n: number) => String(n).length

/** Verifies every number of an exercise with independent arithmetic. Returns a list of problems. */
function verify(ex: Exercise): string[] {
  const errs: string[] = []
  const must = (cond: boolean, msg: string) => { if (!cond) errs.push(`${ex.id}: ${msg}`) }
  must(ex.difficulty >= 1 && ex.difficulty <= 5 && Number.isInteger(ex.difficulty), 'difficulty 1..5')
  must(parseSkill(ex.skill) !== null, `valid skill ${ex.skill}`)
  switch (ex.kind) {
    case 'fact-mul':
      must(ex.answer === ex.a * ex.b, 'product')
      must(ex.id === `fact-mul:${ex.a}x${ex.b}`, 'id')
      must(ex.skill === `mul:${Math.min(ex.a, ex.b)}x${Math.max(ex.a, ex.b)}`, 'skill normalised')
      break
    case 'fact-div':
      must(ex.answer * ex.divisor === ex.dividend, 'quotient')
      must(ex.divisor >= 1 && ex.divisor <= 10 && ex.answer >= 1 && ex.answer <= 10, 'fact range')
      break
    case 'missing-factor':
      must(ex.a * ex.b === ex.product, 'product')
      must(ex.answer === (ex.missing === 'a' ? ex.a : ex.b), 'missing answer')
      break
    case 'skip-count':
      must(ex.values.every((v, i) => i === 0 || v - ex.values[i - 1] === ex.step), 'arithmetic sequence')
      must(ex.values[0] % ex.step === 0, 'starts on a multiple')
      must(ex.hiddenIndexes.length >= 1 && !ex.hiddenIndexes.includes(0) && !ex.hiddenIndexes.includes(1), 'first two visible')
      must(ex.answer.every((v, i) => v === ex.values[ex.hiddenIndexes[i]]), 'answer = hidden values')
      break
    case 'groups':
      must(ex.answer === ex.groups * ex.perGroup && ex.groups >= 1 && ex.perGroup >= 1, 'groups product')
      break
    case 'array':
      must(ex.answer === ex.rows * ex.cols, 'array product')
      break
    case 'double-chain': {
      let v = ex.start
      must(ex.answer.length === ex.steps && ex.answer.every((x) => x === (v *= 2)), 'doublings')
      must(ex.skill === `mul:${Math.min(ex.start, 2 ** ex.steps)}x${Math.max(ex.start, 2 ** ex.steps)}`, 'chain skill')
      break
    }
    case 'fact-family':
      must(ex.product === ex.a * ex.b && ex.a !== ex.b, 'family product, no squares')
      must(ex.answer[0] === `${ex.a}x${ex.b}=${ex.product}` && ex.answer[3] === `${ex.product}/${ex.b}=${ex.a}`, 'family facts')
      break
    case 'column-add': {
      const sum = ex.operands.reduce((a, b) => a + b, 0)
      must(ex.answer === sum, 'sum')
      must(JSON.stringify(ex.carries) === JSON.stringify(refCarries(ex.operands)), `carries ${ex.carries} vs ${refCarries(ex.operands)}`)
      const p = parseSkill(ex.skill)
      if (p?.type === 'add') {
        must(p.carries === refCarryCount(ex.operands), 'skill carry count')
        must(p.digits === Math.max(...ex.operands.map(len)), 'skill digits')
        if (p.digits === 4) must(sum < 10000, '4-digit sums < 10000')
      }
      must(ex.operands.every((o) => o > 0), 'positive operands')
      break
    }
    case 'column-sub': {
      must(ex.answer === ex.minuend - ex.subtrahend && ex.answer > 0, 'positive difference')
      must(JSON.stringify(ex.borrowed) === JSON.stringify(refBorrowed(ex.minuend, ex.subtrahend)), 'borrowed flags')
      const p = parseSkill(ex.skill)
      if (p?.type === 'sub') {
        must(p.zero === refZeroBorrow(ex.minuend, ex.subtrahend), 'zero-borrow flag')
        if (!p.zero) must(p.borrows === refBorrowed(ex.minuend, ex.subtrahend).filter(Boolean).length, 'borrow count')
        must(p.digits === len(ex.minuend), 'skill digits')
      }
      break
    }
    case 'column-mul':
      must(ex.answer === ex.top * ex.bottom, 'product')
      must(ex.top >= 10 && ex.top <= 99 && ex.bottom >= 2 && ex.bottom <= 9, '2-digit × 1-digit')
      must(ex.top % 10 !== 0, 'units digit not 0')
      must(ex.skill === ((ex.top % 10) * ex.bottom >= 10 ? 'mul:2x1:c1' : 'mul:2x1:c0'), 'carry skill')
      must(ex.carries[1] === Math.floor(((ex.top % 10) * ex.bottom) / 10), 'units carry')
      break
    case 'division':
      must(ex.quotient * ex.divisor + ex.remainder === ex.dividend && ex.remainder < ex.divisor && ex.remainder >= 0, 'division identity')
      must(ex.dividend >= 10 && ex.dividend <= 99 && ex.divisor >= 2 && ex.divisor <= 9, '2-digit ÷ 1-digit')
      if (ex.variant === 'rem') must(ex.quotient < 10 && ex.remainder > 0, 'rem: 1-digit quotient with remainder')
      if (ex.variant === 'exact') must(Math.floor(ex.dividend / 10) % ex.divisor === 0 && (ex.dividend % 10) % ex.divisor === 0 && ex.quotient >= 10, 'exact digit by digit')
      if (ex.variant === 'long') must(Math.floor(ex.dividend / 10) % ex.divisor !== 0 && ex.quotient >= 10, 'long needs bring-down')
      must(ex.skill === `div:2x1:${ex.variant}`, 'division skill')
      break
    case 'word-problem': {
      const [a, b] = ex.operands
      const exp = ex.op === 'add' ? a + b : ex.op === 'sub' ? a - b : ex.op === 'mul' ? a * b : Math.floor(a / b)
      must(ex.answer === exp && ex.answer > 0, 'word answer')
      if (ex.op === 'div') must(a % b === (ex.remainder ?? 0), 'word remainder')
      must(!/\{a\}|\{b\}/.test(ex.text), 'numbers filled in')
      must(ex.text.includes(String(a)) && ex.text.includes(String(b)), 'operands in text')
      must(ex.unit.length > 0, 'unit')
      must(ex.skill === `word:${ex.op}`, 'word skill')
      break
    }
  }
  return errs
}

describe('generate — every kind, thousands of seeded generations', () => {
  it.each(ALL_KINDS)('%s: answers verified with independent arithmetic', (kind) => {
    const problems: string[] = []
    for (let seed = 1; seed <= 150; seed++) {
      const rng = createRng(seed)
      const exs = generate({ kinds: [kind] }, 10, { rng })
      expect(exs).toHaveLength(10)
      for (const ex of exs) {
        expect(ex.kind).toBe(kind)
        problems.push(...verify(ex))
      }
    }
    expect(problems.slice(0, 10)).toEqual([])
  })

  it('column ops across every digits × regroup combination hit exact carry/borrow counts', () => {
    const problems: string[] = []
    for (const digits of [2, 3, 4] as const) {
      for (const regroup of ['none', 'one', 'many', 'any'] as const) {
        for (let seed = 1; seed <= 60; seed++) {
          const rng = createRng(seed * 31 + digits)
          for (const ex of generate({ kinds: ['column-add', 'column-sub'], digits, regroup }, 8, { rng })) {
            problems.push(...verify(ex))
            const p = parseSkill(ex.skill)!
            const n = ex.kind === 'column-add'
              ? refCarryCount((ex as ColumnAddExercise).operands)
              : refBorrowed((ex as ColumnSubExercise).minuend, (ex as ColumnSubExercise).subtrahend).filter(Boolean).length
            if (p.type === 'sub' && p.zero) {
              expect(regroup === 'many' || regroup === 'any').toBe(true)
              expect(n).toBeGreaterThanOrEqual(2)
              continue
            }
            if (regroup === 'none') expect(n).toBe(0)
            if (regroup === 'one') expect(n).toBe(1)
            // 2-digit subtraction can borrow at most once: 'many' falls back to the maximum possible.
            if (regroup === 'many') expect(n).toBeGreaterThanOrEqual(ex.kind === 'column-sub' && digits === 2 ? 1 : 2)
            const top = ex.kind === 'column-add' ? (ex as ColumnAddExercise).operands[0] : (ex as ColumnSubExercise).minuend
            const big = ex.kind === 'column-add' ? Math.max(...(ex as ColumnAddExercise).operands) : top
            expect(len(big)).toBe(digits)
            if (ex.kind === 'column-sub') {
              const s = ex as ColumnSubExercise
              expect(len(s.subtrahend)).toBeGreaterThanOrEqual(digits - 1)
              expect(len(s.answer)).toBe(digits) // the result keeps all its digits (no 1002 − 998)
            } else {
              const a = ex as ColumnAddExercise
              expect(Math.min(...a.operands.map(len))).toBeGreaterThanOrEqual(digits - 1)
            }
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([])
  })

  it("regroup 'any' covers every carry count, and 'many' reaches the maximum", () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 80; seed++) {
      for (const ex of generate({ kinds: ['column-add'], digits: 3 }, 8, { rng: createRng(seed) })) seen.add(ex.skill)
      for (const ex of generate({ kinds: ['column-add'], digits: 4, regroup: 'many' }, 4, { rng: createRng(seed) })) seen.add(ex.skill)
      for (const ex of generate({ kinds: ['column-sub'], digits: 4 }, 8, { rng: createRng(seed) })) seen.add(ex.skill)
    }
    for (const k of ['add:3d:c0', 'add:3d:c1', 'add:3d:c2', 'add:3d:c3', 'add:4d:c2', 'add:4d:c3', 'sub:4d:b0', 'sub:4d:b1', 'sub:4d:b2', 'sub:4d:b3', 'sub:4d:z']) {
      expect(seen.has(k), k).toBe(true)
    }
    expect(seen.has('add:4d:c4')).toBe(false)
  })

  it('zeros: true → every subtraction borrows across a zero; zeros: false → never', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const digits of [3, 4] as const) {
        const z = generate({ kinds: ['column-sub'], digits, zeros: true }, 6, { rng: createRng(seed) }) as ColumnSubExercise[]
        for (const ex of z) {
          expect(refZeroBorrow(ex.minuend, ex.subtrahend), ex.id).toBe(true)
          expect(ex.skill).toBe(`sub:${digits}d:z`)
        }
        const nz = generate({ kinds: ['column-sub'], digits, zeros: false, regroup: 'many' }, 6, { rng: createRng(seed) }) as ColumnSubExercise[]
        for (const ex of nz) expect(refZeroBorrow(ex.minuend, ex.subtrahend), ex.id).toBe(false)
      }
    }
    // Infers column-sub from `zeros` alone; 2 digits cannot borrow across a zero → uses 3.
    const inferred = generate({ zeros: true, digits: 2 }, 5, { rng: createRng(3) })
    expect(inferred.every((e) => e.kind === 'column-sub' && e.skill === 'sub:3d:z')).toBe(true)
  })

  it('workbook-style subtraction examples include borrowing across zeros when zeros is unspecified', () => {
    let z = 0
    let total = 0
    for (let seed = 1; seed <= 100; seed++) {
      for (const ex of generate({ kinds: ['column-sub'], digits: 3, regroup: 'any' }, 10, { rng: createRng(seed) })) {
        total++
        if (ex.skill.endsWith(':z')) z++
      }
    }
    expect(z / total).toBeGreaterThan(0.1)
    expect(z / total).toBeLessThan(0.35)
  })

  it('tables and factorRange are respected by every fact kind', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = createRng(seed)
      const tables = [[6], [7], [8], [6, 7, 8], [3, 4]][seed % 5]
      const fr: [number, number] = seed % 2 ? [2, 9] : [1, 10]
      const sel: SkillSelector = { kinds: ['fact-mul', 'missing-factor', 'fact-div', 'skip-count'], tables, factorRange: fr }
      for (const ex of generate(sel, 12, { rng })) {
        if (ex.kind === 'fact-mul' || ex.kind === 'missing-factor') {
          const inT = tables.includes(ex.a) ? ex.b : tables.includes(ex.b) ? ex.a : null
          expect(inT, ex.id).not.toBeNull()
          expect(inT! >= fr[0] && inT! <= fr[1], ex.id).toBe(true)
        } else if (ex.kind === 'fact-div') {
          const q = ex.answer
          const d = ex.divisor
          const ok = (tables.includes(d) && q >= fr[0] && q <= fr[1]) || (tables.includes(q) && d >= fr[0] && d <= fr[1])
          expect(ok, ex.id).toBe(true)
          expect(d).toBeGreaterThan(1)
        } else if (ex.kind === 'skip-count') {
          expect(tables).toContain(ex.step)
        }
      }
    }
  })

  it('fact items vary orientation (7×6 and 6×7) and never repeat within a call when the pool allows', () => {
    const orient = { tableFirst: 0, tableSecond: 0 }
    for (let seed = 1; seed <= 200; seed++) {
      const exs = generate({ tables: [7], factorRange: [2, 9] }, 8, { rng: createRng(seed) })
      const ids = exs.map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
      const skills = exs.map((e) => e.skill)
      expect(new Set(skills).size).toBe(skills.length)
      for (const e of exs) {
        if (e.kind !== 'fact-mul' || e.a === e.b) continue
        if (e.a === 7) orient.tableFirst++
        else orient.tableSecond++
      }
    }
    expect(orient.tableFirst).toBeGreaterThan(300)
    expect(orient.tableSecond).toBeGreaterThan(300)
  })

  it('down-weights trivial ×1 and ×10 facts', () => {
    let trivial = 0
    let total = 0
    for (let seed = 1; seed <= 200; seed++) {
      for (const e of generate({ tables: [6] }, 5, { rng: createRng(seed) })) {
        total++
        if (e.kind === 'fact-mul' && (e.a === 1 || e.b === 1 || e.a === 10 || e.b === 10)) trivial++
      }
    }
    expect(trivial / total).toBeLessThan(0.12)
    // ...unless explicitly asked for.
    const ones = generate({ tables: [1] }, 10, { rng: createRng(1) })
    expect(ones.every((e) => e.kind === 'fact-mul' && (e.a === 1 || e.b === 1))).toBe(true)
  })

  it('no skill appears twice in a row when repeats are needed', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const exs = generate({ tables: [6], factorRange: [6, 9] }, 12, { rng: createRng(seed) })
      for (let i = 1; i < exs.length; i++) expect(exs[i].skill).not.toBe(exs[i - 1].skill)
    }
  })

  it('avoidIds steers away from recently seen items', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const first = generate({ tables: [8], factorRange: [2, 9] }, 4, { rng: createRng(seed) })
      const avoid = first.flatMap((e) => (e.kind === 'fact-mul' ? [`fact-mul:${e.a}x${e.b}`, `fact-mul:${e.b}x${e.a}`] : []))
      const next = generate({ tables: [8], factorRange: [2, 9] }, 4, { rng: createRng(seed + 1000), avoidIds: avoid })
      for (const e of next) expect(avoid).not.toContain(e.id)
    }
    // Column ops: ids are regenerated until fresh.
    const cols = generate({ kinds: ['column-add'], digits: 3, regroup: 'none' }, 20, { rng: createRng(9) })
    expect(new Set(cols.map((e) => e.id)).size).toBe(20)
    const again = generate({ kinds: ['column-add'], digits: 3, regroup: 'none' }, 20, { rng: createRng(9), avoidIds: cols.map((c) => c.id) })
    expect(again.filter((e) => cols.some((c) => c.id === e.id))).toHaveLength(0)
    // Exhausted pools still return `count` items.
    const tiny = generate({ tables: [2], factorRange: [3, 3] }, 5, { rng: createRng(1), avoidIds: ['fact-mul:2x3', 'fact-mul:3x2'] })
    expect(tiny).toHaveLength(5)
  })

  it('is deterministic for a given seed and differs across seeds', () => {
    const sel: SkillSelector = { kinds: ['fact-mul', 'column-add', 'column-sub', 'division', 'word-problem'], tables: [6, 7, 8], digits: 3 }
    const a = generate(sel, 15, { rng: createRng(1234) })
    const b = generate(sel, 15, { rng: createRng(1234) })
    const c = generate(sel, 15, { rng: createRng(4321) })
    expect(a).toEqual(b)
    expect(a.map((e) => e.id)).not.toEqual(c.map((e) => e.id))
    // Same selector + same `now` without an rng is reproducible too.
    const now = new Date('2026-10-21T10:00:00Z')
    expect(generate(sel, 6, { now })).toEqual(generate(sel, 6, { now }))
    expect(generate(sel, 6)).toHaveLength(6)
  })

  it('splits the count evenly between kinds', () => {
    const exs = generate({ kinds: ['fact-mul', 'column-add', 'division'] }, 9, { rng: createRng(5) })
    const counts = new Map<string, number>()
    for (const e of exs) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1)
    expect([...counts.values()]).toEqual([3, 3, 3])
    expect(generate({ kinds: ['fact-mul', 'column-add'] }, 3, { rng: createRng(5) })).toHaveLength(3)
  })

  it('handles count 0, negative counts and empty / odd selectors gracefully', () => {
    expect(generate({}, 0)).toEqual([])
    expect(generate({}, -3)).toEqual([])
    const def = generate({}, 5, { rng: createRng(1) })
    expect(def.every((e) => e.kind === 'fact-mul')).toBe(true)
    const weird = generate({ tables: [0, 13, 6.5], factorRange: [12, -4] }, 5, { rng: createRng(1) })
    expect(weird).toHaveLength(5)
    expect(weird.every((e) => e.kind === 'fact-mul' && e.a >= 1 && e.a <= 10 && e.b >= 1 && e.b <= 10)).toBe(true)
    expect(generate({ skills: ['nope', 'mul:11x2'] }, 3, { rng: createRng(1) })).toHaveLength(3)
    expect(generate({ kinds: ['column-add'], skills: ['mul:6x7'] }, 2, { rng: createRng(1) }).every((e) => e.skill === 'mul:6x7')).toBe(true)
  })
})

describe('generate — explicit skills and selector inference', () => {
  it('honours explicit skills exactly, with their natural kind', () => {
    const skills = ['mul:6x7', 'div:42/6', 'skip:8', 'add:4d:c2', 'sub:3d:z', 'sub:4d:b1', 'mul:2x1:c1', 'div:2x1:long', 'concept:groups', 'concept:family', 'word:div']
    for (let seed = 1; seed <= 40; seed++) {
      const exs = generate({ skills }, 22, { rng: createRng(seed) })
      expect(exs).toHaveLength(22)
      for (const e of exs) {
        expect(skills).toContain(e.skill)
        expect(verify(e)).toEqual([])
      }
      expect(new Set(exs.map((e) => e.skill)).size).toBe(skills.length)
    }
  })

  it('explicit skills combined with kinds use the compatible kinds', () => {
    const exs = generate({ skills: ['mul:4x7', 'mul:7x8', 'add:3d:c1'], kinds: ['missing-factor', 'double-chain', 'word-problem'] }, 30, { rng: createRng(2) })
    const kinds = new Set(exs.map((e) => e.kind))
    expect(kinds.has('missing-factor')).toBe(true)
    expect(kinds.has('double-chain')).toBe(true)
    expect(kinds.has('word-problem')).toBe(true)
    for (const e of exs) {
      if (e.kind === 'word-problem') {
        expect(e.op).toBe('add')
        expect(refCarryCount((e as WordProblemExercise).operands)).toBe(1)
      }
      if (e.kind === 'double-chain') expect(['mul:4x7', 'mul:7x8']).toContain(e.skill)
    }
  })

  it('concept skills map to their exercises', () => {
    const map: Record<string, ExerciseKind> = {
      'concept:groups': 'groups', 'concept:array': 'array', 'concept:commutative': 'array', 'concept:share': 'fact-div',
      'concept:family': 'fact-family', 'concept:placevalue': 'column-add',
    }
    for (const [skill, kind] of Object.entries(map)) {
      const [e] = generate({ skills: [skill] }, 1, { rng: createRng(7) })
      expect(e.kind).toBe(kind)
      expect(e.skill).toBe(skill)
      expect(verify(e)).toEqual([])
    }
    const commFact = generate({ skills: ['concept:commutative'], kinds: ['fact-mul'] }, 3, { rng: createRng(1) })
    expect(commFact.every((e) => e.kind === 'fact-mul' && e.skill === 'concept:commutative')).toBe(true)
    const pv = generate({ skills: ['concept:placevalue'] }, 3, { rng: createRng(1) }) as ColumnAddExercise[]
    expect(pv.every((e) => refCarryCount(e.operands) === 0)).toBe(true)
  })

  it('infers kinds from the selector fields', () => {
    expect(generate({ divisionVariants: ['rem'] }, 3, { rng: createRng(1) }).every((e) => e.kind === 'division' && e.skill === 'div:2x1:rem')).toBe(true)
    expect(generate({ digits: 4 }, 3, { rng: createRng(1) }).every((e) => e.kind === 'column-add')).toBe(true)
    expect(generate({ regroup: 'none' }, 3, { rng: createRng(1) }).every((e) => e.kind === 'column-add' && e.skill === 'add:3d:c0')).toBe(true)
  })

  it('division variants and tables (divisors) are honoured', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const exs = generate({ kinds: ['division'], divisionVariants: ['long'], tables: [3, 4] }, 4, { rng: createRng(seed) }) as DivisionExercise[]
      for (const e of exs) {
        expect(e.variant).toBe('long')
        expect([3, 4]).toContain(e.divisor)
      }
      const def = generate({ kinds: ['division'] }, 4, { rng: createRng(seed) }) as DivisionExercise[]
      for (const e of def) expect(['exact', 'rem']).toContain(e.variant)
    }
  })

  it('column-mul honours regroup and tables (multiplier)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const none = generate({ kinds: ['column-mul'], regroup: 'none' }, 3, { rng: createRng(seed) }) as ColumnMulExercise[]
      expect(none.every((e) => e.skill === 'mul:2x1:c0')).toBe(true)
      const carry = generate({ kinds: ['column-mul'], regroup: 'one', tables: [6, 7, 8] }, 3, { rng: createRng(seed) }) as ColumnMulExercise[]
      expect(carry.every((e) => e.skill === 'mul:2x1:c1' && [6, 7, 8].includes(e.bottom))).toBe(true)
    }
  })

  it('word problems follow the selector: tables → mul/div facts, digits → column numbers, zeros → subtraction', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const facts = generate({ kinds: ['word-problem'], tables: [6] }, 4, { rng: createRng(seed) }) as WordProblemExercise[]
      for (const e of facts) {
        expect(['mul', 'div']).toContain(e.op)
        expect(e.operands[1]).toBe(6)
      }
      const big = generate({ kinds: ['word-problem'], digits: 4, regroup: 'one' }, 4, { rng: createRng(seed) }) as WordProblemExercise[]
      for (const e of big) {
        expect(['add', 'sub']).toContain(e.op)
        expect(len(Math.max(...e.operands))).toBe(4)
        if (e.op === 'add') expect(refCarryCount(e.operands)).toBe(1)
        else expect(refBorrowed(e.operands[0], e.operands[1]).filter(Boolean).length).toBe(1)
      }
      const z = generate({ kinds: ['word-problem'], zeros: true, digits: 4 }, 2, { rng: createRng(seed) }) as WordProblemExercise[]
      for (const e of z) {
        expect(e.op).toBe('sub')
        expect(refZeroBorrow(e.operands[0], e.operands[1])).toBe(true)
      }
      const twoByOne = generate({ kinds: ['word-problem'], digits: 2 }, 4, { rng: createRng(seed) }) as WordProblemExercise[]
      for (const e of twoByOne) {
        expect(verify(e)).toEqual([])
        if (e.op === 'mul') expect(len(e.operands[1])).toBe(2)
        if (e.op === 'div') expect(e.remainder).toBeUndefined()
      }
      const divs = generate({ kinds: ['word-problem'], divisionVariants: ['exact', 'long'] }, 2, { rng: createRng(seed) }) as WordProblemExercise[]
      for (const e of divs) if (e.op === 'div') expect(e.operands[0] % e.operands[1]).toBe(0)
    }
    const fromSkills = generate({ skills: ['mul:2x1:c1', 'div:2x1:rem', 'sub:4d:b2'], kinds: ['word-problem'] }, 9, { rng: createRng(3) }) as WordProblemExercise[]
    for (const e of fromSkills) {
      expect(verify(e)).toEqual([])
      if (e.op === 'mul') expect((e.operands[1] % 10) * e.operands[0]).toBeGreaterThanOrEqual(10)
      if (e.op === 'div') expect(e.remainder).toBeUndefined()
      if (e.op === 'sub') expect(refBorrowed(e.operands[0], e.operands[1]).filter(Boolean).length).toBe(2)
    }
  })

  it('tells a different story each time within a call when possible', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const exs = generate({ kinds: ['word-problem'], tables: [6] }, 8, { rng: createRng(seed) }) as WordProblemExercise[]
      const templates = exs.map((e) => e.id.split(':')[1])
      expect(new Set(templates).size).toBe(templates.length)
    }
  })

  it('fact templates with a story-fixed number only appear when that table is practised', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const exs = generate({ kinds: ['word-problem'], tables: [3] }, 4, { rng: createRng(seed) }) as WordProblemExercise[]
      for (const e of exs) {
        expect(e.text).not.toMatch(/patas|tentáculos|semana|colores|ruedas/)
        expect(e.operands[1]).toBe(3)
      }
    }
  })
})

describe('generate — adaptive with mastery', () => {
  const now = new Date('2026-10-21T10:00:00Z')
  const past = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()
  const future = (days: number) => new Date(now.getTime() + days * 86400000).toISOString()

  function m(skill: string, box: number, dueAt: string): MasteryMap[string] {
    return { ...newMastery(skill, now), box: box as 0, attempts: 5, correct: 3, dueAt, lastSeenAt: past(1) }
  }

  it('never introduces more than 3 brand-new hard facts per call and mixes ~30% new', () => {
    const mastery: MasteryMap = {}
    for (const n of [1, 2, 5, 10]) mastery[`mul:${Math.min(6, n)}x${Math.max(6, n)}`] = m(`mul:${Math.min(6, n)}x${Math.max(6, n)}`, 3, future(3))
    for (let seed = 1; seed <= 100; seed++) {
      const exs = generate({ tables: [6, 7, 8], adaptive: true }, 10, { rng: createRng(seed), mastery, now })
      const fresh = new Set(exs.map((e) => e.skill).filter((s) => !mastery[s] && !/(^mul:(1|2|5|10)x)|x(1|2|5|10)$/.test(s)))
      expect(fresh.size).toBeLessThanOrEqual(3)
      const newItems = exs.filter((e) => !mastery[e.skill]).length
      expect(newItems).toBeGreaterThanOrEqual(2)
      expect(newItems).toBeLessThanOrEqual(7)
    }
  })

  it('a brand-new child gets at most 3 new hard facts, repeated, plus easy ones', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const exs = generate({ tables: [7], factorRange: [3, 9], adaptive: true }, 12, { rng: createRng(seed), mastery: {}, now })
      expect(exs).toHaveLength(12)
      const hard = new Set(exs.map((e) => e.skill).filter((s) => !/x5$|^mul:5x/.test(s)))
      expect(hard.size).toBeLessThanOrEqual(3)
    }
    // If every candidate is hard and new, the 3 new facts simply repeat.
    const only = generate({ skills: ['mul:6x7', 'mul:6x8', 'mul:7x8', 'mul:7x7', 'mul:8x8'], adaptive: true }, 9, { rng: createRng(1), mastery: {}, now })
    expect(new Set(only.map((e) => e.skill)).size).toBe(3)
  })

  it('puts due and weak skills first and repeats them before well-known ones', () => {
    const mastery: MasteryMap = {
      'mul:6x7': m('mul:6x7', 0, past(0)),
      'mul:6x8': m('mul:6x8', 1, past(2)),
      'mul:3x6': m('mul:3x6', 5, future(10)),
      'mul:4x6': m('mul:4x6', 4, future(5)),
      'mul:6x9': m('mul:6x9', 4, future(6)),
      'mul:6x6': m('mul:6x6', 3, future(2)),
    }
    let dueCount = 0
    for (let seed = 1; seed <= 100; seed++) {
      const exs = generate({ tables: [6], factorRange: [3, 9], adaptive: true }, 5, { rng: createRng(seed), mastery, now })
      const skills = exs.map((e) => e.skill)
      if (skills.includes('mul:6x7') && skills.includes('mul:6x8')) dueCount++
      expect(skills.filter((s) => s === 'mul:3x6').length).toBeLessThanOrEqual(1)
    }
    expect(dueCount).toBe(100)
  })

  it('adaptive column skills: weak carry levels are practised, new ones introduced', () => {
    const mastery: MasteryMap = { 'add:3d:c2': m('add:3d:c2', 0, past(1)), 'add:3d:c0': m('add:3d:c0', 5, future(9)) }
    const exs = generate({ kinds: ['column-add'], digits: 3, adaptive: true }, 6, { rng: createRng(4), mastery, now })
    expect(exs.filter((e) => e.skill === 'add:3d:c2').length).toBeGreaterThanOrEqual(1)
    expect(exs.some((e) => e.skill === 'add:3d:c1' || e.skill === 'add:3d:c3')).toBe(true)
  })

  it('adaptive without mastery behaves like uniform; first item is a familiar one', () => {
    const plain = generate({ tables: [6], adaptive: true }, 6, { rng: createRng(1) })
    expect(plain).toHaveLength(6)
    const mastery: MasteryMap = { 'mul:6x7': m('mul:6x7', 2, past(1)) }
    for (let seed = 1; seed <= 50; seed++) {
      const exs = generate({ tables: [6], factorRange: [6, 9], adaptive: true }, 4, { rng: createRng(seed), mastery, now })
      expect(exs[0].skill).toBe('mul:6x7')
    }
  })

  it('when the new-fact budget is spent by an earlier kind, later kinds never introduce more hard facts', () => {
    // Every fact here is hard (factors 6..9), so the second kind has nothing it may introduce: its share is
    // delivered with repeats of the facts the first kind already introduced.
    const exs = generate(
      { kinds: ['fact-mul', 'fact-div'], tables: [7], factorRange: [6, 9], adaptive: true },
      10, { rng: createRng(3), mastery: {}, now },
    )
    expect(exs).toHaveLength(10)
    const hardFacts = new Set(exs.map((e) => e.skill).filter((s) => s.startsWith('mul:') || s.startsWith('div:')))
    expect(hardFacts.size).toBeLessThanOrEqual(3)
    expect(exs.filter((e) => e.kind === 'fact-div')).toHaveLength(0)
  })

  it('the budget also holds when a later kind has only hard facts and nothing it may repeat yet', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const exs = generate(
        { kinds: ['fact-mul', 'missing-factor', 'fact-div'], tables: [6, 7, 8], factorRange: [6, 9], adaptive: true },
        12, { rng: createRng(seed), mastery: {}, now },
      )
      expect(exs).toHaveLength(12)
      const hardFacts = new Set(exs.map((e) => e.skill).filter((s) => s.startsWith('mul:') || s.startsWith('div:')))
      expect(hardFacts.size).toBeLessThanOrEqual(3)
    }
  })

  it('avoidIds also steers missing-factor items', () => {
    const all = ['?x7=42', '6x?=42', '?x6=42', '7x?=42'].map((s) => `missing-factor:${s}`)
    const exs = generate({ kinds: ['missing-factor'], tables: [6], factorRange: [6, 7] }, 1, { rng: createRng(2), avoidIds: all })
    expect(exs[0].skill).toBe('mul:6x6')
  })
})
