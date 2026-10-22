# Revisión frontend de Numeria (tablet)

Fecha: 2026-10-22. Alcance: revisión visual y de código. No se ha tocado código.
Capturas: /tmp/numeria-review-front/ (kids-ipad.png, play-ipad.png, play-ipadp.png, play-android.png, map-w1-ipad.png, map-w1-ipadp.png, map-w1-android.png, adult-ipadp.png, onboarding-ipad.png, lesson-node-ipad.png, lesson-node-ipadp.png).
Dispositivos: iPad horizontal (1180x820), iPad vertical (820x1180), Android (1280x800). Ruta de mundo válida: `/play/w/w1` (`forest` no existe y redirige a inicio).
Excluidos por encargo: bocadillos cortados, voz y reconocimiento del signo ×.

## Propuestas priorizadas

### 1. Un solo botón de volver y de salir (alta, esfuerzo M)
- Dónde: `src/ui/index.tsx:54-56` (TopBar, círculo con «‹» de 28 px); `src/world/map/WorldMapScreen.tsx:95-96` (copia del mismo chevron); `src/adult/gate/AdultGate.tsx:393` (texto «Volver a la zona de niños»); `src/activities/lesson/LessonPlayer.tsx:134-135` («✕ Salir», ghost); `src/world/review/DailyReview.tsx:52` («Salir», secondary); `src/world/story/StoryPlayer.tsx:157` («Salir», secondary); `src/activities/groups/OpsShell.tsx:26` (redondo, solo aria-label «Salir»); `src/activities/facts/shared/ActivityFrame.tsx:36` (redondo, «Salir del juego»); `src/adult/home/AdultHomeScreen.tsx:47` («Salir», ghost en la barra).
- Problema: hay cinco estilos de salida distintos. En la captura de la lección (lesson-node-ipad.png) el chevron está en círculo y el «✕ Salir» de la misma pantalla no se ve en el DOM de la barra; en juegos aparecen píldora y círculo. El niño no sabe si «Salir» abandona la lección o vuelve al mapa.
- Cambio: componente `BackButton` único (chevron + etiqueta corta «Volver» visible en tablet, 56 px mínimo) para navegación; para abandonar una actividad, un solo estilo «Salir» con confirmación si hay progreso. Sustituir los cinco casos por ese componente.
- Esfuerzo: M (un componente, sustituciones en 9 sitios, tests de `TopBar` y de las pantallas afectadas).

### 2. Botones de salida por debajo del mínimo táctil (alta, S)
- Dónde: `src/ui/ui.module.css:28` (`.sm { min-height: 44px; min-width: 44px }`); `src/styles/tokens.css:76` (`--tap-min: 56px`, «nunca hacer más pequeño un objetivo táctil»).
- Problema: `DailyReview.tsx:52`, `LessonPlayer.tsx:134` y `OpsShell.tsx:26` usan `size="sm"` o `round` sin `tap-min`, por lo que el objetivo queda en 44 px en un dispositivo para niños con lápiz y dedo. El propio `StoryPlayer.module.css:118` lo reconoce y lo corrige con clase propia.
- Cambio: que `.sm` no baje de `var(--tap-min)` en `min-height`, o eliminar `sm` en botones de salida.
- Esfuerzo: S.

### 3. Texto demasiado pequeño para 7-8 años (alta, S)
- Dónde: `src/styles/tokens.css:16` (`--fs-xs: clamp(12px, …)`), `tokens.css:17` (`--fs-sm` desde 14 px); se usan en «Guardado en este dispositivo» (ChildHomeScreen), «Mundo 1» (`WorldMapScreen.module.css:13`, `.kicker` con `--fs-xs`), subtítulos y pastillas.
- Problema: en la captura de inicio (play-ipad.png) «Guardado en este dispositivo», «Hola» y los subtítulos de tarjetas quedan entre 12 y 14 px reales en iPad. Para lectura autónoma de 7-8 años el mínimo cómodo es 16 px.
- Cambio: subir el suelo de `--fs-xs` a 14 px y el de `--fs-sm` a 16 px; revisar que los contenedores aguanten el aumento (las pastillas de mundo ya son de dos líneas en vertical).
- Esfuerzo: S.

