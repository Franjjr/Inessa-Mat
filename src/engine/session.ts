/* Daily session plan (default 15 minutes), following the workbook rhythm:
   2-min oral warm-up of due facts → continue the adventure → mixed spaced review → a fun closing game. */
import type { ActivityKind, ChildProfile, MasteryMap, ProgressState, SkillKey, SkillSelector } from '@/types'
import { nextNode } from '@/content'
import { dueSkills } from './mastery'
import { clamp, hashString } from './rng'
import { isFactSkill, isMulFactSkill, parseSkill } from './skills'
import type { SessionPlan } from './types'

/** Gentle warm-up for a child with no history yet: easy tables learnt in the first world. */
const EASY_WARMUP: SkillKey[] = [
  'mul:2x3', 'mul:2x4', 'mul:2x5', 'mul:2x7', 'mul:5x5', 'mul:5x6', 'mul:3x5', 'mul:2x9', 'mul:5x8', 'mul:4x5',
  'mul:3x10', 'mul:6x10',
]

const FACT_GAMES: ActivityKind[] = ['memory', 'bubbles', 'maze', 'pixel', 'wheel', 'necklace']

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

function safeNextNode(progress: ProgressState): { worldId: string; nodeId: string } | null {
  try {
    return nextNode(progress) ?? null
  } catch {
    return null
  }
}

function isReviewable(skill: SkillKey): boolean {
  const p = parseSkill(skill)
  return p !== null && p.type !== 'concept'
}

/** Alternate facts and other skills so the review is interleaved, keeping each list's own order. */
function interleave(facts: SkillKey[], others: SkillKey[]): SkillKey[] {
  const out: SkillKey[] = []
  for (let i = 0; i < Math.max(facts.length, others.length); i++) {
    if (i < others.length) out.push(others[i])
    if (i < facts.length) out.push(facts[i])
  }
  return out
}

function pickGame(child: ChildProfile, mastery: MasteryMap, now: Date): ActivityKind {
  const facts = Object.values(mastery).filter((m) => m && isMulFactSkill(m.skill))
  const known = facts.filter((m) => m.box >= 2).length
  const strong = facts.filter((m) => m.box >= 3).length
  const timed = child.settings?.timedActivities !== false
  const options: ActivityKind[] = known < 4 ? ['memory', 'board'] : [...FACT_GAMES]
  if (known >= 4 && timed && strong >= 10) options.push('race')
  return options[hashString(`${child.id}:${dayKey(now)}`) % options.length]
}

/** Build today's ~15-minute session: warm-up → continue the adventure → review → game. */
export function planSession(input: { child: ChildProfile; progress: ProgressState; mastery: MasteryMap; now: Date }): SessionPlan {
  const { child, progress, now } = input
  const mastery = input.mastery ?? {}
  const minutes = clamp(Math.round(child.settings?.sessionMinutes ?? 15), 5, 60)
  const warmN = clamp(Math.round(minutes * 0.4), 3, 8)
  const reviewN = clamp(Math.round(minutes * 0.5), 4, 10)

  // Warm-up: due facts first, then learnt facts not seen for the longest time, else easy facts.
  const warmup = dueSkills(mastery, now, warmN, isFactSkill)
  const minWarm = Math.min(4, warmN)
  if (warmup.length < minWarm) {
    const learnt = Object.values(mastery)
      .filter((m) => m && isFactSkill(m.skill) && m.box >= 1 && !warmup.includes(m.skill))
      .sort((x, y) => (x.lastSeenAt ?? '').localeCompare(y.lastSeenAt ?? '') || x.skill.localeCompare(y.skill))
    for (const m of learnt) {
      if (warmup.length >= minWarm) break
      warmup.push(m.skill)
    }
  }
  if (warmup.length === 0) {
    const start = hashString(`${child.id}:${dayKey(now)}`) % EASY_WARMUP.length
    for (let i = 0; i < minWarm; i++) warmup.push(EASY_WARMUP[(start + i * 5) % EASY_WARMUP.length])
  }
  const warmSet = new Set(warmup)

  // Review: everything due (weakest first), then weak skills not due yet; facts interleaved with operations.
  const due = dueSkills(mastery, now, Number.POSITIVE_INFINITY, (s) => !warmSet.has(s) && isReviewable(s))
  const dueSet = new Set(due)
  const weak = Object.values(mastery)
    .filter((m) => m && m.box <= 1 && !warmSet.has(m.skill) && !dueSet.has(m.skill) && isReviewable(m.skill))
    .sort((x, y) => x.box - y.box || (x.dueAt ?? '').localeCompare(y.dueAt ?? '') || x.skill.localeCompare(y.skill))
    .map((m) => m.skill)
  const pool = [...due, ...weak]
  const review = interleave(pool.filter(isFactSkill), pool.filter((s) => !isFactSkill(s))).slice(0, reviewN)

  return { minutes, warmup, next: safeNextNode(progress), review, game: pickGame(child, mastery, now) }
}

/** Selector that targets exactly these skills (used by daily review). */
export function selectorForSkills(skills: SkillKey[]): SkillSelector {
  return { skills: [...new Set(skills)] }
}
