/* Tiempo (3.º de Primaria, block D): the phrases children say for the clock, the periods of the day, the face
   arithmetic of durations and the calendar words. Pure: no React, no I/O.
   «las tres y veinte», «las cinco menos diez», «las dos y media de la tarde».
   Conventions: the face hour is 1..12 (12 = the 12 of the clock); the 24 h hour is 0..23.
   Periods: 6–11 de la mañana, 12 del mediodía, 13–20 de la tarde, 21–5 de la noche (12:30 is «las doce y media del mediodía»). */
import type { ClockTime } from '@/types'
import { numberWords } from './numeric'

export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const

/** Months with 30 or 31 days. February is left out on purpose: its length depends on the year. */
export const MONTHS_30_31: { name: string; days: number }[] = [
  { name: 'enero', days: 31 }, { name: 'marzo', days: 31 }, { name: 'abril', days: 30 }, { name: 'mayo', days: 31 },
  { name: 'junio', days: 30 }, { name: 'julio', days: 31 }, { name: 'agosto', days: 31 }, { name: 'septiembre', days: 30 },
  { name: 'octubre', days: 31 }, { name: 'noviembre', days: 30 }, { name: 'diciembre', days: 31 },
]

export type DayPeriod = 'de la mañana' | 'del mediodía' | 'de la tarde' | 'de la noche'

export const pad2 = (n: number): string => String(n).padStart(2, '0')

/** The hour on the face: 0 and 12 → 12, 13 → 1. */
export function faceHour(h: number): number {
  const r = ((h % 12) + 12) % 12
  return r === 0 ? 12 : r
}

/** Period of the day for a 24 h hour (the phrase says it: «de la tarde»). */
export function periodOf(hour24: number): DayPeriod {
  if (hour24 >= 6 && hour24 < 12) return 'de la mañana'
  if (hour24 === 12) return 'del mediodía'
  if (hour24 >= 13 && hour24 < 21) return 'de la tarde'
  return 'de la noche'
}

const hourWord = (h: number) => (h === 1 ? 'la una' : `las ${numberWords(h)}`)

/**
 * The phrase of a time, as a Spanish child says it. `hour24` may be 0..23 or a face hour 1..12 (both give the same
 * face). With `withPeriod`, the period of the day is added (it is decided by the 24 h hour, so pass 0..23 for that).
 */
export function clockPhrase(hour24: number, minute: number, withPeriod = false): string {
  const h = faceHour(hour24)
  const next = faceHour(hour24 + 1)
  let body: string
  if (minute === 0) body = `${hourWord(h)} en punto`
  else if (minute === 30) body = `${hourWord(h)} y media`
  else if (minute === 15) body = `${hourWord(h)} y cuarto`
  else if (minute === 45) body = `${hourWord(next)} menos cuarto`
  else if (minute < 30) body = `${hourWord(h)} y ${numberWords(minute)}`
  else body = `${hourWord(next)} menos ${numberWords(60 - minute)}`
  return withPeriod ? `${body} ${periodOf(hour24)}` : body
}

/** Digital 24 h text: 14:30. */
export function digital(hour24: number, minute: number): string {
  return `${pad2(hour24)}:${pad2(minute)}`
}

const WORD_TO_NUMBER: Map<string, number> = (() => {
  const m = new Map<string, number>()
  for (let n = 0; n <= 59; n++) m.set(numberWords(n), n)
  return m
})()

const PERIOD_WORDS: Record<string, 'mañana' | 'tarde' | 'noche' | 'mediodía'> = {
  'de la mañana': 'mañana', 'de la tarde': 'tarde', 'de la noche': 'noche', 'del mediodía': 'mediodía',
}

/**
 * Reads a phrase made by clockPhrase back into a 24 h time. Returns null when the text is not a time phrase.
 * Without a period, a face hour 6–11 is the morning, 12 is noon and 1–5 are taken as the afternoon (13–17).
 */
export function parseClockPhrase(text: string): { hour24: number; minute: number } | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ')
  const m = t.match(/^(la una|las [a-záéíóúñ]+)(?: (en punto|y media|y cuarto|menos cuarto|y [a-záéíóúñ]+|menos [a-záéíóúñ]+))?(?: (de la mañana|de la tarde|de la noche|del mediodía))?$/)
  if (!m) return null
  const hourText = m[1] === 'la una' ? 1 : WORD_TO_NUMBER.get(m[1].slice(4))
  if (hourText === undefined || hourText < 1 || hourText > 12) return null
  let face = hourText
  let minute = 0
  const body = m[2] ?? 'en punto'
  if (body === 'en punto') minute = 0
  else if (body === 'y media') minute = 30
  else if (body === 'y cuarto') minute = 15
  else if (body === 'menos cuarto') { minute = 45; face = faceHour(face - 1) }
  else if (body.startsWith('y ')) {
    const n = WORD_TO_NUMBER.get(body.slice(2))
    if (n === undefined || n < 1 || n > 29) return null
    minute = n
  } else if (body.startsWith('menos ')) {
    const n = WORD_TO_NUMBER.get(body.slice(6))
    if (n === undefined || n < 1 || n > 29) return null
    minute = 60 - n
    face = faceHour(face - 1)
  } else return null
  const period = m[3] ? PERIOD_WORDS[m[3]] : undefined
  let hour24: number
  if (period === 'mañana') hour24 = face
  else if (period === 'tarde' || period === 'mediodía') hour24 = face === 12 ? 12 : face + 12
  else if (period === 'noche') hour24 = face === 12 ? 0 : face <= 5 ? face : face + 12
  else hour24 = face >= 6 && face <= 11 ? face : face === 12 ? 12 : face + 12
  return { hour24, minute }
}

/** Face time after adding minutes to a face time (12-hour circle). */
export function addFace(start: ClockTime, minutes: number): ClockTime {
  const total = ((start.hour % 12) * 60 + start.minute + minutes) % 720
  const h = Math.floor(total / 60)
  return { hour: h === 0 ? 12 : h, minute: total % 60 }
}

/** Minutes from one face time to the next one going forward (less than 12 h). */
export function minutesFace(from: ClockTime, to: ClockTime): number {
  return (((to.hour % 12) * 60 + to.minute) - ((from.hour % 12) * 60 + from.minute) + 720) % 720
}

/** Same face time? (12 and 0 are the same hour on the face). */
export function sameFace(a: ClockTime, b: { hour: number | null; minute: number | null }): boolean {
  return b.hour !== null && b.minute !== null && faceHour(b.hour) === faceHour(a.hour) && b.minute === a.minute
}

/** Spanish label of a duration in minutes: 90 → «1 hora y media», 45 → «45 minutos», 60 → «1 hora». */
export function durationWords(minutes: number): string {
  if (minutes === 60) return '1 hora'
  if (minutes === 90) return '1 hora y media'
  if (minutes === 120) return '2 horas'
  if (minutes % 60 === 0) return `${minutes / 60} horas`
  return `${minutes} minutos`
}
