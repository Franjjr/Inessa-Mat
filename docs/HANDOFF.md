# Numeria · Estado del proyecto y cómo continuar

Última actualización: 22-10-2026 (2.ª sesión, en el Mac de Fran: `/Users/mac13/Desktop/Inessa-Mat`). Rama de trabajo: `dev`.

## Para Fran (resumen)

**Qué está hecho y probado**

- El esqueleto de la app: Vite + React + TypeScript, instalable en la tablet (PWA), con contratos entre módulos y
  documentación (`docs/ARCHITECTURE.md`, `docs/PEDAGOGY.md`, `docs/STORY.md`).
- **Reconocedor de escritura** (red neuronal propia, funciona sin internet). Aciertos: 99,1 % en MNIST, 98,9 % con
  letras de tipografías manuscritas que no vio al entrenar y 99,96 % con trazos sintéticos de lápiz. Se adapta a la
  letra de cada niño.
- **Entrada de respuestas**: casillas para escribir con el Pencil, el S Pen o el dedo (ignora la palma),
  teclado, teclado en pantalla, calibración de la letra y práctica de trazado. Ya está revisada.
- **Motor pedagógico**: ejercicios de todos los tipos, diagnóstico de errores, trucos de cada tabla y repaso
  espaciado.
- **Contenido**: los 8 mundos, la historia del compañero que se mete en líos, lecciones, guardianes, accesorios,
  pegatinas y frases.
- **Base de datos Supabase** (`supabase/migrations/0001_init.sql`): verificada con **159 pruebas de seguridad**
  sobre un Postgres real. **Ya aplicada en tu proyecto de Supabase (22-10-2026, “Success. No rows returned”).**
  Si más adelante cambia, se puede volver a ejecutar sin problemas.
- **Datos y sincronización** (Dexie + Supabase + modo sin conexión): terminado y revisado.
- **Personajes y escenarios** (Lumi, Borrón, guardianes, 8 compañeros con accesorios, fondos, trampas, cristales,
  cofre, iconos de la app): terminados, revisados y con revisión visual completa (unicornio, rocas e icono corregidos).
- **Sonido, voz y confeti**: terminado y revisado; la app funciona sin conexión.
- **Motor y contenido**: revisados (5 correcciones en el motor; el contenido estaba bien).
- **El juego completo** (segunda tanda, construido, revisado y con pasada visual):
  - 18 minijuegos: 11 de tablas y 7 de operaciones (grupos, rectángulos, columnas con llevadas y préstamos,
    división en galera, repartos, problemas, tablero).
  - Lecciones animadas: reproductor y 22 animaciones sacadas del cuaderno.
  - Recorrido del niño: elegir perfil, crear perfil con su animal, inicio, mapa de cada mundo, historias, guardianes,
    rescates y recompensas.
  - Álbum, tienda de accesorios, cofre (premio real + palabra VALIENTE), diploma imprimible, juego libre y repaso
    diario.
  - Zona de adultos: inicio de sesión, PIN, informe con el mapa de calor de las tablas, colegio con clases y códigos,
    ajustes y privacidad.
- **Pruebas completas** (52 recorridos, todos en verde tras la revisión final) con Playwright simulando iPad (horizontal y vertical), tablet Android y ordenador: crear niño,
  jugar el mundo 1, superar al guardián, comprar en la tienda, zona de adultos y uso sin conexión.
- **Revisión final adversarial** (matemáticas, seguridad, sincronización, tablet, español, accesibilidad): 17 fallos
  confirmados y **todos corregidos** (borrado RGPD que otro dispositivo deshacía, pantalla en blanco tras publicar,
  estrellas entre dispositivos, premio del cofre, atajo del PIN, contraste, ventanas emergentes, español…). Además:
  los fallos se vuelven a preguntar más tarde en la sesión y, si la app duda de lo que ha leído, pregunta «¿Has
  escrito un 7?» antes de corregir, para que un error de lectura no cuente como error de matemáticas.
- Estado del código: **1648 pruebas automáticas pasan** (más 192 de seguridad de la base de datos), el TypeScript compila sin errores y el build de producción
  funciona.

**Lo que falta después**

1. **Prueba en aparatos reales** (iPad con Pencil y tablet Android): escritura, rechazo de la palma, voz española,
   vibración, instalación como app. Esto no se puede simular.
2. Pasar `dev` a `main` y publicar en Vercel.

**Tus pasos pendientes (cuando quieras)**

- **Nuevo: aplicar la migración 0002 en Supabase** antes de probar en producción. Pega el contenido completo de
  `supabase/migrations/0002_erasure_tombstones_rewards.sql` en el SQL Editor y pulsa Run (debe responder “Success.
  No rows returned”; se puede repetir sin problema). Qué hace: (1) al borrar a un niño por RGPD el servidor guarda una
  “lápida” solo con su identificador, para que los demás dispositivos de la familia borren sus datos y nadie pueda
  volver a crearlo; (2) un premio ya recogido no se puede “desrecoger” desde otro dispositivo. No cambia datos
  existentes.
