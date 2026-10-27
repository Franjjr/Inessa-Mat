# Lengua de 3.º: la segunda asignatura de Repasitos

Fecha: 27 de octubre de 2026. Fuente del temario: `docs/curriculum/TEMARIO_PERPLEXITY_3-4.md`, sección «Lengua
Castellana y Literatura» (Real Decreto 157/2022, con Madrid como ejemplo).

## Por qué

El dueño quiere que Repasitos cubra Lengua igual que Matemáticas. Con sus palabras, el niño está «leyendo,
escribiendo, buscando sustantivos, cosas así; la app le enseña qué es un sustantivo, un adjetivo y luego practica, le
enseña palabras, le cuenta historias que le gustan y él lee… más lo que marque el temario».

Lo que le haría torcer el gesto: «que sea aburrido o que solo sean ejercicios sin explicar».

## Lo que ha decidido el dueño

- **Contenido:** lectura, escritura, vocabulario, gramática, ortografía y literatura de 3.º, según el temario. Hay que
  enseñar antes de practicar (clases, como en Matemáticas).
- **Historias:** de aventuras y de animales, con humor. El niño las lee.
- **Escribir:** todo Lengua se contesta con un **teclado de letras** en la pantalla (así aprende también mecanografía).
- **Caligrafía:** una parte aparte y **opcional**, solo si el niño tiene lápiz. Consiste en seguir el contorno de letras
  y palabras, y la app dice lo bien que se ha escrito. **Va en un proyecto aparte, después de este.**
- **El día:** una sesión de Matemáticas y otra de Lengua, **separadas**, primero una y luego la otra, «como en el cole».

## Partes y orden

1. **Este proyecto: Lengua de 3.º** (todo lo de abajo).
2. Después: Caligrafía con lápiz (opcional).
3. Después: Lengua de 4.º, con el mismo formato.

## Objetivos

1. Lengua se activa por niño desde la zona de adultos, como ya se prevé (`SUBJECTS` en `src/types/child.ts`, hoy
   `language` con `available: false`).
2. Un temario de Lengua de 3.º como datos, con bloques, temas y pasos de menos a más, igual que el de Matemáticas
   (`src/content/syllabus/`).
3. Clases de cinco fases para cada tema de gramática, ortografía y vocabulario (mismo formato que las de Matemáticas:
   para qué sirve, ejemplo resuelto, práctica guiada, práctica sola y cierre).
4. Ejercicios nuevos de Lengua que se contestan tocando palabras o con el teclado de letras.
5. Historias para leer, con preguntas de comprensión.
6. Una sesión diaria de Lengua de unos 15 minutos y su sitio en el menú, en la ficha del adulto y en la prueba inicial.

## Fuera de alcance

- Caligrafía con lápiz y Lengua de 4.º (proyectos siguientes).
- Comunicación oral (conversar, exponer, debatir): no se practica sola delante de una pantalla. Lo mismo con la parte
  de «Lenguas y sociedad» que pide hablar con la clase.
- Corregir redacciones libres largas (cuento, carta…): la app propone escritura guiada y corta (ver abajo).
- Una aventura o mapa nuevo solo para Lengua.

## Anti-objetivos (fallaría aunque funcione)

- Que sea aburrido: listas de ejercicios sin historia ni humor.
- Ejercicios sin explicar antes.
- Pistas que dan la respuesta (regla de siempre del proyecto).
- Historias o textos copiados de libros: todas las historias son **propias**.
- Lenguaje inclusivo (regla del dueño: masculino genérico, dos géneros).
- Que Lengua estropee Matemáticas: progreso, sesión, estrellas y menú de Matemáticas siguen como ahora.

## Temario de 3.º (del documento de Perplexity) y cómo se practica

