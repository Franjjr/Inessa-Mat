# Auditoría del módulo de matemáticas de Repasitos

*Noviembre de 2026. Informe para la familia: qué le pasa a Inessa, por qué y qué se va a arreglar.*

Han trabajado trece revisores, cada uno en una parte de la app: el corrector, la escritura a mano, los métodos, las lecciones, las clases, las pantallas, las pistas, la voz y el recorrido real en la tablet. Después un crítico comprobó su trabajo. Todo lo que aparece aquí se ha comprobado con pruebas que se pueden repetir o con capturas de la app real. Lo que no se pudo comprobar lo dice el propio texto.

---

## 1. Resumen: por qué Inessa se confunde

1. **La app no se equivoca haciendo cuentas.** Revisamos más de 35 000 ejercicios y todas las frases de las lecciones, pistas y voz. Ninguna cuenta que la app hace por su cuenta está mal.
2. **Pero a veces da por mala una respuesta buena.** Es lo de la foto 1: Inessa escribió 172 en 212 − 40, que está bien, y la app le dijo que no porque las casillas de los saltos no seguían un orden concreto. Pasa en más sitios: restar por partes, multiplicar por partes, los problemas con barras, las fracciones simplificadas, las horas...
3. **Con el teclado de números de la pantalla, el número sale al revés.** Las casillas se rellenan empezando por la derecha. Si Inessa teclea «172» tal como lo lee, la app guarda 271 y le dice que ha fallado. Desde fuera parece que la app «resta mal».
4. **Una lección dibuja una resta mal hecha.** En «Cuatro caminos para restar», el dibujo de 352 − 127 deja las unidades vacías y no enseña el préstamo.
5. **Se le enseñó a la vez un método raro.** La lección «Cuatro caminos» la obligó a elegir entre cuatro formas de restar. Lo que eligió («saltos en la recta») se guardó para todas sus restas sin avisar a nadie, y ese método nunca se le explicó bien.
6. **Cuando falla, no se le enseña nada.** Lee «¡Casi! Mira el truco», pero no hay ningún truco a la vista. Luego le cambian el ejercicio y al final solo ve «La respuesta es 30.No pasa nada», sin la cuenta ni el porqué (foto 2).
7. **Se le piden cosas que aún no ha aprendido.** Desde el primer día, la sesión diaria mezcla temas de todo el curso, entre ellos cuentas con errores puestos a propósito («Encuentra el error») que no se han explicado.
8. **La voz lee mal justo los números grandes:** «2 475» suena como «dos cuatrocientos setenta y cinco» y «el 1 000 se lee mil» suena como «el uno cero se lee mil». También dice «presta un a las unidades». Y en 45 de los 49 tipos de ejercicio no habla nada.
9. **En una tablet baja, las pantallas no caben.** El botón «Comprobar» queda por debajo del borde, la letra del enunciado es diminuta, hay dos botones «Comprobar» y en el mapa los nombres se pisan (foto 3).
10. **Todo esto tiene arreglo, y está planificado** en 10 bloques de trabajo que se pueden hacer a la vez. Lo primero de todo es una regla con su prueba automática: **una respuesta final correcta nunca se da por mala.**

---

## 2. Las causas, de la más grave a la menos

### Causa 1. La app suspende respuestas correctas
**Qué le pasa a Inessa.** En 212 − 40 con saltos escribe el total, 172, que está bien, y la app le contesta «¡Casi! El salto 1 tiene que caer después de 40 y antes de 212». En 23 × 14 por partes escribe 230, 92 y 322, todo correcto, y la app le dice «Revisa 23 × 4». En un problema pone las niñas donde van los niños, suma y saca 56, que es lo correcto, y la app lo da por malo. Lo mismo le pasa con 2/3 en lugar de 4/6, con 13:00 en lugar de 1:00 y con «tocar otra columna que también está mal» en «Encuentra el error».
**Qué se va a hacer.** Cambiar el corrector para que mire primero el resultado final. Si está bien, el ejercicio está bien. Los pasos intermedios solo sirven para dar un consejo amable («¡172, muy bien! Los saltos van de menor a mayor»), nunca para suspender. Se añade una prueba automática permanente que comprueba esto en todos los tipos de ejercicio y en todos los métodos.

