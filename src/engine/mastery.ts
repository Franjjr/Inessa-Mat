/* Spaced repetition (Leitner boxes 0..5) with fluency awareness, exactly as docs/PEDAGOGY.md:
     intervals: box0 → now (same session), 1 → 1 day, 2 → 2, 3 → 4, 4 → 8, 5 → 16 days
     correct + fluent (fast, no hints, no wrong try first) + due → box + 1
     correct but slow, with hints or after a wrong try         → box stays (but box 0 → 1)
     correct before its review date (not due yet)              → box stays and the review date stays
     correct long after its review date (over one interval)    → one box down first, then the rule above
     wrong                            → box = max(0, box − 2), due now
     recognition errors               → ignored (never lower mastery)
   Facts are judged on speed (keyboard 4 s, keypad 5 s, pen/touch 7 s); column ops and everything multi-step
   on accuracy only. Climbing only when due means one sitting cannot master a skill: after a climb the next one
   waits a whole interval, so MASTERED_BOX (2) takes answers on two different days. */
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
/** Highest box a right answer to a choice exercise can take a skill to. A choice between two or three options is right
    half or a third of the time by chance, so the box past this one (mastered, then the next) needs written answers. */
export const CHOICE_MAX_BOX = 2
const CHOICE_KINDS: ExerciseKind[] = ['compare', 'shape-choice', 'eng-listen-pick', 'eng-complete', 'lng-classify', 'lng-read-choice']

export function newMastery(skill: SkillKey, now: Date = new Date()): SkillMastery {
  return { skill, box: 0, attempts: 0, correct: 0, streak: 0, avgMs: null, lastSeenAt: null, dueAt: now.toISOString(), updatedAt: now.toISOString() }
}

/** Fluency threshold in ms for a correct answer to count as "fast" (writing with a pen takes longer than typing).
    Kinds judged on accuracy only return Infinity. */
export function fluencyThresholdMs(inputMode: InputMode, kind: Exercise['kind']): number {
  if (!SPEED_KINDS.includes(kind)) return Number.POSITIVE_INFINITY
  return FACT_THRESHOLDS[inputMode] ?? FACT_THRESHOLDS.keypad
}

/** True when the child only picks an answer from a few options (no writing): a guess gets it right too often to climb
    past CHOICE_MAX_BOX. Kinds that are choice only in one of their modes are judged by the mode. */
export function isChoiceExercise(ex: Exercise): boolean {
  if (CHOICE_KINDS.includes(ex.kind)) return true
  switch (ex.kind) {
    case 'equation': return ex.mode === 'same'
    case 'money': return ex.mode === 'recognise' || ex.mode === 'compare'
    case 'measure': return ex.mode === 'unit'
    case 'clock-read': return ex.mode === 'phrase'
    case 'time-convert': return ex.direction === 'to-phrase'
    case 'calendar': return ex.topic === 'weekday'
    default: return false
  }
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

/** True when the review date of a skill has come (a skill never reviewed, with no date, is due). */
export function isDue(m: Pick<SkillMastery, 'dueAt'>, now: Date): boolean {
  return m.dueAt === null || Date.parse(m.dueAt) <= now.getTime()
}

/** Leitner update with fluency (speed) awareness. Hints, a wrong try first and recognition errors never count as fluent. */
export function updateMastery(prev: SkillMastery | undefined, attempt: AttemptForMastery, now: Date = new Date()): SkillMastery {
  const base = prev ?? newMastery(attempt.skill, now)
  if (attempt.errorType === 'recognition') return base
  const iso = now.toISOString()
  let box: number = base.box
  let streak = base.streak
  let correct = base.correct
  let avgMs = base.avgMs
  let lastError = base.lastError ?? null
  let dueAt = iso
  if (attempt.correct) {
    const due = isDue(base, now)
    // Answered long after its review date: the child has probably lost some of it, so one box goes down first.
    if (due && base.dueAt !== null && box > 0 && now.getTime() - Date.parse(base.dueAt) > intervalMs(box)) box -= 1
    const kind = speedKindForSkill(base.skill)
    const threshold = kind ? fluencyThresholdMs(attempt.inputMode, kind) : Number.POSITIVE_INFINITY
    const validMs = Number.isFinite(attempt.ms) && attempt.ms >= 0
    const fluent = attempt.hintsUsed === 0 && !attempt.retries && (threshold === Number.POSITIVE_INFINITY || (validMs && attempt.ms <= threshold))
    const capped = attempt.choice === true && box >= CHOICE_MAX_BOX
    const climbs = fluent && (due || box === 0) && !capped
    box = climbs ? Math.min(MAX_BOX, box + 1) : box === 0 ? 1 : box
    streak += 1
    correct += 1
    if (validMs) avgMs = avgMs === null ? Math.round(attempt.ms) : Math.round((1 - EMA_ALPHA) * avgMs + EMA_ALPHA * attempt.ms)
    if (streak >= 3) lastError = null
    // Answered before the review date: the date stays, so the next climb still waits for it.
    dueAt = due ? new Date(now.getTime() + intervalMs(box)).toISOString() : (base.dueAt ?? iso)
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
    dueAt,
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
