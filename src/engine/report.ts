/* Informe del adulto (docs/curriculum/PLAN_DOCENTE.md §6): where the child is in the temario, what the mistakes say
   (grouped by kind, with what to do at home) and how the tests went (each prueba inicial and the recall of what was
   learnt weeks ago). Pure: reads the mastery map and the attempts (newest first), no React, no I/O. */
import type { AttemptRecord, ErrorType, MasteryMap, SkillKey, SubjectId } from '@/types'
import { currentTopic, isTopicMastered, stageOfTopic, topicProgress, type Syllabus } from '@/content/syllabus'
import { PLACEMENT_ACTIVITY, PLACEMENT_BLOCKS, PLACEMENT_COUNT, placementBlockOf } from './placement'
import { LENGUA_PLACEMENT_ACTIVITY, LENGUA_PLACEMENT_BLOCKS, LENGUA_PLACEMENT_COUNT, lenguaPlacementBlockOf } from './lengua/placement'
import { attemptsOf, masteryOf } from './subjects'

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
  /** Primary school year of the temario (1..6). */
  course: number
  /** The topic the daily session teaches now, with its stage (1-based number, trimester and world of the adventure). */
  current: { blockName: string; topicName: string; stage: { number: number; total: number; term: number; worldId?: string } | null } | null
  blocks: BlockReport[]
  mastered: number
  available: number
}