### Causa 2. Lo que escribe no es lo que la app lee
**Qué le pasa a Inessa.** Con el teclado de la pantalla, el número sale al revés (172 → 271). Con el lápiz, si toca «Comprobar» justo después de escribir, la última cifra todavía no se ha leído y la app califica 25 en lugar de 625. Si escribe un 7 sin rayita, la app puede leer 1 con mucha seguridad y no le pregunta nada. Al fallar, borra lo escrito, así que ella no puede ver que la app ha leído mal. Al final la app le dice «La respuesta correcta es 42» después de que ella escribiera 42.
**Qué se va a hacer.** Las casillas que no son una cuenta en columna se escribirán de izquierda a derecha, como en una calculadora. En la cuenta en columna, la casilla activa se marcará con una flecha. Si el número escrito al revés es la respuesta correcta, la app preguntará «¿Querías escribir 625?» antes de calificar. «Comprobar» esperará a leer la última cifra. Cuando otra lectura posible de una cifra cambie la nota, la app enseñará lo que ha leído («He leído 47, ¿es lo que has escrito?»). Lo escrito se quedará en pantalla después de fallar.

### Causa 3. La app enseña cuentas que parecen mal hechas
**Qué le pasa a Inessa.** En la lección «Cuatro caminos», el dibujo de 352 − 127 sale con las unidades vacías y «2 2» abajo. En «Pedir ayuda a la vecina» (2.º) tampoco se ve el resultado entero. Desde el primer día salen cuentas falsas a propósito («Encuentra el error», «Comprobar») sin que se le haya explicado que son falsas. Y «Comprobar» le llega a pedir números negativos (8 − 68).
**Qué se va a hacer.** El último paso de cada explicación enseñará siempre el resultado completo, y una prueba automática revisará todas las lecciones. Encima de cada cuenta falsa habrá un cartel: «Dani ha hecho esta cuenta y tiene un fallo a propósito. ¿Lo encuentras?». Esos ejercicios solo saldrán después de dar su clase. La comprobación nunca pedirá un número negativo.

### Causa 4. Demasiadas formas de restar y de dividir, y las elige la niña
**Qué le pasa a Inessa.** Después de una sola lección de pedir prestado, una lección obligatoria le enseñó 4 formas de restar en una frase cada una y no la dejó seguir hasta elegir una. Eligió «saltos en la recta» y la app la usó para todas sus restas: mapa, repaso, guardianes. Esa pantalla no dibuja la recta ni explica qué hay que escribir. Con la división pasa lo mismo en el mundo 8.
**Qué se va a hacer.** Se quitan los saltos y la resta por partes, y también repartir por partes y multiplicar hacia arriba. Se quedan solo los métodos del colegio. El método lo decide el adulto, no la niña: la app le preguntará al padre, con un dibujo, cómo se resta en el colegio de su hija. Mientras no conteste, se usa pedir prestado y la galera con restas. Los niños que tenían guardado un método quitado pasan solos al del colegio.

### Causa 5. Cuando falla, no se le enseña cómo se hace
**Qué le pasa a Inessa.** En las lecciones lee «¡Casi! Mira el truco y prueba otra vez» y no ve ningún truco. «Inténtalo otra vez» le trae un ejercicio distinto, así que nunca corrige el suyo. Si vuelve a fallar, el ejercicio desaparece y solo queda «La respuesta es 30.No pasa nada, Inessa. Seguimos con la lección.», todo pegado (foto 2). En la sesión diaria, al fallar le sale una frase al azar que no tiene que ver («¿Te acuerdas del espejo?» en una resta). En ningún sitio aparece la solución resuelta.
**Qué se va a hacer.** Se crea una escalera de ayuda igual en toda la app. Al primer fallo: el mismo ejercicio, con la casilla equivocada marcada y un mensaje concreto («En las decenas, 4 es menos que 9: pide 1 a la vecina»). Al segundo fallo: la solución completa, paso a paso, con el dibujo y la respuesta, y se le pide que la copie. El botón «No lo sé» también enseña la solución completa.

### Causa 6. Se le pide lo que aún no se le ha enseñado
**Qué le pasa a Inessa.** El primer día, cuando el tema es «Descomponer números», la sesión le pide comparar, ordenar, ordinales, tablas, monedas, sumas, encontrar el error en 178 + 643 y un problema con la barra. Las clases piden, sin pistas, cosas que no han explicado: ordinales hasta el 20.º, compensar con 19, completar hasta 1 000, dividir entre 1 000... Las pistas de la tabla del 8 usan el truco del 9, que es de un mundo posterior.
**Qué se va a hacer.** La sesión diaria solo mezclará temas cuya clase ya se ha dado. Cada clase tendrá un ejemplo resuelto de todo lo que luego pide. Y se añaden pruebas automáticas que vigilan las dos cosas.

