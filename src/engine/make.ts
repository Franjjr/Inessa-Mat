/* Exercise constructors. Every exercise is fully determined by its numbers: answers, carries, borrows, skill key,
   deterministic id and difficulty are all computed here (never trusted from the generator's intent). */
import type {
  ArrayExercise, ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, DivisionExercise, DoubleChainExercise,
  Exercise, FactDivExercise, FactFamilyExercise, FactMulExercise, GroupsExercise, MissingFactorExercise,
  SkillKey, SkipCountExercise, WordProblemExercise,
} from '@/types'
import { analyzeAdd, analyzeDiv, analyzeMul, analyzeSub, digitCount } from './arith'
import {
  addSkill, conceptSkill, div2x1Skill, divSkill, mul2x1Skill, mulSkill, skipSkill, subSkill, wordSkill, type WordOp,
} from './skills'

const clampDifficulty = (n: number) => Math.max(1, Math.min(5, Math.round(n)))

/** The hard facts of the 6/7/8/9 tables (the ones the workbook teaches with special tricks). */
const HARD_FACTS = new Set(['6x7', '6x8', '7x7', '7x8', '8x8', '6x9', '7x9', '8x9'])

/** 1 (×1, ×10) .. 5 (6×7, 7×8, 8×8 …). */
export function factDifficulty(a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (lo === 1 || hi === 10 || lo === 10) return 1
  if (lo === 2 || lo === 5 || hi === 5 || hi === 2) return 2
  if (HARD_FACTS.has(`${lo}x${hi}`)) return 5
  if ([6, 7, 8].includes(lo) || [6, 7, 8].includes(hi)) return lo <= 4 ? 3 : 4
  return 3
}

export function makeFactMul(a: number, b: number): FactMulExercise {
  return { id: `fact-mul:${a}x${b}`, kind: 'fact-mul', skill: mulSkill(a, b), difficulty: factDifficulty(a, b), a, b, answer: a * b }
}

export function makeFactDiv(dividend: number, divisor: number, skill?: SkillKey): FactDivExercise {
  const answer = dividend / divisor
  return {
    id: `fact-div:${dividend}/${divisor}`, kind: 'fact-div', skill: skill ?? divSkill(dividend, divisor),
    difficulty: clampDifficulty(factDifficulty(divisor, answer) + (divisor >= 6 ? 0.5 : 0)), dividend, divisor, answer,
  }
}

export function makeMissingFactor(a: number, b: number, missing: 'a' | 'b'): MissingFactorExercise {
  const product = a * b
  const shown = missing === 'a' ? `?x${b}` : `${a}x?`
  return {
    id: `missing-factor:${shown}=${product}`, kind: 'missing-factor', skill: mulSkill(a, b),
    difficulty: clampDifficulty(factDifficulty(a, b) + 0.5), a, b, product, missing, answer: missing === 'a' ? a : b,
  }
}

export function makeSkipCount(step: number, start: number, length: number, hiddenIndexes: number[]): SkipCountExercise {
  const values = Array.from({ length }, (_, i) => step * (start + i))
  const hidden = [...hiddenIndexes].sort((x, y) => x - y)
  const base = step === 2 || step === 5 || step === 10 ? 1 : step <= 4 ? 2 : step === 6 || step === 9 ? 3 : 4
  return {
    id: `skip-count:${step}:${values[0]}-${values[length - 1]}:h${hidden.join('.')}`, kind: 'skip-count',
    skill: skipSkill(step), difficulty: clampDifficulty(base + (start > 1 ? 0.5 : 0)), step, values,
    hiddenIndexes: hidden, answer: hidden.map((i) => values[i]),
  }
}

export function makeGroups(groups: number, perGroup: number, emoji: string): GroupsExercise {
  return {
    id: `groups:${groups}x${perGroup}`, kind: 'groups', skill: conceptSkill('groups'),
    difficulty: groups * perGroup <= 20 ? 1 : 2, groups, perGroup, emoji, answer: groups * perGroup,
  }
}

export function makeArray(rows: number, cols: number, emoji: string, skill: SkillKey = conceptSkill('array')): ArrayExercise {
  return {
    id: `array:${rows}x${cols}`, kind: 'array', skill, difficulty: rows * cols <= 20 ? 1 : 2, rows, cols, emoji,
    answer: rows * cols,
  }
}

