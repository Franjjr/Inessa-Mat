export const meta = {
  name: 'numeria-game',
  description: 'Build/continue/review the Numeria game layer (activities, lessons, world screens, adult panels)',
  phases: [
    { title: 'Build', detail: 'activities-facts, activities-ops, lessons, world-core, world-meta, adult' },
    { title: 'Review', detail: 'independent senior reviewer per module: verify, test, fix' },
  ],
}

const COMMON = `
You are one of several expert agents building "Numeria", a Spanish maths adventure PWA for children. First user: Inessa
(7, turning 8, Spain) who struggles with the 6/7/8 times tables, column addition/subtraction with 3-4 digits,
2-digit x 1-digit multiplication and division. It will also be SOLD to families and schools, so quality must be
production-grade. Main devices: iPad + Apple Pencil (first), then Android tablet + stylus, plus computers with keyboard.

Repo: /Users/mac13/Desktop/Inessa-Mat (Vite 8 + React 19 + TypeScript strict, path alias @/ -> src/). FIRST read:
docs/ARCHITECTURE.md, docs/PEDAGOGY.md, docs/STORY.md, every file in src/types/, src/ui/index.tsx, src/app/routes.tsx,
src/activities/{index.tsx,host.tsx,registry.ts}, src/world/contracts.ts, and the public entry (index.ts) of every
module you depend on. The foundation modules are DONE and reviewed: @/engine, @/content (read src/content/README.md
for activity params), @/ink, @/art, @/data, @/audio, @/fx. Their reports (APIs, gotchas, notes for consumers) are in
docs/handoff/reports/*.json — read the ones you depend on. The printed workbook this app grows from is
docs/reference/ (build.py contains its Spanish texts, lessons and exercises).

Hard rules:
- Edit ONLY files you own (listed below). Never change shared contracts (src/types/**, other modules' index files,
  src/ui, src/app, src/activities/{index.tsx,host.tsx,registry.ts}, src/world/contracts.ts). If a contract truly
  blocks you, work around it and describe the needed change under contractRequests in your final report.
- Files currently in your folders are placeholders (or a previous agent's partial work): they are yours to replace.
- Do NOT install npm packages. Do NOT run git commands that change state (no commit, checkout, stash, reset, clean).
- Other agents are building the other game modules at the same time: their code may be mid-work. Only fix errors in
  your files. Depend only on the contracts, never on another module's internals.
- A Vite dev server is already running on http://localhost:5173 (do not start another on that port).
- User-facing copy in Spanish (Spain), simple and warm for 7-8 year olds (adult screens: clear, professional); code
  and comments in English. Errors are clues, never harsh. Child copy goes through host.t()/renderTemplate.
- Use CSS Modules + tokens from src/styles/tokens.css; tap targets >= 56px; never rely on hover; honour
  prefers-reduced-motion; must look great at 1180x820 (iPad landscape), 820x1180 (portrait), 1280x800 (Android),
  1440x900 (desktop). No window.alert/confirm (use Modal from @/ui).
- Before finishing: 'npm run typecheck 2>&1 | grep <your paths>' must show ZERO errors for your files; run your tests
  with 'npx vitest run <your folders>' and make them pass. For anything visual, add *.gallery.tsx entries and capture:
  'node tools/shot.mjs "/dev/gallery?only=<your folder>" shots/<name>.png --device ipad' (also --device android /
  ipad-portrait when layout matters). Real routes can be captured with a demo child:
  'node tools/shot.mjs /play shots/home.png --seed --device ipad' (options: --click "css", --eval "js", --wait ms,
  --full). OPEN every PNG with the Read tool and look at it critically; iterate until it is genuinely polished and
  delightful, not just "working". Screenshots go in shots/ (gitignored).
- Your final message is a structured report (it is data for the integrator, not a chat message).
`

