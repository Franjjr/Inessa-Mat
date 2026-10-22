# Didáctica de las matemáticas de 6 a 12 años: qué funciona y plan para Repasitos

Documento de trabajo, octubre de 2026. Sintetiza tres notas de investigación (didáctica con evidencia, trucos y sesiones, apps de matemáticas) y lo cruza con `docs/PEDAGOGY.md` y `docs/STORY.md`.

Cómo leer el documento:

- Cada afirmación de investigación lleva un número entre corchetes que remite a la lista de fuentes del final. Las URL son las que aparecen en las notas; no se han añadido otras.
- **Nivel de evidencia**: **alta** = metaanálisis o varios estudios independientes con efectos en el mismo sentido; **media** = un estudio controlado, un metaanálisis en otra población (adultos, secundaria, alumnos con dificultades) o resultados parciales; **inferencia** = decisión de diseño sin estudio directo con niños de 8 años o con la app.
- **[no verificado]** marca cifras o atribuciones que las notas no pudieron comprobar en el texto original. No deben citarse como hechos.

---

## Resumen

- Lo que tiene más respaldo para aprender matemáticas a esta edad: práctica distribuida en el tiempo, recuperación de hechos de memoria antes de ver la respuesta, mezcla de tipos de problema (intercalado), feedback que explica el error y la estrategia, y ejemplos resueltos seguidos de práctica. Las representaciones concretas y pictóricas sirven sobre todo cuando el alumno falla [1, 2, 6, 7, 5, 28].
- La dosis importa: en las apps estudiadas, más minutos de práctica se asocian a más aprendizaje, aunque la evidencia es correlacional [43]. Por eso el diseño debe asegurar que casi todo el tiempo sea práctica con respuesta del alumno.
- Los elementos de juego que no llevan matemáticas no muestran efecto de aprendizaje en los estudios revisados. El juego útil es el que está hecho con la propia matemática: el avance de la historia depende de los aciertos.
- Sobre el cronómetro no hay evidencia concluyente. La posición más coherente es no cronometrar los hechos nuevos y dejar un ritmo opcional para hechos ya dominados [12, 17, 18].
- Muchos parámetros de `PEDAGOGY.md` (80 % de éxito, mezcla 70/30, intervalos Leitner, umbral de 7 segundos con lápiz) no tienen fuente en las notas. Deben tratarse como hipótesis y medirse con datos de niños reales.
- Repasitos todavía no tiene evidencia propia. La prioridad es un protocolo de medida (pretest, postest, retención a 2–4 semanas y análisis de errores), no añadir más mecánicas.

---

## 1. Qué se aprende en 3.º y base de evidencia

### 1.1 Alcance de contenidos para 3.º

El contenido oficial de 3.º no se ha podido extraer de la norma. El Real Decreto 157/2022 fija enseñanzas mínimas por competencias y los saberes concretos los completan los decretos autonómicos [41]. Una programación de un centro de Madrid, que cita el Decreto 61/2022, sirve para ver una secuencia habitual, pero no es norma [42]. **Los contenidos de la tabla siguiente son el alcance que fija el responsable del proyecto. Deben contrastarse con el decreto de cada comunidad antes de publicarlos.**

| Bloque | Objetivo de Repasitos al final de 3.º | Comentario |
|---|---|---|
| Valor posicional | Leer, componer y descomponer números hasta 999; ver centenas, decenas y unidades como grupos de 10 | Es el prerrequisito de todo lo demás |
| Sumas | 2 y 3 cifras, sin llevada y con una o dos llevadas; comprobación por estimación | La llevada es un "paso de diez" a la columna de al lado |
| Restas | 2 y 3 cifras, sin pedir prestado y con pedir prestado; casos con cero en medio como bloque aparte | El cero intermedio es el error más típico |
| Tablas | ×2, ×3, ×4, ×5 y ×10 dominadas; ×6, ×7, ×8 y ×9 en progreso; propiedad conmutativa | Ver sección 3 |
| Multiplicación | Concepto de grupos e hileras; multiplicar por una cifra con descomposición | Multiplicar 2 cifras por 1 como introducción |
| División | Reparto equitativo y "cuántas veces cabe"; relación inversa con la multiplicación; división exacta por 2 a 5 | El resto y la forma de galera, solo como introducción |
| Problemas | Enunciados de cambio, comparación y combinación, con dibujo de barras | Mezclar tipos de enunciado |

Una decisión que conviene revisar: la temporada 1 de `PEDAGOGY.md` incluye sumas y restas de 4 cifras (mundos 2 y 4) y la división larga como "experta". Para 3.º, según el alcance anterior, eso sobra. Recomendación: mover las cifras de 4 a un reto opcional o a 4.º, en línea con la sección 2.3 [inferencia].

### 1.2 Evidencia por tema

**Representaciones concreto, pictórico y abstracto (CPA).** Carbonneau, Marley y Selig (2013) revisaron 55 estudios con 7.237 participantes. Los manipulativos superan a la instrucción solo simbólica con un efecto pequeño a moderado; en retención el efecto es moderado a grande; en resolución de problemas y transferencia es pequeño; el beneficio es mayor en fracciones que en aritmética, y en niños de 3 a 6 años es muy pequeño y a veces negativo [1]. Singapur obtuvo 625 puntos en matemáticas de 4.º en TIMSS 2019, por delante de Hong Kong (602) y Corea del Sur (600) [10, 11]. Ese resultado es correlacional y no demuestra que el CPA sea la causa. Un metaanálisis de 2025 sobre CRA usa una métrica de casos únicos que no es comparable con las d o g habituales [40]. No se ha podido confirmar el metaanálisis de Jitendra et al. (2018) que se buscaba.

Implicación: el CPA es el marco más defendible para Repasitos. Que una versión en pantalla equivalga a manipulativos físicos no está verificado [1, inferencia].

**Sentido numérico y estrategias de cálculo.** Klein, Beishuizen y Treffers (1998) compararon con 275 alumnos de 2.º neerlandés dos programas basados en la recta numérica vacía: uno realista, con estrategias flexibles desde el principio, y otro gradual, que empieza por el procedimiento [15]. Un estudio de diseño con alumnos indonesios de 2.º encontró que introducir el algoritmo antes de dominar los números puede producir "innumeracia": los alumnos ejecutan el procedimiento sin entenderlo [16]. Ambos estudios son pequeños. Apoyan el orden "valor posicional y estrategias, después algoritmo escrito" [15, 16, media].

**Fluidez sin ansiedad: cronómetro y tiempo.** Fuchs et al. (2013) encontraron que la práctica con presión de tiempo dio mayores ganancias en aritmética y cálculo de dos cifras que la práctica sin presión, con resultados similares en conocimiento numérico y problemas verbales [12]. El tamaño de efecto de 0,25 que circula procede de un agregador y no está verificado. En el lado contrario, Boaler, Williams y Confer (2015) afirman que los exámenes cronometrados producen ansiedad desde edades tempranas [17]. Ese paso causal no lo demuestra un experimento. El grupo Science of Math encontró solo dos estudios experimentales sobre la hipótesis y ninguno concluía que las pruebas generen ansiedad [18]. Ramirez et al. (2013) asocian la ansiedad matemática en primero con peor rendimiento, sobre todo en alumnos con más memoria de trabajo [19]; el comunicado habla de "casi medio curso" de diferencia, cifra [no verificado] en el artículo. No se ha encontrado ningún ensayo que compare cronómetro y práctica sin tiempo en niños de 8 años.

Lillard y Else-Quest (2006) siguieron una lotería de admisión en una sola escuela de Milwaukee: a los 5 años, los niños Montessori rindieron mejor en matemáticas [20]. Es un estudio de una escuela, con seguimiento limitado, y no justifica el método completo.

**Recuperación (testing).** Rowland (2014) reporta un efecto de recuperación frente a releer de g ≈ 0,50 [6]; la cifra no se ha podido verificar en el texto del artículo [no verificado]. Adesope et al. (2017) dan un g ≈ 0,61 según resúmenes secundarios [31, no verificado]. Recordar libremente produce más beneficio que reconocer. El matiz importante es de Rohrer (2019): en matemáticas, el beneficio de la recuperación no está demostrado para tareas distintas al aprendizaje de hechos [30]. Recuperar tablas de memoria tiene respaldo; recuperar procedimientos completos tiene menos.

