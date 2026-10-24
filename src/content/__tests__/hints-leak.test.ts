/* Every skill of the temarios of 3.º and 4.º: no hint gives the answer away. The answer is each number the child writes (in
   any written form: «3000», «3 000», decimals with comma) or the text of the right option of a choice exercise. Whole
   numbers only: a one-digit answer does not match inside another number, a time, a fraction or a thousands group. */
import { describe, expect, it } from 'vitest'
import { generate, hintsFor, makeFactDiv, statementOf, strategyForFact } from '@/engine'
import type { Exercise, Hint } from '@/types'
import { GRADE3_SYLLABUS, GRADE4_SYLLABUS, availableSkills } from '@/content/syllabus'

const now = new Date('2026-10-22T10:00:00.000Z')
const PER_SKILL = 30
const SPACE = '[\\s\\u00a0\\u202f]'

/** Facts whose strategy is a rhyme that IS the fact («siete por siete, cuarenta y nueve»): the workbook's memory trick. */
const RHYME_STRATEGIES = new Set(['square-rhyme', 'five-six-seven-eight', 'weeks', 'easy-one', 'even-six-rhyme'])

/** A whole number as a regex: plain, or with thousands grouped by a normal space (U+0020), a no-break space (U+00A0)
    or a thin space (U+202F). */
function numberPattern(n: number): RegExp | null {
  if (!Number.isInteger(n) || n < 0) return null
  const plain = String(n)
  const grouped = plain.replace(/\B(?=(\d{3})+(?!\d))/g, '\u0000')
  const alternatives = [...new Set([plain, grouped.split('\u0000').join(' '), grouped.split('\u0000').join(' '), grouped.split('\u0000').join(' ')])]
  return wholeToken(alternatives.map(escape))
}

