/* ¿Tiene sentido? (word:sense, 4.º): a story with a proposed answer. The generator, the answers that are absurd or the
   true result, the grading of the option, and hints that never state the answer. */
import { describe, expect, it } from 'vitest'
import type { Answer, ShapeChoiceExercise } from '@/types'
import { check, createRng, describeSkill, generate, hintsFor, kindsForSkill, parseSkill } from '@/engine'
import { buildSense, genWordSense } from '@/engine/wordProblems'

const SAMPLES = 400
const OPTIONS = ['Sí, tiene sentido', 'No, no tiene sentido']

/** Is the proposal absurd for the story, or an order of magnitude away from the true result? */
function plausibleWrong(p: { op: string; a: number; b: number; right: number; shown: number }): boolean {
  const { op, a, b, right, shown } = p
  if (shown === right * 10) return true
  if (right % 10 === 0 && right >= 20 && shown === right / 10) return true
  if (op === 'add') return shown < Math.max(a, b)
  if (op === 'sub') return shown > a
  if (op === 'mul') return shown < b
  return shown > a
}

describe('word:sense: skill key', () => {
  it('parses to its own type, is a shape-choice, and has an adult description', () => {
    expect(parseSkill('word:sense')).toEqual({ type: 'word-sense' })
    expect(kindsForSkill('word:sense')).toEqual(['shape-choice'])
    expect(describeSkill('word:sense').length).toBeGreaterThan(3)
  })
})

describe('word:sense: generation', () => {
  it('the true result of each story is the arithmetic of its operands, and the proposal is never negative or equal to it when wrong', () => {
    const rng = createRng(501)
    for (let i = 0; i < SAMPLES; i++) {
      const p = buildSense(rng)
      const want = p.op === 'add' ? p.a + p.b : p.op === 'sub' ? p.a - p.b : p.op === 'mul' ? p.a * p.b : p.a / p.b
      expect(p.right, p.exercise.id).toBe(want)
      expect(p.right, p.exercise.id).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(p.shown) && p.shown >= 1, p.exercise.id).toBe(true)
      if (p.shown !== p.right) expect(plausibleWrong(p), p.exercise.id).toBe(true)
    }
  })

  it('about half of the proposals are the true result (the answer is «Sí» then), the rest are «No»', () => {
    const rng = createRng(502)
    let yes = 0
    for (let i = 0; i < SAMPLES; i++) {
      const p = buildSense(rng)
      const ex = p.exercise
      const isYes = ex.options[ex.answer] === OPTIONS[0]
      expect(isYes, ex.id).toBe(p.shown === p.right)
      if (isYes) yes++
    }
    expect(yes / SAMPLES).toBeGreaterThan(0.4)
    expect(yes / SAMPLES).toBeLessThan(0.6)
  })

  it('is a shape-choice without figures: the story is the question, with two options in a random order', () => {
    const rng = createRng(503)
    const orders = new Set<string>()
    for (let i = 0; i < 80; i++) {
      const ex = genWordSense(rng)
      expect(ex.kind).toBe('shape-choice')
      expect(ex.skill).toBe('word:sense')
      expect(ex.figures).toEqual([])
      expect([...ex.options].sort()).toEqual([...OPTIONS].sort())
      expect(ex.question).toContain('Lumi responde')
      expect(ex.question.endsWith('¿Tiene sentido esa respuesta?')).toBe(true)
      orders.add(ex.options.join('|'))
    }
    expect(orders.size).toBe(2)
  })

  it('is deterministic for a seed and reachable through the generator of the skill', () => {
    expect(genWordSense(createRng(7))).toEqual(genWordSense(createRng(7)))
    const built = generate({ skills: ['word:sense'] }, 30, { rng: createRng(8) })
    expect(built).toHaveLength(30)
    expect(built.every((e) => e.kind === 'shape-choice' && e.skill === 'word:sense')).toBe(true)
  })
})

describe('word:sense: grading and hints', () => {
  it('the option that makes sense is correct, the other one is not, and a missing choice is incomplete', () => {
    const rng = createRng(504)
    for (let i = 0; i < 120; i++) {
      const ex: ShapeChoiceExercise = genWordSense(rng)
      const right: Answer = { type: 'choice', index: ex.answer }
      const wrongIndex = ex.options.findIndex((_, k) => k !== ex.answer)
      expect(check(ex, right).correct, ex.id).toBe(true)
      expect(check(ex, { type: 'choice', index: wrongIndex }).correct, ex.id).toBe(false)
      expect(check(ex, { type: 'choice', index: null }).errorType).toBe('incomplete')
    }
  })

  it('hints never state the option, never say sí or no, never give the true result', () => {
    const rng = createRng(505)
    for (let i = 0; i < SAMPLES; i++) {
      const p = buildSense(rng)
      const hints = hintsFor(p.exercise)
      expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
      for (const h of hints) {
        expect(/\b(sí|no)\b/i.test(h.text), h.text).toBe(false)
        for (const option of OPTIONS) expect(h.text.toLowerCase().includes(option.toLowerCase()), h.text).toBe(false)
        expect(/\d/.test(h.text), h.text).toBe(false)
        expect(new RegExp(`(^|\\D)${p.right}(\\D|$)`).test(h.text), `${p.right}: ${h.text}`).toBe(false)
      }
    }
  })
})
