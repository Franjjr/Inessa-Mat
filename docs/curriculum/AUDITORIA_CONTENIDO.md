# Auditoría del contenido pedagógico actual de Repasitos

Fecha: 2026-10-22. Alcance: lo que la app hace hoy (src/content, src/engine, src/activities), comparado con el cuaderno PDF «Inessa y la Magia de los Números» (56 págs.) y con lo que se espera al final de 3.º de Primaria. No se ha modificado código. Las cifras de tiempo son estimaciones (ver anexo).

Referencias: rutas relativas a la raíz del repo `/Users/mac13/Desktop/Inessa-Mat`. Los rangos oficiales por ciclo se toman de `docs/curriculum/MATEMATICAS_PRIMARIA.md` (otra fuente de esta misma carpeta; orientativa por curso).

## Resumen ejecutivo

1. **Cuatro errores graves de uso real:** (a) en Burbujas, con voz activa (valor por defecto), se lee la respuesta antes de que el niño conteste; (b) la «Carrera al Castillo» de 3.º tiene una sola pregunta y termina en el primer turno; (c) el truco se muestra siempre encima de cada multiplicación del Bosque y del repaso libre, y en ×1 y ×10 el truco da la respuesta, en ×2 casi, y el texto de 7×8 contiene el 56; (d) el «Cristal escondido» (Jardín) solo hace 4 preguntas, no las 12 configuradas.
2. **Estructura de la sesión incompleta:** no existen el calentamiento oral de 2 min ni el juego de cierre de 3 min del cuaderno; el motor los calcula (`planSession`) pero la interfaz no los usa.
3. **Repaso diario sin prioridad real:** el repaso no es adaptativo, así que las habilidades urgentes compiten en igualdad con las ya dominadas.
4. **Tiempo de cálculo:** de unos 158 min de recorrido por los 8 mundos, unos 98 (≈60 %) son resolver ejercicios. En una sesión de 15 min, entre 5 y 7 min son cálculo real.
5. **Lagunas mayores frente a 3.º:** fracciones, medida, tiempo, dinero, geometría, orden y comparación, cálculo mental, números hasta 9999 y divisiones con dividendo de 3 cifras, problemas de dos pasos y de división, saltos de 7, 8, 9 y 10.
6. **Cobertura de tablas:** las 55 multiplicaciones y las 55 divisiones aparecen en algún sitio, pero la tabla del 9 casi no se practica (3×9, 4×9 y 9×9 solo en una prueba de lección) y los saltos de 7 a 10 no aparecen nunca.
7. **Lo que está bien:** las cuentas de las lecciones son correctas (352−127, 368+257, 503−128, 2624+1728, 47×6, 23×3, 42÷6, 17÷5, 72÷3); las 8 claves del Hechizo coinciden con el pergamino del cuaderno (VALIENTE); los umbrales de los guardianes (7 de 8, 5 de 6) coinciden con el cuaderno; `npx vitest run src/engine` pasa (189 de 189).

---

## 1. Inventario

### 1.1 Orden de los mundos (igual que el cuaderno)

| Mundo | Foco | Nodos en orden (historia, lección, actividad, guardián) |
|---|---|---|
| w1 Bosque | Qué es multiplicar, espejo, tablas 1, 2, 5, 10 | historia → lección «¿Qué es multiplicar?» → grupos (6) → arrays (6) → lección «Las tablas fáciles» → collares 2–5 (4) → historia → práctica con trucos (12) → parejas 2–5 (6) → guardián |
| w2 Río | Valor posicional, sumas de 3 y 4 cifras | historia → lección casas → sumas 3d c0 (4, guiado) → lección llevadas → sumas 3d c1–c3 (6) → historia → sumas 4d (5) → problema (3) → burbujas tablas 2, 5, 10 (8) → guardián |
| w3 Cueva | Tabla del 6 (dos trucos) | historia → lección «el 5 y uno más» → collar de 6 (3) → rueda del 6 (8) → lección «pares que riman» → historia → laberinto del 6 (1) → factor que falta (6) → repaso sumas (2) → guardián |
| w4 Montaña | Restas de 3 y 4 cifras, ceros, prueba | historia → lección «restar» → restas 3d (5, guiado) → lección del cero → restas con cero (4) → historia → restas 4d con prueba (4) → problema (3) → memoria del 6 (6) → guardián |
| w5 Lago | Tabla del 8 | historia → lección «doble, doble y doble» → cadena de dobles (5) → rueda del 8 (8) → lección «secretos del 8» → historia → laberinto del 8 (1) → burbujas 6 y 8 (10) → repaso restas (2) → guardián |
| w6 Jardín | Tabla del 7, truco del 9, mezcla 6–8 | historia → lección «casi toda» → rueda del 7 (8) → lección del 9 → factor que falta (6) → cristal escondido (dibujo) → historia → parejas 6–8 (6) → carrera contra tu récord (20) → guardián |
| w7 Forja | Multiplicar 2 cifras × 1 | historia → lección «por trocitos» → en columna sin llevadas (4) → lección con llevadas → con llevadas (6) → historia → Carrera al Castillo (1 pregunta, ver E2) → problema (3) → repaso (8) → guardián |
| w8 Castillo | Dividir | historia → lección «dividir es repartir» → repartos (4) → familias de números (3) → divide con tablas (10) → lección de la casita → divisiones exactas y con resto (6) → historia → reto de la torre, división larga (3) → guardián |