| Bloque | Temas | Cómo se practica en la pantalla |
|---|---|---|
| Lectura | Leer con fluidez y entonación. Idea principal. Preguntas sobre el texto | Historias cortas propias; preguntas de elegir y de escribir una palabra; ordenar lo que pasó |
| Escritura | Cuento, descripción, carta, invitación, notas. Copias y dictados | Copiar frases con el teclado; dictado con la voz de la app; escritura guiada corta (completar una invitación, una nota) |
| Vocabulario | Abecedario y diccionario. Sinónimos y antónimos. Familias de palabras. Aumentativos y diminutivos. Palabras compuestas | Ordenar por el abecedario; buscar en un mini diccionario; emparejar; escribir la palabra que falta |
| Gramática | Letras, sílabas y palabras. Sustantivo (común, propio, género y número). Artículo. Adjetivo. Verbo (presente, pasado y futuro). Oración: sujeto y predicado | Tocar las palabras de una clase en una frase («toca los sustantivos»); clasificar; cambiar género, número o tiempo escribiendo |
| Ortografía | Mayúsculas. c/qu, g/gu/gü, r/rr, mp/mb. Sílaba tónica y átona. Punto, coma, ¿? y ¡! | Completar la letra que falta; poner mayúsculas y signos; dictado corto |
| Literatura | Cuentos, fábulas, poemas y rima. Adivinanzas y trabalenguas | Leer y contestar; buscar las palabras que riman; adivinanzas |

El orden exacto de los temas en el curso (por trimestres) lo propone quien lo construya, de menos a más, como en
Matemáticas.

## Cómo es la experiencia (lo pedido y mis suposiciones marcadas)

- **Sesión de Lengua (unos 15 minutos)**, con la misma forma que la de Matemáticas: un calentamiento, «Lo nuevo» con su
  clase si el tema es nuevo, una mezcla de repaso y **una historia para leer** con sus preguntas. *(Mi propuesta: la
  historia es la parte central de cada día.)*
- **Historias:** cortas (para 3.º, de unas 120 a 250 palabras), propias, de aventuras y animales, con humor, con Lumi y
  el compañero animal del niño como personajes. Se pueden escuchar con la voz de la app y leer a la vez. *(Mi propuesta:
  una historia nueva cada pocos días, y el niño puede releer las que ya leyó.)*
- **Teclado de letras:** el de la pantalla tiene la disposición de un teclado de verdad (QWERTY español, con ñ), tildes
  y mayúsculas. Si el aparato tiene teclado físico, también vale. *(Mi suposición.)*
- **Ayudas:** «Pista», «No lo sé», «Inténtalo otra vez» y «Ahora no», igual que en Matemáticas.
- **Menú:** el botón «Hoy» lleva primero a Matemáticas y, al terminar, ofrece la sesión de Lengua *(mi suposición del
  orden «primero una cosa y luego otra»)*. Si el adulto solo tiene activada una asignatura, el menú es como ahora.
- **Ficha del adulto:** Lengua con sus temas, lo que domina, «No lo sabía» y «Necesitó otro intento».
- **Prueba inicial de Lengua:** corta, aparte de la de Matemáticas, para saber por dónde empezar.

## Decisiones de Claude (el dueño puede cambiarlas)

- Tres proyectos por separado, en el orden de arriba.
- 3.º primero, como en Matemáticas.
- La historia es parte de cada sesión de Lengua.
- El orden del día: Matemáticas primero y luego Lengua.
- El teclado en pantalla es QWERTY español.
- **Premios compartidos:** las estrellas, el cuerno de Lumi, la tienda, el álbum y el cofre son los mismos para las dos
  asignaturas (un solo «monedero»). Cada asignatura da sus estrellas de sesión una vez al día. El dominio y la
  sesión del día van por asignatura (las *skills* de Lengua tienen su propio prefijo y no se mezclan con las de
  Matemáticas).
- **Sin mapa para Lengua:** su temario va por etapas sin mundo asociado, como el de 2.º (`GRADE2_SYLLABUS`). La
  aventura y los guardianes siguen siendo de Matemáticas.
- **Curso:** Lengua solo se puede activar para niños de 3.º (y sin curso, que siguen el temario de 3.º). Para 2.º y 4.º
  sale como «Pronto» hasta que tengan su temario.
- **Qué cuenta para el dominio:** las preguntas de comprensión de las historias, los ejercicios de gramática,
  ortografía y vocabulario, las copias y los dictados (cada palabra es un acierto o un fallo) cuentan como en
  Matemáticas: solo la primera respuesta, con «Inténtalo otra vez», «No lo sé» y la ficha. La escritura guiada corta
  (una invitación, una nota) no se puntúa: cuenta como hecha al terminarla.

## Lo que queda para quien lo construya

- El modelo de datos de la segunda asignatura (temario, progreso, dominio y sesiones por asignatura) sin romper el de
  Matemáticas.
- Los tipos de ejercicio de Lengua y sus pistas.
- El número y el orden de las clases y de las historias de la primera entrega.
- Cómo se comprueba una respuesta escrita (mayúsculas, tildes, errores de una letra) y qué se considera un fallo de
  ortografía.