### 4. Pantalla de inicio de niños: texto sobre decoración y etiqueta que cruza el globo (alta, S)
- Dónde: `src/world/picker/ChildPickerScreen.tsx:29` (subtítulo «Elige tu cuaderno de aventuras…»), `:57` (`addText` «Añadir otro niño o niña»); estilos en `ChildPickerScreen.module.css`.
- Problema (kids-ipad.png): el subtítulo pasa por encima de una nube y del arcoíris; la etiqueta «Añadir otro niño o niña» atraviesa el contorno del globo y pierde contraste sobre el trazo. El recuadro punteado del globo se cruza con la tarjeta de Inessa.
- Cambio: ponerle a los textos un fondo sólido redondeado o una franja de contraste; mover la etiqueta debajo del globo, no sobre él; alinear el recuadro punteado con la tarjeta.
- Esfuerzo: S.

### 5. Barra de mundos sobre la alfombra y estado bloqueado sin contraste (alta, M)
- Dónde: `src/world/home/ChildHomeScreen.module.css:144-152` (`.worlds`, flex-wrap, centrado sobre la escena), `:153-157` (`.chip`, min-height 56 px); el código de estado bloqueado está en `ChildHomeScreen.tsx`.
- Problema: en horizontal (play-ipad.png) los siete mundos bloqueados aparecen en gris claro sobre una alfombra lila; la barra queda pegada al borde inferior. En vertical (play-ipadp.png) se parten en dos filas y tapan la estantería. En Android (play-android.png) «Castillo» llega casi al borde derecho.
- Cambio: fondo sólido de la barra (`--c-surface` con sombra), candado y texto «Bloqueado» de forma explícita (no solo opacidad), y en vertical una sola fila con scroll horizontal con indicador.
- Esfuerzo: M.

### 6. Estado deshabilitado con el lenguaje de «zona de soltar» (media, S)
- Dónde: `src/world/onboarding/OnboardingScreen.module.css:112-119` («Siguiente» deshabilitado con borde punteado de 3 px); en la lección, `Pista 0 de 3` (`LessonPlayer`, captura lesson-node-ipad.png) usa el mismo punteado para una acción activa.
- Problema: el punteado significa «inactivo» en onboarding y «pista» en lecciones. El niño lo ve como un botón sin texto claro. El texto «Escribe tu nombre» y «Siguiente» tienen contraste bajo (onboarding-ipad.png).
- Cambio: deshabilitado = primario con opacidad 0.5 y cursor neutro, más un texto breve que explique qué falta («Escribe tu nombre»); reservar el punteado para pistas.
- Esfuerzo: S.

### 7. Hueco vertical grande en las lecciones (media, S/M)
- Dónde: `src/activities/lesson/LessonPlayer.module.css:46-91` (`.stage`, `min-height: 0`, `justify-content: flex-end`).
- Problema (lesson-node-ipad.png): entre el enunciado y la tarjeta de ejercicio hay unos 300 px vacíos en horizontal; en vertical (lesson-node-ipadp.png) el bloque de ejercicio queda a media altura y la mitad inferior vacía. El ejercicio no aprovecha la tablet y el mensaje de «Truco» queda suelto.
- Cambio: centrar el bloque verticalmente con un máximo de anchura, o ampliar el número y el área de escritura para que el espacio tenga función.
- Esfuerzo: S/M.

### 8. Bundle de entrada de 741 KB (227 KB gzip) (media, M)
- Dónde: `dist/assets/index-C9BO11gL.js` (741 KB sin comprimir, 227 KB gzip); `src/app/App.tsx:4-7` importa de forma estática `@/data`, `@/ink`, `@/audio` y `@/ui`, que entran en el chunk de arranque.
- Problema: rutas están bien partidas con `lazy`, pero el arranque carga datos, tinta y audio enteros antes de pintar el inicio. En una tablet modesta o en red móvil eso retrasa la primera pantalla.
- Cambio: medir con `vite build` + informe de rollup qué módulos entran en el chunk de entrada; cargar `@/audio` y `@/ink` en diferido (`import()` tras el primer toque), y exportar desde `@/data` solo lo necesario para el arranque.
- Esfuerzo: M. Verificar antes de tocar: no se ha perfilado en un dispositivo real.

### 9. Fuentes en WOFF sin comprimir y una cursiva posiblemente sin uso (media, S)
- Dónde: `src/styles/tokens.css:4-8` (`@font-face` con `.woff`); `public/fonts/` (~800 KB en total: Andika regular 228 KB, bold 230 KB, italic 245 KB; Fredoka 4 pesos ~105 KB).
- Problema: el tamaño de descarga de fuentes supera al de los estilos. La cursiva (`Andika-Italic.woff`, `tokens.css:6`) no he encontrado su uso en `src` durante esta revisión; hay que confirmarlo antes de quitarla.
- Cambio: convertir a WOFF2 (suele reducir a la mitad o menos), subconjunto latino y eliminar la cursiva si no se usa. Añadir `<link rel="preload">` solo a la fuente del título.
- Esfuerzo: S.

