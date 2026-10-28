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
/** Lengua de 3.º: the 15-minute session and the placement test (src/engine/lengua/daily.ts, placement.ts). */
export { planLenguaSession, storyFlag } from './lengua/daily'
export { teachableCourse } from './lengua/teachable'
export type { LenguaPlanInput } from './lengua/daily'
export { buildLenguaPlacement, lenguaPlacementBlockOf, LENGUA_PLACEMENT_ACTIVITY, LENGUA_PLACEMENT_BLOCKS, LENGUA_PLACEMENT_COUNT } from './lengua/placement'
export type { LenguaPlacementBlockId } from './lengua/placement'
export type { DailyBlockId, DailyItem, DailyPlan } from './daily'
/** Prueba inicial: items, block mapping and the summary for the adult report. */
export { PLACEMENT_ACTIVITY, PLACEMENT_BLOCKS, PLACEMENT_COUNT, buildPlacement, placementBlockOf, summarizePlacement } from './placement'
export type { PlacementBlockId, PlacementItem, PlacementSummary } from './placement'
/** Adult report: temario progress, mistakes by kind, tests (placement runs and recall). */
export { ERROR_GROUPS, errorGroupOf, errorReport, placementRuns, recallReport, syllabusReport, topicNeeds } from './report'
export type { BlockReport, ErrorGroupId, ErrorGroupReport, ErrorReport, PlacementRun, RecallReport, SyllabusReport, TopicNeeds, TopicReport, TopicState } from './report'

// ---------------------------------------------------------------- extra helpers (engine extensions)

