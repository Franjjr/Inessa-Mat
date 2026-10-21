/* PUBLIC API of the pedagogy engine (agent: engine). Pure TypeScript, no React, no I/O.
   The signatures below are the contract — implement them in sibling files and re-export from here.
   Stub bodies exist only so the app compiles before the engine is implemented. */
import type {
  ActivityKind, Answer, CheckResult, ChildProfile, ErrorType, Exercise, FactStrategy, Hint, InputMode,
  MasteryMap, ProgressState, Rng, SkillKey, SkillMastery, SkillSelector,
} from '@/types'

/** Seeded PRNG (mulberry32). Same seed → same sequence. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface GenerateOptions {
  rng?: Rng
  /** With selector.adaptive, weights toward due/weak skills. */
  mastery?: MasteryMap
  /** Avoid repeating these exact items (ids are deterministic from content, e.g. 'mul:6x7:7x6'). */
  avoidIds?: string[]
  now?: Date
}

/** Generate `count` exercises matching the selector. Never returns duplicates within one call when avoidable. */
export function generate(_selector: SkillSelector, _count: number, _opts?: GenerateOptions): Exercise[] {
  throw new Error('engine.generate not implemented yet')
}

/** Check an answer and diagnose the error type. Pure and deterministic. */
export function check(_exercise: Exercise, _answer: Answer): CheckResult {
  throw new Error('engine.check not implemented yet')
}

/** Progressive hints (level 1 strategy → level 3 worked step) for this exercise. */
export function hintsFor(_exercise: Exercise): Hint[] {
  return []
}

/** The workbook "trick" for a multiplication fact (6×7 → five-plus-one, 8×n → double-double-double, ...). */
export function strategyForFact(_a: number, _b: number): FactStrategy {
  return { id: 'known', text: '', visual: 'none' }
}

export interface AttemptForMastery {
  skill: SkillKey
  correct: boolean
  ms: number
  inputMode: InputMode
  hintsUsed: number
  errorType?: ErrorType | null
}

export function newMastery(skill: SkillKey, now: Date = new Date()): SkillMastery {
  return { skill, box: 0, attempts: 0, correct: 0, streak: 0, avgMs: null, lastSeenAt: null, dueAt: now.toISOString(), updatedAt: now.toISOString() }
}

/** Leitner update with fluency (speed) awareness. Hints and recognition errors never count as fluent. */
export function updateMastery(prev: SkillMastery | undefined, _attempt: AttemptForMastery, now: Date = new Date()): SkillMastery {
  return prev ?? newMastery(_attempt.skill, now)
}

/** Skills due for review, most urgent first. */
export function dueSkills(_mastery: MasteryMap, _now: Date, _limit: number, _filter?: (skill: SkillKey) => boolean): SkillKey[] {
  return []
}

/** Fluency threshold in ms for a correct answer to count as "fast" (writing with a pen takes longer than typing). */
export function fluencyThresholdMs(_inputMode: InputMode, _kind: Exercise['kind']): number {
  return 6000
}

export function starsFor(correct: number, total: number, thresholds: [number, number, number] = [0.6, 0.8, 0.95]): 0 | 1 | 2 | 3 {
  if (total <= 0) return 0
  const r = correct / total
  return r >= thresholds[2] ? 3 : r >= thresholds[1] ? 2 : r >= thresholds[0] ? 1 : 0
}

/** 10×10 grid of mastery boxes for multiplication facts (index [a-1][b-1]; -1 = never seen). Symmetric. */
export function factGrid(_mastery: MasteryMap): number[][] {
  return Array.from({ length: 10 }, () => Array(10).fill(-1))
}

/** Human description of a skill for adults (Spanish): 'mul:6x7' → '6 × 7', 'sub:4d:z' → 'Restas de 4 cifras con ceros'. */
export function describeSkill(skill: SkillKey): string {
  return skill
}

/** Spanish description of an error type for adult dashboards. */
export function describeError(errorType: ErrorType): string {
  return errorType
}

export interface SessionPlan {
  minutes: number
  /** Short oral-style warm-up: due facts first. */
  warmup: SkillKey[]
  /** Next story node to continue, if any. */
  next: { worldId: string; nodeId: string } | null
  /** Mixed review of weak/due skills (spaced repetition). */
  review: SkillKey[]
  /** Fun closing game. */
  game: ActivityKind
}

/** Build today's ~15-minute session: warm-up → continue the adventure → review → game. */
export function planSession(_input: { child: ChildProfile; progress: ProgressState; mastery: MasteryMap; now: Date }): SessionPlan {
  return { minutes: 15, warmup: [], next: null, review: [], game: 'memory' }
}

/** Selector that targets exactly these skills (used by daily review). */
export function selectorForSkills(skills: SkillKey[]): SkillSelector {
  return { skills }
}
