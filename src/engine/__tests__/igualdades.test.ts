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
const EQUALITY = new RegExp(String.raw`(?<![\p{L}\d.,/:¼½¾])${TERM}(?:\s*=\s*${TERM})+(?!\d|[/,]\d|\s*[×+÷])`, 'gu')

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

const HAS_OP = /[+−×÷]|\s-\s|\s:\s/

/** «El doble de 15 = 10 + 10 + 5 + 5», «¼ de 20 = 20 ÷ 4»: after «de» a lone number is the end of a phrase, not the
    left side. With an operation there («El resultado de 23 × 4 = 93») the equality is still checked. */
function qualified(text: string, start: number, sides: string[]): boolean {
  const before = text.slice(Math.max(0, start - 12), start)
  return /\b(de|del)\s*$/i.test(before) && !HAS_OP.test(sides[0])
}

/** A division followed by what is left over («17 ÷ 5 = 3 y sobran 2», «= 3, resto 2», «= 3 r 2», «= 3 (resto 2)»):
    the remainder written, or undefined when there is none. */
function remainderAfter(text: string, end: number): number | undefined {
  const m = /^\s*(?:y\s+sobran?|,?\s*resto|r|\(resto)\s*(\d+)/i.exec(text.slice(end, end + 24))
  return m ? Number(m[1]) : undefined
}

/** «a ÷ b = q» with remainder r is true when q · b + r = a and r < b. Undefined when the sides are not that shape. */
function divisionWithRemainder(sides: string[], r: number): boolean | undefined {
  const m = /^\s*(\d+)\s*(?:÷|\s:\s)\s*(\d+)\s*$/.exec(sides[0])
  if (sides.length !== 2 || !m || HAS_OP.test(sides[1])) return undefined
  const [a, b, q] = [Number(m[1]), Number(m[2]), toNumber(sides[1])]
  return q * b + r === a && r < b
}

/** The false equalities of a text, as written. */
export function falseEqualities(text: string): string[] {
  const bad: string[] = []
  for (const m of text.matchAll(EQUALITY)) {
    const sides = m[0].split(/\s*=\s*/)
    if (sides.every((s) => !HAS_OP.test(s))) continue
    const start = m.index ?? 0
    if (qualified(text, start, sides)) continue
    const rest = sides.some((s) => /÷|\s:\s/.test(s)) ? remainderAfter(text, start + m[0].length) : undefined
    if (rest !== undefined) {
      // A division with what is left over: checked as q · b + r = a; another shape with a remainder is not judged.
      if (divisionWithRemainder(sides, rest) === false) bad.push(`${m[0]} y sobran ${rest}`)
      continue
    }
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

/** The text a child may read: every string literal, with template holes (`${…}`) cut out. Quotes are read line by line
    (an apostrophe in a comment spoils one line at most); a template string that spans several lines is read whole,
    its line breaks as spaces, so an equality cut across two lines is still checked. */
export function literals(source: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = []
  const push = (line: number, body: string) => {
    for (const piece of body.split(/\$\{[^}]*\}/)) out.push({ line, text: piece })
  }
  source.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)) push(i + 1, m[2])
  })
  // Comments out (block and whole-line ones), keeping the line count, before looking for multi-line templates.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).replace(/^\s*\/\/.*$/gm, '')
  for (const m of code.matchAll(/`((?:\\.|\$\{[^}]*\}|[^`\\])*)`/g)) {
    if (!m[1].includes('\n')) continue
    push(code.slice(0, m.index).split('\n').length, m[1].replace(/\s*\n\s*/g, ' '))
  }
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
  it('tras «de» solo se salta un número solo: «El resultado de 23 × 4 = 93» se marca', () => {
    expect(falseEqualities('El resultado de 23 × 4 = 93.')).toEqual(['23 × 4 = 93'])
    expect(falseEqualities('El resultado de 23 × 4 = 92.')).toEqual([])
  })
  it('las divisiones con resto se comprueban: cociente por divisor más resto es el dividendo', () => {
    expect(falseEqualities('17 ÷ 5 = 3 y sobran 3')).toEqual(['17 ÷ 5 = 3 y sobran 3'])
    expect(falseEqualities('17 ÷ 5 = 2 y sobran 7')).toEqual(['17 ÷ 5 = 2 y sobran 7'])
    expect(falseEqualities('29 : 4 = 7, resto 1')).toEqual([])
  })
  it('lee las plantillas de varias líneas: una igualdad partida en dos líneas se comprueba', () => {
    const source = 'const t = `Primero 23 × 4 =\n    93, y ya está.`\n// it\'s a comment\nconst u = \'7 × 8 = 56\'\n'
    const bad = literals(source).flatMap(({ text }) => falseEqualities(text))
    expect(bad).toEqual(['23 × 4 = 93'])
  })
  it('no confunde etiquetas, horas, fracciones, separadores ni divisiones con resto', () => {
    for (const ok of [
      '28: 14 + 14 = 28', 'Son las 7:30 = siete y media', '1/2 = 2/4', '12 + 8 = 20 · 20 − 5 = 15', 'El doble de 15 = 10 + 10 + 5 + 5',
      '¼ de 20 = 20 ÷ 4', '17 ÷ 5 = 3 y sobran 2', '17 : 5 = 3, resto 2', '29 ÷ 4 = 7 (resto 1)', 'Unidades: 5 × 8 = 40. Escribe 0 y me llevo 4.', '11 − 4 = ?',
    ]) expect(falseEqualities(ok), ok).toEqual([])
  })
})
