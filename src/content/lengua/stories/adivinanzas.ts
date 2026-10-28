/* Original riddles and tongue twisters, written for Repasitos. Each one is a very short reading with one question. The riddles
   are answered in writing (lng:lit:adivinanzas); the tongue twisters are read and a question is answered (lng:lit:trabalenguas). */
import type { ReadingDef, ReadingQuestion } from '@/types'

const RIDDLE_Q = (answer: string): ReadingQuestion => ({
  kind: 'text',
  skill: 'lng:lit:adivinanzas',
  prompt: 'Escribe la respuesta de la adivinanza.',
  answer,
  rule: 'ignore-case',
})

const riddle = (id: string, title: string, text: string[], answer: string): ReadingDef => ({
  id,
  title,
  text,
  skills: ['lng:lit:adivinanzas'],
  questions: [RIDDLE_Q(answer)],
})

export const adivinanzaMesa = riddle('adivinanza-mesa', 'Adivinanza de la mesa', [
  'Tengo cuatro patas y no puedo correr.\nSobre mí se pone la comida y se hacen los deberes.\n¿Qué soy?',
], 'mesa')

export const adivinanzaParaguas = riddle('adivinanza-paraguas', 'Adivinanza del paraguas', [
  'Me abro cuando llueve y me guardo cuando sale el sol.\nMe llevas en la mano y no me mojo.\n¿Qué soy?',
], 'paraguas')

export const adivinanzaReloj = riddle('adivinanza-reloj', 'Adivinanza del reloj', [
  'Tengo manecillas, pero no soy una pulsera.\nDigo las horas, aunque no tengo voz.\n¿Qué soy?',
], 'reloj')

export const adivinanzaGlobo = riddle('adivinanza-globo', 'Adivinanza del globo', [
  'Subo sin escalera y vuelo sin alas.\nMe hincho de aire para las fiestas, y si me sueltas, me pierdo en el cielo.\n¿Qué soy?',
], 'globo')

export const adivinanzaTijeras = riddle('adivinanza-tijeras', 'Adivinanza de las tijeras', [
  'Tengo dos filos que se juntan en un punto.\nCuando me abres y me cierras, corto el papel.\n¿Qué soy?',
], 'tijeras')

export const adivinanzaHuevo = riddle('adivinanza-huevo', 'Adivinanza del huevo', [
  'Soy blanco por fuera y amarillo por dentro.\nMe cocinas en la sartén o me rompes para el desayuno.\n¿Qué soy?',
], 'huevo')

export const adivinanzaCaracol = riddle('adivinanza-caracol', 'Adivinanza del caracol', [
  'Llevo mi casa a la espalda y tengo dos antenas.\nDejo un rastro brillante, y nunca tengo prisa.\n¿Quién soy?',
], 'caracol')

export const adivinanzaBicicleta = riddle('adivinanza-bicicleta', 'Adivinanza de la bicicleta', [
  'Tengo dos ruedas, un manillar y pedales.\nCorro mucho, pero no tengo motor.\n¿Qué soy?',
], 'bicicleta')

export const trabalenguasPepe: ReadingDef = {
  id: 'trabalenguas-pepe',
  title: 'El trabalenguas de Pepe',
  text: [
    'Pepe pela pocas peras, pero Paula pinta pájaros pequeños.\nDilo despacio, y luego deprisa, si te atreves.',
  ],
  skills: ['lng:lit:trabalenguas'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lit:trabalenguas',
      prompt: '¿Con qué letra empiezan casi todas las palabras?',
      options: ['la «p»', 'la «m»', 'la «s»'],
      answer: 0,
    },
  ],
}

export const trabalenguasHuesos: ReadingDef = {
  id: 'trabalenguas-huesos',
  title: 'El trabalenguas del hueso',
  text: [
    'Un hueso, dos huesos y tres huesitos de hueso.\nSi el perro se come el hueso, ¿quién se queda sin hueso?',
  ],
  skills: ['lng:lit:trabalenguas'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lit:trabalenguas',
      prompt: '¿Qué palabra se repite más veces?',
      options: ['hueso', 'tres', 'perro'],
      answer: 0,
    },
  ],
}
