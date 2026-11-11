/* Daily session runner logic (pure): the run order of the plan, the re-asks of failed items, the time-box and the
   reward key. The screen (DailySession.tsx) only renders what this file decides. */
import { DAILY_MINUTES, ENGLISH_SESSION_MINUTES, EXAMPLE_SECONDS, estimateSeconds,type DailyBlockId, type DailyItem, type DailyPlan, type LessonSubject } from '@/engine'
import { startQueue, requeueWrong, type RunQueue } from '@/activities/shared/requeue'

/** One planned item of the run, with an id unique inside the run (the same exercise id can come twice). */
export interface RunItem {
  uid: string
  item: DailyItem
  /** Set when the child said «Ahora no»: the item went to the end, and comes back at the end each time it is said again. */
  postponed?: true
}

export const SESSION_LIMIT_SECONDS = DAILY_MINUTES * 60
/** The time-box of each subject's session: fifteen minutes for maths and Lengua, ten for English. */
export const SUBJECT_LIMIT_SECONDS: Record<LessonSubject, number> = {
  math: DAILY_MINUTES * 60, language: DAILY_MINUTES * 60, english: ENGLISH_SESSION_MINUTES * 60,
}
/** Stars given once per day for finishing the session (not per correct answer). */
export const SESSION_STARS = 3

/** The intro's block titles and the plan block each one is. */
const BLOCK_OF_TITLE: Record<string, DailyBlockId> = { Calentamiento: 'warmup', 'Lo nuevo': 'new', Mezcla: 'mix', Problema: 'problem', Lectura: 'story' }

/** The time text of an intro block («5 min · con un ejemplo») with the minutes this plan really takes, by the planner's own
    estimate per item. A block the plan leaves empty keeps its text. */
export function blockTimeText(plan: DailyPlan, title: string, text: string): string {
  const block = plan.blocks.find((b) => b.id === BLOCK_OF_TITLE[title])
  if (!block || block.items.length === 0) return text
  const example = block.id === 'new' && plan.example ? EXAMPLE_SECONDS : 0
  const seconds = block.items.reduce((sum, item) => sum + estimateSeconds(item), example)
  return text.replace(/^\d+ min/, `${Math.max(1, Math.round(seconds / 60))} min`)
}

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

/** «Ahora no» at most this many times in one run: a child cannot skip the practice and still close it with the stars. */
export const MAX_POSTPONES = 3

/** Whether «Ahora no» is offered for the slot at `pos`: each item only once (a postponed item that comes back is answered),
    and at most MAX_POSTPONES in the run (`used` is how many the run has already had). */
export function canPostpone(q: RunQueue<RunItem>, pos: number, used: number): boolean {
  const slot = q.slots[pos]
  return !!slot && !slot.item.postponed && used < MAX_POSTPONES
}

/**
 * «Ahora no»: the slot at `pos` goes to the end of the run, marked postponed, and comes back later to be answered (once
 * per item, see canPostpone). Only when it is the last slot left is it dropped, so the run ends. Nothing is reported: a
 * postponed item is not an attempt and is not counted as wrong.
 */
export function postpone(q: RunQueue<RunItem>, pos: number): RunQueue<RunItem> {
  const slot = q.slots[pos]
  if (!slot) return q
  const rest = q.slots.filter((_, i) => i !== pos)
  if (rest.length === 0) return { ...q, slots: rest }
  return { ...q, slots: [...rest, { item: { ...slot.item, postponed: true }, retry: slot.retry }] }
}

/** The day keys of each subject. Maths keeps its original keys; Lengua and English have their own. */
const REWARD_KEY: Record<LessonSubject, string> = { math: 'sesion', language: 'sesion-lengua', english: 'sesion-ingles' }
const DONE_KEY: Record<LessonSubject, string> = { math: 'sesion-hecha', language: 'sesion-hecha-lengua', english: 'sesion-hecha-ingles' }

/** The day key for the once-per-day reward. */
export function sessionRewardKey(now: Date, subject: LessonSubject = 'math'): string {
  return `${REWARD_KEY[subject]}:${now.toISOString().slice(0, 10)}`
}

/** The day marker of a session that had answers, finished or cut by the time: the home moves on to the next subject
    (it is not the stars key, which only a finished run earns). */
export function sessionDoneKey(now: Date, subject: LessonSubject = 'math'): string {
  return `${DONE_KEY[subject]}:${now.toISOString().slice(0, 10)}`
}

/** Caligrafía con lápiz: stars once a day for the first finish, on their own key (never the Lengua session stars). */
export const CALIG_STARS = 2

export function caligrafiaRewardKey(now: Date): string {
  return `sesion-caligrafia:${now.toISOString().slice(0, 10)}`
}

export function isTimeUp(activeSeconds: number, limitSeconds: number = SESSION_LIMIT_SECONDS): boolean {
  return activeSeconds >= limitSeconds
}

/** Result of the run for the closing screen: planned items only (re-asks are practice, not graded). */
export interface RunSummary {
  answered: number
  correct: number
  total: number
  /** The session ended because the child finished the items (not because time ran out). */
  finished: boolean
}

/**
 * The stars of the session (once a day): the child has practised, not just opened it. Right or wrong answers count; items
 * skipped with «Ahora no» do not. Ending by the time counts the same as finishing, if at least half of the planned items
 * were answered. A session with no planned graded item (speaking only) needs one answer.
 */
export function earnsStars(summary: RunSummary): boolean {
  if (summary.total === 0) return summary.answered > 0
  return summary.answered * 2 >= summary.total
}

/** «Ahora dilo tú» (eng-speak) is not graded: its stars are a pronunciation result, not an answer to be right or wrong. It is
    still an answer for the run (a session with only that item is done, not «no has llegado a contestar ninguno»). */
const isGraded = (kind: string) => kind !== 'eng-speak'

export function summarizeRun(q: RunQueue<RunItem>, results: readonly { uid: string; correct: boolean }[], finished: boolean): RunSummary {
  const kindOf = new Map(q.slots.map((s) => [s.item.uid, s.item.item.exercise.kind]))
  const graded = results.filter((r) => isGraded(kindOf.get(r.uid) ?? ''))
  const planned = q.slots.filter((s) => !s.retry && isGraded(s.item.item.exercise.kind)).length
  const correct = graded.filter((r) => r.correct).length
  return { answered: results.length, correct, total: planned, finished }
}

/** The table whose song is offered at the end: each missed multiplication fact counts for both factors (when they are
 *  among `tables`); the most counted wins, a tie goes to the larger table. null when no fact was missed. */
export function missedTable(q: RunQueue<RunItem>, results: readonly { uid: string; correct: boolean }[], tables: number[]): number | null {
  const byUid = new Map(q.slots.map((s) => [s.item.uid, s.item.item.exercise]))
  const count = new Map<number, number>()
  for (const r of results) {
    if (r.correct) continue
    const ex = byUid.get(r.uid)
    if (!ex || ex.kind !== 'fact-mul') continue
    for (const t of new Set([ex.a, ex.b])) if (tables.includes(t)) count.set(t, (count.get(t) ?? 0) + 1)
  }
  let best: number | null = null
  for (const [t, c] of count) {
    if (best === null || c > count.get(best)! || (c === count.get(best)! && t > best)) best = t
  }
  return best
}