- Una vez publicada la app, **no cambies los precios de los accesorios**: las estrellas gastadas se calculan con ellos.

- ~~Pegar el SQL en Supabase~~ ✅ hecho. Falta el paso 4 de `docs/SUPABASE_SETUP.md` (URL de inicio de sesión),
  cuando tengamos la dirección de Vercel.
- Vercel, más adelante: importar el repositorio y añadir las 2 variables (paso 5 de la guía).
- ~~Página de privacidad~~ ✅ completada el 22-10-2026 (Fran Julian, Calle Bellido, Jaca; contact@falkir.es; Supabase
  en la UE, Irlanda). Versión mínima; si la app crece o la usan colegios de forma oficial, conviene que la revise una
  asesoría.
- **Decisiones de producto tomadas (22-10-2026)**:
  - Cofre: solo el adulto marca el premio como entregado (informe del niño → «Marcar como entregado»). El niño ve
    «¡Te lo has ganado! Pídeselo a tu familia.»
  - Juegos con tiempo: se quedan activados por defecto. Solo aparecen cuando el niño ya domina las tablas, compiten
    contra sus propias marcas y se pueden apagar por niño en Zona de adultos → informe → Ajustes.
  - Galera: los productos de cada paso siguen apareciendo escritos (ayuda); en el cuaderno los escribe el niño.
    Revisar tras las pruebas con niños.
  - Precios de accesorios: se mantienen los actuales; revisar en las pruebas y congelar antes de publicar.

Datos públicos del proyecto Supabase (es seguro guardarlos, van dentro de la app):

```
VITE_SUPABASE_URL=https://yronrdmbgtdcxhfvfjdx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0D1gISNU_rHPTwjXS6mZGQ_SLCBer5_
```

## Para la próxima sesión de Claude (técnico)

### Arranque

```bash
cd /Users/mac13/Desktop/Inessa-Mat   # trabajar en la rama dev
git checkout dev && npm install
printf 'VITE_SUPABASE_URL=https://yronrdmbgtdcxhfvfjdx.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_publishable_0D1gISNU_rHPTwjXS6mZGQ_SLCBer5_\n' > .env.local   # opcional
nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1 &    # servidor para capturas (tools/shot.mjs)
npm run typecheck && npx vitest run
bash supabase/tests/run.sh          # 159 checks RLS (crea supabase/.venv con pgserver)
```

On this Mac `*.supabase.co` is reachable. Screenshots: `node tools/shot.mjs` uses Playwright's own Chromium
(`npx playwright install chromium` once; `CHROMIUM_PATH` overrides). Output goes to `shots/` (gitignored).

### Module status (ownership in docs/ARCHITECTURE.md)

| Module | Status | Next action |
|---|---|---|
| engine | built ✅ + reviewed ✅ (189 tests) | — |
| ink | built ✅ + reviewed ✅ (115 unit + 3 e2e) | later: real-device check of palm rejection on iPad/Android |
| content | built ✅ + reviewed ✅ (76 tests) | — |
| ml | model exported (`public/models/digits`, modelId digits-bfa3be125a) · arch v3 training was interrupted | optional: mode `continue`, then review |
| data | built ✅ + reviewed ✅ (68 tests, RLS 159/159) | live Supabase not yet exercised end to end |
| art-characters | built ✅ + reviewed ✅ + full visual pass | low: octopus cheer pose prop, unused `overHat` hook |
| art-worlds | built ✅ + reviewed ✅ + full visual pass | — |
| audio-pwa | built ✅ + reviewed ✅ (159 tests) | real-device voice/haptics check |

The orchestration script with every module prompt is `tools/workflows/numeria-foundations-split.js`.
Run it with the Workflow tool (scriptPath) and args such as
`{"items":[{"key":"data","mode":"continue"},{"key":"audio-pwa","mode":"continue"}]}` or
`{"items":[{"key":"engine","mode":"review","report":"Read docs/handoff/reports/engine.build.json first"}]}`.
Concurrency is 2 agents per workflow in this container (4 CPUs), so run several workflows side by side
(for example 4 workflows × 2 items).

### Game layer (workflow B) — built, reviewed, visual QA done

Script: `tools/workflows/numeria-game.js` (same item format; with no args it builds and reviews all six modules).
Reports: `docs/handoff/reports/<module>.{build,review,qa}.json` (qa = visual QA pass + e2e).

| Module | Status | Open (details in the qa report) |
|---|---|---|
| activities-facts | ✅ 11 games × 3 devices played through | FactView overflow < 420px (ink NumberInput min width); clue repeats hint 1 |
| activities-ops | ✅ galera rewritten (school-paper look) | galera not captured portrait/Android; Column/Array/Word views not visually re-checked |
| lessons | ✅ 70 tests | w3–w8 lessons only checked in the gallery; labels not routed through host.t |
| world-core | ✅ | picker with several children, maps w1/w3–w8, story sequence not captured |
| world-meta | ✅ | guardian rounds/pass/fail, reward crystal flight, chest open, diploma print not captured |
| adult | ✅ PIN lockout persisted | school/class screens need a seeded school org; portrait not captured |

