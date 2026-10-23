/* Temario de 2.º de Primaria (matemáticas) como datos, con el mismo modelo que el de 3.º: bloques para el informe del
   adulto y un orden de enseñanza propio en ocho etapas y tres trimestres, en espiral. La ley fija el primer ciclo
   (1.º-2.º) sin reparto por curso (docs/curriculum/MATEMATICAS_PRIMARIA.md): números hasta 999, sumas y restas,
   monedas de 1 y 2 € y billetes, metro, kilo y litro, la hora, figuras y cuerpos, pictogramas y patrones. Las tablas
   del 2, 3, 4, 5 y 10 entran como inicio de la multiplicación (práctica habitual, no ley). Cada etapa va con un mundo
   de la aventura de 2.º (la temporada 'c2', src/content/c2): el mismo mapa con historias y paradas de 2.º. Los números
   usan las destrezas «hasta 999» y el dinero, euros enteros, sin céntimos. */
import { addSkill, compareSkill, geoSkill, lineSkill, moneySkill, orderSkill, placeSkill } from '@/engine/skills'
import type { Syllabus, SyllabusStage } from './model'
import { tableTopic, withStageTerms } from './helpers'

export const GRADE2_STAGES: SyllabusStage[] = [
  // 1.er trimestre
  { id: 'etapa-1', term: 1, worldId: 'w1', topics: ['contar-saltos', 'descomponer-999', 'leer-escribir-999', 'comparar-ordenar-999', 'monedas-billetes'] },
  { id: 'etapa-2', term: 1, worldId: 'w2', topics: ['suma-2d-sin-llevar', 'completar-10-100', 'suma-2d-llevando', 'prob-sumar', 'reloj-en-punto-media-cuarto'] },
  { id: 'etapa-3', term: 1, worldId: 'w3', topics: ['figuras', 'lineas', 'posicion', 'series'] },
  // 2.º trimestre
  { id: 'etapa-4', term: 2, worldId: 'w4', topics: ['resta-2d-sin-llevar', 'resta-2d-prestando', 'prob-restar', 'igualdad', 'pagar-euros'] },
  { id: 'etapa-5', term: 2, worldId: 'w5', topics: ['dobles-mitades', 'recta-999', 'calendario', 'medir-unidades', 'regla'] },
  { id: 'etapa-6', term: 2, worldId: 'w6', topics: ['pictogramas', 'sumar-decenas', 'sumar-precios-euros', 'cuerpos'] },
  // 3.er trimestre
  { id: 'etapa-7', term: 3, worldId: 'w7', topics: ['sumas-repetidas', 'tabla-2', 'tabla-10', 'tabla-5', 'prob-multiplicar'] },
  { id: 'etapa-8', term: 3, worldId: 'w8', topics: ['tabla-3', 'tabla-4', 'suma-3d', 'resta-3d', 'encuentra-error'] },
]

