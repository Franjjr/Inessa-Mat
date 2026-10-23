/* Pins the public contract of @/engine to the signatures of the original stub (src/engine/index.ts at scaffold
   time). The assignments below are checked by `npm run typecheck`: any drift in a signature fails to compile. */
import { describe, expect, it } from 'vitest'
import * as engine from '@/engine'
import type { AttemptForMastery, GenerateOptions, SessionPlan } from '@/engine'
import type {
  Answer, CheckResult, ChildProfile, ErrorType, Exercise, FactStrategy, Hint, InputMode, MasteryMap,
  ProgressState, Rng, SkillKey, SkillMastery, SkillSelector,
} from '@/types'

interface Contract {
  createRng: (seed: number) => Rng
  generate: (selector: SkillSelector, count: number, opts?: GenerateOptions) => Exercise[]
  check: (exercise: Exercise, answer: Answer) => CheckResult
  hintsFor: (exercise: Exercise) => Hint[]
  strategyForFact: (a: number, b: number) => FactStrategy
  newMastery: (skill: SkillKey, now?: Date) => SkillMastery
  updateMastery: (prev: SkillMastery | undefined, attempt: AttemptForMastery, now?: Date) => SkillMastery
  dueSkills: (mastery: MasteryMap, now: Date, limit: number, filter?: (skill: SkillKey) => boolean) => SkillKey[]
  fluencyThresholdMs: (inputMode: InputMode, kind: Exercise['kind']) => number
  starsFor: (correct: number, total: number, thresholds?: [number, number, number]) => 0 | 1 | 2 | 3
  factGrid: (mastery: MasteryMap) => number[][]
  describeSkill: (skill: SkillKey) => string
  describeError: (errorType: ErrorType) => string
  planSession: (input: { child: ChildProfile; progress: ProgressState; mastery: MasteryMap; now: Date }) => SessionPlan
  selectorForSkills: (skills: SkillKey[]) => SkillSelector
}

const contract: Contract = engine

// The option/result types keep the stub's shape (every field assignable both ways).
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const sameGenerateOptions: Same<GenerateOptions, { rng?: Rng; mastery?: MasteryMap; avoidIds?: string[]; now?: Date }> = true
const sameAttempt: Same<AttemptForMastery, {
  skill: SkillKey; correct: boolean; ms: number; inputMode: InputMode; hintsUsed: number; errorType?: ErrorType | null
}> = true
const samePlan: Same<SessionPlan, {
  minutes: number; next: { worldId: string; nodeId: string } | null; review: SkillKey[]
}> = true

describe('public contract', () => {
  it('exports every contract function', () => {
    const names: (keyof Contract)[] = [
      'createRng', 'generate', 'check', 'hintsFor', 'strategyForFact', 'newMastery', 'updateMastery', 'dueSkills',
      'fluencyThresholdMs', 'starsFor', 'factGrid', 'describeSkill', 'describeError', 'planSession', 'selectorForSkills',
    ]
    for (const name of names) expect(typeof contract[name], name).toBe('function')
    expect(sameGenerateOptions && sameAttempt && samePlan).toBe(true)
  })
  it('starsFor and newMastery keep the stub defaults', () => {
    expect(contract.starsFor(6, 10)).toBe(1)
    expect(contract.newMastery('mul:6x7').box).toBe(0)
    expect(contract.updateMastery(undefined, { skill: 'mul:6x7', correct: true, ms: 1000, inputMode: 'keyboard', hintsUsed: 0 }).box).toBe(1)
  })
})
