# Revisión de ventas: portada, colegios y propuesta de negocio (22-10-2026)

Ámbito: código en HEAD (commit 02b2d0c). Revisado: `src/adult/welcome/WelcomeScreen.tsx`, `src/adult/school/**`,
`src/adult/legal/PrivacyScreen.tsx`, `src/audio/speech.ts`, `api/tts.ts`, `src/adult/child/ChildReportScreen.tsx`,
`src/data/dashboards.ts`, `docs/PEDAGOGY.md`. No se ha revisado el sitio desplegado; los textos citados son los del código.
No se ha reproducido audio. No se ha tocado el código.

Resumen: la portada está bien ordenada y dice cosas verdaderas, pero tiene tres promesas que hoy no se cumplen del todo
(«todo se queda en este dispositivo», «ayuda a repasar, no a enseñar desde cero» y «exporta o borra») y la política de
privacidad omite el servicio de voz de Azure. Eso es lo que hay que arreglar antes de llevar la app a un colegio.

---

## ERRORES

Ordenados por gravedad. Cada uno dice dónde está, qué dice hoy y por qué puede dar problemas.

**E1. Azure no aparece en la política de privacidad (gravedad alta, RGPD).**
- Dónde: `src/adult/legal/PrivacyScreen.tsx`, secciones 6 y 10.
- Qué dice hoy: la sección 10 afirma que las voces son del propio dispositivo, que «elige siempre que puede una voz que
  funciona sin conexión» y que solo ciertas voces de Chrome envían el texto a un servidor externo.
- Qué hace el código: `src/audio/speech.ts` declara que el modo automático reproduce «la voz natural (neural) de /api/tts»
  cuando puede, y `api/tts.ts` envía el texto a `https://{region}.tts.speech.microsoft.com` (Azure). El texto son las
  instrucciones del juego, que pueden incluir el apodo del niño (lo dice la propia política).
- Riesgo: un colegio o una familia que lea la política no sabe que un proveedor de Microsoft recibe ese texto. Si las
  variables de Azure están configuradas en producción, es un tratamiento sin declarar y sin contrato de encargado.
  Además, la sección 6 solo nombra a Supabase.
- Cambio: declarar a Microsoft Azure (servicio de voz neuronal, texto de instrucciones, sin datos de cuenta) como
  encargado en la sección 6; reescribir la sección 10 con lo que hace el código; confirmar la región de Azure y que hay
  contrato con Microsoft. Si no se quiere tratar el apodo, el texto debe quitarlo antes de enviarlo.

**E2. La portada promete «todo se queda en este dispositivo» (gravedad alta).**
- Dónde: `WelcomeScreen.tsx`, tarjeta de confianza: «Prueba sin cuenta — Todo se queda en este dispositivo. Creas la
  cuenta cuando quieras.»
- Problema: es falso mientras el modo automático de voz envíe texto a Azure (E1). Un padre o un profesor que lo lea y lo
  compruebe pierde la confianza de golpe.
- Cambio: ver PROPUESTA P3 (texto exacto).

**E3. «Datos que puedes borrar» con «Exporta» sin matiz (gravedad media).**
- Dónde: `WelcomeScreen.tsx`: «Exporta o borra los datos de tu hijo cuando quieras.»
- Problema: la exportación está en el informe del perfil, dentro de la zona de adultos protegida por PIN
  (`ChildReportScreen.tsx`, botón «Descargar sus datos (JSON)»). Sin cuenta, la copia solo incluye lo de este dispositivo
  (`src/data/dashboards.ts`, `noticeLocalOnly`: «Para una copia completa, exporta con conexión y con la sesión iniciada»).
  Decir «cuando quieras» sin matiz es verdad a medias.
- Cambio: ver P3.

**E4. «Para quien busque sustituir al colegio… Repasitos ayuda a repasar, no a enseñar desde cero» (gravedad media).**
- Dónde: `WelcomeScreen.tsx`, bloque «Para quién no es».
- Problema: el propio documento de pedagogía (`docs/PEDAGOGY.md`) describe que la app enseña conceptos: «multiplicación = grupos
  iguales», «división = reparto justo», mundos 1 y 8 con conceptos. La frase puede sonar falsa a un profesor que vea la lección.
- Cambio: «Repasitos está pensado para practicar y repasar lo que ya se ha explicado. Si un niño no entiende un concepto,
  conviene que lo explique antes un adulto.» (Ver P6.)

