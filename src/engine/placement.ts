/* Prueba inicial (docs/curriculum/PLAN_DOCENTE.md §6): about 10 minutes, one item per need in each block, no hints
   and no feedback of right or wrong. Its answers go through the normal mastery update, so the plan starts where the
   child is. Pure: builds the items and summarises the attempts for the adult report. */
import type { AttemptRecord, Exercise, Rng, SkillKey } from '@/types'
import { generate } from './generate'
import { createRng, hashString, shuffle } from './rng'
import { allMulFactSkills, divSkill, parseSkill } from './skills'

/** Attempts of the placement carry this activity name in their context. */
export const PLACEMENT_ACTIVITY = 'prueba-inicial'

export type PlacementBlockId = 'numeros' | 'sumas-restas' | 'tablas' | 'dividir' | 'problemas' | 'fracciones-geometria'

export const PLACEMENT_BLOCKS: { id: PlacementBlockId; label: string }[] = [
  { id: 'numeros', label: 'Números' },
  { id: 'sumas-restas', label: 'Sumas y restas' },
  { id: 'tablas', label: 'Tablas' },
  { id: 'dividir', label: 'División' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'fracciones-geometria', label: 'Fracciones y figuras' },
]

export interface PlacementItem {
  block: PlacementBlockId
  exercise: Exercise
}

export const PLACEMENT_COUNT = 19

export function placementBlockOf(skill: SkillKey): PlacementBlockId | null {
  const p = parseSkill(skill)
  if (!p) return null
  switch (p.type) {
    case 'concept': return p.name === 'placevalue' ? 'numeros' : null
    case 'add': case 'sub': return 'sumas-restas'
    case 'mul': return 'tablas'
    case 'div': case 'div2x1': case 'div3x1': return 'dividir'
    case 'word': case 'bar': return 'problemas'
    case 'fraction': case 'geo': return 'fracciones-geometria'
    case 'place': case 'compare': case 'order': case 'round': case 'line': return 'numeros'
    default: return null
  }
}

/** The items of the placement, in order. The same child and day give the same items. */
export function buildPlacement(seed: number | string, now: Date = new Date()): PlacementItem[] {
  const rng: Rng = createRng(typeof seed === 'number' ? seed : hashString(seed))
  const facts = shuffle(rng, allMulFactSkills().filter((s) => {
    const p = parseSkill(s)
    return p?.type === 'mul' && p.a >= 2
  }))
  const divFacts = shuffle(rng, [2, 3, 4, 5, 6, 7, 8, 9].flatMap((d) => [2, 3, 4, 5, 6, 7, 8, 9].map((q) => divSkill(d * q, d))))
  const plan: { block: PlacementBlockId; skills: SkillKey[] }[] = [
    { block: 'numeros', skills: ['concept:placevalue', 'concept:placevalue', 'num:place:expanded', 'num:compare', 'num:round:10'] },
    { block: 'sumas-restas', skills: ['add:3d:c0', 'add:3d:c1', 'sub:3d:b0', 'sub:3d:b1'] },
    { block: 'tablas', skills: facts.slice(0, 4) },
    { block: 'dividir', skills: [divFacts[0], 'div:3x1:rem'] },
    { block: 'problemas', skills: ['bar:add', 'bar:sub'] },
    { block: 'fracciones-geometria', skills: ['frac:read:4', 'geo:poly:name'] },
  ]
  const out: PlacementItem[] = []
  for (const { block, skills } of plan) {
    for (const skill of skills) {
      const [exercise] = generate({ skills: [skill] }, 1, { rng: createRng(hashString(`${skill}:${rng()}`)), now })
      if (exercise) out.push({ block, exercise })
    }
  }
  return out
}

export interface PlacementSummary {
  /** Items answered in the latest placement run (at most PLACEMENT_COUNT). */
  answered: number
  correct: number
  /** True when the latest run has all its items. */
  complete: boolean
  blocks: { id: PlacementBlockId; label: string; correct: number; total: number }[]
}

/** Summary of the latest placement run from the child's attempts (newest first). */
export function summarizePlacement(attempts: readonly AttemptRecord[]): PlacementSummary {
  const run = attempts.filter((a) => a.context.activity === PLACEMENT_ACTIVITY).slice(0, PLACEMENT_COUNT)
  const blocks = PLACEMENT_BLOCKS.map((b) => ({ ...b, correct: 0, total: 0 }))
  for (const a of run) {
    const id = placementBlockOf(a.skill)
    const block = blocks.find((b) => b.id === id)
    if (!block) continue
    block.total += 1
    if (a.correct) block.correct += 1
  }
  return {
    answered: run.length,
    correct: run.filter((a) => a.correct).length,
    complete: run.length === PLACEMENT_COUNT,
    blocks,
  }
}
