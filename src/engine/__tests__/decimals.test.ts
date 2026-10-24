/* Décimas y centésimas (4.º, dec:*): the numbers in hundredths, the two boxes, the generators, grading and the hints
   (no hint gives the answer away, in any written form, and no compare hint shows the sign). Seeds keep them deterministic. */
import { describe, expect, it } from 'vitest'
import type { Answer, DecimalExercise, DecimalOpExercise, DecimalMode } from '@/types'
import {
  blockSkillsOf, check, checkDecimal, checkDecimalOp, createRng, decimalFromBoxes, decimalSkill, decimalWords, fmtDecimal, genDecimal,
  genDecimalOp, hintsDecimal, hintsFor, isValidSkill, kindsForSkill, parseSkill,
} from '@/engine'
import { correctAnswer } from './helpers'

const MANY = Array.from({ length: 300 }, (_, i) => i + 1)

describe('the number as hundredths', () => {
  it('writes 245 as 2,45 and 3 as 0,3, with the comma of the places asked', () => {
    expect(fmtDecimal(245, 2)).toBe('2,45')
    expect(fmtDecimal(30, 1)).toBe('0,3')
    expect(fmtDecimal(5, 2)).toBe('0,05')
    expect(fmtDecimal(400, 1)).toBe('4,0')
  })

  it('reads the two boxes: in centésimas a single 5 is 0,50, and 50 is the same; in décimas the box is one tenth', () => {
    expect(decimalFromBoxes(0, 5, 2)).toBe(50)
    expect(decimalFromBoxes(0, 50, 2)).toBe(50)
    expect(decimalFromBoxes(0, 5, 1)).toBe(50)
    expect(decimalFromBoxes(2, 45, 2)).toBe(245)
    expect(decimalFromBoxes(null, 4, 2)).toBeNull()
    expect(decimalFromBoxes(0, null, 1)).toBeNull()
  })

  it('says the number in words, with «una» for the feminine one', () => {
    expect(decimalWords({ kind: 'decimal', mode: 'read', places: 1, value: 10 } as DecimalExercise)).toBe('una décima')
    expect(decimalWords({ kind: 'decimal', mode: 'read', places: 1, value: 30 } as DecimalExercise)).toBe('tres décimas')
    expect(decimalWords({ kind: 'decimal', mode: 'read', places: 2, value: 21 } as DecimalExercise)).toBe('veintiuna centésimas')
    expect(decimalWords({ kind: 'decimal', mode: 'read', places: 2, value: 48 } as DecimalExercise)).toBe('cuarenta y ocho centésimas')
  })
})

describe('skill keys of the decimals', () => {
  it('parses each key and rejects the others', () => {
    expect(parseSkill('dec:shade:1')).toEqual({ type: 'decimal', mode: 'shade', places: 1 })
    expect(parseSkill('dec:read:2')).toEqual({ type: 'decimal', mode: 'read', places: 2 })
    expect(parseSkill('dec:compare')).toEqual({ type: 'decimal', mode: 'compare' })
    expect(parseSkill('dec:money')).toEqual({ type: 'decimal', mode: 'money' })
    expect(parseSkill('dec:add:2')).toEqual({ type: 'decimal-op', op: 'add', places: 2 })
    expect(parseSkill('dec:sub:1')).toEqual({ type: 'decimal-op', op: 'sub', places: 1 })
    expect(parseSkill('dec:shade:3')).toBeNull()
    expect(parseSkill('dec:mul:1')).toBeNull()
  })

  it('builds the keys the topics use, and maps them to their kinds', () => {
    expect(decimalSkill('shade', 1)).toBe('dec:shade:1')
    expect(decimalSkill('compare')).toBe('dec:compare')
    expect(decimalSkill('sub', 2)).toBe('dec:sub:2')
    expect(kindsForSkill('dec:read:2')).toEqual(['decimal'])
    expect(kindsForSkill('dec:money')).toEqual(['decimal'])
    expect(kindsForSkill('dec:add:1')).toEqual(['decimal-op'])
    expect(blockSkillsOf('decimal')).toHaveLength(6)
    expect(blockSkillsOf('decimal-op')).toHaveLength(4)
    for (const k of [...blockSkillsOf('decimal'), ...blockSkillsOf('decimal-op')]) expect(isValidSkill(k), k).toBe(true)
  })
})

