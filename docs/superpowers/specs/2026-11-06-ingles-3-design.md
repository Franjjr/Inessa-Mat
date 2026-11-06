# Inglés de 3.º: la tercera asignatura de Repasitos

Fecha: 6 de noviembre de 2026. Fuente del temario: Real Decreto 157/2022, área «Lengua Extranjera», primer ciclo
y comienzo del segundo (3.º). En `docs/curriculum/` no hay temario de inglés: el de abajo es una propuesta de Claude
basada en el decreto y en los libros habituales de 3.º, y el dueño puede cambiarlo.

## Por qué

El dueño quiere que Repasitos cubra Inglés igual que Matemáticas y Lengua. Describe así a la niña: lo entiende al oírlo
y lee palabras sueltas. Quiere «que siga aprendiendo vocabulario y luego juegos con números y con palabras en inglés»,
«aprender los números y operaciones matemáticas sencillas en inglés», y «que hable en voz alta para medir
pronunciación estaría genial».

Lo que le haría torcer el gesto: **«que sea aburrido o solo ejercicios sin explicar»**.

## Lo que ha decidido el dueño

- **Contenido:** vocabulario y frases básicas de 3.º, con clases antes de practicar, como en Lengua.
- **Nivel de partida:** lo entiende al oírlo y lee palabras sueltas.
- **Números en inglés:** se aprenden los números y las operaciones sencillas en inglés. Juego de números:
  1. la app muestra un número y la niña lo escribe en inglés («7» → «seven»);
  2. la app dice un número en inglés y ella escribe la cifra («fourteen» → «14»);
  3. la app dice una operación en inglés y ella escribe el resultado («three plus four» → «7»).
- **Juegos de palabras en inglés** además del de números.
- **Hablar en voz alta y medir la pronunciación.** Lo aceptó con estas condiciones:
  - el micrófono está **apagado de serie** y solo lo enciende un adulto, con consentimiento explícito;
  - la pronunciación **anima con estrellas y nunca bloquea** el avance.
- **El día:** una **tercera sesión diaria, más corta, de unos 10 minutos**, después de Matemáticas (15) y Lengua (15).
- **Informe del adulto:** qué palabras ha aprendido y en cuáles falla.
- **Mapa:** Inglés tiene **su propio lugar en el mapa, con historia**.

## Objetivos

1. Inglés se activa por niño desde la zona de adultos (`SUBJECTS` en `src/types/child.ts`, hoy `english` con
   `available: false`).
2. Un temario de Inglés de 3.º como datos (`src/content/syllabus/`), con bloques, temas y pasos de menos a más, como
   `lengua3.ts`. Cada tema es una destreza con su prefijo propio, por ejemplo `eng:<área>:<tema>`, que no se mezcla
   con Matemáticas ni con Lengua.
3. Clases de cinco fases para cada tema (para qué sirve, ejemplo resuelto, práctica guiada, práctica sola y cierre),
   con el mismo formato que las de Matemáticas y Lengua. Lumi explica en español y las palabras en inglés suenan en
   inglés.
4. Ejercicios de inglés:
   - oír y tocar la imagen;
   - unir la palabra con el dibujo;
   - escribir una palabra corta;
   - completar una frase;
   - el juego de números;
   - un juego de palabras;
   - decirlo en voz alta, si el adulto lo ha activado.
5. Una sesión diaria de Inglés de unos 10 minutos, con su sitio en «Hoy», en la ficha del adulto y en una prueba
   inicial corta.
6. Un lugar propio en el mapa, con su historia (ver «El lugar de Inglés en el mapa»).
7. Pronunciación con el micrófono, desactivada de serie, con consentimiento del adulto y la política de privacidad
   actualizada.
8. El informe del adulto: palabras aprendidas por tema, palabras en las que falla con el error que comete, y números.

## Fuera de alcance

