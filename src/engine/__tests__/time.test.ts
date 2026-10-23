import { describe, expect, it } from 'vitest'
import {
  addFace, clockPhrase, digital, durationWords, faceHour, minutesFace, parseClockPhrase, periodOf,
} from '../time'

describe('clockPhrase (how children say the time)', () => {
  it('uses en punto, y media, y cuarto and menos cuarto', () => {
    expect(clockPhrase(3, 0)).toBe('las tres en punto')
    expect(clockPhrase(3, 30)).toBe('las tres y media')
    expect(clockPhrase(3, 15)).toBe('las tres y cuarto')
    expect(clockPhrase(2, 45)).toBe('las tres menos cuarto')
  })

  it('counts the minutes after the hour with «y» and the minutes left with «menos»', () => {
    expect(clockPhrase(3, 20)).toBe('las tres y veinte')
    expect(clockPhrase(5, 10)).toBe('las cinco y diez')
    expect(clockPhrase(4, 50)).toBe('las cinco menos diez')
    expect(clockPhrase(4, 55)).toBe('las cinco menos cinco')
    expect(clockPhrase(4, 35)).toBe('las cinco menos veinticinco')
  })

  it('says la una for one o clock and crosses from 12 to la una', () => {
    expect(clockPhrase(1, 5)).toBe('la una y cinco')
    expect(clockPhrase(13, 0)).toBe('la una en punto')
    expect(clockPhrase(12, 0)).toBe('las doce en punto')
    expect(clockPhrase(12, 55)).toBe('la una menos cinco')
  })

  it('adds the period of the day for 24 h times', () => {
    expect(clockPhrase(14, 30, true)).toBe('las dos y media de la tarde')
    expect(clockPhrase(21, 5, true)).toBe('las nueve y cinco de la noche')
    expect(clockPhrase(8, 0, true)).toBe('las ocho en punto de la mañana')
    expect(clockPhrase(0, 30, true)).toBe('las doce y media de la noche')
    expect(clockPhrase(23, 50, true)).toBe('las doce menos diez de la noche')
  })

  it('writes the digital 24 h time with two digits per part', () => {
    expect(digital(14, 30)).toBe('14:30')
    expect(digital(5, 5)).toBe('05:05')
  })
})

describe('parseClockPhrase (reads what clockPhrase writes)', () => {
  it('reads every 24 h time back, with its period', () => {
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m++) {
        expect(parseClockPhrase(clockPhrase(h, m, true)), `${h}:${m}`).toEqual({ hour24: h, minute: m })
      }
    }
  })

  it('returns null for text that is not a time phrase', () => {
    expect(parseClockPhrase('hola')).toBeNull()
    expect(parseClockPhrase('las tres y treinta y siete')).toBeNull()
    expect(parseClockPhrase('las tres y veinte de la madrugada')).toBeNull()
  })
})

describe('face arithmetic', () => {
  it('maps 0 and 12 to the 12 of the face and 13 to 1', () => {
    expect(faceHour(0)).toBe(12)
    expect(faceHour(12)).toBe(12)
    expect(faceHour(13)).toBe(1)
    expect(faceHour(23)).toBe(11)
  })

  it('gives the period from the 24 h hour', () => {
    expect(periodOf(6)).toBe('de la mañana')
    expect(periodOf(11)).toBe('de la mañana')
    expect(periodOf(12)).toBe('del mediodía')
    expect(periodOf(13)).toBe('de la tarde')
    expect(periodOf(20)).toBe('de la tarde')
    expect(periodOf(21)).toBe('de la noche')
    expect(periodOf(0)).toBe('de la noche')
    expect(periodOf(5)).toBe('de la noche')
  })

  it('adds minutes on the 12-hour face and measures them forward', () => {
    expect(addFace({ hour: 4, minute: 15 }, 45)).toEqual({ hour: 5, minute: 0 })
    expect(addFace({ hour: 11, minute: 30 }, 60)).toEqual({ hour: 12, minute: 30 })
    expect(addFace({ hour: 12, minute: 0 }, 720)).toEqual({ hour: 12, minute: 0 })
    expect(minutesFace({ hour: 4, minute: 15 }, { hour: 5, minute: 0 })).toBe(45)
    expect(minutesFace({ hour: 5, minute: 0 }, { hour: 4, minute: 15 })).toBe(675)
  })

  it('names durations as children say them', () => {
    expect(durationWords(60)).toBe('1 hora')
    expect(durationWords(90)).toBe('1 hora y media')
    expect(durationWords(120)).toBe('2 horas')
    expect(durationWords(45)).toBe('45 minutos')
  })
})