E2E: `npx playwright test` (config `playwright.config.ts`, specs `tests/e2e/**`; reuses the dev server on :5173,
journey F builds and serves `vite preview` on :4173). Journeys rely on `window.__numeriaDev` (dev server only).
Fixed by the integrator after QA: array grids overflowing (ArrayView sizes tiles by width AND height), duplicate
«Siguiente» when the host owns feedback (AnswerBar honours showFeedback=false), stacked companion bubbles (duplicate
React keys in CompanionBuddy), race nodes receive personal records, lesson try steps own their feedback (no second
«Siguiente»).

Final adversarial review: `docs/handoff/reports/final-review.json` (17 confirmed, all fixed: data/security in
`src/data` + migration 0002 with 33 new RLS checks; requeue of missed items in `src/activities/shared/requeue.ts`;
handwriting doubt gate in `src/ink` (LearningStore doubts + DoubtPrompt) used by both answer flows; Modal focus trap;
ChunkErrorBoundary + vite:preloadError reload; `--c-ink-mute` darkened to AA; gallery excluded from production).

Integrator TODO:
- Requeue not applied to `maze` (fixed path) and `wheel` (one slot per number): decide a mechanic if wanted.
- Erasures done before migration 0002 have no tombstone: insert their ids into `public.erased_children` by hand.
- Unify the back control: DailyReview uses a «Salir» pill, album/shop/chest/free use a chevron.
- ink: allow DigitCell borderless variant (galera notebook look) and NumberInput min width < 240px.
- Copy: free-play title «Piedras con llevadas».

Pending integrator decisions from the foundation reviews:
- index.html viewport: audio-pwa asked to drop `maximum-scale=1, user-scalable=no` (WCAG 1.4.4). Kept for now:
  pinch-zoom interferes with Pencil writing; decide in the iPad device pass.
- Main chunk > 500 kB: code-split during integration; consider excluding `*.gallery` chunks from production.
- Engine: `{child}`/`{pet}` in feedback strings must be rendered by activities via renderTemplate.

Modules and owned paths (see docs/ARCHITECTURE.md):

- **activities-facts**: `src/activities/{facts,race,missing,wheel,necklace,chain,family,maze,pixel,memory,bubbles}`
  + views `Fact/MissingFactor/SkipCount/DoubleChain/FactFamily`. Use `ExerciseView` and `useActivityHost`, call
  `useInkLearning().confirm()` after correct answers, and read activity params from `src/content/README.md`.
- **activities-ops**: `src/activities/{groups,array,column,division,share,word,board}` + views
  `Groups/Array/Column/Division/WordProblem`. Use DigitCell/CellGroup for columns (units first, carry cells, borrow
  scratch never graded) and the Spanish galera layout for division.
- **lessons**: `src/activities/lesson/**` — LessonPlayer + all `LessonVisualId` visuals (types/content.ts).
- **world-core**: `src/world/{picker,onboarding,home,map,node,story,host}`. Onboarding covers name, gender,
  grade, choosing and naming the companion (8 species, colorways), calibration, then the prologue. Also the world
  map with nodes, the NodeScreen dispatcher, the StoryPlayer, GameHostProvider (real ActivityHost) and
  CompanionBuddy.
- **world-meta**: `src/world/{guardian,rewards,album,shop,chest,diploma,free,review}` — contracts in
  `src/world/contracts.ts`. The chest shows the adult's real reward and the secret word VALIENTE; the diploma is
  printable.
- **adult**: `src/adult/**` — welcome, login/signup (family or school), AdultGate (PIN), family dashboard
  (child report with the 10×10 heatmap, errors, time, reward setup, settings, calibration reset, GDPR export),
  school (classes, join codes, class heatmap, assignments), join class, settings, privacy page.

Then: integrate routes and providers, add `playwright.config.ts`, run e2e on iPad/Android/desktop viewports,
do a final adversarial review (maths, RLS, offline sync, iPad UX, Spanish copy, a11y), merge `dev` → `main`,
and deploy to Vercel with the two env vars.

### Known notes from agents

- Engine: `add:4d:c4` is never generated (sums < 10000); 'long' divisions always have a zero remainder; forgetting
  to bring down is errorType 'other' (no dedicated ErrorType).
- Ink: no playwright.config.ts yet (the e2e spec uses E2E_BASE_URL, default http://localhost:5173); synthetic
  events never set `penSeen`, so palm rejection must be checked on real devices.
- Content: extra exports listed at the end of `src/content/index.ts`; activity params documented in
  `src/content/README.md`.
- Full agent reports: `docs/handoff/reports/*.json`.
