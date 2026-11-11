# Análisis en profundidad de Repasitos

## 1. Lo esencial en un minuto

Repasitos está bien construida por dentro. El motor de corrección es puro y determinista, el generador controla con precisión las llevadas y los préstamos, la sesión diaria intercala ejercicios, reintenta lo que falla y limita los hechos nuevos, y el tono con el niño es amable. Los problemas más graves no están en la idea pedagógica sino en detalles que el niño vive en primera persona: hay respuestas correctas que la app da por malas, pistas que no aparecen justo cuando se necesitan y textos rotos al copiar la respuesta. Lo que más mejoraría el aprendizaje, por orden, es: (1) que ninguna respuesta correcta se marque como error y que cada aviso sea verdadero y concreto; (2) que los trucos no revelen el resultado, para que el niño recuerde el hecho en lugar de copiarlo; (3) que «dominado» se gane en días distintos, sin azar y contando el olvido; (4) que haya un solo recorrido coherente (mapa y temario) y que 4.º a 6.º tengan contenido propio; y (5) que las familias y los profesores vean datos correctos, porque hoy hay dos definiciones de «dominado», medias que ocultan alumnos y misiones sin seguimiento. Además, no hay ninguna prueba automática antes de publicar, y este análisis se ha hecho leyendo el código, no probando la app con niños.

## 2. Lo que ya está bien hecho (no tocar)

- **Corrección tolerante con lo que no se califica.** En la resta en columna, las marcas de «pedir prestado» no se califican: solo cuenta el resultado (`src/engine/check.ts`, comentario antes de `checkColumnSub`). La galera acepta resto vacío en una división exacta (`src/engine/check.ts:401-402`). La familia de operaciones acepta cualquier orden de factores (`src/engine/check.ts`, `parseFact` y `checkFamily`). Pagar con monedas acepta cualquier combinación que dé el precio (`src/engine/money.ts`).
- **Generador de restas y llevadas exacto.** Los préstamos se construyen y verifican (`genSubPair` en `src/engine/numbers.ts`). En la muestra de 400 ejercicios no hubo restas que dieran cero.
- **Orden de contenidos.** En 3.º las tablas van de fáciles a difíciles (2, 5, 10, 3, 4, 6, 8, 7, 9). La resta sin llevadas va antes que la que pide prestado, y la resta con ceros va después de pedir prestado. La división llega al final, tras las tablas y la multiplicación por columnas (`src/content/syllabus/grade3.ts`).
- **Repaso espaciado e intercalado.** `planAdaptive` prioriza lo vencido y lo débil (`src/engine/generate.ts:394`). `orderPlan` evita repetir la misma habilidad seguida (`src/engine/generate.ts:457`). Un fallo vuelve a preguntarse 2 a 4 ítems después, como máximo una vez por ítem y tres por sesión (`src/activities/shared/requeue.ts`). En el calentamiento de la sesión diaria se repasan hechos vistos antes, sin pistas.
- **Presupuesto de hechos nuevos.** La sesión diaria limita los hechos difíciles nuevos a tres (`src/engine/daily.ts:33` y `:107`, `NEW_FACT_BUDGET`).
- **Escalera de pistas de tres niveles.** El nivel 1 es la estrategia, el 2 un apoyo visual y el 3 un paso intermedio. En división, el nivel 3 usa «un ejemplo con otro caso» con otros números (`src/engine/hints.ts:32-43`, `451-470`). En problemas de palabra, la primera pista es una pregunta sobre la situación (`src/engine/hints.ts:268`).
- **Mensajes de error diagnósticos y amables.** «Te has dejado la llevada en las decenas» nombra la casa exacta (`src/engine/feedback.ts:88`). «¡Casi! 24 es 6 × 4» indica una confusión concreta (`src/engine/feedback.ts:63-67`). Los errores son «pistas», no pantallas rojas (`src/styles/tokens.css:41`).
- **Trucos de tablas correctos.** Se han comprobado matemáticamente los trucos de ×1, ×10, ×2, ×4, ×8, ×5, ×9, ×6, 7×7, 7×8 y 3×7 (`src/engine/strategies.ts`). Las rimas («el 5 y uno más», «los pares que riman», «uno menos y que sumen 9») son memorables.
- **Concreto antes que abstracto.** Grupos de setas, rectángulos de filas con el «espejo», galera con pasos marcados, casitas de valor posicional, barras de problemas, recta numérica y reparto uno a uno (`src/activities/array/index.tsx`, `src/activities/share/index.tsx`, `src/activities/lesson/visuals/`).
- **Clases de 3.º bien estructuradas.** Siguen «para qué sirve → ejemplo resuelto → práctica guiada → práctica sola → frase-regla» (`src/content/classes/dsl.ts`). Los problemas usan la rutina «¿Qué sé? ¿Qué me preguntan? ¿Qué operación?».
- **Medición de la fluidez con sentido.** Los umbrales de tiempo son 4 s con teclado, 5 s con teclado numérico y 7 s con lápiz o táctil. Escribir a mano no se penaliza por lentitud (`src/engine/mastery.ts:27-36`). «No lo sé» cuenta como fallo honesto.
- **Penalización proporcionada.** Un fallo baja la caja dos niveles y vuelve a vencer de inmediato (`src/engine/mastery.ts:66-78`). Una respuesta marcada como reconocimiento no cambia la caja.
- **Adultos con datos útiles.** El veredicto de una frase sale de la cuadrícula de cajas y nombra tablas concretas (`src/adult/shared/reading.ts:48-92`). Los errores se agrupan con un consejo para casa (`src/engine/report.ts:133-236`). La prueba de recuerdo mide lo que se sigue acertando a 14 días o más (`src/engine/report.ts:476-505`).
- **Privacidad de la voz y de los datos.** La voz de la pronunciación no guarda audio ni puntuación (`src/data/speaking.ts`). Los datos de un niño sin cuenta no salen del dispositivo. Hay RLS en todas las tablas (`supabase/migrations/0001_init.sql:744-757`). El PIN de adulto tiene bloqueo tras intentos fallidos (`src/data/pin.ts:65-69`).
- **Escritura a mano cuidadosa.** El niño ve la cifra leída en tipografía impresa (`src/ink/DigitCell.tsx`). Con confianza baja se pide confirmación antes de calificar (`src/activities/groups/flow.ts:80-81`). El rechazo de palma está bien pensado (`src/ink/policy.ts:20-29`).
- **Caligrafía con orden didáctico.** El planificador abre cada etapa cuando las anteriores tienen caja de al menos 1 (`src/engine/caligrafia/plan.ts`). El puntuador da un solo consejo concreto (`src/ink/cursive/tips.ts`).
- **Sincronización sólida en lo esencial.** Cola de salida persistente con reintentos (`src/data/outbox.ts`). Los intentos son de solo añadir e idempotentes (`src/data/sync.ts:4`). El progreso se fusiona de forma monótona (`src/data/merge.ts`).
- **Estado técnico.** Hay unas 3.800 pruebas automáticas que pasan y `npx tsc -b` termina sin errores. Las pruebas de propiedad generan 1.500 ejercicios por cada uno de 24 tipos (`src/engine/__tests__/check.test.ts:21-34`).
- **Dos aventuras para dos cursos.** 2.º tiene temporada propia, con mundos, guardianes y temario (`src/content/season.ts:49`, `src/content/c2/`). Lengua tiene sesión diaria propia.

## 3. Fallos que pueden confundir al niño (lo primero que hay que arreglar)

Estos fallos hacen que el niño dude de algo que ha hecho bien, que vea un aviso falso o que se quede sin ayuda en el momento que más la necesita. Están ordenados por gravedad.

### 3.1 Multiplicación en columna: la llevada final escrita en su fila se da por mala (gravedad alta)
- **Qué pasa:** la suma acepta la llevada final escrita en la fila de llevadas como cifra del resultado, pero la multiplicación no. El niño coloca bien la llevada y la app le dice que se la ha dejado.
- **Ejemplo:** 12 × 9 = 108. El niño escribe 8 y 0 en el resultado, pone el 1 solo en la fila de llevadas, encima de las centenas, y la app responde «¡Ojo con la mochila!» y que se ha dejado la llevada en las centenas. Con el 1 también en el resultado, la respuesta es correcta.
- **Dónde:** `src/engine/check.ts:361-377` (`checkColumnMul` usa `columnPrecheck` con `required=2` y no mira `input.carries`). La suma sí lo hace en `src/engine/check.ts:261-263`.
- **Cómo arreglarlo:** copiar en `checkColumnMul` la regla de `checkColumnAdd`. Añadir pruebas con 12 × 9 y 9 × 12 con la llevada solo en la fila de llevadas.
- **Esfuerzo:** pequeño.

### 3.2 Cifras confundibles leídas con mucha confianza se califican como error sin aviso (gravedad alta)
- **Qué pasa:** la app pide confirmación solo si la confianza del primer candidato es menor de 0,6. Si un 7 bien trazado se lee como 1 con confianza alta, la respuesta se califica como incorrecta sin que el niño tenga ocasión de corregirla. El mecanismo está confirmado. Los tests de cifras usan plantillas del propio modelo, no letra real de niños.
- **Ejemplo:** el niño escribe un 7 claro, la casilla muestra 1 y la respuesta cuenta como error de cálculo.
- **Dónde:** `src/ink/DigitCell.tsx:187-194`; `src/ink/constants.ts:12`; `src/activities/groups/flow.ts:80-81`; `src/ink/ml/recognizer.ts:174-180` (la confianza es la del primer candidato, sin mirar el segundo).
- **Cómo arreglarlo:** usar la diferencia entre el primer y el segundo candidato (el reconocedor ya devuelve alternativas, `recognizer.ts:12`) para tratar como dudosos los pares 1/7, 4/9 y 0/6. Calibrar el umbral con muestras reales de niños, con permiso y sin guardar nombres, y no a ciegas. Mostrar el «?» también en esos casos.
- **Esfuerzo:** medio.

### 3.3 La pista desaparece después de comprobar (gravedad alta)
- **Qué pasa:** cuando hay resultado, la barra de respuesta muestra el mensaje de feedback y no la pista. Tras cualquier comprobación, el botón «Pista» parece roto para ese ejercicio.
- **Ejemplo:** un niño de 3.º falla una resta en columna, pulsa Pista y no aparece nada.
- **Dónde:** `src/activities/groups/AnswerBar.tsx:22-29` y `:36`; `src/activities/groups/flow.ts:49`, `:71-77`, `:87`; `src/activities/column/index.tsx:45`. Según la verificación, el problema afecta a todas las vistas que usan `AnswerBar` (resta, división, grupos, problemas), no solo a la resta.
- **Cómo arreglarlo:** mostrar la pista en un panel propio debajo de la burbuja, como hace `HintPanel`. Añadir una prueba de componente: tras un fallo, pulsar Pista muestra el texto.
- **Esfuerzo:** pequeño.

### 3.4 Al copiar la respuesta tras dos fallos, el texto queda roto en ×1 y ×10 (gravedad alta)
- **Qué pasa:** la vista reemplaza el «?» final del paso trabajado por la respuesta. En ×1 y ×10 el texto no termina en «?», así que se pega el número a la palabra.
- **Ejemplo:** el niño lee «¿Cuánto es5» o «¿Qué número sale70», y no entiende qué debe escribir.
- **Dónde:** `src/activities/views/FactView.tsx:34` y `:104-108`; `src/engine/strategies.ts:33` y `:44`. En `:93` no se sustituye nada y queda «? (cuenta…)» sin resolver.
- **Cómo arreglarlo:** que el paso trabajado tenga un marcador explícito, o terminar esos textos en «= ?» como el resto. Añadir una prueba que compruebe que todas las frases trabajadas terminan en «= ?» o «→ ?».
- **Esfuerzo:** pequeño.

### 3.5 En la rueda y en el tablero, el hecho fallado no vuelve a preguntarse (gravedad alta)
- **Qué pasa:** en la rueda, la casilla de un hecho fallado queda vacía y la actividad no lo vuelve a preguntar. En el tablero, el mensaje promete otra oportunidad, pero la siguiente pregunta es otra.
- **Ejemplo:** un niño falla 6 × 7 en la rueda y la casilla no se completa nunca. En el tablero ve «Mira el truco y prueba en el siguiente turno» y en el turno siguiente aparece otra pregunta.
- **Dónde:** `src/activities/wheel/index.tsx:54` y `:58` (no usa `requeueWrong`); `src/activities/board/index.tsx:129`, `:169-170`. Las demás actividades de hechos sí reintentan con `requeueWrong` (`src/activities/shared/requeue.ts`).
- **Cómo arreglarlo:** añadir `requeueWrong` a la rueda (la casilla se reabre dos a cuatro preguntas después) y reinsertar la pregunta fallada en el tablero. Cambiar el texto del tablero para que solo prometa lo que pasa. Mostrar el producto correcto en la casilla.
- **Esfuerzo:** pequeño.

### 3.6 En una lección, tras dos fallos, la respuesta correcta no aparece (gravedad alta)
- **Qué pasa:** en un paso «sola», tras dos fallos la lección sigue con un mensaje genérico y el niño no ve el resultado. En un paso con pistas, la respuesta solo aparece si el niño pulsa Pista hasta el nivel 3.
- **Ejemplo:** el niño falla dos veces 6 × 7 en un paso sin pistas, la lección continúa con «No pasa nada» y nunca ve el 42.
- **Dónde:** `src/activities/lesson/TrySlot.tsx:172-173` y `:188` (no pasa `teach`); `src/activities/views/FactView.tsx:33` (exige `showFeedback` o `teach` distinto de `none`); `src/activities/facts/shared/flow.ts:204` (el texto «La respuesta correcta es» no se pinta).
- **Cómo arreglarlo:** pasar `teach='full'` a `ExerciseView` dentro de `TrySlot` para los hechos de multiplicar, lo que activa la fase de copia. Al quedar `gaveUp`, mostrar un renglón fijo «La respuesta es X» antes de «Seguimos». Revisar que la copia no alargue demasiado un paso «sola».
- **Esfuerzo:** medio.

### 3.7 La pantalla de recompensa celebra la mejor marca histórica, no el intento (gravedad alta)
- **Qué pasa:** tras una actividad, la recompensa muestra las estrellas guardadas como mejor marca. Un intento flojo puede celebrarse como si fuera perfecto.
- **Ejemplo:** si el niño sacó 3 estrellas antes, una vez floja vuelve a ver «¡Estrellas de oro!».
- **Dónde:** `src/world/node/NodeScreen.tsx:89` (toma las estrellas guardadas), `:164` (actividades); `src/world/rewards/RewardOverlay.tsx:78` y `:109`; `applyNodeResult` en `src/content/progression.ts` (`best = Math.max(prevBest, gained)`). El guardián no tiene este fallo, porque usa el intento actual (`NodeScreen.tsx:203-214`).
- **Cómo arreglarlo:** pasar a la recompensa las estrellas del intento (`r.stars`) y mostrar por separado «Esta vez» y «Tu mejor». Celebrar «¡Has mejorado!» solo cuando la mejor marca sube, y las estrellas de oro solo si el intento llega a 3.
- **Esfuerzo:** pequeño.

