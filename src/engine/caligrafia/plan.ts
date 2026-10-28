/* The Caligrafía day plan («Caligrafía con lápiz», about 5 minutes after the Lengua session). Pure: no React, no I/O.
     Repaso      the weakest learnt item due for review (lowest box, then the oldest), ties broken by the seeded rng
     Lo nuevo    the next unlearnt items in curriculum order. A stage (a family of letters, the links, the words, the
                 sentences, the capitals) opens only when every item of the earlier stages has box >= 1.
   2 or 3 items; stop adding once the plan has 2 items and about 4 minutes; never more than one sentence and never
   more than 6 minutes. The same child, day and mastery give the same plan (the rng is seeded from the day). */
import { CAL_CURRICULUM, type CalItem, type CalKind } from '@/content/caligrafia/curriculum'
import type { MasteryMap, Rng, SkillMastery } from '@/types'
import { createRng, hashString } from '@/engine/rng'

export const CAL_MIN_ITEMS = 2
export const CAL_MAX_ITEMS = 3
/** The plan is about five minutes: it keeps adding until it reaches four, and never goes past six. */
export const CAL_TARGET_SECONDS = 240
export const CAL_MAX_SECONDS = 360

/** The time one item takes, in seconds (the estimate on the screen). */
const SECONDS: Record<CalKind, number> = { letra: 90, mayus: 90, enlace: 100, palabra: 120, frase: 150 }

export function calEstimateSeconds(item: Pick<CalItem, 'kind'>): number {
  return SECONDS[item.kind]
}

export interface CaligrafiaPlanInput {
  mastery: MasteryMap
  now: Date
  rng?: Rng
}

const stageOf = (item: CalItem) => (item.kind === 'letra' ? item.family : item.kind)

/** The index of the first item of each item's stage: the items before it are the earlier stages. */
const stageStart = (index: number): number => {
  const stage = stageOf(CAL_CURRICULUM[index])
  let i = index
  while (i > 0 && stageOf(CAL_CURRICULUM[i - 1]) === stage) i--
  return i
}

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

export function planCaligrafia(input: CaligrafiaPlanInput): CalItem[] {
  const { mastery, now } = input
  const rng = input.rng ?? createRng(hashString(`calig:${dayKey(now)}`))
  const t = now.getTime()
  const rowOf = (item: CalItem): SkillMastery | undefined => mastery[item.skill] ?? undefined
  const boxOf = (item: CalItem): number => rowOf(item)?.box ?? -1
  const isDue = (m: SkillMastery) => m.dueAt === null || Date.parse(m.dueAt) <= t

  // Repaso: learnt items that are weak (box 0 or 1) or due, the weakest first; equal ones are shuffled by the rng.
  const dueKey = (m: SkillMastery) => (m.dueAt === null ? '' : m.dueAt)
  const review = CAL_CURRICULUM
    .filter((i) => { const m = rowOf(i); return !!m && (m.box <= 1 || isDue(m)) })
    .sort((x, y) => {
      const mx = rowOf(x)!
      const my = rowOf(y)!
      return mx.box - my.box || dueKey(mx).localeCompare(dueKey(my)) || CAL_CURRICULUM.indexOf(x) - CAL_CURRICULUM.indexOf(y)
    })
  const headBox = review.length ? boxOf(review[0]) : null
  const headDue = review.length ? dueKey(rowOf(review[0])!) : null
  const ties = review.filter((i) => boxOf(i) === headBox && dueKey(rowOf(i)!) === headDue)
  const reviewHead = ties.length ? ties[Math.floor(rng() * ties.length)] : null
  const reviewOrder = reviewHead ? [reviewHead, ...review.filter((i) => i !== reviewHead)] : []

  // Lo nuevo: unseen items in order, a stage only once every item of the earlier stages has box >= 1.
  const newOrder = CAL_CURRICULUM.filter((item, index) => {
    if (rowOf(item)) return false
    return CAL_CURRICULUM.slice(0, stageStart(index)).every((earlier) => boxOf(earlier) >= 1)
  })

  const plan: CalItem[] = []
  const seconds = () => plan.reduce((sum, i) => sum + calEstimateSeconds(i), 0)
  const add = (item: CalItem): boolean => {
    if (plan.includes(item) || plan.length >= CAL_MAX_ITEMS) return false
    if (item.kind === 'frase' && plan.some((i) => i.kind === 'frase')) return false
    if (seconds() + calEstimateSeconds(item) > CAL_MAX_SECONDS) return false
    plan.push(item)
    return true
  }
  const full = () => plan.length >= CAL_MIN_ITEMS && seconds() >= CAL_TARGET_SECONDS

  if (reviewHead) add(reviewHead)
  for (const item of newOrder) {
    if (full()) break
    add(item)
  }
  for (const item of reviewOrder) {
    if (full()) break
    add(item)
  }
  return plan
}
