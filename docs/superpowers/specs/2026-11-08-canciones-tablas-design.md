# Canciones de las tablas — diseño

Fecha: 8 de noviembre de 2026. Estado: pendiente de aprobación del dueño.

## Por qué

Una niña de 3.º no se sabe las tablas, y lo que aprende en el colegio no le basta. El dueño las aprendió de pequeño «con
trucos y cantando» y quiere eso para ella. Ya está hecho lo primero: al fallar una multiplicación en la sesión, la app
enseña el truco y luego el dibujo (PR #17). Esto es lo segundo: **una canción por tabla** para que se le queden de oído,
con un juego de completar que obliga a recordarlas.

Éxito: que la niña quiera cantarla más de una vez, y que, tras unas cuantas veces, acierte en «¡Tu turno!» las
multiplicaciones que antes fallaba.

## Qué es

Una pantalla de la zona del niño donde suena una **retahíla con ritmo y melodía**: la voz de la app recita la tabla
(«Siete por uno, siete… siete por ocho, cincuenta y seis…») sobre una música alegre de marimba, y la línea que suena se
ilumina como en un karaoke. Tiene dos vueltas:

1. **Escuchar y cantar.** La tabla entera, del 1 al 10, con las rimas de los trucos en su sitio (después de 7 × 8:
   «5, 6, 7, 8: ¡cincuenta y seis es siete por ocho!»).
2. **¡Tu turno!** La voz empieza («Siete por ocho…») y se calla en las multiplicaciones que **a ella** le cuestan. Salen
   **tres burbujas** con números y toca la correcta. Al acertar, la voz dice el resultado («¡cincuenta y seis!») y la
   canción sigue.

Hay un prototipo desechable con sonido, que el dueño ha escuchado:
`.superpowers/brainstorm/53847-1794162340/content/cancion-prueba.html`. Ese prototipo usa la voz del navegador y un
bombo con palmas, sin melodía. Esta versión sustituye eso por la voz y la música de la app.

## Decidido por el dueño

- **Con la voz de la app**, aunque la niña no la tenga activada en los ajustes: sin voz no hay canción.
- **Ritmo y karaoke**, como en el prototipo.
- **Melodía:** el dueño notó que al prototipo le faltaba. Debe haber una melodía alegre de verdad (la app ya tiene un
  motor de música generativa con marimba, acordes y bajo).
- En «¡Tu turno!» se responde **tocando la burbuja** (opción A), no escribiendo el número.
- Aprobó la propuesta completa que sigue («me parece bien así»).

## Comportamiento

### Dónde está
- Una sección nueva, **«Canciones»**, en «Jugar» (`/play/free`, `src/world/free/FreePlayScreen.tsx`), junto a «Tablas».
  Contiene una tarjeta por tabla con sus estrellas (0 a 3).
- **Qué tablas:** en 2.º, las del 2, 3, 4, 5 y 10 (las de su temario, `grade2.ts`); en 3.º y 4.º, todas del 2 al 10.
  Sin curso, como 3.º.
  - *Decisión mía:* se enseñan todas, aunque no las haya alcanzado en el camino, porque en el colegio puede ir por
    delante.
  - En 4.º el temario solo repasa del 6 al 9, pero un niño de 4.º que no se sabe las tablas necesita también las
    demás.
- **Al terminar la sesión diaria:** si ha fallado alguna multiplicación de una tabla, la pantalla final ofrece
  **«¿Cantamos la del 7?»** con la tabla que más ha fallado (con la misma pauta que la oferta de caligrafía,
  `CaligrafiaOffer`). Es opcional y no bloquea nada.

### La canción
- Empieza con un botón grande **«▶ ¡A cantar!»**: el navegador, sobre todo en iOS, necesita un toque para que suene.
- **Música:** un tema nuevo, «canción», con tempo fijo (unos 100 por minuto, compás de 4 tiempos), marimba y bajo, y
  una melodía que se repite cada pocos compases. Mientras habla la voz, la música baja como ya hace la app.
- **Regla de los versos** (*decisión mía*):
  - Un verso se lanza en el **primer tiempo del siguiente compás** después de que termine el anterior. La espera es como
    mucho un compás (unos 2,4 s), y normalmente menos.
  - Nunca se corta ni se pisa un verso: si un clip dura más que un compás, la música sigue y el siguiente verso espera
    al compás siguiente.
  - La música nunca se para ni se estira; solo los versos se ajustan a ella.
- **Voz:** la de la app (la natural, si está disponible; si no, la del dispositivo) con el personaje de siempre. Suena
  aunque la voz esté desactivada en sus ajustes (`force`), pero respeta el volumen general y el silencio del
  dispositivo.
- **Versos:** «Siete por uno, siete» … «Siete por diez, setenta». Se dice la multiplicación entera, como pide
  `PEDAGOGY.md` §9.
- **Rimas:** solo las que de verdad riman o se cantan, sacadas de los trucos que ya existen (`strategyForFact`):
  7 × 7 «…y el arcoíris llueve», 7 × 8 «5, 6, 7, 8…», los pares que riman del 6, etc. Se incluyen como verso extra justo
  después de su multiplicación. *Decisión mía:* la lista de rimas que entran es cerrada y la elige quien lo construya
  entre los trucos que ya hay, sin inventar letras nuevas; los trucos explicativos («una semana tiene 7 días…») no
  entran como verso.
- **Karaoke por versos:** se ilumina el verso que suena; los anteriores quedan marcados. No hace falta ir palabra a
  palabra.
- **Compañero:** su animal acompaña al ritmo con una animación sencilla; no hace falta una nueva.
- **Duración:** unos 40 a 50 segundos por vuelta. Entre las dos vueltas, la voz dice «¡Ahora tú! Yo empiezo y tú
  terminas».
- **Botones:** «Salir» siempre visible. En la vuelta 1, «¡Ir a mi turno!» para saltar a la vuelta 2.

### ¡Tu turno!
- **Huecos:** se callan las multiplicaciones de esa tabla que le cuestan, según su dominio (`useMastery`: caja baja o
  error reciente), ordenadas de menos a más dominada. El número de huecos lo marca el nivel (abajo). Si no hay bastantes
  difíciles, se completan con las menos dominadas.
- **Niveles:** si en una vuelta acierta todos los huecos a la primera, gana una estrella y la próxima vez hay más
  huecos.
  - Nivel 1: las difíciles, entre 2 y 4 huecos.
  - Nivel 2: 5 huecos.
  - Nivel 3: 8 huecos (todas menos × 1 y × 10).
  - Con 3 estrellas la tabla queda «cantada»; se puede seguir cantando.
- **Burbujas:**
  - Tres números: el correcto y dos que confunden de verdad, tomados de las multiplicaciones de al lado (con 7 × 8: 49 y
    63) o de un error típico (7 + 8 = 15).
  - Se cambia el orden cada vez.
  - Son grandes, para el dedo.
- **Sin prisa** (`PEDAGOGY.md` §8): mientras ella piensa, la música sigue sonando en bucle, pero no hay cuenta atrás ni
  barra de tiempo. La canción espera.
- **Si toca la burbuja mal:**
  - Esa burbuja se apaga y suena la rima o el truco de esa multiplicación (los textos que ya da el motor), sin frases
    que avergüencen (§6).
  - Vuelve a elegir entre las que quedan.
  - Ese hueco ya no cuenta como acertado a la primera.
- **Al terminar:** «¡Tabla del 7 cantada!» y las estrellas, con la tarjeta de resultado de los minijuegos
  (`ResultCard`).

### Lo que queda registrado
- **Intentos:**
  - Cada respuesta de «¡Tu turno!» se guarda con `reportAttempt` y la actividad «canción».
  - Llevan `graded: false`: elegir entre tres burbujas es reconocer, no recordar, y no debe subir ni bajar el dominio.
    *Decisión mía:* así un acierto por descarte no hace que la app crea que ya se la sabe.
  - El dominio sigue moviéndose solo con la sesión y los minijuegos de escribir.
- **Estrellas y nivel por tabla:**
  - Se guardan en el progreso del niño y se sincronizan como el resto del progreso.
  - Hoy las estrellas del juego libre no se guardan, así que esto es nuevo.
- **Informe del adulto:** una línea nueva, «Canciones de las tablas: 7 ⭐⭐, 8 ⭐», en la ficha del niño.

## Qué no entra
- Que la voz **cante** con melodía. La voz recita con ritmo y la melodía la pone la música.
- Grabaciones de la familia.
- Canciones de la división, de otras asignaturas o de cosas que no sean tablas.
- Responder escribiendo o hablando.
- Competir contra otros niños o contra el reloj.

## Lo que lo haría un fracaso, aunque funcione
- Que el ritmo se descuadre: versos que se pisan o se adelantan, o silencios largos mientras carga la voz.
- Que «¡Tu turno!» se sienta como un examen: cuenta atrás, sonidos de error duros, mensajes de «mal».
- Que no suene en la tablet, en la app instalada o sin conexión.
- Que dure tanto que aburra.

## Restricciones
- **Ritmo y voz** (*decisiones mías*):
  - **Precisión:** no se pide sincronía exacta al milisegundo. Basta con que cada verso empiece cerca del primer tiempo
    (unos 100 ms de margen), con la voz natural (`<audio>`) y con la del dispositivo (SpeechSynthesis), que no permite
    programar el inicio. No se cambia la ruta de audio de la voz natural para meterla en Web Audio.
  - **Precarga:** antes de empezar, con «Preparando la canción…», se precargan con `fetchClip` todos los clips de
    **esa** tabla: los versos, el arranque de los huecos («Siete por ocho…»), los resultados que dice al acertar
    («¡cincuenta y seis!»), las rimas y las frases de transición. Solo esa tabla, no todas las del curso. Como el texto
    es el mismo para todos los niños, el conjunto es pequeño y cerrado (9 tablas × unos 30 clips) y el service worker lo
    guarda, así que el gasto de la voz no crece con el uso.
  - **Tiempo máximo de preparación:** 6 segundos.
  - **Si falta algún clip** al acabar ese tiempo, o la voz natural no está disponible, **toda la canción** suena con la
    voz del dispositivo. Nunca se cambia de voz a mitad de canción.
  - Los trucos que suenan tras tocar una burbuja equivocada van precargados como el resto.
- **Cola de la voz:** solo tiene 4 huecos (`MAX_QUEUE`). Los versos se dicen de uno en uno, esperando cada `say()`; no se
  encolan en bloque.
- **Música:** `music.ts` hoy no permite fijar el tempo ni saber cuándo empieza un compás. Hay que añadir un tema
  «canción» y una forma de conocer el pulso, ya sea exponiendo el reloj y la duración del compás o con avisos de compás.
  `ThemeDef` no está exportado.
- **iOS:** todo arranca con el toque de «¡A cantar!». La app ya desbloquea el audio con el primer gesto.
- **Sin conexión:** la pantalla tiene que funcionar con la app instalada y sin red. La música es generativa y no
  necesita archivos; la voz es la natural si los clips están en caché y, si no, la del dispositivo.
- **Pedagogía:** `docs/PEDAGOGY.md` §6 (errores sin avergonzar, nombrando el truco), §8 (sin presión de tiempo) y §9 (el
  hecho entero).
- **Pantallas:** en tablet horizontal y vertical, y en móvil (360 × 740) sin tener que desplazarse. Las burbujas, de al
  menos 72 px.

## Lo que se deja a quien lo construya
- La melodía y los acordes exactos del tema «canción», siempre que sea alegre y no tape la voz.
- Si la pantalla es una actividad registrada (`ActivityKind` y `registry.ts`, con `bubbles` como modelo) o una ruta
  propia.
- Cómo se guardan las estrellas y el nivel por tabla dentro del progreso, siempre que se sincronicen como el resto.
- La animación del compañero, reutilizando lo que haya.
- Los textos exactos de transición, en el tono de `PEDAGOGY.md`.