### 3.8 Tocar una cifra ya reconocida la borra sin posibilidad de deshacer (gravedad alta)
- **Qué pasa:** en móvil o tableta sin lápiz, un toque corto sobre una cifra reconocida la borra. No hay «deshacer» en la interfaz.
- **Ejemplo:** el niño toca la cifra que ya ha reconocido para verla, la casilla se vacía sin aviso y tiene que volver a escribirla.
- **Dónde:** `src/ink/capture.ts:278`; `src/ink/DigitCell.tsx:292-293` y `:133-143` (`clearAll` quita trazo y cifra). Con lápiz usado antes, los dedos solo tocan (`src/ink/policy.ts:22-28`), así que el problema afecta a móvil y tableta sin lápiz. El comentario del código indica que es un «reescribir» intencionado.
- **Cómo arreglarlo:** que tocar una cifra reconocida abra las alternativas, como ya ocurre en el estado «unsure». Dejar el borrado solo para un botón o un trazo de tachado. Si se mantiene, añadir un «Deshacer» visible unos segundos. Añadir una prueba e2e: tocar una cifra reconocida no la borra.
- **Esfuerzo:** pequeño.

### 3.9 «Me llevo una abajo» recibe el mensaje de «pedir prestado» (gravedad media)
- **Qué pasa:** el método elegido por el niño no se tiene en cuenta al calificar los dígitos. Si el error encaja en el patrón de pedir prestado, la app habla de tachar y restar 1, que no es su método.
- **Ejemplo:** el niño que resta con «me llevo una» (suma 1 a la cifra de abajo) y se equivoca recibe «Táchala y réstale 1».
- **Dónde:** `src/engine/check.ts:327-358` (el método solo se usa en la rama `steps`, `:330`); `src/activities/views/ColumnView.tsx:82-89`; `src/engine/feedback.ts:97`; `src/engine/hints.ts:105-124` (habla de sumar 10 arriba y 1 abajo); `src/engine/diagnose.ts:118-121`.
- **Cómo arreglarlo:** pasar el método a `checkColumnSub` y elegir el mensaje según el método. Para «me llevo una»: «Te has olvidado de sumar 1 a la cifra de abajo de la casa de al lado». Mantener «Táchala» solo para pedir prestado arriba.
- **Esfuerzo:** medio.

### 3.10 En la resta por saltos, solo se acepta la ruta con el número exacto de paradas (gravedad media)
- **Qué pasa:** el corrector y la vista fijan el número de paradas de la ruta canónica. Un camino válido con otros saltos no puede terminarse.
- **Ejemplo:** en 352 − 127, un niño que hace 127 → 300 → 350 → 352 (sin la parada de 130) recibe «Te falta alguna casilla», porque el corrector espera una tercera casilla.
- **Dónde:** `src/engine/check.ts:310-322` (`stops.some(... !isNum)` da incomplete); `src/engine/subMethods.ts:87-99` (`lineStops` produce 130, 300, 350); `src/activities/views/SubLineView.tsx:32` y `:56` (una casilla por parada).
- **Cómo arreglarlo:** aceptar cualquier cadena creciente de paradas entre el sustraendo y el minuendo. La vista pide casillas bajo demanda o un botón para terminar. Comprobar que cada salto es positivo. Tests con 352 − 127 en dos, tres y cuatro saltos.
- **Esfuerzo:** medio.

### 3.11 En división por partes y de subir, el resto vacío bloquea o da incompleto (gravedad media)
- **Qué pasa:** en la galera, una división exacta con resto vacío se acepta como 0. En los métodos por partes y de subir, el resto vacío deja el ejercicio incompleto y el botón apagado sin explicación.
- **Ejemplo:** en 84 ÷ 4 por partes (20 + 1 = 21), sin escribir nada en el resto porque no sobra nada, el botón queda apagado. Con un 0 es correcto. En la galera, el resto vacío sí se acepta.
- **Dónde:** `src/engine/check.ts:449-450` (`checkDivisionParts`) y `:470` (`checkClimb`); `src/engine/check.ts:401-402` (la galera trata el resto vacío como 0); `src/activities/views/DivisionMethods.tsx:47` y `:105` (`canCheck` exige resto).
- **Cómo arreglarlo:** tratar el resto vacío como 0 cuando el resto esperado es 0, igual que en `checkDivision`. Mostrar un texto guía: «escribe 0 si no sobra nada». Un test por método con 84 ÷ 4 y 28 ÷ 4 con resto vacío.
- **Esfuerzo:** pequeño.

## 4. Cómo aprender más y mejor

### Ejercicios

- **La respuesta de la división suele ser el número de la tabla.** En el universo de cada tabla, el cociente es la tabla en unos la mitad de los ítems (por ejemplo, con la tabla del 2, 9 de 18 ítems). Un niño que sabe la tabla puede acertar sin dividir.
  *Evidencia:* `src/engine/generate.ts:168-176`; `src/engine/make.ts:33-39`; `src/activities/share/index.tsx:23` (usa el planificador uniforme, así que el sesgo se da de verdad en el reparto).
  *Propuesta:* no generar casos en que el cociente sea igual a la tabla pedida, o equilibrar con cocientes distintos. Añadir una prueba que falle si más del 30 % de las divisiones de una sesión tienen cociente igual a la tabla. Esfuerzo pequeño.

- **Los pesos de dificultad no cambian la frecuencia en las actividades no adaptativas.** Con 3 × 1 y 3 × 8 aparecen igual de a menudo, y en las tablas 2, 5 y 10 hay muchas multiplicaciones por 1, 2, 5 o 10.
  *Evidencia:* `src/engine/generate.ts:373-385` (`planUniform`), `:837-839`; `src/activities/board/index.tsx:41`; `src/activities/share/index.tsx:23`; `src/world/guardian/logic.ts:26`; `src/world/clase/ClassScreen.tsx:49`.
  *Propuesta:* elegir cada ejercicio con muestreo ponderado manteniendo la cobertura de todas las habilidades. Si no se quiere sesgo, quitar los pesos y documentarlo. Añadir un test que compare 3 × 1 con 3 × 8 en modo no adaptativo. Esfuerzo medio.

- **Los distractores de «¿tiene sentido?» son demasiado fáciles.** La respuesta falsa es ×10, ÷10 o un valor imposible. Eso mide estimación gruesa, que es lo que piden las pistas, pero no detecta errores típicos de cálculo.
  *Evidencia:* `src/engine/wordProblems.ts:131-137` (`wrongAnswer`), `:187`, SENSE_HINTS en el mismo archivo.
  *Propuesta:* mantener los distractores absurdos en los primeros niveles. En los avanzados, añadir un distractor cercano de error típico (llevada olvidada, ±10 o ±100). Ajustar las pistas para que digan qué error se busca. Esfuerzo medio.

- **Los problemas libres mezclan números de 3 y 4 cifras sin importar el curso.** Con el selector genérico, `buildWord` usa `[3,3,4]`. En los flujos reales de la app, los mundos fijan sus cifras, pero w2 mete sumas de 4 cifras en un mundo cuyo filtrado por curso no he podido comprobar.
  *Evidencia:* `src/engine/generate.ts` (`buildWord`); `src/content/worlds/w2.ts:47-50`; `src/content/syllabus/grade2.ts` (sin problemas de palabra).
  *Propuesta:* que el valor por defecto sea el rango del curso (máximo 3 cifras en 2.º). Separar los selectores de w2 por curso. Esfuerzo pequeño.

- **Sin división de 3 o 4 cifras en el selector genérico.** El universo de división solo añade `div2x1`, aunque el contenido sí usa `div:3x1` de forma explícita.
  *Evidencia:* `src/engine/generate.ts:221-222`; `src/engine/skills.ts:469-473`; `src/content/classes/grade3.ts:473-479`; `src/content/worlds/w8.ts:60`.
  *Propuesta:* ampliar el universo según el curso (2 cifras en 2.º y 3.º, 3 cifras en 3.º, 4 cifras en 4.º), o documentar que el selector genérico es de 2 cifras. Esfuerzo medio.

- **No hay rampa de dificultad dentro de la sesión cuando el selector no fija el nivel.** El plan ordena por repetición de habilidad, no por dificultad. Con dos cifras, «muchas» llevadas ya significa 2, así que no conviene cambiarlo a 1.
  *Evidencia:* `src/engine/generate.ts` (`orderPlan`, `regroupCounts`); `src/engine/numbers.ts:17-23` (`carryableColumns`, `maxCarries`).
  *Propuesta:* cuando el selector no fija nivel, ordenar el plan de dificultad baja a media dentro de la sesión, usando un campo de dificultad que funcione. Esfuerzo medio.

- **Los problemas de dos y tres pasos existen como barras, pero no como enunciado de texto.** La auditoría de contenido dice «ninguno de dos pasos», y está desactualizada.
  *Evidencia:* `src/engine/bars.ts:189` (tres pasos) y `:261-290` (dos pasos con enunciados); `src/content/syllabus/grade4.ts:99`; `docs/curriculum/AUDITORIA_CONTENIDO.md:223`.
  *Propuesta:* actualizar la auditoría. Añadir plantillas de dos pasos sin barra al tipo word-problem para 3.º y 4.º, con validación del resultado. Esfuerzo medio.

- **No existe la suma de tres sumandos.** `makeColumnAdd` acepta un array, pero solo se llama con dos.
  *Evidencia:* `src/engine/make.ts:94-99`; `src/engine/generate.ts:580-604`; `docs/curriculum/AUDITORIA_CONTENIDO.md:247`.
  *Propuesta:* añadir un tipo de suma de tres sumandos con control de llevadas por parejas. Es de prioridad baja. Esfuerzo medio.

- **Pocas combinaciones en grupos y filas.** Con `smallPair` y el rango de 2 a 5 hay 16 combinaciones, y con 2 a 6, 25. El niño reconoce las mismas (3 × 4, por ejemplo) y el ejercicio se memoriza en lugar de contar.
  *Evidencia:* `src/engine/generate.ts` (`smallPair`); `src/content/worlds/w1.ts:24` (`[2,5]`); `src/content/guardians.ts:25` (`[2,6]`); `src/engine/make.ts:61-64` (el id no incluye el emoji).
  *Propuesta:* ampliar el rango según el curso e incluir la disposición visual en el id. Usar `avoidIds` entre sesiones. Esfuerzo pequeño.

- **La dificultad asignada a 9 × 9 es inconsistente, aunque hoy no afecta a nada.** 9 × 9 no está en `HARD_FACTS` y se le asigna 3, igual que a 3 × 9, mientras 6 × 6 da 4 y 8 × 8 da 5. Ningún flujo de la app lee el campo `difficulty` fuera de tests.
  *Evidencia:* `src/engine/make.ts:16` y `:19-28`; `src/engine/skills.ts:445-451` (`isEasyFact` no usa `difficulty`).
  *Propuesta:* decidir primero si `difficulty` se usa de verdad (con la rampa) o se retira. Si se usa, añadir 9 × 9 a `HARD_FACTS` con un test. Esfuerzo pequeño.

### Trucos y mensajes

- **Trucos que dan el resultado en la primera pista y en el mensaje de error.** En 7 × 7 aparece «cuarenta y nueve», en 7 × 8 «cincuenta y seis», y en el truco del 6 par, el resultado completo. Un único fallo deja al niño con el resultado escrito, así que el segundo intento es una copia y no un recuerdo. El mensaje de vecino también incluye el truco completo.
  *Evidencia:* `src/engine/strategies.ts:61`, `:70`, `:156` (llamada en `:109`); `src/engine/hints.ts:40` (la pista 1 es el truco); `src/engine/check.ts:113-115`; `src/engine/feedback.ts:62` y `:66`; `src/activities/facts/index.tsx:40` («Ver el truco»).
  *Propuesta:* reescribir como pregunta. Para 7 × 8: «¿Qué dos de estos números forman el resultado: 5, 6, 7, 8?». Para 6 × 8: «¿Cuánto es la mitad de 8? Ponla delante del 8». Para 7 × 7: «7 × 5 y 7 × 2: ¿cuánto suman?». Dejar la rima completa solo para el elogio tras acertar. Corregir también `factNeighbour`. Esfuerzo pequeño.

- **Faltan trucos comprensibles para 8 × 8, y 3 × 3 no tiene ninguno.** 8 × 8 se enseña con «doble, doble y doble», que es correcto pero exigente. 3 × 3 cae en «cuenta de 3 en 3».
  *Evidencia:* `src/engine/strategies.ts:112`, `:132-139`, `:177-184`; `docs/curriculum/DIDACTICA.md:180-186` (el método de las dos manos es para niñas y niños más avanzados).
  *Propuesta:* añadir a `strategies.ts` «8 × 8 = diez veces 8 menos dos veces 8 (80 − 16 = 64)» y «3 × 3 = el doble de 3 más uno (2 × 3 + 3 = 9)». Los cuadrados como truco opcional. No llevar el método de las dos manos a la pista base. Esfuerzo pequeño.

- **El truco favorito dice algo ambiguo.** «Cinco veces el otro número, y una o dos veces más» sirve para el 6 y el 7 sin distinguir. El espejo dice «Dale la vuelta al hecho» sin decir a qué hecho.
  *Evidencia:* `src/engine/methods.ts:44-45`; `src/engine/strategies.ts:116` (el espejo solo se usa para b = 6); `src/engine/hints.ts:38-41` (el truco favorito reemplaza la pista 1).
  *Propuesta:* un texto por factor: para el 6, «cinco veces el otro número y una vez más»; para el 7, «cinco veces el otro número y dos veces más». Para el espejo, decir cuál de los dos órdenes es más fácil. Esfuerzo pequeño.

- **Mensaje del espejo ambiguo.** «Usa el espejo: si cambias el orden, sale otra» puede leerse como que el resultado cambia, lo que contradice el espejo.
  *Evidencia:* `src/engine/feedback.ts:84`; `src/engine/check.ts:194` y `:226-229`.
  *Propuesta:* «Esa ya la tienes. Usa el espejo: escribe la misma cuenta con los números al revés. El resultado es el mismo.» Esfuerzo pequeño.

- **La pista de «la de al lado» no dice de qué tabla es el error.** Un niño que responde 54 a 7 × 8 recibe «¡Casi!» genérico, aunque 54 es 6 × 9, una confusión de tabla concreta.
  *Evidencia:* `src/engine/check.ts:113-115` (vecinos ±1 solamente); `src/engine/feedback.ts:63-66`.
  *Propuesta:* buscar en la tabla 1 a 10 el par que da la respuesta y nombrarlo: «54 es 6 × 9: esa es de la tabla del 6, no la del 7». Esfuerzo pequeño.

