# Numeria · Estado del proyecto y cómo continuar

Última actualización: 22-10-2026. Rama de trabajo: `dev`. `main` solo tiene el esqueleto inicial.

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
  sobre un Postgres real. Ya se puede pegar en Supabase (ver `docs/SUPABASE_SETUP.md`, paso 3). Se puede volver
  a ejecutar sin problemas si mañana cambia algo.
- Estado del código: **1378 pruebas automáticas pasan** y el TypeScript compila sin errores.

**A medias (se pararon a petición tuya; el código está guardado y casi terminado)**

- Datos y sincronización (cliente Dexie + Supabase + modo sin conexión): falta cerrar y revisar.
- Personajes (Lumi, Borrón, guardianes, 8 compañeros con accesorios) y escenarios (fondos, trampas, cristales,
  cofre, iconos): falta cerrar y revisar.
- Sonido, voz y confeti: falta cerrar y revisar.
- Las revisiones del motor y del contenido.

**Lo que falta después**

1. Segunda tanda: los minijuegos, las lecciones animadas, las pantallas del juego (elegir niño, crear perfil
   con su animal, mapa, historia, guardián, rescate, recompensas, álbum, tienda, cofre, diploma) y los paneles de
   padres y profesores.
2. Unirlo todo, pruebas completas simulando un iPad y una tablet Android, y una revisión final.
3. Pasar `dev` a `main` y publicar en Vercel.

**Tus pasos pendientes (cuando quieras)**

- Pegar el SQL en Supabase: `docs/SUPABASE_SETUP.md`, paso 3.
- Opcional: permitir `yronrdmbgtdcxhfvfjdx.supabase.co` en la red del entorno (Edit → Network access → Allowed
  domains) para que Claude pueda probar contra tu Supabase real.
- Vercel, más adelante: importar el repositorio y añadir las 2 variables (paso 5 de la guía).

Datos públicos del proyecto Supabase (es seguro guardarlos, van dentro de la app):

```
VITE_SUPABASE_URL=https://yronrdmbgtdcxhfvfjdx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0D1gISNU_rHPTwjXS6mZGQ_SLCBer5_
```

## Para la próxima sesión de Claude (técnico)

### Arranque

```bash
cd /home/user/inessa-mat            # o donde esté el clon; trabajar en la rama dev
git checkout dev && npm install
printf 'VITE_SUPABASE_URL=https://yronrdmbgtdcxhfvfjdx.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_publishable_0D1gISNU_rHPTwjXS6mZGQ_SLCBer5_\n' > .env.local   # opcional
nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1 &    # servidor para capturas (tools/shot.mjs)
npm run typecheck && npx vitest run
bash supabase/tests/run.sh          # 159 checks RLS (crea supabase/.venv con pgserver)
```

The container's network blocks `*.supabase.co` unless the user allows it (see above). `download.pytorch.org`
is blocked; PyPI works.

### Module status (ownership in docs/ARCHITECTURE.md)

| Module | Status | Next action |
|---|---|---|
| engine | built ✅ (161 tests, ~99.7% coverage) · review interrupted | run review (mode `review`, report `docs/handoff/reports/engine.build.json`) |
| ink | built ✅ + reviewed ✅ (115 unit + 3 e2e) | — (later: real-device check of palm rejection on iPad/Android) |
| content | built ✅ · review interrupted | run review (report `docs/handoff/reports/content.build.json`) |
| ml | model exported (`public/models/digits`, modelId digits-bfa3be125a, metrics in `ml/metrics.json`) · continuation interrupted while training arch v3 (epoch 7/16 was MNIST 99.1 / fonts 98.4 / synth 99.9) | optional: mode `continue` (needs ml/.venv + data again: see ml/README.md), then review |
| data | build interrupted, substantial; SQL verified (159 checks) | mode `continue`, then review |
| art-characters | build interrupted, substantial | mode `continue`, then review |
| art-worlds | build interrupted, substantial | mode `continue`, then review |
| audio-pwa | build interrupted, substantial | mode `continue`, then review |

The orchestration script with every module prompt is `tools/workflows/numeria-foundations-split.js`.
Run it with the Workflow tool (scriptPath) and args such as
`{"items":[{"key":"data","mode":"continue"},{"key":"audio-pwa","mode":"continue"}]}` or
`{"items":[{"key":"engine","mode":"review","report":"Read docs/handoff/reports/engine.build.json first"}]}`.
Concurrency is 2 agents per workflow in this container (4 CPUs), so run several workflows side by side
(for example 4 workflows × 2 items).

### Workflow B (not started) — modules and owned paths (see docs/ARCHITECTURE.md)

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