Además: 26 historias (prólogo, 8 de llegada, 8 de medio, 8 de rescate, final), 16 lecciones con 22 pasos «prueba», 8 guardianes (6–8 ejercicios + Hechizo del Cristal), repaso diario de 8 ejercicios, «Juego libre» (desbloquea los juegos ya alcanzados).

### 1.2 Operaciones y rangos que se practican hoy

| Contenido | Rango practicado | Dónde |
|---|---|---|
| Sumas en columna | 3 cifras (0–3 llevadas) y 4 cifras (0–4 llevadas); en el 20 % de los casos el segundo sumando tiene 3 cifras | w2 (columna, guardián, repaso) |
| Restas en columna | 3 cifras (0–2 préstamos y ceros), 4 cifras (0–3 y ceros), prueba mágica en 4 cifras | w4, w5 |
| Multiplicación de hechos | 55 hechos de 1×1 a 10×10 (todos aparecen al menos una vez) | w1–w6, guardianes |
| Multiplicación 2 cifras × 1 | Multiplicando 12–99, multiplicador 2–9; con y sin llevada | w7 |
| Multiplicación 3 cifras × 1 | **No existe** | — |
| Saltos (contar de N en N) | N = 2, 3, 4, 5, 6 | w1 (2–5), w3 (6) |
| Saltos de 7, 8, 9, 10 | **No existen** (el cuaderno sí tiene «Tentáculos en el lago», saltos de 8) | — |
| Dobles (cadena de 3 dobles) | ×8 en w5; ×4 solo como ejemplo en la lección del Lago | w5 |
| División de hechos | 55 hechos con divisor de 2 a 9 | w8 |
| División de 2 cifras entre 1 | Dividendo 10–99, divisor 2–9; exacta, con resto y «larga» (solo 3 ejercicios) | w8 |
| División de 3 cifras | **No existe** | — |
| Problemas (plantillas) | 35 plantillas: suma 8, resta 8, multiplicación 10, división 9 | solo aparecen en w2 (suma), w4 (resta), w7 (multiplicación) |
| Problemas de división en el mapa | **Ninguno** (aunque hay 9 plantillas) | — |
| Problemas de dos pasos | **No existen** | — |
| Valor posicional | Solo como lección y como ayuda en la suma | w2 |

### 1.3 Ejercicios por actividad (partida típica)

Generados con 120–200 semillas por actividad. «Distintos» = combinaciones diferentes en esas semillas.

