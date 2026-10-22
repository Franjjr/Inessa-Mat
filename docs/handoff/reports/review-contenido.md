# Revisión de contenido y redes de Repasitos — 22 de octubre de 2026

Alcance: textos de la portada para adultos (`src/adult/welcome/WelcomeScreen.tsx`), metadatos de `index.html`, capturas en `public/landing/*.webp`, política de privacidad (`src/adult/legal/PrivacyScreen.tsx`) y `public/robots.txt`. No se ha tocado código. No se ha reproducido audio. No aparece ninguna foto ni cara de niño; sí se ha visto un nombre de niña en una captura (ver ERRORES 1).

## Resumen (10 líneas)
1. Antes de publicar un solo enlace hay que arreglar tres cosas: la captura de la portada muestra un nombre de niña, no hay metadatos Open Graph y la portada no dice que es gratis.
2. Redes: Instagram como base (familias de 30 a 45 años), mismos vídeos verticales en TikTok y YouTube Shorts, y X para docentes con poco esfuerzo.
3. Esfuerzo semanal: unas 4 horas (2 carruseles, 1 vídeo, 15 minutos diarios de respuestas y 1 hora semanal de colegios).
4. Pilares: tablas que cuestan (40 %), Lumi y el bosque (25 %), familias sin peleas (20 %) y colegios (15 %).
5. Calendario de 4 semanas con fechas reales, desde el lunes 26 de octubre, sin publicar el 1 de noviembre (festivo).
6. Diez publicaciones listas, tres de ellas guiones de vídeo corto (30, 20 y 25 segundos).
7. Colegios y AMPAs: correo único al centro, piloto de 4 semanas con un docente y ninguna lista de contactos comprada.
8. Medir: enlaces con UTM, «Probar sin cuenta» como métrica estrella y una revisión de 30 minutos cada viernes.
9. Aviso importante: la analítica de la app está excluida por la política de privacidad, así que cualquier medición externa obliga a actualizar esa política.
10. Error de posicionamiento: la descripción de la página dice «aprender» y la portada dice «repasar». Elige «repasar».

---

## ERRORES

Ordenados por gravedad. «Impacto» indica qué pasa si se comparte la web tal como está.

**1. Crítico. Nombre de niña en la captura pública de la portada.**
`public/landing/nino-inicio.webp` muestra «Hola Inessa», y ese mismo nombre aparece en la cabecera. La captura se usa en la portada pública (`SHOTS.home`, figura «Captura real, en iPad»). Si es el perfil de un niño real, hay un dato personal de un menor en abierto.
- Arreglo: sustituir la captura por una de un perfil de demostración con un nombre inventado y genérico (por ejemplo «Demo»), o recortar la cabecera. Revisar también que no haya nombres en las demás capturas (`mundo1.webp` y `leccion-grupos.webp` están limpias).

