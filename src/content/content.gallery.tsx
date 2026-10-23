/* Dev gallery for the content module: /dev/gallery?only=src/content
   Not part of the content API. It lets the team check the 8 world maps (node layout along the winding path),
   proofread stories and lessons as a script, and review guardians, companions, the shop, the sticker album and
   the reaction phrases — all rendered through renderTemplate with a demo child. */
import type { GalleryEntry } from '@/dev/Gallery'
import type { ActivityKind, CharacterId, LessonDef, NodeDef, StoryDef, TemplateString, WorldDef } from '@/types'
import {
  accessories, companions, getLesson, getStory, guardians, PHRASES, renderTemplate, season1, stickers, type TemplateContext,
} from './index'
import { samplePath } from './worlds/path'
import s from './content.gallery.module.css'

const DEMO: TemplateContext = { childName: 'Inessa', childGender: 'f', petName: 'Bigotes', petGender: 'm', petSpecies: 'cat' }
const t = (text: TemplateString) => renderTemplate(text, DEMO)

const CHAR_EMOJI: Record<CharacterId, string> = {
  lumi: '🦄', companion: '🐱', borron: '☁️', owl: '🦉', frog: '🐸', ladybug: '🐞', polarbear: '🐻‍❄️', octopus: '🐙',
  fairy: '🧚', dragon: '🐉', queen: '👸', narrator: '📖',
}
const CHAR_NAME: Record<CharacterId, string> = {
  lumi: 'Lumi', companion: 'Bigotes', borron: 'Borrón', owl: 'Búho Sabio', frog: 'Rana Saltarina', ladybug: 'Reina Mariquita',
  polarbear: 'Nieve', octopus: 'Octavio', fairy: 'Hada Iris', dragon: 'Chispa', queen: 'Reina Aurora', narrator: 'Narrador',
}
const ACTIVITY_EMOJI: Record<ActivityKind, string> = {
  facts: '✏️', race: '⏱️', missing: '❓', wheel: '🎡', necklace: '📿', chain: '🔗', family: '🔺', maze: '🌀', pixel: '🎨',
  memory: '🃏', bubbles: '🫧', groups: '🍄', array: '🌸', column: '🧮', division: '🏠', share: '🧺', word: '📜', board: '🎲',
  exercises: '🧩',
}

function nodeEmoji(n: NodeDef, w: WorldDef): string {
  switch (n.kind) {
    case 'story': return '📖'
    case 'lesson': return '💡'
    case 'review': return '⭐'
    case 'guardian': return CHAR_EMOJI[w.guardian]
    case 'activity': return ACTIVITY_EMOJI[n.activity!.kind]
  }
}

const MAP_W = 520
const MAP_H = 362

function MapPreview({ world }: { world: WorldDef }) {
  const curve = samplePath(world.nodes.map((n) => [n.pos.x, n.pos.y] as [number, number]), 24)
  const d = curve.map((p, i) => `${i ? 'L' : 'M'}${(p.x * MAP_W).toFixed(1)} ${(p.y * MAP_H).toFixed(1)}`).join(' ')
  return (
    <div className={s.mapWrap}>
      <div className={s.mapHead}>
        <span className={s.mapIndex} style={{ background: world.color }}>{world.index}</span>
        <span className={s.mapName}>{t(world.name)}</span>
        <span className={s.mapHook}>{t(world.hook)}</span>
      </div>
      <div className={s.map} style={{ background: world.colorSoft, ['--wc' as string]: world.color }}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className={s.mapSvg} aria-hidden>
          <path d={d} className={s.road} />
          <path d={d} className={s.roadDash} />
        </svg>
        {world.nodes.map((n, i) => (
          <div key={n.id} className={s.node} data-kind={n.kind} style={{ left: `${n.pos.x * 100}%`, top: `${n.pos.y * 100}%` }}>
            <span className={s.nodeIcon}>{nodeEmoji(n, world)}</span>
            <span className={s.nodeLabel}><b>{i + 1}</b> {t(n.title)}</span>
          </div>
        ))}
      </div>
      <div className={s.mapFoot}>{world.skillsSummary}</div>
    </div>
  )
}

