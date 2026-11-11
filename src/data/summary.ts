/* Dashboard aggregation (pure). Accuracy ignores 'recognition' errors: a misread digit is not a maths mistake. */
import { seasonOf } from '@/content'
import { attemptsOf, factGrid, isDivMethod, isSubMethod, isTableMethod, masteryOf, normaliseDivMethod, normaliseSubMethod, normaliseTableMethod, subjectOfSession } from '@/engine'
import type { AttemptRecord, ChildProfile, ChildSummary, DivMethod, MasteryMap, ProgressState, SessionRecord, SubMethod, TableMethod } from '@/types'

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

export function buildSummary(child: ChildProfile, progress: ProgressState | null, mastery: MasteryMap, stats: ChildStats | null): ChildSummary {
  // Only the worlds of the child's season count and order here: the island of Inglés has its own progress and is not
  // one of the maths map's worlds (the report says «de 8 cristales»).
  const worlds = progress?.worlds ?? {}
  const order = seasonOf(progress).worlds.map((w) => w.id)
  const worldsCompleted = order.filter((id) => worlds[id]?.crystal).length
  let currentWorld: string | null = null
  if (progress) {
    const lastId = progress.lastNode?.worldId
    const last = lastId && order.includes(lastId) ? lastId : undefined
    if (last && !worlds[last]?.crystal) currentWorld = last
    else currentWorld = order.find((id) => worlds[id]?.unlocked && !worlds[id]?.crystal) ?? last ?? null
  }
  const accuracy = stats && stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 1000) / 1000 : null
  const subtraction = (stats?.methods ?? []).filter((m) => isSubMethod(m.method))
  const division = (stats?.methods ?? []).filter((m) => isDivMethod(m.method))
  const tricks = (stats?.methods ?? []).filter((m) => isTableMethod(m.method))
  return {
    childId: child.id,
    nickname: child.nickname,
    companionSpecies: child.companion?.species ?? 'cat',
    worldsCompleted,
    currentWorld,
    minutesLast7Days: Math.round(stats?.minutes ?? 0),
    accuracyLast7Days: accuracy,
    factGrid: factGrid(masteryOf(mastery, 'math')),
    topErrors: stats?.topErrors ?? [],
    lastPlayedAt: stats?.lastPlayedAt ?? null,
    subtractionMethods: {
      preferred: normaliseSubMethod(child.settings?.subMethod),
      byMethod: subtraction.map((m) => ({ method: m.method as SubMethod, attempts: m.attempts, correct: m.correct })),
    },
    divisionMethods: {
      preferred: normaliseDivMethod(child.settings?.divMethod),
      byMethod: division.map((m) => ({ method: m.method as DivMethod, attempts: m.attempts, correct: m.correct })),
    },
    tableTricks: {
      preferred: normaliseTableMethod(child.settings?.tableMethod),
      byMethod: tricks.map((m) => ({ method: m.method as TableMethod, attempts: m.attempts, correct: m.correct })),
    },
  }
}

/** Stats from local rows. `attempts7` / `sessions7`: last 7 days; `attempts30`: last 30 days (for top errors). */
export function statsFromLocal(attempts7All: AttemptRecord[], attempts30All: AttemptRecord[], sessions7: SessionRecord[], lastPlayedAt: string | null): ChildStats {
  // Maths only: Lengua rows are not in these numbers.
  const attempts7 = attemptsOf(attempts7All, 'math')
  const attempts30 = attemptsOf(attempts30All, 'math')
  // Ungraded rows (a retry, see AttemptRecord.graded) are not counted in accuracy, methods or mistakes.
  const graded7 = attempts7.filter((a) => a.graded !== false)
  const counted = graded7.filter((a) => a.errorType !== 'recognition')
  const errors = new Map<string, number>()
  for (const a of attempts30) {
    // «No lo sé» is a casilla still to learn, not a mistake the child made: it is left out of the most frequent errors.
    if (a.graded === false || a.correct || !a.errorType || a.errorType === 'recognition' || a.errorType === 'dont-know') continue
    errors.set(a.errorType, (errors.get(a.errorType) ?? 0) + 1)
  }
  const topErrors = [...errors.entries()]
    .map(([errorType, count]) => ({ errorType, count }))
    .sort((a, b) => b.count - a.count || a.errorType.localeCompare(b.errorType))
    .slice(0, 5)
  const tally = new Map<string, MethodTally>()
  for (const a of attempts30) {
    const method = a.context?.method
    if (!method || a.graded === false || a.errorType === 'recognition') continue
    const t = tally.get(method) ?? { method, attempts: 0, correct: 0 }
    t.attempts += 1
    if (a.correct) t.correct += 1
    tally.set(method, t)
  }
  return {
    methods: [...tally.values()],
    attempts: counted.length,
    correct: counted.filter((a) => a.correct).length,
    // Maths minutes only: a Lengua session is not a maths session.
    minutes: sessions7.filter((s) => subjectOfSession(s) === 'math').reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
    lastPlayedAt,
    topErrors,
  }
}
