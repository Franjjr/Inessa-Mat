/* Dev gallery: /dev/gallery?only=src/audio
   Buttons for every sound effect, music theme, voice line, celebration and haptic pattern. Waveforms and piano
   rolls are rendered with the browser's real Web Audio engine (OfflineAudioContext), so the sounds can be
   checked visually even where nobody can listen. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import type { MusicTheme, SfxName } from '@/types'
import { Button } from '@/ui'
import { celebrate, type CelebrationKind } from '@/fx'
import { previewGentle } from '@/fx/celebrate'
import { getAnalyser } from './context'
import { haptics } from './haptics'
import { audioState, setMasterVolume, unlockAudio } from './index'
import { music, THEMES } from './music'
import { analyse, offlineSupported, peaks, renderSfx, seeded, traceTheme, type NoteTrace } from './offline'
import { sfx } from './sfx'
import { speech, type SpeechCharacter } from './speech'
import { toSpeakable } from './speechText'
import s from './audio.gallery.module.css'

// ---- Shared bits ----------------------------------------------------------------------------------------

function useTick(ms: number): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return n
}

function originOf(el: Element | null): { x: number; y: number } | undefined {
  if (!el) return undefined
  const r = el.getBoundingClientRect()
  return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
}

function cssColor(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function setupCanvas(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = c.clientWidth
  const h = c.clientHeight
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  const g = c.getContext('2d')
  g?.setTransform(dpr, 0, 0, dpr, 0, 0)
  return g
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" className={s.toggle} aria-pressed={on} onClick={() => onChange(!on)}>
      <span className={s.switch} aria-hidden />
      {children}
    </button>
  )
}

function Head({ icon, title, lead, children }: { icon: string; title: string; lead: string; children?: ReactNode }) {
  return (
    <>
      <div className={s.head}>
        <h2 className={s.title}><span className={s.titleIcon} aria-hidden>{icon}</span>{title}</h2>
        <span className={s.spacer} />
        {children}
      </div>
      <p className={s.lead}>{lead}</p>
    </>
  )
}

// ---- Status bar: engine state, live oscilloscope, master volume -----------------------------------------

const STATE_COPY = {
  running: 'Sonido activo',
  suspended: 'Sonido en pausa: toca para seguir',
  locked: 'Toca cualquier botón para activar el sonido',
  off: 'Este navegador no tiene Web Audio',
} as const

function Scope() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = setupCanvas(c)
    if (!g) return
    let raf = 0
    const data = new Uint8Array(512)
    const draw = () => {
      const w = c.clientWidth
      const h = c.clientHeight
      g.clearRect(0, 0, w, h)
      g.strokeStyle = getComputedStyle(c).color
      g.lineWidth = 2
      g.lineJoin = 'round'
      g.beginPath()
      const an = getAnalyser()
      if (an) an.getByteTimeDomainData(data)
      else data.fill(128)
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w
        const y = h / 2 + ((data[i] - 128) / 128) * (h / 2 - 4) * 2.2
        if (i === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className={s.scope} aria-label="Osciloscopio" role="img" />
}

function StatusBar() {
  useTick(400)
  const state = audioState()
  const [vol, setVol] = useState(100)
  return (
    <div className={s.status}>
      <span className={s.state} data-state={state} role="status">
        <span className={s.dot} aria-hidden />
        {STATE_COPY[state]}
      </span>
      <Scope />
      <span className={s.spacer} />
      <label className={s.volume}>
        Volumen general
        <input
          className={s.range}
          type="range"
          min={0}
          max={100}
          value={vol}
          onChange={(e) => {
            const v = Number(e.target.value)
            setVol(v)
            setMasterVolume(v / 100)
          }}
        />
      </label>
    </div>
  )
}

// ---- Sound effects --------------------------------------------------------------------------------------

type Tone = 'ui' | 'answer' | 'reward' | 'game'

const GROUPS: { title: string; tone: Tone; wide?: boolean; items: [SfxName, string, string][] }[] = [
  { title: 'Respuestas', tone: 'answer', items: [['correct', '✅', '¡Bien!'], ['wrong', '🤔', 'Casi'], ['streak', '🔥', 'Racha'], ['hint', '💡', 'Pista']] },
  { title: 'Juegos', tone: 'game', items: [['dice', '🎲', 'Dado'], ['tick', '⏱️', 'Tic-tac'], ['timeup', '⏰', '¡Tiempo!'], ['coin', '🪙', 'Moneda']] },
  { title: 'Premios', tone: 'reward', wide: true, items: [['star', '⭐', 'Estrella'], ['sparkle', '✨', 'Destello'], ['crystal', '💎', 'Cristal'], ['unlock', '🔓', 'Abrir'], ['levelup', '🚀', 'Subir nivel'], ['rescue', '🤗', 'Rescate'], ['chest-open', '🎁', 'Cofre'], ['fanfare', '🎺', 'Fanfarria']] },
  { title: 'Interfaz y lápiz', tone: 'ui', wide: true, items: [['tap', '👆', 'Toque'], ['select', '🔘', 'Elegir'], ['write', '✏️', 'Lápiz'], ['erase', '🧽', 'Borrar'], ['pop', '🫧', 'Burbuja'], ['page', '📖', 'Página'], ['whoosh', '💨', '¡Zas!'], ['step', '🐾', 'Paso']] },
]

/** Offline renders run one at a time (cheap, and keeps the page responsive). */
let renderChain: Promise<unknown> = Promise.resolve()
const waveCache = new Map<SfxName, { peaks: { min: number; max: number }[]; tail: number }>()

