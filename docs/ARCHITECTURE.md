# Numeria — Architecture

Numeria is an offline-first PWA (Vite + React 19 + TypeScript) that teaches Spanish primary maths (times tables,
column addition/subtraction, 2×1 multiplication, division) through a story game. Children write answers with an
Apple Pencil / S Pen (on-device handwritten-digit recognition), a finger, a keyboard or an on-screen keypad.
Adults (families and schools) sign in with Supabase; children never have accounts.

## Stack (already installed — do NOT add npm dependencies)

react 19, react-dom, react-router-dom 7, zustand 5, dexie 4 + dexie-react-hooks, @supabase/supabase-js 2,
motion 14 (`import { motion, AnimatePresence } from 'motion/react'`), canvas-confetti, clsx.
Dev: vitest 5 (jsdom, globals), @testing-library/react + user-event + jest-dom, fake-indexeddb, @playwright/test 1.56.1,
vite-plugin-pwa. Python (ML training only) may use pip packages inside `ml/.venv`.

If you believe a new npm dependency is essential, do not install it — explain why in your final report.

## Directory ownership

| Path | Owner (agent) | Notes |
|---|---|---|
| `src/types/**`, `src/ui/**`, `src/app/**`, `src/dev/**`, `src/activities/{index.tsx,host.tsx,registry.ts}`, `src/world/contracts.ts`, `src/*/index.ts` stubs signatures, `tools/**`, `vite.config.ts`, `package.json` | integrator | Contracts. Do not change signatures. |
| `ml/**`, `public/models/**`, `src/ink/ml/**` | **ml** | Train CNN, export weights, TS preprocessing + inference + personalisation |
| `src/ink/**` (except `ml/`) | **ink** | Pen/touch capture, DigitCell, NumberInput, Keypad, input-mode detection, calibration |
| `src/engine/**` | **engine** | Pedagogy: skills, generators, checking + error diagnosis, hints, strategies, spaced repetition, session plan |
| `src/content/**` | **content** | Season 1 data (worlds, nodes, stories, lessons, guardians), companions, accessories, stickers, phrases, templating, progression |
| `src/art/characters/**`, `src/art/companions/**` | **art-characters** | Lumi, Borrón, 8 guardians, 8 companion species with poses + accessories, LumiHorn |
| `src/art/worlds/**` | **art-worlds** | 10 backgrounds, predicaments, crystals, stars, chest, sparkles, map decorations, app icons (`public/icons`) |
| `src/art/characters/index.ts` / `src/art/worlds/index.ts` | respective art agent | `src/art/index.ts` is integrator-owned and re-exports both |
| `src/data/**`, `supabase/**` | **data** | Dexie schema, repositories, sync engine, Supabase client/auth, SQL migrations + RLS, dev seed helper |
| `src/audio/**`, `src/fx/**`, PWA assets in `public/` (except icons/models) | **audio-pwa** | SFX synth, generative music, speech, haptics, celebrations (`@/fx`) |
| `src/activities/<facts…bubbles>/**`, `src/activities/views/{Fact,MissingFactor,SkipCount,DoubleChain,FactFamily}View.tsx` | **activities-facts** | |
| `src/activities/<groups…board>/**`, `src/activities/views/{Groups,Array,Column,Division,WordProblem}View.tsx` | **activities-ops** | |
| `src/activities/lesson/**` | **lessons** | LessonPlayer + all lesson visuals |
| `src/world/{picker,onboarding,home,map,node,story,host}/**` | **world-core** | |
| `src/world/{guardian,rewards,album,shop,chest,diploma,free,review}/**` | **world-meta** | |
| `src/adult/**` | **adult** | Welcome/auth screens, adult gate, family & school dashboards, settings, privacy |

Never edit files you don't own. Placeholders (`// PLACEHOLDER`) inside your folders are yours to replace.
Shared stubs (`src/ink/stubs.tsx`, `src/art/stubs.tsx`) are replaced by the owning agent re-pointing the export
lines in the module `index.ts`.

## Module contracts

All shared types are in `src/types/*.ts` — read them first. Public entry points (import ONLY these across modules):

- `@/types` — domain types.
- `@/ui` — Button, Card, Screen, TopBar, Modal, Pill, Spinner, toast/ToastHost, Placeholder.
- `@/engine` — see `src/engine/index.ts` (generate, check, hintsFor, strategyForFact, updateMastery, dueSkills,
  starsFor, factGrid, describeSkill, describeError, planSession, createRng…).
- `@/content` — see `src/content/index.ts` (season1, getWorld/Node/Story/Lesson/Guardian, companions, accessories,
  stickers, renderTemplate, templateContext, pickPhrase, initialProgress, isNodeUnlocked, nextNode, applyNodeResult…).
