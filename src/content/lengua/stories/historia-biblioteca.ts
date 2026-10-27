/* Original story, written for Repasitos: a noisy rooster in a quiet library, and a red hat that decides who may speak. */
import type { ReadingDef } from '@/types'

export const historiaBiblioteca: ReadingDef = {
  id: 'historia-biblioteca',
  title: 'Silencio en la biblioteca',
  text: [
    'En la biblioteca del bosque había una regla muy clara: silencio. Pero el gallo Gaspar no sabía hablar bajito. Cuando decía «buenos días», se oía hasta en el río.',
    'La bibliotecaria, una lechuza llamada Clara, levantó una pluma y susurró: —Shhh.',
    'Gaspar no la oyó, porque estaba cantando a grito pelado su canción favorita, que tenía muchos quiquiriquís.',
    '{child} quiso ayudar. Pensó: «Si Gaspar no puede hablar bajito, tendrá que hablar de otra forma».',
    '{child} buscó en la caja de disfraces y sacó un sombrero rojo. —Este sombrero es mágico —dijo—. Cuando lo llevas puesto, eres el único que puede hablar. Los demás, a escuchar.',
    'Gaspar se puso el sombrero, muy orgulloso, y dijo en una voz tan bajita que casi no se oía: —Buenos días.',
    'Los animales se rieron en silencio, con las manos tapándose la boca. Clara sonrió y dijo: —Hoy sí que se oye el silencio.',
    'Desde entonces, el sombrero rojo pasa de pico en pico, y {pet} lo guarda en su mochila para que nunca falte.',
    'Gaspar ha aprendido a hablar bajito. Casi siempre.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿De qué trata la historia?',
      options: [
        'De cómo se consigue el silencio en una biblioteca con un gallo muy ruidoso.',
        'De un gallo que quiere ser bibliotecario.',
        'De una lechuza que se queda dormida en su silla.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué se sacó de la caja de disfraces?',
      options: [
        'Un sombrero rojo.',
        'Una pluma grande.',
        'Un silbato.',
      ],
      answer: 0,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'Gaspar canta tan fuerte que nadie oye a la bibliotecaria.',
        'Alguien saca un sombrero rojo de la caja.',
        'Gaspar dice «buenos días» en una voz muy bajita.',
        'Los animales se ríen en silencio.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué ave es la bibliotecaria?',
      answer: 'lechuza',
      rule: 'ignore-case',
    },
  ],
}
