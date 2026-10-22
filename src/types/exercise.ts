import type { ID, InputMode } from './common'

/**
 * Skill keys — the unit of mastery tracking. Format (owned by src/engine/skills.ts):
 *   mul:A×B        multiplication fact, normalised with A <= B, 1..10 (e.g. 'mul:6x7' covers 6×7 and 7×6)
 *   div:P/D        division fact P ÷ D with P = D×Q, D,Q in 1..10 (e.g. 'div:42/6')
 *   skip:N         skip counting by N (N 2..10)
 *   add:3d:c0|c1|c2|c3   column addition, 3 or 4 digit operands, number of carries
 *   add:4d:c0..c4
 *   sub:3d:b0|b1|b2|z    column subtraction, number of borrows, z = borrow across a zero
 *   sub:4d:b0..b3|z
 *   mul:2x1:c0|c1        2-digit × 1-digit, without / with carry
 *   div:2x1:exact|rem|long   2-digit ÷ 1-digit: digit-by-digit exact, with remainder (1-digit quotient), long (bring down)
 *   concept:groups | concept:array | concept:commutative | concept:share | concept:family | concept:placevalue
 *   bar:add|sub|mul|div|two   problem on a bar diagram (two = two steps), with and without the bar (ladder)
 *   hunt:add|sub|mul          encuentra el error: a worked column calculation that may be wrong
 *   check:add|sub|div         comprobar: is the claim right? (the check operation is written)
 *   div:3x1:exact|rem         3-digit dividend ÷ 1-digit divisor
 */
export type SkillKey = string

export type ExerciseKind =
  | 'fact-mul'        // a × b = ?
  | 'fact-div'        // p ÷ d = ?
  | 'missing-factor'  // a × ? = p   or  ? × b = p
  | 'skip-count'      // fill missing values in a sequence n, 2n, 3n...
  | 'groups'          // n groups of k objects → write n × k = ?
  | 'array'           // r rows × c columns of objects
  | 'double-chain'    // n → 2n → 4n → 8n
  | 'fact-family'     // triangle a, b, p → write the 4 related facts
  | 'column-add'      // vertical addition with carries
  | 'column-sub'      // vertical subtraction with borrows
  | 'column-mul'      // vertical 2-digit × 1-digit
  | 'division'        // Spanish "galera" layout: dividend | divisor, quotient + remainder
  | 'word-problem'    // short story problem resolving to one operation
  | 'bar-problem'     // story problem solved on a bar diagram (with the bar first, then without it)
  | 'error-hunt'      // encuentra el error: a worked column calculation; the child decides and fixes it
  | 'check-calc'      // comprobar: a claimed result; the child writes the check operation and decides

interface ExerciseBase {
  id: ID
  kind: ExerciseKind
  skill: SkillKey
  /** 1 (easiest) .. 5 (hardest) — engine's estimate, used for sequencing. */
  difficulty: number
}

export interface FactMulExercise extends ExerciseBase { kind: 'fact-mul'; a: number; b: number; answer: number }
export interface FactDivExercise extends ExerciseBase { kind: 'fact-div'; dividend: number; divisor: number; answer: number }
export interface MissingFactorExercise extends ExerciseBase {
  kind: 'missing-factor'; a: number; b: number; product: number; missing: 'a' | 'b'; answer: number
}
export interface SkipCountExercise extends ExerciseBase {
  kind: 'skip-count'; step: number; values: number[]; hiddenIndexes: number[]; answer: number[] /* values at hiddenIndexes, same order */
}
export interface GroupsExercise extends ExerciseBase {
  kind: 'groups'; groups: number; perGroup: number; emoji: string; answer: number
}
export interface ArrayExercise extends ExerciseBase {
  kind: 'array'; rows: number; cols: number; emoji: string; answer: number
}
export interface DoubleChainExercise extends ExerciseBase {
  kind: 'double-chain'; start: number; steps: number; answer: number[] /* each doubling, e.g. 3 → [6,12,24] */
}
export interface FactFamilyExercise extends ExerciseBase {
  kind: 'fact-family'; a: number; b: number; product: number
  /** The 4 facts in canonical order: a×b, b×a, p÷a, p÷b. Answers are checked as a set per operation type. */
  answer: [string, string, string, string]
}
export interface ColumnAddExercise extends ExerciseBase {
  kind: 'column-add'; operands: number[]; answer: number
  /** carries[i] = carry written above column i (i=0 units). carries[0] is always 0. */
  carries: number[]
}
export interface ColumnSubExercise extends ExerciseBase {
  kind: 'column-sub'; minuend: number; subtrahend: number; answer: number
  /** borrowed[i] = true when column i needed to borrow from column i+1 (i=0 units). */
  borrowed: boolean[]
}
export interface ColumnMulExercise extends ExerciseBase {
  kind: 'column-mul'; top: number; bottom: number; answer: number; carries: number[]
}
export interface DivisionExercise extends ExerciseBase {
  kind: 'division'; dividend: number; divisor: number; quotient: number; remainder: number
  /** 'exact' digit-by-digit, 'rem' one-digit quotient with remainder, 'long' requires bringing down. */
  variant: 'exact' | 'rem' | 'long'
}
export interface WordProblemExercise extends ExerciseBase {
  kind: 'word-problem'
  /** Template string (see content/template.ts) — may use {child} {pet} etc. */
  text: string
  op: 'add' | 'sub' | 'mul' | 'div'
  operands: [number, number]
  answer: number
  remainder?: number
  /** Unit word for the answer line, e.g. 'estrellas'. */
  unit: string
}

