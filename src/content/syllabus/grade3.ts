/* Temario de 3.º de Primaria (matemáticas) como datos. Los bloques agrupan los temas para el informe del adulto; el
   orden de enseñanza es el de las etapas (GRADE3_STAGES): una por mundo, tres trimestres, en espiral (cada etapa
   mezcla números u operaciones con dinero, reloj, medida, fracciones o figuras). Es un orden progresivo propio: el
   índice del libro del colegio no está publicado (docs/curriculum/PLAN_DOCENTE.md §9). Solo entran como
   «disponible» las destrezas para las que ya hay ejercicios; el resto queda «pendiente». */
import { divSkill, fractionSkill, geoSkill } from '@/engine/skills'
import type { SkillKey } from '@/types'
import type { Syllabus, SyllabusStage } from './model'
import { tableTopic, withStageTerms } from './helpers'

export { tableSkills } from './helpers'

const TABLE_ORDER = [2, 5, 10, 3, 4, 6, 8, 7, 9] as const

/** Fraction skills for several operations and denominators (frac:<op>:<d>). */
function fractionFamily(ops: ('shade' | 'read' | 'name' | 'of')[], ds: number[]): SkillKey[] {
  return ops.flatMap((op) => ds.map((d) => fractionSkill(op, d)))
}

/** Division facts whose divisor is 2..10 and quotient 2..10 (the ones a 3.º child meets as tables). */
export function divisionFactSkills(): SkillKey[] {
  const out: SkillKey[] = []
  for (let d = 2; d <= 10; d++) for (let q = 2; q <= 10; q++) out.push(divSkill(d * q, d))
  return out
}

/** Teaching order: eight stages, one per world, three trimesters. Every topic of the blocks appears exactly once. */
// «Encuentra el error» waits for etapa 7: its items include column multiplication.
export const GRADE3_STAGES: SyllabusStage[] = [
  // 1.er trimestre
  { id: 'etapa-1', term: 1, worldId: 'w1', topics: ['descomponer-9999', 'leer-escribir-9999', 'comparar-ordenar-9999', 'ordinales', 'tabla-2', 'tabla-5', 'tabla-10', 'completar', 'monedas-billetes'] },
  { id: 'etapa-2', term: 1, worldId: 'w2', topics: ['suma-2d', 'suma-3d-sin-llevar', 'suma-3d-llevando', 'suma-4d', 'redondear', 'decenas-centenas', 'igualdad', 'prob-sumar', 'reloj-en-punto-media-cuarto'] },
  { id: 'etapa-3', term: 1, worldId: 'w3', topics: ['tabla-3', 'tabla-4', 'tabla-6', 'dobles-mitades', 'doble-triple', 'prob-multiplicar', 'poligonos', 'rectas'] },
  // 2.º trimestre
  { id: 'etapa-4', term: 2, worldId: 'w4', topics: ['resta-3d-sin-llevar', 'resta-3d-prestando', 'resta-con-ceros', 'resta-4d', 'prob-restar', 'compensar', 'euros-centimos', 'pagar-cambio'] },
  { id: 'etapa-5', term: 2, worldId: 'w5', topics: ['tabla-8', 'reloj-5-minutos', 'calendario', 'unidades-longitud', 'regla', 'angulos-rectos', 'graficos'] },
  { id: 'etapa-6', term: 2, worldId: 'w6', topics: ['tabla-7', 'tabla-9', 'fracciones-mitad-cuarto', 'fraccion-cantidad', 'sumar-precios', 'circulo-cuerpos', 'recorridos'] },
  // 3.er trimestre
  { id: 'etapa-7', term: 3, worldId: 'w7', topics: ['numeros-5-cifras', 'mul-2x1-sin-llevar', 'mul-2x1-llevando', 'mul-10-100', 'mul-3x1', 'reloj-digital', 'duraciones', 'unidades-masa-capacidad', 'medir-problemas', 'perimetro', 'fracciones-comparar', 'encuentra-error', 'probabilidad'] },
  { id: 'etapa-8', term: 3, worldId: 'w8', topics: ['div-con-tablas', 'div-exacta', 'div-resto', 'prob-dividir', 'div-larga', 'div-3x1', 'prob-dos-pasos', 'comprobar-resultado', 'fracciones-mas-partes', 'mul-2-cifras-intro'] },
]

