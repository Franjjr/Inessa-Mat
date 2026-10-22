/* The tiempo views: what the child sees and what they send. NumberInput is a plain box here (its handwriting is covered by
   its own tests). The clock face shows no digital readout: the tests check that no «3:20» text appears on the page. */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { clockPhrase, createRng, makeClockRead, makeClockSet, makeTimeConvert, makeTimeDuration } from '@/engine'
import { buildClock } from '@/engine/clock'
import type { CalendarExercise } from '@/types'
import CalendarView from './CalendarView'
import ClockReadView from './ClockReadView'
import ClockSetView from './ClockSetView'
import { angleOf, handAngles, hourFromAngle, minuteFromAngle } from './Clock'
import TimeConvertView from './TimeConvertView'
import TimeDurationView from './TimeDurationView'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))
vi.mock('@/ink', () => ({
  NumberInput: (p: {
    value: number | null
    onChange: (v: number | null) => void
    onSubmit: (v: number | null) => void
    ariaLabel?: string
    placeholder?: string
  }) => (
    <input
      aria-label={p.ariaLabel}
      value={p.value ?? ''}
      placeholder={p.placeholder}
      onChange={(e) => p.onChange(e.target.value === '' ? null : Number(e.target.value))}
      onKeyDown={(e) => { if (e.key === 'Enter') p.onSubmit(p.value) }}
    />
  ),
  useInkLearning: () => ({ requestConfirm: () => false, recognitionFixes: () => 0, confirm() {}, discard() {} }),
  useInputMode: () => ({ mode: 'keypad' }),
}))

const comprobar = () => screen.getByRole('button', { name: /Comprobar/ })
const noDigitalReadout = () => expect(document.body.textContent ?? '').not.toMatch(/\d{1,2}:\d{2}/)

describe('clock hand maths', () => {
  it('snaps the minute hand to the fives and reads the hour under the hour hand', () => {
    expect(minuteFromAngle(0)).toBe(0)
    expect(minuteFromAngle(95)).toBe(15)
    expect(minuteFromAngle(359)).toBe(0)
    expect(hourFromAngle(90, 15)).toBe(3)
    expect(hourFromAngle(357.5, 55)).toBe(11)
    expect(hourFromAngle(2, 0)).toBe(12)
  })

  it('moves the hour hand with the minutes', () => {
    expect(handAngles({ hour: 3, minute: 0 }).hour).toBe(90)
    expect(handAngles({ hour: 3, minute: 30 }).hour).toBe(105)
    expect(handAngles({ hour: 3, minute: 30 }).minute).toBe(180)
    expect(angleOf(0, -1)).toBe(0)
    expect(angleOf(1, 0)).toBe(90)
  })
})

describe('ClockReadView', () => {
  it('reads with the phrases: the right one is correct, and no digital time is shown', () => {
    const onAnswered = vi.fn()
    const ex = makeClockRead(3, 20, 'phrase', createRng(4), 5)
    if (ex.kind !== 'clock-read') throw new Error()
    render(<ClockReadView exercise={ex} onAnswered={onAnswered} showFeedback allowHints />)
    noDigitalReadout()
    const options = ex.options.map((o) => screen.getByRole('button', { name: o.charAt(0).toUpperCase() + o.slice(1) }))
    expect(options).toHaveLength(3)
    const right = screen.getByRole('button', { name: 'Las tres y veinte' })
    fireEvent.click(right)
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
    expect(onAnswered).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0]).toMatchObject({ check: { correct: true } })
  })

  it('writes the hour and the minutes in write mode', () => {
    const ex = makeClockRead(11, 45, 'write', createRng(5), 15)
    render(<ClockReadView exercise={ex} onAnswered={() => {}} showFeedback allowHints />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Hora' }), { target: { value: '11' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Minutos' }), { target: { value: '45' } })
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
  })
})

describe('ClockSetView', () => {
  it('sets the hands with the +/− buttons and checks the time', () => {
    const ex = makeClockSet(7, 20, 5)
    if (ex.kind !== 'clock-set') throw new Error()
    render(<ClockSetView exercise={ex} onAnswered={() => {}} showFeedback allowHints />)
    expect(screen.getByText(/Las siete y veinte/)).toBeTruthy()
    noDigitalReadout()
    // the hands start at 10:50: three hours back, then six fives forward
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Una hora menos' }))
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole('button', { name: 'Cinco minutos más' }))
    noDigitalReadout()
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
  })
})

describe('TimeConvertView', () => {
  it('shows the 24 h time and checks the phrase with the period of the day', () => {
    const ex = makeTimeConvert(21, 5, 'to-phrase', createRng(6))
    render(<TimeConvertView exercise={ex} onAnswered={() => {}} showFeedback allowHints />)
    expect(screen.getByText('21:05')).toBeTruthy()
    const right = clockPhrase(21, 5, true)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${right.charAt(0).toUpperCase()}${right.slice(1)}$`) }))
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
  })
})

describe('TimeDurationView', () => {
  it('asks the end time with two boxes and the minutes that pass with one', () => {
    const end = makeTimeDuration('end', { hour: 5, minute: 0 }, 90)
    const { unmount } = render(<TimeDurationView exercise={end} onAnswered={() => {}} showFeedback allowHints />)
    expect(screen.getByRole('textbox', { name: 'Hora' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Minutos' })).toBeTruthy()
    unmount()
    const el = makeTimeDuration('elapsed', { hour: 4, minute: 15 }, 45)
    render(<TimeDurationView exercise={el} onAnswered={() => {}} showFeedback allowHints />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Minutos que pasan' }), { target: { value: '45' } })
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
  })
})

describe('CalendarView', () => {
  it('chooses the weekday after the days counted', () => {
    const ex = buildClock('cal:weekday', createRng(7), new Set(), false) as CalendarExercise
    render(<CalendarView exercise={ex} onAnswered={() => {}} showFeedback allowHints />)
    expect(screen.getByText(ex.prompt)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: ex.options[ex.answer] }))
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
  })

  it('writes the days of a month', () => {
    const ex = buildClock('cal:month', createRng(8), new Set(), false) as CalendarExercise
    render(<CalendarView exercise={ex} onAnswered={() => {}} showFeedback allowHints />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Días del mes' }), { target: { value: String(ex.answer) } })
    fireEvent.click(comprobar())
    expect(screen.getByText(/¡Muy bien!/)).toBeTruthy()
  })
})
