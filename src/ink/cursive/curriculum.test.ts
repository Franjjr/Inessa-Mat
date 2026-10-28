/* Invariants over the whole Caligrafía curriculum: what a perfect child draws must score 3 stars and must never trip the
   live check while tracing (Repasar). */
import { CAL_CURRICULUM } from '@/content/caligrafia/curriculum'
import { exactStrokes, noisyStrokes, toInk, mirroredAtStart } from './fixtures'
import { joinWord } from './join'
import { createLiveTracker } from './practice'
import { fitPauta, scoreCursive } from './score'

const fitFor = (text: string) => fitPauta(400, 300, joinWord(text).width)

describe('curriculum scoring', () => {
  it.each(CAL_CURRICULUM.map((i) => [i.text]))('the exact model of «%s» scores 3 stars with every criterion passed', (text) => {
    const target = joinWord(text)
    const fit = fitFor(text)
    const score = scoreCursive(target, toInk(exactStrokes(text), fit), fit, text)
    expect(score.passed).toEqual({ shape: true, line: true, size: true, start: true })
    expect(score.stars).toBe(3)
  })

  it.each(CAL_CURRICULUM.filter((_, i) => i % 4 === 0).map((i) => [i.text]))('a ±1.5 hand on «%s» still scores 3 stars', (text) => {
    const target = joinWord(text)
    const fit = fitFor(text)
    const score = scoreCursive(target, toInk(noisyStrokes(exactStrokes(text), 1.5, 7), fit), fit, text)
    expect(score.stars).toBe(3)
  })

  it('a clockwise o still fails the start criterion (strictness kept)', () => {
    const text = 'o'
    const fit = fitFor(text)
    const score = scoreCursive(joinWord(text), toInk(mirroredAtStart(exactStrokes(text)), fit), fit, text)
    expect(score.passed.start).toBe(false)
    expect(score.stars).toBeLessThanOrEqual(2)
  })
})

describe('live check while tracing', () => {
  it.each(CAL_CURRICULUM.map((i) => [i.text]))('the exact model of «%s» raises no notice in Repasar', (text) => {
    const tracker = createLiveTracker(joinWord(text).strokes)
    const statuses: string[] = []
    for (const st of exactStrokes(text)) {
      tracker.reset()
      for (const p of st) statuses.push(tracker.push(p))
    }
    expect(statuses.filter((s) => s !== 'ok')).toEqual([])
  })

  it('a reversed stroke raises the reverse notice', () => {
    for (const text of ['a', 'mariposa', 'Z']) {
      const tracker = createLiveTracker(joinWord(text).strokes)
      const st = [...exactStrokes(text)[0]].reverse()
      for (const p of st) tracker.push(p)
      expect(tracker.status).toBe('reverse')
    }
  })
})