export const GRADE3_SYLLABUS: Syllabus = withStageTerms({
  id: 'matematicas-3-primaria',
  course: 3,
  blocks: [
    {
      id: 'numeros',
      name: 'Números hasta 9 999',
      topics: [
        { id: 'descomponer-9999', name: 'Descomponer (4 325 = 4 000 + 300 + 20 + 5)', skills: ['num:place:blocks', 'num:place:expanded'], status: 'disponible', rungs: { concreto: 'Bloques de millar, centena, decena y unidad', numeros: 'Las partes escritas: 4 000 + 300 + 20 + 5' } },
        { id: 'leer-escribir-9999', name: 'Leer y escribir hasta 9 999', skills: ['num:place:words'], status: 'disponible', rungs: { dibujo: 'Tabla de millares, centenas, decenas y unidades', numeros: 'El número en palabras, sin cifras' } },
        { id: 'comparar-ordenar-9999', name: 'Comparar y ordenar', skills: ['num:compare', 'num:order'], status: 'disponible', rungs: { dibujo: 'Columnas de valor posicional, casa por casa', numeros: 'Signos < > = y orden de menor a mayor' } },
        { id: 'redondear', name: 'Redondear a decenas y centenas', skills: ['num:round:10', 'num:round:100'], status: 'disponible', rungs: { dibujo: 'La recta con la decena o centena más cercana', numeros: 'Mirar la cifra de al lado' } },
        { id: 'ordinales', name: 'Ordinales hasta el 30', skills: ['num:ordinal:10', 'num:ordinal:20', 'num:ordinal:30'], status: 'disponible', ordered: true, rungs: { concreto: 'Una fila de objetos: cuenta desde la punta de la flecha', numeros: 'El 7.º es el séptimo; el 21.º, vigésimo primero' } },
        { id: 'numeros-5-cifras', name: 'Números de 5 cifras (introducción)', skills: ['num:place:blocks:19999', 'num:place:words:19999', 'num:compare:19999'], status: 'disponible', ordered: true, rungs: { concreto: 'Pilas de diez cuadros de mil: las decenas de millar', numeros: '12 345 = 10 000 + 2 000 + 300 + 40 + 5' } },
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
        { id: 'igualdad', name: 'Signo igual: los dos lados valen lo mismo', skills: ['eq:flex'], status: 'disponible', rungs: { concreto: 'Balanza con dos platillos', numeros: '5 + 3 = __ + 6 y 7 = 3 + __' } },
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
        { id: 'mul-3x1', name: 'Multiplicar 3 cifras por 1', skills: ['mul:3x1:c0', 'mul:3x1:c1'], status: 'disponible', rungs: { dibujo: 'Descomponer 213 × 3 = 200 × 3 + 10 × 3 + 3 × 3', numeros: 'La cuenta en columna con llevadas', uso: 'Problemas de grupos grandes' } },
        { id: 'mul-10-100', name: 'Multiplicar por 10, 100 y 1 000', skills: ['mental:por10'], status: 'disponible', rungs: { dibujo: 'Las cifras se mueven a la izquierda en la tabla de valor posicional', numeros: '37 × 100 = 3 700: dos ceros a la derecha' } },
        { id: 'mul-2-cifras-intro', name: 'Multiplicar por un número de 2 cifras (por partes)', skills: ['mul:2dx2d'], status: 'disponible', rungs: { dibujo: 'Un rectángulo partido en dos trozos', numeros: '23 × 14 = 23 × 4 + 23 × 10' } },
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
      topics: [
        { id: 'dobles-mitades', name: 'Dobles y mitades', skills: ['mental:dobles', 'mental:mitades'], status: 'disponible', rungs: { concreto: 'Dos montones iguales', numeros: 'El doble de 35 = 30 + 30 + 5 + 5' } },
        { id: 'doble-triple', name: 'Doble y triple', skills: ['mental:dobles', 'mental:triples'], status: 'disponible', ordered: true, rungs: { concreto: 'Tres montones iguales', numeros: 'El triple de 14 = 10 + 10 + 10 + 4 + 4 + 4' } },
        { id: 'completar', name: 'Completar a 10, 100 y 1 000', skills: ['mental:completar10', 'mental:completar100', 'mental:completar1000'], status: 'disponible', rungs: { dibujo: 'La recta: cuánto falta para el número redondo', numeros: 'Contar hasta el número redondo' } },
        { id: 'decenas-centenas', name: 'Sumar y restar decenas y centenas', skills: ['mental:decenas', 'mental:centenas', 'num:line:10', 'num:line:100', 'num:line:1000'], status: 'disponible', rungs: { concreto: 'Bloques de decenas y centenas', dibujo: 'Saltos de 10, 100 y 1 000 en la recta', numeros: '340 + 200 = 540' } },
        { id: 'compensar', name: 'Compensar (+9 = +10 − 1)', skills: ['mental:compensar'], status: 'disponible', rungs: { numeros: '48 + 9 = 48 + 10 − 1' } },
      ],
    },
    {
      id: 'fracciones',
      name: 'Fracciones',
      topics: [
        { id: 'fracciones-mitad-cuarto', name: 'Mitades, tercios y cuartos', skills: [...fractionFamily(['shade', 'read', 'name'], [2, 3, 4]), fractionSkill('equal')], status: 'disponible', rungs: { concreto: 'Colorear partes de un círculo, un rectángulo o una barra', dibujo: 'Leer la fracción: arriba las partes de color, abajo todas', numeros: 'Escribir la fracción con dos números', uso: 'Decir su nombre: un medio, dos tercios, tres cuartos' } },
        { id: 'fraccion-cantidad', name: 'Fracción de una cantidad (¼ de 20)', skills: fractionFamily(['of'], [2, 3, 4]), status: 'disponible', rungs: { concreto: '20 objetos en grupos iguales', dibujo: 'Contar los objetos de un grupo', numeros: '¼ de 20 = 20 ÷ 4', uso: 'Problemas: reparto de caramelos o flores' } },
        { id: 'fracciones-comparar', name: 'Comparar fracciones con dibujos', skills: [fractionSkill('compare')], status: 'disponible', rungs: { dibujo: 'Dos barras de la misma longitud, una partida y otra coloreada', numeros: '½ y ¼: ¿cuál es mayor?' } },
        { id: 'fracciones-mas-partes', name: 'Fracciones de 5, 6, 8, 10 y 12 partes', skills: fractionFamily(['shade', 'read', 'name'], [5, 6, 8, 10, 12]), status: 'disponible', rungs: { dibujo: 'Figuras partidas en más partes iguales', numeros: 'Leer y escribir fracciones con denominador hasta 12' } },
      ],
    },
    {
      id: 'dinero',
      name: 'Dinero',
      topics: [
        { id: 'monedas-billetes', name: 'Monedas y billetes', skills: ['money:recognise'], status: 'disponible', rungs: { concreto: 'Monedas y billetes en la pantalla', dibujo: 'Cada pieza con su valor impreso', numeros: 'El valor escrito: 2,50 €', uso: 'Contar el dinero de una hucha' } },
        { id: 'pagar-cambio', name: 'Pagar y dar el cambio', skills: ['money:pay', 'money:change'], status: 'disponible', rungs: { concreto: 'Poner monedas en la bandeja hasta el precio', numeros: 'Precio y billete: cuánto devuelven', uso: 'Problemas de compra con cambio' } },
        { id: 'sumar-precios', name: 'Sumar precios y comparar', skills: ['money:add', 'money:compare'], status: 'disponible', rungs: { dibujo: 'Precios en tarjetas, uno debajo de otro', numeros: '2,50 € + 1,35 € = ?', uso: 'Problemas de compra: ¿qué cuesta más?' } },
        { id: 'euros-centimos', name: 'Euros y céntimos (1 € = 100 céntimos)', skills: ['money:convert'], status: 'disponible', rungs: { dibujo: 'Cien céntimos forman 1 €', numeros: '2,35 € son 235 céntimos' } },
      ],
    },
    {
      id: 'tiempo',
      name: 'Tiempo',
      topics: [
        { id: 'reloj-en-punto-media-cuarto', name: 'Reloj: en punto, y media, y cuarto', skills: ['clock:read:30', 'clock:read:15', 'clock:set:30'], status: 'disponible', rungs: { concreto: 'Reloj de agujas: poner la aguja larga en el 12, el 6, el 3 o el 9', dibujo: 'La aguja larga en el 3 (cuarto) o en el 6 (media)', numeros: 'La frase: «las tres y cuarto», «las seis y media»', uso: 'A qué hora empieza una actividad' } },
        { id: 'reloj-5-minutos', name: 'Reloj de cinco en cinco minutos', skills: ['clock:read:5', 'clock:set:5'], status: 'disponible', rungs: { concreto: 'Contar los números del reloj de 5 en 5', dibujo: 'Las marcas de cinco minutos', numeros: 'La frase: «las tres y veinte», «las cinco menos diez»', uso: 'Horas de clase, de comer y de dormir' } },
        { id: 'reloj-digital', name: 'Reloj digital y de agujas (24 h, mañana, tarde, noche)', skills: ['clock:convert:day'], status: 'disponible', rungs: { dibujo: 'Dos columnas: la hora de agujas y la digital', numeros: '14:30 = las dos y media de la tarde', uso: 'Leer los horarios de la vida diaria' } },
        { id: 'duraciones', name: 'Duraciones: cuánto dura y a qué hora acaba', skills: ['time:end', 'time:elapsed'], status: 'disponible', rungs: { dibujo: 'Recta de horas con la salida y la llegada', numeros: 'Una hora y media = 60 + 30 minutos', uso: 'La película empieza a las 5 y dura 1 hora y media' } },
        { id: 'calendario', name: 'Calendario y unidades de tiempo', skills: ['time:units', 'cal:weekday', 'cal:month'], status: 'disponible', rungs: { concreto: 'La semana en tarjetas de lunes a domingo', dibujo: 'Los nudillos para los meses', numeros: '1 hora = 60 minutos; 1 minuto = 60 segundos; 1 día = 24 horas', uso: '¿Qué día será dentro de 3 días?' } },
      ],
    },
    {
      id: 'medida',
      name: 'Medida',
      topics: [
        { id: 'unidades-longitud', name: 'Longitud: cm, m y km', skills: ['measure:unit:length', 'measure:convert:length'], status: 'disponible', rungs: { concreto: 'Objetos conocidos para comparar', dibujo: 'Una tira de 1 m marcada en centímetros', numeros: '1 m = 100 cm; 1 km = 1 000 m', uso: 'Elegir la unidad de una distancia' } },
        { id: 'regla', name: 'Medir con la regla', skills: ['measure:ruler'], status: 'disponible', rungs: { concreto: 'Regla en pantalla y un objeto', numeros: 'Hasta dónde acaba menos dónde empieza' } },
        { id: 'unidades-masa-capacidad', name: 'Masa y capacidad: g, kg, ml y l', skills: ['measure:unit:mass', 'measure:unit:capacity', 'measure:convert:mass', 'measure:convert:capacity'], status: 'disponible', rungs: { concreto: 'Un vaso, una botella, una bolsa de pan', dibujo: 'Medio kilo y cuarto de litro en la tira', numeros: '1 kg = 1 000 g; 1 l = 1 000 ml', uso: 'Elegir la unidad de lo que se pesa o se llena' } },
        { id: 'medir-problemas', name: 'Sumar medidas y estimar', skills: ['measure:add', 'measure:estimate'], status: 'disponible', rungs: { dibujo: 'Pasar las dos medidas a la misma unidad', uso: '¿Es razonable este resultado?' } },
      ],
    },
    {
      id: 'geometria',
      name: 'Geometría',
      topics: [
        { id: 'poligonos', name: 'Polígonos: nombre, lados y esquinas', skills: [geoSkill('poly:name'), geoSkill('poly:sides')], status: 'disponible', rungs: { concreto: 'Figuras de cartón de distintas formas y giros', dibujo: 'Contar lados y esquinas marcándolos', numeros: 'Triángulo 3, cuadrado y rectángulo 4, pentágono 5, hexágono 6' } },
        { id: 'rectas', name: 'Rectas, curvas, paralelas y perpendiculares', skills: [geoSkill('line:type'), geoSkill('line:rel')], status: 'disponible', rungs: { concreto: 'Dos tiras de papel que se cruzan o no', dibujo: 'La línea que se prolonga sin fin', numeros: 'Paralelas nunca se cruzan; perpendiculares forman cruz' } },
        { id: 'angulos-rectos', name: 'Ángulos rectos', skills: [geoSkill('angle:type'), geoSkill('angle:tap')], status: 'disponible', rungs: { concreto: 'La esquina de una hoja de papel', dibujo: 'Comparar cada ángulo con la esquina del papel', uso: 'Encontrar las esquinas rectas de una habitación' } },
        { id: 'circulo-cuerpos', name: 'Círculo, circunferencia y cuerpos', skills: [geoSkill('circle'), geoSkill('solid:name'), geoSkill('solid:roll'), geoSkill('solid:faces')], status: 'disponible', rungs: { concreto: 'Pelotas, cajas, latas y conos', dibujo: 'Caras planas y partes redondas', numeros: 'Cuántas caras planas tiene cada cuerpo' } },
        { id: 'perimetro', name: 'Perímetro: sumar los lados', skills: [geoSkill('perimeter')], status: 'disponible', rungs: { dibujo: 'Figuras con la medida de cada lado', uso: '¿Cuántos metros de valla hacen falta para rodear el jardín?' } },
        { id: 'recorridos', name: 'Recorridos en una cuadrícula', skills: ['pos:route'], status: 'disponible', rungs: { concreto: 'Caminar por la clase contando pasos', dibujo: 'Flechas en una cuadrícula', uso: 'Dar indicaciones para llegar a un sitio' } },
      ],
    },
    {
      id: 'estadistica',
      name: 'Gráficos y probabilidad',
      topics: [
        { id: 'graficos', name: 'Pictogramas y gráficas de barras', skills: ['chart:pict:x', 'chart:bars'], status: 'disponible', rungs: { concreto: 'Contar votos de la clase', dibujo: 'Cada dibujo vale 2, 5 o 10', numeros: 'Cuántos más, cuántos en total' } },
        { id: 'probabilidad', name: 'Seguro, posible o imposible', skills: ['prob:chance'], status: 'disponible', rungs: { concreto: 'Sacar bolas de una bolsa sin mirar', uso: '¿Puede salir una bola verde?' } },
      ],
    },
  ],
  stages: GRADE3_STAGES,
})
