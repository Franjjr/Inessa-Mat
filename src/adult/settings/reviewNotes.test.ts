import { describe, expect, it } from 'vitest'
import type { WrongAnswerNote } from '@/data'
import { formatWrongAnswer, wrongAnswerExport, wrongAnswerSkill } from './reviewNotes'

const note = (over: Partial<WrongAnswerNote> = {}): WrongAnswerNote => ({
  seq: 7,
  at: new Date(2026, 10, 11, 17, 30).toISOString(),
  appVersion: '1.0.0',
  skill: 'mul:7x8',
  kind: 'fact-mul',
  errorType: 'fact',
  given: '54',
  expected: '56',
  inputMode: 'pen',
  ...over,
})

describe('the adult list of wrong answers', () => {
  it('reads like a sentence a parent can check', () => {
    expect(formatWrongAnswer(note())).toBe('Tabla 7 × 8 · escribió 54 · se esperaba 56 · a mano · 11 nov')
  })

  it('says «tocó» for an option the child tapped, not «escribió»', () => {
    expect(formatWrongAnswer(note({ inputMode: 'tap', given: '54' }))).toBe(
      'Tabla 7 × 8 · tocó 54 · se esperaba 56 · tocando una opción · 11 nov',
    )
    expect(formatWrongAnswer(note({ inputMode: 'keypad', given: '54' }))).toContain('escribió 54')
  })

  it('says when the child left the answer empty', () => {
    expect(formatWrongAnswer(note({ given: '' }))).toContain('no respondió')
  })

  it('describes skills that are not times tables without the word «Tabla»', () => {
    expect(wrongAnswerSkill('sub:4d:z')).toBe('Restas de 4 cifras con ceros')
    expect(wrongAnswerSkill('sub:4d:z')).not.toContain('Tabla')
  })

  it('shows an unknown skill as it is, instead of failing', () => {
    expect(wrongAnswerSkill('no:such:skill')).toBe('no:such:skill')
  })

  it('exports the notes without the internal sequence number and without any child id', () => {
    const text = wrongAnswerExport([note()], new Date('2026-11-11T10:00:00Z'))
    const parsed = JSON.parse(text)
    expect(parsed.count).toBe(1)
    expect(parsed.exportedAt).toBe('2026-11-11T10:00:00.000Z')
    expect(parsed.notes[0]).not.toHaveProperty('seq')
    expect(parsed.notes[0]).toMatchObject({ skill: 'mul:7x8', given: '54', expected: '56', inputMode: 'pen' })
    expect(text).not.toMatch(/childId|orgId/)
  })
})