const MODULES = [
  {
    key: 'activities-facts',
    prompt: `${COMMON}
YOUR MODULE: activities-facts — times-table minigames and their exercise views. You own
src/activities/{facts,race,missing,wheel,necklace,chain,family,maze,pixel,memory,bubbles}/** and
src/activities/views/{FactView,MissingFactorView,SkipCountView,DoubleChainView,FactFamilyView}.tsx (+ their CSS
modules, tests and galleries next to them).

Requirements:
- Each activity folder's index.tsx DEFAULT-exports a component with ActivityProps (src/types/activity.ts). Read its
  params exactly as documented in src/content/README.md and generate exercises through @/engine (generate with
  host.rng, check, hintsFor, strategyForFact). Report EVERY attempt via useActivityHost().reportAttempt and use
  host.react() for companion reactions; finish with the result the contract defines (stars via @/engine starsFor).
- Answer input through @/ink only (NumberInput / DigitCell / Keypad, useInputMode). After a correct handwritten
  answer call useInkLearning().confirm() so the recogniser adapts to the child.
- Views: each *View.tsx DEFAULT-exports ExerciseViewProps for its ExerciseKind(s) (FactView handles fact-mul and
  fact-div). These views are the building blocks the activities and other modules (guardian, review) render through
  <ExerciseView/>.
- Pedagogy (docs/PEDAGOGY.md): hints escalate (strategy → visual → worked), wrong answers get a diagnosis-based
  gentle clue from @/engine, the mirror rule and the per-table tricks show up, timed games respect
  host.prefs.timedActivities (offer an untimed path), bigCells/handedness prefs honoured.
- Minigames must FEEL like games, each with its own mechanic and juice (motion/react, @/audio sfx, @/fx celebrate,
  @/art Sparkles/StarIcon): facts (calm practice), race (beat your own time, never other kids), missing (missing
  factor), wheel (spin-the-wheel), necklace (skip counting beads), chain (doubling chains), family (fact families
  triangle), maze (pick the right answer path), pixel (reveal pixel art with correct answers), memory (match
  fact↔product cards), bubbles (pop the bubble with the answer). Sessions are short (≈8-12 items), adaptive.
- Tests: each activity reports attempts and finishes correctly (testing-library with a mock host), views accept
  keyboard input, hints escalate. Galleries for every view and activity; check iPad + Android screenshots.`,
  },
  {
    key: 'activities-ops',
    prompt: `${COMMON}
YOUR MODULE: activities-ops — operations minigames and exercise views. You own
src/activities/{groups,array,column,division,share,word,board}/** and
src/activities/views/{GroupsView,ArrayView,ColumnView,DivisionView,WordProblemView}.tsx (+ CSS modules, tests,
galleries next to them).

Requirements:
- Each activity folder's index.tsx DEFAULT-exports a component with ActivityProps; read params as documented in
  src/content/README.md; exercises from @/engine (generate with host.rng, check with its error diagnosis, hintsFor).
  Report EVERY attempt via useActivityHost().reportAttempt, use host.react(), finish per the contract (starsFor).
- Input through @/ink only. ColumnView (column-add/sub/mul): use DigitCell/CellGroup, answer written UNITS FIRST
  (right to left, focus moves left automatically), carry cells above the columns (optional, never graded), borrow
  scratch marks for subtraction never graded, 2-digit x 1-digit multiplication in column with its carry. After a
  correct handwritten answer call useInkLearning().confirm().
- DivisionView: Spanish "galera" layout (dividend left, divisor right under the bracket, quotient below the divisor,
  subtractions under the dividend), step by step for 'long' divisions, remainder shown for remainder variants.
- Groups/Array views: visual objects (groups of items, rows x columns) built with SVG/CSS, tappable for counting.
- WordProblemView: short Spanish problems via host.t() (gender agreement through templates), read-aloud button
  (@/audio speech) when host.prefs.voice, the answer unit shown.
- Minigames with distinct mechanics and juice: groups (make equal groups), array (build/read rectangles), column
  (column sums/subtractions with a story wrapper), division (galera), share (share fairly between friends — division
  as sharing), word (word problems), board (board-game track advancing with correct answers).
- Tests: carries/borrows not graded, units-first focus order, galera steps, attempts reported, keyboard works.
  Galleries for every view and activity; check iPad + Android screenshots, including the column view with Pencil-size
  cells.`,
  },
  {
    key: 'lessons',
    prompt: `${COMMON}
YOUR MODULE: lessons — the animated lesson player. You own src/activities/lesson/** (LessonPlayer is re-exported by
src/activities/index.tsx; keep its exported name/props exactly as that file expects).

Requirements:
- LessonPlayer plays a LessonDef from @/content (getLesson): a sequence of short steps with Lumi/companion speaking
  (@/art Character, host.t() templates, optional @/audio speech with the narrator/lumi voice), each step with a visual
  identified by LessonVisualId (src/types/content.ts) — implement EVERY LessonVisualId as an animated, child-friendly
  visual component (motion/react; reduced-motion = static end state): e.g. groups of objects, arrays, number lines,
  the mirror rule (6x7 = 7x6), doubles chains, table tricks (x9 fingers, x5 clock, etc.), place value houses, column
  addition with carry, subtraction with borrowing, 2x1 multiplication in column, division as sharing and the galera.
  Use the workbook (docs/reference/build.py) as the source of the explanations.
- Interactive "try it" steps where the lesson asks the child to answer through <ExerciseView/> (from
  @/activities) and checks before continuing; Next/Back controls, progress dots, replay voice, exit.
- Tests: every LessonVisualId has a component (exhaustiveness test), every Season 1 lesson renders all its steps
  without errors, navigation works with keyboard. Gallery that plays each visual; check iPad screenshots of several
  steps, including landscape and portrait.`,
  },
  {
    key: 'world-core',
    prompt: `${COMMON}
YOUR MODULE: world-core — the child's journey. You own src/world/{picker,onboarding,home,map,node,story,host}/**.
Implement the default exports routes.tsx imports (ChildPickerScreen, OnboardingScreen, ChildHomeScreen,
WorldMapScreen, NodeScreen) and the contracts in src/world/contracts.ts you own (StoryPlayer, GameHostProvider,
CompanionBuddy).

Requirements:
- ChildPickerScreen (/kids): the device's child profiles (@/data useChildren) as big friendly cards with their
  companion (@/art CompanionArt), "add child" (→ /kids/new), adult entry (→ /adult, behind the gate).
- OnboardingScreen (/kids/new): name, gender (for grammar only, phrased kindly), grade, choose a companion (8 species,
  colourways from @/art COLORWAYS), name it and its gender, handwriting calibration (@/ink CalibrationFlow, skippable),
  then the prologue story (PROLOGUE_STORY_ID) → home. Creates the child via @/data and sets it active. Big, playful,
  one question per screen, works without a keyboard.
- ChildHomeScreen (/play): companion + Lumi with LumiHorn crystals, continue-the-adventure button (next node via
  @/content nextNode), daily review, free play, album, shop, chest (when unlocked), diploma (season done), sync
  status pill, switch child.
- WorldMapScreen (/play/w/:worldId): the world's WorldBackground (vividness from progress), path with NodeIcon per
  node (locked/done/stars from @/content isNodeUnlocked + progress), the companion's predicament visible until rescue
  (Predicament with rescue fraction), smooth scrolling path on tablets.
- NodeScreen (/play/w/:worldId/:nodeId): dispatcher by node kind — story → StoryPlayer, lesson → LessonPlayer,
  activity → ActivityRunner, guardian → GuardianChallenge (world-meta, contract), review → DailyReview (world-meta).
  On finish: applyNodeResult → @/data updateProgress → RewardOverlay (world-meta) → back to map / next node. Wrap
  activities in GameHostProvider.
- StoryPlayer: plays StoryDef scenes (characters via @/art Character with poses, backgrounds, speech bubbles through
  templates, optional voice), tap to advance, skip/exit.
- GameHostProvider: the real ActivityHost — reportAttempt → @/engine updateMastery → @/data saveMastery +
  recordAttempt, session start/touch/end, rng seeded, mastery loaded, t() with the child's templateContext, prefs from
  the child's settings, react() → CompanionBuddy reactions + @/audio sfx/haptics.
- CompanionBuddy: corner widget with the companion + Lumi reacting (cheer, think, encourage) to host.react().
- Tests: onboarding creates the child; NodeScreen dispatches each kind; GameHostProvider persists attempts and
  mastery (fake-indexeddb); map lock states. Galleries + real-route screenshots with --seed (home, map, node,
  onboarding) on iPad landscape/portrait and Android.`,
  },
  {
    key: 'world-meta',
    prompt: `${COMMON}
YOUR MODULE: world-meta — rewards, guardians and extras. You own
src/world/{guardian,rewards,album,shop,chest,diploma,free,review}/**. Implement the default exports routes.tsx imports
(FreePlayScreen, DailyReviewScreen, AlbumScreen, ShopScreen, ChestScreen, DiplomaScreen) and the contracts you own
in src/world/contracts.ts (GuardianChallenge, RewardOverlay, DailyReview). StoryPlayer and GameHostProvider come from
world-core through the contract paths (src/world/story/StoryPlayer.tsx, src/world/host/GameHost.tsx).

Requirements:
- GuardianChallenge: the world's guardian (@/content getGuardian, @/art Character) poses a themed challenge of mixed
  exercises from the world's skills through <ExerciseView/>; pass threshold from the GuardianDef; onPass gives the
  crystal + letter, onFail is encouraging with a retry. Wrapped in GameHostProvider by NodeScreen.
- RewardOverlay: stars earned (StarIcon pop), crystal flying into LumiHorn for kind 'crystal', new stickers/accessories,
  season celebration; @/fx celebrate + @/audio sfx; continue button.
- DailyReview (+ DailyReviewScreen /play/review): short spaced-repetition session from @/engine dueSkills/planSession
  through <ExerciseView/> inside GameHostProvider; friendly when nothing is due.
- FreePlayScreen (/play/free): pick any unlocked minigame/table to practise freely (ActivityRunner).
- AlbumScreen (/play/album): sticker album pages per world (@/content stickers), locked silhouettes.
- ShopScreen (/play/shop): spend stars on accessories for the companion (@/content canBuyAccessory/buyAccessory,
  spendableStars), preview on CompanionArt, equip/unequip, persists via @/data.
- ChestScreen (/play/chest): when all crystals are collected, the chest opens (@/art ChestArt) showing the ADULT's real
  reward (from @/data getRewards / chest reward set by the parent) and the secret word VALIENTE assembled from the
  letters; markRewardUnlocked/claimed.
- DiplomaScreen (/play/diploma): printable diploma (print CSS, A4 landscape) with the child's name, companion and
  date; print button.
- Tests: guardian pass/fail thresholds, shop spending and equip persistence, chest locked/unlocked, review with no due
  items. Galleries + real-route screenshots with --seed on iPad and Android; print preview of the diploma
  (page.pdf or emulateMedia print screenshot).`,
  },
  {
    key: 'adult',
    prompt: `${COMMON}
YOUR MODULE: adult — the grown-ups' side. You own src/adult/**. Implement the default exports routes.tsx imports
(WelcomeScreen, LoginScreen, SignupScreen, AdultGate, AdultHomeScreen, ChildReportScreen, SchoolScreen, ClassScreen,
JoinClassScreen, SettingsScreen, PrivacyScreen). Data only through @/data (read its index.ts and its report).

Requirements:
- WelcomeScreen (/welcome): what Numeria is, for families and schools, "try without an account" (local-only) and
  sign in / sign up. LoginScreen/SignupScreen: Supabase email+password (and magic link if @/data supports it), choose
  family or school on sign-up (organisation created via @/data), clear Spanish errors, claim local data after sign-in,
  works with backend unavailable (explains local-only mode).
- AdultGate: protects /adult/** from children — PIN (set on first use, @/data hasAdultPin/setAdultPin/verifyAdultPin)
  with a "forgot PIN" path via the account password when signed in; a simple adult maths question fallback in
  local-only mode. Number pad UI, 56px targets.
- AdultHomeScreen (/adult): the organisation's children, sync status, links to reports, school area if the org is a
  school, settings, add child (→ /kids/new).
- ChildReportScreen (/adult/child/:childId): @/data getChildSummary — the 10x10 times-table heatmap (@/engine
  factGrid: mastered/learning/struggling/unseen, colour + label, never colour only), frequent errors explained in plain
  Spanish (@/engine describeError), time and accuracy last 7 days, progress through worlds, chest reward setup (what
  the real reward is; setChestReward), per-child settings (timed activities, big cells, voice, handedness), reset
  handwriting calibration (clearInkSamples), GDPR export (exportChildData → JSON download) and delete child.
- SchoolScreen/ClassScreen (/adult/school, /adult/class/:id): classes, create/archive, join codes (regenerate), class
  heatmap overview (getClassOverview), assignments (createAssignment), remove enrollment. JoinClassScreen
  (/adult/join): a parent enters a class code to enrol their child (consent wording).
- SettingsScreen: account, organisation members/invites (inviteMember, createInviteLink), change PIN, sound/music/
  voice, sign out. PrivacyScreen (/legal/privacidad): clear GDPR-style privacy policy in Spanish (data minimised, no
  analytics, Supabase in EU if applicable — do not invent facts you can't verify; mark placeholders for the owner).
- Tests: gate blocks without PIN and lets through with it, report renders the heatmap from a seeded summary, sign-up
  form validation, join class flow with a mocked @/data. Galleries + real-route screenshots (--seed) on iPad, Android
  and desktop.`,
  },
]

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    summary: { type: 'string' },
    publicApi: { type: 'string', description: 'Exports implemented + any extra exports added' },
    files: { type: 'array', items: { type: 'string' } },
    tests: { type: 'string', description: 'Commands run and results (counts)' },
    typecheckClean: { type: 'boolean' },
    screenshots: { type: 'array', items: { type: 'string' } },
    contractRequests: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
    notesForOtherModules: { type: 'array', items: { type: 'string' }, description: 'Things consumers must know' },
  },
  required: ['module', 'summary', 'publicApi', 'tests', 'typecheckClean', 'openIssues'],
}