**E5. El rango de edad no coincide con los cursos que ofrece la app (gravedad media).**
- Dónde: portada, «Matemáticas · 7 a 9 años» y «Niños de 7 a 9»; en el colegio, el selector de curso permite de 1.º a 6.º
  (`SchoolScreen`/`ClassScreen`: `[1, 2, 3, 4, 5, 6].map(...)`), y el argumentario habla de 2.º a 4.º.
- Problema: el colegio ve una cosa en la web y otra en la pantalla. Además, el contenido está pensado para 2.º a 4.º.
- Cambio: unificar en «De 2.º a 4.º de Primaria (7 a 9 años)» en portada, y decidir si el selector de curso sigue en 1.º–6.º.

**E6. Dato sin fuente: «Región: Unión Europea (Irlanda)» (gravedad media, a verificar).**
- Dónde: `PrivacyScreen.tsx`, sección 6. El repositorio no contiene la región del proyecto de Supabase (`supabase/` no la
  indica). Puede ser correcto, pero no lo puede comprobar nadie desde el código.
- Cambio: confirmarlo en el panel de Supabase antes de la primera reunión con un colegio, y mencionar el encargado Vercel
  (hosting; hay `vercel.json` y funciones en `api/`), que tampoco aparece en la política.

**E7. Responsable con dirección personal visible (gravedad media).**
- Dónde: `PrivacyScreen.tsx`, sección 1: «Fran Julian, Calle Bellido, Jaca (Huesca), España».
- Problema: publica la dirección de una persona física. Es decisión del dueño, pero un colegio pedirá datos del titular
  (NIF o razón social, dirección) para firmar un encargo. Si se usa una entidad (autónomo, sociedad), debe aparecer ahí.
- Cambio: decidir qué datos del titular se publican; para un colegio hará falta un contrato de encargo con esos datos.

**E8. La política dice «No usamos publicidad ni la vendemos» (gravedad baja, consistencia).**
- Dónde: `PrivacyScreen.tsx`, sección 4. El dueño ha quitado esta afirmación de la portada (último commit).
- Problema: la política la mantiene. No es una promesa falsa, pero queda desalineada con la decisión del dueño.
- Cambio: revisarlo con el dueño. Este documento no la usa como argumento de venta.

**E9. La portada no tiene camino directo para colegios (gravedad media).**
- Dónde: `WelcomeScreen.tsx`. La tarjeta «Colegios» dice «Crean clases con un código para las familias», pero los botones
  de la portada solo llevan a `/signup` («Crear cuenta») y a «Probar sin cuenta». La cuenta de colegio se elige dentro de
  `SignupScreen.tsx` (opción «Colegio»), y el colegio no lo ve antes de empezar.
- Cambio: enlace «Crear cuenta de colegio» junto a la tarjeta (P8).

**E10. Pie de página sin datos de contacto ni condiciones (gravedad media para colegios).**
- Dónde: `WelcomeScreen.tsx`, `<footer>`: solo «Privacidad y datos». No hay aviso legal, condiciones de uso, ni
  contacto comercial. Un colegio busca estas tres cosas antes de escribir.
- Cambio: añadir «Condiciones de uso», «Aviso legal» y «Contacto» (P9). Los textos legales los debe revisar un abogado.

**E11. Riesgo de propiedad: el contenido sigue un cuadernillo (gravedad media, a verificar).**
- Dónde: `docs/PEDAGOGY.md`, «Season 1 curriculum (matches the workbook)», y `docs/reference/Inessa_y_la_Magia_de_los_Numeros.pdf`.
- Problema: si el contenido sigue un libro de terceros, no se debe presentar a un colegio como propio sin derechos.
  El repositorio no dice quién es el autor del cuadernillo.
- Cambio: confirmar la titularidad antes de citarlo en un argumentario. Hasta entonces, no decir «basado en el cuadernillo».

**E12. Mezcla de «Lumi» y el personaje del niño (gravedad baja).**
- Dónde: `WelcomeScreen.tsx`, alt de la captura: «Luna, Lumi»; el niño elige un compañero animal, y Lumi es la guía adulta
  (`src/types/child.ts`, comentario). Para una familia que lee «rescatando a tu compañero», la historia se entiende; para un
  profesor, el nombre de la guía aparece sin explicación.
- Cambio: en la portada, presentar a Lumi en una frase («Lumi, la guía de la aventura»).

---

## PROPUESTAS

### P1. Titular de la portada (dos versiones, una por público)

