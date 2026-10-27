# Clases que enseñan y un menú con orden

Fecha: 27 de octubre de 2026. Viene de la prueba del dueño en tablet, móvil y ordenador, y de dos revisiones de solo
lectura (clases y menú) hechas el mismo día.

## Por qué

El dueño, con sus palabras: «son todo ejercicios, no hay explicaciones; tenemos que enseñar a los niños cómo se divide,
cómo se multiplica, cómo se resta… poco a poco ir subiendo nivel, no es todo ejercicio ejercicio». Del menú: «no tiene
mucho orden»; «Mi sesión de hoy» son «ejercicios y ejercicios sin explicación y sin poder saltar»; «las lianas de las
hadas» le gustan más «porque explican un poco»; «Repaso del día» y «Juego libre» «ahora no hacen mucho».

Lo que pasa hoy en el código:

- Ya hay 20 lecciones de 3.º (`src/content/lessons/w1.ts` … `w8.ts`, reproductor `src/activities/lesson/LessonPlayer.tsx`)
  con dibujo, ejemplo resuelto, «¡Pruébalo tú!» con pistas y elección de método. Viven solo en el mapa (nodos
  `lessonNode` de `src/content/worlds/*.ts`). El niño las ve solo si entra en «Tu aventura».
- La sesión diaria (`src/engine/daily.ts`, `src/world/session/DailySession.tsx`) explica el tema nuevo con una tarjeta de
  texto (`ExampleCard`): un ejercicio al azar y sus pistas, sin dibujo, sin «Atrás», una vez.
- El temario (`src/content/syllabus/`) no sabe qué lección enseña cada tema.
- El menú (`src/world/home/ChildHomeScreen.tsx`) pone en el mismo nivel prueba inicial, sesión, aventura, repaso, juego
  libre, álbum, tienda, cofre y diploma. El repaso está en tres sitios con el mismo motor.

## Lo que ha decidido el dueño

- **Las clases salen en el botón grande «Hoy».** Cuando empieza un tema nuevo, «Hoy» abre primero la clase (unos 5
  minutos) y, al acabar, la sesión. Las clases se pueden repetir desde el mapa.
- **Saltar:** el niño puede decir **«Ahora no»** a un ejercicio (vuelve al final de la sesión y no cuenta como fallo) y
  **«Ya lo sé»** antes de una clase (2 o 3 ejercicios; si los acierta sin pistas, se salta la clase). No hay aplazar temas
  ni que el adulto marque clases como vistas.
- **«Repasar»** es un botón que solo aparece cuando hay algo pendiente de repaso.
- **División:** en el colegio dividen **con las restas escritas** (la galera con restas, que ya es el método por
  defecto, `DEFAULT_METHOD.div = 'galera'`). Las clases de dividir enseñan ese primero.
- Siempre: de menos a más, con botones de ayuda, y las pistas **nunca** dan la respuesta.

## Objetivos

1. **Una clase por tema** del temario de los temas de operaciones (ver «Primeras clases»), enlazada desde el temario.
2. **La clase en «Hoy»** cuando el tema actual tiene clase y el niño no la ha hecho.
3. **Menú nuevo** con orden y nombres para niños de 7 a 9 años.
4. **«Ahora no»** en la sesión y **«Ya lo sé»** antes de una clase.

## Fuera de alcance

- Clases de dinero, reloj, medida, fracciones y geometría: necesitan dibujos nuevos de lección; van en un segundo
  proyecto, con el mismo formato.
- 4.º de Primaria y 2.º: este proyecto hace las clases de 3.º. El formato sirve igual para los otros cursos.
- Lengua.

## Anti-objetivos (fallaría aunque funcione)

- Una clase que es otra lista de ejercicios con un título.
- Una pista o un paso de práctica que escribe el resultado.
- Que un niño que ya va por la mitad del curso tenga que hacer clases de temas que ya domina.
- Que «Ahora no» o «Ya lo sé» cuenten como acierto (falsearía el dominio).
- Dos botones grandes de aprendizaje a la vez en el menú.
- Que se pierda el progreso de los mapas o de las lecciones ya hechas.

## La clase

Una clase es una lección del reproductor actual (mismo DSL, `src/content/lessons/dsl.ts`), con cinco fases:

| Fase | Qué hace el niño |
|---|---|
| 1. Para qué sirve | 1 o 2 pasos con una historia corta, como «las lianas de las hadas» (frases cortas, con motivo) |
| 2. Ejemplo resuelto | Un caso completo, paso a paso, con dibujo; puede volver atrás |
| 3. Práctica guiada | 2 ejercicios con pistas |
| 4. Práctica sola | 3 o 4 ejercicios sin dibujo, cada uno un poco más difícil |
| 5. Cierre | Una frase que resume la idea |

- Dura unos 5 minutos.
- Si un tema va por pasos (`ordered`), hay una clase por paso, o una clase con sus micro-pasos; lo decide quien lo
  construya según la longitud.
- Las lecciones que ya existen se reutilizan cuando enseñan lo mismo (por ejemplo `w4-borrow`, `w8-galera`), completando
  las fases que les falten.
- La clase se da por hecha al terminarla. Si el niño sale a mitad, la próxima vez empieza de nuevo.

## Primeras clases (3.º)

Por prioridad. Cada línea es un paso de menos a más:

1. **Restar:** sin llevar → llevándose una (pido prestado arriba) → con ceros. Ejemplo: 352 − 127 = 225.
2. **Multiplicar:** qué es multiplicar y las tablas (ya existen) → 2 cifras × 1 sin llevar → con llevadas → 3 cifras × 1
   (213 × 3 = 639) → por 10 y por 100 → 2 cifras × 2 por partes (23 × 14 = 23 × 10 + 23 × 4).