**Práctica espaciada.** Cepeda et al. (2006) revisaron 839 evaluaciones y 317 experimentos [7]. La práctica espaciada supera a la masiva, y el intervalo óptimo entre sesiones crece con el intervalo de retención que se quiere conseguir. La cifra de "254 estudios" que circula no está verificada. Los tests de Cepeda son de memoria verbal, no de cálculo; la extrapolación a aritmética es inferencia [7].

**Práctica intercalada.** Brunmair y Richter (2019) analizaron 59 estudios y 238 tamaños de efecto: g = 0,42 para la práctica intercalada, con mayor efecto cuando el material es visual (g = 0,67) [2]. Una corrección posterior en Frontiers modifica el resultado matemático; su contenido exacto no se ha verificado [3]. Rohrer, Dedrick y Stershic (2015) compararon en 126 alumnos de 7.º intercalar frente a práctica en bloques: la intercalada fue superior en la prueba inmediata y a 30 días [29]. Es secundaria, no primaria. Un estudio sobre estrategias de resta en primaria con intercalado existe, pero solo se ha leído su título [38]. La práctica en bloques al introducir un procedimiento nuevo puede ser mejor al principio; el intercalado se activa después [29, 38, inferencia].

**Ejemplos resueltos.** Barbieri et al. (2023) reúnen 55 estudios, desde primaria hasta universidad, con un efecto medio de g = 0,48. Los ejemplos solo correctos superan a los mixtos (con errores), y añadir preguntas de autoexplicación empeora el resultado [28]. La fuente es un agregador que debe verificarse en la revista. Esto encaja con el diseño de `PEDAGOGY.md`: ejemplo resuelto solo tras fallos, nunca el ejemplo como primer contacto de un hecho ya conocido.

**Feedback.** Hattie y Timperley (2007) reúnen 196 estudios y 6.972 tamaños de efecto con una media de 0,79 [4]. Las críticas metodológicas son conocidas y la cifra debe citarse con cautela. Wisniewski, Zierer y Hattie (2020) reanalizan 435 estudios con d = 0,48, alta heterogeneidad y un peso decisivo del contenido informativo del feedback [5]. La EEF sitúa el feedback en +6 meses de impacto estimado, aunque otros materiales citan +8 [25]. Un ensayo de feedback digital en matemáticas de primaria, con 34 centros y 2.564 alumnos de 4.º y 5.º, no encontró efecto positivo [26]. Conclusión: el feedback que dice qué falló y qué estrategia usar es lo que cuenta; un feedback genérico de "correcto o incorrecto" tiene poco valor. La tecnología por sí sola no mejora el aprendizaje; la pedagogía sí [33].

**Instrucción explícita.** La guía del WWC de Gersten et al. (2009) recomienda instrucción explícita y sistemática y representaciones visuales. El panel advirtió de que la base de evidencia en matemáticas es mucho más débil que en lectura [8, 9]. Las ocho recomendaciones no se han leído en detalle. Un seminario del REL Central sitúa la instrucción explícita como recomendación 3 [39].

**Resolución de problemas con barras.** Un metaanálisis de intervenciones en problemas verbales para alumnos con dificultades (K–12) reporta g = 0,56 (IC 95 % [0,40; 0,72]), y la instrucción en esquemas superó a la estrategia sola [34]. Los autores no se han identificado y la cifra se marca [no verificado]. No hay un estudio grande del método de barras en población general. Las cifras muy altas de Zhang y Xin (2012) se consideran infladas por el diseño y no se usan.

**ABN, Montessori y regletas.** El ABN tiene evidencia escasa: un estudio exploratorio en Chile con cuatro escuelas y muestra pequeña [35]; una revisión cualitativa en *Bordón* de un inspector [36]; y un estudio de Extremadura con 245 alumnos (106 ABN y 139 con método tradicional) cuyos resultados aún no se han publicado [37]. Ningún estudio lo pondera frente a otros métodos de cálculo mental. Sí tiene sentido pedagógico: descomposición, redondeo y valor posicional. Regletas y manipulativos: ver CPA.

### 1.3 Errores típicos por operación

| Operación | Error típico | Ejemplo | Fuente |
|---|---|---|---|
| Suma | Olvidar la llevada o colocarla en la columna equivocada | 38 + 25 = 53 (correcto: 63) | Práctica docente; sin estudio cuantitativo [no verificado] |
| Resta | Restar siempre la cifra menor de la mayor, en cada columna | 82 − 47 = 45 (correcto: 35) | Alta incidencia descrita; sin cifra verificada [no verificado] |
| Resta | Pedir prestado mal cuando hay un cero | 504 − 278 mal resuelto (correcto: 226) | Clásico; frecuencia no cuantificada |
| Signo igual | Leer el "=" como "resultado" y no como equivalencia | En 5 + 3 = 8 + ___ escribir 16 o 8 | Powell y Fuchs (2010) [13]; estudio 2022 en 4.º–5.º [14] |
| Valor posicional | Tratar las decenas como unidades | 125 + 40 escrito como 125 + 4 = 129 | Práctica docente |
| Multiplicación | Interpretar 4 × 3 como 4 + 3 | 4 × 3 = 7 | Práctica docente |
| División | "Dividir es siempre dividir la grande entre la pequeña" | 3 ÷ 12 = 4 | Práctica docente |
| División | Confundir el orden de los factores de la división | 6 ÷ 2 = 2 ÷ 6 | Práctica docente |

Las notas buscaban los artículos de Rittle-Johnson sobre signo igual y valor posicional y no los encontraron [no verificado]. Por eso los errores de la tabla que no tienen cita son observaciones de práctica docente, no hallazgos cuantificados. Diseño: ítems de "error común" con dos respuestas posibles y una explicación corta [inferencia].

### 1.4 Dónde la evidencia respalda o contradice `PEDAGOGY.md`

| Principio de PEDAGOGY.md | Qué dice la evidencia | Veredicto |
|---|---|---|
| 1. Significado antes que memoria | Klein et al. (1998) y Sari y Zulkardi [15, 16] | Respaldado (media) |
| 2. Estrategias, pista con truco primero, luego visual, luego paso | Barbieri et al. (2023) [28]; CPA [1] | El orden es coherente; el orden exacto no está probado (inferencia) |
| 3. Regla del espejo (conmutativa) | Sin fuente en las notas | Inferencia |
| 4. 80 % de éxito; 70 % conocido y 30 % nuevo; máximo 3 hechos nuevos | Sin fuente en las notas | Hipótesis a medir |
| 5. Espaciado e intercalado | Cepeda [7]; Brunmair [2]; Rohrer [29] | Respaldado (alta para espaciado, media para intercalado) |
| 6. Errores como pistas; feedback con la estrategia | Hattie [4]; Wisniewski [5]; EEF [26] | Respaldado en su contenido informativo; el tamaño es incierto |
| 7. Reconocimiento no es matemática | Sin fuente en las notas | Inferencia sólida (no castiga al niño por la letra) |
| 8. Presión de tiempo opcional | Fuchs [12] frente a Boaler [17] y crítica [18] | Coherente con lo disponible; el valor por defecto no tiene prueba directa |
| 9. Decir el hecho entero | No cubierto por las notas | Sin evaluar |
| 10. Elogiar el esfuerzo y la estrategia, no la inteligencia | Sisk et al. (2018) [24]; Dweck [no verificado] | Parcialmente respaldado: elogiar la estrategia sí, la mentalidad como intervención, poco |
| Leitner: intervalos 1, 2, 4, 8, 16 días | Cepeda [7] dice que el intervalo óptimo crece con el plazo de retención | Compatible en forma; los números concretos no tienen fuente (inferencia) |
| Umbral de 7 s con lápiz | Sin fuente en las notas | Hipótesis; medir |
| Ejemplo resuelto tras dos fallos | Barbieri [28] | Respaldado en el uso del ejemplo; el "dos fallos" es inferencia |
| Columnas evaluadas por exactitud, no velocidad | Coherente con el debate de [17, 18] | Inferencia razonable |
| Dos métodos de resta válidos (pedir prestado o compensar) | Las notas no comparan métodos | Inferencia; coherente con la práctica escolar española |

