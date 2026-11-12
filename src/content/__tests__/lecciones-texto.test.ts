/* The texts of the lessons are read aloud by the voice and by a 7-8 year old: no arrows, no brackets after a number, no
   chained equalities, no «÷» (the school's sign for dividing is «:»), no English words. */
import { describe, expect, it } from 'vitest'
import type { LessonDef } from '@/types'
import { c2Lessons } from '../c2/lessons'
import { lessons } from '../lessons'

const ALL: LessonDef[] = [...lessons, ...c2Lessons]
const steps = ALL.flatMap((l) => l.steps.map((s, i) => ({ where: `${l.id}#${i}`, text: s.text, lesson: l.id })))

/** Sentences of a text (split after . ! ? and the line breaks). */
const sentences = (text: string) => text.split(/(?<=[.!?…])\s+/)

describe('texts of the lessons', () => {
  it('has no arrows', () => {
    for (const s of steps) expect(s.text, s.where).not.toMatch(/[→⇒➜➡]/)
  })

  it('has no number followed by a bracket with a number, like 7 (21)', () => {
    for (const s of steps) expect(s.text, s.where).not.toMatch(/\d\s?\(\s*\d+\s*\)/)
  })

  it('has no sentence with two «=» (chained equalities are read as a list of symbols)', () => {
    for (const s of steps) {
      for (const sentence of sentences(s.text)) expect((sentence.match(/=/g) ?? []).length, `${s.where}: "${sentence}"`).toBeLessThanOrEqual(1)
    }
  })

  it('divides with «:» and never writes «÷»', () => {
    for (const s of steps) expect(s.text, s.where).not.toContain('÷')
  })

  it('does not say «Bonus» and does not use the old phrase of the trick of the 6', () => {
    for (const s of steps) {
      expect(s.text, s.where).not.toMatch(/bonus/i)
      expect(s.text, s.where).not.toContain('cinco veces el otro número, y una más')
    }
  })

  it('does not name the letters of the houses (C D U) as the only name: they are said whole', () => {
    for (const s of steps) expect(s.text, s.where).not.toMatch(/\b[UDCM] (son|es) (las|los)\b/)
  })

  it('has the old arrows of the line of jumps nowhere', () => {
    for (const s of steps) expect(s.text, s.where).not.toContain('127 → 130')
  })

  it('writes the 2.º lesson of doubles and halves without «×»', () => {
    const double = c2Lessons.find((l) => l.id === 'c2-w5-double')!
    for (const [i, s] of double.steps.entries()) {
      expect(s.text, `c2-w5-double#${i}`).not.toContain('×')
      expect(JSON.stringify(s.params ?? {}), `c2-w5-double#${i} drawing`).not.toContain('×')
    }
  })

  it('has the usual Spanish typography: a space after every full stop and no double spaces', () => {
    for (const s of steps) {
      expect(s.text, s.where).not.toMatch(/[a-záéíóúñ][.!?][A-ZÁÉÍÓÚÑ¿¡]/)
      expect(s.text, s.where).not.toMatch(/ {2}/)
    }
  })

  it('every step fits the bubble of Lumi on a 1000 × 490 tablet: at most 120 characters and 28 words', () => {
    for (const s of steps) {
      expect(s.text.length, `${s.where} (${s.text.length} characters): "${s.text}"`).toBeLessThanOrEqual(120)
      expect(s.text.split(/\s+/).length, `${s.where}: "${s.text}"`).toBeLessThanOrEqual(28)
    }
  })
})
