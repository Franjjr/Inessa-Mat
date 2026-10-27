/* The readings of Lengua de 3.º: ten original stories (120 to 250 words, three to five questions each, a fable and a poem among
   them) and ten short readings (eight riddles, two tongue twisters). Every answer comes from the text or the riddle, every
   paragraph fits the speech service (400 characters), and only the known template placeholders are used. */
import { describe, expect, it } from 'vitest'
import { READINGS, SHORT_READINGS, STORY_READINGS, readingById } from '@/content/lengua/stories'
import { readingExercise } from '@/engine/lengua/reading'
import { renderTemplate, templateContext } from '@/content/template'
import type { ChildProfile } from '@/types'

/** The source of every reading file (raw text), to check the marker that says the text is original. */
const SOURCES = import.meta.glob('./../stories/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Words as a child counts them: runs of letters, placeholders included as one word each. */
const words = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\d{]/u.test(w)).length
const norm = (s: string) => s.toLocaleLowerCase('es-ES').normalize('NFD').replace(/\p{M}/gu, '')

const ALLOWED = /\{(child|pet|pg:[^}]*|cg:[^}]*)\}/g

describe('lectura de Lengua de 3.º: los textos', () => {
  it('has the ten stories and the ten short readings, with unique ids', () => {
    expect(STORY_READINGS).toHaveLength(10)
    expect(SHORT_READINGS).toHaveLength(10)
    const ids = READINGS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has one fable and one poem among the stories, with the moral in one sentence', () => {
    const fable = readingById('fabula-camaleon')!
    expect(fable.questions.some((q) => q.skill === 'lng:lit:fabula')).toBe(true)
    expect(fable.text.at(-1)).toMatch(/^Moraleja: [^.]+\.$/)
    const poem = readingById('poema-lluvia')!
    // An introduction from Lumi, then the four stanzas of four lines each.
    const stanzas = poem.text.slice(1)
    expect(stanzas).toHaveLength(4)
    for (const st of stanzas) expect(st.split('\n')).toHaveLength(4)
    expect(poem.questions.filter((q) => q.skill === 'lng:lit:rima')).toHaveLength(2)
  })

  it.each(STORY_READINGS.map((r) => [r.id, r] as const))('%s: 120 to 250 words, three to five questions', (_id, r) => {
    const n = words(r.text.join(' '))
    expect(n).toBeGreaterThanOrEqual(120)
    expect(n).toBeLessThanOrEqual(250)
    expect(r.questions.length).toBeGreaterThanOrEqual(3)
    expect(r.questions.length).toBeLessThanOrEqual(5)
  })

  it.each(READINGS.map((r) => [r.id, r] as const))('%s: paragraphs of at most 400 characters, placeholders only the known ones', (_id, r) => {
    expect(r.text.length).toBeGreaterThan(0)
    for (const p of r.text) {
      expect(p.length, p).toBeLessThanOrEqual(400)
      const left = p.replace(ALLOWED, '')
      expect(left.includes('{'), p).toBe(false)
    }
  })

  it.each(READINGS.map((r) => [r.id, r] as const))('%s: each question has its skill among the reading skills, and no placeholder', (_id, r) => {
    expect(r.skills.length).toBeGreaterThan(0)
    for (const q of r.questions) {
      expect(r.skills).toContain(q.skill)
      expect(q.prompt).not.toMatch(/\{/)
    }
  })

  it.each(READINGS.map((r) => [r.id, r] as const))('%s: choice answers are an index of the options, options are distinct', (_id, r) => {
    for (const q of r.questions) {
      if (q.kind !== 'choice') continue
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      for (const o of q.options) expect(o).not.toMatch(/\{/)
    }
  })

  it.each(STORY_READINGS.map((r) => [r.id, r] as const))('%s: a typed word comes from the text, and an order has every event once', (_id, r) => {
    const text = norm(r.text.join(' '))
    for (const q of r.questions) {
      if (q.kind === 'text') {
        expect(text.includes(norm(q.answer)), `«${q.answer}» in the text`).toBe(true)
      }
      if (q.kind === 'order') {
        expect(q.events.length).toBeGreaterThanOrEqual(3)
        expect(q.events.length).toBeLessThanOrEqual(4)
        expect(new Set(q.events).size).toBe(q.events.length)
      }
    }
  })

  it.each(SHORT_READINGS.map((r) => [r.id, r] as const))('%s: a short reading with its question', (_id, r) => {
    expect(words(r.text.join(' '))).toBeLessThanOrEqual(60)
    expect(r.questions.length).toBeGreaterThanOrEqual(1)
  })

  it('states the original-content marker in the source of every reading file', () => {
    const files = Object.keys(SOURCES).filter((f) => !f.endsWith('/index.ts'))
    expect(files.length).toBe(11)
    for (const file of files) expect(SOURCES[file], file).toMatch(/Original/)
  })

  it('renders for every child and pet gender without leftover braces', () => {
    const genders = ['f', 'm'] as const
    for (const cg of genders) for (const pg of genders) {
      const child = { id: 'c', nickname: 'Inessa', gender: cg, companion: { species: 'dragon', gender: pg, name: 'Chispa' } } as unknown as ChildProfile
      const ctx = templateContext(child)
      for (const r of READINGS) for (const p of r.text) {
        expect(renderTemplate(p, ctx), `${r.id} ${cg}${pg}`).not.toMatch(/[{}]/)
      }
    }
  })
})

describe('lectura: las opciones se mezclan', () => {
  it('puts the right answer of the choice questions in every position, over the readings', () => {
    const positions = new Map<number, number>()
    for (const r of READINGS) r.questions.forEach((_q, i) => {
      const ex = readingExercise(r, i)
      if (ex.kind === 'lng-read-choice') positions.set(ex.answer, (positions.get(ex.answer) ?? 0) + 1)
    })
    for (const p of [0, 1, 2]) expect(positions.get(p) ?? 0, `position ${p}`).toBeGreaterThan(0)
  })

  it('makes the same shuffled order every time a question is shown', () => {
    for (const r of READINGS) r.questions.forEach((_q, i) => {
      expect(readingExercise(r, i)).toEqual(readingExercise(r, i))
    })
  })
})

/** Words that agree with a person's gender, as [masculine, feminine]. They are looked for after the name of the pet or the child. */
const AGREEMENT: [string, string][] = [
  ['seguro', 'segura'], ['preocupado', 'preocupada'], ['orgulloso', 'orgullosa'], ['nervioso', 'nerviosa'],
  ['asustado', 'asustada'], ['cansado', 'cansada'], ['contento', 'contenta'], ['sorprendido', 'sorprendida'],
  ['tranquilo', 'tranquila'], ['listo', 'lista'], ['quieto', 'quieta'], ['serio', 'seria'], ['enfadado', 'enfadada'],
  ['dormido', 'dormida'], ['agotado', 'agotada'], ['despistado', 'despistada'],
]

describe('lectura: el género de las palabras que van con {pet} y {child}', () => {
  const PET_NAME = 'Chispa'
  const CHILD_NAME = 'Inessa'
  for (const cg of ['f', 'm'] as const) for (const pg of ['f', 'm'] as const) {
    it(`agrees with a child «${cg}» and a pet «${pg}»`, () => {
      const child = { id: 'c', nickname: CHILD_NAME, gender: cg, companion: { species: 'dragon', gender: pg, name: PET_NAME } } as unknown as ChildProfile
      const ctx = templateContext(child)
      // The form that does not fit a person of this gender: index 1 (feminine) for a male, index 0 (masculine) for a female.
      const wrongFor = (g: 'f' | 'm') => (g === 'f' ? 0 : 1)
      const bad: string[] = []
      for (const r of READINGS) for (const p of r.text) {
        const text = renderTemplate(p, ctx)
        for (const [name, g] of [[PET_NAME, pg], [CHILD_NAME, cg]] as const) {
          for (let at = text.indexOf(name); at >= 0; at = text.indexOf(name, at + name.length)) {
            const after = text.slice(at + name.length).split(/\s+/).slice(0, 5).map((w) => norm(w.replace(/[^\p{L}]/gu, '')))
            for (const w of after) {
              const pair = AGREEMENT.find((pr) => pr[0] === w || pr[1] === w)
              if (pair && pair[wrongFor(g)] === w) bad.push(`${r.id}: «${name} … ${w}»`)
            }
          }
        }
      }
      expect(bad).toEqual([])
    })
  }
})