export type BarOp = 'add' | 'sub' | 'mul' | 'div'
export type BarProblemKind = 'change' | 'compare' | 'combine' | 'share' | 'two-step'

/** One piece of a bar diagram. value null = the unknown (no chip for it; the answer goes there). */
export interface BarSlot {
  id: string
  /** Child-facing name written on the piece ('Tenía', 'Le dan', 'Total'). */
  name: string
  /** Which bar of the drawing (0 = the first; two-step problems have one bar per step). */
  row: number
  /** segment = a piece of the bar; total = the bracket over the whole bar; count = how many groups (a badge). */
  kind: 'segment' | 'total' | 'count'
  value: number | null
}

/** One operation of the solution. The result of the last step is the answer. */
export interface BarStep { op: BarOp; a: number; b: number; result: number }

export interface BarProblemExercise extends ExerciseBase {
  kind: 'bar-problem'
  /** Template string (may use {child}, {pet}). */
  text: string
  problem: BarProblemKind
  /** true: the child first places the numbers on the bar. false: the same problem without the drawing. */
  withBar: boolean
  bar: BarSlot[]
  /** Number of bars drawn (rows of the diagram). */
  rows: number
  steps: BarStep[]
  answer: number
  /** Unit word for the answer line. */
  unit: string
}

/** encuentra el error: operands and the claimed result of a column calculation. */
export interface ErrorHuntExercise extends ExerciseBase {
  kind: 'error-hunt'
  op: 'add' | 'sub' | 'mul'
  /** Top row (sub: the minuend; mul: the 2- or 3-digit number). */
  top: number
  /** Bottom row (the subtrahend; mul: the single digit). */
  bottom: number
  /** The result written in the calculation (may be wrong). */
  shown: number
  /** The right result. */
  answer: number
  /** Column (0 = units) where the written result first differs from the right one; null when it is right. */
  wrongColumn: number | null
  /** The error the calculation carries, tagged for the report; null when the calculation is right. */
  errorType: ErrorType | null
}

/** comprobar: a claim «left op right = claimed» and the check the child writes. */
export interface CheckCalcExercise extends ExerciseBase {
  kind: 'check-calc'
  op: 'add' | 'sub' | 'div'
  left: number
  right: number
  claimed: number
  /** Division only: the remainder claimed (left = right × claimed + remainder). */
  remainder?: number
  /** The number the check gives, the answer of the exercise: claimed − right (add), claimed + right (sub), right × claimed + remainder (div). */
  answer: number
  /** Whether the claim is true. */
  ok: boolean
  /** The error the claim carries when it is false, tagged for the report; null when true. */
  errorType: ErrorType | null
}

export type Exercise =
  | FactMulExercise | FactDivExercise | MissingFactorExercise | SkipCountExercise | GroupsExercise
  | ArrayExercise | DoubleChainExercise | FactFamilyExercise | ColumnAddExercise | ColumnSubExercise
  | ColumnMulExercise | DivisionExercise | WordProblemExercise | BarProblemExercise | ErrorHuntExercise | CheckCalcExercise

/**
 * A child's answer. Single-number kinds use { value }. Column kinds send the digits written in each cell so the
 * engine can diagnose errors (e.g. forgot the carry). Division sends quotient and remainder.
 */
export type Answer =
  | { type: 'number'; value: number | null }
  | { type: 'numbers'; values: (number | null)[] }                       // skip-count, double-chain
  | { type: 'digits'; digits: (number | null)[]; carries?: (number | null)[]; method?: SubMethod } // column ops; digits[0] = units. carries = written steps (resta: marks)
  | { type: 'steps'; method: 'parts' | 'line'; values: (number | null)[]; total?: number | null }   // resta por partes / saltos
  | { type: 'division'; quotient: number | null; remainder: number | null }
  | { type: 'facts'; facts: string[] }                                     // fact-family, e.g. '6x7=42', '42/6=7'
  | { type: 'bar'; placed: (number | null)[]; ops: (BarOp | null)[]; results: (number | null)[] } // bar: per slot, per step
  | { type: 'hunt'; ok: boolean | null; column: number | null; value: number | null }  // encuentra el error
  | { type: 'verdict'; ok: boolean | null; value: number | null }          // comprobar: the verdict and the check
  | { type: 'division-parts'; parts: (number | null)[]; quotient: number | null; remainder: number | null } // repartir por partes
  | { type: 'climb'; products: (number | null)[]; remainder: number | null } // multiplicar hacia arriba