- `@/ink` — InkProvider, useInputMode, DigitCell, NumberInput, Keypad, CalibrationFlow, useRecognizer, TraceDigit.
- `@/art` — Character, CompanionArt, LumiHorn, Predicament, WorldBackground, Crystal, StarIcon, ChestArt, Sparkles, NodeIcon.
- `@/fx` — celebrate(kind) confetti/star bursts.
- `@/audio` — sfx, music, speech, haptics, unlockAudio, applyAudioSettings.
- `@/data` — auth/orgs/children/progress/mastery/attempts/sessions/rewards/ink samples/classes/dashboards/sync.
- `@/activities` — ActivityRunner, ExerciseView, LessonPlayer, useActivityHost, ActivityHostProvider.
- `@/world/contracts` — props of cross-agent world components.

Activities never touch `@/data`: they report through `useActivityHost()`; `world-core`'s `GameHostProvider`
persists attempts and updates mastery.

## Conventions

- **Language**: all child/adult-facing copy in Spanish (Spain), simple for 7–8-year-olds in child screens.
  Child copy goes through templates (`{child}`, `{pet}`, `{cg:…|…}` — see `src/types/content.ts`). Code and
  comments in English.
- **Styling**: CSS Modules (`Foo.module.css`) + variables from `src/styles/tokens.css`. No hard-coded fonts; colours
  only via tokens (art files may use literal colours). Fredoka (`--font-display`) for titles/numbers/buttons, Andika
  (`--font-read`) for reading text.
- **Tablets first**: must look great at 1180×820 (iPad landscape), 820×1180 (portrait), 1280×800 (Android tablet)
  and 1440×900 (desktop). Tap targets ≥ `--tap-min` (56px). Never rely on hover. Use `100dvh`, safe areas.
  Ink surfaces use `touch-action: none`. Avoid `window.alert/confirm` (use `Modal`).
- **Motion & sound**: `motion/react` for UI animation, CSS keyframes for idle art loops, always honour
  `prefers-reduced-motion`. Feedback is gentle: errors are clues, never harsh red screens or buzzers.
- **Accessibility**: buttons have labels, everything keyboard-operable on desktop, colour never the only signal.
- **Privacy**: children's data is minimal (nickname, gender for grammar, grade, companion). The browser sends
  requests only to our own origin, to Supabase, and to Google sign-in when it is configured. The voices are fetched
  from our own functions (`/api/tts`, `/api/pronunciation`), which call Azure from the server with the key kept there;
  the child's audio is not stored. No analytics SDKs, and nothing is sent about wrong answers: the local review log
  (`src/data/review.ts`) stays on the device.
- **Testing**: colocate `*.test.ts(x)`. Run only yours: `npx vitest run src/<your-folder>`. Type-check:
  `npm run typecheck 2>&1 | grep '<your-folder>'` (others may be mid-work; fix only your errors).
- **Visual checks**: a dev server runs at http://localhost:5173 (do not start another on that port; if it is down,
  start your own with `npx vite --port 51NN`). Add `*.gallery.tsx` files (default export `GalleryEntry[]`, see
  `src/dev/Gallery.tsx`) and capture: `node tools/shot.mjs '/dev/gallery?only=src/art' shots/art-1.png --device ipad`
  then open the PNG with the Read tool and actually look at it. `--seed` creates a demo child (data module's
  `window.__numeriaDev.seed()`), so child screens can be captured: `node tools/shot.mjs /play shots/home.png --seed`.

## Data flow

```
child plays → ExerciseView/Activity → host.reportAttempt(attempt)
  → GameHostProvider: engine.updateMastery → data.saveMastery + data.recordAttempt (Dexie, outbox)
  → sync engine pushes outbox to Supabase when online & signed in (RLS-protected)
node finished → content.applyNodeResult(progress) → data.updateProgress → RewardOverlay
```

## Publicación y comprobaciones

- **Vercel** publica con `npm run build` = `tsc -b && vite build`. Las pruebas unitarias (`vitest`) no están en ese
  paso: un arreglo urgente para una familia no debe quedar bloqueado por una prueba lenta, y el build es el mismo en
  local y en Vercel. Por eso las pruebas van en otro sitio.
- **GitHub Actions** (`.github/workflows/ci.yml`) ejecuta en cada push y pull request `npm ci`, `npx tsc -b` y
  `npx vitest run`. Las pruebas e2e de Playwright no están ahí: necesitan un servidor levantado aparte.
  Para que una PR no se fusione con el check en rojo, el dueño del repositorio debe marcar «ci» como check obligatorio
  en la protección de la rama `main` (Settings → Branches). Hasta entonces, el check informa pero no bloquea.
- **Almacenamiento del dispositivo**: al arrancar se pide `navigator.storage.persist()` (`src/data/storage.ts`) para que
  el navegador no borre el progreso de un niño sin cuenta. La respuesta queda en `meta` para la zona de adultos.
- **Sincronización de cajas**: si una caja tiene un cambio local pendiente y la nube tiene una copia más nueva, se
  fusionan (`mergeMastery`) y la entrada pendiente se conserva hasta que la nube tenga la fila fusionada.

## Backend (Supabase)

Multi-tenant: `organizations` (family | school) ← `memberships` (adult users with roles) ← `children`
(owned by one org) ← `class_enrollments` link children to school `classes` (parent consent via class code).
All tables have RLS; teachers can read only enrolled children's learning data. See `supabase/migrations`.