function renderWave(name: SfxName): Promise<{ peaks: { min: number; max: number }[]; tail: number }> {
  const hit = waveCache.get(name)
  if (hit) return Promise.resolve(hit)
  const job = renderChain.then(async () => {
    const buf = await renderSfx(name, 2.6, 22050)
    const st = analyse(name, buf)
    const out = { peaks: peaks(buf, 46, Math.max(0.25, Math.min(2.6, st.tail + 0.05))), tail: st.tail }
    waveCache.set(name, out)
    return out
  })
  renderChain = job.catch(() => undefined)
  return job
}

function Wave({ name, onTail }: { name: SfxName; onTail: (t: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!offlineSupported()) return
    let alive = true
    void renderWave(name).then(({ peaks: p, tail }) => {
      const c = ref.current
      if (!alive || !c) return
      onTail(tail)
      const g = setupCanvas(c)
      if (!g) return
      const w = c.clientWidth
      const h = c.clientHeight
      const top = Math.max(0.02, ...p.map((x) => Math.max(x.max, -x.min)))
      g.fillStyle = getComputedStyle(c).color
      const bw = w / p.length
      p.forEach((x, i) => {
        const a = (Math.max(x.max, -x.min) / top) * (h / 2 - 1)
        g.globalAlpha = 0.85
        g.beginPath()
        g.roundRect?.(i * bw + 0.5, h / 2 - a - 0.5, Math.max(1, bw - 1.2), a * 2 + 1, 1)
        g.fill()
      })
    }).catch(() => {})
    return () => { alive = false }
  }, [name, onTail])
  return <canvas ref={ref} className={s.wave} aria-hidden />
}

function SfxTile({ name, icon, label }: { name: SfxName; icon: string; label: string }) {
  const [ringing, setRinging] = useState(false)
  const [tail, setTail] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      className={s.tile}
      data-sfx={name}
      data-ringing={ringing}
      aria-label={`Sonido: ${label}`}
      onClick={() => {
        unlockAudio()
        sfx.play(name)
        setRinging(false)
        requestAnimationFrame(() => setRinging(true))
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setRinging(false), 700)
      }}
    >
      {tail !== null && <span className={s.tileDur}>{tail < 0.1 ? `${Math.max(1, Math.round(tail * 1000))} ms` : `${tail.toFixed(1).replace('.', ',')} s`}</span>}
      <span className={s.tileIcon} aria-hidden>{icon}</span>
      <span className={s.tileLabel}>{label}</span>
      <Wave name={name} onTail={setTail} />
      <span className={s.tileMeta}>{name}</span>
    </button>
  )
}

