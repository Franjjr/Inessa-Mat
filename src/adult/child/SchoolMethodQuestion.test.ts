/* Who gets the school-method question: from 2.º by the grade given, or by the birth year when the grown-up said
   «No lo sé» to the school year. */
import { describe, expect, it } from 'vitest'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { needsSchoolMethod, schoolGradeOf } from './SchoolMethodQuestion'

const NOV_2026 = new Date(2026, 10, 12)
const MAR_2027 = new Date(2027, 2, 1)
const settings = { ...DEFAULT_CHILD_SETTINGS, schoolMethodAsked: false }

describe('schoolGradeOf', () => {
  it('uses the grade given when there is one', () => {
    expect(schoolGradeOf({ grade: 1, birthYear: 2016 }, NOV_2026)).toBe(1)
  })
  it('without a grade, guesses it from the birth year as in Spain (school year from September)', () => {
    expect(schoolGradeOf({ birthYear: 2018 }, NOV_2026)).toBe(3)
    expect(schoolGradeOf({ birthYear: 2018 }, MAR_2027)).toBe(3)
    expect(schoolGradeOf({ birthYear: 2020 }, NOV_2026)).toBe(1)
    expect(schoolGradeOf({ birthYear: 2022 }, NOV_2026)).toBe(0)
  })
  it('knows nothing without grade nor birth year', () => {
    expect(schoolGradeOf({}, NOV_2026)).toBe(0)
  })
})

describe('needsSchoolMethod', () => {
  it('a profile without a school year («No lo sé») but born in 2018 (8 years old) is asked', () => {
    expect(needsSchoolMethod({ birthYear: 2018, settings }, NOV_2026)).toBe(true)
  })
  it('a 6-year-old without a school year is not asked yet', () => {
    expect(needsSchoolMethod({ birthYear: 2020, settings }, NOV_2026)).toBe(false)
  })
  it('once answered it is never asked again', () => {
    expect(needsSchoolMethod({ grade: 3, settings: { ...settings, schoolMethodAsked: true } }, NOV_2026)).toBe(false)
  })
})
