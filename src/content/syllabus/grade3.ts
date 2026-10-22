/* Temario de 3.º de Primaria (matemáticas) como datos. Orden curricular de la app; el trimestre queda sin fijar
   (undefined) hasta confirmar la programación del colegio (docs/curriculum/PLAN_DOCENTE.md §9).
   Solo entran como «disponible» las destrezas para las que ya hay ejercicios; el resto queda «pendiente». */
import { divSkill, mulSkill } from '@/engine/skills'
import type { SkillKey } from '@/types'
import type { Syllabus, SyllabusTopic } from './model'

const TABLE_ORDER = [2, 5, 10, 3, 4, 6, 8, 7, 9] as const

/** Multiplication facts of one table (1..10), normalised keys (mul:AxB, A <= B). */
export function tableSkills(t: number): SkillKey[] {
  const out = new Set<SkillKey>()
  for (let n = 1; n <= 10; n++) out.add(mulSkill(t, n))
  return [...out]
}

/** Division facts whose divisor is 2..10 and quotient 2..10 (the ones a 3.º child meets as tables). */
export function divisionFactSkills(): SkillKey[] {
  const out: SkillKey[] = []
  for (let d = 2; d <= 10; d++) for (let q = 2; q <= 10; q++) out.push(divSkill(d * q, d))
  return out
}

const tableTopic = (t: number): SyllabusTopic => ({
  id: `tabla-${t}`,
  name: `Tabla del ${t}`,
  skills: tableSkills(t),
  status: 'disponible',
  rungs: {
    concreto: `Grupos de ${t} objetos en la pantalla`,
    dibujo: `Filas de ${t} en una matriz`,
    numeros: `La tabla del ${t} escrita, con sus trucos`,
    uso: `Problemas de agrupar y repartir de a ${t}`,
  },
})

const pending = (id: string, name: string, pendingNote: string, rungs: SyllabusTopic['rungs'] = {}): SyllabusTopic => ({
  id,
  name,
  skills: [],
  status: 'pendiente',
  rungs,
  pendingNote,
})

