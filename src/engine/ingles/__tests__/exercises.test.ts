import { describe, expect, it } from 'vitest'
import { check, createRng, generate, hintsFor, kindsForSkill, statementOf } from '@/engine'
import { ENGLISH_SKILLS } from '@/engine/skills'
import { ENGLISH_KINDS, ENGLISH_LISTENING_KINDS } from '../exercises'
import { PHRASES } from '../phrases'
import { numberToEnglish } from '../numbers'
import { englishKindsFor, makableEnglish, teachableEnglishCourse } from '../teachable'
import { INGLES3_SYLLABUS } from '@/content/syllabus/ingles3'
import type { Answer, EnglishExercise, ExerciseKind } from '@/types'

const now = new Date('2026-11-06T10:00:00.000Z')

/** The first exercise of a kind for a skill, from a fixed seed (deterministic). */
function one(kind: ExerciseKind, skill: string, seed = 7): EnglishExercise {
  const [ex] = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(seed), now })
  if (!ex || ex.kind !== kind) throw new Error(`no ${kind} for ${skill}`)
  return ex as EnglishExercise
}

/** The answer a child gives when right, and a different one when wrong. */
function answersOf(ex: EnglishExercise): { right: Answer; wrong: Answer } {
  switch (ex.kind) {
    case 'eng-listen-pick':
    case 'eng-complete':
      return { right: { type: 'choice', index: ex.answer }, wrong: { type: 'choice', index: (ex.answer + 1) % (ex.kind === 'eng-complete' ? ex.options.length : ex.cards.length) } }
    case 'eng-match':
      return { right: { type: 'marks', marked: ex.answer }, wrong: { type: 'marks', marked: ex.answer.map((c) => (c + 1) % ex.cards.length) } }
    case 'eng-write-word':
    case 'eng-num-write':
      return { right: { type: 'text', value: ex.answer }, wrong: { type: 'text', value: 'zzzz' } }
    case 'eng-num-listen':
    case 'eng-op-listen':
      return { right: { type: 'number', value: ex.answer }, wrong: { type: 'number', value: ex.answer + 1 } }
  }
}

describe('English kinds: generation', () => {
  it('every kind is at most 32 characters and has skills', () => {
    for (const kind of ENGLISH_KINDS) expect(kind.length, kind).toBeLessThanOrEqual(32)
    for (const kind of ENGLISH_KINDS) {
      expect(ENGLISH_SKILLS.some((s) => kindsForSkill(s).includes(kind)), kind).toBe(true)
    }
  })

  it('each kind generates for each of its skills', () => {
    for (const kind of ENGLISH_KINDS) {
      for (const skill of ENGLISH_SKILLS.filter((s) => kindsForSkill(s).includes(kind))) {
        const exs = generate({ skills: [skill], kinds: [kind] }, 3, { rng: createRng(3), now })
        expect(exs.length, `${kind} ${skill}`).toBe(3)
        for (const ex of exs) {
          expect(ex.kind).toBe(kind)
          expect(ex.skill).toBe(skill)
        }
      }
    }
  })

  it('the default kind of each skill is one of its kinds', () => {
    for (const skill of ENGLISH_SKILLS) expect(kindsForSkill(skill).length, skill).toBeGreaterThan(0)
  })

  it('the numbers of each skill stay in their range, and the operations keep the result in range', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const ex = one('eng-num-write', 'eng:num:decenas', seed) as Extract<EnglishExercise, { kind: 'eng-num-write' }>
      expect(ex.value % 10).toBe(0)
      expect(ex.value).toBeGreaterThanOrEqual(30)
      const plus = one('eng-op-listen', 'eng:num:ops:plus', seed) as Extract<EnglishExercise, { kind: 'eng-op-listen' }>
      expect(plus.answer).toBeLessThanOrEqual(20)
      const minus = one('eng-op-listen', 'eng:num:ops:minus', seed) as Extract<EnglishExercise, { kind: 'eng-op-listen' }>
      expect(minus.answer).toBeGreaterThanOrEqual(1)
      const times = one('eng-op-listen', 'eng:num:ops:times', seed) as Extract<EnglishExercise, { kind: 'eng-op-listen' }>
      expect([2, 5, 10]).toContain(times.a)
    }
  })

  it('every frase skill has at least six items, each with one gap, its answer among the options', () => {
    const phraseSkills = ENGLISH_SKILLS.filter((s) => s.startsWith('eng:frase:'))
    expect(phraseSkills).toHaveLength(13)
    for (const skill of phraseSkills) {
      const items = PHRASES[skill]
      expect(items.length, skill).toBeGreaterThanOrEqual(6)
      for (const item of items) {
        expect(item.sentence.split('___').length, item.sentence).toBe(2)
        expect(new Set([item.answer, ...item.distractors]).size, item.sentence).toBe(3)
      }
    }
  })
})

