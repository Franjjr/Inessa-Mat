import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINAL } from './types'
import { LESSON_VISUALS } from './index'
import { handAngles } from './time'

describe('handAngles', () => {
  it('3:00 has the hour hand at 90° and the minute hand at 12', () => {
    expect(handAngles(3, 0)).toEqual({ hour: 90, minute: 0 })
  })

  it('9:30 has the hour hand halfway to the 10 and the minute hand at the 6', () => {
    expect(handAngles(9, 30)).toEqual({ hour: 285, minute: 180 })
  })

  it('a 24 h hour folds to the face: 15:15 has the hour hand at 97.5°', () => {
    expect(handAngles(15, 15)).toEqual({ hour: 97.5, minute: 90 })
  })
})

describe('clock visual', () => {
  it('clock digital writes 07:05', () => {
    const Clock = LESSON_VISUALS.clock
    const { getByTestId, unmount } = render(<Clock params={{ h: 7, m: 5, digital: 1 }} phase={FINAL} runLength={1} reduced />)
    expect(getByTestId('clock-digital').textContent).toBe('07:05')
    unmount()
  })

  it('clock without digital shows only the face', () => {
    const Clock = LESSON_VISUALS.clock
    const { container, queryByTestId, unmount } = render(<Clock params={{ h: 7, m: 5 }} phase={FINAL} runLength={1} reduced />)
    expect(queryByTestId('clock-digital')).toBeNull()
    expect(container.textContent).not.toContain('07:05')
    unmount()
  })

  it('the minute hand points at the minutes: 15 minutes is the 3', () => {
    const Clock = LESSON_VISUALS.clock
    const { container, unmount } = render(<Clock params={{ h: 4, m: 15 }} phase={FINAL} runLength={1} reduced />)
    const minute = container.querySelector('[data-hand="minute"]')!
    expect(Number(minute.getAttribute('x2'))).toBeCloseTo(172, 3)
    expect(Number(minute.getAttribute('y2'))).toBeCloseTo(100, 3)
    unmount()
  })

  it('a 24 h time puts the hour hand on the face: 14:30 has the hour hand at the 2 and a half', () => {
    const Clock = LESSON_VISUALS.clock
    const { container, unmount } = render(<Clock params={{ h: 14, m: 30, digital: 1 }} phase={FINAL} runLength={1} reduced />)
    const hour = container.querySelector('[data-hand="hour"]')!
    const angle = handAngles(14, 30).hour
    expect(Number(hour.getAttribute('x2'))).toBeCloseTo(100 + 50 * Math.sin((angle * Math.PI) / 180), 3)
    expect(container.querySelector('[data-testid="clock-digital"]')!.textContent).toBe('14:30')
    unmount()
  })
})

describe('timeline visual', () => {
  it('timeline shows the duration', () => {
    const Timeline = LESSON_VISUALS.timeline
    const { container, unmount } = render(<Timeline params={{ start: 600, end: 645 }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).toContain('45 minutos')
    expect(container.textContent).toContain('10:00')
    expect(container.textContent).toContain('10:45')
    unmount()
  })

  it('an hour and a half is written as such', () => {
    const Timeline = LESSON_VISUALS.timeline
    const { container, unmount } = render(<Timeline params={{ start: 1080, end: 1170 }} phase={FINAL} runLength={1} reduced />)
    expect(container.textContent).toContain('1 hora y media')
    unmount()
  })
})
