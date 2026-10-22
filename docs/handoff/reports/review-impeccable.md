# Revisión Impeccable: Repasitos (solo auditoría, sin cambios de código)

Método: single-context (⚠️ DEGRADED: single-context, no se han lanzado subagentes de evaluación A/B). Detector: `detect.mjs --json src` (61 hallazgos, código de salida 2). Capturas: iPad horizontal (1180x820) en casi todas las pantallas; iPad vertical en inicio, alta, división (ver limitaciones); Android (1280x800) y móvil (390x844) en portada y mapa. Capturas en `/tmp/repasitos-impeccable/`. Nada se ha tocado en `src/`.

Limitaciones de la captura: `/play/w/w8/division` y `/play/w/w4/word` redirigen a inicio (el niño de prueba no tiene desbloqueado ese mundo), así que la división y los problemas no están revisados en pantalla. No se han capturado estados de error, vacío, carga ni "ajustes" tras el PIN. Los contrastes son estimaciones visuales; hay que medirlos con una herramienta antes de darlos por buenos.

## Veredicto de especificidad

Repasitos ya no es intercambiable: el mundo de fondo (bosque, río, cuarto de Inessa), Lumi, Luna, los cristales y el cofre dan identidad propia. La dirección C se ve coherente en portada, inicio, mapa, historia, lección, actividades, álbum, tienda, cofre y diploma. Lo que se queda fuera del estilo son las pantallas de cuenta y de adultos (login, alta, zona de adultos, informe), que usan tarjetas planas con sombra dura y botones morados que se parecen más a un panel genérico. No es un fallo grave, pero se nota el salto.

## Puntuación (Nielsen, 40 max)

| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Estado del sistema | 3 | Bien en inicio ("Guardado en este dispositivo"); falta confirmación visible al acertar en algunas actividades (no verificado) |
| 2 | Lenguaje del mundo real | 3 | Textos claros para 7-9 años; "Piedras con llevadas" y "Cuentas en columna" son jerga de aula |
| 3 | Control del usuario | 3 | Salir/Volver siempre visibles; "Saltar" en historia |
| 4 | Consistencia | 2 | Estilo C en el niño; login, alta y zona de adultos con otro lenguaje |
| 5 | Prevención de errores | 3 | Teclado numérico de PIN con validación; falta confirmación antes de salir a mitad de actividad (no verificado) |
| 6 | Reconocimiento | 3 | Mapa con nombres de nodo visibles, aunque en móvil se tapan |
| 7 | Flexibilidad | 2 | Juego libre y tablas; sin atajos |
| 8 | Estética y minimalismo | 3 | Cofre y diploma densos; columnas con mucho vacío |
| 9 | Recuperación de errores | n/a | No se ha provocado ningún error |
| 10 | Ayuda | 1 | Ayuda solo mediante "Pista" y "Escuchar"; sin ayuda contextual para adultos |

Total: 28/36 (sin la 9). Banda: Good (78%).

Auditoría técnica (5 dimensiones, 0-4): Accesibilidad 2, Rendimiento 3 (no medido), Responsive 3, Tematización 3, Integridad de implementación 3. Total 14/20, banda Good.

## ERRORES

**E1. Etiquetas del mapa cortadas en móvil (P1).**
- Archivo: `src/world/map/WorldMapScreen.module.css:134` (`.label { width: 200px }`).
- Captura: `09b-mapa-phone.png`. En 390px, "¡Borrón desordena las setas!", "...lianas de las hadas" y "Filas de flores" salen del borde; "Practica con los trucos" queda tapada por la estrella de puntuación y el nodo; "Parejas del bosque" tapa su propio nodo.
- Arreglo: limitar el ancho con `max-width: min(200px, calc(100vw - 32px))` y, para el móvil, recolocar la etiqueta dentro del viewport (clamp del `left` del nodo). Para las estrellas, subirlas dentro de la etiqueta o moverlas bajo ella con un offset fijo.

**E2. Botón "Comprobar" tapado por la mascota y recortado abajo en la pantalla de columnas (P1).**
- Archivo: `src/activities/views/ColumnView.tsx` (barra inferior con "Pista" y "Comprobar"); el solapamiento viene de la mascota fija de la esquina inferior derecha.
- Captura: `17-columnas-ipad.png`. El texto "Comprobar" queda cortado por el gato y el unicornio; la barra baja hasta el borde del viewport y no hay margen seguro.
- Arreglo: reservar un espacio de 96px a la derecha de la barra (o colocar la mascota encima del área de juego, no encima de la barra), y añadir `padding-bottom: env(safe-area-inset-bottom)` más 16px.

**E3. Rojo de error usado como estado neutro en "Los collares de las hadas" (P2).**
- Archivo: `src/activities/views/SkipCountView.tsx:79` (pastilla "Pista 0 de 3") y el aro rojo de la perla marcada y los "?" discontinuos, que usan `--c-error` (`src/styles/tokens.css:41`).
- Captura: `14-collar-ipad.png`. Antes de cualquier error ya aparece rojo: el aro de la perla activa, los "?" y la pista. Los tokens dicen que el error es "suave" y nunca una pantalla roja, pero aquí se usa como color de foco.
- Arreglo: reservar `--c-error` solo para respuestas incorrectas; para la perla activa, usar el morado primario con grosor 4px, y para los huecos, el borde morado discontinuo.