### 10. Animaciones continuas en tablet modesta (media, M)
- Dónde: 21 ficheros importan `motion` (p. ej. `src/world/rewards/RewardOverlay.tsx:4`, `src/activities/memory/index.tsx:4`, `src/world/onboarding/OnboardingScreen.tsx:6`); fondos animados en `src/art/worlds/WorldBackground.tsx` y `ambient.module.css`, y `Sparkles.tsx`.
- Problema: la escena de inicio tiene nubes, globos, luces y estrellas moviéndose a la vez; no he medido FPS en un iPad real. Hay un hook `useReducedMotion` (`src/art/worlds/useReducedMotion.ts`), pero no he verificado que cubra las capas ambientales ni que el CSS las pare con `prefers-reduced-motion`.
- Cambio: medir con Performance en Safari (iPad) o Chrome (Android); pausar capas ambientales fuera de vista (`IntersectionObserver`) y con `prefers-reduced-motion`; animar solo `transform` y `opacity`.
- Esfuerzo: M. Hipótesis a confirmar con medición.

### 11. Cabecera de inicio apretada en vertical (baja, S)
- Dónde: ChildHomeScreen (cabecera con «Guardado en este dispositivo», «Cambiar», «Familia»).
- Problema (play-ipadp.png): la pastilla de estado ocupa casi todo el ancho y «Cambiar»/«Familia» quedan pegados al borde derecho; en Android (play-android.png) el borde derecho queda a 25 px.
- Cambio: en estrecho, mover el estado debajo del saludo o reducirlo a un punto con texto accesible.
- Esfuerzo: S.

### 12. Nombres de nodo de tres líneas sobre el tronco del árbol (baja, S)
- Dónde: `src/world/map/WorldMapScreen.module.css` (etiqueta de nodo) y `WorldMapScreen.tsx:140-160`.
- Problema (map-w1-ipad.png): «El desafío del Búho Sabio» ocupa tres líneas y se monta sobre el tronco derecho; «¡Borrón desordena las setas!» se parte en dos.
- Cambio: anchura fija de etiqueta y máximo de dos líneas; con más espacio, colocarla bajo el nodo.
- Esfuerzo: S.

### 13. Carga sin mensaje ni anuncio (baja, S)
- Dónde: `src/app/routes.tsx` (`<Suspense fallback={<Spinner />}>`) y `src/app/routes.tsx` (`RequireChild`, `loading`).
- Problema: el spinner no tiene texto ni `role="status"`, y el niño no entiende que está cargando. Para lectores de pantalla no se anuncia.
- Cambio: `role="status"` con «Cargando…» visible y animación suavizada con `prefers-reduced-motion`.
- Esfuerzo: S.

### 14. Pantalla de adultos: dos salidas con estilos distintos (baja, S)
- Dónde: `src/adult/gate/AdultGate.tsx:393` (texto «Volver a la zona de niños» en la parte inferior) frente a la cabecera con chevron (adult-ipadp.png).
- Problema: se vuelve por dos caminos con aspecto diferente. Se incluye en el punto 1 como caso del mismo patrón; aquí queda como ajuste de copy y posición.
- Cambio: una sola salida; si se mantiene el enlace inferior, que sea el mismo componente del punto 1.
- Esfuerzo: S.

### 15. Estados vacíos sin revisar (información, no propuesta de cambio)
- No se han capturado pantallas vacías (álbum sin pegatinas, sin repasos pendientes, tienda sin compras). Revisar después con la semilla `--seed` y sin ella.

## Lo que está bien
- Las rutas de mundo, lección y juego se cargan de forma diferida (`routes.tsx`), y `vite.config` ya configura el service worker.
- Los objetivos de `Pista`, el botón verde de comprobar y el área de escritura tienen tamaño generoso para lápiz y dedo.
- La paleta y la ilustración de mundos dan una identidad clara y coherente.

## Limitaciones
- No se han capturado lecciones de multiplicación por grupos, historias ni la división; solo la lección «Tablas fáciles».
- No hay medición de rendimiento real (FPS, LCP, INP) en dispositivo; las propuestas de animación y bundle son hipótesis con evidencia de tamaño y de código.
- No se han revisado el álbum, la tienda, el diploma ni la zona de adultos con datos reales.
