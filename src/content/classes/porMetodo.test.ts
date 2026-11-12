/* The subtraction classes as the school of the child teaches them: with «me llevo una» (subMethod 'carry') the worked
   example and the rule never talk about «la vecina» nor about asking to borrow, and the drawings are the ones of that
   method; with «pedir prestado» the class is the one of the registry. */
import { describe, expect, it } from 'vitest'
import { CLASSES, classForMethods } from '@/content/classes'
import { carryBeats } from '@/activities/lesson/visuals/subtraction'

const SUB_CLASSES = ['c3-resta-prestando', 'c3-resta-ceros', 'c3-resta-4d']
const classOf = (id: string) => CLASSES.find((c) => c.lesson.id === id)!

describe('subtraction classes for «me llevo una»', () => {
  for (const id of SUB_CLASSES) {
    it(`${id}: no «vecina» nor «prestado» in what is shown and said, and the drawings are «me llevo una»`, () => {
      const base = classOf(id)
      const carry = classForMethods(base, { subMethod: 'carry', divMethod: 'galera' })
      expect(carry.lesson.id).toBe(base.lesson.id)
      expect(carry.topicId).toBe(base.topicId)
      expect(carry.mapLessonId).toBe(base.mapLessonId)
      expect(carry.phases).toMatchObject({ guiada: base.phases.guiada, sola: base.phases.sola, cierre: 1 })
      for (const [i, st] of carry.lesson.steps.entries()) {
        const said = `${st.text} ${st.say ?? ''} ${JSON.stringify(st.params ?? {})}`
        expect(said, `${id}#${i}`).not.toMatch(/vecina|prest/i)
        expect(['borrow', 'zero-borrow'], `${id}#${i}`).not.toContain(st.visual)
        if (st.interaction === 'try') expect(st.method, `${id}#${i}`).toBe('carry')
      }
      // the same tries as the class of the registry (only the way of solving them changes)
      const tries = (c: typeof base) => c.lesson.steps.filter((s) => s.interaction === 'try').map((s) => s.trySelector)
      expect(tries(carry)).toEqual(tries(base))
    })
  }

  it('c3-resta-ceros: the example of «me llevo una» says each beat of 503 − 128 in its step', () => {
    const carry = classForMethods(classOf('c3-resta-ceros'), { subMethod: 'carry', divMethod: 'galera' })
    const run = carry.lesson.steps.filter((s) => s.visual === 'sub-carry' && s.params?.a === 503 && s.interaction !== 'try')
    // one step per beat (units, +1, tens, +1, hundreds), then the rule
    expect(run.length).toBeGreaterThanOrEqual(carryBeats(503, 128).length)
    expect(carry.lesson.steps.map((s) => s.text).join(' ')).toContain('375')
  })

  it('c3-resta-4d: the example of «me llevo una» gives 4 365 − 1 228 = 3 137', () => {
    const carry = classForMethods(classOf('c3-resta-4d'), { subMethod: 'carry', divMethod: 'galera' })
    expect(carry.lesson.steps.map((s) => s.text).join(' ')).toContain('3 137')
  })

  for (const id of SUB_CLASSES) {
    it(`${id}: with «pedir prestado» it is the class of the registry`, () => {
      const base = classOf(id)
      const borrow = classForMethods(base, { subMethod: 'borrow', divMethod: 'galera' })
      expect(borrow.lesson.steps.map((s) => s.text)).toEqual(base.lesson.steps.map((s) => s.text))
    })
  }
})