export function makeDoubleChain(start: number, steps: number): DoubleChainExercise {
  const answer: number[] = []
  let v = start
  for (let i = 0; i < steps; i++) answer.push((v *= 2))
  return {
    id: `double-chain:${start}:${steps}`, kind: 'double-chain', skill: mulSkill(start, 2 ** steps),
    difficulty: clampDifficulty(steps + (start >= 6 ? 1 : 0)), start, steps, answer,
  }
}

export function makeFactFamily(a: number, b: number): FactFamilyExercise {
  const p = a * b
  return {
    id: `fact-family:${Math.min(a, b)}-${Math.max(a, b)}`, kind: 'fact-family', skill: conceptSkill('family'),
    difficulty: clampDifficulty(factDifficulty(a, b) - 1 + 0.5), a, b, product: p,
    answer: [`${a}x${b}=${p}`, `${b}x${a}=${p}`, `${p}/${a}=${b}`, `${p}/${b}=${a}`],
  }
}

export function makeColumnAdd(operands: number[], skill?: SkillKey): ColumnAddExercise {
  const { answer, carries, carryCount } = analyzeAdd(operands)
  const digits = Math.max(...operands.map(digitCount))
  return {
    id: `column-add:${operands.join('+')}`, kind: 'column-add', skill: skill ?? addSkill(Math.max(2, Math.min(4, digits)), carryCount),
    difficulty: clampDifficulty(digits - 1 + carryCount * 0.75), operands: [...operands], answer, carries,
  }
}

export function makeColumnSub(minuend: number, subtrahend: number): ColumnSubExercise {
  const { answer, borrowed, borrowCount, zeroBorrow } = analyzeSub(minuend, subtrahend)
  const digits = Math.max(2, Math.min(4, digitCount(minuend)))
  return {
    id: `column-sub:${minuend}-${subtrahend}`, kind: 'column-sub', skill: subSkill(digits, borrowCount, zeroBorrow),
    difficulty: clampDifficulty(zeroBorrow ? digits + 1 : digits - 1 + borrowCount * 0.75), minuend, subtrahend, answer, borrowed,
  }
}

export function makeColumnMul(top: number, bottom: number): ColumnMulExercise {
  const { answer, carries, unitsCarry } = analyzeMul(top, bottom)
  return {
    id: `column-mul:${top}x${bottom}`, kind: 'column-mul', skill: mul2x1Skill(unitsCarry),
    difficulty: clampDifficulty((unitsCarry ? 3 : 2) + (bottom >= 6 ? 1 : 0)), top, bottom, answer, carries,
  }
}

export function makeDivision(dividend: number, divisor: number): DivisionExercise {
  const { quotient, remainder, variant } = analyzeDiv(dividend, divisor)
  return {
    id: `division:${dividend}/${divisor}`, kind: 'division', skill: div2x1Skill(variant),
    difficulty: variant === 'exact' ? 2 : variant === 'rem' ? 3 : 5, dividend, divisor, quotient, remainder, variant,
  }
}

export function makeWordProblem(
  templateId: string, text: string, op: WordOp, a: number, b: number, unit: string,
): WordProblemExercise {
  let answer: number
  let remainder: number | undefined
  switch (op) {
    case 'add': answer = a + b; break
    case 'sub': answer = a - b; break
    case 'mul': answer = a * b; break
    case 'div':
      answer = Math.floor(a / b)
      if (a % b !== 0) remainder = a % b
      break
  }
  const size = Math.max(digitCount(a), digitCount(b))
  const ex: WordProblemExercise = {
    id: `word-problem:${templateId}:${a},${b}`, kind: 'word-problem', skill: wordSkill(op),
    difficulty: clampDifficulty(1 + size * 0.75 + (op === 'div' || op === 'sub' ? 0.5 : 0)), text, op, operands: [a, b],
    answer, unit,
  }
  if (remainder !== undefined) ex.remainder = remainder
  return ex
}

/** Build an exercise from fixed operands (e.g. a guardian's "Hechizo del Cristal": { kind:'column-add', a:2486, b:1357 }). */
export function makeExercise(kind: 'fact-mul' | 'column-add' | 'column-sub' | 'column-mul' | 'division', a: number, b: number): Exercise {
  switch (kind) {
    case 'fact-mul': return makeFactMul(a, b)
    case 'column-add': return makeColumnAdd([a, b])
    case 'column-sub': return makeColumnSub(Math.max(a, b), Math.min(a, b))
    case 'column-mul': return a >= b ? makeColumnMul(a, b) : makeColumnMul(b, a)
    case 'division': return makeDivision(a, b)
  }
}
