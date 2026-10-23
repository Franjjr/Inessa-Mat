/* Ready-made practice focuses a teacher can assign to a class. Each one maps to engine skill keys. */
import { addSkill, div2x1Skill, isValidSkill, lineSkill, mentalSkill, mul2x1Skill, mulSkill, placeSkill, roundSkill, selectorForSkills, subSkill } from '@/engine'
import type { SkillKey, SkillSelector } from '@/types'

export interface AssignmentPreset {
  id: string
  label: string
  skills: SkillKey[]
}

function tableSkills(table: number): SkillKey[] {
  return Array.from({ length: 10 }, (_, i) => mulSkill(table, i + 1))
}

export const ASSIGNMENT_PRESETS: AssignmentPreset[] = [
  { id: 'table-6', label: 'La tabla del 6', skills: tableSkills(6) },
  { id: 'table-7', label: 'La tabla del 7', skills: tableSkills(7) },
  { id: 'table-8', label: 'La tabla del 8', skills: tableSkills(8) },
  { id: 'tables-678', label: 'Las tablas del 6, 7 y 8', skills: [...tableSkills(6), ...tableSkills(7), ...tableSkills(8)] },
  { id: 'add-3d', label: 'Sumas de 3 cifras con llevadas', skills: [addSkill(3, 1), addSkill(3, 2)] },
  { id: 'sub-3d', label: 'Restas de 3 cifras con préstamos', skills: [subSkill(3, 1), subSkill(3, 2), subSkill(3, 0, true)] },
  { id: 'mul-2x1', label: 'Multiplicar 2 cifras por 1', skills: [mul2x1Skill(false), mul2x1Skill(true)] },
  { id: 'div-2x1', label: 'Dividir entre 1 cifra', skills: [div2x1Skill('exact'), div2x1Skill('rem')] },
  { id: 'numeros-9999', label: 'Números hasta 9 999', skills: [placeSkill('blocks'), placeSkill('expanded'), placeSkill('words'), 'num:compare', 'num:order', roundSkill(10), roundSkill(100)] },
  { id: 'recta-saltos', label: 'Recta numérica: saltos de 10, 100 y 1 000', skills: [lineSkill(10), lineSkill(100), lineSkill(1000)] },
  { id: 'calculo-mental', label: 'Cálculo mental: dobles, mitades y completar', skills: [mentalSkill('dobles'), mentalSkill('mitades'), mentalSkill('completar10'), mentalSkill('completar100'), mentalSkill('completar1000')] },
  { id: 'igualdad', label: 'Signo igual: los dos lados valen lo mismo', skills: ['eq:flex'] },
]

/** The selector for a preset, or null when the id is unknown. Invalid keys are dropped defensively. */
export function presetSelector(id: string): SkillSelector | null {
  const preset = ASSIGNMENT_PRESETS.find((p) => p.id === id)
  if (!preset) return null
  const skills = preset.skills.filter(isValidSkill)
  return skills.length ? selectorForSkills(skills) : null
}