function SfxPanel() {
  return (
    <div className={s.panel}>
      <Head icon="🔊" title="Efectos de sonido" lead="Todos sintetizados con Web Audio, sin archivos: cortos, suaves y en la misma escala musical. El fallo es un «bup» amable, nunca un zumbido. Las ondas se generan con el motor de audio real." />
      <StatusBar />
      <div className={s.groups}>
        {GROUPS.map((g) => (
          <section key={g.title} className={`${s.group} ${g.wide ? s.groupWide : ''}`} data-tone={g.tone}>
            <h3 className={s.groupTitle}>{g.title}</h3>
            <div className={s.tiles}>
              {g.items.map(([name, icon, label]) => <SfxTile key={name} name={name} icon={icon} label={label} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

// ---- Music ------------------------------------------------------------------------------------------------

type Theme = Exclude<MusicTheme, 'none'>

const THEME_INFO: Record<Theme, { icon: string; name: string; desc: string }> = {
  map: { icon: '🗺️', name: 'Mapa', desc: 'Alegre y aventurera, para explorar Numeria.' },
  calm: { icon: '🌙', name: 'Calma', desc: 'Muy suave, para leer cuentos y aprender trucos.' },
  play: { icon: '🧩', name: 'Juego', desc: 'Discreta, para concentrarse en las cuentas.' },
  guardian: { icon: '🛡️', name: 'Guardián', desc: 'Valiente y con ritmo, para el gran desafío.' },
  celebration: { icon: '🎉', name: 'Fiesta', desc: 'Brillante, para celebrar un cristal.' },
}

const KEY_NAMES: Record<number, string> = { 57: 'la menor', 60: 'do mayor', 65: 'fa mayor', 67: 'sol mayor' }

const PART_COLORS: Record<NoteTrace['part'], [string, string]> = {
  pad: ['--c-line', '#e9d5ff'],
  bass: ['--pv-u', '#3b82f6'],
  arp: ['--pv-d', '#ec4899'],
  melody: ['--c-primary', '#7c3aed'],
  sparkle: ['--c-gold', '#f59e0b'],
}

function PianoRoll({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !offlineSupported()) return
    const seconds = 8 * 8 * (60 / THEMES[theme].bpm / 2)
    const notes = traceTheme(theme, seconds, seeded(theme.length * 97 + 11))
    const g = setupCanvas(c)
    if (!g) return
    const w = c.clientWidth
    const h = c.clientHeight
    const lo = 36
    const hi = 100
    const y = (m: number) => h - 4 - ((m - lo) / (hi - lo)) * (h - 8)
    for (let bar = 1; bar < 8; bar++) {
      g.fillStyle = cssColor('--c-surface-2', '#f5f3ff')
      g.fillRect((bar / 8) * w, 0, 1, h)
    }
    for (const part of ['pad', 'bass', 'arp', 'melody', 'sparkle'] as const) {
      const [token, fb] = PART_COLORS[part]
      g.fillStyle = cssColor(token, fb)
      g.globalAlpha = part === 'pad' ? 0.9 : part === 'arp' ? 0.55 : 1
      for (const n of notes.filter((x) => x.part === part)) {
        const x = (n.t / seconds) * w
        const nw = Math.max(3, (Math.min(n.dur, seconds - n.t) / seconds) * w - 1)
        const nh = part === 'pad' ? 5 : 4
        g.beginPath()
        g.roundRect?.(x, y(n.midi) - nh / 2, nw, nh, 2)
        g.fill()
      }
    }
    g.globalAlpha = 1
  }, [theme])
  return <canvas ref={ref} className={s.roll} aria-label={`Partitura generada: ${THEME_INFO[theme].name}`} role="img" />
}

function MusicPanel() {
  useTick(400)
  const [ducked, setDucked] = useState(false)
  const [vol, setVol] = useState(28)
  const current = music.current()
  const playing = music.isPlaying()
  return (
    <div className={s.panel}>
      <Head icon="🎵" title="Música de fondo" lead="Música generativa y tranquila: escala pentatónica, marimba, campanitas y un colchón cálido. Cambia con un fundido, se pausa si la app se oculta y baja sola cuando alguien habla." />
      <div className={s.themes}>
        {(Object.keys(THEMES) as Theme[]).map((t) => {
          const info = THEME_INFO[t]
          const active = current === t
          return (
            <article key={t} className={s.theme} data-active={active} data-theme={t}>
              <div className={s.themeHead}>
                <span className={s.themeIcon} aria-hidden>{info.icon}</span>
                <div>
                  <div className={s.themeName}>{info.name}</div>
                  <div className={s.themeMeta}>{THEMES[t].bpm} ppm · {KEY_NAMES[THEMES[t].root] ?? ''}</div>
                </div>
                {active && playing && <span className={s.eq} aria-hidden><span /><span /><span /></span>}
              </div>
              <p className={s.themeDesc}>{info.desc}</p>
              <PianoRoll theme={t} />
              <Button
                variant={active ? 'magic' : 'secondary'}
                block
                onClick={() => {
                  unlockAudio()
                  if (active) music.stop()
                  else music.play(t)
                }}
              >
                {active ? 'Parar' : 'Escuchar'}
              </Button>
            </article>
          )
        })}
      </div>
      <div className={s.row}>
        <Toggle on={ducked} onChange={(v) => { setDucked(v); music.duck(v) }}>Bajar la música (como cuando habla Lumi)</Toggle>
        <label className={s.volume}>
          Volumen de la música
          <input className={s.range} type="range" min={0} max={100} value={vol} onChange={(e) => { const v = Number(e.target.value); setVol(v); music.setVolume(v / 100) }} />
        </label>
      </div>
    </div>
  )
}

// ---- Voices -----------------------------------------------------------------------------------------------

const LINES: { who: SpeechCharacter; name: string; icon: string; text: string }[] = [
  { who: 'lumi', name: 'Lumi', icon: '🦄', text: '¡Hola, Inessa! Hoy aprendemos el truco del 6: 6 × 7 = 42.' },
  { who: 'companion', name: 'Compañero', icon: '🐱', text: '¡Toma ya! ¡Lo has clavado! 🎉 Ya tienes 21 estrellas.' },
  { who: 'narrator', name: 'Narrador', icon: '📖', text: 'Borrón sopló la Niebla del Olvido… y todo el reino olvidó los números.' },
  { who: 'guardian', name: 'Guardián', icon: '🦉', text: 'Para ganar el cristal verde, resuelve esto: 8 × 7 = ?' },
]

function VoiceLine({ who, name, icon, text }: { who: SpeechCharacter; name: string; icon: string; text: string }) {
  return (
    <div className={s.line} data-voice={who}>
      <span className={s.avatar} aria-hidden>{icon}</span>
      <div>
        <div className={s.who}>{name}</div>
        <p className={s.text}>{text}</p>
        <p className={s.reads}><b>Se lee:</b> {toSpeakable(text) || '(nada)'}</p>
      </div>
      <div className={s.actions}>
        <Button variant="secondary" onClick={() => { unlockAudio(); void speech.say(text, { voice: who }) }}>En cola</Button>
        <Button variant="primary" onClick={() => { unlockAudio(); void speech.say(text, { voice: who, interrupt: true }) }}>Escuchar</Button>
      </div>
    </div>
  )
}

function VoicePanel() {
  useTick(500)
  const [text, setText] = useState('¿Cuánto es 3843 − 1234? ¡Pide ayuda a la vecina! 🏠')
  const info = speech.voiceInfo()
  const available = speech.available()
  return (
    <div className={s.panel}>
      <Head icon="🗣️" title="Voces" lead="Lumi, el compañero, el narrador y los guardianes con la mejor voz en español del dispositivo (en iPad, «Mónica»). Se quitan los emojis y las cuentas se leen como en clase.">
        <Button variant="ghost" onClick={() => speech.stop()}>Parar voz</Button>
      </Head>
      <div className={s.voiceCard}>
        <span className={s.avatar} aria-hidden>🎙️</span>
        <div>
          <div className={s.voiceName}>{info ? info.name : available ? 'Cargando voces…' : 'No hay voz en español en este dispositivo'}</div>
          <div className={s.voiceMeta}>
            {info ? `${info.lang} · ${info.local ? 'en el dispositivo (funciona sin internet)' : 'en la nube (necesita internet)'}` : 'La app sigue funcionando: los textos se leen en pantalla.'}
          </div>
        </div>
      </div>
      <div className={s.lines}>
        {LINES.map((l) => <VoiceLine key={l.who} {...l} />)}
      </div>
      <div className={s.row}>
        <input className={s.input} value={text} onChange={(e) => setText(e.target.value)} aria-label="Texto para leer" />
        <Button variant="magic" onClick={() => { unlockAudio(); void speech.say(text, { interrupt: true }) }}>Leer</Button>
      </div>
      <p className={s.reads}><b>Se lee:</b> {toSpeakable(text) || '(nada)'}</p>
    </div>
  )
}

// ---- Celebrations -------------------------------------------------------------------------------------------

const FX: { kind: Exclude<CelebrationKind, 'crystal'>; icon: string; label: string; hint: string; sound: SfxName }[] = [
  { kind: 'small', icon: '✨', label: 'Pequeña', hint: 'respuesta correcta', sound: 'correct' },
  { kind: 'stars', icon: '⭐', label: 'Estrellas', hint: 'estrellas ganadas', sound: 'star' },
  { kind: 'big', icon: '🎊', label: 'Grande', hint: 'actividad terminada', sound: 'fanfare' },
  { kind: 'chest', icon: '🎁', label: 'Gran Cofre', hint: 'la más grande', sound: 'chest-open' },
]

const CRYSTALS = ['verde', 'azul', 'rojo', 'celeste', 'violeta', 'rosa', 'naranja', 'dorado']

function Gem({ color }: { color: string }) {
  return (
    <svg className={s.gem} viewBox="0 0 46 52" aria-hidden>
      <path d="M23 2 L42 16 L35 46 L11 46 L4 16 Z" fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M23 2 L30 16 L23 46 L16 16 Z" fill="rgba(255,255,255,.28)" />
      <path d="M4 16 L42 16" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      <path d="M12 10 L17 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function FxPanel() {
  const [gentle, setGentle] = useState(false)
  const [withSound, setWithSound] = useState(true)
  const fire = (kind: CelebrationKind, el: Element | null, colors?: string[], sound?: SfxName) => {
    unlockAudio()
    const origin = originOf(el)
    if (gentle) previewGentle(kind, { origin, colors })
    else celebrate(kind, { origin, colors })
    if (withSound && sound) sfx.play(sound)
    if (kind === 'chest' || kind === 'crystal') haptics.success()
  }
  return (
    <div className={s.panel}>
      <Head icon="🎉" title="Celebraciones" lead="Confeti de estrellas y destellos con los colores de Numeria. «Cristal» usa el color de cada mundo. Con «movimiento reducido» se ve un brillo suave que solo aparece y desaparece.">
        <Toggle on={withSound} onChange={setWithSound}>Con sonido</Toggle>
        <Toggle on={gentle} onChange={setGentle}>Movimiento reducido</Toggle>
      </Head>
      <div className={s.fxGrid}>
        {FX.map((f) => (
          <button key={f.kind} type="button" className={s.fxBtn} data-fx-kind={f.kind} onClick={(e) => fire(f.kind, e.currentTarget, undefined, f.sound)}>
            <span className={s.fxIcon} aria-hidden>{f.icon}</span>
            <span className={s.fxLabel}>{f.label}</span>
            <span className={s.fxHint}>{f.hint}</span>
          </button>
        ))}
      </div>
      <div className={s.crystals}>
        {CRYSTALS.map((name, i) => (
          <button
            key={name}
            type="button"
            className={s.crystalBtn}
            data-crystal={i + 1}
            style={{ ['--crystal' as string]: `var(--w${i + 1})`, ['--crystal-soft' as string]: `var(--w${i + 1}-soft)` }}
            aria-label={`Cristal ${name}`}
            onClick={(e) => fire('crystal', e.currentTarget, [`var(--w${i + 1})`], 'crystal')}
          >
            <Gem color={`var(--w${i + 1})`} />
            <span className={s.crystalName}>{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- Haptics -------------------------------------------------------------------------------------------------

function HapticsPanel() {
  const supported = haptics.supported()
  return (
    <div className={s.panel}>
      <Head icon="📳" title="Vibración" lead={supported ? 'Este navegador admite vibración (se nota en tablets y móviles Android). Pulsos cortos y suaves: un fallo es un doble toque, nunca un zumbido largo.' : 'Este dispositivo no vibra (iPad, iPhone u ordenador): las llamadas no hacen nada y no pasa nada.'} />
      <div className={s.hapticRow}>
        <Button variant="secondary" size="lg" onClick={() => haptics.tap()}>👆 Toque</Button>
        <Button variant="success" size="lg" onClick={() => haptics.success()}>🎉 Acierto</Button>
        <Button variant="secondary" size="lg" onClick={() => haptics.error()}>🤔 Casi</Button>
      </div>
    </div>
  )
}

const entries: GalleryEntry[] = [
  { title: 'Efectos de sonido', render: () => <SfxPanel /> },
  { title: 'Música', render: () => <MusicPanel /> },
  { title: 'Voces', render: () => <VoicePanel /> },
  { title: 'Celebraciones', render: () => <FxPanel /> },
  { title: 'Vibración', render: () => <HapticsPanel /> },
]

export default entries