- **Pista 2 de los problemas de palabra dice la operación.** «Hay que sumar» o «hay que restar» revela la decisión que el niño debía tomar. La pista 3 escribe también la cuenta.
  *Evidencia:* `src/engine/hints.ts:266-288` (`wordHints`).
  *Propuesta:* la pista 2 como pregunta de situación («¿Llegan más cosas, se van, hay grupos iguales o se reparte?») con su visual. La operación solo en la pista 3, como cuenta escrita. Esfuerzo pequeño.

- **Mensajes largos y con jerga.** La frase de división usa «cociente» y «resto». Algunos mensajes concatenan el aviso y el truco completo.
  *Evidencia:* `src/engine/feedback.ts:62`, `:88`, `:114`.
  *Propuesta:* una idea por burbuja. «Comprueba: lo que sale de repartir, más lo que sobra, tiene que dar el total.» Cambiar «te has dejado» por «falta la llevada en las decenas». Esfuerzo pequeño.

- **El mensaje del cero en la resta no dice quién presta.** «Pide a la casa de al lado» falla cuando hay dos ceros seguidos.
  *Evidencia:* `src/engine/feedback.ts:98`; `src/engine/hints.ts:90` (sí calcula el prestamista) y `:97`.
  *Propuesta:* «¡Cuidado con el cero! No tiene nada que prestar: pide a la primera casa que no sea 0, y cada 0 que pases se convierte en 9.» Esfuerzo pequeño.

- **El elogio nombra un truco que el niño no ha usado.** `praiseFact` elige el elogio por el truco del hecho, sin mirar si el niño pidió la pista. En las divisiones, `showTrick` no hace nada.
  *Evidencia:* `src/engine/feedback.ts:37-57`; `src/engine/check.ts:111`; `src/activities/facts/index.tsx:40` (solo calcula el truco para `fact-mul`); `src/content/worlds/w8.ts:41`.
  *Propuesta:* elogiar la estrategia solo si el niño pidió el truco. Si no, elogio neutro. En división, añadir un truco propio («¿6 por cuánto da 42? Piensa en 6 × 7»). Esfuerzo pequeño.

- **Pistas de la resta que llegan a la vecina sin tabla de referencia.** Ver el mensaje del cero arriba.

### Progreso y repaso

- **Un fallo seguido de un acierto rápido sube de caja sin penalización en algunas vistas.** En la sesión diaria, al acertar tras fallar, el primer intento cuenta como pista usada en la multiplicación, así que la caja no sube. Pero en la división, el factor que falta, la lección y la prueba inicial no hay esa protección, y un acierto tras fallo puede subir de caja como si el niño lo supiera de un tirón.
  *Evidencia:* `src/activities/facts/shared/flow.ts:169-213` (el primer fallo llama a `core.retry()` sin `settle`); `flow.ts:185-190` (el acierto final se registra); `src/activities/views/FactView.tsx:19-22`; `src/world/review/ExerciseStep.tsx:62` y `:236-237`; `src/world/session/DailySession.tsx:307`; `src/engine/mastery.ts:59`; `src/activities/views/MissingFactorView.tsx:15`; `src/world/clase/ClassScreen.tsx:122`.
  *Propuesta:* extender a todas las vistas de hechos la regla que ya existe para multiplicar: el primer fallo cuenta como pista usada para la caja. Medir la fluidez solo con el primer intento. Añadir una prueba para hecho fallado y luego acertado en cada vista. Esfuerzo pequeño.

- **El dominio se puede conseguir en una sola sesión, y «dominada» llega el mismo día.** Con una sola destreza en el tema, el bloque «Lo nuevo» repite cuatro ítems de la misma destreza. La mezcla no excluye la destreza del calentamiento. Cada acierto rápido sube la caja, sin mirar si la destreza estaba vencida. Así, dos aciertos rápidos el mismo día ya dejan el tema como «dominado» (caja 2).
  *Evidencia:* `src/engine/daily.ts:38-39` (NEW_MIN y NEW_MAX), `~352-358` (bloque «Lo nuevo» con repetición), `~320` (calentamiento), `~372` (mezcla), `~413-421` (relleno); `src/engine/mastery.ts:46-80` (no mira `dueAt`); `src/content/syllabus/index.ts:48` (`MASTERED_BOX = 2`) y `~110`.
  *Propuesta:* subir de caja solo si la respuesta llega cuando la destreza ya está vencida. Exigir aciertos en al menos dos días distintos para «dominada». En «Lo nuevo», alternar con repaso de otro tema. Añadir pruebas para dos aciertos el mismo día. Esfuerzo medio.

- **El dominio se puede obtener por azar en destrezas de dos opciones y en juegos de elección.** «Igual o distinto» tiene un 50 % de acierto al azar, y «¿tiene sentido?» tiene dos opciones. En las burbujas, con cuatro opciones, también puede haber azar. Para estas destrezas no hay umbral de tiempo, así que cualquier acierto sin pista cuenta como fluido.
  *Evidencia:* `src/engine/calc.ts:542-563` (`sameItem`, 50 % de iguales); `src/engine/wordProblems.ts:121` y `~194`; `src/activities/bubbles/index.tsx:42` (cuatro opciones por defecto) y `~94`; `src/engine/mastery.ts:57-59` (`speedKindForSkill` devuelve null, así que el umbral es Infinity); `src/engine/skills.ts:337` y `:356-357`; `src/content/syllabus/grade4.ts:54` y `:99`.
  *Propuesta:* en destrezas con dos opciones, exigir aciertos en al menos tres días distintos antes de dominio, y no subir más de un nivel por sesión. En los juegos de elección, limitar la subida a un nivel. Para destrezas que no son hechos, usar un umbral de fluidez razonable en lugar de Infinity. Esfuerzo medio.

- **No hay olvido: el dominio no baja con el tiempo sin jugar.** Nada baja la caja por el paso del tiempo. La mitigación es que `urgencyOrder` pone primero lo vencido y de caja baja, así que la primera sesión de vuelta sí las trae de nuevo. Pero un acierto rápido de una destreza vencida hace semanas sube la caja, y «dominada» (caja 2 o más) es permanente.
  *Evidencia:* `src/engine/mastery.ts:73-78`; `src/engine/daily.ts:219-232` (`urgencyOrder`), `~313-318` (calentamiento), `~372` (mezcla); `src/content/syllabus/index.ts:110` (`topicProgress` sin fecha).
  *Propuesta:* si el acierto llega con un hueco mayor que el intervalo, no subir la caja en esa sesión, o bajar una antes de aplicar el acierto. Que `topicProgress` cuente solo destrezas revisadas en los últimos 30 días. Tras un parón largo, abrir con un calentamiento de reactivación. Esfuerzo medio.

- **Lengua, problemas y conceptos quedan fuera de la mezcla diaria de matemáticas.** Lengua tiene su propia sesión, y eso está bien. Pero en matemáticas, los conceptos (grupos iguales, repartos, valor posicional) y los problemas se filtran de la mezcla. El bloque «Problema» pone un solo ítem al día.
  *Evidencia:* `src/engine/daily.ts:227` (filtro de familias `concept`, `word` y `bar`); `src/engine/session.ts:19-20` y `:42-45` (`isReviewable` excluye concept del repaso); `src/world/review/logic.ts:24` (el repaso opcional sí los incluye); `src/engine/daily.ts ~448-450`.
  *Propuesta:* rotar conceptos y problemas ya dominados en la mezcla con peso bajo (un problema cada dos días, un concepto a la semana). Incluir conceptos en el repaso de `planSession`. No tocar la planificación de Lengua. Esfuerzo medio.

- **La prueba inicial no coloca: no cambia el punto de partida.** Con 20 ítems, cada respuesta pasa por la actualización normal de caja, así que un acierto en caja 0 da caja 1. El punto de partida depende solo de la caja. El texto «Ya sabemos por dónde empezar» promete algo que el código no hace.
  *Evidencia:* `src/engine/placement.ts:86-120` (20 ítems; `facts.slice(0, 4)` de 45 hechos); `src/world/placement/PlacementScreen.tsx:38` y `:85-90`; `src/content/syllabus/index.ts:101-106` (`currentTopic` solo mira la caja). `summarizePlacement` (`src/engine/placement.ts:131`) no se usa en la app; el informe usa `placementRuns` (`src/engine/report.ts ~430-460`).
  *Propuesta:* usar los resultados por bloque para proponer el punto de partida (marcar como repaso los temas con 80 % o más de aciertos) y pedir confirmación al adulto. Corregir el texto de fin de prueba. Eliminar o usar `summarizePlacement`. Esfuerzo medio.

- **Las pistas visibles desde el principio cuentan como aciertos sin ayuda.** En las lecciones, la primera pista (el truco) aparece sola y no suma en `hintsUsed`. Un acierto rápido con la pista visible sube de caja sin que el niño recuerde el hecho. En la sesión diaria, el ejercicio de matrices que sustituye a un hecho con apoyo se cuenta como acierto normal.
  *Evidencia:* `src/activities/facts/shared/flow.ts:23` y `:47-49` (`guided` deja `hintsShown` en 1 y `hintsUsed` en 0); `src/activities/lesson/TrySlot.tsx:150-159` y `:188`; `src/activities/exercises/index.tsx:23`; `src/engine/daily.ts:441-446` (`makeArray`); `src/engine/mastery.ts:59`.
  *Propuesta:* contar la pista guiada visible como `hintsUsed = 1` para la caja, o no dar fluidez a un acierto con apoyo visible. Marcar el ejercicio de matrices como apoyo y no subir caja con él, o exigir después un acierto sin figura. Registrar el tipo de ayuda para el informe. Esfuerzo pequeño.

- **Un tema se atasca mientras una destreza no suba de caja 2, y nadie lo avisa.** No hay tope de días ni salida al tema siguiente. La destreza atascada sigue apareciendo en la mezcla, así que el niño no pasa semanas sin practicarla, pero el tema no avanza y el adulto no lo sabe.
  *Evidencia:* `src/content/syllabus/index.ts:101-106` (`currentTopic`); `src/engine/daily.ts:336-349` (solo la primera destreza abierta en «Lo nuevo»); `~219-232` (`urgencyOrder`); `src/engine/topicOfToday.ts:21-24`.
  *Propuesta:* tras cinco días con una destreza que no sube, sacarla de «Lo nuevo», dejarla como repaso de apoyo en la mezcla y permitir avanzar al tema siguiente. Avisar al adulto con la destreza y el número de días. Esfuerzo medio.

- **La velocidad media se calcula pero nadie la usa.** `avgMs` no aparece en ningún informe, panel ni en la lógica de dominio.
  *Evidencia:* `src/engine/mastery.ts:53`, `:63`, `:76`; `src/types/progress.ts:18`; solo aparece en `src/data/dev.ts:68` y `:78`.
  *Propuesta:* mostrar en el informe del adulto la velocidad media por tabla y su tendencia, o usarla para la fluidez (dos aciertos por debajo del umbral en lugar de uno). Esfuerzo pequeño.

### Recorridos y temario

- **Dos caminos paralelos que no se coordinan.** El mapa lleva a un mundo, mientras «Hoy» trabaja la etapa del temario. Con el cristal de w1 y w2 conseguido, el temario puede seguir en descomponer-9999 (etapa 1). El guardián sí prueba algunos temas de la etapa, lo que atenúa el problema, pero el niño recibe dos destinos a la vez.
  *Evidencia:* `src/content/progression.ts:43-74` (`isWorldUnlocked`, `nextNode`); `src/engine/daily.ts:331` y `src/engine/topicOfToday.ts:21-24` (orden de temario); `src/world/session/DailySession.tsx:486` y `src/world/home/ChildHomeScreen.tsx:85` (usan `nextNode`); `src/content/syllabus/grade3.ts:31`.
  *Propuesta:* unir los dos caminos. Que el temario diario tome sus temas de la etapa del mundo en curso, o que `nextNode` use el primer tema no dominado. Abrir un mundo cuando el 80 % de los temas de la etapa anterior esté dominado, además de superar el guardián. «Seguir la aventura» debe apuntar al mismo tema que «Hoy». Hay que decidir si manda el temario o el mapa. Esfuerzo medio.

- **Los cursos de 4.º a 6.º juegan la aventura de 3.º y no tienen recorrido propio.** Las fracciones de 4.º aparecen en mundos de mitades y cuartos; no hay decimales, área ni simetría en los mundos. Para 2.º sí hay temporada propia.
  *Evidencia:* `src/engine/season.ts:48-49` (`seasonIdForGrade`: `c2` solo hasta 2.º, `s1` para el resto); `src/content/progression.ts:177-179` (4.º empieza en w3); `src/content/syllabus/grade4.ts:8` (comentario: sus etapas no van ligadas a los mundos).
  *Propuesta:* crear una temporada de 4.º con mundos, lecciones y guardianes que prueben sus etapas, siguiendo el modelo de `src/content/c2`. Mientras tanto, avisar en el informe del adulto de que la aventura es de 3.º. Esfuerzo grande.

- **Los guardianes de 3.º evalúan una muestra y dejan pasar con un fallo.** El guardián de w3 tiene 6 ítems de la tabla del 6 y 2 de geometría (8 en total), y se pasa con 7. Las tablas del 3 y del 4 aparecen solo como 3 × 6 y 4 × 6 dentro de un selector. Dobles y producto no se prueban. Un tema fallado puede quedar sin verse en el mapa.
  *Evidencia:* `src/content/guardians.ts:57-63` y `:12` (`passMin = total − 1`); `src/world/guardian/logic.ts:21-23` (`roundsPassed`); `src/engine/mastery.ts:102` (`starsFor` con umbral 0,6); `src/content/progression.ts:115` (actividad hecha con `stars ≥ 1`).
  *Propuesta:* dar al menos una ronda por tema de la etapa, como hace `src/content/c2/guardians.ts`. Subir el paso a 90 % o repetir el tema fallado. Incluir ítems de las tablas del 3 y del 4, dobles y problemas. Revisar el umbral del 60 % para dar por hecha una actividad. Esfuerzo medio.

- **La tabla del 9 no tiene juego propio.** Ningún selector de mundo usa la tabla del 9. El guardián de w6 sí incluye 7 × 9, y el mapa tiene una lección «El truco del 9». Pero «Jugar libre» no ofrece la tabla del 9.
  *Evidencia:* `src/content/worlds/w6.ts:36`, `:45`, `:52` (solo `[7]`); `src/world/free/logic.ts:35-43` (`unlockedTables` solo recoge tablas de selectores); `src/world/free/FreePlayScreen.tsx:47`; `src/content/guardians.ts:119` (incluye `mul:7x9`); `src/content/classes/grade3-tablas.ts:217` (clase de la tabla del 9).
  *Propuesta:* añadir en w6 una actividad de tabla del 9 (por ejemplo, con `tables [9]` y `factorRange [2, 9]`). Así `unlockedTables` la recoge y «Jugar» la ofrece. Esfuerzo pequeño.

