/* Problemas con barras: generation (every kind, the ladder with and without the drawing), grading of the placement,
   the operations and the steps, and hints that never state the result. */
import { describe, expect, it } from 'vitest'
import type { Answer, BarProblemExercise, MasteryMap } from '@/types'
import { barChips, barHints, checkBar, createRng, generate, genBarProblem, newMastery, type BarSkillOp } from '@/engine'

const OPS: BarSkillOp[] = ['add', 'sub', 'mul', 'div', 'two']

function samples(skill: BarSkillOp, n = 60, withBar = true): BarProblemExercise[] {
  const rng = createRng(1000 + skill.length * 17)
  return Array.from({ length: n }, () => genBarProblem(skill, rng, withBar))
}

/** The answer a child would give with the drawing filled in correctly. */
function perfect(ex: BarProblemExercise): Answer {
  return {
    type: 'bar',
    placed: ex.bar.map((b) => (ex.withBar ? b.value : null)),
    ops: ex.steps.map((s) => s.op),
    results: ex.steps.map((s) => s.result),
  }
}

describe('bar problems: generation', () => {
  it('every skill builds problems whose steps are arithmetic and whose answer is the last result', () => {
    for (const op of OPS) {
      for (const ex of samples(op)) {
        expect(ex.kind).toBe('bar-problem')
        expect(ex.skill).toBe(`bar:${op}`)
        for (const st of ex.steps) {
          const want = st.op === 'add' ? st.a + st.b : st.op === 'sub' ? st.a - st.b : st.op === 'mul' ? st.a * st.b : st.a / st.b
          expect(st.result, ex.id).toBe(want)
          expect(Number.isInteger(st.result) && st.result >= 1, ex.id).toBe(true)
        }
        expect(ex.answer, ex.id).toBe(ex.steps[ex.steps.length - 1].result)
      }
    }
  })

  it('the answer is never one of the numbers of the story (so the hints cannot give it away)', () => {
    for (const op of OPS) {
      for (const ex of samples(op)) {
        const operands = ex.steps.flatMap((s) => [s.a, s.b])
        expect(operands.includes(ex.answer), ex.id).toBe(false)
      }
    }
  })

  it('every given number of the bar appears in the story, and the unknown piece is the only «?»', () => {
    for (const op of OPS) {
      for (const ex of samples(op)) {
        const known = ex.bar.filter((b) => b.value !== null)
        for (const b of known) expect(ex.text, ex.id).toContain(String(b.value))
        const unknown = ex.bar.filter((b) => b.value === null)
        expect(unknown.length, ex.id).toBeGreaterThanOrEqual(1)
        if (op !== 'two') expect(unknown.length, ex.id).toBe(1)
      }
    }
  })

  it('covers the four kinds of PLAN §5 (cambio, comparación, combinación, reparto) and two-step problems', () => {
    const kinds = new Set<string>()
    for (const op of OPS) for (const ex of samples(op, 40)) kinds.add(ex.problem)
    expect([...kinds].sort()).toEqual(['change', 'combine', 'compare', 'share', 'two-step'])
  })

  it('is deterministic for a seed, and the drawing only changes the flag (the same numbers without it)', () => {
    const a = genBarProblem('add', createRng(42), true)
    const b = genBarProblem('add', createRng(42), true)
    expect(a).toEqual(b)
    const plain = genBarProblem('add', createRng(42), false)
    expect(plain.withBar).toBe(false)
    expect(plain.steps).toEqual(a.steps)
    expect(plain.text).toBe(a.text)
  })

  it('the ladder: a child who has mastered the bar of an operation meets the same problem without the drawing', () => {
    const now = new Date('2026-10-22T10:00:00Z')
    const mastered = { 'bar:add': { ...newMastery('bar:add', now), box: 3 } } as MasteryMap
    const plain = generate({ skills: ['bar:add'] }, 6, { rng: createRng(5), mastery: mastered, now })
    expect(plain.every((e) => e.kind === 'bar-problem' && !e.withBar)).toBe(true)
    const withBar = generate({ skills: ['bar:add'] }, 6, { rng: createRng(5), now })
    expect(withBar.every((e) => e.kind === 'bar-problem' && e.withBar)).toBe(true)
  })

  it('chips are exactly the given numbers, in a stable order', () => {
    const ex = samples('add', 1)[0]
    const chips = barChips(ex, 99)
    expect(chips.map((c) => c.value).sort((x, y) => x - y)).toEqual(ex.bar.flatMap((b) => (b.value === null ? [] : [b.value])).sort((x, y) => x - y))
    expect(barChips(ex, 99)).toEqual(chips)
  })
})