Hoy: «Repasa las cuentas <span>rescatando</span> a tu compañero.» Bien como marca, pero no dice a quién sirve ni qué pasa
en casa. Propuesta para mantener la marca y ganar claridad:

- Familias: **«Las tablas que le cuestan a tu hijo, repasadas cada día en una aventura.»**
- Colegios: **«Repaso de matemáticas de 2.º a 4.º, con un panel para cada clase.»**

En la portada se usa la de familias, y la de colegios va en la sección de colegios (con enlace a la cuenta de colegio).
Ninguna de las dos afirma resultados.

### P2. Subtítulo (deck) con datos verificables

Hoy: «Tablas, sumas, restas, multiplicaciones y divisiones en ocho mundos mágicos. Cada niño elige un animal y lo rescata
con cada respuesta.»

Propuesta: **«De 2.º a 4.º de Primaria (7 a 9 años): sumas, restas, tablas, multiplicaciones y divisiones en ocho mundos.
Cada respuesta rescata a su compañero animal, y tú ves qué domina tu hijo y qué le toca repasar.»**

Los cuatro hechos (ocho mundos, cursos, cristales, informe) están en el código.

### P3. Bloque de confianza (sustituye a «Datos que puedes borrar» y «Prueba sin cuenta»)

Tarjeta 1, verde. Título: **«Tú decides qué se guarda»**. Texto: **«Descarga o borra el perfil de tu hijo desde su informe, en la zona de adultos. Con cuenta, el borrado también llega a la nube.»**

Tarjeta 2, azul. Título: **«Pruébala sin cuenta»**. Texto: **«Lo que hace tu hijo se guarda en este dispositivo. La voz de la aplicación puede generarse en un servicio externo; puedes elegir la voz del dispositivo en Ajustes.»**

Estas dos frases cumplen E2 y E3. Cambiar el texto de la segunda solo es honesto si E1 queda resuelto en la política
(o si la voz de Azure se desactiva por defecto). Si el dueño prefiere que la frase sea «Todo se queda en este dispositivo»,
hay que desactivar antes la voz externa.

### P4. CTA principal y secundaria, por público

Hoy hay tres botones con la misma fuerza: «Crear cuenta» (dorado), «Probar sin cuenta» (secundario) e «Iniciar sesión».
Propuesta:
- Principal (hero): **«Probar sin cuenta»**. Es la acción de menor fricción y la que ya se puede hacer hoy.
- Secundaria: **«Crear cuenta familiar»**.
- Terciaria, en la tarjeta de colegios: **«Crear cuenta de colegio»**.

### P5. Captura y prueba antes de pedir nada

Hoy la portada tiene dos capturas (inicio y mundo) y una lección. Añadir arriba del pliegue un vídeo de 15 segundos (sin
audio, con subtítulos) de una pregunta resuelta y del paso a la siguiente, y en el apartado de familias, una captura del
informe del perfil (con datos ficticios, escritos como tales). No usar fotos de niños.

### P6. Sección «Para quién no es» (reescritura honesta)

Propuesta: **«Para quién no es: si un niño no ha visto todavía una tabla o una división, Repasitos no la explica desde cero.
Es para practicar y repasar. Lo que se explica en clase o en casa sigue siendo lo principal.»**

Es la única parte de la portada que dice «no»; un profesor la leerá con atención.

### P7. Cómo funciona: pasos con resultado para la familia

Hoy: «Elige compañero», «Rescátalo», «Repasa lo que toca». Propuesta, manteniendo el orden:
1. **«Elige un compañero»**: «Gato, perro, zorro, conejo, panda, pingüino, dragón o unicornio bebé. Le pone nombre.»
2. **«Rescátalo con cada respuesta»**: «Cada mundo tiene un guardián y una prueba. Si su compañero se mete en un lío, la respuesta lo salva.»
3. **«Repasa lo que cuesta»**: «El Repaso del día reúne lo que más le cuesta. Con los ocho cristales se abre el Gran Cofre, con un premio que prepara un adulto.»

### P8. Enlace directo para colegios

Debajo de la tarjeta «Colegios», añadir: **«Crear cuenta de colegio»** (enlace a `/signup` con la opción Colegio preseleccionada)
y, en una línea: **«Crean la clase, copian su código y las familias se unen con él. Ven el progreso de la clase y asignan
prácticas.»** Esas funciones existen (`ClassScreen`: mapa de la clase y asignaciones).