export const GRADE2_SYLLABUS: Syllabus = withStageTerms({
  id: 'matematicas-2-primaria',
  course: 2,
  blocks: [
    {
      id: 'numeros',
      name: 'Números hasta 999',
      topics: [
        { id: 'contar-saltos', name: 'Contar de 2 en 2, de 5 en 5 y de 10 en 10', skills: ['skip:2', 'skip:5', 'skip:10'], status: 'disponible', rungs: { concreto: 'Parejas de calcetines, manos de cinco dedos', dibujo: 'Saltos iguales en la recta', numeros: 'La serie con huecos: 5, 10, __, 20' } },
        { id: 'descomponer-999', name: 'Centenas, decenas y unidades (345 = 300 + 40 + 5)', skills: [placeSkill('blocks', 999), placeSkill('expanded', 999)], status: 'disponible', rungs: { concreto: 'Bloques de centena, decena y unidad', numeros: 'Las partes escritas: 300 + 40 + 5' } },
        { id: 'leer-escribir-999', name: 'Leer y escribir hasta 999', skills: [placeSkill('words', 999)], status: 'disponible', rungs: { dibujo: 'Tabla de centenas, decenas y unidades', numeros: 'El número en palabras, sin cifras' } },
        { id: 'comparar-ordenar-999', name: 'Comparar y ordenar hasta 999', skills: [compareSkill(999), orderSkill(999)], status: 'disponible', rungs: { dibujo: 'Columnas de centenas, decenas y unidades', numeros: 'Signos < > = y orden de menor a mayor' } },
        { id: 'recta-999', name: 'La recta numérica: saltos de 10 y de 100', skills: [lineSkill(10, 999), lineSkill(100, 999)], status: 'disponible', rungs: { dibujo: 'Saltos de 10 y de 100 en la recta', numeros: '340 + 10 = 350; 340 + 100 = 440' } },
        { id: 'series', name: 'Series y patrones', skills: ['pattern:shapes', 'pattern:numbers'], status: 'disponible', rungs: { concreto: 'Collares de cuentas de colores', dibujo: 'Figuras que se repiten', numeros: '3, 6, 9, __' } },
      ],
    },
    {
      id: 'sumas-restas',
      name: 'Sumas y restas',
      topics: [
        { id: 'suma-2d-sin-llevar', name: 'Suma de 2 cifras sin llevadas', skills: [addSkill(2, 0)], status: 'disponible', rungs: { concreto: 'Bloques de decenas y unidades', dibujo: 'Barras de decenas y unidades', numeros: 'La cuenta en columna', uso: 'Problemas de juntar' } },
        { id: 'suma-2d-llevando', name: 'Suma de 2 cifras llevando', skills: [addSkill(2, 1)], status: 'disponible', rungs: { concreto: 'Cambiar 10 unidades por 1 decena', dibujo: 'La llevada dibujada arriba', numeros: 'La cuenta en columna con llevadas', uso: 'Problemas de juntar' } },
        { id: 'resta-2d-sin-llevar', name: 'Resta de 2 cifras sin llevadas', skills: ['sub:2d:b0'], status: 'disponible', rungs: { concreto: 'Quitar bloques', dibujo: 'Tachar en la barra', numeros: 'La cuenta en columna', uso: 'Problemas de quitar' } },
        { id: 'resta-2d-prestando', name: 'Resta de 2 cifras pidiendo prestado', skills: ['sub:2d:b1'], status: 'disponible', rungs: { concreto: 'Cambiar una decena por 10 unidades', dibujo: 'Cruces en los dígitos', numeros: 'La cuenta en columna', uso: 'Problemas de comparar' } },
        { id: 'suma-3d', name: 'Suma de 3 cifras (hasta 999)', skills: [addSkill(3, 0), addSkill(3, 1, 999)], status: 'disponible', rungs: { concreto: 'Bloques de centenas, decenas y unidades', dibujo: 'Columnas de valor posicional', numeros: 'La cuenta en columna, sin pasar de 999', uso: 'Problemas de juntar' } },
        { id: 'resta-3d', name: 'Resta de 3 cifras', skills: ['sub:3d:b0', 'sub:3d:b1'], status: 'disponible', rungs: { concreto: 'Quitar bloques de centenas, decenas y unidades', dibujo: 'Cruces en los dígitos', numeros: 'La cuenta en columna', uso: 'Problemas de quitar' } },
        { id: 'igualdad', name: 'Signo igual: los dos lados valen lo mismo', skills: ['eq:flex'], status: 'disponible', rungs: { concreto: 'Balanza con dos platillos', numeros: '5 + 3 = __ + 6 y 7 = 3 + __' } },
        { id: 'encuentra-error', name: 'Encuentra el error en una suma o una resta', skills: ['hunt:add', 'hunt:sub'], status: 'disponible', rungs: { concreto: 'Mirar la cuenta columna a columna', dibujo: 'Marcar la columna donde falla', numeros: 'Decidir si está bien y corregirla' } },
      ],
    },
    {
      id: 'calculo-mental',
      name: 'Cálculo mental',
      topics: [
        { id: 'completar-10-100', name: 'Completar a 10 y a 100', skills: ['mental:completar10', 'mental:completar100'], status: 'disponible', rungs: { concreto: 'Los dedos de las dos manos', dibujo: 'La recta: cuánto falta para el número redondo', numeros: 'Contar hasta el número redondo' } },
        { id: 'dobles-mitades', name: 'Dobles y mitades', skills: ['mental:dobles', 'mental:mitades'], status: 'disponible', rungs: { concreto: 'Dos montones iguales', numeros: 'El doble de 15 = 10 + 10 + 5 + 5' } },
        { id: 'sumar-decenas', name: 'Sumar y restar decenas', skills: ['mental:decenas'], status: 'disponible', rungs: { concreto: 'Bloques de decenas', dibujo: 'Saltos de 10 en la recta', numeros: '340 + 20 = 360' } },
      ],
    },
    {
      id: 'multiplicar',
      name: 'Empezar a multiplicar',
      topics: [
        { id: 'sumas-repetidas', name: 'Grupos iguales y sumas repetidas', skills: ['concept:groups', 'concept:array'], status: 'disponible', rungs: { concreto: 'Grupos iguales de objetos', dibujo: 'Filas y columnas', numeros: '3 + 3 + 3 + 3 = 4 × 3' } },
        tableTopic(2),
        tableTopic(10),
        tableTopic(5),
        tableTopic(3),
        tableTopic(4),
      ],
    },
    {
      id: 'problemas',
      name: 'Problemas',
      topics: [
        { id: 'prob-sumar', name: 'Problemas de juntar', skills: ['bar:add'], status: 'disponible', rungs: { dibujo: 'Barra con las dos partes y el total', uso: 'Escribir la operación' } },
        { id: 'prob-restar', name: 'Problemas de quitar y comparar', skills: ['bar:sub'], status: 'disponible', rungs: { dibujo: 'Barra con la parte que se quita o la diferencia', uso: 'Escribir la operación' } },
        { id: 'prob-multiplicar', name: 'Problemas de grupos', skills: ['bar:mul'], status: 'disponible', rungs: { dibujo: 'Barras iguales, una por grupo', uso: 'Escribir la operación' } },
      ],
    },
    {
      id: 'dinero',
      name: 'Dinero',
      topics: [
        { id: 'monedas-billetes', name: 'Monedas y billetes', skills: ['money:recognise'], status: 'disponible', rungs: { concreto: 'Monedas y billetes en la pantalla', dibujo: 'Cada pieza con su valor impreso', uso: 'Contar el dinero de una hucha' } },
        { id: 'pagar-euros', name: 'Pagar con monedas de euro y billetes', skills: [moneySkill('pay', true)], status: 'disponible', rungs: { concreto: 'Poner monedas de 1 y 2 € y billetes en la bandeja hasta el precio', uso: 'Pagar justo en una tienda' } },
        { id: 'sumar-precios-euros', name: 'Sumar precios en euros', skills: [moneySkill('add', true)], status: 'disponible', rungs: { dibujo: 'Precios en tarjetas, uno debajo de otro', numeros: '6 € + 9 € = ?', uso: 'Problemas de compra' } },
      ],
    },
    {
      id: 'tiempo',
      name: 'Tiempo',
      topics: [
        { id: 'reloj-en-punto-media-cuarto', name: 'Reloj: en punto, y media, y cuarto', skills: ['clock:read:30', 'clock:read:15', 'clock:set:30'], status: 'disponible', rungs: { concreto: 'Reloj de agujas: poner la aguja larga en el 12, el 6, el 3 o el 9', dibujo: 'La aguja larga en el 3 (cuarto) o en el 6 (media)', numeros: 'La frase: «las tres y cuarto», «las seis y media»', uso: 'A qué hora empieza una actividad' } },
        { id: 'calendario', name: 'Días de la semana, meses y unidades de tiempo', skills: ['time:units', 'cal:weekday', 'cal:month'], status: 'disponible', rungs: { concreto: 'La semana en tarjetas de lunes a domingo', dibujo: 'Los nudillos para los meses', numeros: '1 hora = 60 minutos; 1 día = 24 horas', uso: '¿Qué día será dentro de 3 días?' } },
      ],
    },
    {
      id: 'medida',
      name: 'Medida',
      topics: [
        { id: 'medir-unidades', name: 'Metro, kilo y litro: qué unidad usar', skills: ['measure:unit:length', 'measure:unit:mass', 'measure:unit:capacity'], status: 'disponible', rungs: { concreto: 'Una botella, una mochila, una mesa', dibujo: 'Cada objeto con la unidad que le va', uso: 'Elegir la unidad de lo que se mide, se pesa o se llena' } },
        { id: 'regla', name: 'Medir con la regla', skills: ['measure:ruler'], status: 'disponible', rungs: { concreto: 'Regla en pantalla y un objeto', numeros: 'Hasta dónde acaba menos dónde empieza' } },
      ],
    },
    {
      id: 'geometria',
      name: 'Geometría',
      topics: [
        { id: 'figuras', name: 'Figuras planas: nombre, lados y esquinas', skills: [geoSkill('poly:name'), geoSkill('poly:sides')], status: 'disponible', rungs: { concreto: 'Figuras de cartón de distintas formas y giros', dibujo: 'Contar lados y esquinas marcándolos', numeros: 'Triángulo 3, cuadrado y rectángulo 4' } },
        { id: 'lineas', name: 'Líneas rectas, curvas y poligonales', skills: [geoSkill('line:type')], status: 'disponible', rungs: { concreto: 'Un cordel estirado y uno suelto', dibujo: 'Repasar líneas con el dedo', numeros: 'Recta, curva o poligonal' } },
        { id: 'cuerpos', name: 'Cuerpos: cubo, esfera, cilindro…', skills: [geoSkill('solid:name'), geoSkill('solid:roll')], status: 'disponible', rungs: { concreto: 'Pelotas, cajas, latas y conos', dibujo: 'Caras planas y partes redondas', uso: '¿Qué rueda y qué no?' } },
        { id: 'posicion', name: 'Izquierda, derecha, encima y debajo', skills: ['pos:relative', 'pos:next'], status: 'disponible', rungs: { concreto: 'Moverse por la clase siguiendo órdenes', dibujo: 'Cosas en una cuadrícula', uso: '¿Qué hay a la derecha del gato?' } },
      ],
    },
    {
      id: 'estadistica',
      name: 'Gráficos',
      topics: [
        { id: 'pictogramas', name: 'Pictogramas y gráficas de barras', skills: ['chart:pict', 'chart:bars'], status: 'disponible', rungs: { concreto: 'Contar votos de la clase con gomets', dibujo: 'Un dibujo por cada voto', numeros: 'Leer cuántos hay en cada barra' } },
      ],
    },
  ],
  stages: GRADE2_STAGES,
})
