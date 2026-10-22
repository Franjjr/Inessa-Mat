/* Spaced repetition (Leitner boxes 0..5) with fluency awareness, exactly as docs/PEDAGOGY.md:
     intervals: box0 → now (same session), 1 → 1 day, 2 → 2, 3 → 4, 4 → 8, 5 → 16 days
     correct + fluent (fast, no hints) → box + 1
     correct but slow or with hints   → box stays (but box 0 → 1)
     wrong                            → box = max(0, box − 2), due now
     recognition errors               → ignored (never lower mastery)
   Facts are judged on speed (keyboard 4 s, keypad 5 s, pen/touch 7 s); column ops and everything multi-step
   on accuracy only. */
import type { Exercise, ExerciseKind, InputMode, MasteryMap, SkillKey, SkillMastery } from '@/types'
import { parseSkill } from './skills'
import type { AttemptForMastery } from './types'

export const LEITNER_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16] as const
export const MAX_BOX = 5
const DAY_MS = 24 * 60 * 60 * 1000
/** Weight of the newest response time in the moving average. */
const EMA_ALPHA = 0.3

const FACT_THRESHOLDS: Record<InputMode, number> = { keyboard: 4000, keypad: 5000, pen: 7000, touch: 7000, tap: 4000 }
const SPEED_KINDS: ExerciseKind[] = ['fact-mul', 'fact-div', 'missing-factor']

export function newMastery(skill: SkillKey, now: Date = new Date()): SkillMastery {
  return { skill, box: 0, attempts: 0, correct: 0, streak: 0, avgMs: null, lastSeenAt: null, dueAt: now.toISOString(), updatedAt: now.toISOString() }
}

/** Fluency threshold in ms for a correct answer to count as "fast" (writing with a pen takes longer than typing).
    Kinds judged on accuracy only return Infinity. */
export function fluencyThresholdMs(inputMode: InputMode, kind: Exercise['kind']): number {
  if (!SPEED_KINDS.includes(kind)) return Number.POSITIVE_INFINITY
  return FACT_THRESHOLDS[inputMode] ?? FACT_THRESHOLDS.keypad
}

/** The kind whose fluency rule applies to a skill (facts only); null = accuracy only. */
export function speedKindForSkill(skill: SkillKey): ExerciseKind | null {
  const p = parseSkill(skill)
  if (p?.type === 'mul') return 'fact-mul'
  if (p?.type === 'div') return 'fact-div'
  return null
}

export function intervalMs(box: number): number {
  return LEITNER_INTERVAL_DAYS[Math.max(0, Math.min(MAX_BOX, box))] * DAY_MS
}

/** Leitner update with fluency (speed) awareness. Hints and recognition errors never count as fluent. */
export function updateMastery(prev: SkillMastery | undefined, attempt: AttemptForMastery, now: Date = new Date()): SkillMastery {
  const base = prev ?? newMastery(attempt.skill, now)
  if (attempt.errorType === 'recognition') return base
  const iso = now.toISOString()
  let box: number = base.box
  let streak = base.streak
  let correct = base.correct
  let avgMs = base.avgMs
  let lastError = base.lastError ?? null
  if (attempt.correct) {
    const kind = speedKindForSkill(base.skill)
    const threshold = kind ? fluencyThresholdMs(attempt.inputMode, kind) : Number.POSITIVE_INFINITY
    const validMs = Number.isFinite(attempt.ms) && attempt.ms >= 0
    const fluent = attempt.hintsUsed === 0 && (threshold === Number.POSITIVE_INFINITY || (validMs && attempt.ms <= threshold))
    box = fluent ? Math.min(MAX_BOX, box + 1) : box === 0 ? 1 : box
    streak += 1
    correct += 1
    if (validMs) avgMs = avgMs === null ? Math.round(attempt.ms) : Math.round((1 - EMA_ALPHA) * avgMs + EMA_ALPHA * attempt.ms)
    if (streak >= 3) lastError = null
  } else {
    box = Math.max(0, box - 2)
    streak = 0
    lastError = attempt.errorType ?? 'other'
  }
  const next: SkillMastery = {
    skill: base.skill,
    box: box as SkillMastery['box'],
    attempts: base.attempts + 1,
    correct,
    streak,
    avgMs,
    lastSeenAt: iso,
    dueAt: new Date(now.getTime() + (attempt.correct ? intervalMs(box) : 0)).toISOString(),
    lastError,
    updatedAt: iso,
  }
  return next
}

/** Skills due for review, most urgent first: lowest box first, then the longest overdue. */
export function dueSkills(mastery: MasteryMap, now: Date, limit: number, filter?: (skill: SkillKey) => boolean): SkillKey[] {
  const t = now.getTime()
  const due = Object.values(mastery).filter((m) => {
    if (!m || (filter && !filter(m.skill))) return false
    return m.dueAt === null || Date.parse(m.dueAt) <= t
  })
  due.sort((x, y) => {
    if (x.box !== y.box) return x.box - y.box
    const dx = x.dueAt === null ? -Infinity : Date.parse(x.dueAt)
    const dy = y.dueAt === null ? -Infinity : Date.parse(y.dueAt)
    if (dx !== dy) return dx - dy
    return x.skill < y.skill ? -1 : x.skill > y.skill ? 1 : 0
  })
  return due.slice(0, Math.max(0, limit)).map((m) => m.skill)
}

export function starsFor(correct: number, total: number, thresholds: [number, number, number] = [0.6, 0.8, 0.95]): 0 | 1 | 2 | 3 {
  if (total <= 0) return 0
  const r = correct / total
  return r >= thresholds[2] ? 3 : r >= thresholds[1] ? 2 : r >= thresholds[0] ? 1 : 0
}

/** 10×10 grid of mastery boxes for multiplication facts (index [a-1][b-1]; -1 = never seen). Symmetric. */
export function factGrid(mastery: MasteryMap): number[][] {
  const grid: number[][] = Array.from({ length: 10 }, () => Array(10).fill(-1))
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      const m = mastery[`mul:${a}x${b}`]
      if (!m) continue
      grid[a - 1][b - 1] = m.box
      grid[b - 1][a - 1] = m.box
    }
  }
  return grid
}
