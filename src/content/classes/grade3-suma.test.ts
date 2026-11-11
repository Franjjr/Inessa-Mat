import { describe, expect, it } from 'vitest'
import { classForTopic } from './index'

describe('suma con dos cifras (3.º): por qué se lleva 1', () => {
  it('explains that ten units make a ten before the first carry is done', () => {
    const steps = classForTopic('suma-2d', 3)!.lesson.steps
    const firstCarry = steps.findIndex((s) => s.visual === 'carry' && /me llevo/.test(s.text))
    expect(firstCarry).toBeGreaterThan(0)
    const why = steps.slice(0, firstCarry)
    // Ten units drawn as one group, and the number with its tens and units.
    expect(why.some((s) => s.visual === 'groups' && s.params?.perGroup === 10)).toBe(true)
    expect(why.some((s) => /diez unidades/i.test(s.text) && /decena/.test(s.text))).toBe(true)
  })
})
