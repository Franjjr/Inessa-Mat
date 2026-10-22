/* World 8 lessons: dividing is fair sharing and multiplication backwards (fact families); the galera, the remainder
   and the division check. */
import { DIV_METHODS } from '@/engine/methods'
import type { DivMethod, LessonStep, SkillSelector } from '@/types'
import { lesson, show, tryIt } from './dsl'

const share12 = { total: 12, groups: 3, emoji: '💎' }
const g84 = { dividend: 84, divisor: 4 }
const g17 = { dividend: 17, divisor: 5 }

export const w8Share = lesson('w8-share', 'Dividir es repartir', [
  show('share', share12, 'La reina tiene 12 gemas para 3 cofres. ¡A todos lo mismo!', 'queen'),
  show('share', share12, 'Reparte de una en una… ¡a cada cofre le tocan 4!'),
  show('share', share12, '12 ÷ 3 = 4. Se lee «doce entre tres, cuatro».'),
  tryIt('share', { total: 10, groups: 2, emoji: '⭐' }, '¡Te toca repartir! A todos lo mismo.', { kinds: ['fact-div'], tables: [2, 3, 5], factorRange: [2, 5] }),
  show('fact-family', { a: 3, b: 4 }, 'Con 3, 4 y 12 puedes hacer 4 operaciones. ¡Es una familia de números!'),
  show('fact-family', { a: 3, b: 4 }, '3 × 4 = 12, 4 × 3 = 12, 12 ÷ 3 = 4 y 12 ÷ 4 = 3.'),
  show('fact-family', { a: 6, b: 7 }, 'El gran secreto: dividir es multiplicar al revés. 42 ÷ 6: ¿6 por cuánto da 42?'),
  show('fact-family', { a: 6, b: 7 }, '6 × 7 = 42. ¡Entonces 42 ÷ 6 = 7!'),
  tryIt('fact-family', { a: 6, b: 8 }, '¡Te toca! Piensa en la multiplicación.', { kinds: ['fact-div'], tables: [6, 7, 8], factorRange: [2, 9] }),
])

export const w8Galera = lesson('w8-galera', 'La casita de la división', [
  show('galera', g84, 'Esta es la casita de la división. El 84 es lo que repartes: el dividendo.'),
  show('galera', g84, 'El 4 va dentro de la casita: es entre cuántos repartes, el divisor.'),
  show('galera', g84, 'Decenas: 8 ÷ 4 = 2. Unidades: 4 ÷ 4 = 1. ¡El cociente es 21!'),
  tryIt('galera', g84, '¡Te toca! Primero las decenas y después las unidades.', { kinds: ['division'], divisionVariants: ['exact'] }),
  show('galera', g17, '¿Y 17 ÷ 5? ¿5 por cuánto se acerca a 17 sin pasarse?'),
  show('galera', g17, '5 × 3 = 15. El cociente es 3. Sobran 17 − 15 = 2: ¡es el resto!'),
  show('galera', g17, 'El resto siempre es más pequeño que el divisor. Si no, ¡cabe una vez más!'),
  show('division-check', g17, 'La prueba: cociente × divisor + resto = dividendo. 3 × 5 + 2 = 17.'),
  tryIt('galera', g17, '¡Te toca! ¿Cuánto sobra?', { kinds: ['division'], divisionVariants: ['rem'] }),
  show('galera', { dividend: 72, divisor: 3 }, 'Si en tu cole colocáis la división de otra forma, ¡hazlo como en el cole!'),
])

/* «Cuatro caminos para dividir» (the division methods, like the subtraction ones): the same 84 ÷ 4 by four routes, a
   try with each one and the choice of the favourite (saved as ChildSettings.divMethod). */
const d84 = { dividend: 84, divisor: 4 }
const dClimb = { divisor: 4, quotient: 7 }
const exactDivision: SkillSelector = { kinds: ['division'], divisionVariants: ['exact'] }

const withDivMethod = (step: LessonStep, divMethod: DivMethod): LessonStep => ({ ...step, divMethod })

export const w8DivWays = lesson('w8-div-ways', 'Cuatro caminos para dividir', [
  show('galera', d84, 'Para dividir hay varios caminos. Los verás con el mismo ejemplo: 84 ÷ 4.'),
  show('galera', d84, 'Camino 1: la galera con restas. Escribes cada resta debajo del paso: 8 − 8 = 0, 4 − 4 = 0.'),
  withDivMethod(tryIt('galera', d84, '¡Pruébalo tú! La galera con las restas.', { ...exactDivision }), 'galera'),
  show('galera', d84, 'Camino 2: la galera sin restas. Solo escribes el cociente y lo que sobra. Las restas, de cabeza.'),
  withDivMethod(tryIt('galera', d84, '¡Pruébalo tú! La galera sin restas.', { ...exactDivision }), 'galera-short'),
  show('div-parts', d84, 'Camino 3: repartir por partes. 84 = 80 + 4. 80 ÷ 4 = 20 y 4 ÷ 4 = 1.'),
  show('div-parts', d84, 'Los cocientes se suman: 20 + 1 = 21. ¡Así no hay que hacer ninguna resta!'),
  withDivMethod(tryIt('div-parts', d84, '¡Pruébalo tú! Reparte por partes.', { ...exactDivision }), 'div-parts'),
  show('div-climb', dClimb, 'Camino 4: multiplicar hacia arriba. ¿Qué número por 4 da 28? Sube: 4, 8, 12… ¡son 7 veces!'),
  withDivMethod(tryIt('div-climb', dClimb, '¡Pruébalo tú! Sube por la tabla del divisor.', exactDivision), 'climb'),
  {
    visual: 'galera',
    params: d84,
    text: '¿Cuál te ha resultado más fácil? Elígelo: será tu método favorito para dividir.',
    interaction: 'choose',
    preference: 'divMethod',
    choices: DIV_METHODS.map((m) => ({ label: m.label, value: m.id })),
  },
])