### Causa 7. Explicaciones confusas o con errores
**Qué le pasa a Inessa.** En varias lecciones el dibujo va un paso por detrás o por delante de lo que se dice. «Los trucos de Lumi» dice que para la tabla del 7 basta con «cinco veces y una más» (7 × 8 daría 48). «Dibujar la historia» dice «quitar es restar» mientras el dibujo enseña una suma. La galera pide los restos antes de explicar qué es un resto, y su último dibujo pone «7 ÷ 3 = 2», que es falso sin decir que sobra 1.
**Qué se va a hacer.** Se reescriben todas las lecciones y clases marcadas como «confusas» o «mejorables», con el guion paso a paso que ya han redactado los revisores. Cada frase irá con su dibujo y se explicará como en el cuaderno del colegio. Además, una prueba comprobará que lo que dice cada frase ya está dibujado.

### Causa 8. La voz
**Qué le pasa a Inessa.** La voz lee «2 475» como «dos cuatrocientos setenta y cinco», «07:05» como «siete: cinco», «1/2» como «uno/dos» y «2,50 €» como «dos coma cincuenta euros». Dice «presta un a las unidades» y «Por un es facilísimo» (en la canción). En la lección de saltos lee una lista de números con paréntesis. Además, en casi ningún ejercicio se puede escuchar el enunciado, aunque los Ajustes lo prometen.
**Qué se va a hacer.** La voz leerá los números, las horas, las fracciones, el dinero y los signos como lo haría una maestra. Las frases de las lecciones se escribirán sin flechas ni paréntesis. Habrá un botón «Escuchar / Parar» en cada ejercicio.

### Causa 9. Pantallas que no caben, se tapan o no se leen
**Qué le pasa a Inessa.** En una tablet baja, en 78 de 194 pantallas el botón «Comprobar» queda fuera. La flecha «Más abajo» tapa «Pista». El enunciado se ve a 8-13 píxeles mientras los números se ven a 30-40. En 69 pantallas hay dos botones «Comprobar». Las partes coloreadas de las fracciones casi no se distinguen del blanco. En el mapa los nombres se pisan y hay dos paradas seguidas que se llaman igual. El navegador de la tablet oscurece la app a su manera (las tres fotos).
**Qué se va a hacer.** Los botones de respuesta irán fijos abajo, siempre a la vista. Habrá un solo «Comprobar» por pantalla. El enunciado irá en letra grande, las fracciones en colores fuertes y en el mapa los nombres se colocarán sin solaparse. Se le indicará al navegador que la app es de colores claros.

---

## 3. Veredicto por método de cálculo

| Operación | Método | Veredicto | Por qué |
|---|---|---|---|
| Resta | Pedir prestado a la vecina | **Mantener** (el que se usa si nadie dice otra cosa) | Es como se resta en la mayoría de colegios. La lección está bien explicada y el corrector ya acepta siempre la respuesta correcta. |
| Resta | Me llevo una (abajo) | **Solo si el adulto lo elige** | Es la otra forma tradicional en España. Le falta su propia lección completa, que se escribirá. |
| Resta | Por partes | **Quitar** | No es un método del colegio, la pantalla no tiene casilla para el resultado y suspendía respuestas buenas. La idea se queda como cálculo mental. |
| Resta | Saltos en la recta | **Quitar** | Es lo de la foto 1. No dibuja la recta, pide paradas en vez de saltos y suspende respuestas correctas. Solo serviría en colegios ABN y habría que rehacerlo entero. |
| División | Galera con restas | **Mantener** (por defecto) | Es la del cuaderno. |
| División | Galera sin restas | **Solo si el adulto lo elige** | Muchos colegios la usan en 4.º. |
| División | Repartir por partes | **Quitar** | Sus «partes fáciles» son más difíciles que la división (75 ÷ 3 obliga a hacer 70 ÷ 3 = 23 y sobra 1), y en 4.º las casillas no admiten cifras suficientes. |
| División | Multiplicar hacia arriba | **Quitar como método** | Su idea («¿qué número por 7 se acerca a 63?») ya es la pregunta de cada paso de la galera. Se queda como pista dentro de la galera. |
| Multiplicar por 2 cifras | En columna (como el colegio) | **Mantener**: es la forma de practicar | Ya acepta siempre el total correcto. |
| Multiplicar por 2 cifras | Por partes | **Rehacer**: solo como explicación del porqué | Se arregla para que el total decida. Para practicar se usa la columna. |
| Tablas | Trucos (5 y uno más, doble y doble, el 9...) | **Mantener como pistas** | No cambian la pantalla. Se añade «La app decide» en Ajustes y cada lección usará solo su propio truco. |

