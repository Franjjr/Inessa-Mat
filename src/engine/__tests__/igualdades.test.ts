/* Every equality «a op b = c» the child can read must be true. Ported from the critic's scan (scan.mjs, scan2.mjs):
   - the string literals of src/content and src/activities/lesson/visuals (lessons, classes, syllabus, drawings);
   - the hints (hintsFor, every method) and the checker's messages (right and simulated wrong answers) of generated
     exercises of every maths kind.
   Read only: it never changes those files. The deliberate wrong sums («Dani ha hecho esta suma: 47 + 35 = 72») are on
   an explicit whitelist, and the statements of error-hunt, check-calc and equation (which show a false sum on purpose)
   are left out. A wrong equality planted in a fixture is detected (last test). */
import { describe, expect, it } from 'vitest'
import { check, hintsFor } from '@/engine'
import type { DivMethod, ExerciseKind, SubMethod } from '@/types'
import { SKILL_CASES, finalCorrectVariants, finalWrongVariants, forEachSkill } from './p1-harness'

// ---------------------------------------------------------------- the scanner

const NUM = String.raw`\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?!\d)|\d+(?:,\d+)?`
/** Operators: + − - × · is NOT one (it separates steps: «12 + 8 = 20 · 20 − 5 = 15»), «:» only between spaces (a colon
    right after a number is a label: «28: 14 + 14»), «/» never (fractions). */
const OP = String.raw`\s*[+−×÷]\s*|\s+-\s+|\s+:\s+`
const TERM = String.raw`(?:${NUM})(?:(?:${OP})(?:${NUM}))*`
const EQUALITY = new RegExp(String.raw`(?<![\p{L}\d.,/:¼½¾])${TERM}(?:\s*=\s*${TERM})+(?![\d/,]|\s*[×+÷])`, 'gu')

const toNumber = (s: string) => Number(s.replace(/[ \u00a0\u202f]/g, '').replace(',', '.'))

/** A small evaluator for «a op b op c» with × ÷ before + −. NaN when the text is not plain arithmetic. */
function evaluate(term: string): number {
  const tokens = term.trim().split(/\s*([+−×÷]|\s-\s|\s:\s)\s*/).map((t) => t.trim()).filter((t) => t !== '')
  const values: number[] = []
  const ops: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) values.push(toNumber(tokens[i]))
    else ops.push(tokens[i] === '-' ? '−' : tokens[i] === ':' ? '÷' : tokens[i])
  }
  if (values.some((x) => !Number.isFinite(x)) || values.length !== ops.length + 1) return NaN
  // × and ÷ first.
  const sums: number[] = [values[0]]
  const signs: string[] = []
  ops.forEach((op, i) => {
    const x = values[i + 1]
    if (op === '×') sums[sums.length - 1] *= x
    else if (op === '÷') sums[sums.length - 1] /= x
    else { signs.push(op); sums.push(x) }
  })
  return sums.slice(1).reduce((acc, x, i) => (signs[i] === '+' ? acc + x : acc - x), sums[0])
}

/** «El doble de 15 = 10 + 10 + 5 + 5», «¼ de 20 = 20 ÷ 4»: the left side is a phrase, not the number alone. A division
    followed by «y sobra(n)» or «resto» states the whole quotient (17 ÷ 5 = 3 y sobran 2). */
