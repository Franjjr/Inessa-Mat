/* Temario de 4.º de Primaria (matemáticas) como datos, con el mismo modelo que el de 3.º: bloques para el informe del
   adulto y un orden propio en ocho etapas y tres trimestres, en espiral. La ley fija el segundo ciclo (3.º-4.º) sin
   reparto por curso (docs/curriculum/MATEMATICAS_PRIMARIA.md): números hasta 9 999, las cuatro operaciones con
   flexibilidad, fracciones con denominador hasta 12, km, m y cm, kg y g, l y ml, superficie y ángulos, simetrías,
   gráficos, la moda y la probabilidad intuitiva, patrones con predicción. Lo propio de 4.º (práctica habitual, no ley):
   multiplicar por dos cifras (aquí por partes, el paso previo al algoritmo), dividir números de 4 cifras y entre dos
   cifras, sumar y restar fracciones de igual denominador, redondear a millares, números romanos. Sus etapas no van
   ligadas a los mundos de la aventura. */
import { fractionSkill, geoSkill } from '@/engine/skills'
import type { SkillKey } from '@/types'
import type { Syllabus, SyllabusStage } from './model'
import { tableSkills, withStageTerms } from './helpers'

const fractions = (ops: ('shade' | 'read' | 'name' | 'of')[], ds: number[]): SkillKey[] => ops.flatMap((op) => ds.map((d) => fractionSkill(op, d)))

export const GRADE4_STAGES: SyllabusStage[] = [
  // 1.er trimestre
  { id: 'etapa-1', term: 1, topics: ['repaso-numeros', 'romanos', 'suma-resta-4d', 'prob-sumar-restar', 'tablas-repaso', 'mental-4', 'graficos-4'] },
  { id: 'etapa-2', term: 1, topics: ['redondear-millares', 'mul-2x1', 'mul-3x1', 'por-10-100-1000', 'prob-multiplicar', 'reloj-4', 'angulos'] },
  { id: 'etapa-3', term: 1, topics: ['div-repaso', 'div-4x1', 'prob-dividir', 'comprobar', 'perimetro', 'series-4'] },
  // 2.º trimestre
  { id: 'etapa-4', term: 2, topics: ['mul-2-cifras', 'recta-1000', 'cambio-presupuesto', 'area', 'moda'] },
  { id: 'etapa-5', term: 2, topics: ['fracciones-12', 'fraccion-cantidad-4', 'longitud-4', 'simetria', 'igualdad'] },
  { id: 'etapa-6', term: 2, topics: ['mul-3x2', 'prob-dos-pasos', 'masa-capacidad-4', 'duraciones-4', 'probabilidad'] },
  // 3.er trimestre
  { id: 'etapa-7', term: 3, topics: ['fracciones-comparar', 'fracciones-sumar', 'medir-problemas', 'recorridos', 'encuentra-error'] },
  { id: 'etapa-8', term: 3, topics: ['poligonos-cuerpos', 'div-2-cifras'] },
]