- **«Ahora no» no tiene límite y permite cerrar la sesión con estrellas sin haber practicado.** El ítem pospuesto vuelve al final y solo se descarta cuando es el último. Un niño puede responder un ítem, pulsar «Ahora no» en el resto y cerrar con tres estrellas.
  *Evidencia:* `src/world/session/logic.ts:41-46`; `src/world/session/DailySession.tsx:171-177`, `:304`, `:425-430` (exige solo `answered ≥ 1`); `src/world/review/ExerciseStep.tsx:244-246`.
  *Propuesta:* limitar «Ahora no» (una vez por ítem y un máximo por sesión), dar las estrellas en proporción a los ítems contestados, y mostrar al adulto cuántos ítems se saltaron. Esfuerzo pequeño.

- **Tras perder un guardián no hay repaso dirigido del punto que falló.** La pantalla solo ofrece «Intentarlo otra vez» y «Volver al mapa». El texto de reintento menciona «Repasa con Lumi», pero sin enlace.
  *Evidencia:* `src/world/guardian/GuardianChallenge.tsx:186-203`; `src/content/guardians.ts` (`retryText` de w1, w2 y w3); `src/content/classes/index.ts:45` (`findLessonNode`, sin uso en el guardián).
  *Propuesta:* en el estado «perdido», añadir un botón que lleve a la lección del mundo y un repaso corto de tres o cuatro ítems de los temas fallados antes de reintentar. Esfuerzo pequeño.

- **En 3.º, la suma con tres llevadas y la resta de cuatro cifras se mezclan desde la primera sesión.** `suma-3d-llevando`, `suma-4d` y `resta-4d` no tienen pasos ordenados. En `suma-4d` aparecen juntas 0 y 4 llevadas en una misma sesión.
  *Evidencia:* `src/content/syllabus/grade3.ts:64-70`; `src/engine/daily.ts:336-356` (un tema no ordenado entra entero en candidatos); la evidencia del analista sobre `suma-3d-llevando` no se confirma, porque no tiene c0.
  *Propuesta:* marcar `suma-4d` y `resta-4d` como `ordered: true`, para que cada número de llevadas sea un paso. Esfuerzo pequeño.

- **«Dividir con las tablas» es un tema de 81 hechos sin pasos.** Con el divisor 2, que es fácil, se empieza por los nueve primeros. Los hechos difíciles (divisor 3, 4, 6, 7, 8 o 9) quedan después del corte de seis ítems, y el presupuesto de nuevos se gasta en hechos que no se muestran. Hacen falta 65 hechos para el dominio.
  *Evidencia:* `src/content/syllabus/grade3.ts:21-25` y `:94`; `src/engine/skills.ts:445-451` (`isEasyFact`); `src/engine/daily.ts:344-352`.
  *Propuesta:* partir el tema por divisor (entre 2, 5 y 10 primero, luego entre 3, 4, 6…) como pasos ordenados. Contar en el presupuesto solo los hechos que se muestran. Esfuerzo medio.

- **El problema del día puede no tener nada que ver con el tema.** `wordOpFor` mira la primera habilidad del tema. Si es reloj, moneda o geometría, no coincide con ningún tipo de problema y el orden alfabético da «suma».
  *Evidencia:* `src/engine/daily.ts:257-283` (`wordOpFor` y `barOpFor`); `src/engine/daily.ts:427` (bloque Problema).
  *Propuesta:* para temas no aritméticos, usar el problema del propio tema (su uso, por ejemplo horarios o compras) o uno de dinero o tiempo. Esfuerzo medio.

- **El tiempo que anuncia la sesión no coincide con lo que planifica.** Se anuncian «Lo nuevo 5 min» y «Mezcla 5 min», pero una cuenta en columna cuesta unos 55 s, así que seis ítems nuevos de columna pasan del tiempo anunciado.
  *Evidencia:* `src/world/session/DailySession.tsx` (bloque SESSION_SETUP de matemáticas); `src/engine/daily.ts:49-70` (`ITEM_SECONDS`, `ITEM_OVERHEAD_SECONDS = 5`).
  *Propuesta:* calcular el texto de cada bloque con `estimateSeconds` del plan real. Esfuerzo pequeño.

- **Carencias de 3.º en el ciclo y en el control de errores.** No hay simetría ni milímetros en 3.º (la simetría está en 4.º). El «encuentra el error» usa solo suma, resta y multiplicación, aunque la división es donde más se equivoca el niño.
  *Evidencia:* `src/content/syllabus/grade3.ts:166` (longitud sin mm); `src/content/syllabus/grade4.ts:149` (simetría solo en 4.º); `src/engine/daily.ts:68` (`HUNT_OPS = ['add', 'sub', 'mul']`) y `:393-396`; `docs/curriculum/MATEMATICAS_PRIMARIA.md:130` (la resta con ceros y la división con resto son los puntos con más error).
  *Propuesta:* añadir un «encuentra el error» de división desde la etapa 8. Valorar mover simetría y milímetros a 3.º según el ciclo, sin darlo por verificado. Esfuerzo medio.

- **El cierre de la sesión no recuerda la regla que se trabajó.** Las clases de 3.º tienen frase-regla, pero el cierre diario no la muestra.
  *Evidencia:* `src/world/session/DailySession.tsx:404-484` (el cierre no menciona la regla); `src/content/classes/grade3-tablas.ts` (la frase «La regla: …»); `src/content/classes/index.ts:40` (`classForTopic`).
  *Propuesta:* mostrar en el cierre la frase-regla de la clase del tema de hoy, en una tarjeta breve. Para temas sin clase, no mostrar nada. Esfuerzo pequeño.

### Juegos y actividades

- **Las actividades de operaciones no se adaptan al historial del niño.** Array, columna, división, grupos, reparto, problemas, tablero y ejercicios llaman a `generate` sin `adaptive`, así que ignoran el dominio del niño. El mecanismo existe (`selector.adaptive ?? true` en `items.ts`), pero ningún selector de contenido lo activa.
  *Evidencia:* `src/activities/array/index.tsx:17`, `column/index.tsx:26`, `division/index.tsx:17`, `groups/index.tsx:16`, `share/index.tsx:23`, `word/index.tsx:16`, `board/index.tsx:41`, `exercises/index.tsx:14`; `src/engine/generate.ts:837-839`; `src/activities/facts/shared/items.ts:21`; `src/activities/bubbles/index.tsx:46`.
  *Propuesta:* crear un helper, como `useItems`, que pase `adaptive: config.selector.adaptive ?? true` a las actividades de operaciones, el tablero y los ejercicios sueltos. Antes, revisar que `planAdaptive` no introduzca habilidades fuera del tema que el juego enseña (hoy reserva cerca de un 30 % para nuevas). Añadir una prueba. Esfuerzo pequeño.

- **En los problemas, el niño adivina la operación por ensayo, y el intento no se registra.** Cada botón de operación se prueba hasta acertar. La pista que aparece es genérica (enumera los cuatro verbos sin nombrar la palabra clave de la historia). Ningún coste ni registro para la elección.
  *Evidencia:* `src/activities/views/WordProblemView.tsx:61` y `:63-66` (`opReady` y `pickOp`); `src/activities/word/index.tsx:21` y `:28` (`useOpsRun`, que solo recibe el resultado numérico); `src/content/worlds/w7.ts:60-62` (`chooseOp: true`).
  *Propuesta:* registrar la primera elección de operación como intento fallado con `errorType: 'operation'` (el tipo existe en `src/types/exercise.ts`). Tras el primer fallo, una pista que nombre la palabra clave de esa historia concreta. Tras dos fallos, mostrar la operación correcta con la frase que la delata. Esfuerzo medio.

- **El cronómetro de las burbujas viene activado y avisa con cuenta atrás también para hechos nuevos.** Para un hecho que el niño aún no domina, la barra baja en 12 segundos y, si no contesta, cuenta como fallo.
  *Evidencia:* `src/types/child.ts:80` (`timedActivities: true` por defecto); `src/activities/host.tsx:24`; `src/activities/bubbles/index.tsx:20` (`TIMER_MS = 12000`), `:83-88`, `:106`, `:159`, `:165`. DIDACTICA §4.4 dice «hecho nuevo, primeros intentos: sin cuenta atrás visible».
  *Propuesta:* dejar el cronómetro desactivado por defecto en 2.º y 3.º, o activarlo solo para hechos en caja 3 o superior. Ocultar la cuenta en los hechos sin dominio. Revisar también `src/activities/race/index.tsx:91`.
  Esfuerzo pequeño.

- **En burbujas se puede tantear hasta acertar, y el tiempo agotado cuenta como fallo.** Tras un toque erróneo solo se atenúa la burbuja, no se desactiva. Un niño lento que sabe el hecho queda registrado como fallido si se agota el reloj.
  *Evidencia:* `src/activities/bubbles/index.tsx:191` (`disabled={popped !== null}`); `:142-146` (toque erróneo); `:126-127` (intento en el primer toque); `:91-101` (tiempo agotado registrado como fallo); `src/types/child.ts:80`.
  *Propuesta:* desactivar la burbuja errónea tras cada fallo, y tras el segundo, revelar la respuesta con un paso de copia. Registrar el tiempo agotado con un tipo propio. Valorar que el reloj empiece apagado en 2.º. Esfuerzo pequeño.

- **Dentro de cada mundo, varios juegos seguidos practican una sola tabla.** En w3, necklace, wheel, maze y missing usan solo la tabla del 6. En w5, chain, wheel y maze usan solo la del 8. En w6, wheel, missing y pixel usan solo la del 7. Los juegos de w5 bubbles, w6 memory y w6 race ya mezclan tablas.
  *Evidencia:* `src/content/worlds/w3.ts:21-51`; `src/content/worlds/w5.ts:21-49`; `src/content/worlds/w6.ts:32-76`. El plan diario sí intercala (`src/engine/daily.ts`, `interleavedPick`).
  *Propuesta:* en w3 y w5, añadir mezcla a algún juego (por ejemplo, el laberinto o el wheel final con las tablas 6 y 7), y un repaso intercalado al final del mundo. Primero el dominio, después la mezcla. Esfuerzo medio.

- **Construir el grupo o el rectángulo es obligatorio en cada ronda y no se desvanece.** Es el paso concreto del método concreto-pictórico-abstracto, y es valioso para empezar. El problema es que no se retira cuando el niño ya domina, y el reparto sigue resaltando dónde va cada objeto.
  *Evidencia:* `src/activities/array/index.tsx:47` y `:78`; `src/activities/groups/index.tsx:33-39`; `src/activities/share/index.tsx:52` y `:85`; `src/content/worlds/w1.ts:32` (rectángulos hasta 36 huecos); `src/engine/daily.ts:49-50` (`ITEM_SECONDS` 20 para array y groups).
  *Propuesta:* construcción completa en la primera ronda de cada tipo. Después, solo una parte de los huecos o un botón «ya lo sé». Quitar el resaltado de la amiga tras dos rondas bien contestadas. Ajustar los tiempos a lo medido. Esfuerzo pequeño.

- **Faltan tipos de práctica: mitades y dobles, recta numérica, estimación y descomposición como juego.** La recta numérica aparece en las clases, y la descomposición en el método de restar y en `MulPartsView`, pero no hay juego propio. La estimación sí aparece en `MeasureView`.
  *Evidencia:* `src/activities/registry.ts:12-32` y `:86`; `src/activities/chain/index.tsx` (solo `double-chain`); `src/activities/views/SubtractionView.tsx:9`; `src/content/classes/grade3-numeros.ts:97-101`; `src/activities/views/MeasureView.tsx:39`.
  *Propuesta:* crear «Mitades y dobles» y una actividad de recta numérica con estimación antes de contar. Conectar la descomposición como estrategia opcional de cálculo mental. Esfuerzo grande; prioridad media.

- **En el laberinto, la pista llega tras dos fallos y permite seguir sin recordar el producto.** Tras dos toques erróneos, la casilla correcta se resalta.
  *Evidencia:* `src/activities/maze/index.tsx:69`, `:92`, `:105` (`hint = wrongHere >= 2 && cell === expected`); `src/content/worlds/w3.ts:42` (el camino solo va a la derecha o hacia abajo).
  *Propuesta:* pedir el producto de la casilla («¿6 × cuánto da 30?») antes de resaltar, o resaltar solo tras tres fallos. Registrar la casilla resaltada como intento fallado. Esfuerzo pequeño.

- **En la rueda, la pista llega sin escribir la respuesta.** Tras dos fallos, la respuesta se muestra durante un momento y el niño pasa a lo siguiente. En las secuencias no hay fase de copia.
  *Evidencia:* `src/activities/views/FactView.tsx:17`, `:20-21`, `:33` (la copia solo con `teach === 'full'`); `src/activities/facts/shared/flow.ts:194-196` y `:273`; `src/world/session/DailySession.tsx:307`; `src/activities/wheel/index.tsx:108`.
  *Propuesta:* usar `teach: 'full'` en facts, race y la rueda para que haya paso de copia. Añadir una fase de copia tras la revelación en `SkipCountView`, `DoubleChainView` y `FactFamilyView`. Esfuerzo pequeño.

- **La tercera pista de la falta de factor enumera la serie y casi da la respuesta.** La serie que se muestra permite contar cuántos números hay, que es el factor, en lugar de recordar el producto.
  *Evidencia:* `src/engine/hints.ts:336-346` (`missing-factor`); `src/content/worlds/w3.ts:51`; `src/content/worlds/w6.ts:45`.
  *Propuesta:* mostrar la serie con un hueco («6, 12, 18, __») y pedir el último término o el producto. Esfuerzo pequeño.

- **Pixel revela sin responder los grupos que no llegan a preguntar, y varios contadores prometen más de lo que dan.** Hoy no pasa porque el contenido está bien ajustado. Race recorta en silencio a 12 ítems, aunque la configuración diga 20.
  *Evidencia:* `src/activities/pixel/index.tsx:82-83` y `:92-94`; `src/activities/facts/shared/items.ts:7-11` (`MAX_ITEMS = 12`); `src/activities/race/index.tsx:29`; `src/content/worlds/w6.ts:52-53`; `src/content/worlds/w7.ts:42`.
  *Propuesta:* revelar solo los grupos sin producto válido, no los recortados. Hacer que el `count` de cada contenido coincida con las rondas reales, con un test de contenido. Esfuerzo pequeño.

### Lecciones y explicaciones

