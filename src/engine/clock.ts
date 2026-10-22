/* Tiempo (PLAN_DOCENTE §1.9 and §5.7; 3.º block D): reading and setting an analogue clock, 24 h digital ↔ phrases,
   durations on a time line, and the calendar and units of time. Pure: generators, checks and hints.
   Hints guide the strategy and never state the answer; the checks name the kind of mistake (hour, minutes, period).
   Set and read use the face (1..12). Minutes are multiples of 5 only. */
import type {
  Answer, CalendarExercise, CheckResult, ClockReadExercise, ClockSetExercise, ClockTime, Exercise, Hint, Rng,
  SkillKey, TimeConvertExercise, TimeDurationExercise,
} from '@/types'
import { pick, randInt, range, shuffle } from './rng'
import { clockConvertSkill, calendarSkill, clockReadSkill, clockSetSkill, parseSkill, timeDurationSkill, type ParsedSkill } from './skills'
import { addFace, clockPhrase, digital, faceHour, MONTHS_30_31, parseClockPhrase, WEEKDAYS } from './time'

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none'): Hint => ({ level, text, visual })

/** Minutes each read step asks for. clock:read:30 = en punto and y media; :15 = cuartos; :5 = every 5 minutes. */
const READ_MINUTES: Record<30 | 15 | 5, number[]> = { 30: [0, 30], 15: [15, 45], 5: range(0, 11).map((i) => i * 5) }
/** Minutes each set step asks for. clock:set:30 = the quarters; :5 = every 5 minutes. */
const SET_MINUTES: Record<30 | 5, number[]> = { 30: [0, 15, 30, 45], 5: range(0, 11).map((i) => i * 5) }
const DURATIONS = { end: [15, 30, 45, 60, 90, 120], elapsed: [15, 20, 30, 40, 45, 60, 75, 90, 120] } as const

const UNIT_FACTS: { from: string; to: string; amount: number; answer: number; prompt: string }[] = [
  { from: 'hora', to: 'minutos', amount: 1, answer: 60, prompt: '¿Cuántos minutos tiene una hora?' },
  { from: 'minuto', to: 'segundos', amount: 1, answer: 60, prompt: '¿Cuántos segundos tiene un minuto?' },
  { from: 'día', to: 'horas', amount: 1, answer: 24, prompt: '¿Cuántas horas tiene un día?' },
  { from: 'semana', to: 'días', amount: 1, answer: 7, prompt: '¿Cuántos días tiene una semana?' },
  { from: 'hora', to: 'minutos', amount: 2, answer: 120, prompt: '¿Cuántos minutos tienen dos horas?' },
  { from: 'día', to: 'horas', amount: 2, answer: 48, prompt: '¿Cuántas horas tienen dos días?' },
  { from: 'semana', to: 'días', amount: 2, answer: 14, prompt: '¿Cuántos días tienen dos semanas?' },
  { from: 'minuto', to: 'segundos', amount: 2, answer: 120, prompt: '¿Cuántos segundos tienen dos minutos?' },
]

const clampDifficulty = (n: number) => Math.max(1, Math.min(5, Math.round(n)))

/** Try `make` until its id is free (a few tries, then the last one). */
function fresh<T extends Exercise>(make: () => T, used: Set<string>, tries = 14): T {
  let last = make()
  for (let i = 0; i < tries && used.has(last.id); i++) last = make()
  return last
}

// ---------------------------------------------------------------- makers

/** The three phrases of a read item: the right one and two that children mix it up with (hour or minutes). */
function phraseOptions(hour: number, minute: number, rng: Rng, withPeriod: boolean, periodHour?: number): { options: string[]; correct: number } {
  const correct = clockPhrase(hour, minute, withPeriod)
  const candidates: [number, number][] = withPeriod && periodHour !== undefined
    ? [[(periodHour + 12) % 24, minute], [(periodHour + 1) % 24, minute], [(periodHour + 23) % 24, minute], [periodHour, (minute + 30) % 60]]
    : [[faceHour(hour + 1), minute], [faceHour(hour - 1), minute], [hour, (minute + 30) % 60], [hour, (minute + 15) % 60]]
  const seen = new Set([correct])
  const wrong: string[] = []
  for (const [h, m] of shuffle(rng, candidates)) {
    if (wrong.length === 2) break
    const text = withPeriod && periodHour !== undefined ? clockPhrase(h, m, true) : clockPhrase(h, m, false)
    if (!seen.has(text)) { seen.add(text); wrong.push(text) }
  }
  const all = shuffle(rng, [correct, ...wrong])
  return { options: all, correct: all.indexOf(correct) }
}