export const GRADE4_SYLLABUS: Syllabus = withStageTerms({
  id: 'matematicas-4-primaria',
  course: 4,
  blocks: [
    {
      id: 'numeros',
      name: 'Números hasta 9 999',
      topics: [
        { id: 'repaso-numeros', name: 'Leer, escribir, descomponer y comparar (repaso)', skills: ['num:place:expanded', 'num:place:words', 'num:compare', 'num:order'], status: 'disponible', rungs: { dibujo: 'Tabla de millares, centenas, decenas y unidades', numeros: '7 045 = 7 000 + 40 + 5' } },
        { id: 'redondear-millares', name: 'Redondear a centenas y millares', skills: ['num:round:100', 'num:round:1000'], status: 'disponible', rungs: { dibujo: 'La recta con el millar más cercano', numeros: 'Mirar la cifra de las centenas' } },
        { id: 'recta-1000', name: 'La recta numérica: saltos de 100 y de 1 000', skills: ['num:line:100', 'num:line:1000'], status: 'disponible', rungs: { dibujo: 'Saltos de 100 y de 1 000', numeros: '3 450 + 1 000 = 4 450' } },
        { id: 'romanos', name: 'Números romanos', skills: ['mental:romanos'], status: 'disponible', rungs: { concreto: 'Relojes y capítulos de libros', numeros: 'I, V, X, L, C; IV = 5 − 1' } },
      ],
    },
    {
      id: 'sumas-restas',
      name: 'Sumas y restas',
      topics: [
        { id: 'suma-resta-4d', name: 'Sumas y restas de 4 cifras', skills: ['add:4d:c2', 'add:4d:c3', 'sub:4d:b2', 'sub:4d:z'], status: 'disponible', rungs: { numeros: 'La cuenta en columna con llevadas y con ceros', uso: 'Problemas de juntar y de quitar' } },
        { id: 'comprobar', name: 'Comprobar un resultado', skills: ['check:add', 'check:sub', 'check:div'], status: 'disponible', rungs: { numeros: 'La operación contraria', uso: 'Comprobar antes de dar un resultado' } },
        { id: 'encuentra-error', name: 'Encuentra el error', skills: ['hunt:add', 'hunt:sub', 'hunt:mul'], status: 'disponible', rungs: { dibujo: 'Marcar la columna donde falla', numeros: 'Decidir si está bien y corregirla' } },
        { id: 'igualdad', name: 'Signo igual: los dos lados valen lo mismo', skills: ['eq:flex'], status: 'disponible', rungs: { concreto: 'Balanza con dos platillos', numeros: '25 + 8 = __ + 10' } },
      ],
    },
    {
      id: 'multiplicar',
      name: 'Multiplicar',
      topics: [
        { id: 'tablas-repaso', name: 'Tablas del 6 al 9 (repaso)', skills: [...new Set([6, 7, 8, 9].flatMap(tableSkills))], status: 'disponible', rungs: { numeros: 'Las tablas difíciles, con sus trucos', uso: 'Contestar rápido, sin contar' } },
        { id: 'mul-2x1', name: 'Multiplicar 2 cifras por 1 (repaso)', skills: ['mul:2x1:c1'], status: 'disponible', rungs: { numeros: 'La cuenta en columna con llevada' } },
        { id: 'mul-3x1', name: 'Multiplicar 3 cifras por 1', skills: ['mul:3x1:c0', 'mul:3x1:c1'], status: 'disponible', rungs: { dibujo: '213 × 3 = 200 × 3 + 10 × 3 + 3 × 3', numeros: 'La cuenta en columna con llevadas' } },
        { id: 'por-10-100-1000', name: 'Multiplicar y dividir por 10, 100 y 1 000', skills: ['mental:por10'], status: 'disponible', rungs: { dibujo: 'Las cifras se mueven en la tabla de valor posicional', numeros: '37 × 100 = 3 700; 4 500 : 100 = 45' } },
        { id: 'mul-2-cifras', name: 'Multiplicar por un número de 2 cifras (por partes)', skills: ['mul:2dx2d'], status: 'disponible', rungs: { dibujo: 'Un rectángulo partido en dos trozos', numeros: '23 × 14 = 23 × 4 + 23 × 10', uso: 'Problemas de cajas y filas' } },
        { id: 'mul-3x2', name: 'Multiplicar 3 cifras por 2 cifras (por partes)', skills: ['mul:3dx2d'], status: 'disponible', rungs: { numeros: '125 × 23 = 125 × 3 + 125 × 20', uso: 'Problemas con números grandes' } },
      ],
    },
    {
      id: 'dividir',
      name: 'Dividir',
      topics: [
        { id: 'div-repaso', name: 'Dividir 2 y 3 cifras entre 1 (repaso)', skills: ['div:2x1:rem', 'div:3x1:rem'], status: 'disponible', rungs: { numeros: 'La galera paso a paso y la prueba' } },
        { id: 'div-4x1', name: 'Dividir 4 cifras entre 1', skills: ['div:4x1:exact', 'div:4x1:rem'], status: 'disponible', rungs: { numeros: 'La galera bajando una cifra cada vez', uso: 'Comprobar con divisor × cociente + resto' } },
        { id: 'div-2-cifras', name: 'Dividir entre un número de 2 cifras', skills: ['div:3x2:exact', 'div:3x2:rem'], status: 'disponible', rungs: { numeros: 'Cuántas veces cabe 23 en 96: estimar y comprobar', uso: 'La galera con restos de dos cifras' } },
      ],
    },
    {
      id: 'calculo-mental',
      name: 'Cálculo mental',
      topics: [
        { id: 'mental-4', name: 'Completar a 1 000, centenas, compensar y dobles', skills: ['mental:completar1000', 'mental:centenas', 'mental:compensar', 'mental:dobles'], status: 'disponible', rungs: { numeros: '1 000 − 650; 48 + 19 = 48 + 20 − 1' } },
      ],
    },
    {
      id: 'problemas',
      name: 'Problemas',
      topics: [
        { id: 'prob-sumar-restar', name: 'Problemas de sumar y restar', skills: ['bar:add', 'bar:sub', 'word:add', 'word:sub'], status: 'disponible', rungs: { dibujo: 'Barra con las partes y el total', uso: 'Escribir la operación' } },
        { id: 'prob-multiplicar', name: 'Problemas de multiplicar', skills: ['bar:mul', 'word:mul'], status: 'disponible', rungs: { dibujo: 'Barras iguales', uso: 'Escribir la operación' } },
        { id: 'prob-dividir', name: 'Problemas de repartir', skills: ['bar:div', 'word:div'], status: 'disponible', rungs: { dibujo: 'Barra repartida en partes iguales', uso: 'Escribir la operación' } },
        { id: 'prob-dos-pasos', name: 'Problemas de dos pasos', skills: ['bar:two'], status: 'disponible', rungs: { dibujo: 'Dos barras: primero una cuenta, luego otra', uso: 'Dos operaciones seguidas' } },
      ],
    },
    {
      id: 'fracciones',
      name: 'Fracciones',
      topics: [
        { id: 'fracciones-12', name: 'Fracciones con denominador hasta 12', skills: fractions(['shade', 'read', 'name'], [5, 6, 8, 10, 12]), status: 'disponible', rungs: { dibujo: 'Figuras partidas en partes iguales', numeros: 'Leer y escribir 5/8, 7/12' } },
        { id: 'fraccion-cantidad-4', name: 'Fracción de una cantidad', skills: fractions(['of'], [3, 4, 5, 6, 8, 10]), status: 'disponible', rungs: { dibujo: 'Grupos iguales', numeros: '3/4 de 20: 20 : 4 × 3', uso: 'Problemas de repartos' } },
        { id: 'fracciones-comparar', name: 'Comparar fracciones', skills: [fractionSkill('compare')], status: 'disponible', rungs: { dibujo: 'Dos barras iguales partidas', numeros: '3/8 y 5/8: mismo denominador, más partes' } },
        { id: 'fracciones-sumar', name: 'Sumar y restar fracciones de igual denominador', skills: [fractionSkill('add'), fractionSkill('sub')], status: 'disponible', rungs: { dibujo: 'Juntar o quitar partes de barras iguales', numeros: '2/8 + 3/8: el número de abajo no cambia' } },
      ],
    },
    {
      id: 'dinero',
      name: 'Dinero',
      topics: [
        { id: 'cambio-presupuesto', name: 'Precios, cambio y euros con céntimos', skills: ['money:change', 'money:add', 'money:convert'], status: 'disponible', rungs: { numeros: '3,75 € + 2,40 €; cambio de 10 €', uso: 'Problemas de compra' } },
      ],
    },
    {
      id: 'medida',
      name: 'Medida',
      topics: [
        { id: 'longitud-4', name: 'Longitud: km, m y cm', skills: ['measure:unit:length', 'measure:convert:length'], status: 'disponible', rungs: { numeros: '1 km = 1 000 m; 1 m = 100 cm', uso: 'Elegir la unidad de una distancia' } },
        { id: 'masa-capacidad-4', name: 'Masa y capacidad: kg y g, l y ml', skills: ['measure:convert:mass', 'measure:convert:capacity'], status: 'disponible', rungs: { numeros: '1 kg = 1 000 g; 1 l = 1 000 ml' } },
        { id: 'medir-problemas', name: 'Sumar medidas y estimar', skills: ['measure:add', 'measure:estimate'], status: 'disponible', rungs: { uso: '¿Es razonable este resultado?' } },
      ],
    },
    {
      id: 'tiempo',
      name: 'Tiempo',
      topics: [
        { id: 'reloj-4', name: 'Reloj de agujas y digital', skills: ['clock:read:5', 'clock:convert:day'], status: 'disponible', rungs: { numeros: '17:35 = las seis menos veinticinco de la tarde' } },
        { id: 'duraciones-4', name: 'Duraciones y unidades de tiempo', skills: ['time:end', 'time:elapsed', 'time:units'], status: 'disponible', rungs: { dibujo: 'Recta de horas', uso: 'Horarios de la vida diaria' } },
      ],
    },
    {
      id: 'geometria',
      name: 'Geometría',
      topics: [
        { id: 'angulos', name: 'Ángulos: rectos, mayores y menores', skills: [geoSkill('angle:type'), geoSkill('angle:tap')], status: 'disponible', rungs: { concreto: 'La esquina de una hoja de papel', dibujo: 'Comparar con el ángulo recto' } },
        { id: 'perimetro', name: 'Perímetro', skills: [geoSkill('perimeter')], status: 'disponible', rungs: { dibujo: 'Figuras con la medida de cada lado', uso: 'Vallas y marcos' } },
        { id: 'area', name: 'Área: contar cuadraditos', skills: [geoSkill('area')], status: 'disponible', rungs: { concreto: 'Cubrir una figura con baldosas', dibujo: 'Figuras en una cuadrícula', numeros: 'Contar fila a fila' } },
        { id: 'simetria', name: 'Ejes de simetría', skills: [geoSkill('symmetry')], status: 'disponible', rungs: { concreto: 'Doblar papel y recortar', dibujo: 'La línea que parte la figura en dos mitades iguales' } },
        { id: 'recorridos', name: 'Recorridos en una cuadrícula', skills: ['pos:route'], status: 'disponible', rungs: { dibujo: 'Flechas en una cuadrícula', uso: 'Dar indicaciones' } },
        { id: 'poligonos-cuerpos', name: 'Polígonos, círculo y cuerpos', skills: [geoSkill('poly:name'), geoSkill('circle'), geoSkill('solid:faces')], status: 'disponible', rungs: { concreto: 'Cajas, latas y pelotas', numeros: 'Lados, caras y vértices' } },
      ],
    },
    {
      id: 'estadistica',
      name: 'Gráficos y probabilidad',
      topics: [
        { id: 'graficos-4', name: 'Gráficas de barras y pictogramas', skills: ['chart:bars', 'chart:pict:x'], status: 'disponible', rungs: { dibujo: 'Cada dibujo vale 2, 5 o 10', numeros: 'Cuántos más, cuántos en total' } },
        { id: 'moda', name: 'La moda', skills: ['chart:mode'], status: 'disponible', rungs: { numeros: 'El dato que más se repite' } },
        { id: 'probabilidad', name: 'Seguro, posible o imposible', skills: ['prob:chance'], status: 'disponible', rungs: { concreto: 'Sacar bolas de una bolsa sin mirar' } },
        { id: 'series-4', name: 'Series: qué número habrá más adelante', skills: ['pattern:predict', 'pattern:numbers'], status: 'disponible', rungs: { numeros: '25, 50, 75… ¿qué número estará en el puesto 10?' } },
      ],
    },
  ],
  stages: GRADE4_STAGES,
})