### P9. Pie de página completo

Añadir: «Condiciones de uso», «Aviso legal», «Contacto» (correo ya usado en la política), y «Privacidad y datos». Los
textos legales los debe revisar un abogado antes de publicarlos.

### P10. Lo que no conviene escribir

- «Sin publicidad» como argumento (decisión del dueño).
- «Aprobado por colegios», «Usado por X centros», cualquier cifra de uso o testimonio: no hay datos verificables en el repositorio.
- «Cumple al 100 % el RGPD» o «certificado»: es una afirmación jurídica que no puede hacer una web. Mejor: «Datos de menores tratados con contrato de encargo y reglas de acceso en la base de datos».
- Comparaciones con otras apps (ni por nombre ni por arquetipo con ataque).

---

## 2. Argumentario y guion de demo (10 minutos)

### 2.1 Argumentario (lo que se puede decir hoy, con hechos del código)

**Tema 1. Sabe qué le cuesta a cada niño.** Cada respuesta se clasifica (acierto o error, tipo de error, tiempo) y el
informe muestra las tablas que domina y las que toca repasar, por niño y, en el colegio, por clase (mapa de 55 cálculos).
Prueba: el mapa del informe y el de la clase.

**Tema 2. Práctica corta y repetida, no un examen.** El repaso del día reúne lo que cuesta; los errores vuelven unas
preguntas después en la misma sesión y en días posteriores. Las sesiones están pensadas como cortas (en el documento
pedagógico, unos 15 minutos por defecto). Prueba: el repaso del día y el mapa.

**Tema 3. El profesor asigna, la familia ve.** El profesor crea la clase, comparte un código con las familias, asigna una
práctica (tablas, sumas con llevada, etc.) y ve quién ha practicado esta semana. Las familias unen a su hijo con su propio
consentimiento. Prueba: panel de clase y asignación.

**Tema 4. Los datos son del colegio y se pueden borrar.** El colegio es responsable de sus alumnos; Repasitos trata los
datos como encargado. Se puede descargar y borrar un perfil. Prueba: sección de privacidad y botón de descarga en el informe.

Lo que no se dice todavía: resultados de aprendizaje medidos, número de colegios o familias, o que el contenido esté
alineado con un decreto concreto (ver objeción de LOMLOE).

### 2.2 Guion de demo, 10 minutos

Preparación (antes): cuenta de colegio de demostración con dos clases (una con niños de ejemplo), un perfil de niño con
historial, y la voz **desactivada** en Ajustes (E1). Tener abierta la política de privacidad en otra pestaña.

| Tiempo | Qué se hace | Qué se dice (idea) |
|---|---|---|
| 0:00–1:00 | Pregunta de descubrimiento, sin tocar el producto | «¿Cómo sabéis hoy qué tablas le cuestan a cada alumno?» Escuchar. Anotar el problema con sus palabras. |
| 1:00–2:30 | El niño: elegir compañero, una pregunta, el mundo y el repaso del día | «Esto es lo que vería un niño. Lo que queremos mostraros es lo que llega al adulto.» Mostrar una respuesta con error y su vuelta. |
| 2:30–4:30 | Informe del perfil: tablas dominadas, para repasar, sin practicar | Momento «eso es lo que necesitamos» (esperado): preguntar «¿Cuál sería el dato que os ayudaría mañana en clase?» |
| 4:30–6:30 | Cuenta de colegio: crear clase, copiar código, mensaje para las familias, asignar una práctica | Enseñar el mensaje de tres pasos. Preguntar cómo llegan hoy a las familias. |
| 6:30–7:30 | Panel de clase: mapa de la clase, quién no ha practicado | «Esto sirve para decidir a quién se le dedica la sesión de repaso del lunes.» |
| 7:30–8:30 | Privacidad: política (sección de qué datos y dónde), descargar y borrar un perfil | Responder en directo a la pregunta de RGPD (ver 2.3). |
| 8:30–9:30 | Objeciones: elegir las dos que más preocupan | Ver 2.3. No improvisar cifras. |
| 9:30–10:00 | Siguiente paso | Proponer una prueba de tres semanas con dos clases (criterios por escrito, ver 2.4). |

Dos caminos previstos: si el jefe de estudios se fija en la privacidad, se salta del paso 5 al 7 y se alarga. Si el profesor
se fija en la clase, se alarga el paso 4.

### 2.3 Objeciones típicas y respuestas