3. **Dividir:** repartir → galera exacta de 2 cifras (84 ÷ 4 = 21) → con resto y su prueba (17 ÷ 5 = 3 y sobran 2;
   3 × 5 + 2 = 17) → 3 cifras entre 1 (384 ÷ 4 = 96) → 3 cifras con resto.

La suma con llevadas ya tiene lección (`w2-carry`); entra si encaja sin trabajo extra.

## «Hoy» y el menú

**Regla de «Hoy».** Si el tema que toca hoy («Lo nuevo», `currentTopic`) tiene clase y el niño no la ha hecho, el
botón dice «Hoy aprendemos: <tema>» y abre la clase; al terminarla, ofrece seguir con la sesión. Si no, dice «Mi sesión
de hoy · 15 min» y abre la sesión, como ahora. El nombre del tema que se enseña al niño es un nombre de tema, no un
ejemplo (hoy sale «Descomponer (4 325 = 4 000 + 300 + 20 + 5)»).

**Orden del menú, de arriba abajo:**

1. **Hoy**: el botón grande.
2. **Mi aventura**: el mapa de mundos (historias, clases, guardianes). Tamaño mediano.
3. **Repasar · N**: solo si hay algo pendiente.
4. **Jugar**: lo que hoy es «Juego libre».
5. **Mis premios**: un botón que lleva a álbum, tienda, cofre y diploma (cofre y diploma solo cuando se ganan).

Arriba siguen «Cambiar» y «Familia». La **prueba inicial** pasa a un aviso en la parte de arriba mientras no esté hecha
(o el adulto la pida otra vez). La barra de mundos de abajo se puede quedar o quitar; lo decide quien lo construya,
mirando que en el móvil «Hoy» se vea sin bajar.

Maqueta orientativa (tablet apaisada):

```
¡Hola, Lía!                                   [Cambiar] [Familia]
[ Antes de empezar: haz la prueba inicial ›]   (solo si no está hecha)
+-----------------+  +--------------------------------------------+
| Luna · Lumi     |  | HOY APRENDEMOS                              |
| 1 de 8 · 52 ★   |  | Restar llevándose una      [ ¡Empezar! ]    |
+-----------------+  +--------------------------------------------+
                     | Mi aventura · El Bosque de los Grupos  ›    |
                     +--------------------------------------------+
                     | [Repasar · 2]   [Jugar]   [Mis premios]     |
```

## Saltar

- **«Ahora no»** en la sesión: el ejercicio vuelve al final de la sesión y no se guarda como intento. Si se acaba la
  sesión sin hacerlo, no pasa nada. No hay límite.
- **«Ya lo sé»** al empezar una clase: 2 o 3 ejercicios del tema sin pistas. Si los acierta todos, la clase queda hecha y
  el niño va a la sesión. Si falla alguno, empieza la clase (sin regañar: «¡Vamos a verlo juntos!»). Esos ejercicios sí
  cuentan como intentos normales.

## Niños que ya van por la mitad del curso

- Una clase solo sale en «Hoy» para el tema actual. Los temas ya dominados no piden clase.
- Si el tema actual ya tenía su lección hecha en el mapa, cuenta como clase hecha.

## Decisiones de Claude (el dueño puede cambiarlas)

- **Alcance de este proyecto:** solo las tres líneas de «Primeras clases» (restar, multiplicar, dividir) y la suma con
  llevadas si su lección encaja. El resto de temas tendrá clase en proyectos siguientes.
- **Una sola marca de «hecho»:** hacer la clase desde «Hoy» o su lección desde el mapa es lo mismo; las dos cosas
  quedan marcadas a la vez.
- **«Ya domina el tema»** es lo que el motor ya calcula (`currentTopic` salta los temas dominados, con el dominio que
  vienen de la prueba inicial y de lo practicado). Sin prueba inicial, el niño empieza por el primer tema del curso,
  como ahora; «Ya lo sé» es la salida para un tema que ya sabe.
- **«Repaso del día» pasa a ser «Repasar»** (la misma pantalla), visible solo cuando hay algo pendiente. El repaso de
  dentro de la sesión y el nodo de repaso del mundo 7 se quedan como están. **«Juego libre» pasa a «Jugar»** con el
  mismo contenido.
- **La tarjeta de ejemplo de la sesión (`ExampleCard`)** se queda para los temas sin clase. Si el tema tiene clase, la
  tarjeta añade un botón «Ver la clase otra vez».
- **Volver a pedir la prueba inicial** sigue como hoy, desde el informe del niño en la zona de adultos.
- **Clase por tema**, no por mundo: el dueño quiere subir poco a poco, y un mundo tiene muchos temas.
- **La clase va antes de la sesión, no dentro**: la sesión mantiene sus 15 minutos de práctica.
- **Una clase a medias empieza de nuevo**: dura 5 minutos y así no hace falta guardar el punto.
- **«Ahora no» no guarda intento**: no es un error ni un acierto; el plan no aprende nada falso.

## Lo que queda para quien lo construya

- Cómo se guarda «clase hecha» (hay marcas parecidas: `progress.flags`, `worlds[w].nodes[n].done`).
- Cómo se enlaza cada tema con su clase (por ejemplo un campo opcional en `SyllabusTopic`).
- Qué lecciones existentes se reutilizan y cuáles se escriben nuevas.
- La pantalla de «Mis premios» (pestañas o rejilla).
- Los dibujos de lección que falten para multiplicar con 3 cifras y dividir con 3 cifras.