| Nodo | Tipo | Ejercicios por partida | Práctica (selector) | Distintos | Notas |
|---|---|---|---|---|---|
| w1 groups | groups | 6 | concepto de grupos, factores 2–5 | 16 | Armar grupos con toques es obligatorio; el enunciado ya dice «hay X grupos de Y» |
| w1 array | array | 6 | filas × columnas, factores 2–6 | 25 | Espejo (`mirror`) activo por defecto |
| w1 necklace | skip-count | 4 collares | saltos 2, 3, 4, 5 | 232 | 10 cuentas, 2–4 huecos |
| w1 facts | fact-mul | 12 | tablas 1, 2, 5, 10 | 64 | Truco visible (E3) |
| w1 memory | fact-mul | 6 parejas | factores 2–5 | 16 | Emparejar |
| w1 guardián | mix | 8 | 5 hechos, 1 factor que falta, 1 array, 1 groups | — | Hechizo 7×5 = 35 → V |
| w2 column-easy | column-add | 4 | 3d c0, guiado | 796 | |
| w2 column-carry | column-add | 6 | 3d c1–c3 | 1199 | |
| w2 column-4d | column-add | 5 | 4d c0–c4 | 1000 | |
| w2 word | word-problem | 3 | suma (3d/4d con llevada) | 600 | |
| w2 bubbles | fact-mul | 8 | tablas 2, 5, 10 × 2–9, 4 burbujas | 44 | 12 s por pregunta si hay tiempo |
| w2 guardián | column-add | 6 | 3 de 3d + 3 de 4d | — | Hechizo 2486 + 1357 = 3843 → A |
| w3 necklace | skip-count | 3 | saltos de 6 | 90 | |
| w3 wheel | fact-mul | 8 | 6 × {3, 7, 4, 9, 6, 8, 2, 5} | 15 | |
| w3 maze | fact-mul | 1 laberinto 6×6 | tabla 6 | 19 | Reconocer múltiplos (E-maze, ver §2) |
| w3 missing | missing-factor | 6 | tabla 6 | 30 | |
| w3 review-river | column-add | 2 | 3d c2, 4d c2 | 400 | |
| w3 guardián | fact-mul + missing | 8 | tabla 6/7 | — | Hechizo 7×6 = 42 → L |
| w4 column-3d | column-sub | 5 | 3d b0–b2 | 998 | Guiado |
| w4 column-zero | column-sub | 4 | 3d z | 777 | |
| w4 column-4d | column-sub | 4 | 4d b0–b3, z | 800 | Prueba mágica (solo aquí) |
| w4 word | word-problem | 3 | resta 3d/4d | 600 | |
| w4 memory | fact-mul | 6 parejas | tabla 6 × 2–9 | 15 | |
| w4 guardián | column-sub | 6 | 3 de 3d + 3 de 4d | — | Hechizo 4521 − 1367 = 3154 → I |
| w5 chain | double-chain | 5 | 8 × 2–9 | **9** | Pocas variantes |
| w5 wheel | fact-mul | 8 | 8 × {4, 7, 3, 9, 6, 8, 2, 5} | 15 | |
| w5 maze | fact-mul | 1 laberinto 6×6 | tabla 8 | 19 | |
| w5 bubbles | fact-mul | 10 | tablas 6 y 8 × 3–9 | 24 | |
| w5 review-mountain | column-sub | 2 | 3d b2, 4d z | 400 | |
| w5 guardián | fact-mul + missing | 8 | 8 × 3–9 | — | Hechizo 8×7 = 56 → E |
| w6 wheel | fact-mul | 8 | 7 × {3, 6, 9, 4, 7, 2, 8, 5} | 15 | |
| w6 missing | missing-factor | 6 | tabla 7 | 30 | |
| w6 pixel | fact-mul | **4 preguntas** (`count: 12` ignorado, E8) | 7×6, 7×7, 7×8 y una genérica | 17 | |
| w6 memory | fact-mul | 6 parejas | tablas 6, 7, 8 × 3–9 | 33 | |
| w6 race | fact-mul | 20 | tablas 6, 7, 8 × 2–9 | 39 | Contra tu récord |
| w6 guardián | fact-mul + missing | 8 | 6, 7, 8 | — | Hechizo 7×7 = 49 → N |
| w7 column-easy | column-mul | 4 | mul 2×1 c0, guiado (`split` ignorado, E10) | 113 | |
| w7 column-carry | column-mul | 6 | mul 2×1 c1 | 469 | |
| w7 board | fact-mul | **1 pregunta** (E2) | tablas 6, 7, 8 × 2–9 | 39 | |
| w7 word | word-problem | 3 | mul 2×1 y 1×1, elige operación | 486 | |
| w7 review | mixto | 8 | repaso diario | — | No adaptativo (E5) |
| w7 guardián | column-mul | 6 | 2 c0 + 4 c1 | — | Hechizo 47 × 6 = 282 → T |
| w8 share | fact-div | 4 | divisiones de 2–5 | 16 | |
| w8 family | fact-family | 3 | familias 6, 7, 8 × 2–9 | 18 | |
| w8 facts | fact-div | 10 | divisiones de 6, 7, 8 × 2–9 | 39 | `showTrick` sin efecto (E11) |
| w8 division | division | 6 | exacta y con resto, 2 cifras ÷ 1 | 279 | Prueba de la división |
| w8 division-expert | division | 3 | larga (2 cifras ÷ 1, con «bajar») | 58 | Solo 3 ejercicios |
| w8 guardián | fact-div + division | 6 | 3 + 2 + 1 | — | Hechizo 63 ÷ 3 = 21 → E |

Lecciones (pasos «prueba» en las que hay que acertar para seguir): w1 2+2, w2 1+2, w3 1+1, w4 1+2, w5 1+1, w6 1+1, w7 1+1, w8 2+2.

---

## 2. Tiempo de práctica

### 2.1 Supuestos (estimaciones, ±30 %)

| Elemento | Tiempo |
|---|---|
| Hecho tecleado (tabla) | 6–8 s; con truco visible, +3 s |
| División de hechos | 8 s |
| Suma 3 cifras sin llevadas / con llevadas | 25 s / 35 s |
| Suma 4 cifras | 50 s |
| Resta 3 cifras / con ceros | 40 s / 55 s |
| Resta 4 cifras con prueba | 60 s |
| Multiplicación 2×1 sin / con llevada | 25 s / 35 s |
| División exacta / con resto / larga | 40 s / 30 s / 55 s |
| Problema escrito | 40 s |
| Salto (collar) | 15 s por collar |
| Rueda, factor que falta | 6 s / 8 s por pregunta |
| Burbujas | 6 s por pregunta |
| Memoria (6 parejas) | 90 s (juego) |
| Laberinto | 90 s (juego/reconocimiento) |
| Historia: llegada / medio / rescate | 2 min / 1 min / 1,5 min |
| Lección: paso de texto / paso «prueba» | 8 s / 20 s |
| Guardián (intro + ejercicios + Hechizo) | 5 min, más 1,5 min de rescate |

### 2.2 Recorrer un mundo (minutos totales / de cálculo / %)