Tensión que conviene resolver: las notas proponen que el alumno justifique su respuesta en algunos ejercicios [notas, sección 5.1], pero Barbieri et al. encuentran que las preguntas de autoexplicación empeoran el aprendizaje cuando acompañan a ejemplos resueltos [28]. La solución razonable es separar ambas cosas: justificar como tarea propia de práctica, y no como añadido obligatorio después de un ejemplo.

---

## 2. Plan de enseñanza

### 2.1 Secuencia a lo largo del curso

El calendario es una propuesta de diseño (inferencia) basada en la progresión habitual y en el alcance de la sección 1.1. Debe ajustarse al calendario escolar real y a la programación de cada centro.

**Primer trimestre (septiembre a diciembre)**

- Semanas 1 y 2: pretest de diagnóstico (ver sección 6.3). Valor posicional hasta 999: centenas, decenas y unidades, comparar y ordenar.
- Semanas 3 a 6: sumas sin llevada de 2 y 3 cifras; restas sin pedir prestado de 2 cifras. Multiplicación como grupos e hileras. Tablas de ×1, ×2, ×5 y ×10.
- Semanas 7 a 10: sumas con llevada (2 cifras, luego 3). Restas con pedir prestado (2 cifras, luego 3). Tablas de ×3 y ×4.
- Semanas 11 y 12: repaso intercalado de todo el trimestre. Post-test del bloque.

**Segundo trimestre (enero a marzo)**

- Semanas 1 a 4: sumas y restas de 3 cifras con llevadas seguidas y con ceros en medio. Problemas de barras de cambio y comparación.
- Semanas 5 a 8: tablas de ×6, ×7 y ×8, una por una y luego mezcladas con las anteriores. La tabla de ×9 se introduce al final del trimestre con la estrategia de diez menos uno [inferencia: ×9 tiene un patrón fácil de recuperar, pero muchos errores de memoria].
- Semanas 9 y 10: introducción de la división como reparto y como "cuántas veces cabe", con la familia de operaciones.
- Semanas 11 y 12: multiplicar 2 cifras por 1 solo con descomposición (20 × 4 + 3 × 4 = 92), si el decreto lo permite.

**Tercer trimestre (abril a junio)**

- Semanas 1 a 4: división exacta con divisor de 2 a 5, apoyada en las tablas. El resto como idea, sin forma de galera.
- Semanas 5 a 8: tablas de ×1 a ×10 mezcladas. Cálculo mental con estrategias. Problemas de dos pasos como opción.
- Semanas 9 y 10: repaso final. Post-test final.
- Semanas 11 y 12: prueba de retención (2 a 4 semanas después del último bloque, con ítems no vistos). Es el dato más importante del año para Repasitos.

### 2.2 Progresión por operación

Cada operación sigue la misma escalera de cuatro niveles. Un alumno sube de nivel por rendimiento, no por calendario.

| Nivel | Suma y resta | Multiplicación | División |
|---|---|---|---|
| 1. Concreto | Agrupar dibujos de decenas y unidades; pasar 10 unidades a una decena | Grupos iguales: 3 bolsas de 4 bolas | Repartir bolas en cestas |
| 2. Pictórico | Bloques dibujados; recta numérica vacía | Hileras y cuadrículas; barras | Barras de reparto; "cuántas veces cabe" |
| 3. Abstracto | Algoritmo con llevada o pedir prestado | Tabla y descomposición | Familia de operaciones |
| 4. Fluidez y transferencia | Hechos de dos cifras en contexto; comprobación por estimación | Hechos en problemas de tiendas y tiempo | Problemas de reparto con resto |

La app debe bajar un nivel cuando el alumno falle dos veces en el mismo tipo de ítem, y subir cuando acierte sin pista. Esto es el desvanecimiento del CPA [1, inferencia].

### 2.3 Lo que no entra en 3.º

- Sumas y restas de 4 cifras: reto opcional o 4.º.
- División larga en forma de galera: opcional y solo para alumnos que ya dominen el resto.
- Fracciones: el propio `STORY.md` ya las reserva para la temporada 2, "Las Islas de las Fracciones". Es coherente con la progresión.

---

## 3. Trucos por operación y nivel

Cada truco se presenta con el lenguaje que se le dice al alumno. Todas las comprobaciones aritméticas están hechas. Los trucos son puentes hacia la memoria: se usan mientras el hecho no sale directo, y se retiran cuando el alumno lo recupera sin pensar [inferencia, basada en [29, 31]].

### 3.1 Tablas de multiplicar

| Tabla | Cómo se lo decimos al niño | Ejemplo | Comprobación |
|---|---|---|---|
| ×1 | "Se queda igual." | 7 × 1 = 7 | Trivial |
| ×2 | "El doble." | 7 × 2 = 14 | 7 + 7 = 14 |
| ×3 | "El doble, y uno más." | 3 × 7 = 14 + 7 = 21 | 3 semanas tienen 21 días |
| ×4 | "Doble, y doble otra vez." | 4 × 7: 7 → 14 → 28 | 2 × (2 × 7) = 28 |
| ×5 | "La mitad de la tabla del 10." | 5 × 8 = 80 : 2 = 40 | 5 × 8 = 40 |
| ×10 | "Pon un 0 al final." | 10 × 7 = 70 | Trivial |
| ×6 | "Cinco veces, y uno más." | 6 × 7 = 35 + 7 = 42 | 6 × 7 = 42 |
| ×6 con pares | "Los pares riman": la cifra de las unidades es el número, y las decenas son la mitad | 6 × 4 = 24 (decenas: 4 : 2 = 2; unidades: 4) | 6 × 4 = 24; 6 × 8 = 48; 6 × 2 = 12 |
| ×7 | "Cinco veces, y dos veces." | 7 × 6 = 30 + 12 = 42 | 7 × 6 = 42 |
| ×7 | Memoria: "Siete por siete, cuarenta y nueve." | 7 × 7 = 49 | 7 × 7 = 49 |
| ×7 | Memoria: "Cinco, seis, siete, ocho: cincuenta y seis." | 7 × 8 = 56 | 7 × 8 = 56 |
| ×8 | "Doble tres veces." | 8 × 7: 7 → 14 → 28 → 56 | 8 × 7 = 56 |
| ×9 | "Diez menos uno." | 9 × 7 = 70 − 7 = 63 | 9 × 7 = 63 |
| ×9 | "Uno menos, y las dos cifras suman 9." | 9 × 7: 7 − 1 = 6 y 6 + 3 = 9, así 63 | 9 × 7 = 63 |
| ×9 con dedos (opcional) | Bajar el dedo del número; a la izquierda, las decenas; a la derecha, las unidades | 9 × 4: 3 decenas (4 − 1) y 6 unidades (10 − 4) = 36 | 9 × 4 = 36 |
| Cuadrados | "Un número menos por un número más, y uno más." | 8 × 8 = 7 × 9 + 1 = 64 | 8 × 8 = 64; 9 × 9 = 8 × 10 + 1 = 81 |
| Hechos de 6 a 9 con las dos manos (solo "experta") | Restar 5 a cada factor: la suma de esos restos da las decenas; el producto de lo que le falla a cada uno para 5 da las unidades | 7 × 8: restos 2 y 3; decenas 5; unidades 3 × 2 = 6; resultado 56 | 6 × 9 = 54 (decenas 5; unidades 4); 8 × 9 = 72 (decenas 7; unidades 2) |

Notas de diseño:

- El truco de los dedos para ×9 es matemáticamente correcto para n = 1 a 10, porque 9n = 10(n − 1) + (10 − n). Pero no hay ninguna evaluación empírica de su eficacia [no verificado; solo validez aritmética y fuente de divulgación, 2]. Enseñar primero 9n = 10n − n y dejar los dedos como opción.
- El método de "las dos manos" sirve para la lógica de la tabla, pero para la mayoría de los alumnos de 8 años es demasiado complejo. Se deja como reto opcional.
- Los hechos se enseñan en pares espejo: si el alumno sabe 6 × 7, ya sabe 7 × 6 [regla del espejo de `PEDAGOGY.md`, inferencia].

### 3.2 Suma y resta

**Sumar por partes.** "Separo las decenas y las unidades."
47 + 26: 40 + 20 = 60; 7 + 6 = 13; 60 + 13 = **73**. Comprobación: 47 + 26 = 73.

**Redondear y ajustar.** "Redondeo uno a un número redondo, y compenso en el otro."
47 + 26: 47 + 3 = 50, así que 26 − 3 = 23; 50 + 23 = **73**. Esta estrategia es la que se usa en cálculo mental, y el alumno debe elegir entre esta y la anterior. Registrar cuál usa el alumno, según las notas [15, inferencia].

**Llevada.** "Si pasan de 10, escribo la unidad y llevo una decena a la columna de al lado."
368 + 257: 8 + 7 = 15, escribo 5 y llevo 1; 6 + 5 + 1 = 12, escribo 2 y llevo 1; 3 + 2 + 1 = 6. Resultado: **625**. Comprobación: 625 − 257 = 368.

**Restar contando hacia arriba.** "Desde el número pequeño cuento hasta el grande."
504 − 278: de 278 a 300 hay 22; de 300 a 504 hay 204; 22 + 204 = **226**. Comprobación: 278 + 226 = 504.

**Pedir prestado.** "No puedo restar 2 menos 7, así que le pido a la vecina 10."
82 − 47: 12 − 7 = 5 (la vecina, que era 8, ahora es 7); 7 − 4 = 3. Resultado: **35**. Comprobación: 35 + 47 = 82.

**Pedir prestado con cero.** "Si la vecina es un cero, pido a la siguiente."
504 − 278: en la columna de las unidades, 4 < 8, así que 14 − 8 = 6. En las decenas, el 0 no tiene nada que dar: se pide a las centenas, que pasan de 5 a 4 y dan 10 a las decenas; con esas 10 decenas, una pasa a las unidades. Decenas: 9 − 7 = 2. Centenas: 4 − 2 = 2. Resultado: **226**. Comprobación: 226 + 278 = 504.

**Compensar la resta (método "llevando").** "Le sumo uno a la cifra de abajo de la columna siguiente."
52 − 27: como 2 < 7, escribo 12 − 7 = 5. A las decenas de abajo les sumo 1 (2 → 3): 5 − 3 = 2. Resultado: **25**. Comprobación: 25 + 27 = 52. Este método es válido. Es el mismo principio de compensar, con otra forma de escribirlo [15, inferencia].

**Error para evitar.** "Restar siempre la menor de la mayor." 82 − 47 hecho así da 45. Se corrige con un ítem de contraste: "¿Cuál de estas dos respuestas es correcta, 35 o 45? Comprueba con una suma."

### 3.3 División

**Repartir.** "Repartir es dar lo mismo a cada uno."
12 caramelos entre 3 amigos: cada uno recibe 4, porque 3 × 4 = 12. Símbolo: 12 : 3 = 4.

**Cuántas veces cabe.** "¿Cuántas veces cabe el 4 en el 20?"
20 : 4 = 5, porque 4 cabe 5 veces en 20. Comprobación: 4 × 5 = 20.

**Familia de operaciones.** "Con los mismos tres números, hay cuatro operaciones."
Con 3, 4 y 12: 3 × 4 = 12, 4 × 3 = 12, 12 : 3 = 4, 12 : 4 = 3. La división es la operación inversa de la multiplicación: 24 : 6 = 4 porque 6 × 4 = 24. Esto es la conexión que la sección 1 señala como clave [inferencia, sin fuente primaria en las notas].

**Lo que sobra (resto).** "Cuando no sale exacto, lo que sobra tiene que ser menor que lo que repartimos."
15 : 4: 4 cabe 3 veces (12), sobran 3. Como el resto 3 es menor que 4, está bien. Comprobación: 4 × 3 + 3 = 15. Esta comprobación de cociente × divisor más resto es la que usa la app [PEDAGOGY, mundo 8].

**Reparto con barras.** "Tengo 18 canicas en 3 bolsas iguales: dibujo 3 barras y reparto de una en una."
18 : 3 = 6 en cada bolsa. Es el paso pictórico del CPA [1, 2].

---

## 4. Diseño de sesiones

### 4.1 Duración y frecuencia

- Duración propuesta: 15 minutos, con un máximo de 3 a 4 días a la semana, es decir, 45 a 60 minutos semanales [inferencia].
- Respaldo parcial: Smartick trabaja con sesiones de unos 15 minutos y una al día, y la empresa lo justifica por la atención del grupo de edad. Es una afirmación de la empresa, no un estudio [44, 45]. DreamBox recomienda 60 a 90 minutos semanales [43].
- Lo que no hay: estudios sobre la duración óptima por edad en 6–12 años. Tampoco hay datos sobre atención en sesiones de matemáticas para niños de 8 años [gap]. Los deberes de primaria tienen una asociación con el rendimiento más débil que en secundaria [27], lo que sugiere que más tiempo no es automáticamente mejor.

### 4.2 Estructura de 15 minutos

| Minuto | Bloque | Contenido | Por qué |
|---|---|---|---|
| 0 a 2 | Recuperación | 3 o 4 hechos de sesiones anteriores, sin pista; si falla, se muestra y vuelve más tarde en la sesión | Recuperación y espaciado [6, 7] |
| 2 a 7 | Bloque principal | Si hay tema nuevo: un ejemplo resuelto (solo tras fallo, o si es nuevo) y 4 a 6 ítems del tema. Máximo 3 hechos nuevos | Ejemplo resuelto [28]; práctica en bloques al introducir [29] |
| 7 a 12 | Intercalado | 6 a 8 ítems de temas mezclados, incluido uno de error común | Intercalado [2, 29] |
| 12 a 14 | Cierre | Un problema de barras o de enunciado con dibujo; el feedback explica el error | Feedback informativo [5]; problemas de barras [34] |
| 14 a 15 | Cierre de sesión | Resumen de lo dominado y paso de la historia | Recompensa por completar, no por acertar [21, inferencia] |

Los ítems que fallan vuelven 2 a 4 ítems después dentro de la misma sesión, y de nuevo en sesiones posteriores, según `PEDAGOGY.md` [inferencia; el intervalo de 2 a 4 ítems no tiene fuente].

### 4.3 Práctica frente a juego: la proporción

No hay evidencia directa sobre la proporción óptima de práctica y juego. Lo que sigue es inferencia, y debe presentarse así a quien lea el documento.

Lo que sí dicen las notas:

- La dosis se asocia a resultados. En DreamBox, los alumnos que más usaron el programa progresaron más, pero el uso real fue de 38 a 44 minutos semanales frente a los 60 a 90 recomendados, y la mayoría no alcanzó el nivel recomendado [43]. Esto es correlacional.
- En Khan Academy, un ensayo en la India mostró efectos solo entre alumnos con uso supervisado de unas 1 hora semanal. Es un dato de la empresa, sobre su propio ensayo [51].
- Los estudios revisados no separan el efecto del entretenimiento del efecto de la práctica, y en las apps con avatares, tiendas o minijuegos sin contenido matemático no se ha encontrado evidencia de mejora del aprendizaje [54, 53, inferencia].

Propuesta: en cada sesión de 15 minutos, al menos 12 minutos deben ser ítems con respuesta del alumno. Las transiciones de historia no pueden superar 2 minutos en total. La historia avanza por aciertos en ítems del tema, no por minutos jugados. Medir el "tiempo de práctica efectiva" como indicador principal (minutos con ítems resueltos, no minutos conectados) [inferencia].

Esta propuesta responde a la insistencia del responsable: la práctica es el contenido de la sesión, y el juego es el envoltorio que la hace seguirse. No es un tiempo de juego separado.