function qualified(text: string, start: number, end: number, sides: string[]): boolean {
  const before = text.slice(Math.max(0, start - 12), start)
  if (/\b(de|del)\s*$/i.test(before)) return true
  const after = text.slice(end, end + 16)
  if (sides.some((s) => /÷|\s:\s/.test(s)) && /^\s*(y\s+sobra|,?\s*resto|\s*r\s*\d|\s*\(resto)/i.test(after)) return true
  return false
}

/** The false equalities of a text, as written. */
export function falseEqualities(text: string): string[] {
  const bad: string[] = []
  for (const m of text.matchAll(EQUALITY)) {
    const sides = m[0].split(/\s*=\s*/)
    if (sides.every((s) => !/[+−×÷]|\s-\s|\s:\s/.test(s))) continue
    if (qualified(text, m.index ?? 0, (m.index ?? 0) + m[0].length, sides)) continue
    const values = sides.map(evaluate)
    if (values.some((x) => Number.isNaN(x))) continue
    if (values.some((x) => Math.abs(x - values[0]) > 1e-9)) bad.push(m[0])
  }
  return bad
}

// ---------------------------------------------------------------- the files

/** The sources of src/content and src/activities/lesson/visuals as text (no tests, no galleries). */
const SOURCES = Object.entries({
  ...import.meta.glob('/src/content/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('/src/activities/lesson/visuals/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>)
  .filter(([path]) => !/__tests__|\.test\.|gallery/.test(path))
  .map(([path, text]) => ({ file: path.replace(/^\//, ''), text }))

/** The text a child may read: every string literal, with template holes (`${…}`) cut out. */
function literals(source: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = []
  source.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)) {
      for (const piece of m[2].split(/\$\{[^}]*\}/)) out.push({ line: i + 1, text: piece })
    }
  })
  return out
}

/** Deliberately false equalities shown to the child to be found («¿Está bien?»): file and the exact equality. */
const WHITELIST: { file: string; equality: string }[] = [
  { file: 'src/content/classes/grade3-problemas.ts', equality: '47 + 35 = 72' },
]

describe('igualdades de las lecciones, clases y dibujos', () => {
  it('todas las igualdades escritas son verdaderas (salvo las de «encuentra el error», en la lista blanca)', () => {
    const bad: string[] = []
    let seen = 0
    for (const { file: rel, text: source } of SOURCES) {
      for (const { line, text } of literals(source)) {
        seen += [...text.matchAll(EQUALITY)].length
        for (const eq of falseEqualities(text)) {
          if (WHITELIST.some((w) => w.file === rel && w.equality === eq)) continue
          bad.push(`${rel}:${line}: «${eq}» en «${text.slice(0, 160)}»`)
        }
      }
    }
    expect(SOURCES.length).toBeGreaterThan(50)
    expect(seen).toBeGreaterThan(200)
    expect(bad, bad.join('\n')).toEqual([])
  })
})

// ---------------------------------------------------------------- generated hints and messages

/** Kinds whose statement shows a false sum on purpose: the hints and messages talk about it. */
const SKIPPED_KINDS: ExerciseKind[] = ['error-hunt', 'check-calc', 'equation']
const SUB_METHODS: SubMethod[] = ['borrow', 'carry', 'parts', 'line']
const DIV_METHODS: DivMethod[] = ['galera', 'galera-short', 'div-parts', 'climb']

describe('igualdades de las pistas y los mensajes generados', () => {
  it.each(SKILL_CASES.filter((c) => !SKIPPED_KINDS.includes(c.kind)).map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const bad = new Set<string>()
    let texts = 0
    const look = (where: string, text: string | undefined) => {
      if (!text) return
      texts++
      for (const eq of falseEqualities(text)) bad.add(`${where}: «${eq}» en «${text}»`)
    }
    forEachSkill((x) => x === c, 15, (ex) => {
      const hintSets = ex.kind === 'column-sub' ? SUB_METHODS.map((m) => hintsFor(ex, m))
        : ex.kind === 'division' ? DIV_METHODS.map((d) => hintsFor(ex, undefined, { divMethod: d }))
          : [hintsFor(ex)]
      for (const hints of hintSets) for (const h of hints) look(`${ex.id} pista ${h.level}`, h.text)
      for (const v of [...finalCorrectVariants(ex), ...finalWrongVariants(ex)]) {
        look(`${ex.id} ${v.label}`, check(ex, v.answer, v.method ? { method: v.method } : {}).feedback)
      }
    })
    expect(texts).toBeGreaterThan(0)
    expect([...bad].slice(0, 10).join('\n')).toBe('')
  })
})

// ---------------------------------------------------------------- the scanner itself

describe('el detector de igualdades', () => {
  it('encuentra una igualdad falsa puesta a propósito en un texto', () => {
    const fixture = 'Mira: 7 × 8 = 54. Y también 352 − 127 = 225, 2 475 + 25 = 2 500 y 12 : 4 = 3.'
    expect(falseEqualities(fixture)).toEqual(['7 × 8 = 54'])
    expect(falseEqualities('Primero 23 × 4 = 92, después 23 × 10 = 230 y 92 + 230 = 323.')).toEqual(['92 + 230 = 323'])
  })
  it('no confunde etiquetas, horas, fracciones, separadores ni divisiones con resto', () => {
    for (const ok of [
      '28: 14 + 14 = 28', 'Son las 7:30 = siete y media', '1/2 = 2/4', '12 + 8 = 20 · 20 − 5 = 15', 'El doble de 15 = 10 + 10 + 5 + 5',
      '¼ de 20 = 20 ÷ 4', '17 ÷ 5 = 3 y sobran 2', 'Unidades: 5 × 8 = 40. Escribe 0 y me llevo 4.', '11 − 4 = ?',
    ]) expect(falseEqualities(ok), ok).toEqual([])
  })
})