| Mundo | Total | Cálculo efectivo | % cálculo | Comentario |
|---|---|---|---|---|
| w1 Bosque | 19 | 9 | 47 % | Grupos y arrays con mucho armado; memoria y collares |
| w2 Río | 25 | 18 | 72 % | Columnas: el mejor mundo de cálculo |
| w3 Cueva | 14 | 7 | 49 % | Laberinto y rueda son poco cálculo |
| w4 Montaña | 26 | 18 | 70 % | Restas largas |
| w5 Lago | 15 | 7 | 45 % | Cadena y laberinto; pocas tareas largas |
| w6 Jardín | 16 | 8 | 53 % | Cristal de 4 preguntas (E8) |
| w7 Forja | 22 | 16 | 73 % | Carrera con 1 pregunta (E2). Con 12 preguntas sumaría ~8 min de juego |
| w8 Castillo | 21 | 15 | 70 % | Divisiones: alto cálculo |
| **Total** | **≈158** | **≈98** | **≈62 %** | |

### 2.3 Una sesión típica de 15 minutos

El motor propone 2 min de calentamiento (no se usa), un nodo del mapa y 8 ejercicios de repaso (sí se usa), y un juego de cierre (no se usa). En la app real: repaso de 8 ejercicios (≈4 min, casi todo cálculo), un nodo (lección 2–3 min con ≈1 min de cálculo; o actividad 2–4 min con 1,5–3 min de cálculo), y entre 1 y 2 min de menús y transiciones. Resultado: **5–7 min de cálculo de 15 (35–45 %)**. El cuaderno pide 10 min de cálculo de 15 (≈ 65 %).

### 2.4 Acertar sin pensar o adivinando

- **Burbujas (w2, w5):** 4 opciones, azar 25 %. Las burbujas erróneas siguen pulsables, así que el niño puede ir probando hasta acertar (solo cuenta el primer toque). Además, con voz activa se lee la respuesta antes de contestar (E1).
- **Hechos con truco visible (w1, repaso libre):** para ×1 el truco es «el número se queda igual»; para ×10, «pon un 0 detrás del 7» (es 70); para ×2, «suma 8 + 8»; para ×5, «calcula 3 × 10 y toma la mitad». El niño solo copia (E3).
- **Laberinto (w3, w5):** cada celda se evalúa como «¿es múltiplo de la tabla?» (`src/activities/maze/index.tsx:83`), no como cálculo; las pistas dejan probar sin coste.
- **Memoria (w1, w4, w6):** emparejar por ensayo y error; el cálculo explícito es mínimo.
- **Collares (w1, w3):** el niño puede leer el número que falta a partir de las cuentas vecinas (2, 4, _, 8 → 6) sin recordar la tabla. Es un salto, pero se resuelve por contexto.
- **Grupos (w1):** el enunciado ya da grupos y tamaño; el armado es obligatorio, pero el total se puede responder sin contar.
- **Mapa de la Carrera al Castillo:** la casilla «Di la tabla del 7 en voz alta» no se comprueba (autocontrol), como en el cuaderno.

Mastery: en Burbujas, el tipo `tap` tiene umbral de 4 s (`src/engine/mastery.ts:19`), así que un acierto por azar y rápido sube la caja (E7).

---

## 3. Comparación con el cuaderno PDF

Leyenda: **Sí** (está), **Parcial**, **No**, **Distinto** (hecho de otra forma).