### 4.4 Cuándo ayuda y cuándo daña la presión del tiempo

| Situación | Evidencia | Decisión |
|---|---|---|
| Hecho nuevo, primeros intentos | Sin evidencia a favor; el cronómetro se asocia a ansiedad en un debate no resuelto [17, 18] | Sin cuenta atrás visible |
| Hecho ya dominado, para automatizar | Fuchs et al. (2013): la práctica con presión mejora la velocidad y la precisión [12] | Modo opcional de "ritmo personal", con marca de mejora respecto a la semana anterior |
| Alumno con ansiedad | Ramirez et al. (2013) [19] | Se desactiva por defecto para ese alumno; los padres pueden desactivarlo [PEDAGOGY] |
| Columnas con llevada | Sin evidencia de que la velocidad ayude a comprender | Evaluar por exactitud, no por tiempo [inferencia] |

El umbral de 7 segundos con lápiz de `PEDAGOGY.md` no tiene fuente en las notas. Es una hipótesis razonable para niños de 8 años, porque escribir dos cifras es lento a esa edad, pero debe medirse con datos [sin fuente; inferencia].

### 4.5 Motivación intrínseca y extrínseca

Cerasoli, Nicklin y Ford (2014) reúnen un metaanálisis de 40 años (183 estudios, N = 212.468, escolares, adultos y deportistas). La motivación intrínseca predice el rendimiento con una correlación media o fuerte (ρ entre 0,21 y 0,45). Los incentivos vinculados directamente al rendimiento reducen esa relación; los incentivos indirectos la mantienen o la aumentan [21]. Es evidencia mayoritariamente de adultos; para niños de 8 años es inferencia.

Decisiones para Repasitos:

- Las estrellas y los accesorios no deben ganarse por acertar cada ítem, sino por completar sesiones y por dominar estrategias. Eso es una recompensa indirecta en el sentido de Cerasoli.
- La teoría de la autodeterminación (autonomía, competencia y relación) es el marco general, pero la fuente primaria no se ha localizado [no verificado].
- Kohn (1993) critica las recompensas en general, pero no hay URL verificada [no verificado].

### 4.6 Qué hace y qué no hace la gamificación

| Elemento | Qué muestra la evidencia | Veredicto |
|---|---|---|
| Elementos de juego en general | Sailer y Homner (2020): efecto cognitivo g = 0,49 (k = 19), motivacional g = 0,36 (k = 16), conductual g = 0,25 (k = 9); el efecto cognitivo se mantiene en los estudios más rigurosos [22] | Útil, pero mayoritariamente en secundaria y universidad |
| Competición combinada con colaboración | Los autores sugieren que puede ser válida para la motivación [22] | Hipótesis para explorar |
| Insignias y clasificaciones | Hanus y Fox (2015), estudio de un semestre con 80 universitarios: caída de la motivación con insignias, monedas y clasificación [23] | Evitar en primaria |
| Gamificación en primaria con medidas de aprendizaje | No se ha encontrado ningún metaanálisis [gap] | Sin base |
| Kahoot (revisión de 93 estudios) | Efecto positivo modesto en rendimiento, dinámica y ansiedad, con estudios sin efecto [57] | Útil en aula, sin prueba para práctica individual |

Lo que la gamificación no hace: sustituir la práctica, ni compensar un feedback pobre. Lo que sí puede hacer: dar sentido a la práctica si la historia avanza con la matemática.

### 4.7 La capa de historia

`STORY.md` tiene una pieza que encaja con la evidencia: la desaparición de la niebla (que se disipa a medida que el alumno acierta) y el jefe de cada mundo como prueba final. Dos aspectos conviene reforzar:

- El jefe puede servir de medida de retención si sus ítems son de semanas anteriores. Así la prueba final también es una práctica espaciada [inferencia].
- La historia no puede ser la razón para saltarse la práctica. Si el alumno puede avanzar en la historia sin resolver ítems, el diseño invierte la prioridad. Regla: el avance narrativo solo depende de aciertos en ítems del tema.

La evidencia directa sobre narrativa en el aprendizaje de matemáticas no está en las notas [gap]. Su valor es motivacional, no didáctico.

---

## 5. Qué hacen las apps

### 5.1 Mecánicas y evidencia por app

| App | Qué es | Evidencia de aprendizaje | Mecánica que ayuda | Mecánica que entretiene |
|---|---|---|---|---|
| DreamBox (EE. UU., K–8) | Adaptativa, por lecciones | Correlación dosis-respuesta en unos 3.000 alumnos de 3.º a 5.º; "prometedor, no concluyente" según el investigador [43]; sin ensayo independiente de matemáticas | Adaptación al nivel exacto; lecciones con representaciones | No descrito en las notas |
| Smartick (España, 4–14 años) | Sesión diaria de unos 15 minutos | Estudios pequeños, de un centro, con vínculo con la empresa; una tesis con grupo de control en 3.º de primaria (Perú) [64] | Adaptación de la siguiente pregunta según la sesión anterior; explicación tras el error [45] | Mundo virtual con avatar, concursos y entrenamiento de memoria [45] |
| ST Math (EE. UU., K–5) | Visual-espacial | Ensayo aleatorizado de 16.307 alumnos de 3.º a 5.º (52 clústeres) con efecto de +0,04 según la revisión independiente de Evidence for ESSA; el informe lo escribe la empresa [46, 47] | Representaciones visuales | Puzzles visuales |
| Zearn (EE. UU., 3.º–5.º) | Currículo con sesiones guiadas | Ensayo RAND en Texas (64 escuelas): el test preregistrado no fue significativo; efecto solo en un test interno [48]; la empresa habla de impacto causal positivo [49] | Currículo integrado en clase | Poco |
| Matific (Australia, primaria) | Tareas abiertas | Sin ensayo aleatorizado publicado; un ensayo en Uruguay registrado con inicio en mayo de 2026 y fin en junio de 2027 [50] | Tareas abiertas y de razonamiento | Pocos datos |
| Khan Academy | Plataforma de dominio | Ensayo en la India (unos 5.500 alumnos, 74 escuelas) con efecto solo con uso supervisado [51]; resultados de la empresa en otros ensayos [no verificado en texto] | Práctica por dominio con apoyo supervisado | Insignias y progreso visible |
| Prodigy (Canadá) | Juego de rol con batallas de problemas | Evidencia débil y mayoritariamente de la empresa; un informe de dos escuelas no justifica la eficacia según los críticos [52] | Práctica de problemas dentro del juego | Dominante: 16 anuncios y 4 batallas en 19 minutos en una revisión [54] |
| IXL, Mathletics | Práctica de volumen | IXL: asociaciones correlacionales con más práctica [55]; en un colegio de Queensland, iPad frente a papel sin diferencia concluyente [56]; Mathletics sin estudios encontrados | Volumen de práctica con retroalimentación | Escasa |
| Sumdog | Práctica de juegos de matemáticas | Estudios de la empresa y un informe de Inglaterra (ImpactEd, con 499 alumnos) con resultados intermedios significativos; efecto final no encontrado [58] | Práctica adaptativa | Juegos |
| Duolingo Math, Brilliant | Lección corta | Sin estudio de resultados independiente para Duolingo Math [61]; un estudio de Brilliant en álgebra con 60 alumnos de 10.º, no concluyente [62] | Lección corta | Gamificación de la racha |

Las cifras de tamaño de efecto de las apps son en su mayoría de la propia empresa. Un efecto de +0,03 a +0,09 de ST Math es bajo-moderado [46, 47]; el ensayo de Zearn no encontró efecto significativo en su test principal [48].

### 5.2 Cuánta práctica ocurre en la realidad

- DreamBox: 38 a 44 minutos semanales de uso real frente a 60 a 90 recomendados [43].
- Smartick: 15 minutos diarios recomendados, sin datos de uso real publicados [44].
- Sumdog (dato de la empresa para Texas): unos 30 minutos semanales se asocian a más progreso, de forma correlacional [no verificado en el texto].
- Matific, Prodigy, Math Seeds, ST Math y Zearn: no hay datos de uso real por alumno en las notas.

