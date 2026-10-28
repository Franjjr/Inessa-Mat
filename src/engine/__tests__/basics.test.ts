import { describe, expect, it } from 'vitest'
import {
  addSkill, allMulFactSkills, analyzeAdd, analyzeDiv, analyzeMul, analyzeSub, columnName, conceptSkill, createRng,
  describeError, describeSkill, div2x1Skill, divSkill, fromDigits, isEasyFact, isFactSkill, isMulFactSkill,
  isValidSkill, kindsForSkill, makeExercise, mul2x1Skill, mulSkill, parseSkill, skipSkill, subSkill, toDigits,
  WORD_TEMPLATES, wordSkill,
} from '@/engine'
import { clamp, hashString, pick, randInt, range, shuffle, weightedIndex } from '@/engine/rng'
import { ERROR_TEXT } from '@/engine/describe'
import { diagnoseAdd, diagnoseDivision, diagnoseMul, diagnoseSub, smallerFromLargerValue } from '@/engine/diagnose'
import { carryableColumns, divisionPool, genAddOperands, genDivision, genMul2x1, genSubPair } from '@/engine/numbers'
import { columnList, praise } from '@/engine/feedback'
import { fillTemplate, getWordTemplate, templatesFor } from '@/engine/wordProblems'
import { regroupCounts, resolveContext, inferKinds } from '@/engine/generate'
import type { ErrorType } from '@/types'
import { refBorrowed, refCarries } from './helpers'

describe('rng', () => {
  it('createRng is deterministic and uniform-ish in [0, 1)', () => {
    const a = createRng(7)
    const b = createRng(7)
    const xs = Array.from({ length: 2000 }, () => a())
    expect(xs).toEqual(Array.from({ length: 2000 }, () => b()))
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true)
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    expect(mean).toBeGreaterThan(0.45)
    expect(mean).toBeLessThan(0.55)
    expect(createRng(8)()).not.toBe(createRng(7)())
  })
  it('helpers', () => {
    const r = createRng(1)
    for (let i = 0; i < 200; i++) {
      const v = randInt(r, 3, 5)
      expect(v >= 3 && v <= 5 && Number.isInteger(v)).toBe(true)
    }
    expect(randInt(r, 5, 2)).toBe(5)
    expect(['a', 'b']).toContain(pick(r, ['a', 'b']))
    expect(shuffle(r, [1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4])
    expect(range(2, 4)).toEqual([2, 3, 4])
    expect(clamp(12, 1, 10)).toBe(10)
    expect(hashString('numeria')).toBe(hashString('numeria'))
    expect(hashString('a')).not.toBe(hashString('b'))
    const counts = [0, 0, 0]
    for (let i = 0; i < 3000; i++) counts[weightedIndex(r, [1, 0, 3])]++
    expect(counts[1]).toBe(0)
    expect(counts[2]).toBeGreaterThan(counts[0] * 2)
    expect(weightedIndex(r, [0, 0])).toBeLessThan(2)
    // Floating point guard: an rng at the very top of its range lands on the last positive weight.
    expect(weightedIndex(() => 1, [1, 2, 0])).toBe(1)
  })
})