describe('the generators', () => {
  it('décimas stay between 0,1 and 0,9, and centésimas never ask 0,01 to 0,09 (the box could not hold them)', () => {
    for (const seed of MANY) {
      const tenths = genDecimal(createRng(seed), 'shade', 1)
      expect(tenths.value % 10).toBe(0)
      expect(tenths.value).toBeGreaterThanOrEqual(10)
      expect(tenths.value).toBeLessThanOrEqual(90)
      for (const mode of ['shade', 'read'] as DecimalMode[]) {
        const ex = genDecimal(createRng(seed), mode, 2)
        expect(ex.value).toBeGreaterThanOrEqual(10)
        expect(ex.value).toBeLessThanOrEqual(99)
        expect(ex.answer).toBe(ex.value)
      }
    }
  })

  it('compare puts a sign that matches the two numbers, and money is a decimal of euros and céntimos', () => {
    for (const seed of MANY) {
      const ex = genDecimal(createRng(seed), 'compare')
      const other = ex.other ?? 0
      expect(ex.answer).toBe(ex.value < other ? '<' : ex.value > other ? '>' : '=')
      const m = genDecimal(createRng(seed), 'money')
      expect(m.places).toBe(2)
      expect(Math.floor(m.value / 100)).toBeGreaterThanOrEqual(1)
      expect(m.value % 100).toBeGreaterThanOrEqual(1)
    }
  })

  it('column sums stay under 10 and differences are never negative, with centésimas that the box can hold', () => {
    for (const seed of MANY) {
      for (const places of [1, 2] as const) {
        const sum = genDecimalOp(createRng(seed), 'add', places)
        expect(sum.answer).toBe(sum.left + sum.right)
        expect(sum.answer).toBeLessThan(1000)
        const diff = genDecimalOp(createRng(seed), 'sub', places)
        expect(diff.answer).toBe(diff.left - diff.right)
        expect(diff.answer).toBeGreaterThan(0)
        expect(diff.answer).toBeGreaterThanOrEqual(0)
        for (const ex of [sum, diff]) {
          if (places === 2) expect(ex.answer % 100 === 0 || ex.answer % 100 >= 10).toBe(true)
          if (places === 1) expect(ex.left % 10).toBe(0)
        }
      }
    }
  })

  it('every skill generates exercises of its own skill', () => {
    for (const skill of ['dec:shade:1', 'dec:read:2', 'dec:compare', 'dec:money', 'dec:add:1', 'dec:sub:2']) {
      for (const seed of MANY.slice(0, 40)) {
        const ex = seed % 2 ? genDecimal(createRng(seed), 'shade') : genDecimalOp(createRng(seed), 'add', 1)
        expect(ex.skill).toBeTruthy()
      }
      expect(isValidSkill(skill)).toBe(true)
    }
  })
})

