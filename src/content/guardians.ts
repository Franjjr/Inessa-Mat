/* The 8 guardian challenges ("Desafío del Guardián"), adapted from the workbook, plus a last round on the new topics
   of the world's stage of the temario (money, clock, measure, fractions, shapes), so each challenge is the stage test. Each one: 6–8 items in rounds,
   pass with all but one right (the workbook rule: "¿7 o más aciertos?" out of 8, 5 out of 6), then the
   "Hechizo del Cristal": one story problem with the workbook's fixed numbers whose result reveals the letter of
   VALIENTE. Rounds use explicit skills so every child meets the same items the workbook chose. */
import type { GuardianDef } from '@/types'

const total = (rounds: GuardianDef['rounds']) => rounds.reduce((s, r) => s + r.count, 0)

function guardian(def: Omit<GuardianDef, 'passMin'> & { passMin?: number }): GuardianDef {
  return { ...def, passMin: def.passMin ?? total(def.rounds) - 1 }
}

export const guardians: GuardianDef[] = [
  guardian({
    id: 'w1-guardian',
    character: 'owl',
    title: 'El desafío del Búho Sabio',
    intro: 'Uh, uh. Demuéstrame que sabes multiplicar y el cristal verde será tuyo.',
    rounds: [
      { selector: { kinds: ['fact-mul'], skills: ['mul:2x4', 'mul:5x6', 'mul:7x10', 'mul:2x9', 'mul:3x5'] }, count: 3 },
      { selector: { kinds: ['missing-factor'], skills: ['mul:5x8'] }, count: 1 },
      { selector: { kinds: ['array'], factorRange: [2, 6] }, count: 1 },
      { selector: { kinds: ['groups'], factorRange: [2, 6] }, count: 1 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['num:compare', 'num:place:expanded', 'money:recognise'] }, count: 2 },
    ],
    spell: {
      text: 'El Búho Sabio vive en un árbol con 7 ramas. En cada rama hay 5 hojas mágicas. ¿Cuántas hojas hay en total?',
      fixed: { kind: 'fact-mul', a: 7, b: 5 },
    },
    letter: 'V',
    rescueStory: 'w1-rescue',
    retryText: '¡Uh, uh! Casi lo tienes, {child}. Repasa los grupos con Lumi y vuelve a intentarlo. ¡Te espero!',
  }),
  guardian({
    id: 'w2-guardian',
    character: 'frog',
    title: 'El desafío de la Rana Saltarina',
    intro: 'Croac. Salta por mis piedras sin caerte al agua y te daré el cristal azul.',
    rounds: [
      { selector: { kinds: ['column-add'], skills: ['add:3d:c0', 'add:3d:c1', 'add:3d:c2'] }, count: 2 },
      { selector: { kinds: ['column-add'], skills: ['add:4d:c1', 'add:4d:c2', 'add:4d:c3'] }, count: 2 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['clock:read:30', 'clock:read:15', 'num:round:10'] }, count: 2 },
    ],
    spell: {
      text: 'Para saltar a la última piedra hay que sumar 2486 + 1357. ¡Su número mágico abrirá la burbuja!',
      fixed: { kind: 'column-add', a: 2486, b: 1357 },
    },
    letter: 'A',
    rescueStory: 'w2-rescue',
    retryText: '¡Croac! Alguna piedra se ha movido. Revisa las llevadas con calma y vuelve a saltar, {child}.',
  }),
  guardian({
    id: 'w3-guardian',
    character: 'ladybug',
    title: 'El desafío de la Reina Mariquita',
    intro: '¡Qué alegría veros en la fiesta! Si sabes la tabla del 6, el cristal rojo será tuyo.',
    rounds: [
      { selector: { kinds: ['fact-mul'], skills: ['mul:3x6', 'mul:4x6', 'mul:6x6', 'mul:6x9', 'mul:6x8', 'mul:5x6', 'mul:2x6'] }, count: 5 },
      { selector: { kinds: ['missing-factor'], skills: ['mul:4x6'] }, count: 1 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['geo:poly:name', 'geo:line:rel'] }, count: 2 },
    ],
    spell: {
      text: 'En la pista bailan 7 mariquitas. Cada una tiene 6 patas. ¿Cuántas patas hay en la pista?',
      fixed: { kind: 'fact-mul', a: 7, b: 6 },
    },
    letter: 'L',
    rescueStory: 'w3-rescue',
    retryText: '¡Casi, {child}! Recuerda los dos trucos: el 5 y uno más, y los pares que riman. ¡La fiesta te espera!',
  }),
  guardian({
    id: 'w4-guardian',
    character: 'polarbear',
    title: 'El desafío de la osa Nieve',
    intro: '¡Brrr! Ayúdame con estas restas y te regalaré el cristal celeste… y una taza de chocolate.',
    rounds: [
      { selector: { kinds: ['column-sub'], skills: ['sub:3d:b0', 'sub:3d:b1', 'sub:3d:b2'] }, count: 2 },
      { selector: { kinds: ['column-sub'], skills: ['sub:4d:b0', 'sub:4d:b1', 'sub:4d:z'] }, count: 2 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['money:pay', 'money:change'] }, count: 2 },
    ],
    spell: {
      text: 'Para llegar a la cima hay que resolver 4521 − 1367. ¡Haz también la prueba mágica!',
      fixed: { kind: 'column-sub', a: 4521, b: 1367 },
    },
    letter: 'I',
    rescueStory: 'w4-rescue',
    retryText: '¡No pasa nada, {child}! Pide ayuda a la vecina, cuidado con los ceros… y vuelve cuando quieras.',
  }),
  guardian({
    id: 'w5-guardian',
    character: 'octopus',
    title: 'El desafío del pulpo Octavio',
    intro: '¡Glu, glu! Si me ayudas con la tabla del 8, el cristal violeta será tuyo.',
    rounds: [
      { selector: { kinds: ['fact-mul'], skills: ['mul:3x8', 'mul:4x8', 'mul:6x8', 'mul:8x8', 'mul:8x9', 'mul:5x8', 'mul:6x6'] }, count: 5 },
      { selector: { kinds: ['missing-factor'], skills: ['mul:2x8'] }, count: 1 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['clock:read:5', 'measure:ruler', 'geo:angle:type'] }, count: 2 },
    ],
    spell: {
      text: 'Octavio hace malabares: con cada uno de sus 8 tentáculos lanza 7 burbujas. ¿Cuántas burbujas lanza en total?',
      fixed: { kind: 'fact-mul', a: 8, b: 7 },
    },
    letter: 'E',
    rescueStory: 'w5-rescue',
    retryText: '¡Glu, glu! Casi, {child}. Haz doble, doble y doble con calma y vuelve a intentarlo.',
  }),
  guardian({
    id: 'w6-guardian',
    character: 'fairy',
    title: 'El desafío del Hada Iris',
    intro: '¡Devuélvele los colores a mi jardín y el cristal rosa será tuyo!',
    rounds: [
      { selector: { kinds: ['fact-mul'], skills: ['mul:3x7', 'mul:4x7', 'mul:7x9', 'mul:6x7', 'mul:7x8', 'mul:6x8', 'mul:8x8'] }, count: 5 },
      { selector: { kinds: ['missing-factor'], skills: ['mul:5x7'] }, count: 1 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['frac:shade:4', 'frac:of:2', 'money:add'] }, count: 2 },
    ],
    spell: {
      text: 'El arcoíris tiene 7 colores, y el Hada Iris pinta 7 arcoíris. ¿Cuántas franjas de color pinta en total?',
      fixed: { kind: 'fact-mul', a: 7, b: 7 },
    },
    letter: 'N',
    rescueStory: 'w6-rescue',
    retryText: '¡Ya casi hay color, {child}! Repasa las tres nuevas con Lumi y vuelve a pintar conmigo.',
  }),
  guardian({
    id: 'w7-guardian',
    character: 'dragon',
    title: 'El desafío de la dragona Chispa',
    intro: '¡GRRR! Bueno… en realidad soy muy simpática. Ayúdame en la forja y el cristal naranja será tuyo.',
    rounds: [
      { selector: { kinds: ['column-mul'], skills: ['mul:2x1:c0'] }, count: 2 },
      { selector: { kinds: ['column-mul'], skills: ['mul:2x1:c1'] }, count: 2 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['time:end', 'measure:convert:mass', 'geo:perimeter'] }, count: 2 },
    ],
    spell: {
      text: 'Chispa necesita 6 cajas con 47 gemas cada una. ¿Cuántas gemas son en total?',
      fixed: { kind: 'column-mul', a: 47, b: 6 },
    },
    letter: 'T',
    rescueStory: 'w7-rescue',
    retryText: '¡Uf, qué calor! Casi lo tienes, {child}. Primero multiplica y después suma la mochila. ¡Otra vez!',
  }),
  guardian({
    id: 'w8-guardian',
    character: 'queen',
    title: 'El desafío de la Reina Aurora',
    intro: 'Ayúdame a repartir mis tesoros con justicia y el último cristal, el dorado, será tuyo.',
    rounds: [
      { selector: { kinds: ['fact-div'], skills: ['div:36/6', 'div:56/7', 'div:64/8'] }, count: 2 },
      { selector: { kinds: ['division'], divisionVariants: ['exact'] }, count: 1 },
      { selector: { kinds: ['division'], divisionVariants: ['rem'] }, count: 1 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['frac:read:8', 'frac:shade:6'] }, count: 2 },
    ],
    spell: {
      text: 'La reina tiene 63 estrellas y quiere repartirlas entre las 3 torres del castillo. ¿Cuántas estrellas pondrá en cada torre?',
      fixed: { kind: 'division', a: 63, b: 3 },
    },
    letter: 'E',
    rescueStory: 'w8-rescue',
    retryText: 'Casi todo está repartido, {child}. Piensa en la multiplicación al revés y vuelve a intentarlo.',
  }),
]

/** Expected magic number of each guardian's spell (the workbook's "Pergamino del Código"). */
export const SPELL_CODES: Record<string, { result: number; letter: string }> = {
  'w1-guardian': { result: 35, letter: 'V' },
  'w2-guardian': { result: 3843, letter: 'A' },
  'w3-guardian': { result: 42, letter: 'L' },
  'w4-guardian': { result: 3154, letter: 'I' },
  'w5-guardian': { result: 56, letter: 'E' },
  'w6-guardian': { result: 49, letter: 'N' },
  'w7-guardian': { result: 282, letter: 'T' },
  'w8-guardian': { result: 21, letter: 'E' },
}

/** Decoy letters Borrón hid in the scroll (a wrong spell result that lands on one of these is a "clue to revise"). */
export const SPELL_DECOYS: Record<number, string> = {
  17: 'R', 19: 'U', 23: 'O', 29: 'S', 31: 'M', 37: 'C', 41: 'P', 53: 'B', 193: 'F', 317: 'G', 2965: 'D', 4721: 'H',
}