describe('skills', () => {
  it('builders produce the documented format', () => {
    expect(mulSkill(7, 6)).toBe('mul:6x7')
    expect(mulSkill(6, 7)).toBe('mul:6x7')
    expect(divSkill(42, 6)).toBe('div:42/6')
    expect(skipSkill(8)).toBe('skip:8')
    expect(addSkill(4, 2)).toBe('add:4d:c2')
    expect(subSkill(3, 0, true)).toBe('sub:3d:z')
    expect(subSkill(4, 3)).toBe('sub:4d:b3')
    expect(mul2x1Skill(true)).toBe('mul:2x1:c1')
    expect(div2x1Skill('long')).toBe('div:2x1:long')
    expect(conceptSkill('family')).toBe('concept:family')
    expect(wordSkill('div')).toBe('word:div')
  })
  it('parseSkill round-trips and rejects invalid keys', () => {
    expect(parseSkill('mul:6x7')).toEqual({ type: 'mul', a: 6, b: 7 })
    expect(parseSkill('div:42/6')).toEqual({ type: 'div', p: 42, d: 6, q: 7 })
    expect(parseSkill('sub:4d:z')).toEqual({ type: 'sub', digits: 4, borrows: null, zero: true })
    expect(parseSkill('add:3d:c3')).toEqual({ type: 'add', digits: 3, carries: 3 })
    expect(parseSkill('mul:2x1:c0')).toEqual({ type: 'mul2x1', carry: false })
    expect(parseSkill('div:2x1:rem')).toEqual({ type: 'div2x1', variant: 'rem' })
    expect(parseSkill('concept:share')).toEqual({ type: 'concept', name: 'share' })
    expect(parseSkill('word:mul')).toEqual({ type: 'word', op: 'mul' })
    for (const bad of ['mul:7x6', 'mul:0x3', 'mul:3x11', 'div:43/6', 'div:120/10', 'div:5/0', 'skip:1', 'skip:11', 'add:3d:c4', 'add:5d:c1',
      'sub:3d:b3', 'sub:2d:z', 'concept:magic', 'word:pow', 'hello', '']) {
      expect(parseSkill(bad), bad).toBeNull()
      expect(isValidSkill(bad)).toBe(false)
    }
    expect(allMulFactSkills()).toHaveLength(55)
    expect(allMulFactSkills().every(isValidSkill)).toBe(true)
  })
  it('classification helpers', () => {
    expect(isFactSkill('mul:6x7')).toBe(true)
    expect(isFactSkill('div:42/6')).toBe(true)
    expect(isFactSkill('add:3d:c1')).toBe(false)
    expect(isMulFactSkill('div:42/6')).toBe(false)
    expect(isEasyFact('mul:2x7')).toBe(true)
    expect(isEasyFact('mul:6x7')).toBe(false)
    expect(isEasyFact('div:35/7')).toBe(true)
    expect(isEasyFact('div:42/7')).toBe(false)
    expect(isEasyFact('add:3d:c1')).toBe(false)
    expect(isEasyFact('nope')).toBe(false)
    expect(kindsForSkill('mul:4x7')).toEqual(['fact-mul', 'missing-factor', 'double-chain'])
    expect(kindsForSkill('mul:6x7')).toEqual(['fact-mul', 'missing-factor'])
    expect(kindsForSkill('div:42/6')).toEqual(['fact-div'])
    expect(kindsForSkill('skip:6')).toEqual(['skip-count'])
    expect(kindsForSkill('sub:3d:z')[0]).toBe('column-sub')
    expect(kindsForSkill('mul:2x1:c1')[0]).toBe('column-mul')
    expect(kindsForSkill('div:2x1:exact')[0]).toBe('division')
    expect(kindsForSkill('concept:placevalue')).toEqual(['column-add'])
    expect(kindsForSkill('word:add')).toEqual(['word-problem'])
    expect(kindsForSkill('bad')).toEqual([])
  })
})

describe('arith', () => {
  it('digits', () => {
    expect(toDigits(368)).toEqual([8, 6, 3])
    expect(toDigits(0)).toEqual([0])
    expect(fromDigits([8, 6, 3])).toBe(368)
  })
  it('analyses match the reference implementation on many random inputs', () => {
    const r = createRng(99)
    for (let i = 0; i < 3000; i++) {
      const a = randInt(r, 1, 9999)
      const b = randInt(r, 1, 9999)
      expect(analyzeAdd([a, b]).carries).toEqual(refCarries([a, b]))
      const [m, s] = a >= b ? [a, b] : [b, a]
      if (m > s) expect(analyzeSub(m, s).borrowed).toEqual(refBorrowed(m, s))
    }
    expect(analyzeAdd([768, 457])).toEqual({ answer: 1225, carries: [0, 1, 1, 1], carryCount: 3 })
    expect(analyzeAdd([99, 1, 5])).toMatchObject({ answer: 105, carryCount: 2 })
    expect(analyzeSub(503, 128)).toMatchObject({ answer: 375, borrowed: [true, true, false], borrowCount: 2, zeroBorrow: true, zeroChains: [[0, 1, 2]] })
    expect(analyzeSub(5004, 1238).zeroChains).toEqual([[0, 1, 2, 3]])
    expect(analyzeSub(6031, 2574).zeroChains).toEqual([[1, 2, 3]])
    expect(analyzeSub(7043, 2516).zeroBorrow).toBe(false)
    expect(analyzeMul(47, 6)).toEqual({ answer: 282, carries: [0, 4, 2], unitsCarry: true })
    expect(analyzeMul(21, 4)).toEqual({ answer: 84, carries: [0, 0], unitsCarry: false })
    expect(analyzeDiv(17, 5)).toEqual({ quotient: 3, remainder: 2, variant: 'rem' })
    expect(analyzeDiv(84, 4).variant).toBe('exact')
    expect(analyzeDiv(72, 3).variant).toBe('long')
    expect(analyzeDiv(47, 2).variant).toBe('long')
    expect(analyzeDiv(126, 3).variant).toBe('long')
  })
})