- **Las prácticas «sin pistas» muestran la primera pista (el truco) desde el principio.** El paso está configurado con `hints: false`, pero la vista recibe `guided` y el truco aparece como pista 1 al empezar. El registro guarda 0 pistas, así que el niño cree que calcula sin ayuda y tiene el truco en pantalla.
  *Evidencia:* `src/content/classes/dsl.ts:28` (clase fija `hints: false` en pasos «sola»); `src/activities/lesson/LessonPlayer.tsx:191` (`allowHints=false` oculta el botón); `src/activities/lesson/TrySlot.tsx:188` (siempre `guided`); `src/activities/facts/shared/flow.ts:49`; `src/activities/views/FactView.tsx` (`HintPanel` sin condición de `allowHints`); `src/engine/hints.ts` (factHints, nivel 1).
  *Propuesta:* pasar `guided={allowHints}` en `TrySlot`, de modo que un paso sin pistas no muestre ninguna al empezar. Si se quiere conservar la primera pista como andamiaje, contarla en `hintsUsed` y distinguir «resuelto con pista» de «resuelto de memoria» en el registro del adulto. Esfuerzo pequeño.

- **Solo hay clases estructuradas para 3.º.** Fuera de 3.º, `classForTopic` no devuelve nada. 2.º tiene seis lecciones propias en el mapa, pero no el formato de clase. 4.º a 6.º usan la temporada de 3.º. Sin curso elegido se trata como 3.º.
  *Evidencia:* `src/content/classes/index.ts:39-40` (`if ((grade ?? 3) !== 3) return undefined`); `src/world/clase/ClassScreen.tsx:33` (redirige a /play); `src/world/home/todayEntry.ts:52`; `src/content/season.ts` (`seasonIdForGrade`); `src/content/c2/lessons.ts:7-57`; `src/world/onboarding/OnboardingScreen.tsx` (ofrece de 1.º a 6.º).
  *Propuesta:* que `classForTopic` busque la clase del curso y que «Hoy» abra la clase del curso cuando exista. Escribir clases de 2.º reutilizando las lecciones de c2 (grupos de diez, sumas y restas de dos cifras, dobles, tablas del 2, 5 y 10) y de 4.º (multiplicar por dos cifras, fracciones equivalentes, problemas de dos pasos). Esfuerzo grande.

- **El «me llevo una» se enseña como procedimiento y como mochila, sin explicar por qué 10 unidades son una decena.** La llevada se explica como una acción, no como un cambio de 10 unidades por una decena.
  *Evidencia:* `src/content/lessons/w2.ts` (`w2Carry`: «Escribo el 5 y me llevo 1» sin razón); `src/content/classes/grade3.ts:22` y `:31`; `src/activities/lesson/visuals/addition.tsx` (`CarryVisual`, la «mochila» no agrupa unidades); `src/content/classes/grade3-problemas.ts:150` (47 + 35 = 72 con «se olvidó el 1»). En 2.º, `src/content/c2/lessons.ts:9` sí enseña que «un grupo de 10 unidades es una decena».
  *Propuesta:* añadir antes de la mochila un paso de «¿por qué?»: 15 = 10 + 5, diez unidades se cambian por una decena (bloques de base 10) y después se escribe el 5. Dar a la resta por compensación un nombre distinto de «me llevo una». Esfuerzo medio.

- **La división solo se enseña como reparto.** El agrupamiento («¿cuántas cajas de 4 se llenan con 20?») aparece en la práctica, pero no se define ni se contrasta con el reparto.
  *Evidencia:* `src/content/classes/grade3.ts:356-378` (clase «Dividir es repartir», cierre «Dividir es repartir en partes iguales»); `src/content/classes/grade3-problemas.ts:86-109` (solo reparto); `src/content/classes/grade3.ts:412-415` (ya usa el agrupamiento); `:462`.
  *Propuesta:* una lección corta «Dos maneras de dividir» con las mismas bloques o barra: reparto («¿cuánto le toca a cada uno?») y agrupamiento («¿cuántos grupos se llenan?»), con la galera para comprobar los dos. Esfuerzo medio.

- **La numeración se enseña casi toda con texto grande, sin representación concreta.** En `grade3-numeros.ts`, 40 de 51 pantallas son `big-text`. Comparar, leer y ordenar cifras de cuatro dígitos no tiene casitas ni recta. La balanza se menciona, pero no se dibuja.
  *Evidencia:* `src/content/classes/grade3-numeros.ts:36-50` (leer y escribir), `:63-75` (comparar y ordenar), `:177` (balanza). Matiz: comparar tiene un paso de casitas, y leer y escribir también en su segundo paso.
  *Propuesta:* usar `place-value` y `number-line` en los pasos de comparar y leer que hoy son tarjeta, dibujar la balanza para el signo igual y una fila de niños para los ordinales. Esfuerzo medio.

- **Terminología de posición inconsistente.** Se usa «UM» en 2.º y «millares» en 3.º. Las casas fuera de la lista caen en valores por defecto.
  *Evidencia:* `src/content/lessons/w2.ts:8`; `src/activities/lesson/visuals/addition.tsx:8-9` y `:25-26` (`?? 'UM'`, `?? 'miles'`); `src/content/classes/grade3-numeros.ts:13`.
  *Propuesta:* elegir «millares» y usarlo en lecciones, visuales y clases. Ampliar la lista de nombres con «DM» y «decenas de millar». Esfuerzo pequeño.

- **La clase del 7 pide 7 × 9 antes que la clase del 9.** El truco del 9 aparece como primera pista de cualquier hecho con un 9, sin su clase.
  *Evidencia:* `src/content/classes/grade3-tablas.ts:207-209` (la clase del 7 usa `facts(7,8,10)`) y `:237-247` (la del 9 va la última); `src/engine/strategies.ts:97-100`.
  *Propuesta:* dejar en la clase del 7 solo los factores ya vistos y mover 7 × 9 a la clase del 9, o reordenar las clases. Esfuerzo pequeño.

- **Algunas frases de clase son confusas.** «Quitamos los de Dani a los de Pepa» es difícil de seguir. «De 0 a 5 el número no cambia» no es cierto para la hora 0. Las fracciones no explican cómo comparar 1/2 y 1/3.
  *Evidencia:* `src/content/classes/grade3-problemas.ts:45`; `src/content/classes/grade3-tiempo.ts:92`; `src/content/classes/grade3-fracciones.ts:88`; `src/content/classes/lengua3.ts:281` (la r inicial no se dice que suena fuerte).
  *Propuesta:* una idea por frase y el ejemplo al lado. Corregir la hora 0 (medianoche se lee 12 de la noche). Añadir un ejemplo de comparación por equivalencia. Esfuerzo pequeño.

### Motivación

- **Las historias y las lecciones dan las 3 estrellas aunque no se resuelva nada.** Leer una historia da lo mismo que practicar, y «Saltar» también da las tres estrellas. Con ello se pueden comprar gran parte de los accesorios sin resolver ejercicios.
  *Evidencia:* `src/content/progression.ts:103-106` (`COMPLETION_STARS` para story y lesson sin mirar el resultado); `src/world/node/NodeScreen.tsx:133` y `:146`; `src/world/story/StoryPlayer.tsx:90-94` y `:171`; `src/activities/lesson/LessonPlayer.tsx:107`.
  *Propuesta:* dar 1 estrella a historias y lecciones, y reservar las tres para actividades y guardianes. En lecciones con pasos de tipo `try`, dar las estrellas según cuántos se resuelven. «Saltar» no debe dar estrellas. Esfuerzo pequeño.

- **Un nodo se da por hecho con el 60 % de aciertos, y el rescate y las pegatinas premian completar.** Con seis ítems, cuatro aciertos dan una estrella y abren el nodo, aunque la guía pedagógica pide el 80 %.
  *Evidencia:* `src/content/progression.ts:115` (`passed = stars >= 1`); `src/engine/mastery.ts:102` (umbral 0,6); `src/world/map/WorldMapScreen.tsx:67-71` (el rescate cuenta nodos completados); `src/content/stickers.ts` (ocho reglas `node:`). Matiz: los fallos vuelven en la misma sesión, así que el niño sí revisa lo que falló.
  *Propuesta:* dejar avanzar con el 60 %, pero marcar el nodo «por repasar» si no llega al 80 %, con una estrella de repaso en el mapa. Que el rescate dependa de estrellas y no de completar. Añadir pegatinas de dominio. Esfuerzo medio.

- **La recompensa diaria premia la asistencia, no el acierto.** Se gana con haber respondido un ítem y cerrar, aunque sea con «Ahora no». En caligrafía, las estrellas no dependen de la calidad.
  *Evidencia:* `src/world/session/DailySession.tsx:425` (`answered > 0`); `src/world/session/logic.ts:41-47` (`postpone`); `src/world/caligrafia/CaligrafiaScreen.tsx:82-92` y `:100` (`CALIG_STARS` al terminar).
  *Propuesta:* exigir un mínimo de ítems respondidos (no pospuestos), por ejemplo la mitad de los planificados. Añadir +1 estrella con 80 % de aciertos. El último ítem pospuesto debe responderse para cerrar. En caligrafía, sumar una estrella por trazos bien hechos. Esfuerzo pequeño.

- **La sesión diaria no da recompensa cuando se acaba el tiempo, y el texto lo contradice.** Al agotarse el tiempo, la sesión se cierra al responder el ítem actual y no da estrellas, mientras el texto dice «lo que has hecho cuenta». Afecta sobre todo a quien va más lento de lo previsto.
  *Evidencia:* `src/world/session/DailySession.tsx:135`, `:190-192`, `:260`, `:425`, `:453`, `:462`; `src/engine/daily.ts:412` (planifica para 15 minutos).
  *Propuesta:* dar las 3 estrellas también al agotar el tiempo si el niño ha respondido al menos la mitad de los ítems planificados. Cambiar el texto por algo concreto: «Hoy has trabajado N ejercicios. Mañana sigues desde aquí». Esfuerzo pequeño.

- **El guardián reinicia todo el desafío tras un fallo, sin apoyo ni repaso dirigido.** Tras un fallo de rondas, «Intentarlo otra vez» genera rondas nuevas, y las rondas no tienen pistas. Un niño que falla dos respuestas en un guardián de ocho ítems empieza otra vez. Si falla el hechizo tras pasar las rondas, repite las rondas superadas. No pierde nada guardado.
  *Evidencia:* `src/world/guardian/GuardianChallenge.tsx:39-40` (`start()` regenera rondas), `:49-53` (estado «lost»), `:63`, `:84-88`, `:133` y `:158` (`allowHints={false}`); `src/content/guardians.ts:12` y `:35` («Repasa los grupos con Lumi» no enlaza a nada); `src/world/guardian/logic.ts:14` (`SPELL_TRIES = 2`) y `:21`; `src/world/node/NodeScreen.tsx:180` (`onFail` vacío).
  *Propuesta:* tras un fallo de rondas, mostrar «Has acertado 4 de 6» y la habilidad fallada, con un botón a su lección. En el segundo intento, permitir una pista por ítem. Si el fallo es en el hechizo, reintentar solo el hechizo. Un reinicio completo solo tras el segundo fallo de rondas. Esfuerzo medio.

- **El niño no ve su propio dominio por tablas ni su mejora.** La pantalla infantil de «Jugar libre» lista las tablas sin ningún estado. El texto de dominio se genera solo para el adulto.
  *Evidencia:* `src/world/free/FreePlayScreen.tsx:87-100`; `src/world/free/logic.ts:35-43`; `src/adult/shared/reading.ts:60-85` (solo adulto); `src/engine/mastery.ts:109` (`factGrid` sin uso infantil); `src/world/cancion/logic.ts:63` (`songGaps` sin mostrar).
  *Propuesta:* en «Jugar libre» añadir una barra de 0 a 3 por tabla a partir de las cajas (caja 3 o más = «la tienes»), sin pantalla nueva. Mostrar solo lo positivo, sin cifras de error. Esfuerzo medio.

- **«Enséñale a Borrón», el truco de enseñar a otro, está definido pero no conectado.** Explicar a otro es de las estrategias de aprendizaje más potentes, y es el momento más emocional del juego. Hoy el finale solo lo narra.
  *Evidencia:* `src/content/meta.ts:6-13` (`TEACH_BACK_ACTIVITY`); `src/content/index.ts:105` (solo reexportación); `src/content/__tests__/helpers.ts`; `src/activities/facts/index.tsx:74` (insignia «Ayuda a Borrón»); `src/content/stories/finale.ts:18` («¿Quieres que te enseñe un truco?»).
  *Propuesta:* conectar `TEACH_BACK_ACTIVITY` como paso opcional tras la confesión de Borrón en el finale, o como nodo extra tras el mundo 8 sin bloquear el cofre. Borrón reacciona con alegría a cada respuesta bien explicada. Comprobar antes que el niño domina las tablas 6, 7 y 8. Esfuerzo medio.

- **La tienda se agota y no hay nada que comprar después.** Hay 18 accesorios por 230 estrellas en total. Las estrellas de nodos suman bastante más, así que la tienda se agota hacia el final de la temporada, cuando el niño ya tiene casi todo.
  *Evidencia:* `src/content/accessories.ts` (18 accesorios, 230 en total); `src/content/meta.ts:16` (`SEASON2_TEASER`, sin uso en pantalla); `src/content/progression.ts:208-218` (`switchSeason` conserva el progreso); `src/content/worlds` (52 actividades, 8 guardianes, 20 lecciones y 16 historias).
  *Propuesta:* ampliar la tienda por temporada (accesorios nuevos ligados a las islas o a los mundos de 2.º). Añadir sumideros pequeños antes: colores del cuerno, fondos del mapa, poses del compañero. Mostrar «Te faltan N estrellas para…». Esfuerzo grande por el contenido; empezar por los sumideros pequeños.

- **El premio final del adulto está oculto hasta tener los 8 cristales, y la palabra secreta no tiene ritual.** El niño no sabe que le espera un premio real. El texto «VALIENTE» existe, pero no se usa.
  *Evidencia:* `src/world/prizes/PrizesScreen.tsx:20` y `:28-29` (la tesela solo aparece si `allCrystals`); `src/world/chest/ChestView.tsx:44-72`; `src/world/chest/ChestScreen.tsx:67-68`; `src/content/meta.ts:41-43` (`CHEST_TEXT.prompt` sin uso); `src/world/chest/logic.ts:22`.
  *Propuesta:* mostrar siempre el Gran Cofre bloqueado en «Mis premios» con un contador de cristales. Preguntar a la familia si el título del premio puede verse antes de abrirlo. Al llegar a 8 cristales, pedir al niño que diga o escriba «VALIENTE» antes de abrir el cofre. Esfuerzo pequeño.

- **El cronómetro de las burbujas viene activado.** Ver la sección 4, Juegos, ya descrita.

## 5. Familias y profesores

La zona de adultos tiene una buena base: lecturas en español que nombran tablas concretas, errores agrupados con consejo, prueba de recuerdo y comparación antes y después. Pero hay fallos de lectura que pueden llevar a una decisión equivocada.