| Contenido del cuaderno | En la app | Estado |
|---|---|---|
| Orden de niveles: tablas fáciles y espejo, sumas, tabla del 6, restas, tabla del 8, tabla del 7, 2×1, dividir | Mismo orden de mundos | Sí |
| Historia por nivel leída en voz alta | 26 historias (llegada, medio, rescate) | Sí / Distinto (las historias van entre nodos, no al inicio de un «día») |
| Lección «¿qué es multiplicar?» con grupos y espejo | w1 «¿Qué es multiplicar?» y «Las tablas fáciles» | Sí |
| Dibujar grupos y filas en el papel («Dibuja tú») | No | No (deliberado, la app no tiene papel) |
| Escribir la suma y la multiplicación (Prueba 1) | Solo se muestra la suma como texto (`showSum`, solo en w1) | Parcial |
| Collares de saltos 2, 3, 4, 5 | w1 | Sí |
| Collares de saltos 6, 7, 8, 9, 10 | Solo el 6 (w3) | Parcial |
| Mapa de las tablas (100 casillas, al inicio y al final) | No para el niño (`factGrid` solo en el panel de adultos) | No |
| Tablas 1, 2, 5, 10 con trucos | w1 (con truco visible, E3) | Sí / Distinto |
| Tabla del 6: el 5 y uno más, pares que riman, patas, rueda, laberinto, factor que falta | w3 | Sí |
| Tabla del 8: doble, doble y doble; patrón de las unidades; «5, 6, 7, 8»; laberinto; mezcla 6 y 8 | w5 | Sí (patrón de unidades solo en lección) |
| Tentáculos en el lago (saltos de 8, hasta 80) | No | No |
| Tabla del 7: semanas, «siete por siete», truco del 9, rueda, factor que falta | w6 | Sí |
| Cristal escondido (dibujo por productos) | w6 (4 preguntas, E8) | Parcial |
| Carrera contra ti misma (cronómetro, tres intentos en papel) | w6 race (sin intentos guardados) | Parcial |
| Sumas de 3 y 4 cifras con llevadas, con «colócalas tú» | w2 | Sí (el parámetro `place` no hace nada, E10) |
| Problema del río: 1245 + 2368 | w2 word | Sí |
| Restas de 3 y 4 cifras, préstamo, ceros | w4 | Sí |
| Prueba mágica (la resta comprobada) | w4 y w8 (en la lección también) | Sí |
| Comprobar si una resta dada está bien (L4, Prueba 3) | No | No |
| Multiplicar por trocitos (32 × 3 = 30 × 3 + 2 × 3) | Solo en lección; el parámetro `split` no hace nada (E10) | Parcial |
| Multiplicación en columna sin llevadas y con llevadas | w7 | Sí |
| Problema de 8 escudos × 15 piedras | w7 word | Sí |
| División: reparto de puntitos, familias, divide con tablas, la casita, resto, división para expertas | w8 | Sí |
| Problema de reparto («48 estrellas entre 4 hadas», «63 estrellas en 3 torres») | Solo en el guardián; ningún problema de división en el mapa | Parcial |
| Calentamiento oral de 2 min con cartas mágicas | No (`warmup` del motor no se usa, E4) | No |
| Cartas mágicas en tres montones «Lo sé · Casi · Todavía no» | No (el sistema de cajas existe pero es invisible) | No |
| Juego de cierre de 3 min (tablero o cartas) | No (`game` del motor no se usa, E4) | No |
| Carrera al Castillo (30 casillas, sorpresas) | w7 (1 pregunta, E2) | Parcial (roto) |
| Comodín de Lumi («inventa una multiplicación para papá») | No | No |
| Guardianes: 6–8 ejercicios, 7 de 8 o 5 de 6, Hechizo del Cristal | Igual | Sí |
| Pergamino del código: letras del Hechizo | Igual: V, A, L, I, E, N, T, E = VALIENTE | Sí |
| Enséñale a Borrón (explicar un truco, Gran Final) | Juego definido en `src/content/meta.ts:6` pero sin conexión en la interfaz | No |
| Ritmo: un nivel cada 3 días, 4 semanas | Sin calendario; avance libre | Distinto |
| Consejos a la familia (elogio, error como pista, sin prisas, en voz alta) | Feedback del juego con tono cuidado; «Juego libre» y el truco a la vista | Parcial |

---

## 4. LAGUNAS (priorizadas)

Las referencias de 3.º son orientativas: la ley fija el segundo ciclo (3.º–4.º) con naturales hasta 9999 y fracciones propias de denominador hasta 12 (`docs/curriculum/MATEMATICAS_PRIMARIA.md`, sección «Marco legal por ciclo»). Lo que cada comunidad exige por trimestre hay que confirmarlo con su currículo.

### Prioridad alta

- **L1. Números hasta 9999 y valor posicional completo.** Hoy los operandos llegan a 4 cifras solo en sumas y restas. Faltan lectura, escritura y comparación de números (`<`, `>`, `=`, ordenar), descomposición (4 000 + 300 + 20 + 5) y de la centena al millar.
- **L2. Fracciones sencillas.** Ninguna: ni mitades, tercios y cuartos, ni fracción de una cantidad («¼ de 20»), ni comparación. El rango de ley para el segundo ciclo es denominador hasta 12.
- **L3. Problemas de dos pasos y de división.** Ninguno de dos pasos. Ningún problema de división aparece en el mapa, aunque el motor tiene 9 plantillas.
- **L4. Dinero.** Ni euros ni céntimos (sumar precios, dar el cambio). La ley fija monedas y billetes en el primer ciclo.
- **L5. Tiempo.** Lectura del reloj (horas, medias, cuartos), horas y minutos, duraciones. Ni un ejercicio.
- **L6. Medida.** Longitud (cm, m, km), capacidad (l, ml), masa (kg, g). Ni un ejercicio. Son contenidos del segundo ciclo.
- **L7. Multiplicar por 10, 100 y 1000, y dividir entre una cifra con dividendo de 3 cifras.** Hoy el dividendo máximo es 99 (`genDivision`, división 2 cifras). Las programaciones de 3.º que se han consultado piden dividir de dos y tres cifras entre una cifra.
- **L8. Cálculo mental.** Ni un ejercicio sin escritura: dobles y mitades de decenas (40 + 30, 120 − 50), completar a la decena o a 100, sumar mentalmente. El cuaderno lo pide en el calentamiento oral y el currículo lo fija en todos los ciclos.

### Prioridad media

