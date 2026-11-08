# Canciones de las tablas: plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development (recomendada) o superpowers:executing-plans para ejecutar el plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que cada tabla tenga una canción. La voz de la app recita la tabla al ritmo de una música de marimba, con karaoke. En una segunda vuelta, «¡Tu turno!», la voz se calla en las multiplicaciones que le cuestan al niño y este toca la burbuja correcta.

**Arquitectura:**
- La lógica pura vive en `src/world/cancion/logic.ts`: versos, huecos, niveles, burbujas y tabla más fallada.
- El secuenciador (`sequencer.ts`) es asíncrono y recibe sus dependencias (decir, esperar compás y preguntar), así que se prueba sin audio.
- La pantalla `CancionScreen` lo conecta con `music` (un tema nuevo, «song», con reloj de compás) y con `speech` (precarga y voz del dispositivo forzada).
- Las estrellas se guardan como marcas `flags` del progreso, que ya se fusionan con OR y se sincronizan.

**Tecnología:** React 19, TypeScript, Web Audio (motor propio en `src/audio`), Vitest y Testing Library, Playwright.

**Diseño:** `docs/superpowers/specs/2026-11-08-canciones-tablas-design.md`. Léelo antes de empezar.

## Restricciones globales

- **Textos:** todo lo que ve u oye el niño, en español. Los errores no avergüenzan y nombran el truco (`docs/PEDAGOGY.md` §6). Se dice siempre la multiplicación entera (§9).
- **Sin presión de tiempo** (§8): ni cuenta atrás ni barra de tiempo. La música sigue en bucle mientras el niño piensa.
- **La voz** suena aunque la voz automática del niño esté apagada (`force: true`). La música de la canción suena aunque la música de fondo esté apagada. El volumen general se respeta.
- **Ritmo:**
  - Cada verso empieza en el primer tiempo del siguiente compás, después de que termine el anterior. Un verso nunca se corta ni se pisa.
  - La música no se para ni se estira. Unos 100 bpm, compás de 4 tiempos.