- **Dos definiciones de «dominado» en la misma pantalla.** El temario dice «dominado» con el 80 % de las destrezas en caja 2 o más. Las tablas dicen «dominada» solo con caja 4,5 o más. Una caja 2 a 4 aparece como «En camino» en las tablas y como «Dominado» en el tema. La contradicción se ve en la misma pantalla.
  *Evidencia:* `src/content/syllabus/index.ts:46-47` y `:77-79`; `src/engine/report.ts:69`; `src/adult/child/LearningCards.tsx:304-309`; `src/adult/shared/heatmap.ts:7-12` y `:14-19`; `src/adult/child/ChildReportScreen.tsx:205-206` («N de 55 multiplicaciones dominadas»).
  *Propuesta:* usar dos nombres explícitos: «lo sabe» (caja 2 o más en el 80 % de las destrezas) y «dominada de memoria» (caja 5, o 4,5 o más). Cambiar los textos y añadir una frase que explique la diferencia. Esfuerzo pequeño.

- **La media de la clase oculta a los alumnos que no dominan un hecho.** Un alumno con caja 5 en 7 × 8 y ningún otro dato hace que la clase aparezca como «Dominada». Las casillas sin practicar no pesan en la media, y el aviso no lo dice.
  *Evidencia:* `src/adult/shared/heatmap.ts:38-53` (`averageGrid` solo promedia `v >= 0`); `src/adult/school/ClassScreen.tsx:76-79`, `:170`, `:173-175`; `src/adult/shared/reading.ts` (`hardestTable` usa la misma media).
  *Propuesta:* mostrar conteos por hecho en lugar de medias: cuántos alumnos lo dominan, cuántos lo tienen en curso, cuántos lo repasan y cuántos no lo han practicado. Calcular la tabla más difícil por el número de alumnos que la repasan. Esfuerzo medio.

- **Las misiones del colegio no llegan al niño y no tienen seguimiento.** La pantalla de clase muestra la misión («tu profe te ha pedido…» y la fecha límite), pero ninguna pantalla del niño la muestra, y no hay forma de saber quién la ha hecho: las sesiones no guardan el identificador de la misión.
  *Evidencia:* `src/adult/school/ClassScreen.tsx:220-261` y `:223`; `src/data/schools.ts:197-240` (solo se crea y se lee); `src/data/schools.ts:226-238` (`listAssignmentsForChild` sin llamadores en `src/world`); `src/types/org.ts:65-74`; `src/types/progress.ts` (sin campo de misión).
  *Propuesta:* mostrar la misión vigente en el inicio del niño, pequeña y sin presión. Guardar el identificador de la misión en las sesiones que la juegan, y mostrar «hecha por X de Y» y quiénes faltan antes de la fecha límite. Esfuerzo grande.

- **El informe no dice qué respuesta falló, aunque los datos están guardados.** Sí dice qué tablas repasar, pero no los errores concretos («escribió 54, la respuesta es 56»). Los datos (`given` y `expected`) se guardan por intento, pero solo se muestran en Inglés.
  *Evidencia:* `src/adult/child/LearningCards.tsx:384-433` (`MistakesCard`, sin `given` ni `expected`) y `:247` (solo Inglés); `src/types/progress.ts:35-36`; `src/adult/shared/reading.ts:59-66`; `src/adult/child/ChildReportScreen.tsx:190-192`; `src/adult/home/AdultHomeScreen.tsx:140-142`.
  *Propuesta:* en cada grupo de errores, añadir los últimos tres fallos con el formato «7 × 8: escribió 54 (la respuesta es 56)». En el mapa de tablas, junto a cada hecho a repasar, el último error. Los datos ya se leen en `useLearningData`. Esfuerzo medio.

- **«No ha practicado esta semana» cuenta solo las matemáticas.** Un alumno que solo ha jugado a Lengua o Inglés aparece como inactivo. La consulta del servidor excluye Lengua e Inglés de los minutos.
  *Evidencia:* `src/adult/school/ClassScreen.tsx:78` y `:202`; `src/data/schools.ts:137-140`; `supabase/migrations/0005_ingles_stats.sql:70-74`; `src/data/summary.ts:96`. Lengua e Inglés solo se ofrecen en 3.º (`src/engine/subjects.ts:66-70`), así que el alcance es menor.
  *Propuesta:* contar como activo a quien haya jugado en cualquiera de las tres asignaturas, y mostrar los minutos por asignatura. Como mínimo, cambiar el texto a «sin practicar matemáticas esta semana». Esfuerzo pequeño.

- **La pantalla de clase no muestra en qué falla cada alumno, aunque el servidor ya lo calcula.** El servidor envía `top_errors` por alumno, pero la vista de clase no lo muestra. El adulto tiene que abrir cada informe por separado.
  *Evidencia:* `src/data/schools.ts:142`; `src/types/org.ts:87` y `:106-109`; `src/adult/school/ClassScreen.tsx:194-215`; `src/adult/home/AdultHomeScreen.tsx:64` (solo aquí se usa).
  *Propuesta:* mostrar por alumno los dos tipos de error más frecuentes y las tablas para repasar, usando el texto de `readTables`. No requiere consulta nueva. Esfuerzo pequeño.

- **En casa, la familia no puede elegir las tablas ni las operaciones que practica el niño.** La familia puede leer «repasa 7 y 8», pero no dirigir la práctica hacia esas tablas. El niño puede elegir una tabla en «Jugar libre», sin orientación del adulto y solo entre las ya desbloqueadas.
  *Evidencia:* `src/types/child.ts:48-75` (sin campo de tablas ni operaciones); `src/adult/child/ChildSettingsCard.tsx:37-175`; `src/world/free/FreePlayScreen.tsx:88-98`; `src/world/free/logic.ts:25-37` y `:59-62` (`tableDrill`).
  *Propuesta:* añadir en la zona de adultos «Practicar en casa»: elegir hasta tres tablas u operaciones, o marcar la sesión de hoy como repaso de esos hechos. Enlazarlo desde cada consejo del informe. Reutilizar el selector de `src/adult/school/presets.ts`. Esfuerzo medio.

- **La prueba de bloque no se repite sola.** El plan docente pide repetirla cada tres o cuatro semanas, pero la app espera a que el adulto la pida. No hay ningún programador.
  *Evidencia:* `docs/curriculum/PLAN_DOCENTE.md:86-91`; `src/world/home/ChildHomeScreen.tsx:96-98`; `src/world/placement/PlacementScreen.tsx:184-187`; `src/adult/child/LearningCards.tsx:65-67` y `:495-497` (solo el adulto activa la bandera).
  *Propuesta:* programar la prueba cada cuatro semanas o tras cerrar un bloque, y mostrar en el informe «próxima prueba: fecha». Hace falta un canal para avisar a la familia, que hoy no existe. Esfuerzo medio.

- **Los consejos son genéricos y solo se muestran para dos grupos de error.** Los textos de `ERROR_GROUPS` son fijos y no dependen de los hechos del niño. El tercer grupo y los siguientes no reciben consejo.
  *Evidencia:* `src/adult/child/LearningCards.tsx:419` (muestra «Qué ayuda» solo si `i < 2`); `src/engine/report.ts:133-236`.
  *Propuesta:* generar un plan «Hoy en casa» con tres acciones concretas a partir de los hechos y tipos reales del niño («5 minutos con 7 × 8 y 6 × 7; pedirle que diga en voz alta cada paso de la resta con llevada»). Esfuerzo medio.

- **No se ve la evolución en el tiempo.** Solo se muestran los últimos siete días de tiempo y aciertos. Hay comparaciones puntuales (errores del último mes frente al anterior, y la prueba inicial), pero no una serie.
  *Evidencia:* `src/adult/child/ChildReportScreen.tsx:195-212`; `src/adult/child/LearningCards.tsx:370-382`, `:407-418` y `:474-486`; `src/types/progress.ts:101` (`daysPlayed`, sin uso en el informe).
  *Propuesta:* gráfica de las últimas ocho semanas con minutos, aciertos, casillas dominadas y días practicados por semana, a partir de `sessions` y `attempts`. Esfuerzo medio.

- **«Error más frecuente» cuenta «No lo sé» como error, y el informe no.** La pantalla de inicio dice que el error más frecuente es «Dice que todavía no lo sabe», mientras el informe no muestra ningún fallo. La familia recibe dos mensajes distintos.
  *Evidencia:* `src/data/summary.ts:75-78`; `src/adult/home/AdultHomeScreen.tsx:64` y `:181-184`; `src/engine/describe.ts:307`; `src/engine/report.ts:277` y `:291` (asigna `dont-know` a null); `supabase/migrations/0005_ingles_stats.sql:62-63`.
  *Propuesta:* excluir `dont-know` de `topErrors`, o mostrarlo aparte como «casillas aún por aprender». Aplicar lo mismo en el SQL de `child_stats`. Esfuerzo pequeño.

- **Lengua e Inglés solo se ofrecen en 3.º.** Es una decisión de producto, no de código. Un niño de 2.º o 4.º no tiene informe de estas asignaturas, y en Inglés el temario de otros cursos está vacío.
  *Evidencia:* `src/engine/subjects.ts:66-70`; `src/adult/child/SubjectsCard.tsx:19-23` («de momento»); `src/content/syllabus/index.ts:40-42`.
  *Propuesta:* decidirlo con el dueño. Si hay contenido para otros cursos, habilitarlo. Si no, decirlo en la ficha de la asignatura en lugar de ocultarla. Esfuerzo grande.

- **Datos de la prueba inicial que se pierden.** La lectura de intentos tiene un límite de 5 000 y no omite la escritura a mano. Los «No lo sé» de la prueba se cuentan, pero no se muestran por bloque.
  *Evidencia:* `src/adult/child/LearningCards.tsx:29` (`ATTEMPT_LIMIT = 5000`) y `:48`; `src/data/activity.ts:26-33` (ya ofrece `skipHandwriting`); `src/world/session/DailySession.tsx:116` (lo usa); `src/engine/placement.ts:124-145`; `src/engine/report.ts:416-423`.
  *Propuesta:* pasar `skipHandwriting: true` en las lecturas de matemáticas, Lengua e Inglés, y leer las pruebas iniciales sin límite. Mostrar por bloque los «No lo sé» junto a los aciertos. Esfuerzo pequeño.

## 6. Lengua, Inglés y Caligrafía

Las tres materias comparten la estructura de Matemáticas: temario por habilidades, generador, corrector con tipos de error, pistas en tres niveles que no dan la respuesta y un plan diario. Lengua tiene 16 tipos de ejercicio, con ortografía muy bien elegida (los huecos de c/qu, g/gu/gü, r/rr y mp/mb no dan otra palabra real al cambiarlos). Inglés compara con tolerancia. Caligrafía tiene 73 elementos en orden de enseñanza. Estos son los fallos.

- **El dictado dice «escucha otra vez» cuando falta un signo.** Un niño que escribe bien la frase sin el punto recibe un consejo sobre sonidos que no le corresponde, y puede cambiar letras que estaban bien.
  *Evidencia:* `src/engine/lengua/spelling.ts:184-211` (`checkDictation` no tiene rama de signos); `:190-200` (`checkPunctuation` sí la tiene); `:139-145` (frases sin signos dictados); `:274-276` (el nivel 1 no menciona los signos).
  *Propuesta:* añadir a `checkDictation` la misma rama que en `checkPunctuation`: «Las letras están bien. Revisa los signos: ¿falta alguno o sobra?». En el nivel 1 de frases, decir que los signos no se oyen. Esfuerzo pequeño.

- **Las pistas de Inglés traducen la respuesta.** En `where-is` (in, on, under) y en `weather` (cold, hot, sunny, rainy, cloudy, snowy), la pista en español es la traducción de la frase que contiene la respuesta. El niño puede acertar emparejando traducciones, sin conocer el término en inglés.
  *Evidencia:* `src/engine/ingles/phrases.ts:91-130` (pistas `es`); `src/activities/views/ingles/CompleteView.tsx:39` (muestra `ex.es` desde el primer intento); el comentario de `phrases.ts:1-6` dice que la pista nunca contiene la respuesta.
  *Propuesta:* dar la pista como pregunta sobre la posición o el tiempo, sin la expresión que equivale a la respuesta: «¿Está dentro, encima o debajo?», «¿Qué tiempo hace? Mira el cielo». Mantener la traducción solo donde un distractor de la misma clase encaja de verdad. Revisar las seis pistas de `weather`. Esfuerzo pequeño.

- **Las pistas de mp/mb y c/qu no enseñan la regla que decide la respuesta.** En mp/mb, la pista de nivel 1 pide escuchar la letra que va antes de la p o la b, que es la que no se oye. La regla está en la clase, pero no en la pista. En c/qu, la pista de vocal existe, pero no nombra la combinación «qu» delante de e o i.
  *Evidencia:* `src/engine/lengua/spelling.ts:228-244` (`GAP_TEXT`) y `:256-263` (`hint`); `src/content/classes/lengua3.ts:290` («Delante de p y de b, siempre m») y `:298-304`.
  *Propuesta:* en el nivel 3 de mp/mb, escribir la regla como pregunta que no dé la letra: «Delante de p o de b, ¿qué letra se escribe siempre?». En el nivel 1, quitar «escucha la letra». En c/qu, añadir al nivel 3: «Delante de e o de i, ¿qué combinación usamos?». Esfuerzo pequeño.

- **Caligrafía enseña las mayúsculas al final, pero las frases las necesitan antes.** Las frases empiezan con M y L, y el temario de Lengua enseña las mayúsculas en la etapa 1. Las dos asignaturas no siguen el mismo orden.
  *Evidencia:* `src/content/caligrafia/curriculum.ts:28-44` (FRASES antes de MAYUSCULAS); `src/engine/caligrafia/plan.ts` (`newOrder` no exige mayúsculas para abrir frases); `src/content/syllabus/lengua3.ts:149` (`lng-mayusculas` en la etapa 1).
  *Propuesta:* mover el bloque de mayúsculas antes de las frases, o al menos M, L, E, H y C. Alinear con el temario de Lengua. Confirmar con la maestra si las mayúsculas se enseñan de imprenta o ligadas. Esfuerzo medio.

- **El puntuador de caligrafía puede dar por mala una letra bien escrita.** Un fallo leve de tamaño, línea o inicio da dos estrellas, y dos estrellas cuentan como fallo para el dominio. En palabras y frases solo hay un intento. El consejo de corrección aparece aunque la forma esté bien.
  *Evidencia:* `src/ink/cursive/thresholds.ts:17-21`; `src/ink/cursive/score.ts:205-276` (la anchura es parte de la forma, así que su fallo solo da una estrella); `src/world/caligrafia/CaligrafiaScreen.tsx:47` (`correct = stars === 3`); `src/ink/cursive/TraceCursive.tsx:61` y `:283` (dos intentos en letras y enlaces, se guarda el mejor); `src/world/caligrafia/CaligrafiaScreen.test.tsx:118-125`.
  *Propuesta:* antes de tocar límites, medir la tasa de falsos negativos con trazos reales de niños (con permiso). La pantalla de ensayo para adultos (`/adult/caligrafia-ensayo`) ya muestra los valores frente a sus límites y puede servir para recogerlos. Valorar que dos estrellas cuenten como acierto en letras y enlaces. Quitar la anchura de la forma en letras sueltas. Dar el consejo con el criterio más cercano al límite. Esfuerzo medio.