Lección: la mayoría de las apps no mide el tiempo de práctica efectiva, y la recomendación del fabricante rara vez se cumple. Repasitos debe medir ítems resueltos, no minutos conectados.

### 5.3 Adaptividad

La adaptación es el rasgo común de DreamBox, Smartick y Khan, pero las notas no contienen un ensayo que aísle su efecto frente a una secuencia fija [gap]. Lo que sí se sostiene es que la práctica debe ajustarse al nivel del alumno y que los ítems que fallan vuelven [29, inferencia]. Por eso la adaptación de Repasitos (caja de Leitner por ítem) es coherente, pero su efecto debe medirse frente a una secuencia fija en un piloto.

### 5.4 Qué copiar y qué evitar

Copiar:

- Sesiones cortas y diarias, con cierre claro (Smartick) [44].
- Explicación del error tras el fallo, con la estrategia correcta (Smartick, y el feedback de [5]) [45].
- Adaptación por ítem y repaso de lo fallado (DreamBox, Smartick) [43, 45].
- Representaciones visuales antes de lo simbólico (ST Math y CPA) [46, 1].
- Medir el efecto con ensayos externos, no con datos internos (lección de Zearn y ST Math) [46, 48].

Evitar:

- Anuncios, membresías y presión de compra. La queja a la FTC de 2021 contra Prodigy se refiere sobre todo a publicidad y membresía, no solo a eficacia [52, 53].
- Minijuegos, avatares y tiendas que no llevan matemáticas (Prodigy [53, 54]; el mundo virtual de Smartick [45]).
- Insignias y clasificaciones públicas [23].
- Cifras de eficacia que no tienen metodología publicada. Por ejemplo, la afirmación de "mejora de 25 % en matemáticas en tres meses" de una app española no se incluye en este documento porque no hay metodología [no verificado].
- Afirmaciones tipo "6 veces más efectivo que ver vídeos" sin fuente (Brilliant) [no verificado].

### 5.5 Privacidad de datos de menores en España

Marco legal (no es evidencia pedagógica, y el texto íntegro de la norma no se ha revisado en las notas):

- La AEPD indica que el consentimiento de un menor solo es válido desde los 14 años (art. 7 LOPDGDD); por debajo de esa edad lo prestan los padres o tutores, y debe ser expreso [59]. El Reglamento europeo fija 16 años como edad general, con margen para los Estados entre 13 y 16; España fija 14 [59].
- Un informe de la AEPD sobre apps que guardan datos de alumnos en la nube señala que, para tratamientos de alto riesgo, hace falta consentimiento expreso de los padres si el menor tiene menos de 14 años [60].

Recomendaciones para Repasitos (inferencia, pendientes de revisión jurídica):

- Recoger solo el nombre o un alias; sin datos identificativos adicionales.
- Sin publicidad y sin perfiles de comportamiento.
- Consentimiento parental con verificación para cualquier alumno menor de 14 años.
- No obligar a crear cuenta para la práctica básica.
- Si hay servidor externo, contrato de encargado del tratamiento conforme al RGPD.
- Plazos de conservación de datos definidos y un borrado completo a petición de los padres.

---

## 6. Recomendaciones priorizadas para Repasitos

### 6.1 Tabla de prioridades

| Prioridad | Recomendación | Nivel de evidencia | Base |
|---|---|---|---|
| P1 | Calentamiento de recuperación sin pista con 3 o 4 hechos de sesiones anteriores | Alta para hechos; media para procedimientos | [6, 7, 30] |
| P1 | Feedback que nombra el error y la estrategia, con reintento inmediato | Alta en el principio (contenido informativo); media en el tamaño | [4, 5] |
| P1 | Ejemplo resuelto solo tras un fallo; sin autoexplicación obligatoria después | Media | [28] |
| P1 | Medir con pretest, postest y retención a 2–4 semanas; análisis de errores | Alta en el principio de pruebas diferidas; inferencia en el protocolo | [6, 7] |
| P1 | Intercalado en el 30 al 40 % de los ítems de la sesión, con bloque al introducir un procedimiento | Media | [2, 29, 38] |
| P2 | CPA con retirada tras un fallo: concreto, pictórico y abstracto | Media | [1, 2] |
| P2 | Ítems de signo igual en formas no estándar y de error común con dos respuestas | Media | [13, 14] |
| P2 | Problemas de barras con enunciados de cambio, comparación y combinación | Media | [34] |
| P2 | Recompensas por completar sesiones y estrategias, no por cada acierto | Media en adultos; inferencia en niños | [21] |
| P2 | Cronómetro opcional; sin cuenta atrás en hechos nuevos | Inferencia (debate abierto) | [12, 17, 18] |
| P3 | Dos caminos para la misma suma (decenas o redondeo) y registro del elegido | Media en el principio de estrategias flexibles | [15] |
| P3 | Estimación y comprobación ("¿es razonable?") | Inferencia | Sin fuente |
| P3 | Escritura a mano de cifras, decenas y posición con el lápiz | Inferencia (no hay estudio en las notas) | Sin fuente |
| P3 | Evitar insignias y clasificaciones públicas | Media (negativa, en universitarios) | [23] |
| P3 | Sin publicidad, sin perfiles, sin cuenta obligatoria | Marco legal; inferencia | [59, 60] |
| P3 | Cifras de 4 dígitos como reto opcional o para 4.º | Inferencia (alcance) | [41] |

### 6.2 Tipos de ejercicio que faltan en las apps típicas

1. **Explicar el error**: el alumno ve un cálculo con error común y elige entre dos respuestas. Después, marca el paso que falla. Diseñar con cuidado: la justificación es un ejercicio propio, no un añadido a un ejemplo resuelto [28].
2. **Signo igual en formas no estándar**: "5 + 3 = 8 + ___" y "7 = 3 + ___". Powell y Fuchs (2010) encontraron que la instrucción combinada con problemas verbales funcionó en alumnos de 3.º con dificultades; el resumen no ha sido verificado en texto completo [13, media].
3. **Problemas de barras**: el alumno arrastra cantidades a la barra, elige la operación y, después, la barra se retira [34]. Ejemplo: "Ana tiene 24 cromos. Luis tiene 17 más que Ana. ¿Cuántos tienen entre los dos?" Barra de Ana: 24; barra de Luis: 24 + 17 = 41; total 24 + 41 = **65**.
4. **Reparto con barras**: "Repartimos 18 canicas en 3 bolsas iguales" (18 : 3 = 6), con la barra dibujada antes de escribir la operación.
5. **Estimación**: "¿El resultado es más o menos de 100?" antes de calcular. Inferencia.
6. **Recta numérica**: colocar un número en la recta y dar un salto de decenas (método del ABN y de la recta vacía) [15, 35, inferencia].
7. **Escribir a mano**: el alumno escribe las decenas o la llevada con el lápiz. La app reconoce la cifra; si la lectura falla, el alumno corrige el dígito sin castigo (regla de `PEDAGOGY.md`: el error de reconocimiento no baja la maestría) [inferencia].

### 6.3 Cómo medir si el niño aprende

**Protocolo**

1. **Pretest** (semana 1, 10 minutos): tres tipos de ítem (hechos, columnas y problemas), forma A. Sirve de línea base por alumno.
2. **Registro continuo por ítem** (no por minuto): respuesta, tiempo real del ítem, pista usada, tipo de error si lo hay.
3. **Postest** (final de cada bloque de 3 a 4 semanas): forma B paralela, con ítems de transferencia en contexto que no se han visto en la app.
4. **Retención** (2 a 4 semanas después del postest): ítems de la forma B no vistos, sin preparación. Es el dato más importante para decidir si el aprendizaje se mantiene [6, 7].
5. **Análisis de errores**: cada error se clasifica en una categoría fija: valor posicional, llevada, pedir prestado o cero, tabla no recuperada, mala lectura del enunciado, elección de operación, distracción. Un patrón repetido indica qué mecánica falla.
6. **Grupo de comparación**: idealmente, un grupo con práctica habitual de aula, o dos versiones de la app. Sin grupo de comparación, el resultado no es concluyente [inferencia; el tamaño de muestra necesario no se ha calculado].

