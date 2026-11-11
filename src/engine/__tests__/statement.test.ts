/* statementFor: every exercise of the maths syllabus has a sentence to read, and the voice turns it into words only. */
import { describe, expect, it } from 'vitest'
import { toSpeakable } from '@/audio/speechText'
import { allTopics, syllabusForGrade } from '@/content/syllabus'
import { createRng, generate } from '@/engine'
import { statementFor } from '@/engine/statement'
import { ordinalWord } from '@/engine/ordinals'
import { numberToSpanish } from '@/audio/spanishNumbers'
import type { Exercise, ExerciseKind } from '@/types'

function sample(): Exercise[] {
  const out: Exercise[] = []
  for (const grade of [3, 4]) {
    for (const topic of allTopics(syllabusForGrade(grade))) {
      for (const skill of topic.skills) {
        try {
          // Three seeds per skill: variants of the same kind (modes, ops) show up.
          for (const seed of [1, 2, 3]) out.push(...generate({ skills: [skill] }, 2, { rng: createRng(seed) }))
        } catch {
          // A skill whose exercises do not exist yet (pending topic) has nothing to read.
        }
      }
    }
  }
  return out
}

describe('statementFor', () => {
  const exercises = sample()

  it('the sample covers a wide range of kinds', () => {
    const kinds = new Set<ExerciseKind>(exercises.map((e) => e.kind))
    expect(kinds.size).toBeGreaterThanOrEqual(40)
  })

  it('every exercise of the syllabus has a sentence, and its speakable text is words only', () => {
    for (const ex of exercises) {
      const text = statementFor(ex)
      expect(text.trim().length, `${ex.kind} ${ex.id}`).toBeGreaterThan(8)
      expect(text, `${ex.kind} ${ex.id}`).not.toMatch(/\{|undefined|NaN|\[object/)
      const said = toSpeakable(text)
      expect(said.length, `${ex.id}: ${text}`).toBeGreaterThan(0)
      expect(said, `${ex.id}: ${text} → ${said}`).not.toMatch(/[×÷=<>+/−\d]/)
    }
  })

  it('reads the facts as questions', () => {
    const [mul] = generate({ kinds: ['fact-mul'], tables: [6] }, 1, { rng: createRng(5) })
    expect(statementFor(mul)).toMatch(/^¿Cuánto es \d+ × \d+\?$/)
  })

  it('a story keeps the child name from the profile', () => {
    const [story] = generate({ kinds: ['word-problem'] }, 1, { rng: createRng(7) })
    const ctx = { childName: 'Inessa', childGender: 'f' as const, petName: 'Coco', petGender: 'm' as const, petSpecies: 'cat' as const }
    expect(statementFor(story, ctx)).not.toMatch(/\{/)
  })

  it('the sentence never gives the answer away (ordinals, decimals, money)', () => {
    const said = (ex: Exercise) => toSpeakable(statementFor(ex)).toLowerCase()
    const own = { id: 'x', skillId: 's', difficulty: 1 } as never
    for (let n = 1; n <= 30; n++) {
      const read = said({ ...(own as object), kind: 'ordinal', mode: 'read', n } as Exercise)
      expect(read, `read ${n}`).not.toMatch(/primero|segundo|tercero|cuarto|quinto|sexto|séptimo|octavo|noveno|décimo|vigésimo|trigésimo|decimo|undécimo|duodécimo/)
      const write = said({ ...(own as object), kind: 'ordinal', mode: 'write', n } as Exercise)
      // The word is on the screen, the number is the answer.
      expect(write, `write ${n}`).toContain(ordinalWord(n))
      expect(write, `write ${n}`).not.toContain(` ${numberToSpanish(n)}?`)
    }
    expect(said({ ...(own as object), kind: 'ordinal', mode: 'write', n: 13 } as Exercise)).toContain('decimotercero')
    const read = said({ ...(own as object), kind: 'decimal', mode: 'read', places: 1, value: 30 } as Exercise)
    expect(read).toContain('tres décimas')
    expect(read).not.toContain('cero coma')
    const money = said({ ...(own as object), kind: 'decimal', mode: 'money', places: 2, value: 361 } as Exercise)
    expect(money).not.toMatch(/sesenta|tres euros/)
  })
})
