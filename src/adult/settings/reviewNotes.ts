/* Text for the adult's list of answers marked wrong (src/data/review.ts). Pure functions, easy to test. */
import { describeSkill } from '@/engine'
import type { InputMode } from '@/types'
import type { WrongAnswerNote } from '@/data'

const INPUT_LABEL: Record<InputMode, string> = {
  pen: 'a mano',
  touch: 'tocando',
  keyboard: 'con teclado',
  keypad: 'con el teclado numérico',
  tap: 'tocando una opción',
}

/** "Tabla 7 × 8" for the times tables, the adult description of the skill for the rest. */
export function wrongAnswerSkill(skill: string): string {
  const text = describeSkill(skill as Parameters<typeof describeSkill>[0])
  return skill.startsWith('mul:') ? `Tabla ${text}` : text
}

/** One line per note, as an adult reads it: «Tabla 7 × 8 · escribió 54 · se esperaba 56 · a mano · 11 nov». */
export function formatWrongAnswer(note: WrongAnswerNote): string {
  const given = note.given ? `escribió ${note.given}` : 'no respondió'
  const expected = note.expected || '—'
  const when = new Date(note.at)
  const date = Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return [wrongAnswerSkill(note.skill), given, `se esperaba ${expected}`, INPUT_LABEL[note.inputMode] ?? '', date]
    .filter(Boolean)
    .join(' · ')
}

/** The file the adult downloads: the notes as they are (no names, no child ids: the log has none). */
export function wrongAnswerExport(notes: WrongAnswerNote[], now: Date = new Date()): string {
  return JSON.stringify(
    {
      exportedAt: now.toISOString(),
      note: 'Respuestas que Repasitos marcó como mal en este dispositivo. Si una estaba bien, avísanos.',
      count: notes.length,
      notes: notes.map(({ seq: _seq, ...rest }) => rest),
    },
    null,
    2,
  )
}
