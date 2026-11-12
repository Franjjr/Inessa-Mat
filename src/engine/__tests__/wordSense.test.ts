/* ¿Tiene sentido? (word:sense, 4.º): a story with a proposed answer. The generator, the answers that are absurd or the
   true result, the grading of the option, and hints that never state the answer. */
import { describe, expect, it } from 'vitest'
import type { Answer, ShapeChoiceExercise } from '@/types'
import { check, createRng, describeSkill, generate, hintsFor, kindsForSkill, parseSkill } from '@/engine'
import { buildSense, genWordSense } from '@/engine/wordProblems'

const SAMPLES = 400
const OPTIONS = ['Sí, tiene sentido', 'No, no tiene sentido']
const EXACT = ['Sí, es correcta', 'No, no es correcta']

/** Is the proposal absurd for the story, or an order of magnitude away from the true result? A close proposal (near) is
    a step off the right result: by one under 10, by ten under 100, by ten or a hundred above that. */
function plausibleWrong(p: { op: string; a: number; b: number; right: number; shown: number; near: boolean }): boolean {
  const { op, a, b, right, shown, near } = p
  if (near) {
    const step = Math.abs(shown - right)
    if (right < 10) return step === 1
    if (right < 100) return step === 10
    return step === 10 || step === 100
  }
  if (shown === right * 10) return true
  if (right % 10 === 0 && right >= 20 && shown === right / 10) return true
  if (op === 'add') return shown < Math.max(a, b)
  if (op === 'sub') return shown > a
  if (op === 'mul') return shown < b
  return shown > a
}

/** The number in words (Spanish, masculine forms, up to 1 999), to check that a hint does not spell the answer out. */
function inWords(n: number): string {
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const twenties = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
  const tens = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
  const parts: string[] = []
  const thousands = Math.floor(n / 1000)
  const h = Math.floor(n / 100) % 10
  const rest = n % 100
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${units[thousands]} mil`)
  if (h) parts.push(h === 1 && rest === 0 ? 'cien' : hundreds[h])
  if (rest) {
    if (rest < 10) parts.push(units[rest])
    else if (rest < 20) parts.push(teens[rest - 10])
    else if (rest < 30) parts.push(twenties[rest - 20])
    else parts.push(rest % 10 ? `${tens[Math.floor(rest / 10)]} y ${units[rest % 10]}` : tens[Math.floor(rest / 10)])
  }
  return parts.join(' ')
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
      const isYes = ex.options[ex.answer].startsWith('Sí')
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
      const exact = ex.question.endsWith('¿Es correcta la respuesta de Lumi?')
      expect([...ex.options].sort()).toEqual([...(exact ? EXACT : OPTIONS)].sort())
      expect(ex.question).toContain('Lumi responde')
      expect(exact || ex.question.endsWith('¿Tiene sentido esa respuesta?')).toBe(true)
      orders.add(ex.options.join('|'))
    }
    expect(orders.size).toBe(4)
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

  it('hints never spell the true result out in words either (the examples use numbers no story can give)', () => {
    const rng = createRng(506)
    for (let i = 0; i < 2 * SAMPLES; i++) {
      const p = buildSense(rng)
      // Results of a thousand or more are not checked: their words start with «mil», which the examples also use.
      if (p.right >= 1000) continue
      const word = inWords(p.right)
      // «tres mil» is a thousands group in an example, not the answer «tres».
      const spelled = new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])(?! mil)`, 'iu')
      for (const h of hintsFor(p.exercise)) expect(spelled.test(h.text), `${p.right} «${word}»: ${h.text}`).toBe(false)
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
        for (const option of [...OPTIONS, ...EXACT]) expect(h.text.toLowerCase().includes(option.toLowerCase()), h.text).toBe(false)
        expect(/\d/.test(h.text), h.text).toBe(false)
        expect(new RegExp(`(^|\\D)${p.right}(\\D|$)`).test(h.text), `${p.right}: ${h.text}`).toBe(false)
      }
    }
  })
})
