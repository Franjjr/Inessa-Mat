/* The landing hero's animated demo: a tablet that plays five short scenes of what a child does in Repasitos — writing
   a column sum by hand (digits drawn stroke by stroke), a bar problem, a hint that helps without giving the answer,
   the companion rescued by a right answer, and the grown-up's report. Pure CSS animation restarted per scene (the
   scene's key remounts it); no sound. Tabs under the tablet jump to a scene; a mouse over the tablet holds the scene. With reduced motion nothing plays on its
   own and each scene shows its final state; the loop also stops while the demo is off screen. */
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import { Character, CompanionArt, Crystal } from '@/art'
import s from './HeroDemo.module.css'

const SCENE_MS = 6500

const SCENES = [
  { id: 'write', tab: 'Escribe', title: 'Sumas llevando', caption: 'Escribe con el lápiz o el dedo, como en el cuaderno.' },
  { id: 'bar', tab: 'Problemas', title: 'Problemas con barras', caption: 'Dibuja el problema con barras antes de hacer la cuenta.' },
  { id: 'hint', tab: 'Pistas', title: 'Las tablas', caption: 'Si se equivoca, una pista le ayuda sin darle la respuesta.' },
  { id: 'rescue', tab: 'Aventura', title: 'El Río de las Sumas', caption: 'Cada acierto rescata a su compañero y gana cristales.' },
  { id: 'report', tab: 'Informe', title: 'Informe para la familia', caption: 'Tú ves qué domina y qué conviene repasar.' },
] as const

/** Single-stroke handwritten digits in a 40 × 60 box. */
const DIGITS: Record<string, string> = {
  '1': 'M13 16 L24 7 L24 54',
  '2': 'M8 18 C10 4 34 4 32 20 C30 32 12 42 7 54 L34 54',
  '3': 'M8 12 C16 2 34 4 32 17 C30 27 18 28 16 28 C30 28 36 38 32 48 C26 58 10 56 6 48',
  '4': 'M27 54 L27 6 L6 38 L36 38',
  '5': 'M32 7 L12 7 L10 28 C18 22 34 24 34 39 C34 52 18 57 7 49',
  '8': 'M21 30 C6 24 8 6 21 6 C35 6 37 24 21 30 C4 36 6 56 21 56 C37 56 39 36 21 30',
  '9': 'M32 20 C32 6 10 6 10 20 C10 33 30 34 32 20 L30 55',
}

/** A digit written by hand: the stroke draws itself after `at` seconds. */
function Hand({ digit, at, dur = 0.55, className }: { digit: string; at: number; dur?: number; className?: string }) {
  return (
    <svg className={`${s.hand} ${className ?? ''}`} viewBox="0 0 40 60" aria-hidden>
      <path d={DIGITS[digit]} pathLength={1} style={{ animationDelay: `${at}s`, animationDuration: `${dur}s` } as CSSProperties} />
    </svg>
  )
}

/** Appears (pops in) after `at` seconds. */
const at = (sec: number): CSSProperties => ({ animationDelay: `${sec}s` })

function WriteScene() {
  return (
    <div className={s.scene}>
      <p className={s.prompt}>Suma llevando</p>
      <div className={s.column}>
        <span />
        <span className={`${s.cell} ${s.carry} ${s.focus}`} style={{ ['--focus-at' as string]: '1.9s' }}><Hand digit="1" at={2} /></span>
        <span />
        <span />
        <span className={s.num}>4</span>
        <span className={s.num}>7</span>
        <span className={s.op}>+</span>
        <span className={s.num}>3</span>
        <span className={s.num}>8</span>
        <span className={s.rule} />
        <span />
        <span className={`${s.cell} ${s.focus}`} style={{ ['--focus-at' as string]: '2.7s' }}><Hand digit="8" at={2.8} /></span>
        <span className={`${s.cell} ${s.focus}`} style={{ ['--focus-at' as string]: '0.6s' }}><Hand digit="5" at={0.8} /></span>
      </div>
      <p className={`${s.feedback} ${s.ok} ${s.pop}`} style={at(3.8)}>¡Muy bien! 7 + 8 = 15: escribes 5 y te llevas 1.</p>
    </div>
  )
}

function BarScene() {
  return (
    <div className={s.scene}>
      <p className={s.story}>Ana tiene 24 cromos y su hermano le regala 15. ¿Cuántos cromos tiene ahora?</p>
      <div className={s.bar}>
        <span className={`${s.seg} ${s.segA} ${s.grow}`} style={at(0.6)}>24</span>
        <span className={`${s.seg} ${s.segB} ${s.grow}`} style={at(1.3)}>15</span>
      </div>
      <div className={`${s.brace} ${s.pop}`} style={at(2)}><span>? cromos</span></div>
      <div className={s.equation}>
        <span>24 + 15 =</span>
        <span className={s.cellPair}>
          <span className={s.cell}><Hand digit="3" at={2.8} /></span>
          <span className={s.cell}><Hand digit="9" at={3.3} /></span>
        </span>
      </div>
      <p className={`${s.feedback} ${s.ok} ${s.pop}`} style={at(4.2)}>¡Eso es! Ahora tiene 39 cromos.</p>
    </div>
  )
}