- **L9. Saltos de 7, 8, 9 y 10.** Solo se practican saltos de 2 a 6. El cuaderno tiene saltos de 8 («Tentáculos en el lago»).
- **L10. Multiplicar 3 cifras × 1 cifra.** Hoy solo 2 cifras × 1 (`genMul2x1`). Muchas programaciones de 3.º lo incluyen.
- **L11. Descomposición por trocitos como ejercicio.** Solo hay lección. El cuaderno pide escribir 32 × 3 = 30 × 3 + 2 × 3.
- **L12. Geometría.** Líneas, ángulos rectos, polígonos (triángulo, cuadrado, rectángulo), cuerpos sencillos. Ninguno.
- **L13. Estimación y redondeo** a decenas y centenas. Ninguno.
- **L14. Comprobar un resultado dado** («¿352 − 127 = 226 está bien?»). El cuaderno lo pide en L4, Prueba 3.
- **L15. Tabla del 9 como tabla.** 3×9, 4×9 y 9×9 aparecen solo en una prueba de la lección del 9. La tabla no tiene práctica propia ni repaso.
- **L16. Sesión de 15 min completa.** Calentamiento oral de 2 min y juego de cierre de 3 min (E4). Sin ellos no hay variedad de formato ni fluidez oral.
- **L17. Fluidez oral.** Ni un modo de respuesta por voz. El cuaderno pide decir «seis por siete, cuarenta y dos» en voz alta; la app solo la lee.
- **L18. Cartas de repaso visibles** («Lo sé · Casi · Todavía no»). Hoy el niño no ve su progreso por hecho, salvo en el mapa de adultos.

### Prioridad baja

- **L19. Problemas de comparación y de cambio** («cuántos más», «quién tiene más»). Parcial, solo restas.
- **L20. Series y patrones no numéricos** (secuencias de figuras, regularidades). Ninguno.
- **L21. Sumas y restas de tres sumandos** y con cero en medio. Ninguno.
- **L22. Mapa de las tablas** en papel o en pantalla (100 casillas) al empezar y al terminar.
- **L23. Comodín de Lumi** (el niño inventa una multiplicación para un adulto) y **Enséñale a Borrón** (ya definido y sin conectar).
- **L24. Conmutatividad como concepto evaluable.** `concept:commutative` existe pero ningún selector lo usa; el espejo solo aparece en `array`.

---

## 5. ERRORES (cosas mal hechas)

Ordenados por gravedad para el niño. Las rutas son relativas a la raíz del repo.

### E1. Burbujas lee la respuesta antes de contestar (alta)

- **Dónde:** `src/activities/bubbles/index.tsx:79`: `if (q && host.prefs.voice) speakFact(q.ex.a, q.ex.b, '×', q.ex.answer)`. Se ejecuta al empezar cada pregunta.
- **Efecto:** con voz activa (`src/types/child.ts:67`, valor por defecto `true`), el niño oye «seis por siete, cuarenta y dos» antes de elegir.
- **Arreglo:** pasar solo los factores, `speakFact(q.ex.a, q.ex.b, '×')`, y leer el resultado tras el acierto (no antes). Añadir un test que compruebe que el texto de la voz no contiene la respuesta.

### E2. La Carrera al Castillo tiene una sola pregunta (alta)

- **Dónde:** `src/content/worlds/w7.ts:42` (`count: 1`); `src/activities/board/index.tsx:41` (`generate(..., config.count ?? 12)`) y `:128` (`if (qIdx + 1 >= exercises.length) return endRace(false)`).
- **Efecto:** la partida termina tras el primer turno. El niño tira el dado una vez, y casi siempre pierde.
- **Arreglo:** `count: 20` (o 12) en `w7.ts:42`, y comprobar que el número de preguntas no limita las vueltas posibles (30 casillas, avance de 1 a 6 por acierto).

### E3. El truco se muestra siempre, y para algunas tablas es la respuesta (alta)

- **Dónde:**
  - `src/activities/facts/index.tsx:38`: `trick = params.showTrick && ex?.kind === 'fact-mul' ? strategyForFact(ex.a, ex.b) : null`, que se pinta encima de la tarjeta antes de contestar (líneas 73–78).
  - `src/content/worlds/w1.ts:52`: `showTrick: true` en la práctica del Bosque (tablas 1, 2, 5, 10).
  - `src/world/free/logic.ts:45`: `tableDrill` pone `showTrick: true`, aunque su instrucción dice «Si necesitas ayuda, usa el truco».
  - `src/engine/strategies.ts:21` (×1: «el número se queda igual»), `:40` (×10: «pon un 0 detrás del n»), `:50` (×2: «suma n + n»), `:69` (7×8: «¡cincuenta y seis es siete por ocho!», la respuesta literal).
- **Efecto:** en el Bosque el niño no necesita recordar nada en ×1, ×2, ×10. El texto del 7×8 contiene el 56.
- **Arreglo:** mostrar el truco solo tras un fallo o a petición (botón «Pista», como los niveles de `hintsFor`). Reescribir `strategies.ts:69` sin el resultado: «5, 6, 7, 8: ¿cuál de estos números sale de 7 por 8?». En ×1, ×2 y ×10 dar el mecanismo sin el número final («¿Qué pasa con el 0?»).