describe('English kinds: check', () => {
  for (const kind of ENGLISH_KINDS) {
    it(`${kind} accepts the right answer and refuses a wrong one`, () => {
      const skill = ENGLISH_SKILLS.find((s) => kindsForSkill(s).includes(kind))!
      for (let seed = 1; seed <= 5; seed++) {
        const ex = one(kind, skill, seed)
        const { right, wrong } = answersOf(ex)
        expect(check(ex, right).correct, `${kind} seed ${seed}`).toBe(true)
        const bad = check(ex, wrong)
        expect(bad.correct).toBe(false)
        expect(bad.feedback, kind).toBeTruthy()
      }
    })
  }

  it('a wrong typed word shows the right word; a letter away is «¡Casi!» and never «¡Mal!»', () => {
    const ex = one('eng-write-word', 'eng:voc:animales')
    const word = ex.kind === 'eng-write-word' ? ex.answer : ''
    const miss = check(ex, { type: 'text', value: `${word}x` })
    expect(miss.correct).toBe(false)
    expect(miss.feedback).toContain(`«${word}»`)
    expect(miss.feedback).toMatch(/^¡Casi!/)
    const far = check(ex, { type: 'text', value: 'zzzz' })
    expect(far.feedback).toContain(`«${word}»`)
    expect(far.feedback).not.toMatch(/Mal/)
  })

  it('a typed word is right when spelt in another accepted way (alts, the hyphen of numbers, the capitals)', () => {
    const hello = one('eng-write-word', 'eng:voc:saludos', 1)
    if (hello.kind === 'eng-write-word' && hello.answer === 'hello') {
      expect(check(hello, { type: 'text', value: 'Hi' }).correct).toBe(true)
    }
    const num = one('eng-num-write', 'eng:num:21-100')
    if (num.kind === 'eng-num-write') {
      expect(num.answer).toBe(numberToEnglish(num.value))
      expect(check(num, { type: 'text', value: num.answer.replace('-', ' ').toUpperCase() }).correct).toBe(true)
    }
  })

  it('a match is right only when every pair is right, and the feedback names the pairs', () => {
    const ex = one('eng-match', 'eng:voc:comida')
    if (ex.kind !== 'eng-match') throw new Error('not a match')
    const wrong = check(ex, { type: 'marks', marked: ex.answer.map((c) => (c + 1) % ex.cards.length) })
    expect(wrong.correct).toBe(false)
    expect(wrong.feedback).toContain(ex.words[0])
  })
})

describe('English kinds: hints and statements', () => {
  it('every kind has three hints, levels 1 to 3', () => {
    for (const kind of ENGLISH_KINDS) {
      const skill = ENGLISH_SKILLS.find((s) => kindsForSkill(s).includes(kind))!
      const hints = hintsFor(one(kind, skill))
      expect(hints.map((h) => h.level), kind).toEqual([1, 2, 3])
    }
  })

  it('the listening kinds never show the spoken text in the statement', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const num = one('eng-num-listen', 'eng:num:21-100', seed)
      if (num.kind === 'eng-num-listen') expect(statementOf(num)).not.toContain(num.spoken)
      const op = one('eng-op-listen', 'eng:num:ops:times', seed)
      if (op.kind === 'eng-op-listen') expect(statementOf(op)).not.toContain(op.spoken)
      const pick = one('eng-listen-pick', 'eng:voc:animales', seed)
      if (pick.kind === 'eng-listen-pick') expect(statementOf(pick)).not.toContain(pick.word)
    }
  })

  it('the write-word hint gives the first letter and the count, never the word', () => {
    const ex = one('eng-write-word', 'eng:voc:cole')
    if (ex.kind !== 'eng-write-word') throw new Error('not a write-word')
    const [, two, three] = hintsFor(ex)
    expect(two.text).toContain(ex.answer[0])
    expect(three.text).toContain(String(ex.answer.replace(/[^a-z]/gi, '').length))
  })

  it('the family pictures keep their Spanish gloss in the cards', () => {
    const ex = one('eng-listen-pick', 'eng:voc:familia')
    if (ex.kind !== 'eng-listen-pick') throw new Error('not a listen-pick')
    for (const c of ex.cards) expect(c.theme).toBe('familia')
  })
})

describe('English sound filter', () => {
  it('with the sound off, the listening kinds are left out; the other kinds stay', () => {
    expect(englishKindsFor('eng:voc:animales', true)).toEqual(['eng-listen-pick', 'eng-match', 'eng-write-word'])
    expect(englishKindsFor('eng:voc:animales', false)).toEqual(['eng-match', 'eng-write-word'])
    expect(englishKindsFor('eng:num:0-20', false)).toEqual(['eng-num-write'])
    expect(makableEnglish('eng:num:ops:plus', false)).toBe(false)
    expect(makableEnglish('eng:num:ops:plus', true)).toBe(true)
    for (const kind of ENGLISH_LISTENING_KINDS) expect(ENGLISH_KINDS).toContain(kind)
  })

  it('the teachable course drops the English skills it cannot make, and keeps the rest', () => {
    const course = teachableEnglishCourse(INGLES3_SYLLABUS, false)
    const skills = course.blocks.flatMap((b) => b.topics.flatMap((t) => t.skills))
    expect(skills).not.toContain('eng:num:ops:plus')
    expect(skills).toContain('eng:voc:animales')
    expect(skills).toContain('eng:num:0-20')
    expect(teachableEnglishCourse(INGLES3_SYLLABUS, true)).toEqual(INGLES3_SYLLABUS)
  })
})