**Quién decide.** Siempre el adulto. Se quita el paso «elige tu favorito» de las lecciones, y la niña no puede cambiar el método.

---

## 4. Lecciones y clases, con su nota

**Claras** = se entienden y se dejan casi igual. **Mejorables** = falta un ejemplo o hay un desfase. **Confusas** = hay que reescribirlas.

### Lecciones del mapa, 3.º
| Lección | Nota | Lo principal |
|---|---|---|
| ¿Qué es multiplicar? | Clara | Solo un detalle del último dibujo. |
| Las tablas fáciles | Mejorable | «Por 5 acaba en 0 o en 5» no sirve para calcular. |
| Cada número en su casa | Confusa | Pide sumar en columna sin un solo ejemplo resuelto. |
| ¡Me llevo una! | Mejorable | La voz y la pantalla nombran los sumandos en distinto orden. La de 4 cifras aparece de golpe. |
| Truco 1: el 5 y uno más | Clara | La pista que sale al fallar usa otro truco. Se corrige. |
| Los trucos de Lumi | Confusa | Contiene un error en el truco del 7, seis trucos en seis frases y está fuera de su sitio en el mapa. |
| Truco 2: los pares que riman | Clara | |
| Restar en la montaña | Mejorable | «Llevando» se explica con un panel de adultos. |
| Cuatro caminos para restar | Confusa | Dibuja una resta mal y es el origen de los saltos. Pasa a ser «Dos formas de restar del cole», según lo que elija el adulto. |
| Dibujar la historia | Confusa | Es la foto 2. El dibujo no acompaña al texto y no enseña a usar la pantalla. |
| La trampa del cero | Mejorable | La resta de 4 cifras con dos préstamos aparece ya hecha. |
| Doble, doble y doble | Mejorable | Marca 8 × 7 como «ya la sabes» antes de enseñarla. La cadena no dice qué multiplicación es. |
| Los secretos del 8 | Mejorable | No dice para qué sirve el patrón y la pista usa el truco del 9. |
| La tabla del 7 | Mejorable | La voz dice «2 nuevas» y el dibujo marca 3. |
| El truco del 9 | Mejorable | «Uno menos» no dice uno menos que qué. Usa una pista de dedos que no se ha enseñado. |
| Multiplicar por trocitos | Confusa | Habla de una pizza que no se ve, el dibujo va por delante de la voz y pide un resultado de 3 cifras que no se ha enseñado. |
| Multiplicar con llevadas | Mejorable | No dice dónde se escribe el 28. |
| Dividir es repartir | Mejorable | «¡Te toca repartir!» no deja repartir nada. |
| La casita de la división | Confusa | Pide los restos antes de explicarlos y muestra «7 ÷ 3 = 2». |
| Cuatro caminos para dividir | Confusa | Se reduce a la galera con y sin restas. |

### Lecciones del mapa, 2.º
| Lección | Nota |
|---|---|
| Grupos de diez | Mejorable (pide contar bloques que no se han enseñado) |
| Sumar casa por casa | Mejorable (el dibujo va un paso por detrás) |
| ¡Me llevo una! | Clara |
| Pedir ayuda a la vecina | Mejorable (el dibujo no muestra el resultado entero) |
| Dobles y mitades | Confusa (enseña a multiplicar antes de tiempo) |
| Torres de 3 y de 4 | Mejorable |

