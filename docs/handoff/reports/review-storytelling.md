# Revisión de storytelling de datos: Numeria

Fecha: 2026-10-22. Método: skill `historias` (Knaflic, lecciones de contexto, visual, caos, atención, diseño y relato).
Capturas: `/tmp/numeria-review-story/` (iPad 1180×820 con `--seed`, niña demo «Inessa», 2.º de Primaria).
No se ha tocado código. Este informe es la única escritura.

## Alcance y límites

- Vistas revisadas con captura: `/play` (inicio), `/play/album`, `/play/chest`, `/play/w/w1` (mapa del Bosque), `/play/review`, `/play/diploma`, `/adult` (zona de adultos, tras crear PIN), `/adult/child/:id` (informe del niño, parte alta y baja), `/adult/school` (sin cuenta: muestra el aviso de inicio de sesión).
- **No verificado en pantalla**: panel de clase (`/adult/class/:id`), que exige cuenta de colegio; ni el mapa de `w2`, ni `StoryPlayer`, `RewardOverlay` ni el flujo de nodo. Las propuestas sobre la clase (P10) se basan en el código de `src/adult/school/ClassScreen.tsx` y deben comprobarse con una cuenta de prueba.
- Las cifras citadas salen de la demo (`src/data/dev.ts`), no de datos reales.

## Diagnóstico en tres frases

1. El informe del adulto muestra mucho antes de decir qué pasa: cuatro cifras de igual peso, una cuadrícula de 100 casillas sin leyenda a la vista y ninguna frase que diga qué repasar.
2. El progreso se cuenta con tres lenguajes distintos (cristales, letras del cofre, cristales para el diploma) y con periodos mezclados (7 días, semana, mes, «hoy», acumulado).
3. El mapa del niño y el álbum funcionan como recompensa, pero el objetivo final (el diploma) no se ve nunca antes de ganarlo, y algunos elementos de navegación no se entienden a primera vista.

Lo que ya funciona y conviene conservar: el titular de la historia en el inicio (`ChildHomeScreen`, tarjeta morada «¡Borrón quiere las mochilas!»), el banner de Luna en el mapa, la leyenda del cromo misterioso («Consigue 3 estrellas en «Filas de flores»»), la nota «Los errores de lectura de la letra no cuentan» y el premio del cofre explicado al adulto.

## Propuestas (ordenadas por impacto)

### P1. El informe del adulto no dice la conclusión
- **Pantalla / archivo**: `/adult/child/:childId`, `src/adult/child/ChildReportScreen.tsx` (bloque `stats`, líneas ~146-160).
- **Problema**: lo primero que cae en el ojo es «1 h 34 min» en grande; las cuatro cifras pesan igual y ninguna responde a la pregunta del adulto («¿qué hago con mi hijo esta semana?»). La respuesta (qué repasar) queda en la cuadrícula y en «Errores más frecuentes», a media página.
- **Cambio**: titular de acción arriba, generado desde los datos, con sus cifras de soporte debajo. Ejemplo de forma: «Inessa domina 34 de 55 multiplicaciones. Para repasar: 7 × 8, 9 × 6 y 6 más.» Las cuatro tarjetas pasan a una fila secundaria, con menos peso (tipo y color). Comprobar que el titular se calcula en el código y no se escribe a mano.
- **Esfuerzo**: medio (texto generado + reordenar tarjetas).

### P2. La cuadrícula se lee sin leyenda y con «hoy» que no es hoy
- **Pantalla / archivo**: `ChildReportScreen.tsx` (~líneas 170-175, `FactHeatmap` + `FactLegend`).
- **Problema**: la leyenda (Dominada ✓, En camino ↗, Hay que repasarla !, Sin practicar ·) está debajo de las diez filas. Entre amarillo y naranja, el adulto no distingue «en camino» de «hay que repasarla» sin mirar la leyenda, y el signo ↗ es pequeño. Además el subtítulo dice «Así se ve lo que sabe Inessa **hoy**», pero el mapa refleja el estado acumulado de las cajas de repetición (Leitner), no el día. Hay que confirmar esto en el código de `src/adult/shared/heatmap.ts` antes de cambiar el texto.
- **Cambio**: mover la leyenda encima de la cuadrícula, en una línea. Subir el tamaño de los glifos. Cambiar «hoy» por «hasta ahora» (o el texto que corresponda al estado real).
- **Esfuerzo**: bajo.