/**
 * Subtraction methods a child can learn (see src/engine/methods.ts for labels and the registry of methods per
 * operation). 'borrow' = pedir prestado arriba (default), 'carry' = me llevo una abajo (compensación),
 * 'parts' = por partes (352 − 100 − 20 − 7), 'line' = saltos en la recta numérica (contar hacia delante).
 */
export type SubMethod = 'borrow' | 'carry' | 'parts' | 'line'

/**
 * Division methods a child can learn (src/engine/methods.ts). 'galera' = the galera with the subtractions written,
 * 'galera-short' = the galera without them (la galera sin restas), 'div-parts' = repartir por partes
 * (84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4), 'climb' = multiplicar hacia arriba («¿qué número por 4 da 28?»).
 */
export type DivMethod = 'galera' | 'galera-short' | 'div-parts' | 'climb'

/** Tables tricks a child can pick as the favourite strategy (the Lumi tricks, src/engine/methods.ts). */
export type TableMethod = 'double' | 'double-double' | 'half-ten' | 'ten-minus-one' | 'five-plus-one' | 'mirror'

export type ErrorType =
  | 'fact'                 // wrong times-table fact (or wrong single-digit addition/subtraction inside a column)
  | 'carry-forgot'         // did not add the carry in the next column
  | 'carry-wrong'          // wrote the carry wrongly (e.g. wrote 15 in one cell)
  | 'borrow-forgot'        // borrowed but did not reduce the neighbour, or didn't borrow at all
  | 'smaller-from-larger'  // subtracted top from bottom in a column (|a-b| error)
  | 'zero-borrow'          // mistake when borrowing across a zero
  | 'misaligned'           // digits placed in the wrong columns
  | 'remainder-too-big'    // remainder >= divisor
  | 'quotient-off'         // quotient off by one with consistent remainder logic
  | 'operation'            // used the wrong operation in a word problem
  | 'incomplete'           // left cells empty
  | 'recognition'          // child said the handwriting was misread (not a maths error!)
  | 'bar-placement'        // a quantity put on the wrong piece of the bar
  | 'place-value'          // a digit written in the wrong column (valor posicional), or a shifted result
  | 'step'                 // the first step of a two-step problem is wrong
  | 'false-alarm'          // the child said there was an error in a right calculation
  | 'other'

export interface CheckResult {
  correct: boolean
  /** Normalised representation of what was given / expected, for logs and parent dashboards. */
  given: string
  expected: string
  errorType?: ErrorType
  /** For column ops: indexes (0 = units) of the columns that are wrong, to highlight gently. */
  wrongColumns?: number[]
  /** Short child-facing feedback in Spanish (template string), e.g. "¡Casi! Revisa la llevada de las decenas." */
  feedback?: string
}

export type HintVisual =
  | 'groups' | 'array' | 'dots-five-plus-one' | 'double-chain' | 'mirror' | 'nine-trick' | 'skip-count'
  | 'place-value' | 'carry' | 'borrow' | 'times-ten-minus' | 'share' | 'family' | 'none'

export interface Hint {
  level: 1 | 2 | 3            // 1 = strategy reminder, 2 = visual scaffold, 3 = worked step
  text: string                // template string
  visual: HintVisual
  /** Parameters for the visual (e.g. { a: 6, b: 7 }). */
  params?: Record<string, number | string | number[]>
}

/** Mental strategy (the "tricks" of the workbook) for a multiplication fact. */
export interface FactStrategy {
  id: 'easy-one' | 'double' | 'five' | 'ten' | 'mirror' | 'five-plus-one' | 'even-six-rhyme' | 'double-double'
     | 'double-double-double' | 'nine-trick' | 'square-rhyme' | 'five-six-seven-eight' | 'weeks' | 'known'
  text: string
  visual: HintVisual
}

/** Describes which exercises to generate. Used by content (world nodes) and free play. All fields optional. */
export interface SkillSelector {
  kinds?: ExerciseKind[]
  /** Explicit skills to draw from (e.g. ['mul:6x7','mul:6x8']). */
  skills?: SkillKey[]
  /** Times tables to draw facts from (e.g. [6] or [6,7,8]). Applies to fact-mul, fact-div, missing-factor, skip-count. */
  tables?: number[]
  /** Second factor range for facts, default [1,10]. */
  factorRange?: [number, number]
  /** Column ops: number of digits of the operands. */
  digits?: 2 | 3 | 4
  /** Column ops: carries/borrows wanted. */
  regroup?: 'none' | 'one' | 'many' | 'any'
  /** Subtraction: include borrowing across zeros. */
  zeros?: boolean
  /** Division variants allowed. */
  divisionVariants?: DivisionExercise['variant'][]
  /** Prefer items the child has not mastered yet (requires mastery passed to generate). */
  adaptive?: boolean
}

/** Everything an activity needs to log after the child answers one exercise. */
export interface AttemptInput {
  exercise: Exercise
  check: CheckResult
  ms: number
  inputMode: InputMode
  hintsUsed: number
  /** Number of times the child corrected a misread digit before submitting. */
  recognitionFixes?: number
  /** Method used for this exercise when the operation has several (e.g. 'borrow' for a column subtraction). */
  method?: string
}