/** Where the child is in the temario: every topic with its state, and the topic the daily session works on now. */
export function syllabusReport(syllabus: Syllabus, allMastery: MasteryMap, subject: SubjectId = 'math', term?: number): SyllabusReport {
  const mastery = masteryOf(allMastery, subject)
  const now = currentTopic(syllabus, mastery, term)
  let current: SyllabusReport['current'] = null
  const blocks = syllabus.blocks.map((b): BlockReport => {
    const topics = b.topics.map((t): TopicReport => {
      const pending = t.status !== 'disponible' || t.skills.length === 0
      const seen = t.skills.some((s) => mastery[s])
      const state: TopicState = pending ? 'pendiente' : isTopicMastered(t, mastery) ? 'dominado' : seen ? 'trabajando' : 'sin-empezar'
      if (now?.id === t.id) {
        const st = stageOfTopic(syllabus, t.id)
        const stages = syllabus.stages ?? []
        current = {
          blockName: b.name,
          topicName: t.name,
          stage: st ? { number: stages.indexOf(st) + 1, total: stages.length, term: st.term, ...(st.worldId ? { worldId: st.worldId } : {}) } : null,
        }
      }
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
    course: syllabus.course,
    current,
    blocks,
    mastered: blocks.reduce((n, b) => n + b.mastered, 0),
    available: blocks.reduce((n, b) => n + b.available, 0),
  }
}

/** What the child needed in one topic over the last days: «No lo sabía» and «Necesitó otro intento». */
export interface TopicNeeds {
  /** Answers with «No lo sé» (errorType dont-know). */
  dontKnow: number
  /** Answers that took another try («Inténtalo otra vez»). */
  retried: number
}

/** Per topic of the temario, the «No lo sé» and the retried answers of the last `days` days. Topics with none are left out. */
export function topicNeeds(syllabus: Syllabus, allAttempts: readonly AttemptRecord[], now: Date, days = 30, subject: SubjectId = 'math'): Record<string, TopicNeeds> {
  const attempts = attemptsOf(allAttempts, subject)
  const topicOf = new Map<string, string>()
  for (const b of syllabus.blocks) for (const t of b.topics) for (const sk of t.skills) topicOf.set(sk, t.id)
  const t = now.getTime()
  const from = t - days * DAY_MS
  const out: Record<string, TopicNeeds> = {}
  for (const a of attempts) {
    const at = Date.parse(a.createdAt)
    if (!(at >= from && at <= t)) continue
    const id = topicOf.get(a.skill)
    if (!id) continue
    const need = out[id] ?? (out[id] = { dontKnow: 0, retried: 0 })
    if (a.errorType === 'dont-know') need.dontKnow += 1
    if ((a.retries ?? 0) > 0) need.retried += 1
  }
  return out
}

// ------------------------------------------------------------------------------------------------ errors

export type ErrorGroupId = 'tablas' | 'llevadas' | 'posicion' | 'problemas' | 'reloj' | 'fracciones-geometria' | 'despiste' | 'otros'
  | 'lengua-gramatica' | 'lengua-ortografia' | 'lengua-vocabulario' | 'lengua-lectura' | 'lengua-otros'

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
    id: 'lengua-gramatica',
    label: 'Gramática de Lengua',
    meaning: 'Confunde la clase de una palabra (sustantivo, adjetivo, verbo, artículo), el género, el número, el tiempo del verbo o el sujeto con el predicado.',
    advice: 'Leer la frase en voz alta y preguntar: ¿quién hace la acción? ¿cuándo pasa? Cambiar una palabra de género o de número y decir cómo queda.',
  },
  {
    id: 'lengua-ortografia',
    label: 'Ortografía y sílabas',
    meaning: 'Escribe mal una letra (c/qu, g/gu, r/rr, mp/mb), olvida una mayúscula o un signo, corta mal las sílabas o no marca la sílaba fuerte.',
    advice: 'Dictarle palabras en voz alta y pedirle que deletree la letra difícil. Leer en voz alta lo que escribe y buscar los signos al final de cada frase.',
  },
  {
    id: 'lengua-vocabulario',
    label: 'Vocabulario y abecedario',
    meaning: 'Confunde sinónimos, antónimos o familias de palabras, o no ordena bien las palabras del abecedario.',
    advice: 'Jugar a decir palabras que signifiquen lo mismo o lo contrario, y ordenar una lista (la compra, los nombres de la clase) por la primera letra.',
  },
  {
    id: 'lengua-lectura',
    label: 'Comprensión de textos',
    meaning: 'Responde mal a una pregunta de un texto: toma una frase que no responde, confunde el orden de lo que pasa o la idea principal.',
    advice: 'Leer el texto dos veces, la primera en voz alta. Después preguntarle: ¿qué pasó primero? ¿de qué trata el texto?',
  },
  {
    id: 'lengua-otros',
    label: 'Otros fallos de Lengua',
    meaning: 'Casillas sin escribir o fallos sin un tipo concreto.',
    advice: 'Pedirle que diga en voz alta cómo lo ha pensado: así se ve dónde se lía.',
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
  'left-right': 'fracciones-geometria',
  'word-class': 'lengua-gramatica',
  'word-form': 'lengua-gramatica',
  'sentence-part': 'lengua-gramatica',
  'spelling': 'lengua-ortografia',
  'capital': 'lengua-ortografia',
  'punctuation': 'lengua-ortografia',
  'stress': 'lengua-ortografia',
  'syllable': 'lengua-ortografia',
  'dictation': 'lengua-ortografia',
  'alphabet': 'lengua-vocabulario',
  'word-pair': 'lengua-vocabulario',
  'reading': 'lengua-lectura',
  'incomplete': 'despiste',
  'false-alarm': 'despiste',
  'remainder-too-big': 'despiste',
  'other': 'otros',
  'recognition': null, // the handwriting was misread: not a maths mistake
  'dont-know': null, // «No lo sé» in the placement test: a topic to learn, not a pattern of mistakes
}

/** In Lengua a blank answer and any other slip are not maths-like «despiste» or «otros». */
const LENGUA_OWN: Partial<Record<ErrorType, ErrorGroupId>> = { incomplete: 'lengua-otros', other: 'lengua-otros' }

/** The group of an error type of a subject; null when it is not a mistake to report (recognition, «No lo sé»). */
export function errorGroupOf(errorType: ErrorType, subject: SubjectId = 'math'): ErrorGroupId | null {
  if (subject === 'language' && errorType in LENGUA_OWN) return LENGUA_OWN[errorType] ?? null
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

/** Wrong answers of the last `days` days grouped by kind, most frequent first and «otros» last. Groups with no mistake now or before are left out.
 *  Each subject has its own groups (the Lengua ones start with `lengua-`). */
export function errorReport(allAttempts: readonly AttemptRecord[], now: Date, days = 30, subject: SubjectId = 'math'): ErrorReport {
  const attempts = attemptsOf(allAttempts, subject)
  const t = now.getTime()
  const from = t - days * DAY_MS
  const before = from - days * DAY_MS
  const groups = new Map<ErrorGroupId, { count: number; previous: number; types: Map<ErrorType, number> }>()
  let answered = 0
  let wrong = 0
  for (const a of attempts) {
    const at = Date.parse(a.createdAt)
    if (!(at >= before && at <= t)) continue
    if (a.graded === false) continue // a retry row is not a first answer: not in the answered/wrong counts
    const recent = at >= from
    if (recent && a.errorType !== 'recognition') answered += 1
    if (a.correct) continue
    const group = errorGroupOf(a.errorType ?? 'other', subject)
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
    groups: ERROR_GROUPS.filter((d) => groups.has(d.id) && d.id.startsWith('lengua-') === (subject === 'language'))
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
  blocks: { id: string; label: string; correct: number; total: number }[]
}

/** A new run starts when the session changes or after this pause. */
const RUN_GAP_MS = 2 * 60 * 60 * 1000

/** Every prueba inicial of a subject the child has done, oldest first. Attempts come newest first. */
export function placementRuns(allAttempts: readonly AttemptRecord[], subject: SubjectId = 'math'): PlacementRun[] {
  const lengua = subject === 'language'
  const activity = lengua ? LENGUA_PLACEMENT_ACTIVITY : PLACEMENT_ACTIVITY
  const count = lengua ? LENGUA_PLACEMENT_COUNT : PLACEMENT_COUNT
  const defs: { id: string; label: string }[] = lengua ? LENGUA_PLACEMENT_BLOCKS : PLACEMENT_BLOCKS
  const blockOf = (skill: SkillKey): string | null => (lengua ? lenguaPlacementBlockOf(skill) : placementBlockOf(skill))
  const items = attemptsOf(allAttempts, subject).filter((a) => a.context.activity === activity).slice().reverse()
  const runs: AttemptRecord[][] = []
  for (const a of items) {
    const run = runs[runs.length - 1]
    const last = run?.[run.length - 1]
    const sameRun = last && last.sessionId === a.sessionId && Date.parse(a.createdAt) - Date.parse(last.createdAt) < RUN_GAP_MS
      && run.length < count
    if (sameRun) run.push(a)
    else runs.push([a])
  }
  return runs.map((run) => {
    const blocks = defs.map((b) => ({ ...b, correct: 0, total: 0 }))
    for (const a of run) {
      const block = blocks.find((b) => b.id === blockOf(a.skill))
      if (!block) continue
      block.total += 1
      if (a.correct) block.correct += 1
    }
    return {
      startedAt: run[0].createdAt,
      answered: run.length,
      correct: run.filter((a) => a.correct).length,
      complete: run.length >= count,
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
export function recallReport(allAttempts: readonly AttemptRecord[], now: Date, minDays = 14, windowDays = 90): RecallReport {
  const attempts = attemptsOf(allAttempts, 'math') // maths only
  const from = now.getTime() - windowDays * DAY_MS
  const bySkill = new Map<string, AttemptRecord[]>()
  for (const a of attempts) {
    // A retry row (graded: false) is practice, not a first answer: it is neither checked nor a memory of the past.
    if (a.errorType === 'recognition' || a.graded === false) continue
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