describe('grading: the two boxes and the sign', () => {
  const half: DecimalExercise = { id: 'd', kind: 'decimal', skill: 'dec:read:2', difficulty: 3, mode: 'read', places: 2, value: 50, answer: 50 }

  it('accepts 0,5 written as 0 and 5, and as 0 and 50, in centésimas', () => {
    expect(checkDecimal(half, { type: 'numbers', values: [0, 5] })).toMatchObject({ correct: true })
    expect(checkDecimal(half, { type: 'numbers', values: [0, 50] })).toMatchObject({ correct: true })
    expect(checkDecimal(half, { type: 'numbers', values: [0, 4] })).toMatchObject({ correct: false })
    expect(checkDecimal(half, { type: 'numbers', values: [1, 5] })).toMatchObject({ correct: false })
    expect(checkDecimal(half, { type: 'numbers', values: [0, null] })).toMatchObject({ correct: false, errorType: 'incomplete' })
  })

  it('a column result of 3,75 is right when written as 3 and 75, and wrong when the decimals are short', () => {
    const op: DecimalOpExercise = { id: 'o', kind: 'decimal-op', skill: 'dec:add:2', difficulty: 3, op: 'add', places: 2, left: 125, right: 250, answer: 375 }
    expect(checkDecimalOp(op, { type: 'numbers', values: [3, 75] })).toMatchObject({ correct: true, given: '3,75' })
    expect(checkDecimalOp(op, { type: 'numbers', values: [3, 7] })).toMatchObject({ correct: false, given: '3,70' })
    expect(checkDecimalOp(op, { type: 'numbers', values: [4, 75] })).toMatchObject({ correct: false })
  })

  it('money: euros and céntimos in their own boxes, a céntimo is not a decimal place', () => {
    const money: DecimalExercise = { id: 'm', kind: 'decimal', skill: 'dec:money', difficulty: 3, mode: 'money', places: 2, value: 245, answer: 245 }
    expect(checkDecimal(money, { type: 'numbers', values: [2, 45] })).toMatchObject({ correct: true })
    expect(checkDecimal(money, { type: 'numbers', values: [2, 5] })).toMatchObject({ correct: false })
  })

  it('compare grades the sign tapped', () => {
    const cmp: DecimalExercise = { id: 'c', kind: 'decimal', skill: 'dec:compare', difficulty: 3, mode: 'compare', places: 1, value: 40, other: 30, answer: '>' }
    expect(checkDecimal(cmp, { type: 'sign', sign: '>' })).toMatchObject({ correct: true })
    expect(checkDecimal(cmp, { type: 'sign', sign: '<' })).toMatchObject({ correct: false })
    expect(check(cmp, { type: 'sign', sign: '>' } as Answer)).toMatchObject({ correct: true })
  })

  it('the correct answer of every generated exercise is graded right (over many seeds)', () => {
    for (const seed of MANY) {
      for (const mode of ['shade', 'read', 'compare', 'money'] as DecimalMode[]) {
        const ex = genDecimal(createRng(seed), mode, seed % 2 ? 1 : 2)
        expect(check(ex, correctAnswer(ex)).correct, `${mode} ${seed}`).toBe(true)
      }
      const op = genDecimalOp(createRng(seed), seed % 2 ? 'add' : 'sub', seed % 3 ? 2 : 1)
      expect(check(op, correctAnswer(op)).correct, `op ${seed}`).toBe(true)
    }
  })
})

describe('the hints never give the answer away', () => {
  const sign = /[<>=]/

  it('no hint of a decimal exercise contains its answer, in any written form, and each has three levels', () => {
    for (const seed of MANY) {
      for (const mode of ['shade', 'read', 'money'] as DecimalMode[]) {
        const ex = genDecimal(createRng(seed), mode, seed % 2 ? 1 : 2)
        const hints = hintsDecimal(ex)
        expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
        const forms = mode === 'money'
          ? [fmtDecimal(ex.value, 2), `${Math.floor(ex.value / 100)} euros y ${ex.value % 100} céntimos`]
          : [fmtDecimal(ex.value, ex.places), fmtDecimal(ex.value, ex.places).replace(',', '.'), decimalWords(ex)]
        for (const h of hints) for (const f of forms) expect(h.text.includes(f), `${mode} ${seed}: ${h.text}`).toBe(false)
      }
    }
  })

  it('no compare hint shows the sign, and no column hint gives the result', () => {
    for (const seed of MANY) {
      const ex = genDecimal(createRng(seed), 'compare')
      for (const h of hintsDecimal(ex)) expect(sign.test(h.text), h.text).toBe(false)
      const op = genDecimalOp(createRng(seed), seed % 2 ? 'add' : 'sub', seed % 3 ? 2 : 1)
      const formatted = fmtDecimal(op.answer, op.places)
      for (const h of hintsDecimal(op)) {
        expect(h.text.includes(formatted), `${seed}: ${h.text}`).toBe(false)
        expect(h.text.includes(formatted.replace(',', '.')), h.text).toBe(false)
      }
    }
  })

  it('is reached through hintsFor for every decimal kind', () => {
    const ex = genDecimal(createRng(4), 'compare')
    expect(hintsFor(ex)).toHaveLength(3)
    expect(hintsFor(genDecimalOp(createRng(4), 'add', 2))).toHaveLength(3)
    expect(hintsFor(genDecimal(createRng(4), 'read', 2)).map((h) => h.level)).toEqual([1, 2, 3])
  })
})