**Criterio de éxito**: mejora en postest y en retención frente a la línea base, no solo en los aciertos internos de la app. Esta distinción es importante porque las apps revisadas suelen medir su propio progreso [48, 49, 57].

**Advertencia**: el riesgo de sobreajustar la medida a los ítems de la app es real. Por eso los ítems de transferencia del postest deben ser de un formato diferente [inferencia, basada en la advertencia de `docs/PEDAGOGY.md` sobre la evaluación con datos reales].

---

## 7. Huecos y verificaciones pendientes

**Evidencia**

1. **Ninguna app revisada tiene un ensayo aleatorizado independiente de aprendizaje de matemáticas en primaria que aísle su efecto**. ST Math y Zearn son los más cercanos, con efectos pequeños o no significativos en sus pruebas principales [46, 47, 48]. Tampoco hay evidencia de apps con lápiz (stylus): las notas no tratan esa modalidad.
2. **Cronómetro y ansiedad en niños de 8 años**: no hay ensayo que compare cronómetro y práctica sin tiempo con medidas de ansiedad y aprendizaje [12, 17, 18]. La decisión sobre el cronómetro es de diseño, no de evidencia.
3. **Gersten et al. (2009)**: las ocho recomendaciones no se han leído en detalle [8, 9]. Hay que leerlas antes de citar la guía como base de la instrucción explícita.
4. **Jitendra et al. (2018)** sobre CRA: no confirmado. No se cita. Tampoco se citan Xin et al. (2021), Peltier y Vannest (2017) ni Alfieri et al. (2011), porque no se han verificado sus URL ni sus cifras.
5. **Rittle-Johnson** (signo igual y valor posicional): no se han encontrado los artículos [no verificado].
6. **Worked examples (Sweller, Renkl)**: sin referencias verificadas. Se usa solo Barbieri et al. (2023), que hay que verificar en la revista [28].
7. **Mentalidad de crecimiento (Dweck)**: sin URL verificada. Sisk et al. (2018) indican efecto pequeño [24].
8. **Teoría de la autodeterminación (Deci y Ryan)** y **Kohn (1993)**: sin fuente primaria verificada [no verificado].
9. **Manipulativos virtuales frente a físicos**: no hay evidencia de equivalencia [1, inferencia].
10. **Intercalado en primaria**: el estudio de 2019 sobre estrategias de resta [38] solo se ha leído en su título. La corrección de Brunmair [3] no se ha leído en detalle.
11. **Duración óptima de sesión y atención a 8 años**: sin estudio encontrado [gap].
12. **ABN**: el estudio de Extremadura [37] no tiene resultados publicados. Chile [35] y Bordón [36] son exploratorios.
13. **Matemáticas con Juan**: el nombre no se ha encontrado en las búsquedas; antes de descartarlo, confirmar que existe.

**Cifras y atribuciones no verificadas**

- Rowland (2014), g ≈ 0,50 [6]: no verificado en el texto.
- Adesope et al. (2017), g ≈ 0,61 [31]: cifra de resumen, varía entre fuentes.
- Fuchs et al. (2013), tamaño de efecto 0,25 [12]: de un agregador.
- Cepeda et al. (2006): la cifra de "254 estudios" no está verificada; el resumen habla de 317 experimentos [7].
- Ramirez et al. (2013): "casi medio curso" [19].
- Hattie (2007): la media de 0,79 tiene críticas metodológicas conocidas [4].
- EEF: +6 meses o +8 meses según el material [25].
- Sisk et al. (2018): las cifras de participantes del comunicado no se han verificado en el artículo [24].
- Hanus y Fox (2015): cifras de la ficha de revisión no verificadas [23].
- Metaanálisis de 2025 sobre gamificación en matemáticas (g = 0,383): no revisado [no verificado].
- Khan Academy: los resultados de sus ensayos proceden de su propio blog [51].
- Mathseeds, Matific, Prodigy y Sumdog: en su mayoría datos de la empresa.
- Brilliant: "6 veces más efectivo que ver vídeos" sin fuente [62, no verificado].
- Smartick: "25 % en tres meses" sin metodología publicada [no verificado].
- Van der Kleij et al. (2015) (d de 0,49 para feedback elaborado, 0,05 para corrección, 0,32 para dar la respuesta): sin URL verificada. No se usa.
- Wang y Tahir (2020) sobre Kahoot: se usa el dato de 93 estudios de la revisión [57].
- Guan, Du y Lin (2022), etiquetas de subobjetivo en ejemplos resueltos: sin verificar en texto completo [63].

**Parámetros de diseño de Repasitos sin fuente**

- 80 % de éxito como objetivo de dificultad.
- Mezcla de 70 % de ítems conocidos y 30 % de nuevos o débiles.
- Máximo 3 hechos nuevos por sesión.
- Intervalos Leitner (1, 2, 4, 8 y 16 días) y reglas de caja (acierto rápido sube, fallo baja dos cajas).
- Umbrales de fluidez: 4 s con teclado, 5 s con teclado numérico y 7 s con lápiz.
- Reintento de un fallo en 2 a 4 ítems.

Todos son hipótesis razonables de diseño. Ninguno tiene fuente en las notas. Deben tratarse como hipótesis, probarse en un piloto con dos o tres variantes y ajustarse con datos reales de niños [inferencia].

**Legal**

- Texto íntegro del art. 7 LOPDGDD y criterio específico de la AEPD para apps de matemáticas [59, 60]. Hace falta revisión jurídica antes de publicar.

---

## Fuentes

[1] Carbonneau, K. J., Marley, S. C. y Selig, J. P. (2013). Meta-análisis de manipulativos en matemáticas. https://www.doi.org/10.1037/a0031084

[2] Brunmair, M. y Richter, T. (2019). Meta-análisis de práctica intercalada (preprint). https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf

[3] Corrección del meta-análisis de Brunmair y Richter (2019), Frontiers in Psychology. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.02296/full

[4] Hattie, J. y Timperley, H. (2007). The power of feedback. https://www.uky.edu/~gmswan3/575/Hattie_Timperly_2007.pdf

[5] Wisniewski, B., Zierer, K. y Hattie, J. (2020). Reanálisis del feedback. Frontiers in Psychology. https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full

[6] Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review. Psychological Bulletin, 140(6). https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf

[7] Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. y Rohrer, D. (2006). Distributed practice in verbal recall tasks. Psychological Bulletin, 132(3). https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf

[8] Gersten, R. et al. (2009). Assisting students struggling with mathematics: RtI for elementary and middle schools (NCEE 2009-4060), guía del WWC. https://dwwlibrary.wested.org/files/4775708.pdf

[9] What Works Clearinghouse, guías de práctica. https://ies.ed.gov/ncee/wwc/PracticeGuides

[10] Ministerio de Educación de Singapur (2020). Resultados de TIMSS 2019. https://www.moe.gov.sg/news/press-releases/20201208-timss-2019-singapore-students-continue-to-excel-in-mathematics-and-science

[11] IEA, TIMSS y PIRLS, resultados internacionales de TIMSS 2019. https://timssandpirls.bc.edu/timss2019/international-results/achievement/

[12] Fuchs, L. S. et al. (2013). Journal of Educational Psychology, 105(1), 58–77 (vía agregador). https://edknowledge.stanford.edu/node/179

[13] Powell, S. R. y Fuchs, L. S. (2010). Tutoría sobre el signo igual en alumnos de 3.º. https://par.nsf.gov/biblio/10357260

[14] Estudio sobre lecciones de signo igual en 4.º y 5.º (2022). ZDM / Springer. https://link.springer.com/10.1007/s11858-022-01405-y

[15] Klein, A. S., Beishuizen, M. y Treffers, A. (1998). The empty number line in Dutch second grades. Journal for Research in Mathematics Education, 29(4). https://nctm.org/Publications/journal-for-research-in-mathematics-education/1998/Vol29/Issue4/The-Empty-Number-Line-in-Dutch-Second-Grades_-Realistic-Versus-Gradual-Program-Design