const CONTINUE_NOTE = `
IMPORTANT — CONTINUATION: a previous agent started this module and was interrupted before it could finish. Its work so
far is ON DISK. Do NOT start over and do not delete its work: first inspect what exists (your files, tests, git diff),
decide what is finished, then complete the full specification below to the same quality bar and produce the report.
`

function reviewPrompt(m, report) {
  return `${COMMON}
YOU ARE THE SENIOR REVIEWER AND FIXER for module "${m.key}". Another agent just built it; you now own the same files
(same ownership rules). Its report:
${typeof report === 'string' ? report : JSON.stringify(report, null, 2)}

The original specification it was given:
------------------------------------------------------------------
${m.prompt.slice(COMMON.length)}
------------------------------------------------------------------

Be adversarial and thorough: read every file of the module; run the typecheck (filtered) and tests; look for
contract mismatches with src/types, the routes and the cross-module contracts, spec items missed or half-done, wrong
maths or Spanish, edge cases, iPad/Android pitfalls (pointer/touch, Pencil, viewport, Safari), performance and
accessibility problems, weak tests that don't really verify behaviour. Capture fresh screenshots of EVERY screen /
activity you own (galleries and, where possible, real routes with --seed) and judge them honestly against a "would a
7-year-old love this and would a school pay for it" bar. Then FIX every real problem directly in the module's files
(improve the UX/visuals where they are mediocre), add missing tests, re-run everything until clean. Do not rewrite
working parts just for taste. Report what you verified, what you fixed, and anything still open.`
}

const items = (args && args.items) || MODULES.map((m) => ({ key: m.key, mode: 'build' }))
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