- **Precarga:** solo los textos de la tabla que se canta, con un máximo de 6 s. Si falta algún clip, o no hay voz natural, toda la canción va con la voz del dispositivo. Nunca se cambia de voz a mitad.
- **Huecos por nivel:** el nivel 1 tiene entre 2 y 4, el nivel 2 tiene 5 y el nivel 3 tiene 8 (todas menos × 1 y × 10).
- **Estrellas:** cada vuelta de «¡Tu turno!» con todos los huecos acertados a la primera da una estrella y sube un nivel. Máximo 3.
- **Tablas por curso:** en 2.º, la del 2, 3, 4, 5 y 10. En 3.º, en 4.º y si no hay curso, de la del 2 a la del 10.
- **Burbujas:** tres, de al menos 72 px. Los intentos se registran con `graded: false` e `inputMode: 'tap'`.
- **Rimas:** solo las de los trucos que ya existen: `square-rhyme` (7×7), `five-six-seven-eight` (7×8) y `even-six-rhyme` (6×8). Van como verso extra tras su multiplicación, en las dos tablas que la contienen.
- **Pantallas:** tablet horizontal y vertical, y móvil de 360 × 740 sin desplazarse.
- **Comprobaciones:** `npx tsc -b` y `npx vitest run`. Commits en español, terminados en `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Lo que más hay que vigilar en la revisión

1. **Salir a mitad de canción** («Salir», cambiar de pestaña o desmontar la pantalla): se paran la voz y la música de la canción, vuelve la música de fondo anterior y no queda ninguna promesa colgada que hable después. Lo cubre la tarea 4 (`abort`) y la 5 (desmontar).
2. **Niño nuevo sin dominio** (mapa vacío): los huecos salen igualmente, con prioridad a ×7, ×8, ×6 y ×9, y en ese orden. Tarea 3.
3. **Dos toques rápidos en una burbuja,** o tocar otra mientras suena la rima: cuenta una sola respuesta. Tarea 4.
4. **Falla la precarga de un solo clip:** la canción entera va con `deviceOnly` y nunca mezcla voces. Tareas 2 y 5.
5. **Móvil de 360 × 740 con 11 o 12 versos:** se ve una ventana de versos alrededor del actual, sin desplazarse. Tarea 5 y prueba de extremo a extremo de la tarea 9.

---

### Tarea 1: tema de música «song» con reloj de compás

**Archivos:**
- Modificar: `src/types/audio.ts` (`MusicTheme` gana `'song'`)
- Modificar: `src/audio/music.ts` (tema en `THEMES`, reloj en `ThemePlayer`, opción `force` en `music.play`, `music.nextBarIn`)
- Prueba: `src/audio/music.test.ts`

**Interfaces:**
- Produce:
  - `music.play(theme: MusicTheme, opts?: { force?: boolean }): void`. Con `force`, suena aunque `setEnabled(false)`.
  - `music.nextBarIn(): number | null`. Devuelve los segundos que faltan hasta el siguiente primer tiempo del tema que suena, o `null` si no suena nada.
  - `music.barSeconds(): number | null`.
  - `THEMES.song`: 100 bpm, `swing: 0`, `PENTA_MAJOR`, `chords: [C, Am, F, G]`, `barsPerChord: 1`, melodía de marimba con `density` de 0,5, bajo en `[0, 4]`, `thump` en `[0, 4]` y `shaker`.

- [ ] **Paso 1: pruebas que fallan.** En `music.test.ts`:
  - `'song: 100 bpm and a bar clock'`. Arranca `song` con el contexto falso que ya usan las pruebas. Comprueba `music.barSeconds()` ≈ `2.4` y que `0 <= music.nextBarIn()! <= 2.4`. Al avanzar el reloj 1 s, `nextBarIn` baja 1 s.
  - `'force plays even when music is disabled'`. Con `setEnabled(false)` y `play('song', { force: true })`, `isPlaying()` es `true`. Después, `play('map')` sin `force` no suena.
- [ ] **Paso 2:** `npx vitest run src/audio/music.test.ts`. Debe fallar.
- [ ] **Paso 3: implementar.**
  - `ThemePlayer` guarda `startTime` (el primer `nextTime`) y expone `barDur = stepDur * 8` y `nextBarIn(now)`.
  - El controlador guarda si lo pedido es forzado, y `maybeStart` lo respeta aunque `enabled` sea falso.
  - `setEnabled(false)` no para un tema forzado.
- [ ] **Paso 4:** vuelve a ejecutar las pruebas y `npx tsc -b`. Deben pasar.
- [ ] **Paso 5: commit** «Música: tema de la canción con reloj de compás».

### Tarea 2: voz, precarga y solo dispositivo

**Archivos:**
- Modificar: `src/types/audio.ts` (`SpeechOptions.deviceOnly?: boolean`)
- Modificar: `src/audio/speech.ts` (`deviceOnly` salta la voz natural; nuevo `speech.preload`)
- Prueba: `src/audio/speech.test.ts`

**Interfaces:**
- Produce:
  - `speech.preload(texts: string[], opts: SpeechOptions & { timeoutMs: number }): Promise<boolean>`. Devuelve `true` solo si la voz natural está disponible y **todos** los trozos (los mismos `toSpeakable` y `chunkForSpeech` que usa `say`) se han traído con `fetchClip` antes de `timeoutMs`. Nunca falla.
  - `say(text, { deviceOnly: true })` usa siempre la voz del dispositivo.

- [ ] **Paso 1: pruebas que fallan.**
  - `'preload is true when every clip arrives'`, con `fetchClip` simulado que resuelve URL.
  - `'preload is false when one clip is missing or late'`: un `null`, o uno que tarda más que `timeoutMs: 50`.
  - `'preload is false without neural voice'`.
  - `'deviceOnly never asks for a clip'`: con `deviceOnly`, `fetchClip` no se llama y habla `speechSynthesis` (el falso ya existente).
- [ ] **Paso 2:** ejecutar las pruebas. Deben fallar.
- [ ] **Paso 3: implementar.** En `pump` y `speakNext`, `job.opts.deviceOnly` va directo a `speakChunkOnDevice`. `preload` usa `Promise.all` con una carrera contra el tiempo límite.
- [ ] **Paso 4:** las pruebas y `npx tsc -b` deben pasar.
- [ ] **Paso 5: commit** «Voz: precargar una canción y forzar la voz del dispositivo».

### Tarea 3: lógica de la canción

**Archivos:**
- Crear: `src/world/cancion/logic.ts`
- Prueba: `src/world/cancion/logic.test.ts`

**Interfaces:**
- Consume:
  - `numberWords` de `src/activities/facts/shared/speak.ts`.
  - `strategyForFact` de `@/engine`.
  - `mulSkill` de `@/engine` (`src/engine/skills.ts`).
  - `MasteryMap` de `@/types`.
- Produce:
  ```ts
  export type SongLine =
    | { kind: 'fact'; table: number; n: number; answer: number; show: string; say: string; lead: string; result: string }
    | { kind: 'rhyme'; show: string; say: string }
  export function songTables(grade: number | undefined): number[]
  export function songLines(table: number): SongLine[]
  export function songGaps(table: number, mastery: MasteryMap, level: 1 | 2 | 3): number[]   // valores de n, en orden de la canción
  export function songFlagKey(table: number, star: 1 | 2 | 3): string                        // 'cancion:7:1'
  export function songStars(flags: Record<string, boolean> | undefined, table: number): 0 | 1 | 2 | 3
  export function songLevel(stars: number): 1 | 2 | 3                                         // min(3, stars + 1)
  export function bubbleChoices(table: number, n: number, rng: () => number): number[]        // 3 números distintos y desordenados
  export function songTexts(table: number): string[]                                          // todo lo que dirá la voz, para precargar
  export const SONG_INTRO: string; export const SONG_TURN: string; export const songEnd: (table: number) => string
  ```

- [ ] **Paso 1: pruebas que fallan.**
  - `songTables(2)` es `[2, 3, 4, 5, 10]`. `songTables(3)`, `songTables(4)` y `songTables(undefined)` son `[2..10]`.
  - `songLines(7)`:
    - Tiene 12 versos: 10 de multiplicación y las rimas de 7×7 y 7×8, justo después de su multiplicación.
    - El verso de 7×8 es `{ show: '7 × 8 = 56', say: 'Siete por ocho, cincuenta y seis', lead: 'Siete por ocho…', result: '¡Cincuenta y seis!' }`.
    - La rima de 7×8 dice `'5, 6, 7, 8: ¡cincuenta y seis es siete por ocho!'`.
  - `songLines(8)` incluye las rimas de 7×8 y 6×8. `songLines(2)` no tiene rimas.
  - `songGaps(7, {}, 1)` es `[6, 7, 8, 9]` (mapa vacío: prioridad 7, 8, 6, 9, devueltos en orden de la canción).
  - Con `mul:7x8` en caja 0 y las demás en caja 5, `songGaps(7, m, 1)` incluye el 8 y tiene entre 2 y 4 huecos.
  - El nivel 2 da 5 huecos. El nivel 3 da `[2..9]`. Nunca aparecen el 1 ni el 10.
  - `songStars({ 'cancion:7:1': true, 'cancion:7:2': true }, 7)` es `2`. `songLevel(3)` es `3`.
  - `bubbleChoices(7, 8, rng)` contiene el 56 y otros dos números distintos, positivos y distintos de 56, sacados de `{49, 63, 15}`. Con dos `rng` distintos, el orden cambia.
  - `songTexts(7)` contiene cada `say`, `lead` y `result`, más `SONG_INTRO`, `SONG_TURN`, `songEnd(7)` y el texto de cada rima.
- [ ] **Paso 2:** `npx vitest run src/world/cancion/logic.test.ts`. Debe fallar.
- [ ] **Paso 3: implementar.**
  - Los huecos se ordenan por dificultad: primero `box` ascendente; a igualdad, `lastError` más reciente; y si no hay dato, el orden de prioridad 7, 8, 6, 9, 4, 3, 5, 2.
  - Se toman tantos como pide el nivel. En el nivel 1, las de `box ≤ 1`, con un mínimo de 2 y un máximo de 4.
  - Textos fijos:
    - `SONG_INTRO = '¡Canta conmigo!'`
    - `SONG_TURN = '¡Ahora tú! Yo empiezo y tú terminas.'`
    - `songEnd(t) = '¡Tabla del ' + numberWords(t) + ' cantada!'`
- [ ] **Paso 4:** las pruebas deben pasar.
- [ ] **Paso 5: commit** «Canciones: versos, huecos, niveles y burbujas».

### Tarea 4: secuenciador de la canción

**Archivos:**
- Crear: `src/world/cancion/sequencer.ts`
- Prueba: `src/world/cancion/sequencer.test.ts`

**Interfaces:**
- Consume: `SongLine`, `SONG_INTRO`, `SONG_TURN` y `songEnd` de la tarea 3.
- Produce:
  ```ts
  export interface SongDeps {
    say(text: string): Promise<void>          // termina cuando acaba la frase
    waitBar(): Promise<void>                  // resuelve en el siguiente primer tiempo
    ask(line: Extract<SongLine, { kind: 'fact' }>): Promise<{ firstTry: boolean }>  // resuelve al tocar la burbuja correcta
    onLine(index: number | null): void        // verso iluminado (null: ninguno)
    onRound(round: 1 | 2): void
  }
  export interface SongRun { done: Promise<{ round2: boolean; allFirstTry: boolean } | null>; skipToTurn(): void; abort(): void }
  export function runSong(table: number, lines: SongLine[], gaps: number[], deps: SongDeps): SongRun
  ```
- **Comportamiento:**
  - Vuelta 1:
    - Dice `SONG_INTRO`.
    - Después, para cada verso: `await waitBar()`, `onLine(i)` y `await say(line.say)`.
  - Vuelta 2:
    - Dice `SONG_TURN` y se salta las rimas.
    - En un hueco: `waitBar`, `onLine`, `say(lead)`, `await ask(line)` y `say(result)`.
  - Al final dice `songEnd`.
  - `skipToTurn()` termina el verso en curso y pasa a la vuelta 2.
  - `abort()` hace que no se llame a nada más y que `done` resuelva `null`.

- [ ] **Paso 1: pruebas que fallan.** Se usan dependencias falsas que registran las llamadas en orden.
  - `'round 1 waits for a bar before every line and says each line once'`.
  - `'round 2 asks only the gaps, says the lead then the result, and skips rhymes'`.
  - `'allFirstTry is false when one ask was not first try'`.
  - `'abort stops everything: no say after abort, done is null'`. Se aborta mientras `say` está pendiente.
  - `'skipToTurn jumps to round 2 after the current line'`.
- [ ] **Paso 2:** ejecutar las pruebas. Deben fallar.
- [ ] **Paso 3: implementar** con una bandera `aborted` que se comprueba después de cada `await`.
- [ ] **Paso 4:** las pruebas deben pasar.
- [ ] **Paso 5: commit** «Canciones: secuenciador de las dos vueltas».

### Tarea 5: pantalla de la canción

**Archivos:**
- Crear: `src/world/cancion/CancionScreen.tsx` y `src/world/cancion/cancion.module.css`
- Modificar: `src/app/routes.tsx` (ruta `/play/cancion/:table`, dentro de `RequireChild`)
- Prueba: `src/world/cancion/CancionScreen.test.tsx`

**Interfaces:**
- Consume:
  - Tareas 1 a 4.
  - `useActiveChild`, `useMastery`, `useProgress` y `updateProgress` de `@/data`.
  - `GameHostProvider` y `useActivityHost().reportAttempt`.
  - `makeFactMul` de `@/engine`.
  - `ResultCard` de `src/activities/facts/shared/ActivityFrame.tsx`.
  - `CompanionArt` de `@/art`.
- **Comportamiento:**
  - **Estados:** `ready` → `preparing` → `playing` → `result`.
    - `ready`: botón grande «▶ ¡A cantar!».
    - `preparing`: «Preparando la canción…» y `speech.preload(songTexts(t), { voice: 'lumi', timeoutMs: 6000 })`.
    - `playing`: arranca `music.play('song', { force: true })` y llama a `runSong`.
      - `say(text)` es `speech.say(text, { voice: 'lumi', force: true, deviceOnly: !preloaded })`.
      - `waitBar` es un `setTimeout` de `(music.nextBarIn() ?? 0) * 1000`.
  - **Karaoke:** se ve una ventana de 5 versos centrada en el actual. El actual va resaltado y los anteriores, marcados.
  - **`ask`:** muestra las 3 burbujas de `bubbleChoices`. El primer toque bloquea hasta que se resuelve.
    - Si el toque es incorrecto, esa burbuja se apaga y se dice `strategyForFact(t, n).text`. Sin sonido de error duro.
    - Si es correcto, resuelve.
  - **Registro:** cada respuesta llama a `reportAttempt({ exercise: makeFactMul(t, n), check, ms, inputMode: 'tap', hintsUsed: 0, graded: false })`.
  - **Resultado:** si `round2 && allFirstTry` y `stars < 3`, se marca `songFlagKey(t, stars + 1)` con `updateProgress`. Después sale `ResultCard` con las estrellas totales y «Seguir», que vuelve a `/play/free`.
  - **«¡Ir a mi turno!»:** visible en la vuelta 1 y llama a `run.skipToTurn()`.
  - **Compañero:** su `CompanionArt` va al lado de los versos, con un leve rebote CSS al ritmo (con `prefers-reduced-motion`, sin rebote).
  - **Salir** (y al desmontar): `run.abort()`, `speech.stop()` y `music.play(prev)`, donde `prev` es `music.current()` guardado al entrar.
  - **Pestaña oculta** (`visibilitychange` a oculta): lo mismo que «Salir», pero vuelve a `ready`.
  - **Tabla no válida** (no está en `songTables(child.grade)`): redirige a `/play/free`.

- [ ] **Paso 1: pruebas que fallan.** Se simulan `@/audio` (say resuelve enseguida, preload, `nextBarIn` vale 0) y `@/data`.
  - `'plays round 1 then asks the gaps with three bubbles'`.
  - `'a wrong bubble dims it and says the trick; the right one goes on'`.
  - `'one answer per tap even when tapped twice quickly'`.
  - `'all gaps right first time marks the next star flag'`.
  - `'preload false: every say goes with deviceOnly'`.
  - `'Salir stops speech and restores the previous music'`.
  - `'hiding the tab aborts the song and goes back to ready'`.
  - `'an unknown table redirects to /play/free'`.
  - `'attempts are reported with graded false'`.
- [ ] **Paso 2:** ejecutar las pruebas. Deben fallar.
- [ ] **Paso 3: implementar.** El CSS va con burbujas de 84 px en tablet y 72 px en móvil, y el contenido cabe en 360 × 740 sin desplazarse.
- [ ] **Paso 4:** las pruebas y `npx tsc -b` deben pasar.
- [ ] **Paso 5: commit** «Canciones: la pantalla de la canción».

### Tarea 6: sección «Canciones» en Jugar

**Archivos:**
- Crear: `src/world/free/CancionesSection.tsx`
- Modificar: `src/world/free/FreePlayScreen.tsx` (después de «Tablas»; se ve aunque no haya tablas desbloqueadas) y `src/world/free/free.module.css`
- Prueba: `src/world/free/CancionesSection.test.tsx`

**Interfaces:**
- Consume: `songTables`, `songStars` y la ruta de la tarea 5.
- Produce: `CancionesSection({ grade, flags }: { grade?: number; flags?: Record<string, boolean> })`.

- [ ] **Paso 1: pruebas que fallan.**
  - Con `grade: 2` hay 5 tarjetas y cada una se llama «La canción del 2» y así sucesivamente.
  - Las estrellas salen de las marcas.
  - Al tocar «La canción del 7» se navega a `/play/cancion/7`.
- [ ] **Paso 2:** ejecutar las pruebas. Deben fallar.
- [ ] **Paso 3: implementar** con el estilo de las tarjetas de «Tablas» (`s.table`) y un icono ♪.
- [ ] **Paso 4:** las pruebas deben pasar.
- [ ] **Paso 5: commit** «Jugar: sección de canciones de las tablas».

### Tarea 7: «¿Cantamos la del 7?» al acabar la sesión

**Archivos:**
- Modificar: `src/world/session/logic.ts` (añadir `missedTable`)
- Crear: `src/world/session/CancionOffer.tsx`
- Modificar: `src/world/session/DailySession.tsx` (`Closing`)
- Pruebas: `src/world/session/logic.test.ts` y `src/world/session/CancionOffer.test.tsx`

**Interfaces:**
- Produce:
  - `missedTable(q: RunQueue<RunItem>, results: readonly { uid: string; correct: boolean }[], tables: number[]): number | null`.
    - Cuenta cada `fact-mul` fallada para sus dos factores, si están en `tables`. Gana la tabla más contada; si hay empate, la mayor.
    - Devuelve `null` si no hay ninguna fallada.
  - `CancionOffer({ table, onLater })`: «¿Cantamos la del 7?», con los botones «Cantar la del 7» (va a `/play/cancion/7`) y «Ahora no».

- [ ] **Paso 1: pruebas que fallan.**
  - Fallos en 7×8 y 7×6 dan `7`.
  - Un solo fallo en 6×8 da `8` (empate, la mayor).
  - Sin fallos da `null`.
  - Una tabla que no está en `tables` no cuenta.
  - El componente navega bien.
- [ ] **Paso 2:** ejecutar las pruebas. Deben fallar.
- [ ] **Paso 3: implementar.**
  - `Closing` recibe `missed: number | null`, calculado en `DailySession` con `missedTable(queue, results, songTables(child.grade))`.
  - Si se ofrece caligrafía, gana la caligrafía.
  - Si no, y `missed !== null` y la asignatura es matemáticas, se muestra `CancionOffer` en lugar de los botones, con `onLater = onDone`.
- [ ] **Paso 4:** las pruebas deben pasar.
- [ ] **Paso 5: commit** «Sesión: ofrecer la canción de la tabla más fallada».

### Tarea 8: línea en el informe del adulto

**Archivos:**
- Modificar: `src/adult/child/ChildReportScreen.tsx`
- Prueba: `src/adult/child/ChildReportScreen.test.tsx`

- [ ] **Paso 1: prueba que falla.** Con un progreso con `flags { 'cancion:7:1': true, 'cancion:7:2': true, 'cancion:8:1': true }`:
  - aparece «Canciones de las tablas» con «Tabla del 7 ★★» y «Tabla del 8 ★»;
  - sin marcas, la línea no aparece.
- [ ] **Paso 2:** ejecutar la prueba. Debe fallar.
- [ ] **Paso 3: implementar** con `songStars` sobre `songTables(child?.grade)`. Va después del mapa de calor de las tablas.
- [ ] **Paso 4:** la prueba debe pasar.
- [ ] **Paso 5: commit** «Informe: canciones de las tablas cantadas».

### Tarea 9: prueba de extremo a extremo y galería

**Archivos:**
- Crear: `tests/e2e/journeys/t-canciones.spec.ts`
- Modificar: una galería de desarrollo (`src/world/free/*.gallery.tsx` o equivalente) con la pantalla de la canción en `ready`.

- [ ] **Paso 1: escribir la prueba.** Se usa el arranque de las otras rutas: perfil de 3.º con datos sembrados como en `g-session.spec.ts`.
  - Se abre `/play/free` y se ve la sección «Canciones».
  - Se entra en «La canción del 7», se pulsa «¡A cantar!» y «¡Ir a mi turno!», y se tocan las burbujas correctas, leyendo el número del verso actual.
  - Sale «¡Tabla del 7 cantada!» con una estrella.
  - En `360 × 740`, la burbuja y el verso actual están dentro de la pantalla sin desplazarse.
  - En Chromium sin voces, `say` resuelve enseguida.
- [ ] **Paso 2:** `npx playwright test tests/e2e/journeys/t-canciones.spec.ts`. Debe pasar en todos los proyectos.
- [ ] **Paso 3: verificación final.** `npx tsc -b`, `npx vitest run` y las pruebas de extremo a extremo `g-session`, `n-hoy` y `t-canciones`. Todo en verde.
- [ ] **Paso 4: commit** «Canciones: prueba de extremo a extremo y galería».
