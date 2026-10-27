/* The Lengua temario of 3.º: its skill keys are valid engine skills, its ids are its own, and the course decides it
   (3.º has the six blocks; 2.º and 4.º have none yet). The maths temario does not change. */
import { describe, expect, it } from 'vitest'
import { isValidSkill, kindsForSkill, parseSkill, subjectOfSkill } from '@/engine'
import { allTopics, syllabusFor, syllabusForGrade, teachingOrder } from '@/content/syllabus'
import { LENGUA3_STAGES, LENGUA3_SYLLABUS } from '@/content/syllabus/lengua3'

const lengua = allTopics(LENGUA3_SYLLABUS)
const skills = lengua.flatMap((t) => t.skills)

describe('temario de Lengua de 3.º', () => {
  it('has the six blocks of the spec, in order', () => {
    expect(LENGUA3_SYLLABUS.blocks.map((b) => b.id)).toEqual(['gramatica', 'ortografia', 'vocabulario', 'lectura', 'literatura', 'escritura'])
    expect(LENGUA3_SYLLABUS.course).toBe(3)
  })

  it('every topic id is unique and starts with lng-, so class flags never collide with maths', () => {
    const ids = lengua.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id.startsWith('lng-')).toBe(true)
  })

  it('every topic is available and has skills (the escritura guiada topic is measured by its completion skill)', () => {
    for (const t of lengua) {
      expect(t.status, t.id).toBe('disponible')
      expect(t.skills.length, t.id).toBeGreaterThan(0)
    }
    expect(syllabusFor('language', 3).blocks.find((b) => b.id === 'escritura')?.topics.find((t) => t.id === 'lng-escritura-guiada')?.skills)
      .toEqual(['lng:escr:guiada'])
  })

  it('every skill key is a valid engine skill of the language subject, at most 64 characters', () => {
    expect(skills.length).toBeGreaterThan(0)
    for (const s of skills) {
      expect(isValidSkill(s), s).toBe(true)
      expect(s.startsWith('lng:'), s).toBe(true)
      expect(s.length, s).toBeLessThanOrEqual(64)
      expect(subjectOfSkill(s), s).toBe('language')
    }
    expect(new Set(skills).size).toBe(skills.length)
  })

  it('parses a skill key into its area, item and level', () => {
    expect(parseSkill('lng:gram:sustantivo:genero')).toEqual({ type: 'lengua', area: 'gram', item: 'sustantivo', level: 'genero' })
    expect(parseSkill('lng:escr:copia')).toEqual({ type: 'lengua', area: 'escr', item: 'copia' })
    for (const bad of ['lng:xxx:copia', 'lng:gram', 'lng:gram:', 'lng:gram:Sustantivo', 'lng:gram:a:b:c', 'lng:']) {
      expect(parseSkill(bad), bad).toBeNull()
    }
  })

  it('the grammar, spelling, vocabulary, dictation, reading and literature skills have exercise kinds; copy and guided writing have none yet', () => {
    // Copia y escritura guiada llegan en sus tareas: sin tipo de ejercicio por ahora.
    const practised = (k: string) => /^lng:(gram|orto|voc|lect|lit):|^lng:escr:dictado$/.test(k)
    const withKinds = skills.filter(practised)
    expect(withKinds.length).toBeGreaterThan(0)
    for (const s of withKinds) expect(kindsForSkill(s).length, s).toBeGreaterThan(0)
    for (const s of skills.filter((k) => !practised(k))) expect(kindsForSkill(s), s).toEqual([])
  })

  it('teaches every topic in exactly one stage, eight stages over three trimesters, with no world', () => {
    expect(LENGUA3_STAGES).toHaveLength(8)
    const staged = LENGUA3_STAGES.flatMap((st) => st.topics)
    expect(new Set(staged).size).toBe(staged.length)
    expect([...staged].sort()).toEqual(lengua.map((t) => t.id).sort())
    for (const st of LENGUA3_STAGES) expect(st.worldId, st.id).toBeUndefined()
    const terms = LENGUA3_STAGES.map((st) => st.term)
    expect(terms).toEqual([...terms].sort())
    expect(new Set(terms)).toEqual(new Set([1, 2, 3]))
    expect(teachingOrder(LENGUA3_SYLLABUS).map((t) => t.id)).toEqual(staged)
  })

  it('syllabusFor gives the 3.º temario to the language subject for grade 3 and to a child without a course', () => {
    expect(syllabusFor('language', 3)).toBe(LENGUA3_SYLLABUS)
    expect(syllabusFor('language')).toBe(LENGUA3_SYLLABUS)
  })

  it('syllabusFor gives language no topics for 2.º and 4.º, until their temarios exist', () => {
    for (const grade of [2, 4]) {
      const s = syllabusFor('language', grade)
      expect(allTopics(s), `grade ${grade}`).toEqual([])
      expect(s.course).toBe(grade)
    }
  })

  it('syllabusFor for maths is syllabusForGrade, unchanged', () => {
    for (const grade of [undefined, 2, 3, 4]) expect(syllabusFor('math', grade)).toBe(syllabusForGrade(grade))
    expect(teachingOrder(syllabusForGrade(3)).map((t) => t.id)).toMatchInlineSnapshot(`
      [
        "descomponer-9999",
        "leer-escribir-9999",
        "comparar-ordenar-9999",
        "ordinales",
        "tabla-2",
        "tabla-5",
        "tabla-10",
        "completar",
        "monedas-billetes",
        "suma-2d",
        "suma-3d-sin-llevar",
        "suma-3d-llevando",
        "suma-4d",
        "redondear",
        "decenas-centenas",
        "igualdad",
        "prob-sumar",
        "reloj-en-punto-media-cuarto",
        "tabla-3",
        "tabla-4",
        "tabla-6",
        "dobles-mitades",
        "doble-triple",
        "prob-multiplicar",
        "poligonos",
        "rectas",
        "rectas-segmentos",
        "resta-3d-sin-llevar",
        "resta-3d-prestando",
        "resta-con-ceros",
        "resta-4d",
        "prob-restar",
        "compensar",
        "euros-centimos",
        "pagar-cambio",
        "tabla-8",
        "reloj-5-minutos",
        "calendario",
        "unidades-longitud",
        "regla",
        "angulos-rectos",
        "angulos-clase",
        "graficos-tablas",
        "graficos",
        "tabla-7",
        "tabla-9",
        "fracciones-mitad-cuarto",
        "fraccion-cantidad",
        "sumar-precios",
        "circulo-cuerpos",
        "recorridos",
        "numeros-5-cifras",
        "mul-2x1-sin-llevar",
        "mul-2x1-llevando",
        "mul-10-100",
        "mul-3x1",
        "reloj-digital",
        "duraciones",
        "unidades-masa-capacidad",
        "medir-problemas",
        "perimetro",
        "fracciones-comparar",
        "encuentra-error",
        "probabilidad",
        "div-con-tablas",
        "div-exacta",
        "div-resto",
        "prob-dividir",
        "div-larga",
        "div-3x1",
        "prob-dos-pasos",
        "comprobar-resultado",
        "fracciones-mas-partes",
        "mul-2-cifras-intro",
      ]
    `)
  })
})