- **Pocos ejemplos por regla: el juego se repite pronto.** Hay 43 palabras de ortografía en cinco bancos de 8 a 10, 33 palabras de dictado, 14 frases de dictado, 24 frases de signos, seis frases por tema de Inglés y solo tres frases y ocho palabras en Caligrafía. Un niño puede acertar por memoria de la palabra y no por la regla.
  *Evidencia:* `src/engine/lengua/spelling.ts:18-100`, `:102-112`, `:132-145`; `src/engine/lengua/vocabulary.ts` (20 conjuntos de orden); `src/content/caligrafia/curriculum.ts:28-36`; `src/engine/ingles/phrases.ts:91-130`.
  *Propuesta:* ampliar los bancos con palabras nuevas de la misma regla, y generar frases de dictado con plantillas (sujeto y verbo cambiados). En Inglés, al menos diez frases por tema. Medir antes cuántas repeticiones ve un niño por palabra con datos reales. Esfuerzo grande.

- **Los documentos de Caligrafía dan límites que el código no usa, y el adulto puede ajustar a ciegas.** El plan docente habla de anchura dentro del 15 % y de un tamaño de 0,92 a 1,08. El código usa 0,04 en alturas de x solo para letras sueltas y 0,93 a 1,07 para el tamaño. La instrucción de subir de 0,04 a 0,045 es ambigua, porque 0,04 aparece en tres criterios distintos.
  *Evidencia:* `docs/curriculum/PLAN_DOCENTE.md:267`, `:269`, `:280`; `src/ink/cursive/thresholds.ts:15`, `:17`, `:21`.
  *Propuesta:* corregir el plan docente con los valores reales, y nombrar cada límite por su clave en `thresholds.ts`. Esfuerzo pequeño.

- **Inglés repite palabras entre temas, y «día» no tiene dibujo.** «Orange» aparece en colores y en comida con dos dibujos distintos, y «star» en colores y en tiempo. El tema de días y meses no tiene emoji ni dibujo de apoyo, y no tiene juego de memoria.
  *Evidencia:* `src/engine/ingles/words.ts:38`, `:46`, `:84`, `:143`, `:3`, `:14`; `src/engine/skills.ts:594-598` (memoria solo si hay seis dibujos); `src/activities/views/ingles/shared.tsx:21` (el gloss en español se muestra cuando no hay emoji).
  *Propuesta:* dejar cada palabra en un solo tema, o marcar la de comida como `orange` de fruta. Para días y meses, un icono de calendario en las tarjetas de la semana. Esfuerzo pequeño.

- **Caligrafía usa mayúsculas de imprenta, no de letra ligada.** La decisión está escrita en el código, pero puede no coincidir con lo que enseña la maestra. La pantalla se llama «letra ligada».
  *Evidencia:* `src/ink/cursive/join.ts:11-12` («Print capitals … do not join the next letter»); `src/world/caligrafia/CaligrafiaScreen.tsx:1` y `:111`.
  *Propuesta:* preguntar a la maestra qué mayúsculas usa. Si son de imprenta, decirlo en la pantalla para que el adulto lo sepa. Si son ligadas, añadir su modelo al puntuador. Esfuerzo medio.

## 7. Uso por el niño (pantallas, escritura a mano, voz)

La escritura a mano es el punto fuerte de la experiencia: el niño ve lo que la app ha entendido, la duda se pregunta antes de calificar y el error se muestra con naranja y una sacudida suave, no con rojo. Los botones principales miden al menos 56 px y la tipografía es Andika, pensada para la lectura. Los problemas son:

- **Cifras confundibles y el borrado al tocar.** Ver la sección 3, puntos 3.2 y 3.8. Son los dos fallos de escritura que más confunden al niño.

- **La preferencia «Mano para escribir» no tiene efecto.** La familia puede activar «zurdo», pero ningún componente lee esa preferencia.
  *Evidencia:* `src/adult/child/ChildSettingsCard.tsx:58-67` (la guarda); `src/world/host/GameHost.tsx:84`; `src/ink/InkProvider.tsx:120` y `:134`; `src/ink/context.ts:236` y `:259`. Ningún componente la usa.
  *Propuesta:* ocultar la opción hasta que tenga efecto, para no prometer algo que no existe. Si se implementa, que cambie algo verificable: el lado de la X de borrar y del teclado, y el rechazo de palma. Añadir una prueba con eventos de puntero de zurdo. Esfuerzo medio.

- **Dos iconos ✕ iguales: salir de la actividad y borrar una cifra.** La X de borrar la cifra es una ✕ de 18 px sin texto, solo con etiqueta. La X de salir va acompañada del texto «Salir». En algunas pantallas, la X sale directamente sin confirmar.
  *Evidencia:* `src/ui/index.tsx:57-65` (salir con texto visible); `src/ink/DigitCell.tsx:403` y `:437-446` (borrar, solo con la casilla enfocada); `src/world/session/DailySession.tsx:207` (pausa); `src/world/clase/ClassScreen.tsx:103`, `src/world/review/DailyReview.tsx:52`, `src/world/story/StoryPlayer.tsx:168`, `src/world/placement/PlacementScreen.tsx:121` (salen directamente).
  *Propuesta:* cambiar el icono de borrar la cifra por una goma o papelera con el texto «Borrar» visible, sobre todo en tableta. Mantener la ✕ solo para salir. En las pantallas que salen directamente, valorar una confirmación o una pausa como en `DailySession`. Esfuerzo pequeño.

- **El resultado solo se distingue por verde o naranja, y el error no dice qué se leyó con texto.** Un niño con daltonismo rojo-verde, que es algo más del 8 % de los niños varones, distingue mal el verde del naranja. El único cambio de forma en el error es la sacudida. El texto genérico («Revisa tu respuesta») es solo el respaldo; hay frases específicas por tipo de error.
  *Evidencia:* `src/ink/DigitCell.module.css:175-177` y `:154`; `src/activities/groups/AnswerBar.tsx:26`; `src/content/phrases.ts:105-110`; `src/world/review/ExerciseStep.tsx:152-154`.
  *Propuesta:* añadir un icono distinto (✓ o ↺) o un patrón de borde a cada estado. Para errores de lectura de cifras, decir «Has escrito 4; la respuesta es 9». Valorar el azul o el morado en lugar del naranja y revisar el contraste con un simulador de daltonismo. Esfuerzo pequeño.

- **Sonido y voz activados por defecto, con avisos que no ofrecen cómo apagarlos ni cómo oír el enunciado.** Sonido, música y voz están en `true` por defecto para cualquier niño. Varias pantallas del niño dicen «Activa el sonido» sin ningún control en la zona del niño. El control real está en la zona de adultos. El niño que lee despacio no puede pedir que le lean el enunciado si no localiza el botón.
  *Evidencia:* `src/types/child.ts:76-78`; `src/audio/speech.ts:47`, `src/audio/sfx.ts:238`, `src/audio/music.ts:380` (empiezan encendidos); `src/adult/settings/SettingsScreen.tsx:297`; `src/world/session/DailySession.tsx:396`; `src/world/lengua/ReadingScreen.tsx:88`; `src/activities/views/DictationView.tsx:57`; `src/activities/views/ingles/shared.tsx:12`; `src/activities/views/WordProblemView.tsx:88` y `BarProblemView.tsx:206` (sí tienen «Escuchar»).
  *Propuesta:* un botón de sonido visible en la barra superior del niño, con altavoz tachado, y que el aviso «Activa el sonido» lleve a él. Mantener el sonido por defecto para quien no lee aún, pero no imponer silencio. Valorar un icono de altavoz junto al enunciado de cada ejercicio, y bajar la música mientras habla la voz. Esfuerzo medio.

- **El onboarding tiene ocho preguntas antes del primer ejercicio.** Género de la mascota o color no enseñan nada y retrasan el primer ejercicio a un niño de 7 años.
  *Evidencia:* `src/world/onboarding/OnboardingScreen.tsx:25-31` (ocho preguntas: nombre, género, curso, especie, colorway, nombre y género del compañero, revisión); `:155-162` (la calibración se salta con «Ahora no»).
  *Propuesta:* pedir nombre y curso, y dejar la mascota y el color para después de la primera sesión, como premio. Mantener la calibración de escritura justo antes del primer ejercicio que escriba. Esfuerzo medio.

## 8. Cómo está construida y cómo evitar que se repitan los fallos

**Cómo está construida.** La app es una PWA sin conexión (Vite, React 19, TypeScript). En el dispositivo, el progreso se guarda en IndexedDB con Dexie. Supabase es la copia en la nube, solo para familias y colegios con cuenta de adulto. El motor (`src/engine`) es puro: `generate()` crea ejercicios con un generador sembrado, y `check()` corrige sin tocar la interfaz. Las vistas (`src/activities`, `src/world`) convierten lo que el niño escribe o toca en un objeto de respuesta y se lo pasan al corrector. El progreso se escribe primero en el dispositivo y en una cola de salida transaccional; la sincronización sube esa cola con reintentos y baja los cambios de los últimos 90 días. Las actualizaciones usan una estrategia de actualización automática que no recarga durante un ejercicio. Los secretos de la voz viven en funciones de servidor con comprobación de origen. El PIN de adulto usa PBKDF2 con 600 000 iteraciones. Hay unas 3.800 pruebas que pasan y `tsc -b` no da errores. No hay CI, así que nada ejecuta las pruebas antes de publicar.

**Fallos que se repiten y por qué.** Casi todos los fallos de la sección 3 vienen de dos causas: (a) cada tipo de ejercicio tiene su propio corrector o su propia vista, y la regla buena de un tipo (por ejemplo, la llevada final de la suma) no se copia a los demás; y (b) el texto de las pistas y los mensajes se escribe sin una prueba que compruebe que no revela la respuesta ni queda roto. Lo mismo pasa con los criterios: «dominado» tiene dos definiciones, y el número de paradas de la resta está fijo en dos sitios.

- **La prueba de «la respuesta correcta se acepta» cubre solo 24 de los 75 tipos de ejercicio.** La lista de pruebas de propiedad no es exhaustiva, y el generador repite algunos tipos en su lista. El registro de vistas sí es exhaustivo en tiempo de compilación, lo que está bien. Hay pruebas e2e para algunos tipos, pero no para la resta en columna.
  *Evidencia:* `src/engine/__tests__/check.test.ts:14-22` (24 tipos); `src/types/exercise.ts` (75 tipos); `src/engine/__tests__/helpers.ts:59-69`; `src/activities/registry.ts:35` (`Record<ExerciseKind, LazyView>`); `tests/e2e/journeys/m-column-operations.spec.ts` (galería fija); `src/engine/generate.ts:43-50` (`ALL_KINDS` repite place-value, compare, order, round, number-line, mental y equation).
  *Propuesta:* tipar la lista de pruebas como `Record<ExerciseKind, true>` para que falte un tipo y no compile. Para column-sub y column-add, una prueba que genere ejercicios con varias semillas, los responda por la interfaz y espere el acierto. Ampliar por fases a división, fact-div, fracciones y decimales. Esfuerzo medio.

- **La escritura a mano no tiene pruebas con letra real ni con los casos de duda.** Los tests de cifras usan las plantillas del propio modelo, así que prueban consistencia con el modelo y no precisión con la letra de un niño. No hay pruebas de tocar una cifra reconocida, de zurdos, de escritura con el dedo, ni del flujo «¿Has escrito…?».
  *Evidencia:* `tests/e2e/ink.spec.ts:66` y `:105-120` (plantillas de `DIGIT_MODELS`), `:82-151` (seis tests), `:106` (test saltado sin modelo); `src/ink/doubt.dom.test.tsx` (unitario).
  *Propuesta:* añadir tres recorridos e2e: un 7 de confianza baja que pida confirmación, tocar una cifra reconocida sin borrarla, y escritura con el dedo en un dispositivo táctil. Hacer que el test de cifras falle en CI cuando falta el modelo. Recoger una muestra anonimizada de letra de niños para medir la matriz de confusión. Esfuerzo medio.

- **No hay registro de los falsos negativos para revisarlos a escala.** No hay ningún envío de errores ni analítica (la arquitectura lo prohíbe). Los fallos de sincronización solo llegan a la consola. Por eso un rechazo injusto como el de la multiplicación depende de que alguien lo encuentre a mano.
  *Evidencia:* `src/data/sync.ts:149`, `:239`, `:526` (`console.warn`); `src/main.tsx` (solo `vite:preloadError`); `docs/ARCHITECTURE.md:77-78` (sin SDK de analítica).
  *Propuesta:* un script de revisión en lote sobre los intentos con `correct = false`, `errorType` y `given`/`expected`, ejecutado a demanda fuera de la app. Un botón «Creo que mi respuesta era correcta» que guarde solo el tipo, la habilidad, lo escrito, lo esperado y la versión de la app, sin identificador del niño ni de la familia, con consentimiento del adulto. Esfuerzo medio.

- **El despliegue no ejecuta ninguna prueba.** Ni los tests, ni el e2e ni las pruebas SQL bloquean una publicación. El comando de build es `tsc -b && vite build`, sin vitest. El e2e depende de un servidor levantado aparte.
  *Evidencia:* `vercel.json:4` (`buildCommand`); `package.json:8` (`build`); ausencia de `.github`; `playwright.config.ts:74` (`webServer: external`); `tests/e2e/journeys` (22 ficheros); `supabase/tests/run.sh`.
  *Propuesta:* un workflow de GitHub Actions en cada PR con `npm ci`, `npx tsc -b` y `npx vitest run` (unos 45 s). Después, un job de Playwright con un journey de la resta y `supabase/tests/run.sh` en un Postgres desechable. Hacerlo obligatorio en la rama principal, y no en el `buildCommand` de Vercel, para no bloquear una publicación urgente por una prueba lenta. Esfuerzo pequeño.

