export const meta = {
  name: 'numeria-foundations-split',
  description: 'Build/continue/review a subset of Numeria foundation modules (args.items)',
  phases: [
    { title: 'Build', detail: 'ml, ink, engine, content, art-characters, art-worlds, data, audio-pwa' },
    { title: 'Review', detail: 'independent senior reviewer per module: verify, test, fix' },
  ],
}

const COMMON = `
You are one of several expert agents building "Numeria", a Spanish maths adventure PWA for children. First user: Inessa
(7, turning 8, Spain) who struggles with the 6/7/8 times tables, column addition/subtraction with 3-4 digits,
2-digit x 1-digit multiplication and division. It will also be SOLD to families and schools, so quality must be
production-grade. Main devices: iPad + Apple Pencil (first), then Android tablet + stylus, plus computers with keyboard.

Repo: /Users/mac13/Desktop/Inessa-Mat (Vite 8 + React 19 + TypeScript strict, path alias @/ -> src/). FIRST read:
docs/ARCHITECTURE.md, docs/PEDAGOGY.md, docs/STORY.md, every file in src/types/, src/ui/index.tsx, and the public
entry file of your module and of the modules you depend on. The printed workbook this app grows from is
docs/reference/ (build.py contains all its Spanish texts, lessons and exercises; the PDF is there too).

Hard rules:
- Edit ONLY files you own (listed below). Never change shared contracts (src/types/**, other modules' index files,
  src/ui, src/app, registry/host files). If a contract truly blocks you, work around it and describe the needed
  change under contractRequests in your final report.
- Do NOT install npm packages. Do NOT run git commands that change state (no commit, checkout, stash, reset, clean).
- Other agents are editing other folders at the same time: their code may be mid-work. Only fix errors in your files.
- A Vite dev server is already running on http://localhost:5173 (do not start another on that port).
- User-facing copy in Spanish (Spain), simple and warm for 7-8 year olds; code and comments in English.
- Use CSS Modules + tokens from src/styles/tokens.css; tap targets >= 56px; honour prefers-reduced-motion.
- Before finishing: 'npm run typecheck 2>&1 | grep <your paths>' must show ZERO errors for your files; run your tests
  with 'npx vitest run <your folder>' and make them pass. For anything visual, add a *.gallery.tsx and capture it with
  'node tools/shot.mjs "/dev/gallery?only=<your folder>" shots/<name>.png --device ipad' (also --device android when
  layout matters), then OPEN the PNG with the Read tool and critically look at it; iterate until it is genuinely
  polished and delightful, not just "working".
- Your final message is a structured report (it is data for the integrator, not a chat message).
`

