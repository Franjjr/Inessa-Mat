/* Daily session runner logic (pure): the run order of the plan, the re-asks of failed items, the time-box and the
   reward key. The screen (DailySession.tsx) only renders what this file decides. */
import { DAILY_MINUTES, type DailyItem, type DailyPlan } from '@/engine'
import { startQueue, requeueWrong, type RunQueue } from '@/activities/shared/requeue'

/** One planned item of the run, with an id unique inside the run (the same exercise id can come twice). */
export interface RunItem {
  uid: string
  item: DailyItem
}

export const SESSION_LIMIT_SECONDS = DAILY_MINUTES * 60
/** Stars given once per day for finishing the session (not per correct answer). */
export const SESSION_STARS = 3

export function flattenPlan(plan: DailyPlan): RunItem[] {
  return plan.blocks.flatMap((b) => b.items).map((item, i) => ({ uid: `${i}:${item.exercise.id}`, item }))
}

export function startRun(plan: DailyPlan): RunQueue<RunItem> {
  return startQueue(flattenPlan(plan))
}

/** The queue after a wrong first answer: the same item comes back 2–4 items later (at most once, a few per run). */
export function afterAnswer(q: RunQueue<RunItem>, pos: number, correct: boolean): RunQueue<RunItem> {
  if (correct) return q
  return requeueWrong(q, pos, (r) => r.uid) ?? q
}

/** The day key for the once-per-day reward. */
export function sessionRewardKey(now: Date): string {
  return `sesion:${now.toISOString().slice(0, 10)}`
}

export function isTimeUp(activeSeconds: number): boolean {
  return activeSeconds >= SESSION_LIMIT_SECONDS
}

/** Result of the run for the closing screen: planned items only (re-asks are practice, not graded). */
export interface RunSummary {
  answered: number
  correct: number
  total: number
  /** The session ended because the child finished the items (not because time ran out). */
  finished: boolean
}

export function summarizeRun(q: RunQueue<RunItem>, results: readonly { uid: string; correct: boolean }[], finished: boolean): RunSummary {
  const planned = q.slots.filter((s) => !s.retry).length
  const correct = results.filter((r) => r.correct).length
  return { answered: results.length, correct, total: planned, finished }
}
