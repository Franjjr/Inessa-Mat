/* The 8 guardian challenges of the 2.º adventure (season 'c2'): the same guardians and letters of VALIENTE as in 3.º,
   with rounds on the world's stage of the 2.º temario (GRADE2_STAGES), so each challenge is the stage test. Pass with
   all but one right; the «Hechizo del Cristal» uses fixed 2.º numbers (two-digit sums and subtractions, easy tables). */
import type { GuardianDef } from '@/types'

const total = (rounds: GuardianDef['rounds']) => rounds.reduce((s, r) => s + r.count, 0)

function guardian(def: Omit<GuardianDef, 'passMin'>): GuardianDef {
  return { ...def, passMin: total(def.rounds) - 1 }
}

export const c2Guardians: GuardianDef[] = [
  guardian({
    id: 'c2-w1-guardian',
    character: 'owl',
    title: 'El desafío del Búho Sabio',
    intro: 'Uh, uh. Demuéstrame que sabes contar en grupos y leer los números grandes, y el cristal verde será tuyo.',
    rounds: [
      { selector: { skills: ['skip:2', 'skip:5', 'skip:10'] }, count: 2 },
      { selector: { skills: ['num:place:blocks:999', 'num:place:expanded:999'] }, count: 2 },
      { selector: { skills: ['num:place:words:999'] }, count: 1 },
      // La etapa del temario: lo nuevo de este mundo (prueba de bloque).
      { selector: { skills: ['num:compare:999', 'num:order:999', 'money:recognise'] }, count: 2 },
    ],
    spell: {
      text: 'En el prado hay 300 setas y en el árbol del búho hay 45. ¿Cuántas setas hay en total?',
      fixed: { kind: 'column-add', a: 300, b: 45 },
    },
    letter: 'V',
    rescueStory: 'c2-w1-rescue',
    retryText: '¡Uh, uh! Casi lo tienes, {child}. Cuenta de diez en diez con Lumi y vuelve a intentarlo. ¡Te espero!',
  }),
  guardian({
    id: 'c2-w2-guardian',
    character: 'frog',
    title: 'El desafío de la Rana Saltarina',
    intro: 'Croac. Salta por mis piedras sumando sin caerte al agua y te daré el cristal azul.',
    rounds: [
      { selector: { kinds: ['column-add'], skills: ['add:2d:c0'] }, count: 2 },
      { selector: { kinds: ['column-add'], skills: ['add:2d:c1'] }, count: 2 },
      { selector: { skills: ['mental:completar10', 'mental:completar100'] }, count: 1 },
      { selector: { skills: ['clock:read:30', 'clock:read:15', 'bar:add'] }, count: 2 },
    ],
    spell: {
      text: 'La rana salta 47 piedras por la mañana y 38 por la tarde. ¿Cuántas piedras salta en total?',
      fixed: { kind: 'column-add', a: 47, b: 38 },
    },
    letter: 'A',
    rescueStory: 'c2-w2-rescue',
    retryText: '¡Croac! Alguna piedra se ha movido. Revisa la llevada con calma y vuelve a saltar, {child}.',
  }),
  guardian({
    id: 'c2-w3-guardian',
    character: 'ladybug',
    title: 'El desafío de la Reina Mariquita',
    intro: '¡Qué alegría veros en la fiesta! Si encuentras las formas y sigues mis luces, el cristal rojo será tuyo.',
    rounds: [
      { selector: { skills: ['geo:poly:name', 'geo:poly:sides'] }, count: 2 },
      { selector: { skills: ['geo:line:type'] }, count: 1 },
      { selector: { skills: ['pos:relative', 'pos:next'] }, count: 2 },
      { selector: { skills: ['pattern:shapes', 'pattern:numbers'] }, count: 2 },
    ],
    spell: {
      text: 'En la fiesta hay 26 mariquitas rojas y 13 amarillas. ¿Cuántas mariquitas hay?',
      fixed: { kind: 'column-add', a: 26, b: 13 },
    },
    letter: 'L',
    rescueStory: 'c2-w3-rescue',
    retryText: '¡Casi, {child}! Mira bien cada forma y el trozo que se repite en las luces. ¡La fiesta te espera!',
  }),
  guardian({
    id: 'c2-w4-guardian',
    character: 'polarbear',
    title: 'El desafío de la osa Nieve',
    intro: '¡Brrr! Ayúdame con estas restas y te regalaré el cristal celeste… y una taza de chocolate.',
    rounds: [
      { selector: { kinds: ['column-sub'], skills: ['sub:2d:b0'] }, count: 2 },
      { selector: { kinds: ['column-sub'], skills: ['sub:2d:b1'] }, count: 2 },
      { selector: { skills: ['eq:flex'] }, count: 1 },
      { selector: { skills: ['money:pay:e', 'bar:sub'] }, count: 2 },
    ],
    spell: {
      text: 'En la montaña hay 72 copos mágicos. El viento se lleva 35. ¿Cuántos copos quedan?',
      fixed: { kind: 'column-sub', a: 72, b: 35 },
    },
    letter: 'I',
    rescueStory: 'c2-w4-rescue',
    retryText: '¡No pasa nada, {child}! Pide ayuda a la vecina con calma… y vuelve cuando quieras.',
  }),
  guardian({
    id: 'c2-w5-guardian',
    character: 'octopus',
    title: 'El desafío del pulpo Octavio',
    intro: '¡Glu, glu! Si me ayudas con los dobles, las medidas y el calendario, el cristal violeta será tuyo.',
    rounds: [
      { selector: { skills: ['mental:dobles', 'mental:mitades'] }, count: 2 },
      { selector: { skills: ['num:line:10:999', 'num:line:100:999'] }, count: 2 },
      { selector: { skills: ['cal:weekday', 'cal:month'] }, count: 1 },
      { selector: { skills: ['measure:unit:length', 'measure:unit:mass', 'measure:ruler'] }, count: 2 },
    ],
    spell: {
      text: 'Octavio tiene 8 brazos y su hermana Octavia, también. ¿Cuántos brazos tienen entre los dos? ¡Es el doble de 8!',
      fixed: { kind: 'fact-mul', a: 2, b: 8 },
    },
    letter: 'E',
    rescueStory: 'c2-w5-rescue',
    retryText: '¡Glu, glu! Casi, {child}. El doble es lo mismo dos veces. ¡Vuelve a intentarlo!',
  }),
  guardian({
    id: 'c2-w6-guardian',
    character: 'fairy',
    title: 'El desafío del Hada Iris',
    intro: '¡Devuélvele los colores a mi jardín y el cristal rosa será tuyo!',
    rounds: [
      { selector: { skills: ['chart:pict', 'chart:bars'] }, count: 2 },
      { selector: { skills: ['mental:decenas'] }, count: 2 },
      { selector: { skills: ['money:add:e'] }, count: 1 },
      { selector: { skills: ['geo:solid:name', 'geo:solid:roll'] }, count: 2 },
    ],
    spell: {
      text: 'En el jardín han florecido 45 flores rojas y 32 amarillas. ¿Cuántas flores hay?',
      fixed: { kind: 'column-add', a: 45, b: 32 },
    },
    letter: 'N',
    rescueStory: 'c2-w6-rescue',
    retryText: '¡Ya casi hay color, {child}! Lee el gráfico con el dedo y vuelve a pintar conmigo.',
  }),
  guardian({
    id: 'c2-w7-guardian',
    character: 'dragon',
    title: 'El desafío de la dragona Chispa',
    intro: '¡GRRR! Bueno… en realidad soy muy simpática. Ayúdame a contar grupos en la forja y el cristal naranja será tuyo.',
    rounds: [
      { selector: { skills: ['concept:groups', 'concept:array'] }, count: 2 },
      { selector: { kinds: ['fact-mul'], skills: ['mul:2x6', 'mul:2x8', 'mul:7x10', 'mul:3x10', 'mul:2x9'] }, count: 2 },
      { selector: { kinds: ['fact-mul'], skills: ['mul:5x7', 'mul:5x8', 'mul:4x5', 'mul:5x6'] }, count: 2 },
      { selector: { skills: ['bar:mul'] }, count: 1 },
    ],
    spell: {
      text: 'La dragona hace 6 espadas cada día de la semana que trabaja: 5 días. ¿Cuántas espadas hace?',
      fixed: { kind: 'fact-mul', a: 5, b: 6 },
    },
    letter: 'T',
    rescueStory: 'c2-w7-rescue',
    retryText: '¡Uf, qué calor! Casi lo tienes, {child}. Cuenta los grupos iguales con calma. ¡Otra vez!',
  }),
  guardian({
    id: 'c2-w8-guardian',
    character: 'queen',
    title: 'El desafío de la Reina Aurora',
    intro: 'Ayúdame a contar los pisos de mis torres y las cuentas del castillo, y el último cristal, el dorado, será tuyo.',
    rounds: [
      { selector: { kinds: ['fact-mul'], skills: ['mul:3x6', 'mul:3x8', 'mul:3x7', 'mul:3x9'] }, count: 2 },
      { selector: { kinds: ['fact-mul'], skills: ['mul:4x6', 'mul:4x7', 'mul:4x8', 'mul:4x9'] }, count: 2 },
      { selector: { kinds: ['column-add', 'column-sub'], skills: ['add:3d:c1:999', 'sub:3d:b1'] }, count: 2 },
      { selector: { skills: ['hunt:add', 'hunt:sub'] }, count: 1 },
    ],
    spell: {
      text: 'El castillo tiene 7 torres y cada torre tiene 4 pisos. ¿Cuántos pisos hay en total?',
      fixed: { kind: 'fact-mul', a: 7, b: 4 },
    },
    letter: 'E',
    rescueStory: 'c2-w8-rescue',
    retryText: 'Casi, {child}. Cuenta los pisos de cuatro en cuatro y vuelve a intentarlo.',
  }),
]

/** Results of the 2.º spells and their letters (merged into SPELL_CODES). */
export const C2_SPELL_CODES: Record<string, { result: number; letter: string }> = {
  'c2-w1-guardian': { result: 345, letter: 'V' },
  'c2-w2-guardian': { result: 85, letter: 'A' },
  'c2-w3-guardian': { result: 39, letter: 'L' },
  'c2-w4-guardian': { result: 37, letter: 'I' },
  'c2-w5-guardian': { result: 16, letter: 'E' },
  'c2-w6-guardian': { result: 77, letter: 'N' },
  'c2-w7-guardian': { result: 30, letter: 'T' },
  'c2-w8-guardian': { result: 28, letter: 'E' },
}