const MODULES = [
  {
    key: 'ml',
    prompt: `${COMMON}
YOUR MODULE: ml — on-device handwritten DIGIT recogniser. You own: ml/**, public/models/**, src/ink/ml/**.
Contract: src/ink/ml/recognizer.ts (createRecognizer(): DigitRecognizer & { setPersonalSamples }) and the types
InkStroke, DigitRecognition, DigitRecognizer in src/types/ink.ts. The ink agent builds all UI on top of your API in
parallel with you — deliver a FIRST WORKING MODEL EARLY (e.g. after a quick 1-2 epoch training) at
public/models/digits/model.json, then keep improving and overwrite it. Never change the JSON format after the first
export without keeping the TS loader compatible.

Environment: Python 3 + pip work through a proxy. PyPI is reachable; download.pytorch.org is BLOCKED (so use PyPI
wheels: e.g. 'pip install torch' from PyPI (big, pulls CUDA libs but works on CPU), or jax[cpu]+optax, or
tensorflow-cpu, or pure numpy — your call; 4 CPUs, 15 GB RAM, ~25 GB disk). Use a venv at ml/.venv.
MNIST mirrors: https://ossci-datasets.s3.amazonaws.com/mnist/ and https://storage.googleapis.com/cvdf-datasets/mnist/ .
Google Fonts are reachable (CSS via https://fonts.googleapis.com/css2?family=Name with an old browser User-Agent
returns TTF/woff URLs on fonts.gstatic.com) — use many handwriting fonts (Caveat, Patrick Hand, Gochi Hand, Indie
Flower, Kalam, Schoolbell, Shadows Into Light, Gloria Hallelujah, Covered By Your Grace, Just Another Hand, Reenie
Beanie, Nanum Pen Script, Coming Soon, Architects Daughter, Short Stack, Sue Ellen Francisco, Annie Use Your
Telescope, Delius, Mali, Itim, Sriracha, Handlee, Neucha, Pangolin...) for synthetic digits; HOLD OUT several fonts for
testing only.

Key insight: the app renders the child's strokes with UNIFORM pen width, unlike scanned MNIST. Make training data look
like app rendering: re-stroke MNIST (skeletonize, then re-render the skeleton with random pen widths), render font
digits, skeletonize and re-stroke them too, and ADD parametric synthetic STROKE digits (each digit defined as 1-3
strokes of polylines/arcs with child-like variations: 1 with/without flag and base, 7 with/without crossbar, open and
closed 4, 9 with straight or curved tail, 2 with/without loop, round vs. angular 3, 5 with separate top bar, 6/9
loop sizes, wobble, tilt, size and aspect variation, overshoot, small gaps between strokes) that are rasterised with
EXACTLY the same preprocessing function the app uses. Augment: rotation +-15 deg, shear, scale, aspect, elastic,
stroke width, jitter.

Preprocessing (implement IDENTICALLY in ml/preprocess.py and src/ink/ml/preprocess.ts, with parity tests on shared
fixtures): input strokes in zone px coords → bbox of all points; empty/too-tiny ink → no digit; rasterise polylines
with round caps/joins using an anti-aliased distance-based rasteriser on a Float32Array (NO DOM canvas, so it runs in
tests/workers), with line width proportional to the digit size; then MNIST style: fit into 20x20 preserving aspect
ratio (a thin "1" must stay thin — never stretch), place into 28x28 centred by centre of mass, values 0..1.

Model: a small CNN (e.g. conv-relu-pool x2/x3 → dense 64 "embedding" → dense 10), batch-norm folded. Export a generic
sequential format: public/models/digits/model.json (version, input shape, ordered layers with type, shapes, and
byte offsets) + model.bin (float32 LE, or int8 with per-layer scales if you prove parity). Mark the embedding layer.
Total <= 1 MB. TS inference in src/ink/ml/cnn.ts: pure TS with Float32Array, < 5 ms per digit on a tablet, no deps.
src/ink/ml/recognizer.ts implements the contract: load() fetches the model once (cache), recognize() runs
preprocess → CNN → softmax, returns digit/confidence/probs/alternatives(top 3)/embedding/image28; returns digit null
for empty or scribble-like input (low max prob, e.g. < 0.35, or ink too small); setPersonalSamples() enables a cosine
kNN over embeddings of the child's own samples, blended per class with weight growing with sample count (cap ~0.6),
so the model adapts to the child's handwriting. Make blending robust to a single wrong sample.

Report metrics: MNIST test accuracy (target >= 99%), held-out handwriting fonts (target >= 95%), synthetic stroke
test set (target >= 97%), per-class confusions (1/7, 4/9, 3/8, 5/6, 2/7), inference time in node. Write ml/README.md
(how to retrain, data, metrics). Tests (vitest) in src/ink/ml: preprocessing invariants (aspect, COM, empty input),
JS-vs-Python parity (export reference outputs to src/ink/ml/__fixtures__), recogniser on fixture strokes for every
digit, personalisation actually fixes a deliberately "odd" handwriting style. Do not commit large datasets (ml/data,
ml/cache are gitignored); keep only scripts, model files and small fixtures.`,
  },
  {
    key: 'ink',
    prompt: `${COMMON}
YOUR MODULE: ink — answer input (handwriting with pen/finger, keyboard, on-screen keypad). You own src/ink/** EXCEPT
src/ink/ml/** (the ml agent is building the recogniser there right now; use only its public API in
src/ink/ml/recognizer.ts: createRecognizer(), load(), recognize(strokes, zoneSize), setPersonalSamples(); the model
file public/models/digits/model.json may appear while you work — poll for it; until then build against the stub).
Contract: src/ink/index.ts exports + src/types/ink.ts. Implement them in real files, re-point src/ink/index.ts and
delete src/ink/stubs.tsx. You MAY add these extra exports to src/ink/index.ts: useInkLearning() returning
{ confirm(): void; discard(): void } — activities call confirm() after a CORRECT answer so the recognised digits of
the cells used since the last confirm/discard are stored as personal samples (source 'confirmed', via @/data
addInkSample + recognizer.setPersonalSamples); and CellGroup (optional helper for focus order).

Requirements:
- Pointer Events with touch-action:none, setPointerCapture so a stroke started in a cell keeps belonging to it even if
  it leaves; getCoalescedEvents where available; smooth rendering (quadratic midpoints) on a DPR-scaled canvas in deep
  plum ink; strokes may visually overflow a little beyond the cell. Pressure may modulate visual width only.
- Palm rejection: once a 'pen' pointer has been seen on the device (persist penSeen in localStorage), ignore 'touch'
  pointers for writing on ink surfaces (taps on buttons still work). Without a pen, fingers write.
- iPad Safari: no scroll/zoom/selection/callout while writing; don't use <input> on touch devices (iPadOS Scribble
  would hijack handwriting) — use canvas + a focusable element (tabIndex, role, keydown) for keyboards.
- Recognition: after pen-up wait ~500-700 ms of inactivity (multi-stroke 4, 5, 7) then recognise; show the result
  typeset (Fredoka) over the faded ink with a pleasant transition; low confidence shows a subtle "?" and offers top
  alternatives as chips on tap; picking an alternative counts as a recognitionFix and stores a 'corrected' sample.
  Clear: pen eraser (pointerType/buttons), a small clear button, or scribble-out; a quick tap on a recognised cell
  lets the child rewrite.
- DigitCell variants result/carry/given, place-value colour bands (tokens --pv-*), statuses, sizes, bigCells.
- Keyboard: digits fill cells, Backspace clears, arrows/Tab move, Enter submits (via CellGroup/NumberInput). Column ops
  fill right-to-left (units first) — CellGroup should support a custom focus order and auto-advance.
- NumberInput: wide pad for whole numbers; segments strokes into digits by clustering bounding boxes along x (robust
  to multi-stroke digits like 4/5/7 and to overlap), recognises each, shows the number, big check (✓) button and Enter.
- Keypad: big friendly 0-9, ⌫, ✓; appears for keypad mode or as a fallback toggle on any input.
- useInputMode: from the active child's settings.inputPreference (useActiveChild from @/data): auto → pen if penSeen,
  else touch on touch devices, else keyboard; plus setPreferred.
- InkProvider(childId): loads the recogniser once, loads personal samples (@/data listInkSamples) and pushes them to
  setPersonalSamples, exposes context for cells.
- CalibrationFlow({childId, companionName, onDone}): warm screen "Enséñale a {companionName} cómo escribes los
  números": each digit 0-9 twice (show a model digit), store samples (source 'calibration'), progress, skip, celebrate.
- TraceDigit({digit, onDone}): handwriting practice — dotted model digit with start dot and arrows in Spanish school
  stroke order, child traces, gentle scoring, stars.
- Tests: segmentation, gesture/eraser detection, keyboard navigation, palm rejection logic (unit-test the pure parts;
  canvas is not available in jsdom — mock it). Playwright test tests/e2e/ink.spec.ts that dispatches PointerEvents
  with pointerType 'pen' to draw digits into a DigitCell on the gallery page and checks the recognised value (skip it
  with a clear message if the model is not there yet). Gallery src/ink/ink.gallery.tsx; screenshots on ipad and
  android, including mid-writing and recognised states.`,
  },
  {
    key: 'engine',
    prompt: `${COMMON}
YOUR MODULE: engine — the pedagogy brain. You own src/engine/**. Implement EVERY function in src/engine/index.ts
with exactly those signatures (implement in sibling files — skills.ts, generate.ts, check.ts, diagnose.ts, hints.ts,
strategies.ts, mastery.ts, session.ts, describe.ts, wordProblems.ts… — and re-export from index.ts). Pure TS: no React,
no I/O. You may import from @/content (only for planSession → nextNode); content is being written in parallel.

Requirements:
- Skill keys exactly as documented in src/types/exercise.ts. Deterministic exercise ids (e.g. 'fact-mul:7x6',
  'column-add:368+257') so avoidIds works.
- generate(selector, count, opts) for EVERY ExerciseKind honouring every SkillSelector field (tables, factorRange,
  digits, regroup none/one/many/any = exact counts 0/1/>=2/any, zeros = borrow across zero, divisionVariants,
  explicit skills, adaptive weighting with mastery: due and weak first, ~70% known / ~30% new, max 3 brand-new facts
  per call). Sensible ranges: 4-digit sums < 10000, positive subtraction results, no trivial or duplicate items,
  varied orientation (7x6 and 6x7), operands that are realistic in Spanish 2º/3º primaria. Word problems: a bank of
  Spanish templates featuring Numeria characters and {child}/{pet} placeholders, per operation, with units.
- check(exercise, answer): robust for all Answer shapes; fact-family accepts any order and x/×, :/÷/ symbols; diagnose
  column-op errors precisely (carry-forgot, carry-wrong, borrow-forgot, smaller-from-larger, zero-borrow, misaligned,
  incomplete) with wrongColumns; division (remainder-too-big, quotient-off); word problems (operation: detect when the
  answer equals another operation on the same numbers). For subtraction accept ANY correct result regardless of the
  borrowing method (borrow cells are scratch, never graded). Feedback template strings in warm Spanish that name the
  strategy (see docs/PEDAGOGY.md).
- hintsFor: 3 progressive hints per kind (strategy → visual → worked step) with HintVisual + params.
- strategyForFact for all 100 facts per docs/PEDAGOGY.md (Spanish text).
- Mastery (Leitner, intervals, fluency thresholds, hints and recognition rules) exactly per docs/PEDAGOGY.md;
  dueSkills; starsFor; factGrid (symmetric, -1 unseen); describeSkill / describeError in Spanish for adults;
  planSession (warm-up of due facts, next adventure node, mixed review of weak/due skills, a closing game) and
  selectorForSkills.
- Tests: property-style tests over thousands of seeded generations verifying every answer/carries/borrows with
  independent arithmetic and that selectors are respected; diagnosis tests for each error type with hand-made wrong
  answers (e.g. 52-17 answered 45 → smaller-from-larger; 368+257 answered 515 → carry-forgot); mastery transitions;
  determinism with seeds. Aim for > 95% line coverage of engine logic.`,
  },
  {
    key: 'content',
    prompt: `${COMMON}
YOUR MODULE: content — Season 1 of the adventure. You own src/content/**. Implement EVERYTHING in
src/content/index.ts with exactly those signatures (data in sibling files: worlds/w1.ts…w8.ts, stories/*.ts,
lessons/*.ts, guardians.ts, companions.ts, accessories.ts, stickers.ts, phrases.ts, template.ts, progression.ts).
Data + pure functions only. Follow docs/STORY.md (cast, worlds, predicaments, letters) and docs/PEDAGOGY.md
(curriculum per world) and reuse/adapt the workbook texts in docs/reference/build.py.

Requirements:
- 8 worlds, each 7-10 nodes: an arrival story where {pet} gets into its predicament, lesson(s) (LessonDef steps using
  the LessonVisualId visuals with correct params, Lumi narration, some 'try' steps with selectors), 3-5 activities of
  VARIED ActivityKinds that fit the world (facts, race, missing, wheel, necklace, chain, family, maze, pixel, memory,
  bubbles, groups, array, column, division, share, word, board) each with title/instructions/selector/count/params,
  an optional mid-story, the guardian node, and progression to the rescue. Node map positions (pos 0..1) along a
  pleasant winding path that does not overlap. Activity params must be minimal and self-explanatory (activity agents
  will read your configs); document per-kind params you rely on in src/content/README.md.
- Stories: prologue (home → glowing book → Lumi → Numeria and the fog → {pet} jumps in first and gets into trouble),
  per-world arrival, rescue scenes (companion freed, thanks {child} by name), finale (8 crystals, Borrón's confession,
  teach-back, VALIENTE, the Gran Cofre, diploma, season 2 teaser). Short lines (<= 20 words) for an early reader, funny
  and warm, correct Spanish (Spain) with ¡ ¿ and — dialogue conventions, gender-correct via {cg:…|…|…} and {pg:…|…|…},
  pet species via {pet_species}/{el_pet_species}. Speakers + poses + cast with predicaments per scene.
- Guardians (GuardianDef per world): 6-8 items via rounds/selectors, passMin, spell with the workbook numbers
  (w1 7x5=35 → V; w2 2486+1357=3843 → A; w3 7x6=42 → L; w4 4521-1367=3154 → I; w5 8x7=56 → E; w6 7x7=49 → N;
  w7 47x6=282 → T; w8 63:3=21 → E), letter, rescueStory, retryText.
- Companions: CompanionDef for the 8 species in src/types/child.ts with noun/article forms [fem, masc, neutral]
  (careful: avoid offensive forms, e.g. use "zorrito" for both genders of fox), personality, 8 suggested Spanish-
  friendly names each, colorways EXACTLY ['default','sunny','berry','mint'] (the art agent implements these ids).
- Accessories: EXACTLY these 18 ids (the art agent draws them): crown, wizard-hat, flower-crown, cap, bow, beanie,
  star-glasses, sunglasses, scarf, bowtie, medal, cape, fairy-wings, backpack, wand, balloon, lollipop, paintbrush —
  with Spanish names, slots (head|face|neck|back|held), prices in stars, some requiring worlds.
- Stickers: ~24 (3 per world) with emoji, Spanish name and earnedBy rules applied in applyNodeResult.
- Phrases: pickPhrase(kind, rng, errorType) — >= 10 varied phrases per ReactionKind, some specific per errorType,
  praising effort/strategy (see PEDAGOGY), using {child}/{pet}.
- Templates: renderTemplate implementing the full syntax in src/types/content.ts ({child} {pet} {pet_species}
  {el_pet_species} {cg:F|M|N} {pg:F|M|N}); templateContext.
- Progression: initialProgress, isNodeUnlocked (sequential inside a world, next world after the previous crystal),
  nextNode, applyNodeResult (best stars kept; star currency only for NEW stars so replays can't farm; crystal + letter
  on guardian pass; stickers; unlock next world; lastNode; daysPlayed today), startingWorldForGrade.
- Tests: every ref resolves; ids unique; letters spell VALIENTE; every template renders with no leftover braces for
  all 3 child genders x 3 pet genders x 8 species; progression rules; selectors well-formed. Add one test that
  generates exercises from every selector with the engine (@/engine generate) and mark it clearly — the engine is being
  written in parallel, so if it is still a stub when you finish, make that single test skip with a TODO note.`,
  },
  {
    key: 'art-characters',
    prompt: `${COMMON}
YOUR MODULE: art-characters — all characters as React SVG components. You own src/art/characters/** and
src/art/companions/**; your public entry is src/art/characters/index.ts (export Character, CompanionArt, LumiHorn —
re-point the exports to your real components and delete src/art/characters/stubs.tsx). Props contracts:
CharacterProps / CompanionArtProps in src/types/art.ts, LumiHorn({ crystals: boolean[] (8), size }).

Draw (style guide in docs/STORY.md "Art direction"; reference Lumi = docs/reference/art.py unicorn(); viewBox
0 0 200 200, size prop = rendered height):
- Character ids: lumi (white unicorn, 7-colour pastel mane, golden spiral horn with 8 small crystal sockets), borron
  (small grey fluffy cloud-goblin, stubby arms, big eyes, mischievous), owl (Búho Sabio, round glasses), frog (Rana
  Saltarina, lily pad), ladybug (Reina Mariquita: red with dots, tiny crown, soft glow), polarbear (osa Nieve: scarf +
  mug of chocolate), octopus (pulpo Octavio: purple, juggling a teapot/brush/shell), fairy (Hada Iris: rainbow wings,
  fuchsia dress, wand), dragon (dragona Chispa: orange, friendly, forge apron, smoke puffs), queen (Reina Aurora:
  golden dress, crown, kind face).
- EVERY character supports every Pose (idle, talk, happy, cheer, sad, worried, scared, think, surprised, sleep) via
  eyes/brows/mouth/arms/ears changes + small posture changes, with CSS-keyframe idle loops (blink, breathe), talk
  mouth animation, bounce on happy/cheer, shiver on scared — all disabled under prefers-reduced-motion and when
  animated=false. Smooth pose transitions where cheap.
- Companions: 8 species (cat, dog, fox, bunny, panda, penguin, baby dragon, baby unicorn — make the baby unicorn
  clearly different from Lumi: smaller horn, lilac default) in chibi style, ALL poses, colorways EXACTLY
  'default' | 'sunny' | 'berry' | 'mint' (4 tasteful palettes per species), and the 18 accessory ids EXACTLY: crown,
  wizard-hat, flower-crown, cap, bow, beanie, star-glasses, sunglasses, scarf, bowtie, medal, cape, fairy-wings,
  backpack, wand, balloon, lollipop, paintbrush — drawn as separate layers positioned with per-species anchor points
  (head-top, eyes, neck, back, hand) so they fit every species; back items render behind the body.
- LumiHorn: Lumi's horn as a HUD element with 8 sockets that light up in the world colours (tokens --w1..--w8) when
  collected, with a shimmer when all 8 are lit.
- Quality bar: genuinely cute, consistent line weight, readable at 48 px and gorgeous at 360 px. Build a thorough
  gallery (every character x pose, every species x colorway, accessory grid, sizes 48/120/240) and iterate on
  screenshots until a 7-year-old would want to pick each companion. Keep SVGs lean (no heavy filters).
- Tests: render tests for every id x pose, species x colorway x pose, accessories, unknown ids ignored, flip/animated.`,
  },
  {
    key: 'art-worlds',
    prompt: `${COMMON}
YOUR MODULE: art-worlds — scenery and game UI art as React SVG components. You own src/art/worlds/** and
public/icons/** and public/favicon.svg; your public entry is src/art/worlds/index.ts (export Predicament,
WorldBackground, Crystal, StarIcon, ChestArt, Sparkles, NodeIcon — re-point to real components and delete
src/art/worlds/stubs.tsx). Props contracts: src/types/art.ts and the stub signatures (Crystal {color,state,size},
StarIcon {filled,size}, ChestArt {open,size}, Sparkles {active,color,count}, NodeIcon {kind,size,done,locked,color}).
Style guide: docs/STORY.md "Art direction".

Draw:
- WorldBackground for all 10 BackgroundIds (home, sky, forest, river, cave, mountain, lake, rainbow-garden, volcano,
  castle): full-bleed responsive layered SVG scenes (preserveAspectRatio xMidYMid slice) that look great in iPad
  landscape AND portrait and Android 16:10, leaving calm areas where UI sits; gentle ambient CSS animations (falling
  leaves, water ripples, glowing ladybugs/fireflies, snow, bubbles, rainbow shimmer, forge sparks, waving flags);
  'vividness' 0..1: 0 = drained by Borrón's fog (desaturated + soft grey fog layer with swirls), 1 = full colour,
  with a smooth transition when it changes. children render above the scene.
- Predicament overlays for every PredicamentKind (bubble, net, ice, fog, vines, cage, ink, stuck, none) wrapping the
  companion, with 'rescue' 0..1 progressively freeing it (ice melts and cracks, vines retract, net loosens, cage door
  opens, ink drips away, fog clears, bubble shrinks/floats down, rocks shift), plus a satisfying final release
  animation at rescue = 1.
- Crystal (locked/empty/glow/collected, world colour, facets, glow pulse), StarIcon (filled/empty with a pop when it
  becomes filled), ChestArt (Gran Cofre: closed with lock / opening with light rays), Sparkles (lightweight particles),
  NodeIcon per NodeKind (story book, lesson wand/bulb, activity puzzle piece, guardian shield, review star) with
  done/locked states for the world map.
- App icons: design an icon (Lumi-style unicorn head on a purple/magenta background) as SVG, then render PNGs with
  Playwright/Chromium (/opt/pw-browsers/chromium-1194/chrome-linux/chrome): public/icons/icon-192.png, icon-512.png,
  icon-512-maskable.png (safe zone padding), apple-touch-icon.png (180), and public/favicon.svg.
- Quality bar: storybook-beautiful, cohesive palette with the world tokens --w1..--w8, performant on iPad (no huge
  blur filters, keep node counts sane, animate transforms/opacity). Gallery with every background at vividness 0 / 0.5
  / 1 in landscape and portrait frames, every predicament at rescue 0 / 0.5 / 1 (use a simple placeholder blob or the
  Character/CompanionArt from @/art inside), crystals, stars, chest, icons. Iterate on screenshots.
- Tests: render tests for every id/kind/state.`,
  },
  {
    key: 'data',
    prompt: `${COMMON}
YOUR MODULE: data — offline-first persistence, Supabase backend, auth, sync. You own src/data/** and supabase/**.
Implement EVERY export of src/data/index.ts with exactly those signatures (implement in sibling files and re-export),
replacing the stubs. Consumers (world, adult, ink agents) code against these signatures right now.

Backend (Supabase, multi-tenant for families AND schools; children never have accounts; data of minors under GDPR):
- supabase/migrations/0001_init.sql: ONE file the user will paste into the Supabase SQL editor (must run cleanly on a
  fresh project; make it idempotent where practical). Tables: profiles (1:1 auth.users, auto-created by trigger),
  organizations (kind family|school), memberships (org_id, user_id, role owner|admin|teacher|guardian), org_invites
  (email, role, token, expires), children (client-generated uuid, org_id, nickname, gender, birth_year, grade, companion
  jsonb, settings jsonb, timestamps, soft delete), classes (school org, teacher_id, unique 6-char join_code),
  class_enrollments (class_id, child_id, added_by), progress (child_id pk, state jsonb, updated_at), skill_mastery
  (child_id, skill, data jsonb, updated_at), attempts (append-only), sessions, rewards, assignments. Indexes, updated_at
  triggers, CHECK constraints. RLS on every table with SECURITY DEFINER helpers (is_org_member, has_org_role,
  can_read_child, can_write_child): family/school members manage their org's children; teachers READ learning data
  (progress, mastery, attempts, sessions) of children enrolled in their classes but cannot modify them; nobody sees
  other orgs. RPCs: create_organization(kind, name) (creates org + owner membership atomically), join_class(code,
  child_id) (caller must be able to write the child), accept_invite(token), class_overview data helpers if useful.
- VERIFY the SQL for real: run a local Postgres via pip (try 'pip install pgserver' or 'postgresql-wheel' in a venv
  under supabase/.venv), create a minimal stub of Supabase's auth schema (auth.users, auth.uid() reading
  current_setting('request.jwt.claim.sub'), roles anon/authenticated), apply the migration, and write an automated RLS
  test suite (supabase/tests/) that proves isolation between two families, a school with two teachers, enrollment
  rules and that teachers can't write children's data. Document how to run it in supabase/README.md.

Client:
- src/data/supabase.ts: client only when VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY exist (backendAvailable=false
  otherwise → local-only works fully).
- Dexie schema (children, progress, mastery, attempts, sessions, rewards, inkSamples, outbox, meta) with versioned
  migrations; repositories implementing every function; live hooks with dexie-react-hooks; active child persisted
  per device; progress created on first read with initialProgress from @/content (content is in parallel work —
  call it, don't copy it).
- AuthProvider/useAuth over Supabase auth (persisted session, onAuthStateChange), local-only mode, memberships and
  organizations loading, active org selection persisted, signUp creating the org via RPC, claimLocalData uploading
  local-only children to the account.
- Sync engine: outbox of upserts (LWW by updated_at) and append-only inserts (attempts, sessions); MONOTONIC merge for
  progress (unlocks/crystals/nodes done OR-ed, stars max, stickers/accessories union, letters kept, counters max);
  pull on sign-in, on 'online', on visibilitychange and every few minutes; backoff; useSyncStatus.
- Dashboards: getChildSummary (factGrid via @/engine factGrid, minutes/accuracy last 7 days, top errors) and
  getClassOverview; teacher assignments.
- Adult PIN: salted SHA-256 via crypto.subtle in meta. exportChildData (GDPR export).
- Dev helper (only when import.meta.env.DEV): window.__numeriaDev = { seed(), reset() } — seed() creates a demo child
  "Inessa" (gender f, grade 2, companion { species 'cat', name 'Luna', gender 'f', colorway 'default', equipped [] }),
  sets it active, local-only mode, and some progress/mastery so screens have data; reset() wipes local data. This is
  used by tools/shot.mjs --seed.
- Tests (vitest + fake-indexeddb): repositories, live hooks, merge functions (property tests: merge is commutative,
  idempotent, monotonic), outbox flush with a mocked Supabase client, PIN, local-only → claim flow.`,
  },
  {
    key: 'audio-pwa',
    prompt: `${COMMON}
YOUR MODULE: audio-pwa — sound, voice, haptics, celebrations and PWA polish. You own src/audio/**, src/fx/** and PWA
extras in public/ (NOT public/icons, public/models, public/fonts). Implement every export of src/audio/index.ts and
src/fx/index.ts with exactly those signatures (sibling files, re-export), replacing the stubs.

Requirements:
- sfx: all SfxName sounds synthesised with Web Audio (no files): cute, short, musical, low latency; 'wrong' is a soft
  friendly descending "boop" (never a buzzer); 'correct' a bright two-note chime; 'streak' rising arpeggio; 'crystal'
  magical shimmer; 'fanfare' short celebration; 'write' a very soft pencil tick (rate-limited); etc. Master volume,
  enable flag, small pitch variations so repeats don't feel robotic, voice-stealing limits.
- music: gentle generative background loops per MusicTheme (pentatonic, soft bell/marimba-like synths, warm pad,
  quiet by default), crossfade between themes, pause when the tab is hidden, duck(on) while speech plays.
- speech: Web Speech API; pick the best Spanish voice (prefer es-ES; on iPad e.g. "Mónica"; fall back to any es-*),
  voices load asynchronously; per-voice character (lumi/companion/narrator/guardian via pitch/rate); queue + interrupt;
  say() resolves on end/error; strip emojis/markup; numbers and "×" read naturally ("seis por siete"); iOS needs a user
  gesture first.
- haptics via navigator.vibrate patterns when supported (Android); silently no-op on iOS.
- unlockAudio (iOS: resume AudioContext + silent buffer + warm up speechSynthesis inside the gesture) and
  applyAudioSettings.
- fx: celebrate(kind) using canvas-confetti with themed palettes and star-shaped particles ('crystal' uses the world
  colour if provided, 'chest' is the biggest), no-op under prefers-reduced-motion (or a gentle fade alternative).
- PWA: review vite.config.ts manifest/workbox config (integrator-owned — do NOT edit it; list exact changes you
  recommend in contractRequests), verify the production build ('npx vite build') precaches fonts and models and works
  offline (serve dist with 'npx vite preview --port 4173' and test offline mode with Playwright), and check iOS
  standalone meta in index.html (integrator-owned, recommend changes only).
- Gallery src/audio/audio.gallery.tsx with buttons to trigger every sound, theme, voice line and celebration (you
  cannot hear in this container: verify via unit tests with a mocked AudioContext/speechSynthesis that every sound
  schedules nodes correctly, no exceptions, gains are within safe limits, and nodes are cleaned up).`,
  },
]

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    summary: { type: 'string', description: 'What was built, key design decisions' },
    publicApi: { type: 'string', description: 'Exports implemented + any extra exports added' },
    files: { type: 'array', items: { type: 'string' } },
    tests: { type: 'string', description: 'Commands run and results (counts)' },
    typecheckClean: { type: 'boolean' },
    screenshots: { type: 'array', items: { type: 'string' } },
    metrics: { type: 'string', description: 'Any quality metrics (accuracy, coverage, perf)' },
    contractRequests: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
    notesForOtherModules: { type: 'array', items: { type: 'string' }, description: 'Things consumers must know' },
  },
  required: ['module', 'summary', 'publicApi', 'tests', 'typecheckClean', 'openIssues'],
}


