/* Original poem, written for Repasitos: four stanzas of four lines, rhyming in pairs (AABB). Each stanza is a paragraph; the
   lines are kept with line breaks. */
import type { ReadingDef } from '@/types'

export const poemaLluvia: ReadingDef = {
  id: 'poema-lluvia',
  title: 'Un día de lluvia',
  text: [
    'Hoy Lumi quiere recitar un poema a {child} y a {pet}. Es un poema sobre un día de lluvia, en el que las cosas se portan de forma muy rara. Escuchad con atención, porque las rimas van escondidas al final de los versos, como las semillas en una tarta.',
    'Hoy llueve sin parar,\ny el sol se fue a jugar.\nMi paraguas, muy nervioso,\nquiso ser un barco hermoso.',
    'Me puse botas de goma\ny salté como una paloma.\nUn charco fue mi mar,\ny me puse a nadar.',
    'Mi gorro, con gran prisa,\nvoló como una brisa.\nPasó sobre un tejado\ny se quedó colgado.',
    'El sol volvió a salir\ny me hizo reír.\nMi paraguas, al final,\ndijo: ¡qué día tan genial!',
  ],
  skills: ['lng:lit:rima', 'lng:lect:idea-principal', 'lng:lect:preguntas'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lit:rima',
      prompt: '¿Qué palabra de la primera estrofa rima con «parar»?',
      options: ['jugar', 'nervioso', 'hermoso'],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lit:rima',
      prompt: '¿Qué palabra de la segunda estrofa rima con «goma»?',
      options: ['botas', 'paloma', 'charco'],
      answer: 1,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿De qué trata el poema?',
      options: [
        'De un día de lluvia que se pasa con alegría.',
        'De un paseo por el parque en un día de sol.',
        'De un perro que busca su pelota en el jardín.',
      ],
      answer: 0,
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué prenda voló como una brisa?',
      answer: 'gorro',
      rule: 'ignore-case',
    },
  ],
}