**2. Alto. No hay metadatos Open Graph ni Twitter Card.**
`index.html` solo tiene `<title>` y `<meta name="description">`. WhatsApp, Telegram, X, LinkedIn y Facebook mostrarán una tarjeta vacía o sin imagen al compartir repasitos.es. Esto va contra el objetivo de que alguien comparta la web.
- Arreglo: añadir `og:title`, `og:description`, `og:type` (website), `og:url` (https://repasitos.es/), `og:image` (imagen absoluta 1200×630 en PNG o JPG; no sirve el SVG de Lumi), `og:locale` (es_ES), `og:site_name` (Repasitos), `twitter:card` (summary_large_image) y `<link rel="canonical">`.

**3. Alto. No existe imagen para compartir.**
Las capturas disponibles miden 1100×764 y no tienen la proporción de 1200×630. No hay ninguna imagen de cabecera pensada para redes.
- Arreglo: crear una imagen 1200×630 con `mundo1.webp` como fondo, el titular «Repasa las tablas rescatando a tu compañero» y el logo de Lumi. Sin caras de niños y sin nombres.

**4. Alto. La portada es una app de cliente sin contenido estático.**
`index.html` contiene solo «Cargando…». Los rastreadores de vista previa no ejecutan JavaScript, así que solo ven el título y la descripción. Además, no hay `sitemap.xml`.
- Arreglo: prerenderizar `/welcome` (o generar una página HTML estática con el texto de la portada) y añadir `sitemap.xml` con `/` y `/welcome`.

**5. Medio. Contradicción de posicionamiento.**
La descripción dice «aventuras matemáticas para aprender las tablas, sumar, restar, multiplicar y dividir jugando». La portada dice «Repasa las cuentas» y «ayuda a repasar, no a enseñar desde cero». Un padre que lea ambas no sabe si su hijo debe aprender o repasar, y la portada es la única que dice la verdad sobre el producto.
- Arreglo: usar en todas partes «repasar». Propuesta de descripción: «Repasa las tablas y las cuentas rescatando a tu compañero. Gratis, en tablet, móvil u ordenador, para niños de 7 a 9 años.» (147 caracteres).

**6. Medio. La palabra «gratis» no aparece en ningún sitio.**
Ni la portada, ni la descripción, ni la política de privacidad dicen que el servicio es gratuito. Es el primer dato que busca una familia.
- Arreglo: añadir «Gratis» junto a los botones «Probar sin cuenta» y «Crear cuenta». Para la gratuidad de los colegios, confirmar antes con el dueño que el texto es exacto.

**7. Medio. Afirmación de privacidad demasiado amplia.**
La tarjeta «Prueba sin cuenta» dice «Todo se queda en este dispositivo». Es cierto sin cuenta, pero con cuenta los datos se sincronizan en la base de datos (política, apartado 3 y 6).
- Arreglo: «Sin cuenta, todo se queda en este dispositivo. Con cuenta, puedes verlo desde otros dispositivos de la familia.»

**8. Medio. El servicio de voz no figura en la política de privacidad.**
`api/tts.ts` envía texto a Azure (voz natural). La política dice que no hay «herramientas de analítica ni rastreo de terceros» y solo nombra a Supabase como proveedor. Los textos de las lecciones no son datos personales, pero hay un tercero que recibe las peticiones.
- Arreglo: verificar qué datos recibe Azure (solo texto de la lección o también el nombre del niño) y, en cualquier caso, nombrarlo en el apartado 6 de la política.

**9. Medio. Conflicto con las reglas del dueño en la revisión de marketing previa.**
`docs/handoff/reports/review-marketing.md`, propuesta 3, sugiere la franja «Sin publicidad · Tus datos…». El dueño prohíbe esa frase. Ya existe la forma permitida en la política: «No usamos publicidad ni la vendemos».
- Arreglo: no usar «sin publicidad» en ningún texto, y corregir esa propuesta.

**10. Bajo. Lumi no se presenta.**
Lumi aparece en la portada (imagen y alt), pero nadie dice quién es. Para un adulto que llega por primera vez, el personaje es un enigma.
- Arreglo: en la entradilla: «Lumi, un unicornio, te guía por ocho mundos mágicos…». Es el personaje central del producto.

**11. Bajo. Frase poco clara en el paso 2.**
«Si su compañero se mete en un lío, la respuesta lo salva» deja en el aire cuál es el lío y qué hace el niño. Sugerencia: «Cada respuesta correcta lo salva del lío de cada mundo.» (La mecánica exacta debe confirmarse con el juego.)

**12. Bajo. Mapa con dos nodos casi iguales.**
En `mundo1.webp` aparecen «Tablas fáciles» y «Las tablas fáciles». Esto también afecta a las capturas que se usen en redes. Renombrar uno (ya lo recoge la revisión de marketing previa).

**13. Bajo. Revisar la dirección de contacto de privacidad.**
La política usa `contact@falkir.es` y el producto es repasitos.es. Puede ser correcto, pero conviene comprobar que la familia pueda reconocerla como oficial.

---

## PARTE 1. Redes en las que empezar

| Red | Para quién | Papel | Esfuerzo |
|---|---|---|---|
| **Instagram** | Familias (30–45 años) | Base: carruseles para guardar, reels, enlace en la bio | 3 piezas por semana |
| **TikTok y YouTube Shorts** | Familias que buscan consejos para casa | Alcance: los mismos vídeos verticales que en Instagram | 0 extra (reutilizar) |
| **X** | Docentes de Primaria | Conversación con docentes; responder con valor | 10 minutos al día |
| **Facebook** | Grupos de familias y AMPA | Solo si el dueño tiene perfil personal; no crear página ahora | Opcional |
| **WhatsApp (canal)** | Familias que ya usan la app | Fase 2, cuando haya base de seguidores | Más adelante |
| **LinkedIn** | Equipos directivos y tecnología educativa | Fase 3, para colegios | Más adelante |

Motivo: las familias de 7 a 9 años están, sobre todo, en Instagram y en vídeo vertical. Los docentes que buscan recursos suelen estar en X y en grupos de docentes. Esto es una hipótesis: en la primera semana, buscar cuentas de docentes con #EducaciónPrimaria y comprobar si responden.

Esfuerzo semanal: unas 4 horas. 2 carruseles (1 hora cada uno con diseño), 1 vídeo (1 hora), 15 minutos diarios de respuestas y 1 hora semanal para colegios y revisión.

---

## PARTE 2. Pilares y calendario de 4 semanas

### Pilares

| Pilar | Reparto | Qué es | Ejemplo |
|---|---|---|---|
| **P1. Tablas que cuestan** | 40 % | Trucos y señales para saber qué tabla falla | «5 señales de que una tabla ya es suya» |
| **P2. Lumi y el bosque** | 25 % | Historia y personajes; engancha y entretiene | «¡Luna se ha enredado!» |
| **P3. Familias sin peleas** | 20 % | Cómo acompañar el repaso sin discutir | «¿Las tablas, sin discutir?» |
| **P4. Colegios y docentes** | 15 % | Cómo se usa en clase; captación | «Crea una clase con un código» |

### Calendario (semana 0 y 4 semanas)

Antes de publicar nada: arreglar ERRORES 1 a 4. No compartir el enlace hasta que el nombre de la captura esté sustituido y la imagen para compartir exista.

| Fecha | Red | Formato | Pilar | Objetivo | Pieza | Llamada a la acción |
|---|---|---|---|---|---|---|
| **Semana 0** (22–25 oct) | Todas | Configuración | — | Cuentas, bio y enlace con UTM | Crear cuentas, foto de Lumi, 3 destacados | — |
| **Semana 1** (lun 26 oct – dom 1 nov) | X | Post | P4 | Conversación con docentes | Pub. 4 | «¿Qué tabla se les atraganta más?» |
| | IG | Carrusel | P3 | Guardados | Pub. 1 (mié 28) | «Guárdalo para la próxima tarde de deberes» |
| | IG + TikTok + Shorts | Vídeo 30 s | P3 | Alcance | Pub. 2 (vie 30) | «Prueba sin cuenta: enlace en la bio» |
| | — | — | — | — | Dom 1 nov: festivo, sin publicar | — |
| **Semana 2** (lun 2 – dom 8 nov) | IG | Carrusel | P1 | Guardados | Pub. 3 (mar 3) | «¿Añadirías alguna señal?» |
| | IG + TikTok + Shorts | Vídeo 20 s | P2 | Alcance | Pub. 8 (jue 5) | «Responde a Luna: ¿cuánto es 4 × 3?» |
| | IG + X | Imagen única | P2 | Visitas | Pub. 5 (sáb 7) | «Prueba sin cuenta» |
| **Semana 3** (lun 9 – dom 15 nov) | IG | Carrusel | P1 | Visitas | Pub. 6 (mar 10) | «Gratis, en tablet, móvil u ordenador» |
| | TikTok + Shorts | Vídeo 25 s | P4 | Docentes | Pub. 7 (jue 12) | «¿Lo probarías en clase?» |
| | IG + X | Post | P4 | Captación | Pub. 9 (sáb 14) | «Escribe a tu coordinador: tenemos guía» (ver PARTE 4) |
| **Semana 4** (lun 16 – dom 22 nov) | IG | Carrusel | P3 | Confianza | Pub. 10 (mar 17) | «Repasitos: repasar, no enseñar desde cero» |
| | IG + TikTok | Reel 30 s, nueva portada | P3 | Alcance | Repetir Pub. 2 con gancho nuevo (jue 19) | «Prueba sin cuenta» |
| | — | Revisión de métricas | — | Decidir | Viernes 20 nov, 30 minutos | — |

Horarios orientativos (hora de España, a revisar con los datos de la propia cuenta): familias 20:30–21:30; docentes 14:00 (recreo de comida) o 21:30. Nota: el viernes 27 de noviembre es Black Friday; no hay que hacer nada de ofertas, porque no hay ofertas.

---

## PARTE 3. Diez publicaciones listas para usar

Cada publicación indica red, formato, pilar, texto exacto, visual y hashtags. Los hashtags son orientativos: buscar en español los que de verdad usan los docentes antes de fijarlos.

### Publicación 1. Carrusel para familias (Instagram)
- **Red y formato**: Instagram, carrusel de 6 diapositivas. Pilar P3.
- **Gancho**: «¿Tu hijo sabe las tablas o solo las recita?»
- **Texto de las diapositivas**:
  1. «¿Tu hijo sabe las tablas o solo las recita?»
  2. «Recitar 7 × 8 de memoria no es lo mismo que saber qué es.»
  3. «Lo que suele fallar: la tabla que se atasca cuando cambia el orden. 8 × 7 y 7 × 8 dan lo mismo.»
  4. «Cinco minutos al día, con una historia, cuestan menos que una pelea sobre los deberes.»
  5. «En Repasitos, cada niño elige un animal y lo rescata con cada respuesta. Tú ves qué tablas domina y cuáles toca repasar.»
  6. «Gratis, en tablet, móvil u ordenador. Prueba sin cuenta: enlace en la bio.»
- **Pie de foto**: «¿Qué tabla le cuesta más en casa? Cuéntanoslo sin nombres de niños, por favor.»
- **Visual**: diapositivas con fondo lila y texto grande; la diapositiva 5 con la captura `mundo1.webp` recortada. Sin fotos de niños.
- **Hashtags**: #TablasDeMultiplicar #RepasoEnCasa #Matemáticas #Familias
- **Mejor momento**: miércoles 20:30–21:30.

### Publicación 2. Reel para familias (Instagram, TikTok y Shorts)
- **Red y formato**: vídeo vertical de 30 segundos. Pilar P3.
- **Gancho**: «¿Las tablas, sin discutir?»
- **Guion**: ver GUIÓN 1.
- **Pie de foto**: «Repasar las tablas sin pelea es posible. Así lo hacemos en Repasitos. Enlace en la bio.»
- **Hashtags**: #RepasoEnCasa #TablasDeMultiplicar #Familias
- **Mejor momento**: viernes 20:30–21:30.

### Publicación 3. Carrusel para docentes (Instagram)
- **Red y formato**: Instagram, carrusel de 6 diapositivas. Pilar P1.
- **Gancho**: «5 señales de que una tabla ya es suya.»
- **Texto de las diapositivas**:
  1. «5 señales de que una tabla ya es suya.»
  2. «Responde sin contar con los dedos.»
  3. «Sabe la inversa: 3 × 7 y 7 × 3 le salen igual de rápido.»
  4. «La dice bajo presión, en la pizarra, sin pensarlo mucho.»
  5. «La usa en un problema de la vida diaria: el precio de tres bolsas con cuatro bollos cada una.»
  6. «Si falla una de estas, no es falta de esfuerzo: toca repasar. ¿Añadirías alguna?»
- **Pie de foto**: «¿Qué señal usas tú en clase? Te leemos.»
- **Visual**: fondo blanco, tipografía grande, un icono por señal. Sin fotos de aulas con alumnos.
- **Hashtags**: #DocentesPrimaria #EducaciónPrimaria #MatemáticasPrimaria
- **Mejor momento**: martes 14:00.

### Publicación 4. Post para docentes (X)
- **Red y formato**: post de texto (unos 200 caracteres; cabe en el límite de 280).
- **Texto exacto**: «Pregunta honesta a docentes de Primaria: ¿qué tabla se les atraganta más a vuestros alumnos a estas alturas de curso? Estamos construyendo algo para repasarlas en casa y queremos aprender de vosotros.»
- **Visual**: ninguna, o la imagen `mundo1.webp` recortada.
- **Llamada a la acción**: la pregunta. Responder a cada respuesta durante las primeras 2 horas.
- **Mejor momento**: lunes 14:00.

### Publicación 5. Imagen única del mundo (Instagram y X)
- **Red y formato**: imagen 1080×1350 (Instagram) y 1200×675 (X). Pilar P2.
- **Texto exacto**: «¡Luna se ha enredado en las lianas de las hadas! Para liberarla hay que repasar en el Bosque de los Grupos. Gratis, en tablet, móvil u ordenador. Enlace en la bio.»
- **Visual**: captura `mundo1.webp` completa con el mensaje superior visible.
- **Hashtags**: #Repasitos #Matemáticas
- **Mejor momento**: sábado 10:00 (hora local).

### Publicación 6. Carrusel de cómo funciona (Instagram)
- **Red y formato**: carrusel de 4 diapositivas. Pilar P1.
- **Texto de las diapositivas**:
  1. «Cómo funciona Repasitos, en tres pasos.»
  2. «1. Elige compañero: gato, perro, zorro, conejo, panda, pingüino, dragón o unicornio bebé.»
  3. «2. Rescátalo: cada mundo tiene un guardián y una prueba. Cada respuesta cuenta.»
  4. «3. Repasa lo que toca. Con los ocho cristales se abre el Gran Cofre, y la familia elige el premio.»
- **Pie de foto**: «Repasar en casa, gratis y sin convertirlo en pelea. Prueba sin cuenta, enlace en la bio.»
- **Visual**: ilustraciones de los animales compañeros (no fotos de niños); Lumi en la última diapositiva.
- **Hashtags**: #RepasoEnCasa #Familias #TablasDeMultiplicar
- **Mejor momento**: martes 20:30–21:30.

### Publicación 7. Vídeo corto para docentes (TikTok, Shorts y Reel)
- **Red y formato**: vídeo vertical de 25 segundos. Pilar P4.
- **Gancho**: «Una tabla al día, 3 minutos.»
- **Guion**: ver GUIÓN 3.
- **Pie de foto**: «¿Lo probarías en clase? Pregunta en comentarios.»
- **Hashtags**: #DocentesPrimaria #EducaciónPrimaria
- **Mejor momento**: jueves 14:00.

### Publicación 8. Vídeo corto de Lumi (TikTok, Shorts y Reel)
- **Red y formato**: vídeo vertical de 20 segundos. Pilar P2.
- **Gancho**: «¡Luna se ha enredado!»
- **Guion**: ver GUIÓN 2.
- **Pie de foto**: «Responde a Luna: ¿cuánto es 4 × 3? Solución en el vídeo.»
- **Hashtags**: #Matemáticas #Unicornio #TablasDeMultiplicar
- **Mejor momento**: jueves 20:30–21:30.

### Publicación 9. Post para colegios (X e Instagram)
- **Red y formato**: post de texto con una imagen de la pantalla de clase (sin alumnos). Pilar P4.
- **Texto exacto**: «Para colegios: crea una clase, comparte el código con las familias y mira el progreso de la clase. Repasitos ayuda a repasar, no sustituye al profesor. Si tienes curiosidad, te enviamos una guía de un solo folio.»
- **Visual**: captura de la vista de clase (`leccion-grupos.webp` no es de clase; crear una captura de demostración antes de usar esta).
- **Llamada a la acción**: escribir al correo de contacto.
- **Mejor momento**: sábado 10:00.
- Nota: la «guía de un solo folio» debe existir antes de publicar.

### Publicación 10. Confianza y privacidad (Instagram)
- **Red y formato**: carrusel de 3 diapositivas. Pilar P3.
- **Texto de las diapositivas**:
  1. «Tus datos, en tus manos.»
  2. «Puedes descargarlos o borrarlos cuando quieras. Desde la zona de adultos, en el informe de cada perfil.»
  3. «No usamos publicidad ni la vendemos. Política completa en repasitos.es, en privacidad y datos.»
- **Pie de foto**: «Lo que hay que saber antes de probarla. Enlace en la bio.»
- **Visual**: fondo verde suave; iconos de descarga y de borrado.
- **Hashtags**: #PrivacidadDeDatos #Familias
- **Mejor momento**: martes 20:30–21:30.

---

### GUIÓN 1. Reel de 30 segundos para familias («¿Las tablas, sin discutir?»)

| Tiempo | Plano / imagen | Texto en pantalla | Locución (voz en off, la graba el dueño) |
|---|---|---|---|
| 0–3 s | Tablet sobre una mesa, sin personas | «¿Las tablas, sin discutir?» | «¿Cuántas veces has discutido por las tablas?» |
| 3–8 s | Captura de la pantalla de inicio con un perfil de demostración | «Un compañero que hay que rescatar» | «En Repasitos, cada niño elige un animal y lo rescata con cada respuesta.» |
| 8–15 s | Captura `mundo1.webp`, con zoom lento | «Ocho mundos, cada uno con su prueba» | «Ocho mundos, y en cada uno un guardián y una prueba.» |
| 15–22 s | Captura del informe con un perfil de demostración (pendiente de hacer) | «Ves qué tablas domina y cuáles repasar» | «Tú ves qué tablas domina y cuáles toca repasar.» |
| 22–27 s | Pantalla con el botón «Probar sin cuenta» | «Gratis. Prueba sin cuenta.» | «Gratis, y puedes probarla sin cuenta.» |
| 27–30 s | Lumi sobre fondo lila | «Enlace en la bio» | «Enlace en la bio.» |

Nota: el vídeo final no debe mostrar ningún nombre real. Usar siempre un perfil de demostración.

### GUIÓN 2. Vídeo de 20 segundos de Lumi (bucle)

| Tiempo | Plano / imagen | Texto en pantalla | Locución |
|---|---|---|---|
| 0–2 s | Ilustración de Luna enredada entre lianas | «¡Luna se ha enredado!» | «¡Luna se ha enredado!» |
| 2–8 s | Captura `leccion-grupos.webp` | «4 grupos de 3 setas. ¿Cuántas son?» | «Mira: las hadas han plantado cuatro grupos de tres setas. ¿Cuántas son?» |
| 8–12 s | Pausa de 3 segundos con la pregunta | «¿12?» | «Piénsalo un momento.» |
| 12–17 s | Animación: Luna libre | «¡12! Luna sale libre» | «Doce. ¡Luna sale libre!» |
| 17–20 s | Lumi y el enlace; el último fotograma enlaza con el primero | «Repasa con una historia» | «Repasa con una historia. Enlace en la bio.» |

Nota: el bucle requiere que el último fotograma vuelva al primero. Confirmar que la captura de la lección es la de un ejercicio de multiplicación real del juego.

### GUIÓN 3. Vídeo de 25 segundos para docentes («Una tabla al día, 3 minutos»)

| Tiempo | Plano / imagen | Texto en pantalla | Locución |
|---|---|---|---|
| 0–3 s | Pizarra vacía o captura de la lección | «Una tabla al día, 3 minutos» | «Una tabla al día, 3 minutos.» |
| 3–10 s | Captura de la lección por grupos | «Mira: 4 grupos de 3» | «Cada ejercicio es un paso, con una pregunta cada vez.» |
| 10–18 s | Captura del Repaso del día | «El repaso del día reúne lo que cuesta» | «El repaso reúne lo que cuesta, no lo que ya sabe.» |
| 18–25 s | Pantalla de clase con código | «Para docentes: crea una clase con código» | «Crea una clase y comparte el código con las familias. Pregunta en comentarios.» |

Nota: «3 minutos» es una duración orientativa. Medirla con una sesión real antes de publicarla como promesa.

---

## PARTE 4. Colegios y AMPAs, sin invadir

Principios: ningún mensaje directo a menores ni a sus familias; ningún correo masivo; nada de listas compradas; nada de fotos de aulas; el colegio decide.

1. **Preparar una guía de un solo folio** para docentes: qué es, qué ve el docente, cómo crear una clase con código, y el aviso de que el colegio es el responsable de los datos (política, apartado 1). Debe existir antes de la publicación 9.
2. **Piloto de 4 semanas con 2 o 3 docentes** que el dueño ya conozca, o que respondan en X. Ofrecer acceso sin coste y pedir una valoración de 10 minutos al final.
3. **Contacto con el colegio**: un correo único a la dirección general o a secretaría, con el asunto «Repasitos para tercer ciclo: piloto gratuito de 4 semanas». Un solo mensaje y como mucho un recordatorio a las dos semanas.
4. **AMPA**: pedir al equipo directivo que lo difunda en el tablón o en su boletín. Solo entrar en un grupo de WhatsApp de familias si el AMPA lo acepta; nunca por cuenta propia.
5. **Docentes en X e Instagram**: responder a sus publicaciones con valor (un truco de tablas, una pregunta útil), sin enlace de venta. Seguir durante dos semanas antes de cualquier propuesta.
6. **Formación del profesorado**: en Aragón, los centros de formación del profesorado (CIFE) organizan actividades; proponer una demostración de 15 minutos si el centro lo pide.
7. **Evitar**: correos masivos, listas compradas, testimonios inventados, fotos de aulas con alumnos y cualquier mensaje a menores.

Métrica de colegios: número de clases creadas y número de docentes que contestan (no que se suscriben).

---

## PARTE 5. Qué medir

| Indicador | Dónde se mira | Cómo | Objetivo orientativo |
|---|---|---|---|
| **Métrica estrella**: familias que pulsan «Probar sin cuenta» o «Crear cuenta» desde redes | Enlace con UTM | Contar pulsaciones en el enlace (ver aviso abajo) | Fijar la línea base la semana 1; después, crecer cada semana |
| Visitas desde redes | Enlaces con UTM (`utm_source=instagram`, `tiktok`, `x`) | Analítica externa (ver aviso) | Tendencia al alza en 4 semanas |
| Guardados y compartidos por pieza | Instagram Insights y TikTok | Ver cada pieza a las 48 horas | Guardados > «me gusta» (señal de contenido útil) |
| Retención de vídeo (% visto, abandono en 3 s) | TikTok, Shorts e Instagram | Panel de cada vídeo | Más del 40 % de visualización completa en 30 s, orientativo |
| Respuestas de docentes | X | Número de respuestas con valor | 5 conversaciones con docentes en el primer mes |
| Clases creadas y docentes que responden | Panel interno de la app | Contar clases | Hipótesis: 1 piloto en el primer mes |
| Seguidores de calidad | Instagram | Cuentas de docentes y familias, no solo número | No usar el total de seguidores como éxito |

**Aviso sobre la analítica**: la política de privacidad dice que no hay herramientas de analítica ni rastreo de terceros. Para medir visitas con una herramienta externa hay que cambiar esa frase y describir la herramienta en la política. Mientras tanto, medir solo con UTM en los enlaces y los datos que el propio dueño ya ve en las redes.

**Revisión cada viernes (30 minutos)**: qué pieza funcionó (guardados, visitas), cuál no, y qué se repite la semana siguiente. Cambiar un solo elemento por pieza (gancho, imagen o llamada a la acción) para saber qué lo causó.

---

## PROPUESTAS

Ordenadas por prioridad. Las marcadas como «antes de publicar» son condiciones previas.

1. **Antes de publicar**: sustituir la captura `nino-inicio.webp` por un perfil de demostración (ERRORES 1).
2. **Antes de publicar**: añadir Open Graph, Twitter Card y canonical en `index.html`, con imagen 1200×630 (ERRORES 2 y 3).
3. **Antes de publicar**: unificar el posicionamiento en «repasar» en el título, la descripción y la portada (ERRORES 5).
4. **Antes de publicar**: añadir «Gratis» en la portada y en los botones (ERRORES 6).
5. **Esta semana**: corregir la frase de privacidad de «Prueba sin cuenta» (ERRORES 7) y revisar qué datos envía la voz a Azure, y nombrarlo en la política (ERRORES 8).
6. **Esta semana**: presentar a Lumi en la entradilla de la portada (ERRORES 10).
7. **Esta semana**: prerenderizar `/welcome` y añadir `sitemap.xml` (ERRORES 4).
8. **Semana 2**: crear el perfil de demostración con nombre genérico y capturas nuevas de la pantalla de clase y del informe para usar en vídeos y redes.
9. **Semana 2**: redactar la guía de un solo folio para docentes (PARTE 4, punto 1).
10. **Semana 3**: decidir si se añade analítica sin cookies y, si se hace, actualizar la política de privacidad antes.
11. **Más adelante**: canal de WhatsApp para familias y página de LinkedIn, cuando haya base de seguidores y clases piloto.
12. **Nunca**: «sin publicidad», urgencias falsas, rankings entre niños o colegios, y fotos de niños.