function HintScene() {
  return (
    <div className={s.scene}>
      <div className={s.fact}>
        <span>7 × 6 =</span>
        <span className={`${s.cellPair} ${s.wrongPair}`}>
          <span className={s.cell}>
            <Hand digit="4" at={0.5} className={s.wrongInk} />
            <Hand digit="4" at={3.8} className={s.rightInk} />
          </span>
          <span className={s.cell}>
            <Hand digit="8" at={0.9} className={s.wrongInk} />
            <Hand digit="2" at={4.2} className={s.rightInk} />
          </span>
        </span>
      </div>
      <div className={`${s.hintRow} ${s.pop}`} style={at(1.9)}>
        <Character id="lumi" pose="talk" size={96} className={s.hintLumi} />
        <p className={s.bubble}>Casi. Piensa: 7 × 5 = 35. ¿Cuánto es 35 + 7?</p>
      </div>
      <p className={`${s.feedback} ${s.ok} ${s.pop}`} style={at(5)}>¡Muy bien! 7 × 6 = 42.</p>
    </div>
  )
}

function RescueScene() {
  return (
    <div className={`${s.scene} ${s.rescue}`}>
      <div className={s.rescueArt}>
        <div className={s.swapOut} style={at(1.8)}>
          <CompanionArt species="cat" pose="worried" size={150} />
          <span className={s.mist} aria-hidden />
        </div>
        <div className={s.swapIn} style={at(2.2)}>
          <CompanionArt species="cat" pose="cheer" size={150} />
        </div>
      </div>
      <div className={s.rescueSide}>
        <p className={s.rescueTitle}>
          <span className={s.swapOutText} style={at(1.8)}>¡Luna está atrapada en la niebla!</span>
          <span className={s.swapInText} style={at(2.2)}>¡Luna está a salvo!</span>
        </p>
        <div className={s.crystalRow}>
          <span className={s.crystalSwap}>
            <span className={s.swapOut} style={at(2.6)}><Crystal state="empty" color="#0ea5e9" size={64} /></span>
            <span className={s.swapIn} style={at(3)}><Crystal state="collected" color="#0ea5e9" size={64} /></span>
          </span>
          <span className={`${s.reward} ${s.pop}`} style={at(3.3)}>+1 cristal</span>
          <span className={`${s.reward} ${s.pop}`} style={at(3.7)}>+3 ⭐</span>
        </div>
      </div>
    </div>
  )
}

function ReportScene() {
  const rows: [string, number, string][] = [
    ['Sumas llevando', 92, s.good],
    ['Tablas del 2, 5 y 10', 85, s.good],
    ['Restas pidiendo prestado', 58, s.mid],
    ['Tabla del 7', 30, s.low],
  ]
  return (
    <div className={`${s.scene} ${s.report}`}>
      <p className={s.reportHead}>Ejemplo: así se ve el informe</p>
      <p className={`${s.reportLine} ${s.pop}`} style={at(0.3)}>Lía domina las sumas llevando; repasa la tabla del 7.</p>
      <ul className={s.meters}>
        {rows.map(([label, pct, tone], i) => (
          <li key={label}>
            <span>{label}</span>
            <span className={s.track}>
              <span className={`${s.fill} ${tone} ${s.grow}`} style={{ width: `${pct}%`, ...at(0.8 + i * 0.35) }} />
            </span>
          </li>
        ))}
      </ul>
      <p className={`${s.feedback} ${s.info} ${s.pop}`} style={at(2.6)}>Para repasar: 7 × 6, 7 × 8 y restas con ceros.</p>
    </div>
  )
}

const RENDER: Record<(typeof SCENES)[number]['id'], () => ReactElement> = {
  write: WriteScene, bar: BarScene, hint: HintScene, rescue: RescueScene, report: ReportScene,
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

export default function HeroDemo() {
  const [index, setIndex] = useState(0)
  const [round, setRound] = useState(0)
  const [visible, setVisible] = useState(true)
  const [hold, setHold] = useState(false)
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const playing = !reduced && visible && !hold

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => { setIndex((i) => (i + 1) % SCENES.length); setRound((r) => r + 1) }, SCENE_MS)
    return () => window.clearTimeout(t)
  }, [playing, index, round])

  const go = (i: number) => { setIndex(i); setRound((r) => r + 1) }
  const scene = SCENES[index]
  const Scene = RENDER[scene.id]

  return (
    <div
      ref={ref}
      className={s.demo}
      data-reduced={reduced || undefined}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHold(true) }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHold(false) }}
    >
      <div className={s.tablet}>
        <div className={s.screen} aria-live="off">
          <div className={s.appBar} aria-hidden>
            <span className={s.appPill}>✕ Salir</span>
            <span className={s.appTitle}>{scene.title}</span>
            <span className={s.appDots}>{SCENES.map((x, i) => <i key={x.id} className={i === index ? s.dotOn : undefined} />)}</span>
          </div>
          <div className={s.stage} key={`${scene.id}-${round}`} role="img" aria-label={scene.caption}>
            <Scene />
          </div>
        </div>
      </div>
      <p className={s.caption} key={`c-${scene.id}-${round}`}>{scene.caption}</p>
      <div className={s.tabs} role="tablist" aria-label="Ejemplos de la app">
        {SCENES.map((x, i) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={i === index ? `${s.tab} ${s.tabOn}` : s.tab}
            onClick={() => go(i)}
          >
            {x.tab}
            {i === index && playing && <span className={s.tabProgress} key={round} style={{ animationDuration: `${SCENE_MS}ms` }} />}
          </button>
        ))}
      </div>
    </div>
  )
}