- Inglés de 2.º y de 4.º. Para esos cursos sale como «Pronto», igual que Lengua lo hizo al principio.
- Conversación libre con la app y corrección de textos largos en inglés.
- Gramática formal explicada como tal (tiempos verbales, reglas). En 3.º la gramática entra a través de frases hechas
  («I like…», «I've got…», «Can I have…?»).
- Caligrafía en inglés.
- El resumen por correo electrónico para las familias y el vídeo de demostración, que van en proyectos aparte, después
  de este.

## Anti-objetivos (fallaría aunque funcione)

- **Que sea aburrido**: listas de ejercicios sin historia, sin juego y sin humor.
- **Ejercicios sin explicar antes**: nada nuevo se practica sin que Lumi lo haya enseñado en una clase.
- Que el micrófono se encienda sin que un adulto lo haya activado, o que se guarde o se envíe la voz de la niña más allá
  de lo imprescindible para puntuarla.
- Que una mala pronunciación impida avanzar, quite estrellas o se presente como un suspenso.
- Pistas que dan la respuesta, que es una regla de siempre del proyecto.
- Historias o textos copiados de libros de texto: todo es propio.
- Que Inglés estropee Matemáticas o Lengua: su progreso, sus sesiones, sus estrellas y su menú siguen como ahora.
- Lenguaje inclusivo en los textos en español: masculino genérico y dos géneros, que es la regla del dueño.

## Temario de 3.º (propuesta de Claude)

| Bloque | Temas | Cómo se practica |
|---|---|---|
| Saludos y yo | Hello / Goodbye, What's your name? / I'm…, How old are you? / I'm eight, How are you? | Oír y elegir la respuesta; completar el diálogo; decirlo en voz alta |
| Números | 0–20; decenas 30–100; 21–100; plus, minus, times, equals | El juego de números (los tres retos); oír y escribir la cifra |
| Colores y formas | red, blue… ; circle, square, triangle… | Oír y tocar; colorear siguiendo una orden («colour the cat red») |
| Animales | mascotas, granja, salvajes; It's a…, It's big/small | Oír y tocar; unir; escribir la palabra |
| Familia | mum, dad, brother, sister, grandma…; This is my… | Un árbol de familia; completar frases |
| Comida | fruit, vegetables, meals; I like… / I don't like…, Can I have…, please? | Elegir lo que le gusta a un personaje; pedir en una tienda |
| Ropa | T-shirt, trousers, shoes…; I'm wearing… | Vestir al compañero siguiendo una orden |
| El cole | pencil, rubber, book…; classroom instructions (Sit down, Open your book) | Oír y tocar; obedecer órdenes |
| La casa | rooms and furniture; Where's the…? It's in/on/under… | Buscar objetos en un dibujo de la casa |
| El cuerpo | head, arms, legs…; I've got… | Señalar las partes; completar |
| El tiempo y las estaciones | sunny, rainy, cold…; What's the weather like? | Elegir el tiempo de una imagen |
| Días y meses | Monday…, January…; What day is it today? | Ordenar; completar el calendario |

Quien lo construya ordena los temas en etapas por trimestre, de menos a más, como en Lengua. Saludos y números van
pronto, porque el juego de números se usa a diario.

## Cómo es la experiencia (lo pedido, con las suposiciones marcadas)

### La sesión diaria (unos 10 minutos)

Tiene la misma forma que las de Matemáticas y Lengua:

1. **Calentamiento**: palabras que ya conoce.
2. **«Lo nuevo»**: la clase del tema si es nuevo, para que nunca haya ejercicios sin explicar.
3. **Práctica variada** mezclada con el repaso de las palabras en las que falla.
4. **Un juego final**, de números o de palabras, para que acabe con algo divertido. *(Suposición de Claude.)*

«Hoy» ofrece Inglés después de Lengua, o después de Matemáticas si Lengua no está activada. Si solo está activada una
asignatura, el menú queda como ahora.

### Las voces

- Las palabras y frases en inglés las dice una **voz neuronal británica** de Azure, por ejemplo `en-GB-SoniaNeural` o
  la versión multilingüe de Ximena fijada a `en-GB`, servida por `/api/tts` como las demás. *(Propuesta de Claude; el
  dueño elige la voz de oído, como hizo con las españolas.)*
- Lumi explica en español con su voz de siempre.
- El texto que mezcla idiomas («Se dice *seven*») se parte en dos audios, o se marca con `<lang>` en el SSML, para que
  cada parte suene en su idioma.
- Habrá que aceptar el idioma en `/api/tts`, que hoy fija `es-ES`, y revisar que `SAFE_TEXT` deja pasar los apóstrofos
  del inglés («what's»).

### Escribir

- **Palabras en inglés**: se escriben con el **teclado de letras** de Lengua, que también es nuevo. Se aceptan sin
  exigir mayúsculas. Un error de una letra cuenta como fallo, y el informe muestra lo que escribió. *(Propuesta de
  Claude, por coherencia con Lengua.)*
- **Cifras**, en los retos 2 y 3 del juego de números: se escriben como en Matemáticas, a mano o con el teclado de
  números según el aparato.

### El juego de números

Tiene los tres retos que pidió el dueño, en este orden. Lo que sigue son propuestas de Claude:

- Un botón «Otra vez» repite el número o la operación todas las veces que quiera.
- Progresión de los números: primero 0–20, después las decenas y al final 21–100.
- Progresión de las operaciones: primero «plus», después «minus» y al final «times», con resultados hasta 20 al
  principio.
- Lumi explica cada cosa nueva antes del primer reto (los «-teen», las decenas en «-ty», qué significa «plus»).
- Si se equivoca, la app le muestra la respuesta, se la dice en voz alta y se la vuelve a preguntar más tarde.

### Juegos de palabras

El dueño pidió «juegos con palabras en inglés» sin dar más detalle. Claude propone tres:

- **Pares de memoria** con dibujo y palabra.
- **Letras desordenadas** (c-a-t), con la imagen como apoyo.
- **«Simon says»**: oír una orden y tocar lo que pide.

Quien lo construya puede elegir dos para la primera entrega.

### Hablar y pronunciación

- El adulto lo activa en la ficha del niño con un interruptor «Hablar en voz alta (micrófono)», que está apagado de
  serie. Al activarlo ve un texto claro: para qué se usa, que el audio va a un servicio de Microsoft (Azure) para
  puntuarlo y no se guarda, y que puede apagarlo cuando quiera. Tiene que confirmarlo.
- La política de privacidad (`src/adult/legal/PrivacyScreen.tsx`) se actualiza antes de publicarlo.
- Con el micrófono activado, algunos ejercicios dicen «Ahora dilo tú». La niña pulsa, habla y recibe de una a tres
  estrellas, con un mensaje que anima.
  - Siempre hay un botón «Saltar» que no penaliza.
  - La puntuación de pronunciación **no cuenta para el dominio**: el dominio se mide con lo que oye, toca y escribe.
- Lo técnico es propuesta de Claude:
  - Se usa la evaluación de pronunciación de Azure Speech (`Pronunciation Assessment`), detrás de una función propia
    de Vercel que guarda la clave, como `/api/tts`.
  - **Solo el plan gratuito (F0), decisión del dueño**: nunca se pasa a uno de pago. Tiene unas 5 horas de
    reconocimiento al mes, compartidas por todos los niños.
  - **Máximo 10 intentos de hablar por niño y día, decisión del dueño.** Al llegar a 10, los ejercicios de hablar no
    aparecen hasta el día siguiente.
  - Si el servicio falla o Azure rechaza por cupo agotado, el ejercicio de hablar se salta solo, sin penalizar, y no se
    vuelve a intentar ese día.
  - El dueño ha pedido que **el texto del consentimiento y de la política de privacidad lo redacte Claude**, sin
    revisión externa. Ese texto debe decir:
    - para qué se usa el micrófono;
    - que el audio se procesa en Irlanda (UE) con Microsoft Azure y no se guarda;
    - que solo un adulto puede activarlo y que lo puede apagar cuando quiera.

### El lugar de Inglés en el mapa, con historia

El dueño quiere un lugar propio con historia. Todo lo que sigue es propuesta de Claude y el dueño puede cambiarlo:

- **Una isla nueva**, aparte de los mundos de Numeria (w1–w8): un puerto o un pueblo donde todos hablan inglés. Se llega
  desde el inicio de la niña con un botón o barco «Inglés».
- **Cómo funciona**: como un mundo de Matemáticas. Tiene un camino de paradas que se corresponden con las etapas del
  temario de Inglés, historias de llegada, mitad y rescate, y un guardián al final de cada etapa.
- **Personajes**: habitantes que solo hablan inglés, con frases cortas, que Lumi traduce o explica en español.
- **Historias**: cortas, propias, con humor y con el compañero animal de la niña.
  - Mezclan español (el narrador) con frases en inglés de los personajes, que se pueden escuchar.
  - Cada historia usa las palabras de su etapa.
- **Arte**: reutiliza la paleta, los personajes y el estilo del mapa actual. Para no frenar la entrega, la primera isla
  puede reutilizar un fondo existente con otra paleta.
- **Avance**: las paradas se abren con el progreso de Inglés, no con el de Matemáticas. Los guardianes de Inglés se
  vencen con un reto de inglés, sin tiempo.

### El informe del adulto

En la ficha del niño, junto a Matemáticas y Lengua y con el mismo formato:

- **Palabras aprendidas**, agrupadas por tema.
- **Palabras en las que falla**, con lo que contestó, por ejemplo «escribe "tre" por "three"» o «confunde thirteen y
  thirty».
- **Números**: hasta dónde los domina y qué operaciones.
- **Pronunciación**, solo si está activada: las palabras que le cuesta decir, sin notas ni porcentajes.

### La prueba inicial

Una prueba corta de Inglés, aparte de las demás, para saber por dónde empezar. Tiene el mismo formato que la prueba
inicial de Lengua.

## Decisiones de Claude (el dueño puede cambiarlas)

- **Voz**: británica, que es el inglés que se enseña en los colegios de España.
- **Idioma de Lumi**: explica en español.
- **Premios compartidos**: estrellas, tienda, álbum y cofre son los mismos para todas las asignaturas. Inglés da sus
  estrellas de sesión una vez al día. El dominio y la sesión van por asignatura.
- **Escritura**: las palabras en inglés con el teclado de letras de Lengua; las cifras como en Matemáticas.
- **Curso**: Inglés solo se activa para niños de 3.º y para niños sin curso.
- **Qué cuenta para el dominio**: igual que en Lengua. Solo cuenta la primera respuesta de cada ejercicio; «Otra vez»
  (repetir el audio) no es una respuesta, y las repeticiones posteriores de una palabra fallada cuentan como ejercicios
  nuevos en el repaso. Una palabra sale como «aprendida» en el informe con el mismo criterio de dominio que Lengua usa
  para sus temas. La pronunciación no cuenta.
- **Estrellas**: la sesión de Inglés da sus estrellas una vez al día, como Lengua. Las estrellas de pronunciación (de una
  a tres) solo se ven en el momento: no van al monedero, para no desequilibrar las asignaturas.
- **Niños sin curso**: siguen el temario de Inglés de 3.º, como hacen en Lengua. La isla de Inglés no es una temporada
  (`s1`, `c2`): tiene su propio progreso y no depende del curso.
- **Región de Azure**: la misma de la voz, `northeurope` (Irlanda, dentro de la UE).
- **El lugar en el mapa**: una isla aparte, con sus etapas, sus historias y sus guardianes.
- **Orden de construcción**, para poder entregar por partes:
  1. el temario, las clases, la sesión, el juego de números y el informe;
  2. la isla con sus historias y guardianes;
  3. la pronunciación con el micrófono, con su consentimiento y la política de privacidad.

## Lo que queda para quien lo construya

- El modelo de datos de la tercera asignatura, sin romper Matemáticas ni Lengua. Lengua ya separa sesión, dominio y
  prueba inicial por asignatura: hay que generalizarlo a tres en vez de añadir otro caso especial (`logic.ts` hoy
  distingue `language` del resto).
- Los tipos de ejercicio de Inglés y sus pistas.
- El número y el orden de las clases, las historias y las etapas de la primera entrega.
- Cómo se compara una palabra escrita (mayúsculas, apóstrofos, «grey» y «gray», errores de una letra).
- Cómo se integra la isla con el mapa y con las temporadas (`season.ts`) sin mezclarla con `s1` y `c2`.
- La función de Vercel para la pronunciación, sus límites de uso y cómo se comporta cuando falla.