**RGPD y datos de menores**
- «¿Dónde están los datos y quién los trata?» → «La base de datos está en la Unión Europea (Irlanda), con Supabase como proveedor, y el hosting en Vercel. [Confirmar antes de decirlo: E6.] El colegio es el responsable; nosotros, encargados. Enseñamos la lista de proveedores y firmamos el contrato de encargo.» Si hay Azure (E1), decirlo: «La voz neuronal se genera en Azure con el texto de las instrucciones; se puede apagar.»
- «¿Necesitamos evaluación de impacto?» → «Depende del colegio. Podemos responder el cuestionario de su delegado de protección de datos y aportar la lista de tratamientos.»
- «¿Cómo se consigue el consentimiento?» → «El adulto acepta la política al crear el perfil y da su consentimiento expreso al unir al niño a una clase; puede retirarlo.»
- «¿Usáis analítica o publicidad de terceros?» → «En la app no hay herramientas de analítica ni de rastreo de terceros (comprobado en el código).» (No mencionar la publicidad; ver P10.)

**Tablets y dispositivos**
- «Nuestros alumnos no tienen tablet.» → «Funciona en ordenador y móvil; se escribe con lápiz, dedo o teclado. Para una prueba se puede usar el ordenador de aula.»
- «La tablet del colegio se la lleva la gente.» → «Cada perfil se guarda en el dispositivo y en la nube de la cuenta; no hace falta que el alumno tenga siempre el mismo aparato.» (Verificar que la sincronización funciona en un segundo aparato antes de decirlo.)

**Tiempo de pantalla**
- «Ya tienen demasiadas pantallas.» → «Estamos de acuerdo en que el tiempo es importante. Repasitos está pensado para sesiones cortas y para que el repaso sea el que decide el profesor, no un juego sin fin.» Preguntar: «¿Qué tiempo diario les parece razonable para repasar?» y adaptar la prueba a esa cifra.
- «¿Hay límite de tiempo?» → «El diseño es de sesiones cortas (unos 15 minutos por defecto). La presión de tiempo es opcional, y los adultos pueden desactivarla.» (Comprobar en el código si hay un límite real antes de prometerlo.)

**Currículo LOMLOE**
- «¿Esto sigue la LOMLOE?» → «El contenido cubre multiplicación, división y cálculo en columna de 2.º a 4.º. Todavía no tenemos una tabla de correspondencia con los criterios de evaluación de su comunidad. Podemos hacerla con vosotros.» (No decir «cumple la LOMLOE»; no hay mapeo en el repositorio.)
- «¿Está basado en un libro?» → No responder hasta confirmar la titularidad del cuadernillo (E11).

**Otras objeciones frecuentes**
- «¿Qué pasa si la empresa desaparece?» → «Pueden exportar cada perfil en JSON en cualquier momento.» (Solo con conexión y cuenta para la copia completa, E3.)
- «¿Quién paga?» → «Hoy es gratuita y voluntaria. Estamos decidiendo el modelo; cuando lo tengamos, lo comunicaremos antes de cobrar nada a vuestro centro.» (Ver sección 3.)
- «Ya usamos [herramienta del centro].» → «Perfecto. ¿Qué no os da hoy? Si la respuesta es el repaso por alumno, lo probamos con una clase sin tocar lo demás.»

### 2.4 Criterios de la prueba de tres semanas (propuesta, por escrito antes de empezar)

Enunciado: «Esta prueba demostrará si Repasitos ayuda a [dos clases de 2.º a 4.º] a identificar y repasar las tablas que
más les cuestan, medido por el mapa de la clase y por la práctica asignada durante tres semanas.»

| Criterio | Objetivo | Cómo se mide |
|---|---|---|
| Familias unidas a la clase | Al menos el [X] % de las familias | Lista de perfiles unidos con el código |
| Práctica asignada | Al menos [X] sesiones por semana | Asignaciones y sesiones en el panel |
| El profesor identifica las tablas difíciles | Sí/No, en la reunión de cierre | Entrevista al profesor con el mapa |
| Datos | Contrato de encargo firmado antes de empezar | Documento firmado |

Los valores entre corchetes los fija el colegio, no la web. No se comprometen cifras de resultado.

---

## 3. Modelos de negocio posibles (sin decidir)

Esta sección es para el dueño. No se recomienda ninguno; cada modelo tiene pros y contras y necesita revisión jurídica
antes de elegir (consumo, RGPD, contratación pública si es Administración).