- **La sincronización de cajas puede perder cambios.** Si la fila local existe y la remota es más reciente, la remota sustituye a la local y se borra la entrada pendiente de la cola. Como la fila de caja se guarda entera, si dos dispositivos practican la misma destreza sin conexión, se pierde una de las dos actualizaciones. La marca de tiempo de la cabecera es «último que escribe gana». Las sesiones y los intentos sí se fusionan, así que el problema es solo de las cajas.
  *Evidencia:* `src/data/sync.ts:334-340` (`applyMasteryRows`); `src/data/progress.ts:68-80` (`saveMastery` con la marca del dispositivo); `src/world/host/GameHost.tsx:186-189`; `src/data/sync.ts:1-8`; `supabase/migrations/0001_init.sql:79-96` (`tg_sync_lww` fija la marca a `least(cliente, now() + 10 min)` y descarta en silencio escrituras anteriores); `src/data/mappers.ts:108-111` (fila completa en `skill_mastery`).
  *Propuesta:* recalcular la caja a partir de los intentos al fusionar (ya son de solo añadir). O usar la misma comparación con versión que ya usa el progreso, o fusionar caja a caja con el máximo de repasos. No borrar la entrada pendiente mientras haya una fila remota más nueva. Mostrar un aviso cuando el servidor descarte una escritura. Esfuerzo grande.

- **Las actualizaciones pueden recargar la app en mitad de un ejercicio libre o de una canción.** La lista de rutas ocupadas no incluye «Jugar libre» ni la canción. El daño es limitado porque cada intento guardado sobrevive, pero el niño ve un fallo sin motivo.
  *Evidencia:* `src/app/version.ts:79` (`BUSY_ROUTE`); `src/app/UpdateWatcher.tsx:19-23`; `src/app/routes.tsx:82-83`; `src/world/free/FreePlayScreen.tsx:35`; `src/app/version.test.ts:4-9`.
  *Propuesta:* añadir `/play/free` y `/play/cancion` a `BUSY_ROUTE` y a sus pruebas. Mejor aún, que los ejercicios activen un contexto global de «ocupado». Esfuerzo pequeño.

- **El progreso de los niños sin cuenta puede desaparecer, y no hay forma de restaurar una copia.** Los datos viven en IndexedDB y no se pide almacenamiento persistente. Hay exportación en JSON, pero no importación.
  *Evidencia:* ausencia de `navigator.storage` en `src`; `src/adult/child/ChildReportScreen.tsx:109-113` y `:300` (botón de descarga); `src/data/dashboards.ts:181` (`exportChildData`); ausencia de importación en `src/adult`, `src/data` y `src/world`. El riesgo en Safari depende de cómo se instale la app; no lo he verificado en un dispositivo.
  *Propuesta:* llamar a `navigator.storage.persist()` al arrancar, dentro de try/catch, y avisar a la familia si no se concede. Recordar a la familia descargar la copia tras unas cuantas sesiones. Añadir importación del JSON exportado en la zona de adultos, con validación y fusión por identificador. Esfuerzo pequeño.

- **La pantalla de carga puede no tener salida si el progreso no se crea.** Si la fila de progreso no existe y no se puede crear, el niño ve una rueda girando sin nada que pulsar. Un fallo de lectura sí muestra un mensaje con botón, porque lo gestiona el error boundary.
  *Evidencia:* `src/data/progress.ts:51-57` (la llamada `void getProgress` no tiene catch); `src/world/home/ChildHomeScreen.tsx:76-79`; `src/app/App.tsx:39-41` y `src/app/ChunkErrorBoundary.tsx:44-55` (gestionan los errores de lectura).
  *Propuesta:* capturar el error de `getProgress` y, tras unos segundos sin datos, mostrar «Algo no ha cargado» con «Probar otra vez» y un enlace a la zona de adultos. Esfuerzo pequeño.

- **El código de error «recognition» no lo asigna el motor.** La protección real está en la capa de tinta, que retiene la graduación mientras haya dígitos dudosos. La prueba que lo demuestre no existe.
  *Evidencia:* `src/types/exercise.ts:918`; `src/engine/mastery.ts:48` (lo ignora); `src/engine/check.ts` (no lo produce); `src/ink/context.ts` (`requestConfirm`, `~125-133`); `src/activities/facts/shared/flow.ts` (`submit`: `held()`).
  *Propuesta:* dejar claro en el código que `recognition` no se usa, o asignarlo cuando la respuesta se gradúa tras una corrección de dígito con confianza baja. Añadir una prueba en `check.ts`. Esfuerzo pequeño.

- **Documentación desfasada.** `supabase/README.md` solo cita las migraciones 0001 a 0003. Faltan la 0004 y la 0005. La arquitectura dice que no hay peticiones a terceros salvo Supabase, lo que es cierto para el navegador, pero la voz llega a Azure desde funciones propias del servidor, y eso no se aclara.
  *Evidencia:* `supabase/README.md:3-5`; `supabase/migrations/` (0004 y 0005 existen); `docs/ARCHITECTURE.md:77-78`; `vercel.json:49` (CSP solo Supabase, enviada como Report-Only); `api/tts.ts`; `api/pronunciation.ts:4` (no guarda el audio).
  *Propuesta:* actualizar el README con las cinco migraciones. En ARCHITECTURE.md, decir que la voz pasa por funciones propias del servidor hacia Azure y que el audio no se guarda. Valorar pasar la CSP de Report-Only a modo bloqueante. Esfuerzo pequeño.

- **El sondeo del desplazamiento cada 500 ms consume CPU en tabletas modestas.** Es un coste pequeño y constante, probablemente no notable en un equipo normal.
  *Evidencia:* `src/app/ScrollAssist.tsx:37` (`setInterval` de 500 ms); `:27-28` (medida y `setState` condicional).
  *Propuesta:* sustituir el intervalo por un `ResizeObserver` sobre el contenido y un `MutationObserver` sobre los cambios de feedback, manteniendo las escuchas de scroll y resize. Esfuerzo pequeño.

**Cómo evitar que estos fallos se repitan (por orden de importancia):**
1. Una prueba de regresión por cada tipo de ejercicio que responda por la interfaz, no solo por el corrector, y que falle si un tipo no tiene prueba.
2. Un test de texto que compruebe que ninguna pista, ninguna copia y ningún mensaje de error contiene la respuesta, y que todas las frases trabajadas se resuelven bien.
3. Un único criterio de «dominado» y un único lugar donde se definen los umbrales (caja, estrellas, paradas de la resta, límites de caligrafía), con un test que compare la documentación con el código.
4. Un workflow de comprobación obligatorio antes de publicar, y un registro de falsos negativos revisado cada semana.
5. Una regla de diseño: cada corrector nuevo o cada cambio de corrector debe mirar la regla equivalente de los demás tipos (por ejemplo, la llevada final en suma y multiplicación).

## 9. Plan propuesto por orden

Ordenado por beneficio para el aprendizaje dividido por esfuerzo. Los puntos menores (mano zurda, control de sonido, premio final, tienda, juegos de mitades y recta numérica, Borrón) quedan fuera de la tabla, pero están descritos en las secciones 4 y 7.

### Ahora (esta semana)

| N.º | Qué hacer | Por qué ayuda al niño | Esfuerzo |
|---|---|---|---|
| 1 | Aceptar la llevada final escrita en la fila de llevadas en la multiplicación en columna (`src/engine/check.ts:361-377`) | Un procedimiento correcto deja de marcarse como error | Pequeño |
| 2 | Tratar el resto vacío como 0 en la división por partes y de subir (`src/engine/check.ts:449-450`, `470`; `src/activities/views/DivisionMethods.tsx:47`, `105`) | El mismo ejercicio se trata igual en todos los métodos | Pequeño |
| 3 | Mostrar la pista también después de comprobar (`src/activities/groups/AnswerBar.tsx:22-29`) | La ayuda aparece cuando el niño la pide | Pequeño |
| 4 | Arreglar el texto de la copia de ×1 y ×10 (`src/activities/views/FactView.tsx:106`; `src/engine/strategies.ts:33`, `44`, `93`) | Copiar la respuesta se entiende y ayuda a memorizarla | Pequeño |
| 5 | Reescribir los trucos de 7×7, 7×8 y 6 par, y el mensaje de vecino, para que no den el resultado (`src/engine/strategies.ts:61`, `70`, `156`; `src/engine/feedback.ts:62`, `66`) | El niño recupera el hecho de memoria en lugar de copiarlo | Pequeño |
| 6 | Reintentar en la rueda y en el tablero, y ajustar el texto (`src/activities/wheel/index.tsx:54`, `58`; `src/activities/board/index.tsx:129`, `169-170`) | El hecho fallado vuelve a preguntarse | Pequeño |
| 7 | Mostrar en la recompensa el resultado del intento y la mejor marca por separado (`src/world/node/NodeScreen.tsx:89`, `164`) | La celebración corresponde a lo que el niño hizo | Pequeño |
| 8 | Que tocar una cifra reconocida no la borre (`src/ink/capture.ts:278`; `src/ink/DigitCell.tsx:292-293`) | Un toque no pierde lo escrito | Pequeño |
| 9 | Quitar el cronómetro en los hechos nuevos (`src/types/child.ts:80`; `src/activities/bubbles/index.tsx:83-88`) | El niño aprende sin ansiedad en los primeros intentos | Pequeño |
| 10 | Corregir los textos de adultos: «dominado», «no ha practicado» y «error más frecuente» (`src/content/syllabus/index.ts:46-47`; `src/adult/school/ClassScreen.tsx:78`; `src/data/summary.ts:75-78`) | Los adultos ayudan donde hace falta | Pequeño |
| 11 | Pistas de Inglés que no traduzcan la respuesta (`src/engine/ingles/phrases.ts:91-130`) | El niño piensa el término en inglés, no lo empareja | Pequeño |
| 12 | Aviso de signos en el dictado (`src/engine/lengua/spelling.ts:184-211`) | Un niño no cambia letras que estaban bien | Pequeño |
| 13 | Comprobación automática antes de publicar: `tsc -b` y `vitest` (`vercel.json:4`; `package.json:8`) | Una regresión no llega a las tabletas sin que nada la detecte | Pequeño |

### Después (este mes)

| N.º | Qué hacer | Por qué ayuda al niño | Esfuerzo |
|---|---|---|---|
| 14 | Mensaje de «me llevo una» propio, según el método (`src/engine/check.ts:327-358`) | El niño recibe una sola receta para su error | Medio |
| 15 | Mostrar la respuesta tras dos fallos en las lecciones (`src/activities/lesson/TrySlot.tsx:172-173`, `188`) | El niño ve la respuesta y la copia antes de seguir | Medio |
| 16 | Subir de caja solo con un acierto vencido, y exigir dominio en dos días distintos (`src/engine/mastery.ts:46-80`; `src/content/syllabus/index.ts:48`) | El dominio refleja lo que el niño recuerda, no un día de suerte | Medio |
| 17 | No mostrar pistas ni truco en los pasos «sola» (`src/content/classes/dsl.ts:28`; `src/activities/facts/shared/flow.ts:49`) | El niño practica de memoria sin tener el truco delante | Pequeño |
| 18 | Adaptar las actividades de operaciones al historial del niño (`src/activities/facts/shared/items.ts:21`; `src/engine/generate.ts:837-839`) | El niño practica lo que le cuesta, no lo que ya sabe | Pequeño |
| 19 | Cifras confundibles: margen entre candidatos y pruebas con letra real (`src/ink/DigitCell.tsx:187-194`; `src/ink/ml/recognizer.ts:174-180`) | Un 7 bien escrito no cuenta como error | Medio |
| 20 | Resta por saltos con cualquier cadena creciente de paradas (`src/engine/check.ts:310-326`) | Hay más de un camino correcto, y el niño puede usar el suyo | Medio |
| 21 | Media de la clase sustituida por conteos por hecho (`src/adult/shared/heatmap.ts:38-53`) | La maestra ve quién necesita ayuda con cada hecho | Medio |

### Más adelante

| N.º | Qué hacer | Por qué ayuda al niño | Esfuerzo |
|---|---|---|---|
| 22 | Crear clases y temporada de 2.º y de 4.º (`src/content/classes/index.ts:39-40`; `src/content/season.ts:48-49`) | Cada niño tiene explicación antes del ejercicio y aventura propia | Grande |
| 23 | Unir mapa y temario: un solo recorrido (`src/content/progression.ts:43-74`; `src/engine/daily.ts:331`) | El niño no recibe dos destinos distintos a la vez | Medio |
| 24 | Sincronizar las cajas a partir de los intentos (`src/data/sync.ts:334-340`) | Las cajas no pierden cambios entre tabletas y móviles | Grande |
| 25 | Misiones del colegio con seguimiento y visibles para el niño (`src/adult/school/ClassScreen.tsx:220-261`; `src/data/schools.ts:197-240`) | El niño sabe qué le piden y la maestra ve quién lo ha hecho | Grande |

## 10. Lo que no se ha podido comprobar (limitaciones del análisis)

- **No se ha probado con niños reales ni en una tableta.** Todo lo que se dice sobre la experiencia del niño (tiempos de respuesta, ansiedad, atención, escritura a mano con lápiz real) es una deducción a partir del código y de los documentos de diseño, no una observación.
- **Los hallazgos son de lectura del código.** Se han comprobado con pruebas temporales que se borraron después, sin dejar cambios en el repositorio. No se ha ejecutado la app en un navegador para ver las pantallas tal como las ve el niño.
- **Cifras y estimaciones.** Los tiempos y el número de respuestas por minuto son estimaciones a partir de constantes del código. Algunos porcentajes del análisis de ejercicios (por ejemplo, el 59 % de cocientes iguales a la tabla) no se han reproducido; el mecanismo sí está confirmado.
- **Matices de la verificación.** Varios hallazgos se han corregido tras comprobarlos: por ejemplo, el de la familia de operaciones ya no dice que la operación sea falsa; el de la pista de problemas de palabra no tiene un fallo de dos pasos sin enunciado, sino una auditoría desactualizada; y el de los guardianes de 3.º cuenta 8 ítems y no 7. Se han usado las versiones corregidas.
- **Áreas sin verificar en profundidad.** El análisis no ha revisado a fondo el borrado de datos (`src/data/erasure.ts`), el PIN y la zona de adultos con su control de acceso (`src/data/pin.ts`, `src/adult/gate`), los textos legales (`src/adult/legal`), la personalización de la letra (`src/ink/ml/personalize.ts`), los centros y los paneles de colegio (`src/data/schools.ts`, `src/data/dashboards.ts`), el protocolo de medición de DIDACTICA §6.3 (prueba inicial, prueba final y retención a dos o cuatro semanas), ni los errores E1 a E13 de `docs/curriculum/AUDITORIA_CONTENIDO.md` uno a uno. Varios de esos errores figuran como de gravedad alta en la auditoría, así que conviene verificarlos antes de dar por cerrada la lista de fallos de contenido. Por eso, en este informe no se puede afirmar que no quede ningún fallo en esas áreas.
- **Sin prueba de carga ni de dispositivos.** No se ha medido el consumo de CPU ni de batería, ni el comportamiento en tabletas baratas o en conexiones intermitentes.
- **Retención real.** El análisis no puede saber si los niños retienen lo que practican. Esa es la pregunta que de verdad importa, y solo se responde con la medición de DIDACTICA §6.3 en el aula.