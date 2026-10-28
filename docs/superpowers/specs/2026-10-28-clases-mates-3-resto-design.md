# Clases de Matemáticas de 3.º: todos los temas que faltan

Fecha: 28 de octubre de 2026. Sigue a `2026-10-27-clases-y-menu-design.md`, que hizo las 18 clases de las cuatro
operaciones y dejó el resto «para proyectos siguientes».

## Por qué

El dueño pidió que la app enseñe antes de practicar («son todo ejercicios, no hay explicaciones»). Hoy solo las
operaciones tienen clase: en la mayoría de los temas de 3.º el niño llega a «Lo nuevo» sin que nadie le explique nada. El
dueño quiere que tengan clase todos; a su hija le cuestan todos por igual, así que no hay orden de prioridad propio.

## Lo que ha decidido el dueño

- Hacer las clases de todos los temas de 3.º que no la tienen.
- Mismo formato que las clases actuales.
- Ningún tema va antes por dificultad («todo es igual de difícil para ella»).

## Objetivos

1. Cada tema que devuelve `syllabusFor('math', 3)` y que hoy no tiene clase (`classForTopic`) tiene una clase de cinco fases (para qué sirve, ejemplo resuelto, práctica
   guiada, práctica sola y cierre), con el DSL y el reproductor que ya usan las de `src/content/classes/grade3.ts`.
2. Los temas que ya tienen una lección en el mapa (`src/content/lessons/w1.ts` … `w8.ts`, por ejemplo las tablas)
   aprovechan sus pasos (dibujo y ejemplo resuelto) como la fase de ejemplo de su clase, si la lección enseña de verdad
   ese tema; las otras cuatro fases se escriben igual que en cualquier clase *(decisión de Claude: así todas las
   clases tienen las cinco fases)*. Hacer la clase o la lección del mapa cuenta como hecha (como ya se hace hoy).
3. Dibujos nuevos de lección donde el tema lo pide:
   - **Dinero:** monedas y billetes de euro, pagar y el cambio.
   - **Reloj:** un reloj de agujas que marca la hora del ejemplo, y el reloj digital al lado.
   - **Fracciones:** una figura o una tarta partida en partes iguales con unas coloreadas; una cantidad repartida en
     grupos.
   - **Geometría:** polígonos con sus lados y esquinas, rectas (paralelas, perpendiculares, segmentos, semirrectas),
     ángulos (recto, agudo, obtuso), círculo y circunferencia, cuerpos, perímetro con las medidas en los lados, y una
     cuadrícula para recorridos.
   - **Medida:** una regla con un objeto encima; unidades con objetos de referencia.
   - **Datos:** un pictograma y una gráfica de barras pequeños; una bolsa de bolas para «seguro, posible, imposible».
   - Los temas de números, cálculo mental y problemas reutilizan los dibujos que ya hay (valor posicional, recta,
     modelo de barras) o el texto grande.
4. La práctica de cada clase usa los ejercicios que el tema ya tiene en el generador. Ningún tipo de ejercicio nuevo.
5. `PLAN_DOCENTE.md` (§10 Clases) recoge la lista completa.

## Fuera de alcance

- Clases de 2.º y 4.º (proyecto aparte; el formato sirve igual).
- Tipos de ejercicio nuevos.
- Cambiar el orden del temario o el planificador.

## Anti-objetivos

- Clases que sean ejercicios con otro nombre: cada una explica con un dibujo y un ejemplo resuelto antes de pedir
  nada.
- Pistas que den la respuesta.
- Errores de contenido (horas, monedas que no existen, nombres de figuras o ángulos mal puestos). Las monedas y los
  billetes son los del euro de verdad (1, 2, 5, 10, 20 y 50 céntimos; 1 y 2 €; billetes de 5, 10, 20, 50…).
- Lenguaje inclusivo (masculino genérico).
- Romper las 18 clases que ya hay o las lecciones del mapa.
- Dibujos que no se vean bien en un móvil vertical pequeño (360×740) o que no se lean en tablet.

## Decisiones de Claude (el dueño puede cambiarlas)

- Solo 3.º en este proyecto; 2.º y 4.º después.
- El orden de construcción sigue el del temario (lo que el niño se encontrará antes, primero), agrupado por bloques
  para que cada bloque comparta sus dibujos.
- Los dibujos se hacen en SVG dentro de la app, como los actuales (sin imágenes externas).
- La voz de Lumi en las clases sigue la regla de siempre (solo suena si el ajuste está activo; nunca en pruebas).

## Lo que queda para quien lo construya

- Qué lecciones del mapa valen como clase de qué tema (y cuáles hay que escribir aunque haya lección parecida).
- El texto de cada clase y sus ejemplos.
- El diseño exacto de cada dibujo y cómo se reparte el trabajo en tareas.
