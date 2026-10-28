import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { GEOMETRIA_CLASSES } from './grade3-geometria'

const GEOMETRY_TOPICS = ['poligonos', 'rectas', 'rectas-segmentos', 'angulos-rectos', 'angulos-clase', 'circulo-cuerpos', 'perimetro', 'recorridos']

describe('clases de geometría (3.º)', () => {
  it('every geometry topic has its class', () => {
    for (const id of GEOMETRY_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
    expect(GEOMETRIA_CLASSES).toHaveLength(GEOMETRY_TOPICS.length)
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    for (const cls of GEOMETRIA_CLASSES) {
      expect(cls.phases.guiada, cls.lesson.id).toBe(2)
      expect(cls.phases.sola, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(cls.phases.sola, cls.lesson.id).toBeLessThanOrEqual(4)
      expect(cls.phases.cierre, cls.lesson.id).toBe(1)
      expect(cls.phases.para, cls.lesson.id).toBeGreaterThanOrEqual(1)
      expect(cls.phases.ejemplo, cls.lesson.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('every try generates an exercise of its own topic, for every seed tried', () => {
    const topics = syllabusForGrade(3).blocks.flatMap((b) => b.topics)
    for (const cls of GEOMETRIA_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const tries = cls.lesson.steps.filter((s) => s.interaction === 'try')
      expect(tries.length, cls.lesson.id).toBe(cls.phases.guiada + cls.phases.sola)
      for (const step of tries) {
        for (let seed = 1; seed <= 20; seed++) {
          const [exercise] = generate(step.trySelector!, 1, { rng: createRng(seed) })
          expect(exercise, cls.lesson.id).toBeDefined()
          expect(topic.skills, `${cls.lesson.id}: ${exercise.skill} (seed ${seed})`).toContain(exercise.skill)
        }
      }
    }
  })

  it('names are right: pentágono and hexágono in poligonos, cuadrilátero for four sides', () => {
    const said = JSON.stringify(GEOMETRIA_CLASSES.find((c) => c.topicId === 'poligonos')!.lesson.steps)
    expect(said).toContain('pentágono')
    expect(said).toContain('hexágono')
    expect(said).toContain('cuadrilátero')
  })

  it('a cuadrado has 4 equal sides AND 4 right corners: every sentence that names it says both (a rombo is not one)', () => {
    const sentences = GEOMETRIA_CLASSES.flatMap((c) => c.lesson.steps.map((st) => st.text)).flatMap((t) => t.split('.'))
    const named = sentences.filter((t) => /cuadrado/.test(t))
    expect(named.length).toBeGreaterThan(0)
    for (const t of named) expect(t, t).toMatch(/esquinas rectas/)
    for (const t of named) expect(t, t).toMatch(/lados iguales/)
    expect(JSON.stringify(GEOMETRIA_CLASSES)).not.toMatch(/lados son iguales, es un cuadrado/)
  })

  it('recorridos: the start is the gold cell, every arrow is explained before the tries, and the routes fit the 4 by 5 grid', () => {
    const cls = GEOMETRIA_CLASSES.find((c) => c.topicId === 'recorridos')!
    const [first, second] = cls.lesson.steps
    expect(first.text).toMatch(/casilla dorada/)
    expect(second.text).toMatch(/→/)
    expect(second.text).toMatch(/←/)
    expect(second.text).toMatch(/↑/)
    expect(second.text).toMatch(/↓/)
    expect(JSON.stringify(cls.lesson.steps)).not.toMatch(/estrella/)
    for (const st of cls.lesson.steps.filter((x) => x.visual === 'grid-route')) {
      let r = 0
      let c = 0
      const cells = [[0, 0]]
      for (const letter of String(st.params!.route).split(',')) {
        r += { U: -1, D: 1, L: 0, R: 0 }[letter]!
        c += { L: -1, R: 1, U: 0, D: 0 }[letter]!
        cells.push([r, c])
      }
      const rows = Math.max(...cells.map((x) => x[0])) - Math.min(...cells.map((x) => x[0])) + 1
      const cols = Math.max(...cells.map((x) => x[1])) - Math.min(...cells.map((x) => x[1])) + 1
      expect(rows, String(st.params!.route)).toBeLessThanOrEqual(4)
      expect(cols, String(st.params!.route)).toBeLessThanOrEqual(5)
    }
  })

  it('angulos-clase: agudo is smaller and obtuso bigger than a right angle', () => {
    const cls = GEOMETRIA_CLASSES.find((c) => c.topicId === 'angulos-clase')!
    const said = JSON.stringify(cls.lesson.steps)
    expect(said).toMatch(/agudo[^."]*menos de 90/i)
    expect(said).toMatch(/obtuso[^."]*más de 90/i)
    expect(said).not.toMatch(/agudo[^."]*más de 90/i)
  })

  it('circulo-cuerpos: the solids that roll are the sphere, the cylinder and the cone; the cube, prism and pyramid do not', () => {
    const cls = GEOMETRIA_CLASSES.find((c) => c.topicId === 'circulo-cuerpos')!
    const rule = cls.lesson.steps[cls.lesson.steps.length - 1]
    expect(rule.text).toMatch(/esfera, el cilindro y el cono/)
    expect(rule.text).toMatch(/cubo, el prisma y la pirámide no ruedan/)
  })

  it('perimetro: the sum of the sides is written as the sum, with its unit', () => {
    const cls = GEOMETRIA_CLASSES.find((c) => c.topicId === 'perimetro')!
    expect(JSON.stringify(cls.lesson.steps)).toContain('3 + 4 + 3 + 4 = 14 cm')
    expect(cls.lesson.steps[cls.lesson.steps.length - 1].text).toMatch(/suma de todos los lados/)
  })

  it('recorridos: the route drawings only use the letters R, L, U and D', () => {
    const cls = GEOMETRIA_CLASSES.find((c) => c.topicId === 'recorridos')!
    for (const st of cls.lesson.steps.filter((s) => s.visual === 'grid-route')) {
      expect(String(st.params!.route), st.text).toMatch(/^[RLUD](,[RLUD])*$/)
    }
  })

  it('no class says «Sin pistas»', () => {
    expect(JSON.stringify(GEOMETRIA_CLASSES)).not.toMatch(/Sin pistas/)
  })
})
