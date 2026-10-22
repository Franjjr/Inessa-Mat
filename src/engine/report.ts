/* Informe del adulto (docs/curriculum/PLAN_DOCENTE.md §6): where the child is in the temario, what the mistakes say
   (grouped by kind, with what to do at home) and how the tests went (each prueba inicial and the recall of what was
   learnt weeks ago). Pure: reads the mastery map and the attempts (newest first), no React, no I/O. */
import type { AttemptRecord, ErrorType, MasteryMap } from '@/types'
import { currentTopic, isTopicMastered, topicProgress, type Syllabus } from '@/content/syllabus'
import { PLACEMENT_ACTIVITY, PLACEMENT_BLOCKS, PLACEMENT_COUNT, placementBlockOf, type PlacementBlockId } from './placement'

const DAY_MS = 24 * 60 * 60 * 1000

// ------------------------------------------------------------------------------------------------ temario

export type TopicState = 'dominado' | 'trabajando' | 'sin-empezar' | 'pendiente'

export interface TopicReport {
  id: string
  name: string
  state: TopicState
  /** Share of the topic's skills mastered, 0..1. */
  progress: number
  current: boolean
}

export interface BlockReport {
  id: string
  name: string
  topics: TopicReport[]
  /** Topics that can be practised now (pending ones do not count). */
  available: number
  mastered: number
}

export interface SyllabusReport {
  current: { blockName: string; topicName: string } | null
  blocks: BlockReport[]
  mastered: number
  available: number
}

/** Where the child is in the temario: every topic with its state, and the topic the daily session works on now. */
export function syllabusReport(syllabus: Syllabus, mastery: MasteryMap, term?: number): SyllabusReport {
  const now = currentTopic(syllabus, mastery, term)
  let current: SyllabusReport['current'] = null
  const blocks = syllabus.blocks.map((b): BlockReport => {
    const topics = b.topics.map((t): TopicReport => {
      const pending = t.status !== 'disponible' || t.skills.length === 0
      const seen = t.skills.some((s) => mastery[s])
      const state: TopicState = pending ? 'pendiente' : isTopicMastered(t, mastery) ? 'dominado' : seen ? 'trabajando' : 'sin-empezar'
      if (now?.id === t.id) current = { blockName: b.name, topicName: t.name }
      return { id: t.id, name: t.name, state, progress: pending ? 0 : topicProgress(t, mastery), current: now?.id === t.id }
    })
    return {
      id: b.id,
      name: b.name,
      topics,
      available: topics.filter((t) => t.state !== 'pendiente').length,
      mastered: topics.filter((t) => t.state === 'dominado').length,
    }
  })
  return {
    current,
    blocks,
    mastered: blocks.reduce((n, b) => n + b.mastered, 0),
    available: blocks.reduce((n, b) => n + b.available, 0),
  }
}

// ------------------------------------------------------------------------------------------------ errors

export type ErrorGroupId = 'tablas' | 'llevadas' | 'posicion' | 'problemas' | 'reloj' | 'fracciones-geometria' | 'despiste' | 'otros'