### Clases de 3.º (las 74)
- **Sumar y restar:** sumar con dos cifras, *confusa*. Sumar de 3 cifras, sumar llevando y sumar de 4 cifras, *claras*. Restar sin llevar, restar pidiendo prestado y restar con ceros, *mejorables*. Restar de 4 cifras, *clara*.
- **Multiplicar y dividir:** multiplicar 2 × 1, *mejorable*. Multiplicar 2 × 1 llevando, *clara*. Multiplicar 3 × 1, *mejorable*. Por 10 y por 100, *confusa*. 2 × 2 por partes, *confusa*. Dividir es repartir, *mejorable*. División exacta, *clara*. División con resto, *mejorable*. Bajar la cifra y dividir 3 cifras entre 1, *claras*.
- **Números:** descomponer, leer y escribir, comparar, redondear y cinco cifras, *mejorables*. Ordinales, *confusa*. El signo igual, *clara*.
- **Tablas:** del 2, 10, 3 y 9, *claras*. Del 5, 4, 6 y 7, *mejorables*. Del 8, *confusa*.
- **Problemas:** sumar, restar, multiplicar, dividir, dos pasos y encuentra el error, *mejorables*. Comprobar, *confusa*.
- **Cálculo mental:** doble y triple, *clara*. Dobles y mitades, completar y compensar, *mejorables*. Decenas y centenas, *confusa*.
- **Fracciones:** más partes, *clara*. Mitad y cuarto, fracción de una cantidad y comparar fracciones, *mejorables*.
- **Dinero:** las 4 clases, *claras*.
- **Tiempo:** en punto, de 5 en 5, duraciones y calendario, *claras*. Reloj digital, *mejorable*.
- **Medida:** regla y problemas de medir, *claras*. Longitud y masa y capacidad, *mejorables*.
- **Geometría:** rectas, rectas y segmentos, ángulos rectos, clases de ángulos y perímetro, *claras*. Polígonos, círculo y cuerpos, y recorridos, *mejorables*.
- **Datos:** gráficos, tablas y probabilidad, *claras*.

### Pantallas de ejercicio
- **Claras:** tablas, factor que falta, comparar, redondear, poner y leer horas, duraciones, calendario, figuras, ángulos, perímetro, probabilidad, series, posición, ordinales y la mayoría de juegos.
- **Confusas:** resta con saltos, resta por partes, división por partes, división «escalera», problemas con barras, comprobar una suma, leer fracciones, cambio y presupuesto en dinero, gráfico de barras, multiplicación larga y decimales con centésimas.

---

## 5. Lo que está bien (y se mantiene)

- **El motor calcula bien.** No hay ninguna cuenta mal hecha en miles de ejercicios generados, ni en las pistas, ni en las frases de la voz. Los números en letra están bien del 1 al 99 999. El redondeo sigue la norma del colegio (45 → 50).
- **La resta y la suma en columna ya aceptan siempre la respuesta correcta**, aunque las marcas de «me llevo una» o de pedir prestado estén mal. La queja anterior (996 − 377 = 619) está arreglada.
- **La galera se corrige por el cociente y el resto**, como en el colegio.
- **Nada mal se da por bueno**: ±1, ±10 o una cifra de más siempre se rechazan.
- **Cuando una cifra escrita a mano se lee con duda, la app ya pregunta** antes de calificar. El problema son las que se leen mal con mucha seguridad.
- **Hay lecciones muy buenas que sirven de modelo**: «Restar en la montaña», «La trampa del cero», «¿Qué es multiplicar?», la galera de las clases y las clases de dinero, reloj y geometría.
- **Las tablas ya enseñan bien al fallar**: muestran la respuesta y el paso resuelto, y piden copiarla. Es el modelo que se va a llevar al resto de la app.
- **Los 74 temas del temario tienen su clase**, y el esquema de cada clase es bueno: para qué sirve, ejemplo, práctica con ayuda, práctica sola y regla final.
- **La voz ya lee bien** las operaciones sencillas («seis por siete son cuarenta y dos») y no se pisa entre pasos.
- **La niña nunca se queda bloqueada**: siempre puede pulsar «Ahora no», «No lo sé» o seguir la lección.

---

## Anexo A. Archivos y pruebas (para el equipo técnico)

