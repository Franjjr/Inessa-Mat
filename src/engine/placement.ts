/* Prueba inicial (docs/curriculum/PLAN_DOCENTE.md §6): about 10 minutes, one item per need in each block, no hints
   and no feedback of right or wrong. Its answers go through the normal mastery update, so the plan starts where the
   child is. Pure: builds the items and summarises the attempts for the adult report. */
import type { AttemptRecord, Exercise, Rng, SkillKey } from '@/types'
import { generate } from './generate'
import { createRng, hashString, shuffle } from './rng'
import { allMulFactSkills, divSkill, mulSkill, parseSkill } from './skills'

/** Attempts of the placement carry this activity name in their context. */
export const PLACEMENT_ACTIVITY = 'prueba-inicial'

export type PlacementBlockId = 'numeros' | 'sumas-restas' | 'tablas' | 'dividir' | 'problemas' | 'tiempo' | 'fracciones-geometria' | 'dinero-medida'

export const PLACEMENT_BLOCKS: { id: PlacementBlockId; label: string }[] = [
  { id: 'numeros', label: 'Números' },
  { id: 'sumas-restas', label: 'Sumas y restas' },
  { id: 'tablas', label: 'Tablas y multiplicar' },
  { id: 'dividir', label: 'División' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'tiempo', label: 'Tiempo' },
  { id: 'fracciones-geometria', label: 'Fracciones y figuras' },
  { id: 'dinero-medida', label: 'Dinero y medida' },
]

export interface PlacementItem {
  block: PlacementBlockId
  exercise: Exercise
}

export const PLACEMENT_COUNT = 20

export function placementBlockOf(skill: SkillKey): PlacementBlockId | null {
  const p = parseSkill(skill)
  if (!p) return null
  switch (p.type) {
    case 'concept': return p.name === 'placevalue' ? 'numeros' : null
    case 'add': case 'sub': return 'sumas-restas'
    case 'mul': return 'tablas'
    case 'div': case 'div2x1': case 'div3x1': case 'div4x1': case 'div3x2': return 'dividir'
    case 'mul3x1': case 'mulParts': return 'tablas'
    case 'word': case 'bar': return 'problemas'
    case 'clock-read': case 'clock-set': case 'clock-convert': case 'time-duration': case 'calendar': return 'tiempo'
    case 'fraction': case 'geo': case 'position': return 'fracciones-geometria'
    case 'money': case 'measure': return 'dinero-medida'
    case 'place': case 'compare': case 'order': case 'round': case 'line': case 'skip': return 'numeros'
    case 'mental': return p.family === 'romanos' ? 'numeros' : null
    default: return null
  }
}

/** The 2.º placement: numbers up to 999, sums and subtractions of 2 and 3 digits, the first tables, whole euros. */
function grade2Plan(rng: Rng): { block: PlacementBlockId; skills: SkillKey[] }[] {
  const facts = shuffle(rng, [2, 5, 10].flatMap((t) => [2, 3, 4, 5, 6, 7, 8, 9].map((n) => mulSkill(t, n))))
  return [
    { block: 'numeros', skills: ['num:place:blocks:999', 'num:place:expanded:999', 'num:place:words:999', 'num:compare:999', 'skip:5'] },
    { block: 'sumas-restas', skills: ['add:2d:c0', 'add:2d:c1', 'sub:2d:b0', 'sub:2d:b1', 'add:3d:c0'] },
    { block: 'tablas', skills: facts.slice(0, 3) },
    { block: 'problemas', skills: ['bar:add', 'bar:sub'] },
    { block: 'tiempo', skills: ['clock:read:30', 'cal:weekday'] },
    { block: 'fracciones-geometria', skills: ['geo:poly:name'] },
    { block: 'dinero-medida', skills: ['money:recognise', 'money:pay:e'] },
  ]
}

/** The 4.º placement: millares and romanos, 4-digit sums, hard tables and multiplying by two digits, dividing 4 digits. */
function grade4Plan(rng: Rng): { block: PlacementBlockId; skills: SkillKey[] }[] {
  const facts = shuffle(rng, [6, 7, 8, 9].flatMap((t) => [6, 7, 8, 9].map((n) => mulSkill(t, n))))
  return [
    { block: 'numeros', skills: ['num:place:words', 'num:compare', 'num:round:1000', 'mental:romanos', 'num:line:1000'] },
    { block: 'sumas-restas', skills: ['add:4d:c2', 'sub:4d:b2', 'sub:4d:z'] },
    { block: 'tablas', skills: [...facts.slice(0, 2), 'mul:3x1:c1', 'mul:2dx2d'] },
    { block: 'dividir', skills: ['div:3x1:rem', 'div:4x1:exact'] },
    { block: 'problemas', skills: ['bar:two', 'bar:div'] },
    { block: 'tiempo', skills: ['clock:read:5'] },
    { block: 'fracciones-geometria', skills: ['frac:of:4', 'geo:area'] },
    { block: 'dinero-medida', skills: ['money:change'] },
  ]
}

/** The items of the placement, in order. The same child and day give the same items. `grade` 1–2 takes the 2.º one,
    4–6 the 4.º one, and 3 (or no course) the 3.º one. */
export function buildPlacement(seed: number | string, now: Date = new Date(), grade?: number): PlacementItem[] {
  const rng: Rng = createRng(typeof seed === 'number' ? seed : hashString(seed))
  if (grade !== undefined && grade <= 2) return itemsOf(grade2Plan(rng), rng, now)
  if (grade !== undefined && grade >= 4) return itemsOf(grade4Plan(rng), rng, now)
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
    { block: 'tiempo', skills: ['clock:read:15'] },
    { block: 'fracciones-geometria', skills: ['frac:read:4'] },
    { block: 'dinero-medida', skills: ['money:pay'] },
  ]
  return itemsOf(plan, rng, now)
}

function itemsOf(plan: { block: PlacementBlockId; skills: SkillKey[] }[], rng: Rng, now: Date): PlacementItem[] {
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