/** The kinds of mistake of the plan (§6), each with what it means and what helps at home. */
export const ERROR_GROUPS: { id: ErrorGroupId; label: string; meaning: string; advice: string }[] = [
  {
    id: 'tablas',
    label: 'Tablas y cálculo básico',
    meaning: 'Falla un resultado de la tabla o una suma o resta de una cifra dentro de una cuenta.',
    advice: 'Repasar un rato esas tablas, pocas cada día. Decirlas en voz alta en el coche o paseando también ayuda.',
  },
  {
    id: 'llevadas',
    label: 'Llevadas y préstamos',
    meaning: 'Se le olvida la llevada, pide prestado mal o se lía con los ceros al restar.',
    advice: 'Hacer alguna cuenta en papel diciendo en voz alta cada paso: «me llevo una», «le pido a la vecina».',
  },
  {
    id: 'posicion',
    label: 'Valor de posición',
    meaning: 'Coloca una cifra en una columna que no le toca (unidades, decenas, centenas).',
    advice: 'Escribir números con su nombre de columna (U, D, C, UM) y contar con billetes de 1, 10 y 100.',
  },
  {
    id: 'problemas',
    label: 'Leer el problema',
    meaning: 'Elige una operación que no toca o se equivoca en el primer paso de un problema.',
    advice: 'Antes de calcular, pedirle que cuente el problema con sus palabras y diga qué se busca.',
  },
  {
    id: 'reloj',
    label: 'Reloj',
    meaning: 'Confunde la aguja de las horas con la de los minutos, o la mañana con la tarde.',
    advice: 'Preguntarle la hora en un reloj de agujas de casa varias veces al día.',
  },
  {
    id: 'fracciones-geometria',
    label: 'Fracciones y figuras',
    meaning: 'Toma por iguales partes que no lo son, cuenta mal las partes o confunde una figura con otra.',
    advice: 'Partir una pizza o una hoja en partes iguales, y buscar figuras y ángulos rectos por casa.',
  },
  {
    id: 'despiste',
    label: 'Despistes',
    meaning: 'Deja casillas sin completar, se pasa con el resto de la división o ve un error donde no lo hay.',
    advice: 'Repasar la cuenta antes de darla por terminada.',
  },
  {
    id: 'otros',
    label: 'Otros fallos',
    meaning: 'Fallos sin un tipo concreto (por ejemplo, en dinero, medidas o la prueba inicial).',
    advice: 'Pedirle que cuente en voz alta cómo lo ha pensado: así se ve dónde se lía.',
  },
]

const GROUP_OF: Record<ErrorType, ErrorGroupId | null> = {
  'fact': 'tablas',
  'quotient-off': 'tablas',
  'carry-forgot': 'llevadas',
  'carry-wrong': 'llevadas',
  'borrow-forgot': 'llevadas',
  'smaller-from-larger': 'llevadas',
  'zero-borrow': 'llevadas',
  'misaligned': 'posicion',
  'place-value': 'posicion',
  'operation': 'problemas',
  'bar-placement': 'problemas',
  'step': 'problemas',
  'clock-hour': 'reloj',
  'clock-minute': 'reloj',
  'clock-period': 'reloj',
  'fraction-parts': 'fracciones-geometria',
  'fraction-count': 'fracciones-geometria',
  'geo-name': 'fracciones-geometria',
  'geo-perimeter': 'fracciones-geometria',
  'incomplete': 'despiste',
  'false-alarm': 'despiste',
  'remainder-too-big': 'despiste',
  'other': 'otros',
  'recognition': null, // the handwriting was misread: not a maths mistake
}

/** The group of an error type; null when it is not a maths mistake (recognition). */
export function errorGroupOf(errorType: ErrorType): ErrorGroupId | null {
  return errorType in GROUP_OF ? GROUP_OF[errorType] : 'otros'
}

export interface ErrorGroupReport {
  id: ErrorGroupId
  label: string
  meaning: string
  advice: string
  /** Mistakes in the last `days` days. */
  count: number
  /** Mistakes in the `days` days before that (to say whether it is going down). */
  previous: number
  /** The most frequent error types inside the group, most frequent first. */
  types: { errorType: ErrorType; count: number }[]
}

export interface ErrorReport {
  days: number
  /** Answered items in the window (placement included), to put the mistakes in proportion. */
  answered: number
  wrong: number
  groups: ErrorGroupReport[]
}

