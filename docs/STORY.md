# Numeria — Story bible (season 1)

The Kingdom of **Numeria**, where numbers are magic: they make flowers grow, light the stars and paint the rainbow.
**Borrón** blew the **Niebla del Olvido** (Fog of Forgetting) and everyone forgot the numbers. **Lumi**'s horn went dark.
To light it again the child must recover **8 magic crystals** in 8 places. Each guardian gives a crystal and a
letter of the secret word **VALIENTE**. The 8 letters open the **Gran Cofre**, which holds a real-world prize set by
the adult (parent/teacher) in the adult area, plus a printable diploma.

## Cast

- **{child}** — the player (name and grammatical gender from onboarding). The hero.
- **{pet}, the companion** — the animal the child picked and named (cat, dog, fox, bunny, panda, penguin, baby
  dragon, baby unicorn). Best friend: curious, enthusiastic, brave but clumsy — **always gets into trouble** ("se
  mete en líos"). In every world it ends up in a predicament and the child rescues it by beating the guardian.
  Talks in short, excited sentences, cheers every correct answer, comforts after mistakes. Never mean, never scared
  for long. Can be dressed with accessories bought with stars.
- **Lumi** — grown-up white unicorn with a rainbow mane (7 pastel colours) and a golden spiral horn with 8 crystal
  sockets. Wise, warm guide and teacher of the tricks ("los trucos de Lumi").
- **Borrón** — a small grey fluffy cloud-goblin with stubby arms and big eyes. Mischievous, not evil. He blew the
  fog because he never understood numbers and felt left out. Appears briefly in worlds (laughing, stealing a
  number). Redemption in the finale: the child teaches him a trick.

## Worlds (guardian · crystal · letter · companion predicament)

| # | World | Guardian | Crystal | Letter | Predicament (`PredicamentKind`) | Hook |
|---|---|---|---|---|---|---|
| 1 | El Bosque de los Grupos | el Búho Sabio (owl, glasses) | verde | V | `vines` | {pet} chases a butterfly and gets tangled in the fairies' magic vines |
| 2 | El Río de las Sumas | la Rana Saltarina (frog on a lily pad) | azul | A | `bubble` | {pet} slips on a stone and floats away in a giant river bubble |
| 3 | La Cueva del Seis | la Reina Mariquita (glowing ladybug, tiny crown) | rojo | L | `stuck` | {pet} squeezes into a tiny tunnel after a glowing ladybug and gets stuck |
| 4 | La Montaña de las Restas | la osa Nieve (polar bear, scarf, hot chocolate) | celeste | I | `ice` | {pet} slides down the slope and ends up frozen in an ice block |
| 5 | El Lago del Ocho | el pulpo Octavio (purple octopus juggling objects) | violeta | E | `ink` | Octavio sneezes and covers {pet} in ink — it can't see a thing |
| 6 | El Jardín del Arcoíris | el Hada Iris (rainbow wings, fuchsia dress) | rosa | N | `fog` | the fog drains all of {pet}'s colours |
| 7 | La Forja del Dragón | la dragona Chispa (orange, friendly, forge apron) | naranja | T | `cage` | {pet} hides inside a cage-shaped lantern in the forge and it locks |
| 8 | El Castillo del Reparto | la Reina Aurora (golden dress, kind) | dorado | E | `net` | Borrón catches {pet} in a net to stop the child from finishing |

Story structure per world: arrival + hook (companion gets into trouble) → guardian explains what numbers
they need → lessons/practice (the predicament loosens visually as progress is made: `Predicament rescue` 0..1) →
guardian challenge + Hechizo del Cristal → rescue scene (companion freed, hugs, thanks the child by name) →
crystal into Lumi's horn, letter revealed.

Prologue: at home, the child and {pet} find a glowing book → Lumi appears → explains Numeria and the fog →
{pet} jumps through the portal first ("¡Vamos!") … and immediately gets into the first predicament.

Finale: 8th crystal → Lumi's horn shines with all colours → the fog disappears → Borrón confesses, sad → the child
teaches him a trick (teach-back activity) → secret word VALIENTE → the Gran Cofre opens (adult's reward) → diploma.
Then a teaser for season 2: "Las Islas de las Fracciones" (locked, "Próximamente").

## Art direction (all characters, backgrounds and UI art)

Flat vector, chibi proportions (big head, big eyes, rounded shapes), thick rounded outlines in a darker shade of
each fill (Lumi uses plum `#4c1d95`), soft pastel fills, small highlight shapes instead of gradients, pink cheeks.
Reference unicorn: `docs/reference/art.py` → `unicorn()` (the printed workbook's Lumi). Standard `viewBox` 0 0 200 200
per character so sizes are consistent. Idle animation: blink + gentle breathe; poses change face/arms/ears.
Backgrounds: layered SVG scenes (sky, far, mid, near) with soft colours; "vividness" desaturates toward grey
when fogged (Borrón) and returns to colour when the crystal is recovered.