/** A decimal answer written with a comma, one or two places (0,5 and 0,50 …). */
function decimalPattern(n: number): RegExp | null {
  if (Number.isInteger(n) || n < 0) return null
  return wholeToken([n.toFixed(1).replace('.', ','), n.toFixed(2).replace('.', ',')].map(escape))
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The alternatives as one token that is not part of a longer number, a time, a fraction or a thousands group. */
function wholeToken(alternatives: string[]): RegExp {
  const body = `(?:${alternatives.join('|')})`
  return new RegExp(`(?<![\\d.,:/])(?<!\\d${SPACE})${body}(?!\\d)(?![.,:/]\\d)(?!${SPACE}\\d{3}(?!\\d))`, 'u')
}

/** The numbers and texts the child must write for this exercise. */
function answersOf(ex: Exercise): { label: string; pattern: RegExp }[] {
  const out: { label: string; pattern: RegExp }[] = []
  const numbers: number[] = []
  const add = (v: unknown) => {
    if (typeof v === 'number') numbers.push(v)
  }
  const e = ex as unknown as Record<string, unknown>
  if (Array.isArray(e.options) && e.options.every((o) => typeof o === 'string')) {
    const i = typeof e.correct === 'number' ? e.correct : typeof e.answer === 'number' ? e.answer : null
    const text = i !== null ? (e.options as string[])[i] : undefined
    if (text) out.push({ label: `option «${text}»`, pattern: new RegExp(`(?<![\\p{L}\\d])${escape(text)}(?![\\p{L}\\d])`, 'iu') })
  } else if (Array.isArray(e.answer)) {
    e.answer.forEach(add)
  } else if (typeof e.answer === 'string') {
    // Named answers (a money item, a unit) are not numbers: the text is the answer.
    if (e.answer.length > 1) out.push({ label: `«${e.answer}»`, pattern: new RegExp(`(?<![\\p{L}\\d])${escape(e.answer)}(?![\\p{L}\\d])`, 'iu') })
  } else {
    add(e.answer)
  }
  if (ex.kind === 'division') {
    add(ex.quotient)
    if (ex.variant === 'rem') add(ex.remainder)
  }
  if (ex.kind === 'mul-parts') numbers.push(ex.partials[0], ex.partials[1])
  if (ex.kind === 'long-mul') numbers.push(...ex.partials)
  for (const n of numbers) {
    const plain = numberPattern(n)
    if (plain) out.push({ label: String(n), pattern: plain })
    const dec = decimalPattern(n)
    if (dec) out.push({ label: String(n).replace('.', ','), pattern: dec })
  }
  return out
}

/** Whole numbers the statement text shows (statementOf: «96 : 4 = ?», «3 × 14 = ?»): a hint may name one of them, since
    the child reads it in the question. Coordinates, chart data and other fields are not on the statement and do not count. */
function shownNumbers(ex: Exercise): Set<number> {
  const out = new Set<number>()
  for (const m of statementOf(ex).matchAll(/\d+(?:[ \u00a0\u202f]\d{3})*/g)) out.add(Number(m[0].replace(/[ \u00a0\u202f]/g, '')))
  return out
}

/** The hints of an exercise that name one of its answers. Fact strategies that are the fact itself are left out. */
function leaksIn(ex: Exercise, hints: Hint[]): { level: number; text: string; answer: string }[] {
  const shown = shownNumbers(ex)
  const answers = answersOf(ex).filter((a) => !shown.has(Number(a.label)) || Number.isNaN(Number(a.label)))
  const found: { level: number; text: string; answer: string }[] = []
  for (const h of hints) for (const a of answers) if (a.pattern.test(h.text)) found.push({ level: h.level, text: h.text, answer: a.label })
  return found
}

function leaks(ex: Exercise): { level: number; text: string; answer: string }[] {
  if (ex.kind === 'fact-mul' && RHYME_STRATEGIES.has(strategyForFact(ex.a, ex.b).id)) return []
  return leaksIn(ex, hintsFor(ex))
}

describe('no hint gives the answer away (3.º and 4.º, every skill)', () => {
  const skills = [...new Set([...availableSkills(GRADE3_SYLLABUS), ...availableSkills(GRADE4_SYLLABUS)])].sort()

  it('the checker catches the answer in each written form and not inside a longer number', () => {
    const hit = (n: number, text: string) => numberPattern(n)!.test(text)
    // Plain digits, and the thousands grouped by a normal, a no-break or a thin space.
    for (const grouped of ['3000', '3 000', '3\u00a0000', '3\u202f000']) expect(hit(3000, `Son ${grouped} euros`), grouped).toBe(true)
    expect(hit(3, 'Hay 13 bolas')).toBe(false)
    expect(hit(3, 'Hay 3 000 bolas')).toBe(false)
    expect(hit(3, 'Hay 3,5 kilos')).toBe(false)
    expect(hit(3, 'Son las 3:30')).toBe(false)
    expect(hit(4, 'La fracción 3/4 de 20')).toBe(false)
    expect(hit(4, 'Hay 4 bolas')).toBe(true)
    expect(hit(345, 'Son 12 345 pegatinas')).toBe(false)
    expect(decimalPattern(2.5)!.test('son 2,50 €')).toBe(true)
    expect(decimalPattern(2.5)!.test('son 12,5 €')).toBe(false)
  })

  it('a hint that names the answer is caught even when that number is also a coordinate of the figure', () => {
    // 12 : 3 = ?, answer 4. The 4 is a point of a figure (not on the statement): it must not exempt the hint.
    const base = makeFactDiv(12, 3)
    const withFigure = { ...base, figure: { type: 'polygon', points: [[4, 0], [0, 4]] } } as unknown as Exercise
    const hint = { level: 3 as const, text: 'Cuenta de 3 en 3: 3, 6, 9, 12. Son 4 saltos.', visual: 'none' as const }
    expect(leaksIn(withFigure, [hint])).toEqual([{ level: 3, text: hint.text, answer: '4' }])
    // The same number on the statement («12 : 4 = ?») is the child's own question, so the hint may name it.
    expect(leaksIn({ ...base, dividend: 4, divisor: 1, quotient: 4 } as Exercise, [{ ...hint, text: 'Son 4 saltos.' }])).toEqual([])
  })

  it('no hint gives the answer away', () => {
    expect(skills.length).toBeGreaterThan(100)
    const found: string[] = []
    for (const skill of skills) {
      for (const ex of generate({ skills: [skill] }, PER_SKILL, { now })) {
        for (const l of leaks(ex)) found.push(`${skill} [${ex.kind}] level ${l.level} (${l.answer}): ${l.text}`)
      }
    }
    expect([...new Set(found)]).toEqual([])
  })
})