| Modelo | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **A. Gratuito y voluntario** (hoy) | Sin cobro; se mantiene como proyecto | Máxima adopción y confianza; sin fricción para colegios | Los costes (Supabase, Vercel y la voz de Azure, que tiene cuota gratuita pero no es infinita) los paga el dueño; sin ingresos |
| **B. Suscripción familiar** | Pago mensual o anual por familia, con varios niños | Ingreso recurrente y predecible; encaja con el uso diario | Compite con otras apps de repaso; exige pasarela de pago, política de cancelación y atención al cliente; las familias pagan por algo que los colegios pueden dar |
| **C. Licencia por colegio o clase** | El colegio paga por curso o por aula; las familias usan el código gratis | Ticket más alto; el colegio es el decisor del uso; el panel de clase es el valor | Ciclo de venta largo (meses); exige contrato, DPA, soporte y a veces procedimiento de contratación pública; depende de pocos clientes |
| **D. Freemium por asignatura** | Gratis el primer mundo y las matemáticas básicas; el resto (y las asignaturas nuevas) por niño | Encaja con la «activación por niño» prevista; uso gratis para probar | Un muro de pago dentro de un juego para niños de 7 a 9 años genera rechazo y revisión de publicidad y consumo; complejidad de producto |
| **E. Pago único por asignatura** | Compra de «Matemáticas» o «Lengua» para siempre | Simple; sin cuota | Ingreso bajo y poco predecible; sin ingreso recurrente para mantener el contenido |
| **F. Mixto familia + colegio** | Las familias usan la app gratis; el colegio paga la clase | Lo más alineado con la arquitectura actual (código de clase) | Requiere dos flujos de cobro y dos conversaciones; el colegio paga por algo que la familia sí valora |
| **G. Subvención o convenio** | Ayudas públicas o convenios con AMPAs, fundaciones o entidades educativas | Sin cobro a las familias; legitimidad | Plazos largos y condiciones; dependencia de convocatorias; posible incompatibilidad con otros modelos |

Puntos comunes a todos: el coste de la voz de Azure y de la base de datos crece con el uso (conviene medirlo antes de fijar
precio); el precio se fija después de mostrar el valor (un informe de clase, no el número de juegos); y cualquier cobro a
menores o a sus familias exige revisión de consumo y de protección de datos.

---

## 4. Borrador de correo de presentación a un colegio

**Asunto:** Repaso de matemáticas de 2.º a 4.º con un panel para cada clase

Estimado/a [nombre]:

Me llamo Fran Julian y he desarrollado Repasitos, una aplicación para que los niños de 2.º a 4.º de Primaria repasen
matemáticas (tablas, sumas, restas, multiplicaciones y divisiones) con una aventura en la que rescatan a su compañero animal
con cada respuesta.

Para el colegio, la aplicación permite crear clases con un código que se comparte con las familias. El profesorado ve qué
tablas le cuestan a cada alumno y cuál es el progreso de la clase, y puede asignar una práctica concreta. Las familias
unen a su hijo a la clase con su propio consentimiento.

Hoy la aplicación es gratuita y voluntaria. Todavía no tenemos decidido el modelo para los centros, y prefiero que lo
pruebe primero su equipo.

Le propongo una prueba de tres semanas con dos clases, sin coste y sin compromiso, con criterios escritos antes de empezar.
Antes, le enviaríamos el contrato de encargo del tratamiento de datos y la lista de proveedores, para que su delegado de
protección de datos lo revise.

¿Le vendría bien una demostración de unos diez minutos en los próximos días? Puedo adaptarla a lo que más le preocupa
(privacidad, planificación del repaso o el panel de clase).

Un cordial saludo,

Fran Julian
[teléfono] · [correo de contacto]
Repasitos · https://repasitos.es

> Antes de enviar: confirmar E1 (Azure en la política), E6 (región y Vercel) y E7 (datos del titular para el contrato).

---

## Pendiente para el dueño

1. Decidir si la voz de Azure se mantiene por defecto (E1). Mientras no se resuelva, no usar «todo se queda en este dispositivo».
2. Confirmar la región de Supabase y declarar a Vercel y Azure como encargados (E1, E6).
3. Decidir los datos del titular publicados (E7) y el contrato de encargo para colegios.
4. Confirmar la titularidad del cuadernillo (E11).
5. Revisión jurídica de la política de privacidad y de los textos legales del pie (E10).
6. Elegir modelo de negocio (sección 3); no hay recomendación.
