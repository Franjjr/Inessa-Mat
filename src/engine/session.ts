/* Review plan used by the daily review (src/world/review): what is due now and what is weak. The 15-minute session
   itself is planned in ./daily.ts (warm-up, new topic, mix, problem). */
import type { ChildProfile, MasteryMap, ProgressState, SkillKey, SkillSelector } from '@/types'
import { nextNode } from '@/content'
import { dueSkills } from './mastery'
import { masteryOf } from './subjects'
import { clamp } from './rng'
import { isFactSkill, parseSkill } from './skills'
import type { SessionPlan } from './types'

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

/** Review list for today: due skills first, then weak skills, interleaved. Used by the daily review screen. */
export function planSession(input: { child: ChildProfile; progress: ProgressState; mastery: MasteryMap; now: Date }): SessionPlan {
  const { child, progress, now } = input
  const mastery = masteryOf(input.mastery ?? {}, 'math')
  const minutes = clamp(Math.round(child.settings?.sessionMinutes ?? 15), 5, 60)
  const reviewN = clamp(Math.round(minutes * 0.5), 4, 10)

  // Review: everything due (weakest first), then weak skills not due yet; facts interleaved with operations.
  const due = dueSkills(mastery, now, Number.POSITIVE_INFINITY, (s) => isReviewable(s))
  const dueSet = new Set(due)
  const weak = Object.values(mastery)
    .filter((m) => m && m.box <= 1 && !dueSet.has(m.skill) && isReviewable(m.skill))
    .sort((x, y) => x.box - y.box || (x.dueAt ?? '').localeCompare(y.dueAt ?? '') || x.skill.localeCompare(y.skill))
    .map((m) => m.skill)
  const pool = [...due, ...weak]
  const review = interleave(pool.filter(isFactSkill), pool.filter((s) => !isFactSkill(s))).slice(0, reviewN)

  return { minutes, next: safeNextNode(progress), review }
}

/** Selector that targets exactly these skills (used by daily review). */
export function selectorForSkills(skills: SkillKey[]): SkillSelector {
  return { skills: [...new Set(skills)] }
}