**Pruebas que reproducen los fallos (ramas de auditoría):**
- `auditoria/p1-suma-resta` (79c0c4f), en el worktree `.claude/worktrees/wf_8bd25dd0-ba6-1`: `src/engine/__tests__/auditoria-p1-suma-resta.test.ts` y `auditoria-p1-mensajes.test.ts`.
- `auditoria/p1-mul-div` (9d1a909), en `ba6-2`: `src/engine/__tests__/auditoria-p1-mul-div.test.ts`, `src/activities/views/auditoria-p1-mul-div.view.test.tsx` y `src/activities/auditoria-p1-mul-div.juegos.test.tsx`.
- `auditoria/p1-numeros` (87138f3), en `ba6-3`: `src/engine/__tests__/auditoria-p1-numeros.test.ts`.
- `auditoria/p1-medida-problemas` (fca86b9), en `ba6-4`: `src/engine/__tests__/auditoria-p1-medida-problemas.test.ts`.
- Escritura (`ba6-5`): `src/ink/ml/audit-p2.test.ts`, `src/activities/views/audit-p2.dom.test.tsx` y `src/ink/audit-p2-overwrite.test.tsx`.
- Crítico (`ba6-11`): `src/audit-critico/orden-tecleo.test.tsx`, `orden-columna.test.tsx`, `critico.test.ts` y `operandos.test.tsx`.
- Voz (`ba6-12`): `src/audit-voz/hallazgos.test.ts` (31 casos de lo que debería decir).
- Mapa (`ba6-13`): `src/content/__tests__/audit-map-labels.test.ts` y `tests/audit-p6/`.
- Volcados y capturas: `/private/tmp/claude-501/-Users-mac13-Desktop-Inessa-Mat/380895dd-00af-4b28-8c2b-20d6d11df639/scratchpad/auditoria/<área>/`.

**Archivos principales por causa:**
- Causa 1: `src/engine/check.ts` (checkSubLine 325-349, checkSubParts 309-323, checkDivisionParts 464-479 y checkClimb 489-508), `src/engine/bigops.ts:85-108`, `bars.ts:396-428`, `fractions.ts:281-330`, `clock.ts:226-266`, `bugs.ts:163, 227 y 338-357`, `numeric.ts:422-425` y `geometry.ts:221 y 565`.
- Causa 2: `src/ink/CellGroup.tsx:94 y 110-116`, `src/activities/views/SubStepNumber.tsx:24 y 55-57`, `src/activities/groups/AnswerBar.tsx:51`, `src/ink/confusable.ts:7-15`, `src/ink/constants.ts:4 y 15-18`, `src/ink/DigitCell.tsx:176-193`, `src/activities/views/FactView.tsx:61 y 77` y `src/data/review.ts:13-25`.
- Causa 3: `src/activities/lesson/visuals/subtraction.tsx:61-72 y 231-255`, `visuals/types.ts:22` y `src/engine/daily.ts:381-405`.
- Causa 4: `src/engine/methods.ts:15-28 y 88-100`, `src/content/lessons/w4.ts:43-79`, `w8.ts:46-70`, `src/world/host/GameHost.tsx:247-251`, `src/activities/lesson/LessonPlayer.tsx:72 y 117-121`, `src/adult/child/ChildSettingsCard.tsx:117-175` y `docs/PEDAGOGY.md:77-104`.
- Causa 5: `src/activities/lesson/TrySlot.tsx:55-59, 107-113, 144-159 y 196-229`, `TrySlot.module.css:37-47`, `src/world/review/ExerciseStep.tsx:148-160`, `src/content/phrases.ts:104-156` y `src/engine/hints.ts` (todo el archivo).
- Causa 6: `src/engine/daily.ts:68, 262-282 y 374-405`, `src/world/session/DailySession.tsx:43 y 132` y `src/content/classes/*.ts`.
- Causa 7: `src/content/lessons/w1.ts` a `w8.ts`, `src/content/c2/lessons.ts`, `src/activities/lesson/visuals/*.tsx` y `src/content/classes/grade3*.ts`.
- Causa 8: `src/audio/speechText.ts:10-37, 134-160`, `api/tts.ts:24-39`, `src/audio/neuralVoice.ts:10 y 96-97` y `src/activities/facts/shared/speak.ts:24`.
- Causa 9: `src/activities/shared/FitToScreen.tsx`, `src/app/ScrollAssist.*`, `src/ink/NumberInput.tsx:455-466`, `src/activities/views/FigureSvg.tsx:134`, `src/styles/tokens.css:34`, `src/content/worlds/path.ts:33-55`, `src/world/map/WorldMapScreen.module.css:52-145` e `index.html` (no declara color-scheme).

**Plan de arreglo:** `/private/tmp/claude-501/-Users-mac13-Desktop-Inessa-Mat/380895dd-00af-4b28-8c2b-20d6d11df639/scratchpad/plan-arreglo-matematicas.json`.
