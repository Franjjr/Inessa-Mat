/* How maths goes week by week, for the grown-ups: the answers, the accuracy and the days played in each of the last weeks,
   read from the attempts on this device. Pure: no React, no I/O. Ungraded retry rows and recognition slips do not count. */
import { attemptsOf } from '@/engine'
import type { AttemptRecord } from '@/types'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface WeekTrend {
  /** 0 = the last seven days, 1 = the seven before, and so on (newest first). */
  weeksAgo: number
  answered: number
  correct: number
  /** Distinct calendar days with at least one answer in the week. */
  days: number
}

/** The last `weeks` weeks of maths, newest first. Weeks with no answers are kept, so the gaps show. */
export function weeklyTrend(allAttempts: readonly AttemptRecord[], now: Date, weeks = 8): WeekTrend[] {
  const out: WeekTrend[] = Array.from({ length: weeks }, (_, weeksAgo) => ({ weeksAgo, answered: 0, correct: 0, days: 0 }))
  const dayKeys = Array.from({ length: weeks }, () => new Set<string>())
  const t = now.getTime()
  for (const a of attemptsOf(allAttempts, 'math')) {
    if (a.graded === false || a.errorType === 'recognition') continue
    const at = Date.parse(a.createdAt)
    if (Number.isNaN(at) || at > t) continue
    const weeksAgo = Math.floor((t - at) / WEEK_MS)
    if (weeksAgo >= weeks) continue
    out[weeksAgo].answered += 1
    if (a.correct) out[weeksAgo].correct += 1
    dayKeys[weeksAgo].add(new Date(at).toDateString())
  }
  return out.map((w, i) => ({ ...w, days: dayKeys[i].size }))
}