[16] Sari, P. y Zulkardi (estudio de diseño con alumnos de 2.º). Universidad de Sriwijaya. https://repository.unsri.ac.id/6340/1/Puspita_Sari-dede-dehan-zulkardi.pdf

[17] Boaler, J., Williams, K. y Confer, C. (2015). Fluency without fear. NCTM (archivo de youcubed). https://www.youcubed.org/wp-content/uploads/2017/03/nctm-timed-tests.pdf

[18] Hechinger Report, crítica a la tesis sobre pruebas cronometradas. https://hechingerreport.org/?p=93534

[19] Ramirez, G., Gunderson, E. A., Levine, S. C. y Beilock, S. L. (2013). Comunicado de la Universidad de Chicago. https://news.uchicago.edu/story/math-anxiety-causes-trouble-students-early-first-grade

[20] Lillard, A. y Else-Quest, N. (2006). Science, 313. https://pubmed.ncbi.nlm.nih.gov/17008512/

[21] Cerasoli, C. P., Nicklin, J. M. y Ford, M. T. (2014). Psychological Bulletin, 140, 980–1008. https://oa.mg/work/10.1037/a0035661

[22] Sailer, M. y Homner, L. (2020). Educational Psychology Review, 32, 77–112. https://link.springer.com/article/10.1007/s10648-019-09498-w

[23] Hanus, M. D. y Fox, J. (2015). Computers & Education, 80 (ficha de revisión en PMC). https://pmc.ncbi.nlm.nih.gov/articles/PMC8916940

[24] Sisk, V. F., Burgoyne, A. P., Sun, J., Butler, J. L. y Macnamara, B. N. (2018). Psychological Science (comunicado de la Universidad Estatal de Míchigan). https://msutoday.msu.edu/news/2018/05/study-finds-popular-growth-mindset-educational-interventions-arent-very-effective

[25] EEF, evaluación y retroalimentación. https://educationendowmentfoundation.org.uk/guidance-for-teachers/assessment-feedback

[26] EEF, retroalimentación digital en matemáticas de primaria (ensayo). https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/digital-feedback-in-primary-maths/

[27] Cooper, H., Robinson, J. C. y Patall, E. A. (2006). Review of Educational Research, 76(1). https://scholars.duke.edu/publication/688435

[28] Barbieri, C. A. et al. (2023). Educational Psychology Review, 35, 11 (resumen en agregador; verificar en la revista). https://scholarhub.vn/publication/:slug/f43c618f-344f-4e53-a1ef-60fe03ac85f4

[29] Rohrer, D., Dedrick, R. F. y Stershic, S. (2015). Journal of Educational Psychology. https://doi.org/10.1037/edu0000001

[30] Rohrer, D. (2019), copia en Gwern. https://Www.Gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf

[31] Adesope, O. O. et al. (2017), resumen de Learning Scientists. https://www.learningscientists.org/blog/2017/2/9-1

[32] Retrieval Practice, resumen de intercalado (2017). https://retrievalpractice.org/archive/2017/interleaving

[33] EEF, tecnología digital para mejorar el aprendizaje (2019). https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/digital

[34] Metaanálisis de intervenciones en problemas verbales para alumnos con dificultades (autores no identificados) [no verificado]. https://www.proquest.com/docview/1413417538

[35] ABN, estudio exploratorio en Chile (2023). Perfiles Educativos. https://perfileseducativos.unam.mx/iisue_pe/index.php/perfiles/article/view/60206/53210

[36] ABN, revisión en *Bordón* (Martínez Montero). https://recyt.fecyt.es/index.php/BORDON/article/view/29070

[37] ABN, estudio en curso de la Universidad de Extremadura (2022). https://dehesa.unex.es/handle/10662/18707?locale=en

[38] Estudio de intercalado en estrategias de resta en primaria (solo título leído). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6813467/

[39] REL Central, seminario sobre estudiantes con dificultades (diapositivas). https://ies.ed.gov/ncee/edLabs/regions/central/pdf/slides-assisting-struggling-students.pdf

[40] Metaanálisis de CRA con diseños de caso único (2025). https://scholars.uky.edu/en/publications/a-meta-analytic-review-of-the-concrete-representational-abstract-/

[41] Real Decreto 157/2022, de 1 de marzo, enseñanzas mínimas de Educación Primaria (BOE-A-2022-3296). https://www.boe.es/buscar/act.php?id=BOE-A-2022-3296

[42] Programación de matemáticas de 3.º de un centro de Madrid (documento de centro, no normativo). https://site.educa.madrid.org/cp.lucero.madrid//wp-content/uploads/cp.lucero.madrid/2024/01/28020740_Ntra.Sra_.delLucero_3oMATEMATICAS.pdf

[43] Harvard CEPR, uso de DreamBox y aprendizaje. https://cepr.harvard.edu/news/harvard-researchers-probe-student-time-spent-using-dreambox-math-software

[44] Smartick, soporte: por qué 15 minutos (empresa). https://support.smartickmethod.com/en/articles/597945-why-just-15-minutes-a-day

[45] Smartick, soporte: cómo funciona (empresa). https://support.smartickmethod.com/en/articles/2761158-como-funciona-smartick

[46] MIND Research Institute, ensayo aleatorizado de ST Math (2021). https://info.mindresearch.org/hubfs/pdfs/research-results/ST-Math_RCT_2021_MR4.pdf

[47] Evidence for ESSA, ST Math. https://evidenceforessa.org/program/st-math-spatial-temporal-math/

[48] Efficacy of Zearn Math (EdWorkingPapers, RAND). https://edworkingpapers.com/sites/default/files/Efficacy%20of%20Zearn%20Math%20for%20EdWorkingPapers%20v2.pdf

[49] Zearn, biblioteca de investigación (empresa). https://about.zearn.org/research-library

[50] AEA RCT Registry, ensayo de Matific en Uruguay (registro 18898). https://www.socialscienceregistry.org/trials/18898

[51] Khan Academy, ensayo en Uttar Pradesh (blog de la empresa). https://blog.khanacademy.org/what-a-randomized-control-trial-in-uttar-pradesh-india-teaches-us-about-improving-math-learning-with-khan-academy

[52] Fairplay, queja a la FTC sobre Prodigy (2021). https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/

[53] Common Sense Media, reseña de Prodigy. https://www.commonsensemedia.org/app-reviews/prodigy-math-game

[54] NEPC, revisión de Prodigy. https://www.nepc.colorado.edu/sites/default/files/publications/Newsletter%20prodigy.pdf

[55] IXL, estudio en Florida (empresa). https://www.ixl.com/materials/us/research/The_Impact_of_IXL_Math_in_a_Florida_School_District.pdf

[56] IXL, estudio en un colegio de Queensland (investigación-acción). https://www.ixl.com/materials/us/research/The_Impact_of_IXL_on_Maths_Learning_in_a_Queensland_College.pdf

[57] Wang y Tahir (2020), revisión de Kahoot en *Computers & Education* (Goldsmiths). https://research.gold.ac.uk/id/eprint/39435

[58] Sumdog, informe de impacto en Inglaterra (ImpactEd, 2024-25). https://learn.sumdog.com/en-gb/evidence-and-impact/england-efficacy-study-report

[59] AEPD, preguntas frecuentes 10: menores y educación. https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion

[60] El Derecho, sobre un informe de la AEPD acerca de apps que guardan datos de alumnos en la nube. https://elderecho.com/la-aepd-publica-un-informe-sobre-la-utilizacion-de-apps-que-almacenan-datos-de-alumnos-en-la-nube

[61] The Register, Duolingo Math (2021). https://www.theregister.com/2021/10/08/duolingo_maths/

[62] Brilliant, estudio en ERIC (2023) con 60 alumnos. https://files.eric.ed.gov/fulltext/EJ1394390.pdf

[63] Guan, Du y Lin (2022), Frontiers in Education (no verificado en texto completo). https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2022.832901/text

[64] Tesis sobre Smartick en 3.º de primaria (Perú, 2026). https://repositorio.ucsm.edu.pe/bitstreams/eba477ae-7beb-4669-855e-78ccd75f9537/download