/** Skill-key builders/parsers (format documented in skills.ts). */
export {
  addSkill, allMulFactSkills, barSkill, checkSkill, conceptSkill, div2x1Skill, div3x1Skill, divSkill, huntSkill, isEasyFact,
  isFactSkill, isMulFactSkill, isValidSkill, kindsForSkill, mul2x1Skill, mulSkill, parseSkill, skipSkill, subSkill, wordSkill,
  placeSkill, roundSkill, lineSkill, mentalSkill, isMentalSkill, NUMERIC_KINDS, MENTAL_FAMILIES, PLACE_MODES,
} from './skills'
export type { BarSkillOp, CheckOp, ConceptName, DivisionVariant, HuntOp, ParsedSkill, WordOp } from './skills'
/** Build exercises from fixed numbers (e.g. a guardian's Hechizo del Cristal: makeExercise('column-add', 2486, 1357)). */
export {
  makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeDivision3, makeDoubleChain, makeExercise,
  makeFactDiv, makeFactFamily, makeFactMul, makeGroups, makeMissingFactor, makeSkipCount, makeWordProblem,
} from './make'
/** Column arithmetic analysis (digits units-first). */
export { analyzeAdd, analyzeDiv, analyzeMul, analyzeSub, digitAt, digitCount, fromDigits, toDigits } from './arith'
/** Fact-family parsing ("6 × 7 = 42", "42 : 6 = 7"...). */
export { parseFact } from './check'
export { strategyDetail } from './strategies'
export type { StrategyDetail } from './strategies'
export { intervalMs, LEITNER_INTERVAL_DAYS } from './mastery'
export { WORD_TEMPLATES } from './wordProblems'
export type { WordTemplate } from './wordProblems'
export { columnName } from './feedback'
/** Lengua de 3.º, gramática: the exercises, their prompts, check and hints (src/engine/lengua). */
export { buildGrammar, checkGrammar, grammarPrompt, grammarStatement, hintsGrammar } from './lengua/grammar'
export { buildLengua, checkLengua, hintsLengua, lenguaStatement, LENGUA_KINDS } from './lengua/exercises'
export { isCompletionOnly } from './lengua/writing'
export { GRAMMAR_SKILLS, LENGUA_SKILLS } from './skills'
/** Subtraction methods: the registry (labels, per operation) and the written steps each method expects. */
export {
  DEFAULT_METHOD, DIV_METHODS, isDivMethod, isSubMethod, isTableMethod, methodLabel, methodsOf, METHODS, normaliseDivMethod,
  normaliseSubMethod, normaliseTableMethod, SUB_METHODS, TABLE_METHODS, tricksFor,
} from './methods'
export type { MethodInfo, MethodOp, TableTrick } from './methods'
/** Fracciones and geometría (block E): generators, grading and hints (see fractions.ts and geometry.ts). */
export { fractionName, fractionHints, genFractionAdd, genFractionCompare, genFractionEqual, genFractionName, genFractionOf, genFractionRead, genFractionShade, unequalWeights } from './fractions'
export {
  genAngleTap, genAngleType, genCircle, genGeometry, genLineRelation, genLineType, genPerimeter, genPolygonName, genPolygonSides,
  genSolidFaces, genSolidName, genSolidRoll, geometryHints, isConvex, polygonPoints, rightCorners, sideLengths, POLYGON_WORD,
  genArea, genSymmetry, isSymmetric, checkArea,
} from './geometry'
export { blockSkillsOf, decimalSkill, fractionSkill, geoSkill, FRACTION_DENOMINATORS, GEO_OPS } from './skills'
export type { FractionDenominator, FractionOp, GeoOp } from './skills'
/** Problemas con barras: the generator, the grading and the hints (see bars.ts). */
export { BAR_OPS, barChips, barHints, checkBar, genBarProblem } from './bars'
/** Encuentra el error and comprobar (see bugs.ts). */
export { checkCheckCalc, checkErrorHunt, checkHints, genCheckCalc, genErrorHunt, huntHints } from './bugs'
/** Division methods written as steps: repartir por partes and multiplicar hacia arriba (see divParts.ts). */
export { climbProducts, climbQuotient, divisionParts, divisionPartsResult } from './divParts'
export type { PartsStep } from './divParts'
export { borrowMarks, compensationSteps, lineStops, partsResults, subtrahendParts } from './subMethods'
/** Dinero and medida (3.º, block C): generators, checks, hints and statements (see money.ts and measure.ts). */
export { buildMoney, checkMoney, euros, hintsMoney, isNote, moneyStatement, MONEY_MODES, PIECES, pieceName, splitCents, SHOP } from './money'
export { buildMeasure, checkMeasure, DIMENSION_NAME, hintsMeasure, MEASURE_MODES, measureStatement, THINGS, UNITS } from './measure'
export { CHART_SKILLS, CHANCE_OPTIONS, bare, buildChance, buildChart, checkChance, checkChart, hintsChance, hintsChart, makeChance, makeChart, makeModeList } from './data'
export { PATTERN_SKILLS, buildPattern, checkPattern, hintsPattern, makeNumberSeries, makePredict, makeShapePattern } from './patterns'
export { POSITION_SKILLS, SIDES, buildPosition, checkPosition, hintsPosition, makeNext, makeRelative, makeRoute } from './position'
export { genDivision2d, genDivision4, genMul3x1, genMulParts, makeMulParts, checkMulParts, hintsMulParts } from './bigops'
export { checkLongMul, genLongMul, hintsLongMul, makeLongMul } from './longmul'
export { checkOrdinal, genOrdinal, hintsOrdinal, ordinalNumeral, ordinalPrompt, ordinalWord } from './ordinals'
/** Décimas y centésimas (4.º): the numbers in hundredths, the two boxes, grading and hints (src/engine/decimals.ts). */
export { checkDecimal, checkDecimalOp, decimalFromCells, decimalWords, fmtDecimal, genDecimal, genDecimalOp, hintsDecimal } from './decimals'
export { toRoman } from './calc'
export { measureSkill, moneySkill } from './skills'
/** Numbers up to 9 999 and cálculo mental (3.º, block A): display helpers for the views and the gallery. */
export { expandedParts, fmt, numberWords, placeName, roundTo, roundWords } from './numeric'
export { mentalHints, holds } from './calc'

// ---------------------------------------------------------------- tiempo (3.º, block D: reloj, duraciones, calendario)
/** Phrases of the clock, periods of the day and the calendar words (src/engine/time.ts). */
export {
  addFace, clockPhrase, digital, faceHour, MONTHS_30_31, minutesFace, pad2, parseClockPhrase, periodOf, durationWords, WEEKDAYS,
} from './time'
export type { DayPeriod } from './time'
/** Clock, time and calendar items: makers, checks and hints (src/engine/clock.ts). */
export {
  checkClock, clockSkillsOf, expectedClock, hintsClock, makeCalendarMonth, makeCalendarWeekday, makeClockRead, makeClockSet,
  makeTimeConvert, makeTimeDuration, statementClock,
} from './clock'
export { calendarSkill, clockConvertSkill, clockReadSkill, clockSetSkill, timeDurationSkill } from './skills'

/** Subjects: Lengua skills (lng:) apart from maths; maths readers filter with masteryOf / attemptsOf first. */
export { attemptsOf, masteryOf, minutesOfSubject, placementFlags, subjectOffered, subjectOfSession, subjectOfSkill } from './subjects'
export type { LessonSubject } from './subjects'