describe('numbers', () => {
  it('impossible requests return null', () => {
    const r = createRng(1)
    expect(genAddOperands(r, 4, 4)).toBeNull()
    expect(genAddOperands(r, 3, -1)).toBeNull()
    expect(genSubPair(r, 2, 'z')).toBeNull()
    expect(genSubPair(r, 3, 3)).toBeNull()
    expect(carryableColumns(4)).toEqual([0, 1, 2])
    expect(carryableColumns(3)).toEqual([0, 1, 2])
  })
  it('mul and division generators honour constraints', () => {
    const r = createRng(2)
    for (let i = 0; i < 300; i++) {
      const [t, b] = genMul2x1(r, false, [9])!
      expect(b).toBe(9)
      expect((t % 10) * 9).toBeLessThan(10)
      const [t2, b2] = genMul2x1(r, true, [1, 11])!
      expect(b2 >= 2 && b2 <= 9).toBe(true)
      expect((t2 % 10) * b2).toBeGreaterThanOrEqual(10)
    }
    expect(divisionPool('long', [9])).toEqual(divisionPool('long')) // no long divisions by 9 → falls back to all
    expect(divisionPool('exact', [4]).every(([, d]) => d === 4)).toBe(true)
    const [dd, dv] = genDivision(r, 'rem', [7])
    expect(dv).toBe(7)
    expect(dd % 7).toBeGreaterThan(0)
  })
})

describe('diagnose (direct)', () => {
  it('multi-digit cells and shifted answers', () => {
    expect(diagnoseAdd([245, 137], [12, 8, 3]).errorType).toBe('carry-wrong')
    expect(diagnoseMul(47, 6, [42, 4, null]).errorType).toBe('carry-wrong')
    expect(diagnoseSub(586, 243, [null, 3, 4, 3]).errorType).toBe('misaligned')
    expect(smallerFromLargerValue(52, 17)).toBe(45)
    expect(diagnoseDivision(17, 5, 3, 7).errorType).toBe('remainder-too-big')
    expect(diagnoseDivision(17, 5, 1, 2)).toEqual({ errorType: 'fact', detail: 'near' })
  })
})

describe('describe', () => {
  it('skills in Spanish for adults', () => {
    expect(describeSkill('mul:6x7')).toBe('6 × 7')
    expect(describeSkill('div:42/6')).toBe('42 ÷ 6')
    expect(describeSkill('sub:4d:z')).toBe('Restas de 4 cifras con ceros')
    expect(describeSkill('sub:3d:b0')).toBe('Restas de 3 cifras sin préstamos')
    expect(describeSkill('sub:3d:b2')).toBe('Restas de 3 cifras con 2 préstamos')
    expect(describeSkill('add:3d:c1')).toBe('Sumas de 3 cifras con 1 llevada')
    expect(describeSkill('add:4d:c0')).toBe('Sumas de 4 cifras sin llevadas')
    expect(describeSkill('skip:8')).toBe('Contar de 8 en 8')
    expect(describeSkill('mul:2x1:c1')).toContain('con llevada')
    expect(describeSkill('mul:2x1:c0')).toContain('sin llevadas')
    expect(describeSkill('div:2x1:exact')).toContain('exactas')
    expect(describeSkill('div:2x1:rem')).toContain('resto')
    expect(describeSkill('div:2x1:long')).toContain('experto')
    expect(describeSkill('concept:commutative')).toContain('espejo')
    expect(describeSkill('word:sub')).toBe('Problemas de restar')
    expect(describeSkill('weird')).toBe('weird')
  })
  it('every error type has an adult description (the table covers every type, maths and Lengua)', () => {
    const all = Object.keys(ERROR_TEXT) as ErrorType[]
    expect(all.length).toBeGreaterThan(30)
    for (const t of all) {
      expect(describeError(t), t).toBe(ERROR_TEXT[t])
      expect(describeError(t).length, t).toBeGreaterThan(12)
    }
    const texts = all.map(describeError)
    expect(new Set(texts).size, 'two error types share a text').toBe(all.length)
    expect(describeError('stress')).toContain('sílaba')
    expect(describeError('word-form')).toContain('tilde')
    expect(describeError('carry-forgot')).toBe('Olvida sumar la llevada')
    expect(describeError('recognition')).toContain('no es un error de cálculo')
    expect(describeError('nope' as ErrorType)).toBe('nope')
  })
})