function StoryScript({ story }: { story: StoryDef }) {
  return (
    <div className={s.script}>
      <h3 className={s.h3}>{t(story.title)} <code className={s.code}>{story.id}</code></h3>
      {story.scenes.map((sc, i) => (
        <section key={i} className={s.scene}>
          <div className={s.sceneHead}>
            <span className={s.bgChip}>{sc.background}</span>
            {sc.cast.map((c) => (
              <span key={c.id} className={s.castChip} data-pred={c.predicament ? 'yes' : undefined}>
                {CHAR_EMOJI[c.id]} {c.position} · {c.pose}{c.predicament ? ` · ${c.predicament}` : ''}
              </span>
            ))}
          </div>
          {sc.lines.map((l, j) => (
            <p key={j} className={s.line} data-speaker={l.speaker}>
              <span className={s.speaker}>{CHAR_EMOJI[l.speaker]} {CHAR_NAME[l.speaker]}{l.pose ? ` (${l.pose})` : ''}</span>
              <span className={s.lineText}>{t(l.text)}</span>
              {l.sfx && <span className={s.sfx}>♪ {l.sfx}</span>}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}

function LessonScript({ lesson }: { lesson: LessonDef }) {
  return (
    <div className={s.script}>
      <h3 className={s.h3}>{t(lesson.title)} <code className={s.code}>{lesson.id}</code></h3>
      <ol className={s.steps}>
        {lesson.steps.map((st, i) => (
          <li key={i} className={s.step} data-try={st.interaction === 'try' ? 'yes' : undefined}>
            <span className={s.visual}>{st.visual}{st.params ? ` ${JSON.stringify(st.params)}` : ''}</span>
            <span className={s.lineText}>{st.speaker ? `${CHAR_EMOJI[st.speaker]} ` : '🦄 '}{t(st.text)}</span>
            {st.trySelector && <code className={s.code}>¡te toca! {JSON.stringify(st.trySelector)}</code>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Guardians() {
  return (
    <table className={s.table}>
      <thead><tr><th>Guardián</th><th>Pruebas</th><th>Para pasar</th><th>Hechizo del Cristal</th><th>Letra</th></tr></thead>
      <tbody>
        {guardians.map((g) => {
          const total = g.rounds.reduce((n, r) => n + r.count, 0)
          const f = g.spell.fixed!
          const op = { 'fact-mul': '×', 'column-mul': '×', 'column-add': '+', 'column-sub': '−', division: '÷' }[f.kind]
          return (
            <tr key={g.id}>
              <td><span className={s.big}>{CHAR_EMOJI[g.character]}</span> {t(g.title)}</td>
              <td>{g.rounds.map((r) => `${r.count}× ${(r.selector.kinds ?? []).join('/')}`).join(' + ')}</td>
              <td className={s.num}>{g.passMin} de {total}</td>
              <td>{t(g.spell.text)} <b className={s.num}>{f.a} {op} {f.b}</b></td>
              <td className={s.letter}>{g.letter}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const SPECIES_EMOJI: Record<string, string> = { cat: '🐱', dog: '🐶', fox: '🦊', bunny: '🐰', panda: '🐼', penguin: '🐧', dragon: '🐲', unicorn: '🦄' }

function Companions() {
  return (
    <div className={s.cards}>
      {companions.map((c) => (
        <div key={c.species} className={s.card}>
          <div className={s.cardTop}><span className={s.big}>{SPECIES_EMOJI[c.species]}</span><b>{c.articleNoun[0]} · {c.articleNoun[1]}</b></div>
          <div className={s.muted}>{c.personality}</div>
          <div className={s.names}>{c.suggestedNames.map((n) => <span key={n} className={s.pill}>{n}</span>)}</div>
        </div>
      ))}
    </div>
  )
}

const SLOT_LABEL = { head: 'cabeza', face: 'cara', neck: 'cuello', back: 'espalda', held: 'en la mano' }

function Shop() {
  return (
    <div className={s.tiles}>
      {accessories.map((a) => (
        <div key={a.id} className={s.tile}>
          <b>{a.name}</b>
          <span className={s.muted}>{SLOT_LABEL[a.slot]}</span>
          <span className={s.price}>⭐ {a.price}</span>
          {a.requiresWorld && <span className={s.lock}>🔒 cristal {season1.worlds.find((w) => w.id === a.requiresWorld)?.shortName}</span>}
        </div>
      ))}
    </div>
  )
}

function Album() {
  return (
    <div className={s.tiles}>
      {stickers.map((st) => (
        <div key={st.id} className={s.sticker}>
          <span className={s.stickerEmoji}>{st.emoji}</span>
          <b>{st.name}</b>
          <code className={s.code}>{st.earnedBy}</code>
        </div>
      ))}
    </div>
  )
}

function Phrases() {
  return (
    <div className={s.phrases}>
      {Object.entries(PHRASES).map(([kind, list]) => (
        <section key={kind} className={s.phraseCol}>
          <h3 className={s.h3}>{kind}</h3>
          {list.map((p) => <div key={p} className={s.phrase}>{t(p)}</div>)}
        </section>
      ))}
    </div>
  )
}

const entries: GalleryEntry[] = [
  ...season1.worlds.map((w) => ({ title: `Mapa ${w.id} · ${w.shortName}`, width: 548, render: () => <MapPreview world={w} /> })),
  { title: 'Guardianes y Hechizos del Cristal', width: 1120, render: () => <Guardians /> },
  { title: 'Historia: prólogo', width: 548, render: () => <StoryScript story={getStory('prologue')!} /> },
  { title: 'Historia: llegada al Bosque', width: 548, render: () => <StoryScript story={getStory('w1-arrival')!} /> },
  { title: 'Historia: rescate en el Castillo', width: 548, render: () => <StoryScript story={getStory('w8-rescue')!} /> },
  { title: 'Historia: gran final', width: 548, render: () => <StoryScript story={getStory('finale')!} /> },
  { title: 'Lección: ¿qué es multiplicar?', width: 548, render: () => <LessonScript lesson={getLesson('w1-groups')!} /> },
  { title: 'Lección: la casita de la división', width: 548, render: () => <LessonScript lesson={getLesson('w8-galera')!} /> },
  { title: 'Compañeros', width: 1120, render: () => <Companions /> },
  { title: 'Tienda de accesorios', width: 1120, render: () => <Shop /> },
  { title: 'Álbum de pegatinas', width: 1120, render: () => <Album /> },
  { title: 'Frases de reacción', width: 1120, render: () => <Phrases /> },
]

export default entries
