/* PUBLIC API of the pedagogy engine (agent: engine). Pure TypeScript, no React, no I/O.
   The contract signatures (createRng, generate, check, hintsFor, strategyForFact, newMastery, updateMastery,
   dueSkills, fluencyThresholdMs, starsFor, factGrid, describeSkill, describeError, planSession,
   selectorForSkills and the GenerateOptions / AttemptForMastery / SessionPlan types) are implemented in the
   sibling files and re-exported here. Extra helpers are exported below them. */

export type { AttemptForMastery, GenerateOptions, SessionPlan } from './types'

/** Seeded PRNG (mulberry32). Same seed → same sequence. */
export { createRng } from './rng'
/** Generate `count` exercises matching the selector. Never returns duplicates within one call when avoidable. */
export { generate } from './generate'
/** Check an answer and diagnose the error type. Pure and deterministic. */
export { check } from './check'
/** Progressive hints (level 1 strategy → level 3 worked step) for this exercise. */
export { hintsFor } from './hints'
/** The workbook "trick" for a multiplication fact (6×7 → five-plus-one, 8×n → double-double-double, ...). */
export { strategyForFact } from './strategies'
/** Leitner mastery: newMastery, updateMastery (fluency-aware), dueSkills, fluencyThresholdMs, starsFor, factGrid. */
export { dueSkills, factGrid, fluencyThresholdMs, newMastery, starsFor, updateMastery } from './mastery'
/** Spanish descriptions for adult dashboards. */
export { describeError, describeSkill } from './describe'
/** Review plan and selectors (daily review), and the 15-minute daily session plan (blocks, scaffolding). */
export { planSession, selectorForSkills } from './session'
export {
  DAILY_BLOCK_LABEL, DAILY_MINUTES, EXAMPLE_SECONDS, ITEM_SECONDS, NEW_FACT_BUDGET, estimateSeconds, planDailySession,
  scaffoldedSkills, statementOf,
} from './daily'
export type { DailyBlockId, DailyItem, DailyPlan } from './daily'
/** Prueba inicial: items, block mapping and the summary for the adult report. */
export { PLACEMENT_ACTIVITY, PLACEMENT_BLOCKS, PLACEMENT_COUNT, buildPlacement, placementBlockOf, summarizePlacement } from './placement'
export type { PlacementBlockId, PlacementItem, PlacementSummary } from './placement'

// ---------------------------------------------------------------- extra helpers (engine extensions)

/** Skill-key builders/parsers (format documented in skills.ts). */
export {
  addSkill, allMulFactSkills, conceptSkill, div2x1Skill, divSkill, isEasyFact, isFactSkill, isMulFactSkill,
  isValidSkill, kindsForSkill, mul2x1Skill, mulSkill, parseSkill, skipSkill, subSkill, wordSkill,
} from './skills'
export type { ConceptName, DivisionVariant, ParsedSkill, WordOp } from './skills'
/** Build exercises from fixed numbers (e.g. a guardian's Hechizo del Cristal: makeExercise('column-add', 2486, 1357)). */
export {
  makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeDoubleChain, makeExercise, makeFactDiv,
  makeFactFamily, makeFactMul, makeGroups, makeMissingFactor, makeSkipCount, makeWordProblem,
} from './make'
/** Column arithmetic analysis (digits units-first). */
export { analyzeAdd, analyzeDiv, analyzeMul, analyzeSub, digitCount, fromDigits, toDigits } from './arith'
/** Fact-family parsing ("6 × 7 = 42", "42 : 6 = 7"...). */
export { parseFact } from './check'
export { strategyDetail } from './strategies'
export type { StrategyDetail } from './strategies'
export { intervalMs, LEITNER_INTERVAL_DAYS } from './mastery'
export { WORD_TEMPLATES } from './wordProblems'
export type { WordTemplate } from './wordProblems'
export { columnName } from './feedback'
/** Subtraction methods: the registry (labels, per operation) and the written steps each method expects. */
export { DEFAULT_METHOD, isSubMethod, methodLabel, methodsOf, METHODS, normaliseSubMethod, SUB_METHODS } from './methods'
export type { MethodInfo, MethodOp } from './methods'
export { borrowMarks, compensationSteps, lineStops, partsResults, subtrahendParts } from './subMethods'