### P3. La cuadrícula tiene 100 casillas y el total es 55
- **Pantalla / archivo**: `ChildReportScreen.tsx` (cuadrícula) y `src/adult/shared/FactHeatmap.tsx`; también afecta a `ClassScreen.tsx`.
- **Problema**: el adulto ve 100 casillas y lee «34 de 55». La explicación («las casillas se repiten: 7 × 6 y 6 × 7 son la misma») está en un párrafo bajo la cuadrícula. Las casillas duplicadas (p. ej. 6 × 7 y 7 × 6 con el mismo estado) hacen que el porcentaje visual no cuadre con el número.
- **Cambio**: dos opciones. (a) Mostrar solo la mitad triangular (55 casillas), que coincide con el total. (b) Mantener la cuadrícula y añadir en el título «55 multiplicaciones distintas» antes de la tabla, y dejar la nota arriba, no abajo. La opción (a) es más limpia, pero toca el componente compartido con la clase.
- **Esfuerzo**: medio (a) / bajo (b).

### P4. Cinco periodos distintos en una sola pantalla
- **Pantalla / archivo**: `ChildReportScreen.tsx`: «últimos 7 días» (1 h 34 min), «última semana» (78 %), «hoy» (subtítulo de la cuadrícula), «último mes» (errores), y acumulado (34 de 55).
- **Problema**: el adulto no puede comparar cifras que miden tiempos distintos, y «semana» y «7 días» se leen como dos cosas diferentes. El libro (cap. 2, contexto) pide que cada cifra diga su perímetro.
- **Cambio**: un único periodo por defecto («últimos 7 días») en las tarjetas y la cuadrícula, y el acumulado escrito como tal («en total»). Si hace falta el mes, un selector único arriba que cambie todo el informe a la vez.
- **Esfuerzo**: bajo (textos) / medio (selector).

### P5. «Errores más frecuentes» sin unidades
- **Pantalla / archivo**: `ChildReportScreen.tsx` (~líneas 186-200).
- **Problema**: los números «19» y «7» están solos, en un círculo de color. No se sabe si son veces, sesiones o porcentaje. El título de la tarjeta no dice qué se cuenta.
- **Cambio**: «19 veces en el último mes» y, si cabe, el ejemplo concreto («7 × 8 = 54»). Quitar el círculo o reducirlo a un icono sin peso.
- **Esfuerzo**: bajo.

### P6. Tres nombres para el mismo progreso
- **Pantallas / archivos**:
  - `src/world/home/ChildHomeScreen.tsx`: «Cuerno de Lumi · 1 de 8 cristales».
  - `src/world/chest/ChestView.tsx` y `ChestScreen.tsx`: «El Gran Cofre necesita las 8 letras de la palabra secreta» y, debajo, «Gana los 8 cristales para completar la palabra VALIENTE».
  - `src/world/diploma/DiplomaScreen.tsx` (líneas 25-26): «Te faltan 7 cristales para conseguir tu diploma».
  - `src/adult/child/ChildReportScreen.tsx`: «1 de 8 · 1 cristal mágico recuperado»; `src/adult/child/RewardCard.tsx`: «los ocho cristales mágicos».
- **Problema**: en el cofre, el niño lee «letras» y «cristales» en dos frases seguidas y no sabe si son lo mismo. «Cristal» y «cristal mágico» se usan como si fueran cosas distintas. El diploma dice «cristales» y el informe, «cristal mágico». Es el mismo contador.
- **Cambio**: un solo término para el niño («cristal»), con la frase de una línea en el cofre: «Cada cristal te da una letra de VALIENTE. Con los 8, se abre el cofre.» En el informe, «cristales conseguidos».
- **Esfuerzo**: bajo (solo textos).

### P7. El diploma, la meta, no se ve antes de ganarlo
- **Pantalla / archivo**: `/play/diploma`, `src/world/diploma/DiplomaScreen.tsx`.
- **Problema**: la pantalla es un texto centrado («Te faltan 7 cristales para conseguir tu diploma, Inessa.») y un botón. El niño no ve qué va a ganar. Es el punto más emocional del juego y es el que menos se muestra. El diploma sí existe (`DiplomaCertificate.tsx`).
- **Cambio**: mostrar el certificado en gris, con sus 8 huecos de cristal (los conseguidos en color, los que faltan en contorno vacío, como en el libro, fig. 6.4). El texto «Te faltan 7» pasa a un pie.
- **Esfuerzo**: medio (reutilizar `DiplomaCertificate` con estado bloqueado).

