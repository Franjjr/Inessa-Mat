import { describe, expect, it } from 'vitest'
import { classForTopic } from './index'

describe('problemas de quitar (3.º): cada solución va con su historia', () => {
  it('the Dani solution comes before the comparison of Pepa', () => {
    const steps = classForTopic('prob-restar', 3)!.lesson.steps
    const dani = steps.findIndex((s) => /A Dani le quedan 9 cromos/.test(s.text))
    const pepa = steps.findIndex((s) => /Pepa tiene 13 cromos/.test(s.text))
    expect(dani).toBeGreaterThanOrEqual(0)
    expect(pepa).toBeGreaterThan(dani)
  })
})
