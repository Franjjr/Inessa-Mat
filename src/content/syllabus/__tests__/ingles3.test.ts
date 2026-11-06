/* The English temario of 3.º: its skill keys are valid engine skills of the english subject, its ids are its own, and it is
   taught in stages over three terms. The maths and Lengua temarios do not change (snapshot). */
import { describe, expect, it } from 'vitest'
import { isValidSkill, parseSkill, subjectOfSkill } from '@/engine'
import { allTopics, GRADE2_SYLLABUS, GRADE3_SYLLABUS, GRADE4_SYLLABUS, INGLES3_STAGES, INGLES3_SYLLABUS, LENGUA3_SYLLABUS, SYLLABUS_RUNGS, subjectOfTopic, syllabusFor, teachingOrder } from '@/content/syllabus'

const ingles = allTopics(INGLES3_SYLLABUS)
const skills = ingles.flatMap((t) => t.skills)

describe('temario de Inglés de 3.º', () => {
  it('has the twelve blocks of the spec, in order, for course 3', () => {
    expect(INGLES3_SYLLABUS.blocks.map((b) => b.id)).toEqual(['saludos', 'numeros', 'colores', 'animales', 'familia', 'comida', 'ropa', 'cole', 'casa', 'cuerpo', 'tiempo', 'dias'])
    expect(INGLES3_SYLLABUS.course).toBe(3)
  })

  it('every topic id is unique, starts with eng- and belongs to the english subject', () => {
    const ids = ingles.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id.startsWith('eng-'), id).toBe(true)
      expect(subjectOfTopic(id), id).toBe('english')
    }
  })

  it('every topic is available, has skills and has the four rungs', () => {
    for (const t of ingles) {
      expect(t.status, t.id).toBe('disponible')
      expect(t.skills.length, t.id).toBeGreaterThan(0)
      for (const rung of SYLLABUS_RUNGS) expect(t.rungs[rung], `${t.id} ${rung}`).toBeTruthy()
    }
  })

  it('every skill key is a valid english engine skill, at most 64 characters, and never repeated', () => {
    expect(skills.length).toBeGreaterThan(0)
    for (const s of skills) {
      expect(isValidSkill(s), s).toBe(true)
      expect(s.startsWith('eng:'), s).toBe(true)
      expect(s.length, s).toBeLessThanOrEqual(64)
      expect(subjectOfSkill(s), s).toBe('english')
    }
    expect(new Set(skills).size).toBe(skills.length)
  })

  it('parses an english skill key into its area, item and level', () => {
    expect(parseSkill('eng:num:ops:plus')).toEqual({ type: 'ingles', area: 'num', item: 'ops', level: 'plus' })
    expect(parseSkill('eng:voc:animales')).toEqual({ type: 'ingles', area: 'voc', item: 'animales' })
    expect(parseSkill('eng:num:21-100')).toEqual({ type: 'ingles', area: 'num', item: '21-100' })
    for (const bad of ['eng:xxx:animales', 'eng:voc', 'eng:voc:', 'eng:voc:Animales', 'eng:voc:a:b:c', 'eng:']) {
      expect(parseSkill(bad), bad).toBeNull()
    }
  })

  it('the numbers block goes in the order of the spec, and the operations go plus, minus, times', () => {
    const numbers = INGLES3_SYLLABUS.blocks.find((b) => b.id === 'numeros')!.topics
    expect(numbers.map((t) => t.id)).toEqual(['eng-num-0-20', 'eng-num-decenas', 'eng-num-21-100', 'eng-ops'])
    const ops = numbers.find((t) => t.id === 'eng-ops')!
    expect(ops.ordered).toBe(true)
    expect(ops.skills).toEqual(['eng:num:ops:plus', 'eng:num:ops:minus', 'eng:num:ops:times'])
  })

  it('teaches every topic in exactly one stage: eight stages over three trimesters, saludos and numbers 0-20 first', () => {
    expect(INGLES3_STAGES).toHaveLength(8)
    const staged = INGLES3_STAGES.flatMap((st) => st.topics)
    expect(new Set(staged).size).toBe(staged.length)
    expect([...staged].sort()).toEqual(ingles.map((t) => t.id).sort())
    for (const st of INGLES3_STAGES) expect(st.worldId, st.id).toBeUndefined()
    const terms = INGLES3_STAGES.map((st) => st.term)
    expect(terms).toEqual([...terms].sort())
    expect(new Set(terms)).toEqual(new Set([1, 2, 3]))
    expect(INGLES3_STAGES[0].topics).toEqual(expect.arrayContaining(['eng-saludos', 'eng-num-0-20']))
    expect(teachingOrder(INGLES3_SYLLABUS).map((t) => t.id)).toEqual(staged)
  })

  it('syllabusFor gives the 3.º temario to the english subject for grade 3 and to a child without a course', () => {
    expect(syllabusFor('english', 3)).toBe(INGLES3_SYLLABUS)
    expect(syllabusFor('english')).toBe(INGLES3_SYLLABUS)
  })

  it('syllabusFor gives english no topics for 2.º and 4.º, as «Pronto»', () => {
    for (const grade of [2, 4]) {
      const s = syllabusFor('english', grade)
      expect(allTopics(s), `grade ${grade}`).toEqual([])
      expect(s.course).toBe(grade)
    }
  })

  it('the maths and Lengua temarios are unchanged', () => {
    expect({ math2: GRADE2_SYLLABUS, math3: GRADE3_SYLLABUS, math4: GRADE4_SYLLABUS, lengua3: LENGUA3_SYLLABUS }).toMatchSnapshot()
  })
})