### P8. El álbum: barra de color ajena y pestañas cortadas
- **Pantalla / archivo**: `/play/album`, `src/world/album/AlbumView.tsx` y `album.module.css`.
- **Problema**: la barra de «5 de 27 cromos» usa un degradado naranja-morado que no aparece en ningún otro indicador de progreso de la app (el resto usa morado plano). Las pestañas de mundo cortan «El Jardín…» en el borde derecho sin ninguna pista de que se puede deslizar.
- **Cambio**: el mismo color de progreso que en el resto de la app. Las pestañas, con un degradado al borde o una flecha que indique que hay más. Si el número de mundos crece, dos filas en vez de una barra que se desliza.
- **Esfuerzo**: bajo.

### P9. El mapa no marca el siguiente paso (a verificar)
- **Pantalla / archivo**: `/play/w/w1`, `src/world/map/WorldMapScreen.tsx` y su CSS.
- **Problema**: en el Bosque, todos los nodos completados tienen un check verde y las estrellas doradas. El único indicador de «aquí»: el banner de arriba («¡Luna se ha enredado…!»), que es texto. El niño tiene que buscar el nodo pendiente. El informe del adulto sí usa la etiqueta «Aquí está ahora»; el mapa del niño no la tiene.
- **Cambio**: un halo pulsante (suave, sin movimiento si `prefers-reduced-motion`) y una etiqueta corta «Aquí» en el nodo actual. Comprobar antes con una captura del nodo pendiente y de `w2`, que no se revisaron.
- **Esfuerzo**: bajo-medio.

### P10. Panel de clase: síntesis antes del detalle (no verificado en pantalla)
- **Pantalla / archivo**: `/adult/class/:classId`, `src/adult/school/ClassScreen.tsx` (líneas ~140-190).
- **Problema, por el código**: el panel abre con un mapa medio de la clase («Media de N alumnos»), sigue con una lista de alumnos con cuatro datos cada uno, y luego las misiones. Un maestro que llega con prisa no tiene una frase que le diga qué repasar la clase esta semana. La lista de alumnos no está ordenada por necesidad de repaso (el orden es el de llegada).
- **Cambio**: una línea de síntesis arriba («Esta semana, 3 alumnos no han practicado. La tabla del 7 es la que más les cuesta.»), calculada desde los datos, y la lista ordenada por necesidad de repaso, con un botón de orden. Comprobar con una cuenta de prueba antes de cambiar.
- **Esfuerzo**: medio.

### P11. Ajustes de juego dentro del informe
- **Pantalla / archivo**: `ChildReportScreen.tsx`, tarjeta «Ajustes de juego» (debajo de la recompensa).
- **Problema**: el informe del adulto mezcla la lectura (qué sabe el niño) con la configuración (toggles de sonido, voz, tiempo). Los ajustes son acciones distintas, pero ocupan la misma página larga y se leen como más informe.
- **Cambio**: sacarlos a una sección propia con su título, o a un enlace «Ajustes de juego» en la cabecera del informe. El informe termina en el mapa de mundos.
- **Esfuerzo**: bajo-medio.

### P12. Redacción: «la persona adulta» y el masculino genérico
- **Pantalla / archivo**: `src/adult/child/RewardCard.tsx`, texto «Al final de su aventura, Inessa abre el Gran Cofre y encuentra este premio real. Lo prepara la persona adulta.»
- **Problema**: la regla del dueño es el masculino genérico («los adultos»). «La persona adulta» es una fórmula neutra que no sigue esa regla y se lee como cambio de tono frente al resto de la app.
- **Cambio**: «Lo prepara un adulto». Revisar otras apariciones de «persona» con `grep -rn "persona" src/adult src/world`.
- **Esfuerzo**: bajo.

## Orden de trabajo sugerido

1. P2, P4, P5, P6, P12 y P8 (solo textos y colores, un día).
2. P1 y P3 (el informe del adulto, con una comprobación de cifras contra el código de `heatmap.ts`).
3. P7 y P9 (diploma y mapa, con capturas antes y después).
4. P10 y P11 (cuando haya una cuenta de prueba de colegio para revisar la clase).

## Verificación de cifras

Cifras usadas en este informe, todas de la demo: 1 h 34 min, 78 %, 34 de 55, 1 de 8, 44 estrellas, 5 de 27 cromos, 7 cristales que faltan, 19 y 7 errores, y la distribución 34 / 10 / 8 / 3 del pie de la cuadrícula. Ninguna cifra nueva se ha inventado; las frases propuestas usan valores de ejemplo y deben calcularse desde los datos reales.