const CONTINUE_NOTE = `
IMPORTANT — CONTINUATION: a previous agent started this module and was interrupted by the orchestrator (to free a
concurrency slot, not because of a problem) before it could finish. Its work so far is ON DISK. Do NOT start over and
do not delete its work: first inspect what exists (your files, tests, notes, git diff, logs under /tmp/ and
ml/, and background processes such as training runs — check 'ps aux'), decide what is finished, then complete the
full specification below to the same quality bar and produce the final report.
`

function reviewPrompt(m, report) {
  return `${COMMON}
YOU ARE THE SENIOR REVIEWER AND FIXER for module "${m.key}". Another agent just built it; you now own the same files
(same ownership rules). Its report:
${JSON.stringify(report, null, 2)}

The original specification it was given:
------------------------------------------------------------------
${m.prompt.slice(COMMON.length)}
------------------------------------------------------------------

Be adversarial and thorough: read every file of the module; run the typecheck (filtered) and tests; look for
contract mismatches with src/types and the module's index signatures, spec items missed or half-done, wrong maths or
Spanish, edge cases, iPad/Android pitfalls (pointer/touch, Safari audio, viewport), performance and accessibility
problems, weak tests that don't really verify behaviour; for visual modules capture fresh screenshots and judge them
honestly against a "would a 7-year-old love this and would a school pay for it" bar. Then FIX every real problem
directly in the module's files (improve the art/UX where it is mediocre), add missing tests, re-run everything until
clean. Do not rewrite working parts just for taste. Report what you verified, what you fixed, and anything still open.`
}

const items = (args && args.items) || []
const byKey = Object.fromEntries(MODULES.map((m) => [m.key, m]))
const out = await pipeline(
  items,
  (it) => {
    const m = byKey[it.key]
    if (it.mode === 'review') return it.report
    const prompt = it.mode === 'continue' ? m.prompt.replace(COMMON, COMMON + CONTINUE_NOTE) : m.prompt
    return agent(prompt, { label: `${it.mode}:${m.key}`, phase: 'Build', schema: REPORT_SCHEMA })
  },
  (report, it) => {
    const m = byKey[it.key]
    return agent(reviewPrompt(m, report), { label: `review:${m.key}`, phase: 'Review', schema: REPORT_SCHEMA })
      .then((review) => ({ key: m.key, build: report, review }))
  },
)
return out