export function makeClockRead(hour: number, minute: number, mode: 'phrase' | 'write', rng: Rng, step: 30 | 15 | 5 = minute % 15 === 0 && minute % 30 === 0 ? 30 : minute % 15 === 0 ? 15 : 5): ClockReadExercise {
  const { options, correct } = mode === 'phrase' ? phraseOptions(hour, minute, rng, false) : { options: [], correct: -1 }
  return {
    id: `clock-read:${hour}:${minute}:${mode}`, kind: 'clock-read', skill: clockReadSkill(step),
    difficulty: clampDifficulty((step === 30 ? 1 : step === 15 ? 2 : 3) + (mode === 'write' ? 1 : 0)),
    hour, minute, mode, options, correct, answer: { hour, minute },
  }
}

export function makeClockSet(hour: number, minute: number, step: 30 | 5 = minute % 15 === 0 ? 30 : 5): ClockSetExercise {
  return {
    id: `clock-set:${hour}:${minute}`, kind: 'clock-set', skill: clockSetSkill(step), difficulty: step === 30 ? 2 : 3,
    prompt: clockPhrase(hour, minute), answer: { hour, minute },
  }
}

export function makeTimeConvert(hour24: number, minute: number, direction: 'to-digital' | 'to-phrase', rng: Rng): TimeConvertExercise {
  const phrase = clockPhrase(hour24, minute, true)
  const { options, correct } = direction === 'to-phrase'
    ? phraseOptions(hour24, minute, rng, true, hour24)
    : { options: [], correct: -1 }
  return {
    id: `time-convert:${direction}:${digital(hour24, minute)}`, kind: 'time-convert', skill: clockConvertSkill(),
    difficulty: direction === 'to-digital' ? 3 : 2, direction, phrase, options, correct,
    answer: { hour: hour24, minute },
  }
}

export function makeTimeDuration(ask: 'end' | 'elapsed', start: ClockTime, duration: number): TimeDurationExercise {
  const end = addFace(start, duration)
  return {
    id: `time-duration:${ask}:${start.hour}:${start.minute}:${duration}`, kind: 'time-duration', skill: timeDurationSkill(ask),
    difficulty: ask === 'end' ? 3 : 4, ask, start: { ...start }, duration, end: { ...end },
    answer: ask === 'end' ? end : duration,
  }
}

export function makeCalendarUnits(fact: (typeof UNIT_FACTS)[number]): CalendarExercise {
  return {
    id: `calendar:units:${fact.from}:${fact.amount}:${fact.to}`, kind: 'calendar', skill: calendarSkill('units'),
    difficulty: fact.amount === 1 ? 2 : 3, topic: 'units', prompt: fact.prompt, options: [], answer: fact.answer,
    units: { amount: fact.amount, from: fact.from, to: fact.to },
  }
}

export function makeCalendarWeekday(today: number, days: number, rng: Rng): CalendarExercise {
  const target = (today + days) % 7
  const distractors = shuffle(rng, [(target + 1) % 7, (target + 6) % 7, (today) % 7, (target + 3) % 7, (target + 2) % 7])
    .filter((d) => d !== target && d !== today)
  const picked = [target, ...distractors.slice(0, 3)]
  const options = shuffle(rng, picked).map((d) => WEEKDAYS[d])
  return {
    id: `calendar:weekday:${today}:${days}`, kind: 'calendar', skill: calendarSkill('weekday'), difficulty: 2, topic: 'weekday',
    prompt: `Hoy es ${WEEKDAYS[today]}. ¿Qué día será dentro de ${days} ${days === 1 ? 'día' : 'días'}?`,
    options, answer: options.indexOf(WEEKDAYS[target]), week: { today, days },
  }
}

export function makeCalendarMonth(month: { name: string; days: number }): CalendarExercise {
  return {
    id: `calendar:month:${month.name}`, kind: 'calendar', skill: calendarSkill('month'), difficulty: 2, topic: 'month',
    prompt: `¿Cuántos días tiene ${month.name}?`, options: [], answer: month.days, month: month.name,
  }
}

// ---------------------------------------------------------------- generation