describe('bar problems: hints', () => {
  it('never state the answer, at any level', () => {
    for (const op of OPS) {
      for (const ex of samples(op, 40)) {
        for (const h of barHints(ex)) {
          expect(new RegExp(`(^|[^0-9])${ex.answer}([^0-9]|$)`).test(h.text), `${ex.id}: ${h.text}`).toBe(false)
        }
      }
    }
  })

  it('level 1 names the strategy (the drawing), level 3 names the operation of the first step', () => {
    const ex = samples('add', 1)[0]
    const [l1, , l3] = barHints(ex)
    expect(l1.level).toBe(1)
    expect(l1.text.toLowerCase()).toContain('barra')
    expect(l3.level).toBe(3)
    expect(l3.text).toContain(`${ex.steps[0].a}`)
  })
})

describe('bar problems: grading', () => {
  it('a correct drawing, operations and results are correct, with or without the drawing', () => {
    for (const op of OPS) {
      for (const ex of samples(op, 25)) {
        expect(checkBar(ex, perfect(ex)).correct, ex.id).toBe(true)
      }
    }
    const plain = samples('add', 1, false)[0]
    expect(checkBar(plain, perfect(plain)).correct).toBe(true)
  })

  it('a quantity on the wrong piece is a bar-placement error, and the child is pointed to the drawing', () => {
    const ex = samples('add', 1)[0]
    const known = ex.bar.map((b, i) => ({ b, i })).filter((x) => x.b.value !== null)
    expect(known.length).toBeGreaterThanOrEqual(2)
    const placed = ex.bar.map((b) => b.value) as (number | null)[]
    const first = known[0].i
    const second = known[1].i
    const swapped = [...placed]
    swapped[first] = placed[second]
    swapped[second] = placed[first]
    const res = checkBar(ex, { ...perfect(ex), placed: swapped } as Answer)
    if (placed[first] === placed[second]) return // equal numbers cannot be told apart on the bar
    expect(res.correct).toBe(false)
    expect(res.errorType).toBe('bar-placement')
  })

  it('a number still in the pool (not placed) is incomplete, not wrong', () => {
    const ex = samples('add', 1)[0]
    const placed = ex.bar.map((b) => (b.value === null ? null : null))
    const res = checkBar(ex, { ...perfect(ex), placed } as Answer)
    expect(res.correct).toBe(false)
    expect(res.errorType).toBe('incomplete')
  })

  it('the wrong operation is tagged operation, with the operation feedback', () => {
    const ex = samples('sub', 1)[0]
    const wrong: Answer = { ...perfect(ex), ops: ex.steps.map((s) => (s.op === 'sub' ? 'add' : 'sub')) } as Answer
    const res = checkBar(ex, wrong)
    expect(res.correct).toBe(false)
    expect(res.errorType).toBe('operation')
    expect(res.feedback).toBeTruthy()
  })

  it('in a two-step problem the first result is graded as its own step', () => {
    const ex = samples('two', 30).find((e) => e.steps.length === 2)!
    const results = [ex.steps[0].result + 1, ex.steps[1].result]
    const res = checkBar(ex, { ...perfect(ex), results } as Answer)
    expect(res.correct).toBe(false)
    expect(res.errorType).toBe('step')
    const finalWrong = checkBar(ex, { ...perfect(ex), results: [ex.steps[0].result, ex.answer + 1] } as Answer)
    expect(finalWrong.errorType).toBe('fact')
  })
})

describe('bar:mul:small (2.º)', () => {
  it('uses only groups of 2, 3, 4, 5 or 10, at most 5 groups, and keeps its own skill', () => {
    const rng = createRng(77)
    for (let i = 0; i < 300; i++) {
      const ex = genBarProblem('mul', rng, i % 2 === 0, true)
      expect(ex.skill).toBe('bar:mul:small')
      const [step] = ex.steps
      expect([2, 3, 4, 5, 10]).toContain(step.b)
      expect(step.a).toBeGreaterThanOrEqual(2)
      expect(step.a).toBeLessThanOrEqual(5)
      expect(ex.answer).toBe(step.a * step.b)
    }
  })

  it('is generated from its skill key, and the generic bar:mul still reaches 6 to 9', () => {
    const small = generate({ skills: ['bar:mul:small'] }, 40, { rng: createRng(5) }) as BarProblemExercise[]
    expect(small.length).toBeGreaterThan(0)
    for (const ex of small) expect([2, 3, 4, 5, 10]).toContain(ex.steps[0].b)
    const rng = createRng(9)
    const sizes = new Set(Array.from({ length: 200 }, () => genBarProblem('mul', rng).steps[0].b))
    expect([...sizes].some((p) => p >= 6)).toBe(true)
  })
})
