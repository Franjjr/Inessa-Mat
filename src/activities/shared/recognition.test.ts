import { describe, expect, it } from 'vitest'
import { check, makeColumnAdd } from '@/engine'
import { answerKey, gradeFromSubmissions, type Submitted } from './recognition'

const ex = makeColumnAdd([368, 257]) // 625, digits units first
const sub = (digits: (number | null)[]): Submitted => ({
  key: answerKey({ type: 'digits', digits }),
  check: check(ex, { type: 'digits', digits }),
})
const right = sub([5, 2, 6])
const wrong = sub([9, 9, 9])
const otherWrong = sub([5, 2, 7])

describe('gradeFromSubmissions', () => {
  it('returns null without submissions', () => {
    expect(gradeFromSubmissions([])).toBeNull()
  })

  it('a single wrong answer is graded as wrong', () => {
    expect(gradeFromSubmissions([wrong])?.check.correct).toBe(false)
  })

  it('a first right answer cannot be undone by a later re-check', () => {
    const g = gradeFromSubmissions([right, wrong])!
    expect(g.check.correct).toBe(true)
    expect(g.rewritten).toBe(false)
  })

  it('a wrong first answer that the child rewrote into a right one is graded as right (misread fixed)', () => {
    const g = gradeFromSubmissions([wrong, right])!
    expect(g.check.correct).toBe(true)
    expect(g.rewritten).toBe(true)
  })

  it('a wrong first answer re-submitted unchanged stays wrong', () => {
    const g = gradeFromSubmissions([wrong, sub([9, 9, 9])])!
    expect(g.check.correct).toBe(false)
    expect(g.rewritten).toBe(false)
  })

  it('a rewritten answer that is still wrong is graded on the answer the child settled on', () => {
    const g = gradeFromSubmissions([wrong, otherWrong])!
    expect(g.check.given).toBe(otherWrong.check.given)
    expect(g.rewritten).toBe(true)
  })
})