/** One exercise of a clock, time or calendar skill. `writeMode`: the read item asks for the hour and minutes (not the phrase). */
export function buildClock(skill: SkillKey, rng: Rng, used: Set<string>, writeMode: boolean): Exercise | null {
  const p: ParsedSkill | null = parseSkill(skill)
  if (!p) return null
  switch (p.type) {
    case 'clock-read':
      return fresh(() => makeClockRead(randInt(rng, 1, 12), pick(rng, READ_MINUTES[p.step]), writeMode ? 'write' : 'phrase', rng, p.step), used)
    case 'clock-set':
      return fresh(() => makeClockSet(randInt(rng, 1, 12), pick(rng, SET_MINUTES[p.step]), p.step), used)
    case 'clock-convert':
      return fresh(() => {
        const dir = rng() < 0.5 ? 'to-digital' : 'to-phrase'
        return makeTimeConvert(randInt(rng, 0, 23), pick(rng, range(0, 11).map((i) => i * 5)), dir, rng)
      }, used)
    case 'time-duration':
      return fresh(() => {
        const start = { hour: randInt(rng, 1, 12), minute: pick(rng, range(0, 11).map((i) => i * 5)) }
        return makeTimeDuration(p.ask, start, pick(rng, DURATIONS[p.ask]))
      }, used)
    case 'calendar':
      if (p.topic === 'units') return fresh(() => makeCalendarUnits(pick(rng, UNIT_FACTS)), used)
      if (p.topic === 'weekday') return fresh(() => makeCalendarWeekday(randInt(rng, 0, 6), randInt(rng, 1, 6), rng), used)
      return fresh(() => makeCalendarMonth(pick(rng, MONTHS_30_31)), used)
    default:
      return null
  }
}

/** Skill keys of the clock and calendar kinds (for universes of free play and the gallery). */
export function clockSkillsOf(kind: Exercise['kind']): SkillKey[] {
  switch (kind) {
    case 'clock-read': return [clockReadSkill(30), clockReadSkill(15), clockReadSkill(5)]
    case 'clock-set': return [clockSetSkill(30), clockSetSkill(5)]
    case 'time-convert': return [clockConvertSkill()]
    case 'time-duration': return [timeDurationSkill('end'), timeDurationSkill('elapsed')]
    case 'calendar': return [calendarSkill('units'), calendarSkill('weekday'), calendarSkill('month')]
    default: return []
  }
}

// ---------------------------------------------------------------- checks

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const res = (correct: boolean, given: string, expected: string, extra: Partial<CheckResult> = {}): CheckResult =>
  ({ correct, given, expected, ...extra })

/** The expected answer as text (logs and adult reports). */
export function expectedClock(ex: Exercise): string {
  switch (ex.kind) {
    case 'clock-read': return clockPhrase(ex.answer.hour, ex.answer.minute)
    case 'clock-set': return ex.prompt
    case 'time-convert': return digital(ex.answer.hour, ex.answer.minute)
    case 'time-duration': return ex.ask === 'end' ? clockPhrase(ex.end.hour, ex.end.minute) : `${ex.duration} minutos`
    case 'calendar': return ex.topic === 'weekday' ? ex.options[ex.answer] : String(ex.answer)
    default: return ''
  }
}

/** How a child's time differs from the expected face time: hour, minutes or nothing. */
function timeMistake(expected: ClockTime, given: { hour: number | null; minute: number | null }): 'ok' | 'hour' | 'minute' | 'both' | 'incomplete' {
  if (given.hour === null || given.minute === null) return 'incomplete'
  const hourOk = given.hour >= 1 && given.hour <= 12 && given.hour % 12 === expected.hour % 12
  const minuteOk = given.minute === expected.minute
  if (hourOk && minuteOk) return 'ok'
  if (hourOk) return 'minute'
  if (minuteOk) return 'hour'
  return 'both'
}

const FEEDBACK_HOUR = '¡Casi! Revisa la hora: la aguja corta marca la hora. Si los minutos ya pasan de la y media, la hora es la siguiente.'
const FEEDBACK_MINUTE = '¡Casi! La hora está bien. Cuenta los minutos de cinco en cinco con la aguja larga.'
const FEEDBACK_BOTH = '¡Casi! Mira primero la aguja corta (la hora) y después la larga (los minutos).'
const PERIOD_FEEDBACK = '¡Casi! Mira el momento del día: en el reloj de 24 horas, lo de la tarde y de la noche sigue contando después de las 12.'