### E4. Calentamiento y juego de cierre del motor no se usan (media)

- **Dónde:** `src/engine/session.ts:58–62` (calentamiento: `warmup`), `:89` (`game: pickGame(...)`). En la interfaz solo se usa `.review` (`src/world/review/logic.ts:24`).
- **Efecto:** la sesión de 2 + 10 + 3 minutos del cuaderno no existe; el código muerto da una falsa sensación de cobertura.
- **Arreglo:** o bien conectarlo al inicio de la pantalla de sesión, o bien borrar `warmup` y `game` de `planSession` y documentarlo en `docs/PEDAGOGY.md`.

### E5. El repaso diario no prioriza lo urgente (media)

- **Dónde:** `src/engine/session.ts:93–95` (`selectorForSkills` no pone `adaptive`) y `src/world/review/logic.ts:27`.
- **Efecto:** `generate` usa `planUniform` (`src/engine/generate.ts:647`): las habilidades urgentes (caja 0, vencidas) y las ya dominadas se eligen con el mismo peso. El orden que hace `dueSkills` se pierde.
- **Arreglo:** `selectorForSkills(skills)` debe devolver `{ skills, adaptive: true }`, o pasar `adaptive: true` en `buildReviewSession`.

### E6. El límite de 3 hechos nuevos es por llamada, no por sesión (media)

- **Dónde:** `src/engine/generate.ts:640`: `const budget: NewBudget = { hardFacts: 3, ... }` dentro de `generate()`.
- **Efecto:** cada actividad de la sesión tiene su propio presupuesto. Dos o tres actividades con hechos difíciles pueden introducir 6 o 9 hechos nuevos, contra lo que dice `docs/PEDAGOGY.md` (principio 4).
- **Arreglo:** pasar el presupuesto por sesión a través de `GenerateOptions` (y reiniciarlo en `planSession`).

### E7. La fluidez de la respuesta por botón infla la caja (media)

- **Dónde:** `src/engine/mastery.ts:19` (`tap: 4000`). En `src/activities/bubbles/index.tsx:190` (`disabled={popped !== null}`), la burbuja errónea sigue pulsable.
- **Efecto:** un acierto al azar en menos de 4 s sube la caja. Además el niño puede probar hasta acertar. Solo el primer toque se registra, pero el resultado de las pruebas encadenadas lo aprende el niño.
- **Arreglo:** que una burbuja fallada quede bloqueada (`disabled` por valor), y que un acierto con opciones no suba la caja si hubo un fallo previo en esa pregunta. Valorar un umbral propio para `tap`, más bajo o sin «fluido».

### E8. «Cristal escondido»: 4 preguntas y no 12 (media)

- **Dónde:** `src/content/worlds/w6.ts:53` (`count: 12`); `src/activities/pixel/index.tsx:82` (`max = config.count ?? list.length`), pero la lista sale de las claves de color (3 productos + 1 genérica), así que tiene 4 elementos.
- **Efecto:** la actividad dura un minuto. El `count` engaña al que lee la configuración.
- **Arreglo:** o bien generar varias preguntas por color (y que el dibujo tenga más celdas de cada color), o bien poner `count` acorde y documentarlo.

### E9. Enséñale a Borrón no está conectado (media)

- **Dónde:** `src/content/meta.ts:6` define `TEACH_BACK_ACTIVITY`; `src/content/index.ts:95` lo exporta; solo lo usan los tests (`src/content/__tests__/helpers.ts`).
- **Efecto:** el juego final no se juega. La Gran Final se queda sin su propio cierre.
- **Arreglo:** conectarlo en la historia final (`src/content/stories/finale.ts`) o quitarlo.

### E10. Parámetros que la documentación promete y el código ignora (baja-media)

- **Dónde:** `src/content/worlds/w7.ts:26` (`split: true`), `src/content/worlds/w2.ts:43` (`place: true`), y `src/content/README.md:63` los describe como `place?` y `split?`. `src/activities/column/index.tsx:35–36` solo lee `guided` y `proof`.
- **Efecto:** el niño no recibe la ayuda prometida («Colócalas tú», «Primero las unidades»).
- **Arreglo:** implementarlos o quitarlos del README y de la configuración.

### E11. `showTrick` en divisiones no hace nada (baja)

- **Dónde:** `src/content/worlds/w8.ts:41` (`showTrick: true` en «Divide con las tablas», `fact-div`). `src/activities/facts/index.tsx:38` solo mira los `fact-mul`.
- **Efecto:** un parámetro que parece activo y no lo está. Si se quiere ayuda en divisiones, falta el truco de división («¿6 por cuánto da 42? Piensa en 6 × 7»).
- **Arreglo:** quitar el parámetro, o añadir una estrategia de división en `src/engine/strategies.ts` con su texto de pista.

### E12. Elogio de estrategia no ligado a lo que hizo el niño (baja)

