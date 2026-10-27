/* Pieces shared by the temarios of every course: the topic of a times table, a pending topic, and the trimester that
   each topic takes from its stage. */
import { mulSkill } from '@/engine/skills'
import type { SkillKey } from '@/types'
import type { Syllabus, SyllabusTopic } from './model'

/** The topic's name as a title: the example in brackets goes («Descomponer (4 325 = …)» → «Descomponer»). */
export function topicTitle(topic: SyllabusTopic): string {
  return topic.name.replace(/\s*\(.*\)\s*$/, '')
}

/** Multiplication facts of one table (1..10), normalised keys (mul:AxB, A <= B). */
export function tableSkills(t: number): SkillKey[] {
  const out = new Set<SkillKey>()
  for (let n = 1; n <= 10; n++) out.add(mulSkill(t, n))
  return [...out]
}

export const tableTopic = (t: number): SyllabusTopic => ({
  id: `tabla-${t}`,
  name: `Tabla del ${t}`,
  skills: tableSkills(t),
  status: 'disponible',
  rungs: {
    concreto: `Grupos de ${t} objetos en la pantalla`,
    dibujo: `Filas de ${t} en una matriz`,
    numeros: `La tabla del ${t} escrita, con sus trucos`,
    uso: `Problemas de agrupar y repartir de a ${t}`,
  },
})

export const pending = (id: string, name: string, pendingNote: string, rungs: SyllabusTopic['rungs'] = {}): SyllabusTopic => ({
  id,
  name,
  skills: [],
  status: 'pendiente',
  rungs,
  pendingNote,
})

/** Each topic takes the trimester of its stage. */
export function withStageTerms(syllabus: Syllabus): Syllabus {
  const termOf = new Map((syllabus.stages ?? []).flatMap((st) => st.topics.map((id) => [id, st.term] as const)))
  return {
    ...syllabus,
    blocks: syllabus.blocks.map((b) => ({ ...b, topics: b.topics.map((t) => ({ ...t, term: t.term ?? termOf.get(t.id) })) })),
  }
}
