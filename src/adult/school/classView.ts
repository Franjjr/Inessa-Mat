/* Pure reading of the class screen: the totals under the class heatmap and the two lines each pupil gets (what they fail
   most, and what to review). Kept apart from ClassScreen so the sentences can be tested without the page. */
import { describeError } from '@/engine'
import type { ActivitySubject, ChildSummary, ErrorType } from '@/types'
import { formatMinutes, plural } from '../shared/format'
import { classFactState, type FactClassCount } from '../shared/heatmap'
import { readTables, reviewSentence } from '../shared/reading'

/** What the class view says in its hint: how many distinct facts half of the class or more has in each state. */
export function classSummary(counts: FactClassCount[][]): { mastered: number; struggling: number; unseen: number } {
  const out = { mastered: 0, struggling: 0, unseen: 0 }
  for (let a = 0; a < 10; a++) {
    for (let b = a; b < 10; b++) {
      const state = classFactState(counts[a][b])
      if (state === 'mastered') out.mastered++
      else if (state === 'struggling') out.struggling++
      else if (state === 'unseen') out.unseen++
    }
  }
  return out
}

/** «Falla más en: Tablas y cálculo básico (3) · Llevadas (1)», or null when there is no mistake to show. «No lo sé» is
    a casilla still to learn, not a mistake, so it never makes the list. At most two kinds. */
export function failsMostLine(topErrors: readonly { errorType: string; count: number }[]): string | null {
  const errors = topErrors.filter((e) => e.errorType !== 'dont-know').slice(0, 2)
  if (errors.length === 0) return null
  return `Falla más en: ${errors.map((e) => `${describeError(e.errorType as ErrorType)} (${e.count})`).join(' · ')}`
}

/** The pupil's review sentence without its leading space: «Para repasar: 7 × 8, 6 × 9 y 5 × 5 (y 2 más).», or that there is nothing to review. */
export function pupilReviewLine(grid: number[][], nickname: string): string {
  return reviewSentence(readTables(grid, nickname).reviewFacts).trim()
}

/** Shown under the class heatmap: a cell is «En camino» as soon as one pupil works on it, and the number says how many master it. */
export const CLASS_CELL_NOTE = 'Una casilla aparece «En camino» aunque solo la trabaje un alumno. El número de cada casilla dice cuántos la dominan.'

/** The subjects of the activity lines, in this order. */
const SUBJECT_NAME: Record<ActivitySubject, string> = { math: 'Matemáticas', language: 'Lengua', english: 'Inglés', handwriting: 'Caligrafía' }
const SUBJECT_ORDER: readonly ActivitySubject[] = ['math', 'language', 'english', 'handwriting']

type WeekOf = Pick<ChildSummary, 'minutesLast7Days' | 'weekBySubject'>

/** Whether the pupil played this week. With the activity of every subject (weekBySubject), any subject counts; without
    it only the maths minutes are known, so the answer is about maths. */
export function practisedThisWeek(c: WeekOf): boolean {
  if (!c.weekBySubject) return c.minutesLast7Days > 0
  return Object.values(c.weekBySubject).some((a) => (a?.minutes ?? 0) > 0 || (a?.attempts ?? 0) > 0)
}

/** The first sentence of «Esta semana en la clase». It only speaks of every subject when it knows every pupil's activity;
    otherwise it says «matemáticas», which is what the maths minutes tell. */
export function weekSentence(children: readonly WeekOf[]): string {
  const everySubject = children.every((c) => c.weekBySubject)
  const missing = children.filter((c) => (everySubject ? !practisedThisWeek(c) : c.minutesLast7Days <= 0)).length
  const what = everySubject ? 'practicado' : 'practicado matemáticas'
  if (missing === 0) return `Todos han ${what} esta semana.`
  return `Esta semana, ${plural(missing, 'alumno', 'alumnos')} ${missing === 1 ? 'no ha' : 'no han'} ${what}.`
}

/** A pupil's week: «Esta semana: Matemáticas 12 min · Lengua 5 min», «Sin practicar esta semana», or, when only maths is
    known, «12 min de matemáticas esta semana». A subject with answers but under a minute of play says «menos de 1 min». */
export function pupilWeekLine(c: WeekOf): string {
  if (!c.weekBySubject) return `${formatMinutes(c.minutesLast7Days)} de matemáticas esta semana`
  const parts = SUBJECT_ORDER.flatMap((subject) => {
    const a = c.weekBySubject?.[subject]
    if (!a || (a.minutes <= 0 && a.attempts <= 0)) return []
    return [`${SUBJECT_NAME[subject]} ${Math.round(a.minutes) >= 1 ? formatMinutes(a.minutes) : 'menos de 1 min'}`]
  })
  return parts.length ? `Esta semana: ${parts.join(' · ')}` : 'Sin practicar esta semana'
}

/** «Lía», «Lía y Noa», «Lía, Noa y Leo», «Lía, Noa, Leo y 2 más». */
function names(list: readonly string[], max = 3): string {
  if (list.length <= max) return list.length > 1 ? `${list.slice(0, -1).join(', ')} y ${list.at(-1)}` : (list[0] ?? '')
  return `${list.slice(0, max).join(', ')} y ${list.length - max} más`
}

/** The tracking line of a mission: «Hecha por 2 de 3 alumnos · Faltan: Noa». A pupil has done it with `doneAt` graded
    answers on its skills in its period. Null without tracking (a server without migration 0006) or without pupils. */
export function missionLine(
  progress: ReadonlyMap<string, { attempts: number }> | null | undefined,
  pupils: readonly Pick<ChildSummary, 'childId' | 'nickname'>[],
  doneAt: number,
): string | null {
  if (!progress || pupils.length === 0) return null
  const missing = pupils.filter((p) => (progress.get(p.childId)?.attempts ?? 0) < doneAt).map((p) => p.nickname)
  const done = pupils.length - missing.length
  const head = `Hecha por ${done} de ${plural(pupils.length, 'alumno', 'alumnos')}`
  if (missing.length === 0) return `${head}. ¡Toda la clase!`
  return `${head} · Faltan: ${names(missing)}`
}