/** Wrong answers of the last `days` days grouped by kind, most frequent first and «otros» last. Groups with no mistake now or before are left out. */
export function errorReport(attempts: readonly AttemptRecord[], now: Date, days = 30): ErrorReport {
  const t = now.getTime()
  const from = t - days * DAY_MS
  const before = from - days * DAY_MS
  const groups = new Map<ErrorGroupId, { count: number; previous: number; types: Map<ErrorType, number> }>()
  let answered = 0
  let wrong = 0
  for (const a of attempts) {
    const at = Date.parse(a.createdAt)
    if (!(at >= before && at <= t)) continue
    const recent = at >= from
    if (recent && a.errorType !== 'recognition') answered += 1
    if (a.correct) continue
    const group = errorGroupOf(a.errorType ?? 'other')
    if (!group) continue
    const g = groups.get(group) ?? { count: 0, previous: 0, types: new Map() }
    if (recent) {
      wrong += 1
      g.count += 1
      const type = a.errorType ?? 'other'
      g.types.set(type, (g.types.get(type) ?? 0) + 1)
    } else {
      g.previous += 1
    }
    groups.set(group, g)
  }
  return {
    days,
    answered,
    wrong,
    groups: ERROR_GROUPS.filter((d) => groups.has(d.id))
      .map((d) => {
        const g = groups.get(d.id)!
        const types = [...g.types].map(([errorType, count]) => ({ errorType, count })).sort((x, y) => y.count - x.count || x.errorType.localeCompare(y.errorType))
        return { ...d, count: g.count, previous: g.previous, types }
      })
      .sort((x, y) => Number(x.id === 'otros') - Number(y.id === 'otros') || y.count - x.count || y.previous - x.previous),
  }
}

// ------------------------------------------------------------------------------------------------ tests

export interface PlacementRun {
  /** When the run started. */
  startedAt: string
  answered: number
  correct: number
  complete: boolean
  blocks: { id: PlacementBlockId; label: string; correct: number; total: number }[]
}

/** A new run starts when the session changes or after this pause. */
const RUN_GAP_MS = 2 * 60 * 60 * 1000

/** Every prueba inicial the child has done, oldest first. Attempts come newest first. */
export function placementRuns(attempts: readonly AttemptRecord[]): PlacementRun[] {
  const items = attempts.filter((a) => a.context.activity === PLACEMENT_ACTIVITY).slice().reverse()
  const runs: AttemptRecord[][] = []
  for (const a of items) {
    const run = runs[runs.length - 1]
    const last = run?.[run.length - 1]
    const sameRun = last && last.sessionId === a.sessionId && Date.parse(a.createdAt) - Date.parse(last.createdAt) < RUN_GAP_MS
      && run.length < PLACEMENT_COUNT
    if (sameRun) run.push(a)
    else runs.push([a])
  }
  return runs.map((run) => {
    const blocks = PLACEMENT_BLOCKS.map((b) => ({ ...b, correct: 0, total: 0 }))
    for (const a of run) {
      const block = blocks.find((b) => b.id === placementBlockOf(a.skill))
      if (!block) continue
      block.total += 1
      if (a.correct) block.correct += 1
    }
    return {
      startedAt: run[0].createdAt,
      answered: run.length,
      correct: run.filter((a) => a.correct).length,
      complete: run.length >= PLACEMENT_COUNT,
      blocks,
    }
  })
}

export interface RecallReport {
  /** Gap that makes an answer a recall check. */
  minDays: number
  /** Answers that came back after the gap, on skills that were right the time before. */
  checked: number
  remembered: number
}

/**
 * Prueba de recuerdo: of what the child answered right, how much is still right when it comes back two weeks or more
 * later. Only the skill's first answer after the gap counts (the review that follows is practice, not memory).
 */
export function recallReport(attempts: readonly AttemptRecord[], now: Date, minDays = 14, windowDays = 90): RecallReport {
  const from = now.getTime() - windowDays * DAY_MS
  const bySkill = new Map<string, AttemptRecord[]>()
  for (const a of attempts) {
    if (a.errorType === 'recognition') continue
    const list = bySkill.get(a.skill) ?? []
    list.push(a)
    bySkill.set(a.skill, list)
  }
  let checked = 0
  let remembered = 0
  for (const list of bySkill.values()) {
    // newest first: list[i] came after list[i + 1]
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i]
      const prev = list[i + 1]
      if (Date.parse(a.createdAt) < from) break
      if (!prev.correct || Date.parse(a.createdAt) - Date.parse(prev.createdAt) < minDays * DAY_MS) continue
      checked += 1
      if (a.correct && a.hintsUsed === 0) remembered += 1
    }
  }
  return { minDays, checked, remembered }
}