- **Dónde:** `src/engine/feedback.ts:44` («¡El 5 y uno más funciona de maravilla!») y `:53` (`praiseFact` usa la estrategia del hecho, no la del niño).
- **Efecto:** se elogia un truco que el niño no ha usado. Va contra el principio 10 de `docs/PEDAGOGY.md`.
- **Arreglo:** elogiar la estrategia solo si el niño la pidió (pista usada) o usar un elogio neutro.

### E13. Pista «la de al lado» ambigua (baja)

- **Dónde:** `src/engine/feedback.ts:64`: `¡Casi! ${given} es ${a} × ${b}, la de al lado.`
- **Efecto:** «al lado» no dice al niño en qué tabla. Confunde si el hecho no es de la tabla que se practica.
- **Arreglo:** `¡Casi! ${given} es ${a} × ${b}: ese número está en la tabla del ${b}.` (o del ${a}, según corresponda).

### E14. La pista de nivel 3 de la división da el cociente (baja)

- **Dónde:** `src/engine/hints.ts:105`: `${d} × ${q} = ${d * q}. Sobran ...`, en las divisiones con cociente de una cifra.
- **Efecto:** el niño no tiene que encontrar el cociente; solo restar.
- **Arreglo:** pedir primero el producto: «¿Cuánto es 5 × 3? Ese número ¿se acerca a 17 sin pasarse?».

### E15. Magnitudes poco creíbles en los problemas (baja)

- **Dónde:** `src/engine/wordProblems.ts:42` (`sub-tazas`, «8654 tazas»), `:37` (`add-margaritas`, «4193 margaritas»), `:39` (`add-borron`, 2–3 cifras con «números»), `:50` (`sub-saltos`: «La Rana Saltarina ha dado {a} saltos y {pet} ha dado {b}» mezcla personajes).
- **Efecto:** el texto no encaja con la vida de un niño de 8 años y pierde credibilidad.
- **Arreglo:** bajar `maxDigits` de las historias de objetos sueltos (tazas, margaritas) y reservar las 4 cifras para tesoros o distancias.

### E16. Problemas con una sola clave de mastery (baja)

- **Dónde:** `src/engine/make.ts` (`makeWordProblem` usa `word:add`, `word:sub`…, sin distinguir cifras).
- **Efecto:** un acierto en «suma de 4 cifras» sube la caja de «suma de 2 cifras» y viceversa. El mastery de sumas de llevada no recibe datos de los problemas.
- **Arreglo:** que la clave incluya cifras y llevadas (`word:add:3d:c1`), o documentar la limitación.

### E17. Laberinto y Burbujas: el niño no escribe el producto (baja)

- **Dónde:** `src/activities/maze/index.tsx:52` (`makeFactMul(table, ...)`) y `:83` (`multiple = ... % table === 0`).
- **Efecto:** el laberinto evalúa reconocimiento de múltiplos, no cálculo. Es un juego válido, pero no debe contar como práctica de cálculo en los informes a la familia.
- **Arreglo:** registrar esas celdas como `recognition`, o mostrar al final la multiplicación que se ha reconocido.

---

## 6. Qué está bien (para no tocarlo)

- Las lecciones son correctas en sus cuentas y en sus frases («63 = 7 × 9», «47 × 6 = 282», «23 × 3 = 69»). Revisadas todas las de `src/content/lessons`.
- Según el encabezado de `src/activities/views/ColumnView.tsx`, las marcas de llevada y préstamo son ayuda y no se corrigen; así cabe el método del cole que pide el cuaderno (conviene confirmarlo con un caso real de resta con compensación).
- Mensajes de error con el nombre de la columna («Te has dejado la llevada en las decenas») y con pista de estrategia.
- Hechizos y letras: V, A, L, I, E, N, T, E, con las mismas cuentas que el pergamino (35, 3843, 42, 3154, 56, 49, 282, 21).
- Guardianes: 6 u 8 ejercicios, 5 o 7 aciertos para pasar, igual que el cuaderno.
- Las pruebas del motor pasan: `npx vitest run src/engine`, 8 archivos, 189 pruebas.

---

## Anexo: método

- Lectura de `src/content/worlds/*.ts`, `lessons/*.ts`, `guardians.ts`, `stories/*.ts`, `src/engine/*.ts` y de las actividades que cita cada hallazgo.
- Muestreo con el motor empaquetado en una carpeta temporal (fuera del repo): 200 semillas por nodo de actividad, con el mismo `count` y selector del mundo; comprobación de habilidades pedidas frente a generadas (0 discordancias en columnas y hechos; solo `word:*` como habilidad propia de los problemas); rangos de división, multiplicación y resta; trucos de los 55 hechos; mensajes de corrección con respuestas erróneas construidas a mano.
- Cobertura de habilidades: las 55 multiplicaciones y 55 divisiones se generan en alguna actividad; los saltos solo de 2 a 6.
- Tiempos: supuestos de la tabla 2.1 aplicados a la cuenta de ejercicios, historias (conteo de escenas y caracteres) y pasos de lección. Son orden de magnitud (±30 %), no mediciones con niños.
- No se ha reproducido audio, no se ha tocado código ni se ha creado ningún otro archivo en el repo.
