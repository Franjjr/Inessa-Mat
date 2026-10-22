# content — Season 1 of Numeria

Data + pure functions only (no React, no I/O). Public entry: `@/content` (`src/content/index.ts`).

```
index.ts          public API (contract signatures + extras)
season.ts         season1 assembly + lookups (getWorld/getNode/getStory/getLesson/getGuardian)
worlds/w1..w8.ts  WorldDef + nodes (dsl.ts builders, path.ts map layout)
stories/*.ts      prologue, per-world arrival / mid / rescue, finale (dsl.ts builders)
lessons/*.ts      LessonDef per world (dsl.ts builders)
guardians.ts      GuardianDef ×8, SPELL_CODES (VALIENTE), SPELL_DECOYS
companions.ts     CompanionDef ×8, speciesNoun
accessories.ts    AccessoryDef ×18 (ids drawn by src/art/companions)
stickers.ts       StickerDef ×27 + earnedBy rule parser/evaluator
phrases.ts        reaction phrase banks, pickPhrase / pickPhraseFor
template.ts       renderTemplate, templateContext
progression.ts    unlocks, nextNode, applyNodeResult, shop rules
meta.ts           optional teach-back activity, season-2 teaser, diploma + chest copy
```

## Worlds and nodes

Each world has 7–13 nodes: `arrival` story → lessons / activities (3–7 activities of ≥ 3 kinds, the last ones are the
`exercises` stops of the world's stage of the temario, see `GRADE3_STAGES`) → an optional
`mid` story (Borrón appears) → `guardian` (always last, id `guardian`). Node ids are stable strings
(`arrival`, `lesson-groups`, `column-carry`, …) — progress is stored by them, never rename.
`pos` (0..1, x → right, y → down) is laid out evenly along a smooth, non-crossing path; tests guarantee ≥ 120 px
between nodes at 1180×820 / 1280×800 and ≥ 100 px at 820×1180, with x in [0.1, 0.9] and y in [0.1, 0.9].
`review` nodes (w7) have no ref and no activity: render `DailyReview`.

## Templates

`{child} {pet} {pet_species} {el_pet_species} {cg:F|M} {pg:F|M}` as in `src/types/content.ts`, plus:

- `{al_pet_species}` / `{del_pet_species}` → "al gatito" / "a la gatita", "del gatito" / "de la gatita"
  (never write "a {el_pet_species}").
- Capitalised variants for sentence starts: `{Pet_species}`, `{El_pet_species}`, `{Al_pet_species}`, `{Del_pet_species}`.
- Gender options may contain simple placeholders: `{cg:Querida {child}|Querido {child}}`.
- Two options → feminine, masculine (no third, gender-free form). One option → used for everyone. Unknown placeholders stay visible.
- Inserted names are never re-parsed. Gender agreement is always done on `{pet}` (the name), never on the species
  noun (the fox is "el zorrito" for every gender).

## Activity params (per `ActivityKind`)

Every `ActivityConfig` has `title`, `instructions` (TemplateStrings), `selector` (for `@/engine` `generate`) and
`count`. `params` are minimal and optional unless marked **required**; unknown params can be ignored safely.
The structure test fails if content uses a param not listed here.

| kind | params | meaning |
|---|---|---|
| `facts` | `showTrick?: boolean`, `helper?: string` | Written answers to fact exercises from the selector (fact-mul / fact-div). `showTrick` shows the level-1 hint (the trick, `strategyForFact`) above each item before answering. `helper: 'borron'` = the finale teach-back: the child solves *for* Borrón (cosmetic). |
| `race` | — | Answer `count` facts as fast as possible against the child's own records (`NodeProgress.records`, fastest first, kept by progression). If `prefs.timedActivities` is false, play untimed. |
| `missing` | — | `missing-factor` items (`6 × ? = 42`). |
| `wheel` | **`center: number`**, **`numbers: number[]`** | "La rueda del 6": the table in the centre, the ring of numbers around it; one item per number, in order (`count === numbers.length`). Facts are `center × n`. |
| `necklace` | `beads?: number` (default 10) | Each `skip-count` exercise is one necklace of beads; the hidden beads are the exercise's `hiddenIndexes`. |
| `chain` | — | `double-chain` items ("doble, doble y doble"). |
| `family` | — | `fact-family` triangles: write the 4 related facts. |
| `maze` | **`table`**, **`rows`**, **`cols`** | Grid `rows × cols`; a monotone path (right/down) from 🦄 top-left to 💎 bottom-right uses only multiples of `table` (`table×1..10`), every other cell is a non-multiple. The child taps the path. `count` = number of mazes. Log one attempt per tapped cell (skill `mul:table×k`) or per maze. |
| `pixel` | **`picture: string[]`**, **`legend`** | Hidden picture: each character of each row is a cell; `legend[char] = { product?: number, color: 'var(--token)', name: 'rosa' }`. Cells whose key has a `product` show a fact with that product from the selector tables (e.g. 42 → 6×7 or 7×6); the key without `product` (`'.'`) shows any other fact of the selector. Answering colours the cell. `count` = max questions: cells sharing the same fact may be revealed together. |
| `memory` | — | Card pairs fact ↔ product; `count` = number of pairs. |
| `bubbles` | `choices?: number` (default 4) | A fact is shown; `choices` bubbles float with candidate answers (1 right + near misses); pop the right one. |
| `groups` | `showSum?: boolean` | `groups` items; with `showSum` the child first writes the repeated addition (3 + 3 + 3 + 3) then the product. |
| `array` | `mirror?: boolean` | `array` items; with `mirror`, after answering the array rotates and the child writes the mirrored fact. |
| `column` | `guided?`, `proof?`, `place?`, `split?` (booleans) | Column add/sub/mul from the selector. `guided`: highlight the current column and the carry/borrow boxes (pass `guided` to `ExerciseView`). `proof` (subtraction): after a correct result ask "la prueba mágica" (result + subtrahend = minuend). `place`: show the operands in a row ("3456 + 278") and let the child place the digits in the houses first. `split` (2×1 multiplication): show the pieces helper (47 = 40 + 7). |
| `division` | `guided?`, `proof?` (booleans) | Galera items. `proof`: after answering, check `cociente × divisor + resto = dividendo`. |
| `share` | `emoji?: string`, `container?: string` | Fair sharing manipulative for `fact-div` items: drag `emoji` objects into `divisor` containers (`container` emoji), then write `p ÷ d = q`. |
| `word` | `chooseOp?: boolean` | Story problems (`word-problem`; text already contains numbers, may contain `{child}`/`{pet}` → `host.t`). `chooseOp`: pick + − × ÷ before solving. |
| `board` | **`squares`**, **`opponent: CharacterId`**, **`specials`** | "Carrera al Castillo" vs `opponent` (Lumi). Roll a die, each square shows a fact from the selector; say/write it to stay. `specials: { at, emoji, text, move }[]` — landing on `at` shows `text` and moves `move` squares (negative = back). Square 1 is 🏠 Salida, `squares` is 🏰. |

Stars: `starThresholds` default `[0.6, 0.8, 0.95]` (engine `starsFor`).

## Lessons

Steps use `LessonVisualId` with exactly the params listed in `src/types/content.ts`. `speaker` is omitted for Lumi
and set when a guardian explains its own rules. **Consecutive steps with the same visual and params are successive
phases of one animation** (e.g. carry: units → tens → hundreds): keep the visual mounted and advance it.
`interaction: 'try'` steps carry a `trySelector` for exactly one mini exercise.

## Guardians

`rounds` use explicit skills (the workbook's items); `passMin = total − 1` (workbook rule). The spell is always
`fixed` (use `makeExercise(kind, a, b)` from `@/engine`); its result is in `SPELL_CODES` and the letter in
`GuardianDef.letter`. On pass, call `applyNodeResult(p, worldId, 'guardian', { stars, passed: true })` and play
`rescueStory`; after w8 play `FINALE_STORY_ID`.

## Progression (`applyNodeResult`)

- story/lesson → done, `COMPLETION_STARS` (3). activity/review → done when `stars ≥ 1` or `passed: true`.
  guardian → done only when passed (`passed: true`, or a `letter` with `passed` omitted — stars alone never pass).
- Best stars kept; the star currency grows only by the improvement → replays never farm stars.
- Crystal + letter (from content) + world `completedAt` + next world unlocked on guardian pass;
  `diplomaEarnedAt` when all 8 crystals are won.
- Stickers whose rule became true are appended (`newStickers(before, after)` for the reward overlay).
- `lastNode`, today's **local** date in `daysPlayed`, `updatedAt`. Race nodes keep the 5 fastest `records`.
- `nextNode`: the unfinished world the child was last in, else the furthest open world without crystal.
- `startingWorldForGrade`: 1º–3º → `w1`, 4º–6º → `w3`; use `unlockThroughWorld(p, id)` to open the earlier worlds
  too (so their letters can still be won).

## Stickers (`earnedBy`)

`node:<w>:<node>` · `stars:<w>:<node>:<n>` · `world:<w>` · `days:<n>` (different days played, never a losable
streak; `streak:<n>` is accepted as an alias) · `season:<s>`. `describeStickerRule(rule, nodeTitle, worldName)`
gives the child-facing "¿Cómo se consigue?" text.

## Phrases

`pickPhrase(kind, rng, errorType)` — ≥ 10 phrases per `ReactionKind`; with an `errorType` and kind
`wrong`/`hint`/`encourage` it picks a clue for that error. Phrases naming `{pet}` in the third person suit Lumi;
use `pickPhraseFor('companion', …)` when the companion speaks.

## Dev gallery

`/dev/gallery?only=src/content` — the 8 maps, guardians/spells, sample stories and lessons as scripts, companions,
shop, album and phrases.
