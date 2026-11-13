/* The time answers can be typed: with the real NumberInput on a tablet without a pen, every box of the clock, the
   durations, the 24 h time and the calendar offers the number keypad, like the other maths exercises. */
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createRng, makeClockRead, makeTimeConvert, makeTimeDuration } from '@/engine'
import { buildClock } from '@/engine/clock'
import { InkContext, useInk } from '@/ink/context'
import type { CalendarExercise } from '@/types'
import CalendarView from './CalendarView'
import ClockReadView from './ClockReadView'
import TimeConvertView from './TimeConvertView'
import TimeDurationView from './TimeDurationView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(), stop: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const comprobar = () => screen.getByRole('button', { name: /Comprobar/ })

/** A tablet without a pen: the child writes with a finger, and each box offers the number keypad. */
function OnTablet({ children }: { children: ReactNode }) {
  const ink = useInk()
  return <InkContext.Provider value={{ ...ink, mode: 'touch', isTouchDevice: true }}>{children}</InkContext.Provider>
}
const onTablet = (ui: ReactNode) => render(<OnTablet>{ui}</OnTablet>)

describe('time answers can be typed: every box has the number keypad (no pencil needed)', () => {
  const toggles = () => screen.getAllByRole('button', { name: 'Usar el teclado de números' })

  it('reading the clock: hour and minutes', () => {
    onTablet(<ClockReadView exercise={makeClockRead(3, 20, 'write', createRng(4), 5)} onAnswered={() => {}} showFeedback allowHints />)
    // One keypad for the hour and the minutes, under both.
    expect(toggles()).toHaveLength(1)
    fireEvent.click(toggles()[0])
    expect(screen.getAllByRole('group', { name: 'Teclado de números' })).toHaveLength(1)
  })

  it('durations: the end time (two boxes) and the minutes that pass (one box)', () => {
    const { unmount } = onTablet(<TimeDurationView exercise={makeTimeDuration('end', { hour: 5, minute: 0 }, 90)} onAnswered={() => {}} showFeedback allowHints />)
    expect(toggles()).toHaveLength(1)
    unmount()
    onTablet(<TimeDurationView exercise={makeTimeDuration('elapsed', { hour: 4, minute: 15 }, 45)} onAnswered={() => {}} showFeedback allowHints />)
    expect(toggles()).toHaveLength(1)
  })

  it('the calendar: the days of a month', () => {
    onTablet(<CalendarView exercise={buildClock('cal:month', createRng(8), new Set(), false) as CalendarExercise} onAnswered={() => {}} showFeedback allowHints />)
    expect(toggles()).toHaveLength(1)
  })

  it('the 24 h time to write: hour and minutes', () => {
    onTablet(<TimeConvertView exercise={makeTimeConvert(21, 5, 'to-digital', createRng(6))} onAnswered={() => {}} showFeedback allowHints />)
    expect(toggles()).toHaveLength(1)
  })

  it('a time typed with the keypad is checked like a written one', () => {
    const onAnswered = vi.fn()
    onTablet(<ClockReadView exercise={makeClockRead(3, 20, 'write', createRng(4), 5)} onAnswered={onAnswered} showFeedback={false} allowHints />)
    const key = (d: string) => fireEvent.click(within(screen.getByRole('group', { name: 'Teclado de números' })).getByRole('button', { name: new RegExp(`^${d}$`) }))
    fireEvent.click(toggles()[0])
    // Typed as read, «3», «2», «0»: no hour on the clock is 32, so after the 3 the minutes come next.
    key('3')
    key('2')
    key('0')
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.given).toBe('3:20')
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('a two-digit hour: «1», «2», «0», «5» gives 12:05', () => {
    const onAnswered = vi.fn()
    onTablet(<ClockReadView exercise={makeClockRead(12, 5, 'write', createRng(4), 5)} onAnswered={onAnswered} showFeedback={false} allowHints />)
    fireEvent.click(toggles()[0])
    const key = (d: string) => fireEvent.click(within(screen.getByRole('group', { name: 'Teclado de números' })).getByRole('button', { name: new RegExp(`^${d}$`) }))
    for (const d of '1205') key(d)
    fireEvent.click(comprobar())
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })
})
