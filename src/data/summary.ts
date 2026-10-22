/* Dashboard aggregation (pure). Accuracy ignores 'recognition' errors: a misread digit is not a maths mistake. */
import { season1 } from '@/content'
import { factGrid, isSubMethod, normaliseSubMethod } from '@/engine'
import type { AttemptRecord, ChildProfile, ChildSummary, MasteryMap, ProgressState, SessionRecord, SubMethod } from '@/types'

/** Results per method (context.method of the attempt), last 30 days, recognition errors left out. */
export interface MethodTally {
  method: string
  attempts: number
  correct: number
}

export interface ChildStats {
  attempts: number
  correct: number
  minutes: number
  lastPlayedAt: string | null
  topErrors: { errorType: string; count: number }[]
  methods?: MethodTally[]
}

function naturalWorldOrder(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

export function buildSummary(child: ChildProfile, progress: ProgressState | null, mastery: MasteryMap, stats: ChildStats | null): ChildSummary {
  const worlds = progress?.worlds ?? {}
  const seasonOrder = season1.worlds.map((w) => w.id)
  const order = seasonOrder.length ? [...seasonOrder, ...naturalWorldOrder(Object.keys(worlds).filter((id) => !seasonOrder.includes(id)))] : naturalWorldOrder(Object.keys(worlds))
  const worldsCompleted = Object.values(worlds).filter((w) => w?.crystal).length
  let currentWorld: string | null = null
  if (progress) {
    const last = progress.lastNode?.worldId
    if (last && !worlds[last]?.crystal) currentWorld = last
    else currentWorld = order.find((id) => worlds[id]?.unlocked && !worlds[id]?.crystal) ?? last ?? null
  }
  const accuracy = stats && stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 1000) / 1000 : null
  const subtraction = (stats?.methods ?? []).filter((m) => isSubMethod(m.method))
  return {
    childId: child.id,
    nickname: child.nickname,
    companionSpecies: child.companion?.species ?? 'cat',
    worldsCompleted,
    currentWorld,
    minutesLast7Days: Math.round(stats?.minutes ?? 0),
    accuracyLast7Days: accuracy,
    factGrid: factGrid(mastery),
    topErrors: stats?.topErrors ?? [],
    lastPlayedAt: stats?.lastPlayedAt ?? null,
    subtractionMethods: {
      preferred: normaliseSubMethod(child.settings?.subMethod),
      byMethod: subtraction.map((m) => ({ method: m.method as SubMethod, attempts: m.attempts, correct: m.correct })),
    },
  }
}

/** Stats from local rows. `attempts7` / `sessions7`: last 7 days; `attempts30`: last 30 days (for top errors). */
export function statsFromLocal(attempts7: AttemptRecord[], attempts30: AttemptRecord[], sessions7: SessionRecord[], lastPlayedAt: string | null): ChildStats {
  const counted = attempts7.filter((a) => a.errorType !== 'recognition')
  const errors = new Map<string, number>()
  for (const a of attempts30) {
    if (a.correct || !a.errorType || a.errorType === 'recognition') continue
    errors.set(a.errorType, (errors.get(a.errorType) ?? 0) + 1)
  }
  const topErrors = [...errors.entries()]
    .map(([errorType, count]) => ({ errorType, count }))
    .sort((a, b) => b.count - a.count || a.errorType.localeCompare(b.errorType))
    .slice(0, 5)
  const tally = new Map<string, MethodTally>()
  for (const a of attempts30) {
    const method = a.context?.method
    if (!method || a.errorType === 'recognition') continue
    const t = tally.get(method) ?? { method, attempts: 0, correct: 0 }
    t.attempts += 1
    if (a.correct) t.correct += 1
    tally.set(method, t)
  }
  return {
    methods: [...tally.values()],
    attempts: counted.length,
    correct: counted.filter((a) => a.correct).length,
    minutes: sessions7.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
    lastPlayedAt,
    topErrors,
  }
}