/** Shared judgement of a time written by the child against a face time. */
function judgeFace(expected: ClockTime, answer: Answer, expectedText: string, ok: string): CheckResult {
  if (answer.type !== 'time') return res(false, '', expectedText, { errorType: 'other', feedback: 'Escribe la hora y los minutos.' })
  const given = `${answer.hour ?? '?'}:${answer.minute === null ? '??' : String(answer.minute).padStart(2, '0')}`
  const m = timeMistake(expected, answer)
  if (m === 'ok') return res(true, given, expectedText, { feedback: ok })
  if (m === 'incomplete') return res(false, given, expectedText, { errorType: 'incomplete', feedback: 'Escribe la hora y también los minutos.' })
  if (m === 'hour') return res(false, given, expectedText, { errorType: 'clock-hour', feedback: FEEDBACK_HOUR })
  if (m === 'minute') return res(false, given, expectedText, { errorType: 'clock-minute', feedback: FEEDBACK_MINUTE })
  return res(false, given, expectedText, { errorType: 'clock-hour', feedback: FEEDBACK_BOTH })
}

/** Check of the clock, time and calendar kinds. Returns null for other kinds. */
export function checkClock(ex: Exercise, answer: Answer): CheckResult | null {
  switch (ex.kind) {
    case 'clock-read': {
      const expected = clockPhrase(ex.answer.hour, ex.answer.minute)
      if (ex.mode === 'write') return judgeFace(ex.answer, answer, expected, '¡Muy bien! Esa es la hora del reloj.')
      if (answer.type !== 'choice') return res(false, '', expected, { errorType: 'other', feedback: 'Elige una frase.' })
      if (answer.index === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Elige la frase que dice la hora.' })
      const chosen = ex.options[answer.index] ?? ''
      if (answer.index === ex.correct) return res(true, chosen, expected, { feedback: '¡Muy bien! Esa es la hora del reloj.' })
      return res(false, chosen, expected, { errorType: wrongPhraseType(chosen, ex.answer), feedback: FEEDBACK_HOUR })
    }
    case 'clock-set': {
      const expected = ex.prompt
      return judgeFace(ex.answer, answer, expected, '¡Muy bien! El reloj marca esa hora.')
    }
    case 'time-convert': {
      const expectedDigital = digital(ex.answer.hour, ex.answer.minute)
      if (ex.direction === 'to-phrase') {
        if (answer.type !== 'choice') return res(false, '', expectedDigital, { errorType: 'other', feedback: 'Elige una frase.' })
        if (answer.index === null) return res(false, '?', expectedDigital, { errorType: 'incomplete', feedback: 'Elige la frase que dice esa hora.' })
        const chosen = ex.options[answer.index] ?? ''
        if (answer.index === ex.correct) return res(true, chosen, expectedDigital, { feedback: '¡Muy bien! Esa frase dice esa hora.' })
        return res(false, chosen, expectedDigital, { errorType: wrongPhraseType(chosen, ex.answer), feedback: PERIOD_FEEDBACK })
      }
      if (answer.type !== 'time') return res(false, '', expectedDigital, { errorType: 'other', feedback: 'Escribe la hora con dos números: horas y minutos.' })
      const given = `${answer.hour ?? '?'}:${answer.minute === null ? '??' : String(answer.minute).padStart(2, '0')}`
      if (answer.hour === null || answer.minute === null) return res(false, given, expectedDigital, { errorType: 'incomplete', feedback: 'Escribe las horas y los minutos.' })
      const exactHour = answer.hour === ex.answer.hour
      const minuteOk = answer.minute === ex.answer.minute
      if (exactHour && minuteOk) return res(true, given, expectedDigital, { feedback: '¡Muy bien! Ya sabes leer la hora de 24 horas.' })
      if (!exactHour && faceHour(answer.hour) === faceHour(ex.answer.hour) && minuteOk) {
        return res(false, given, expectedDigital, { errorType: 'clock-period', feedback: PERIOD_FEEDBACK })
      }
      if (exactHour) return res(false, given, expectedDigital, { errorType: 'clock-minute', feedback: FEEDBACK_MINUTE })
      return res(false, given, expectedDigital, { errorType: 'clock-hour', feedback: '¡Casi! Cuenta las horas desde la medianoche: de 0 a 23.' })
    }
    case 'time-duration': {
      const expectedText = ex.ask === 'end' ? clockPhrase(ex.end.hour, ex.end.minute) : `${ex.duration} minutos`
      if (ex.ask === 'end') return judgeFace(ex.end, answer, expectedText, '¡Muy bien! Has contado bien el tiempo.')
      if (answer.type !== 'number') return res(false, '', expectedText, { errorType: 'other', feedback: 'Escribe cuántos minutos pasan.' })
      const v = isNum(answer.value) ? answer.value : null
      if (v === null) return res(false, '?', expectedText, { errorType: 'incomplete', feedback: 'Escribe cuántos minutos pasan.' })
      if (v === ex.duration) return res(true, String(v), expectedText, { feedback: '¡Muy bien! Has contado de hora en hora y los minutos.' })
      return res(false, String(v), expectedText, { errorType: 'other', feedback: '¡Casi! Cuenta primero los minutos hasta la hora en punto y después las horas enteras.' })
    }
    case 'calendar': {
      if (ex.topic === 'weekday') {
        if (answer.type !== 'choice') return res(false, '', ex.options[ex.answer], { errorType: 'other', feedback: 'Elige un día de la semana.' })
        if (answer.index === null) return res(false, '?', ex.options[ex.answer], { errorType: 'incomplete', feedback: 'Elige el día.' })
        const chosen = ex.options[answer.index] ?? ''
        if (answer.index === ex.answer) return res(true, chosen, ex.options[ex.answer], { feedback: '¡Muy bien! Has contado bien los días.' })
        return res(false, chosen, ex.options[ex.answer], { errorType: 'other', feedback: '¡Casi! Cuenta los días uno a uno desde hoy.' })
      }
      if (answer.type !== 'number') return res(false, '', String(ex.answer), { errorType: 'other', feedback: 'Escribe el número.' })
      if (!isNum(answer.value)) return res(false, '?', String(ex.answer), { errorType: 'incomplete', feedback: 'Escribe el número.' })
      const given = String(answer.value)
      if (answer.value === ex.answer) return res(true, given, String(ex.answer), { feedback: '¡Muy bien! Lo sabes.' })
      const feedback = ex.topic === 'month'
        ? '¡Casi! Mira los nudillos: los meses de los nudillos son los largos.'
        : '¡Casi! Piensa en cuántas partes pequeñas tiene cada una.'
      return res(false, given, String(ex.answer), { errorType: 'fact', feedback })
    }
    default:
      return null
  }
}

/** Which mistake a wrong phrase is: another hour, other minutes, or only another period of the day. */
function wrongPhraseType(text: string, expected: { hour: number; minute: number }): 'clock-hour' | 'clock-minute' | 'clock-period' {
  const parsed = parseClockPhrase(text)
  if (!parsed) return 'clock-hour'
  if (faceHour(parsed.hour24) !== faceHour(expected.hour)) return 'clock-hour'
  if (parsed.minute !== expected.minute) return 'clock-minute'
  return 'clock-period'
}

// ---------------------------------------------------------------- hints

/** Progressive hints for the clock, time and calendar kinds. None of them states the answer. */
export function hintsClock(ex: Exercise): Hint[] | null {
  switch (ex.kind) {
    case 'clock-read':
      return [
        hint(1, 'Mira primero la aguja corta: dice la hora. La aguja larga dice los minutos.', 'clock'),
        hint(2, 'La aguja larga da una vuelta entera en 60 minutos. Cada número del reloj son 5 minutos: cuenta de 5 en 5 desde el 12.', 'clock'),
        hint(3, 'Cuenta primero los minutos de la aguja larga. Después di la hora: con «y» si ya han pasado de la hora, con «menos» si faltan para la siguiente.', 'clock'),
      ]
    case 'clock-set':
      return [
        hint(1, 'Pon primero la aguja larga en los minutos. La aguja corta se mueve un poco con ellos.', 'clock'),
        hint(2, 'Las frases hablan de 15, 30 y 45 minutos: «y cuarto», «y media» y «menos cuarto». Con «y», los minutos van después de la hora; con «menos», faltan para la siguiente.', 'clock'),
        hint(3, 'Cuenta de 5 en 5 desde el 12 hasta los minutos de la frase y suelta ahí la aguja larga. Después mueve la aguja corta a la hora.', 'clock'),
      ]
    case 'time-convert':
      if (ex.direction === 'to-phrase') {
        return [
          hint(1, 'Mira primero la hora (los números de la izquierda) y después los minutos.', 'clock'),
          hint(2, 'Los minutos: 15 es «y cuarto», 30 es «y media» y 45 es «menos cuarto».', 'clock'),
          hint(3, 'Descarta las frases con otra hora y mira el momento del día: de la mañana, de la tarde o de la noche.', 'clock'),
        ]
      }
      return [
        hint(1, 'Las frases con «y» cuentan los minutos después de la hora; las de «menos», los que faltan para la siguiente.', 'clock'),
        hint(2, '«De la mañana» es antes del mediodía; «de la tarde» va desde el mediodía hasta la noche; «de la noche» es el final del día.', 'clock'),
        hint(3, 'En el reloj de 24 horas, las horas de la tarde y de la noche siguen contando después de las 12. Escribe primero la hora y luego los minutos.', 'clock'),
      ]
    case 'time-duration':
      if (ex.ask === 'end') {
        return [
          hint(1, 'Dibuja la recta del tiempo: marca la hora de salida y cuenta hacia delante.', 'time-line'),
          hint(2, 'Una hora son 60 minutos. Una hora y media son 60 más 30 minutos.', 'time-line'),
          hint(3, 'Cuenta primero hasta la siguiente hora en punto y después las horas que faltan.', 'time-line'),
        ]
      }
      return [
        hint(1, 'Dibuja la recta del tiempo: marca la hora de inicio y la hora de llegada.', 'time-line'),
        hint(2, 'Cuenta primero los minutos que faltan para la hora en punto y después las horas enteras.', 'time-line'),
        hint(3, 'Suma los dos trozos: los minutos hasta la hora en punto y los minutos de las horas enteras.', 'time-line'),
      ]
    case 'calendar':
      if (ex.topic === 'weekday' && ex.week) {
        return [
          hint(1, 'Cuenta los días uno a uno, empezando por el día siguiente a hoy.', 'week'),
          hint(2, 'La semana es: lunes, martes, miércoles, jueves, viernes, sábado y domingo. Después del domingo vuelve el lunes.', 'week'),
          hint(3, `Hoy es ${WEEKDAYS[ex.week.today]}. Cuenta ${ex.week.days === 1 ? 'un día' : `${ex.week.days} días`} desde ahí, uno a uno.`, 'week'),
        ]
      }
      if (ex.topic === 'month' && ex.month) {
        return [
          hint(1, 'Mira los nudillos de una mano: los meses de los nudillos son los largos y los de los huecos son los cortos.', 'units'),
          hint(2, 'Cuenta los meses con los nudillos: enero en el primer nudillo, febrero en el primer hueco, marzo en el segundo nudillo, y así seguido.', 'units'),
          hint(3, `Busca ${ex.month} en esa cuenta: ¿cae en un nudillo o en un hueco?`, 'units'),
        ]
      }
      if (ex.units) {
        const { amount, from, to } = ex.units
        return [
          hint(1, 'Piensa en la unidad que pide el problema y en cuántas partes más pequeñas tiene.', 'units'),
          hint(2, `Lo que dice el problema son ${amount === 1 ? `1 ${from}` : `${amount} ${from}s`}. Mira cuántos ${to} tiene cada ${from}.`, 'units'),
          hint(3, `Cuenta cuántos ${to} tiene cada ${from} y repite esa cuenta ${amount === 1 ? 'una vez' : `${amount} veces`}.`, 'units'),
        ]
      }
      return null
    default:
      return null
  }
}

// ---------------------------------------------------------------- statements

/** Statement of a clock, time or calendar item for worked examples and adult reports (never the answer). */
export function statementClock(ex: Exercise): string | null {
  switch (ex.kind) {
    case 'clock-read': return 'Mira el reloj y di qué hora es'
    case 'clock-set': return `Pon el reloj en ${ex.prompt}`
    case 'time-convert': return ex.direction === 'to-digital' ? `Escribe la hora de 24 horas: ${ex.phrase}` : `¿Qué frase dice ${digital(ex.answer.hour, ex.answer.minute)}?`
    case 'time-duration': return ex.ask === 'end'
      ? `Empieza a las ${clockPhrase(ex.start.hour, ex.start.minute)} y dura ${ex.duration} minutos. ¿A qué hora acaba?`
      : `¿Cuántos minutos pasan de ${clockPhrase(ex.start.hour, ex.start.minute)} a ${clockPhrase(ex.end.hour, ex.end.minute)}?`
    case 'calendar': return ex.prompt
    default: return null
  }
}