export const GRADE3_SYLLABUS: Syllabus = {
  id: 'matematicas-3-primaria',
  course: 3,
  blocks: [
    {
      id: 'numeros',
      name: 'Números hasta 9 999',
      topics: [
        pending('leer-escribir-9999', 'Leer y escribir hasta 9 999', 'Falta una vista de lectura y escritura de números.'),
        pending('descomponer-9999', 'Descomponer (4 325 = 4 000 + 300 + 20 + 5)', 'Falta una vista de descomposición con bloques.'),
        pending('comparar-ordenar-9999', 'Comparar y ordenar', 'Falta una vista con signos < > =.'),
        pending('redondear', 'Redondear a decenas y centenas', 'Falta una vista de recta numérica.'),
      ],
    },
    {
      id: 'sumas-restas',
      name: 'Sumas y restas',
      topics: [
        { id: 'suma-2d', name: 'Suma de 2 cifras', skills: ['add:2d:c0', 'add:2d:c1'], status: 'disponible', rungs: { concreto: 'Bloques de decenas y unidades', dibujo: 'Barras de decenas y unidades', numeros: 'La cuenta en columna', uso: 'Problemas de juntar' } },
        { id: 'suma-3d-sin-llevar', name: 'Suma de 3 cifras sin llevadas', skills: ['add:3d:c0'], status: 'disponible', rungs: { concreto: 'Bloques de centenas, decenas y unidades', dibujo: 'Columnas de valor posicional', numeros: 'La cuenta en columna', uso: 'Problemas de juntar' } },
        { id: 'suma-3d-llevando', name: 'Suma de 3 cifras con llevadas', skills: ['add:3d:c1', 'add:3d:c2', 'add:3d:c3'], status: 'disponible', rungs: { concreto: 'Cambiar 10 unidades por 1 decena', dibujo: 'Llevadas dibujadas arriba', numeros: 'La cuenta en columna con llevadas', uso: 'Problemas de juntar' } },
        { id: 'suma-4d', name: 'Suma de 4 cifras', skills: ['add:4d:c0', 'add:4d:c1', 'add:4d:c2', 'add:4d:c3', 'add:4d:c4'], status: 'disponible', rungs: { numeros: 'La cuenta en columna de 4 cifras', uso: 'Problemas de juntar' } },
        { id: 'resta-3d-sin-llevar', name: 'Resta de 3 cifras sin llevadas', skills: ['sub:3d:b0'], status: 'disponible', rungs: { concreto: 'Quitar bloques', dibujo: 'Tachar en la barra', numeros: 'La cuenta en columna', uso: 'Problemas de quitar' } },
        { id: 'resta-3d-prestando', name: 'Resta de 3 cifras pidiendo prestado', skills: ['sub:3d:b1', 'sub:3d:b2'], status: 'disponible', rungs: { concreto: 'Cambiar una decena por 10 unidades', dibujo: 'Cruces en los dígitos', numeros: 'La cuenta en columna', uso: 'Problemas de comparar' } },
        { id: 'resta-con-ceros', name: 'Resta con ceros en medio', skills: ['sub:3d:z', 'sub:4d:z'], status: 'disponible', rungs: { concreto: 'Cambiar una centena por 10 decenas', dibujo: 'Cruces en los ceros', numeros: 'La cuenta en columna con ceros', uso: 'Problemas de quitar' } },
        { id: 'resta-4d', name: 'Resta de 4 cifras', skills: ['sub:4d:b0', 'sub:4d:b1', 'sub:4d:b2', 'sub:4d:b3'], status: 'disponible', rungs: { numeros: 'La cuenta en columna de 4 cifras', uso: 'Comprobar con una suma' } },
      ],
    },
    {
      id: 'tablas',
      name: 'Tablas de multiplicar',
      topics: TABLE_ORDER.map(tableTopic),
    },
    {
      id: 'multiplicar',
      name: 'Multiplicar',
      topics: [
        { id: 'mul-2x1-sin-llevar', name: 'Multiplicar 2 cifras por 1 (sin llevada)', skills: ['mul:2x1:c0'], status: 'disponible', rungs: { concreto: 'Grupos de decenas y unidades', dibujo: 'Descomponer 23 × 3 = 20 × 3 + 3 × 3', numeros: 'La cuenta en columna', uso: 'Problemas de grupos' } },
        { id: 'mul-2x1-llevando', name: 'Multiplicar 2 cifras por 1 (con llevada)', skills: ['mul:2x1:c1'], status: 'disponible', rungs: { dibujo: 'Llevadas de las unidades', numeros: 'La cuenta en columna con llevada', uso: 'Problemas de grupos' } },
        pending('mul-3x1', 'Multiplicar 3 cifras por 1', 'Falta el generador de 3 cifras × 1 cifra.'),
        pending('mul-10-100', 'Multiplicar por 10, 100 y 1 000', 'Falta el generador de potencias de 10.'),
      ],
    },
    {
      id: 'dividir',
      name: 'Dividir',
      topics: [
        { id: 'div-con-tablas', name: 'Dividir con las tablas', skills: divisionFactSkills(), status: 'disponible', rungs: { concreto: 'Repartir en cestas', dibujo: 'Grupos iguales', numeros: 'Pensar ¿qué por 4 da 28?', uso: 'Problemas de repartir' } },
        { id: 'div-exacta', name: 'División exacta de 2 cifras entre 1', skills: ['div:2x1:exact'], status: 'disponible', rungs: { numeros: 'La galera paso a paso', uso: 'Problemas de repartir' } },
        { id: 'div-resto', name: 'División con resto', skills: ['div:2x1:rem'], status: 'disponible', rungs: { numeros: 'La prueba: divisor × cociente + resto', uso: 'Problemas de repartir con sobrante' } },
        { id: 'div-larga', name: 'División larga (bajar cifras)', skills: ['div:2x1:long'], status: 'disponible', rungs: { numeros: 'Bajar una cifra cada vez', uso: 'Problemas de repartir' } },
        { id: 'div-3x1', name: 'Dividir 3 cifras entre 1', skills: ['div:3x1:exact', 'div:3x1:rem'], status: 'disponible', rungs: { numeros: 'La galera con tres cifras: bajar una cifra cada vez', uso: 'Comprobar con la prueba: divisor × cociente + resto' } },
      ],
    },
    {
      id: 'problemas',
      name: 'Problemas',
      topics: [
        { id: 'prob-sumar', name: 'Problemas de juntar', skills: ['bar:add', 'word:add'], status: 'disponible', rungs: { dibujo: 'Barra con las dos partes y el total', uso: 'Escribir la operación' } },
        { id: 'prob-restar', name: 'Problemas de quitar y comparar', skills: ['bar:sub', 'word:sub'], status: 'disponible', rungs: { dibujo: 'Barra con la parte que se quita o la diferencia', uso: 'Escribir la operación' } },
        { id: 'prob-multiplicar', name: 'Problemas de grupos', skills: ['bar:mul', 'word:mul'], status: 'disponible', rungs: { dibujo: 'Barras iguales, una por grupo', uso: 'Escribir la operación' } },
        { id: 'prob-dividir', name: 'Problemas de repartir', skills: ['bar:div', 'word:div'], status: 'disponible', rungs: { dibujo: 'Barra entera repartida en partes iguales', uso: 'Escribir la operación' } },
        { id: 'prob-dos-pasos', name: 'Problemas de dos pasos', skills: ['bar:two'], status: 'disponible', rungs: { dibujo: 'Dos barras: primero una cuenta, luego otra', uso: 'Dos operaciones seguidas' } },
      ],
    },
    {
      id: 'comprobar',
      name: 'Comprobar y encontrar errores',
      topics: [
        { id: 'encuentra-error', name: 'Encuentra el error', skills: ['hunt:add', 'hunt:sub', 'hunt:mul'], status: 'disponible', rungs: { concreto: 'Mirar la cuenta columna a columna', dibujo: 'Marcar la columna donde falla', numeros: 'Decidir si está bien y corregirla', uso: 'Revisar las cuentas de un problema' } },
        { id: 'comprobar-resultado', name: 'Comprobar un resultado', skills: ['check:add', 'check:sub', 'check:div'], status: 'disponible', rungs: { numeros: 'La operación contraria: sumar para la resta, multiplicar para la división', uso: 'Comprobar antes de dar un resultado' } },
      ],
    },
    {
      id: 'calculo-mental',
      name: 'Cálculo mental',
      topics: [pending('mental-dobles', 'Dobles y mitades de decenas', 'Falta una actividad sin escritura.'), pending('mental-completar', 'Completar a 10 y a 100', 'Falta una actividad sin escritura.')],
    },
    {
      id: 'fracciones',
      name: 'Fracciones',
      topics: [pending('fracciones-mitad-cuarto', 'Mitades, tercios y cuartos', 'Falta la vista de fracciones con dibujo.'), pending('fraccion-cantidad', 'Fracción de una cantidad (¼ de 20)', 'Falta el generador de fracciones.')],
    },
    {
      id: 'dinero',
      name: 'Dinero',
      topics: [pending('dinero-precios', 'Sumar precios y dar el cambio', 'Falta la vista de monedas y billetes.')],
    },
    {
      id: 'tiempo',
      name: 'Tiempo',
      topics: [pending('reloj', 'Leer el reloj (en punto, y media, cuarto)', 'Falta la vista de reloj.')],
    },
    {
      id: 'medida',
      name: 'Medida',
      topics: [pending('medida-longitud-masa-capacidad', 'Longitud, masa y capacidad', 'Falta la vista de unidades.')],
    },
    {
      id: 'geometria',
      name: 'Geometría',
      topics: [pending('geometria-figuras', 'Figuras, ángulos rectos y perímetro', 'Falta la vista de figuras.')],
    },
  ],
}
