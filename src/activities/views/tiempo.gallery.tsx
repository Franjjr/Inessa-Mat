/* Dev gallery of the tiempo views (3.º, block D): reading and setting the clock, 24 h ↔ phrases, durations on a time line,
   and the calendar. Open /dev/gallery?only=tiempo (the entries are listed by title). */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate, makeCalendarMonth, makeCalendarWeekday, makeClockRead, makeClockSet, makeTimeConvert, makeTimeDuration, MONTHS_30_31 } from '@/engine'
import CalendarView from './CalendarView'
import ClockReadView from './ClockReadView'
import ClockSetView from './ClockSetView'
import TimeConvertView from './TimeConvertView'
import TimeDurationView from './TimeDurationView'

const rng = createRng(7)
const ipad = { width: 1180, height: 820 }
const phone = { width: 390, height: 844 }
const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>
const noop = () => {}

const readPhrase = makeClockRead(3, 20, 'phrase', rng, 5)
const readWrite = makeClockRead(11, 45, 'write', rng, 15)
const setQuarter = makeClockSet(2, 30, 30)
const setFive = makeClockSet(7, 40, 5)
const toDigital = makeTimeConvert(14, 30, 'to-digital', rng)
const toPhrase = makeTimeConvert(21, 5, 'to-phrase', rng)
const endHour = makeTimeDuration('end', { hour: 5, minute: 0 }, 90)
const elapsed = makeTimeDuration('elapsed', { hour: 4, minute: 15 }, 45)
const week = makeCalendarWeekday(1, 3, rng)
const month = makeCalendarMonth(MONTHS_30_31[1])
const [units] = generate({ skills: ['time:units'] }, 1, { rng })

const entries: GalleryEntry[] = [
  { title: 'Reloj: leer, frases (ipad)', ...ipad, render: () => frame(<ClockReadView exercise={readPhrase} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Reloj: leer, escribir hora y minutos (ipad)', ...ipad, render: () => frame(<ClockReadView exercise={readWrite} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Reloj: leer, frases (teléfono)', ...phone, render: () => frame(<ClockReadView exercise={readPhrase} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Reloj: poner la hora en cuartos (ipad)', ...ipad, render: () => frame(<ClockSetView exercise={setQuarter} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Reloj: poner la hora de cinco en cinco (ipad)', ...ipad, render: () => frame(<ClockSetView exercise={setFive} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Reloj: poner la hora (teléfono)', ...phone, render: () => frame(<ClockSetView exercise={setQuarter} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Digital → frase (ipad)', ...ipad, render: () => frame(<TimeConvertView exercise={toPhrase} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Frase → digital de 24 h (ipad)', ...ipad, render: () => frame(<TimeConvertView exercise={toDigital} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Duración: ¿a qué hora acaba? (ipad)', ...ipad, render: () => frame(<TimeDurationView exercise={endHour} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Duración: ¿cuántos minutos pasan? (ipad)', ...ipad, render: () => frame(<TimeDurationView exercise={elapsed} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Duración: ¿a qué hora acaba? (teléfono)', ...phone, render: () => frame(<TimeDurationView exercise={endHour} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Calendario: días de la semana (ipad)', ...ipad, render: () => frame(<CalendarView exercise={week} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Calendario: días de un mes (ipad)', ...ipad, render: () => frame(<CalendarView exercise={month} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Calendario: unidades de tiempo (teléfono)', ...phone, render: () => frame(<CalendarView exercise={units} onAnswered={noop} showFeedback allowHints />) },
]

export default entries
