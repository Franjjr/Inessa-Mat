import { describe, expect, it } from 'vitest'
import { GRADE3_SYLLABUS, divisionFactSkills, skillLevel, MASTERED_BOX, MEMORISED_BOX } from '@/content/syllabus'
import { allTopics } from '@/content/syllabus'

const topic = (id: string) => allTopics(GRADE3_SYLLABUS).find((t) => t.id === id)!

describe('skillLevel: one definition of how well a skill is known', () => {
  it('maps the Leitner boxes to unseen, learning, known and memorised', () => {
    expect(skillLevel(undefined)).toBe('unseen')
    expect(skillLevel(null)).toBe('unseen')
    expect(skillLevel(-1)).toBe('unseen')
    expect(skillLevel(0)).toBe('learning')
    expect(skillLevel(MASTERED_BOX - 1)).toBe('learning')
    expect(skillLevel(MASTERED_BOX)).toBe('known')
    expect(skillLevel(MEMORISED_BOX - 1)).toBe('known')
    expect(skillLevel(MEMORISED_BOX)).toBe('memorised')
    expect(skillLevel(5)).toBe('memorised')
  })
})

describe('3.º temario: teaching order of the steps', () => {
  it('«Dividir con las tablas» lists its facts by divisor in the order the tables are taught (2, 5, 10, 3, 4, 6, 8, 7, 9)', () => {
    const skills = topic('div-con-tablas').skills
    expect(skills).toEqual(divisionFactSkills())
    const divisors = skills.map((s) => Number(s.split('/')[1]))
    const firstOf = (d: number) => divisors.indexOf(d)
    const order = [2, 5, 10, 3, 4, 6, 8, 7, 9].map(firstOf)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(new Set(skills).size).toBe(skills.length)
    expect(skills).toHaveLength(81)
  })

  it('the multi-digit addition and subtraction steps are ordered, so one carry count is taught at a time', () => {
    expect(topic('suma-3d-llevando').ordered).toBe(true)
    expect(topic('suma-4d').ordered).toBe(true)
    expect(topic('resta-4d').ordered).toBe(true)
  })
})