describe('feedback, templates and misc', () => {
  it('column names and lists', () => {
    expect(columnName(0)).toBe('unidades')
    expect(columnName(3)).toBe('unidades de mil')
    expect(columnName(9)).toBe('cifras de la izquierda')
    expect(columnList([2, 1])).toBe('las decenas y las centenas')
    expect(columnList([0, 1, 2])).toBe('las unidades, las decenas y las centenas')
    expect(columnList([])).toBe('')
    expect(praise('x')).toBe(praise('x'))
  })
  it('word templates are well formed Spanish with units and placeholders', () => {
    const ids = new Set<string>()
    for (const t of WORD_TEMPLATES) {
      expect(ids.has(t.id)).toBe(false)
      ids.add(t.id)
      expect(t.text).toContain('{a}')
      expect(t.text).toContain('{b}')
      expect(t.text).toMatch(/¿[^?]+\?$/)
      expect(t.unit).toMatch(/^[a-záéíóúñ]+$/)
      expect(t.minDigits).toBeLessThanOrEqual(t.maxDigits)
    }
    for (const op of ['add', 'sub', 'mul', 'div'] as const) expect(WORD_TEMPLATES.filter((t) => t.op === op).length).toBeGreaterThanOrEqual(6)
    expect(WORD_TEMPLATES.some((t) => t.text.includes('{child}'))).toBe(true)
    expect(WORD_TEMPLATES.some((t) => t.text.includes('{pet}'))).toBe(true)
    expect(fillTemplate('{a} y {b} y {a}', 1, 2)).toBe('1 y 2 y 1')
    expect(getWordTemplate('add-peces')?.unit).toBe('peces')
    expect(templatesFor('mul', 1, () => false).every((t) => t.fixed === undefined)).toBe(true)
  })
  it('makeExercise builds exercises from fixed operands', () => {
    expect(makeExercise('column-add', 2486, 1357)).toMatchObject({ kind: 'column-add', answer: 3843, skill: 'add:4d:c2' })
    expect(makeExercise('column-sub', 1367, 4521)).toMatchObject({ kind: 'column-sub', minuend: 4521, subtrahend: 1367, answer: 3154 })
    expect(makeExercise('column-mul', 6, 47)).toMatchObject({ kind: 'column-mul', top: 47, bottom: 6, answer: 282 })
    expect(makeExercise('column-mul', 47, 6)).toMatchObject({ top: 47, bottom: 6 })
    expect(makeExercise('division', 63, 3)).toMatchObject({ kind: 'division', quotient: 21, remainder: 0, variant: 'exact' })
    expect(makeExercise('fact-mul', 7, 8)).toMatchObject({ kind: 'fact-mul', answer: 56, skill: 'mul:7x8', difficulty: 5 })
  })
  it('selector helpers', () => {
    expect(regroupCounts('none', 3)).toEqual([0])
    expect(regroupCounts('one', 0)).toEqual([0])
    expect(regroupCounts('many', 3)).toEqual([2, 3])
    expect(regroupCounts('many', 1)).toEqual([1])
    expect(regroupCounts('any', 2)).toEqual([0, 1, 2])
    expect(resolveContext({ factorRange: [9, 3] }).range).toEqual([3, 9])
    expect(resolveContext({ divisionVariants: ['long', 'long'] }).variants).toEqual(['long'])
    expect(inferKinds({ kinds: ['fact-mul', 'fact-mul'] })).toEqual(['fact-mul'])
    expect(inferKinds({ skills: ['skip:6', 'sub:3d:z'] })).toEqual(['skip-count', 'column-sub'])
  })
})

describe('the round wording agrees with the place', () => {
  it('rounds to the decenas, the centenas and the millares with the right article', () => {
    expect(describeSkill('num:round:10')).toBe('Redondear a las decenas')
    expect(describeSkill('num:round:100')).toBe('Redondear a las centenas')
    expect(describeSkill('num:round:1000')).toBe('Redondear a los millares')
  })
})