**E4. Detector: rebote y pestaña lateral en componentes activos (P2).**
- Archivo: `src/styles/tokens.css:91` (`--ease-bounce: cubic-bezier(.34, 1.56, .64, 1)`), usado en al menos 25 hojas de estilo (ej. `src/activities/views/DivisionView.module.css`, `src/ink/DigitCell.module.css`, `src/world/host/CompanionBuddy.module.css`, `src/art/worlds/items.module.css`).
- Detector: 61 hallazgos en total: 35 `bounce-easing`, 13 `side-tab`, 6 `layout-transition`, 1 `codex-grid-background` (`src/activities/views/DivisionView.module.css`).
- Captura: "Juego libre" (`21-libre-ipad.png`) muestra las tarjetas con barra lateral de color, que es justo el patrón `side-tab`.
- Arreglo: sustituir `--ease-bounce` por `cubic-bezier(.16,1,.3,1)` (ease-out-expo) salvo en la recompensa de cristal; quitar las barras laterales y usar un chip de color con el nombre del mundo; animar `transform`/`opacity` en vez de `width`/`height` en `src/world/album/album.module.css` y `src/activities/lesson/LessonPlayer.module.css`.

**E5. Inicio en vertical: la barra de mundos se corta por la derecha (P2, a verificar).**
- Archivo: `src/world/home/ChildHomeScreen.module.css:278` (`overflow-x: auto` por debajo de 1000px).
- Captura: `08b-inicio-ipad-portrait.png`. El último mundo ("Castillo") queda cortado en el borde. Puede ser intencionado (scroll horizontal), pero no hay indicador de que se puede deslizar.
- Arreglo: añadir un degradado de fundido a la derecha o un indicador de scroll; si no se quiere scroll, reducir `min-width` a 96px para que quepan los seis.

**E6. Texto secundario de baja legibilidad en botones deshabilitados (P2, medir).**
- Archivo: `src/activities/array/index.tsx:80` ("Llena todos los huecos") y la clase de estado deshabilitado en `src/activities/views/ArrayView.module.css`.
- Captura: `13-filas-ipad.png`. Texto morado claro sobre lavanda claro; a ojo no llega a 4.5:1. Hay que medirlo.
- Arreglo: usar `--c-ink-mute` (#6f5f8f, documentado como 5.2:1 sobre `surface-2`) también en el estado deshabilitado, o subir el fondo a un tono más oscuro.

## PROPUESTAS (por prioridad; esfuerzo S/M/L)

1. **Pantallas de cuenta y adultos con el lenguaje C** (login, alta, zona de adultos, informe; P1; M). Hoy usan tarjeta blanca con borde plano y botones de un morado frío; bajar a la paleta del niño (fondo lavanda con Lumi/Luna en la cabecera, tarjetas con sombra dura amarilla/rosa como en inicio). Afecta a `src/adult/auth/*`, `src/adult/gate/AdultGate.tsx`, `src/adult/child/ChildReportScreen.tsx`.
2. **Tarjetas de alta con borde casi invisible** (signup, "Familia / Colegio"; P2; S). El borde lavanda claro no marca el seleccionado; usar borde 3px morado y un check visible al elegir.
3. **Recorte de la división y problemas en el móvil** (no revisado; P2; S). Hay que volver a capturar con un niño que tenga desbloqueado el mundo 8 y el mundo 4.
4. **Estado vacío y de carga del álbum/tienda** (no revisado; P2; S). Capturar con datos vacíos para comprobar el mensaje y el esqueleto.
5. **Diploma con texto apretado** (`25-diploma-ipad.png`; P3; S). "DIPLOMA" casi toca el marco superior y "Lumi, unicornio guardián" queda sobre el borde inferior; subir 8px el contenido interior y dar 16px de margen al pie.
6. **Lección: mucho espacio vacío arriba** (`11-leccion-ipad.png`; P3; S). La tarjeta de la izquierda tiene la ilustración centrada con 300px vacíos. Centrar verticalmente o ampliar la ilustración.
7. **Portada móvil: la captura de "Una lección" sale en blanco** (`03-portada-phone.png`; P3; S). El archivo `public/landing/leccion-grupos.webp` existe (23 KB). Probablemente es carga diferida que la captura de página completa no dispara; comprobar con `loading="eager"` o con una captura tras hacer scroll antes de tocar nada.
8. **Enlaces de login separados con demasiado espacio vertical** (`04-login-ipad.png`; P3; S). "He olvidado la contraseña" y "Enviarme un enlace" tienen un hueco de unos 60px; reducir a 16px.
9. **Ayuda contextual para adultos** (heurística 10 = 1; P3; M). El informe tiene "Compartir resumen" pero no explica qué es el mapa de calor más allá de una frase; añadir un "¿Qué significa?" junto a la leyenda.
10. **Contraste a medir** (P2; S). Medir con una herramienta: "Atrás" (lección), "Escuchar", texto de "Pista", subtítulos de tarjetas del álbum ("0/3"). Las estimaciones visuales son de borde.

Próximo paso sugerido: `/impeccable polish` sobre los ERRORES E1 y E2 (mapa y columnas en móvil y iPad), después `/impeccable adapt` para la portada vertical y el móvil, y `/impeccable typeset` para el diploma y los subtítulos.
