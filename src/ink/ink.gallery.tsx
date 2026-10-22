/* Gallery of the ink module: /dev/gallery?only=src/ink/ink.gallery
   Static looks (CellPreview) and scripted demos that replay synthetic pen strokes through the real capture →
   segmentation → display pipeline. The live entries with the real recogniser are in live.gallery.tsx. */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { InkProvider } from './InkProvider'
import { DigitCell } from './DigitCell'
import { NumberInput } from './NumberInput'
import { Keypad } from './Keypad'
import { CellGroup } from './CellGroup'
import { TraceDigit } from './TraceDigit'
import { CalibrationDone, CalibrationFlow } from './CalibrationFlow'
import { ModelDigit } from './ModelDigit'
import { useInputMode } from './hooks'
import { CellPreview } from './dev/CellPreview'
import { scriptedRecognizer, type ScriptedAnswer } from './dev/scripted'
import { replayStrokes, tap } from './dev/autoplay'
import { handwrite, handwriteNumber } from './fixtures'
import { fitModel } from './trace'
import { MODEL_H, MODEL_W } from './digitModels'

// ------------------------------------------------------------------------------------------ helpers

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ minHeight: 124, display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
      <span style={{ fontSize: 13, color: 'var(--c-ink-soft)', fontFamily: 'var(--font-read)' }}>{label}</span>
    </div>
  )
}

const Row = ({ children, gap = 28 }: { children: ReactNode; gap?: number }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap, padding: '14px 8px 4px' }}>{children}</div>
)

function Scripted({ answers, children, penSeen }: { answers: ScriptedAnswer[]; children: ReactNode; penSeen?: boolean }) {
  const rec = useMemo(() => scriptedRecognizer(answers), [answers])
  return <InkProvider recognizer={rec} penSeen={penSeen}>{children}</InkProvider>
}

/** Runs `fn` once after layout settles (fonts, gallery suspense). */
function useAfterMount(fn: () => void, delay = 250) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    const t = setTimeout(() => { done.current = true; fn() }, delay)
    return () => clearTimeout(t)
  }, [])
}

const surfaceOf = (root: HTMLElement | null, label: string) =>
  root?.querySelector<HTMLElement>(`[role="textbox"][aria-label="${label}"]`) ?? null

function writeInto(el: HTMLElement | null, digit: number, opts: { partial?: number; seed?: number } = {}) {
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  replayStrokes(el, handwrite(digit, { x: 0, y: 0, w, h }, { seed: opts.seed ?? digit + 3, fill: 0.78 }), { partial: opts.partial })
}

// ------------------------------------------------------------------------------------------ demos

const UNSURE: ScriptedAnswer[] = [{ digit: 7, confidence: 0.46, alternatives: [7, 1, 2] }]

function AlternativesDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState<number | null>(null)
  useAfterMount(() => {
    const el = surfaceOf(ref.current, 'demo dudosa')
    writeInto(el, 7, { seed: 11 })
    // after the other demos finished replaying (their pointerdowns would close the bubble)
    setTimeout(() => { if (el) tap(el, el.clientWidth / 2, el.clientHeight / 2) }, 1700)
  })
  return (
    <div ref={ref}>
      <DigitCell value={v} onChange={setV} ariaLabel="demo dudosa" />
    </div>
  )
}

function ColumnAddDemo({ autoplay }: { autoplay: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [res, setRes] = useState<(number | null)[]>([null, null, null])
  const [car, setCar] = useState<(number | null)[]>([null, null])
  const [checked, setChecked] = useState<null | boolean>(null)
  useAfterMount(() => {
    if (!autoplay) return
    writeInto(surfaceOf(ref.current, 'unidades del resultado'), 2, { seed: 5 })
    writeInto(surfaceOf(ref.current, 'llevada de las decenas'), 1, { seed: 9 })
    writeInto(surfaceOf(ref.current, 'decenas del resultado'), 3, { seed: 2 })
    setTimeout(() => writeInto(surfaceOf(ref.current, 'centenas del resultado'), 6, { seed: 4, partial: 0.55 }), 900)
  })
  const setR = (i: number) => (d: number | null) => { setChecked(null); setRes((r) => r.map((x, k) => (k === i ? d : x))) }
  const setC = (i: number) => (d: number | null) => setCar((r) => r.map((x, k) => (k === i ? d : x)))
  const status = (i: number, expected: number) => (checked == null ? 'idle' : res[i] === expected ? 'correct' : 'wrong') as 'idle' | 'correct' | 'wrong'
  const sign = { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-num)', color: 'var(--c-ink-soft)', fontWeight: 600 } as const
  return (
    <div ref={ref} style={{ padding: 8 }}>
      <CellGroup order="rtl-columns" onSubmit={() => setChecked(true)} keypadPosition="right">
        <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, auto)', gap: '10px 12px', alignItems: 'center', justifyItems: 'center' }}>
          <span />
          <DigitCell variant="carry" value={car[0]} onChange={setC(0)} ariaLabel="llevada de las centenas" />
          <DigitCell variant="carry" value={car[1]} onChange={setC(1)} ariaLabel="llevada de las decenas" />
          <span />
          <span />
          <DigitCell variant="given" place="c" value={3} onChange={() => {}} />
          <DigitCell variant="given" place="d" value={4} onChange={() => {}} />
          <DigitCell variant="given" place="u" value={7} onChange={() => {}} />
          <span style={sign}>+</span>
          <DigitCell variant="given" place="c" value={2} onChange={() => {}} />
          <DigitCell variant="given" place="d" value={8} onChange={() => {}} />
          <DigitCell variant="given" place="u" value={5} onChange={() => {}} />
          <span style={{ gridColumn: '1 / -1', justifySelf: 'stretch', height: 4, borderRadius: 4, background: 'var(--c-ink)' }} />
          <span />
          <DigitCell place="c" value={res[0]} onChange={setR(0)} status={status(0, 6)} ariaLabel="centenas del resultado" />
          <DigitCell place="d" value={res[1]} onChange={setR(1)} status={status(1, 3)} ariaLabel="decenas del resultado" />
          <DigitCell place="u" value={res[2]} onChange={setR(2)} status={status(2, 2)} ariaLabel="unidades del resultado" autoFocus={!autoplay} />
        </div>
      </CellGroup>
    </div>
  )
}

function NumberDemo({ text, partial, label }: { text: string; partial?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<number | null | undefined>(undefined)
  useAfterMount(() => {
    const el = surfaceOf(ref.current, label)
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    const box = { x: w * 0.2, y: h * 0.02, w: w * 0.26 * text.length, h: h * 0.96 }
    replayStrokes(el, handwriteNumber(text, box, { fill: 0.8, seed: 4 }), { partial })
  })
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <NumberInput value={v} onChange={setV} onSubmit={(x) => setSubmitted(x)} maxDigits={2} ariaLabel={label} status={submitted === 42 ? 'correct' : 'idle'} />
    </div>
  )
}

function FactCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '6px 4px' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-2xl)', color: 'var(--c-ink)', whiteSpace: 'nowrap' }}>6 × 7 =</span>
      {children}
    </div>
  )
}

function TraceAutoplay({ digit }: { digit: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState<string>('')
  useAfterMount(() => {
    const el = ref.current?.querySelector<HTMLElement>('[role="img"]')
    if (!el) return
    const fit = fitModel(el.clientWidth, el.clientHeight)
    const strokes = handwrite(digit, { x: fit.ox, y: fit.oy, w: MODEL_W * fit.scale, h: MODEL_H * fit.scale }, { fill: 1, slant: 0.03, wobble: 2.4, seed: 8 })
    replayStrokes(el, strokes)
  }, 400)
  return (
    <div ref={ref}>
      <TraceDigit digit={digit} onDone={(r) => setDone(`${r.stars}★`)} />
      {done && <p style={{ textAlign: 'center' }}>{done}</p>}
    </div>
  )
}

// ------------------------------------------------------------------------------------------ entries

const entries: GalleryEntry[] = [
  {
    title: 'DigitCell · estados',
    width: 1120,
    render: () => (
      <Row>
        <Labeled label="vacía"><CellPreview phase="empty" /></Labeled>
        <Labeled label="escribiendo"><CellPreview phase="writing" inkDigit={4} partial={0.6} /></Labeled>
        <Labeled label="reconocida"><CellPreview phase="recognized" digit={4} /></Labeled>
        <Labeled label="dudosa (?)"><CellPreview phase="unsure" digit={7} unsure seed={6} /></Labeled>
        <Labeled label="¿alternativas?"><Scripted answers={UNSURE}><AlternativesDemo /></Scripted></Labeled>
        <Labeled label="con teclado"><CellPreview phase="typed" digit={8} /></Labeled>
        <Labeled label="activa"><CellPreview phase="empty" status="active" /></Labeled>
        <Labeled label="dada"><CellPreview phase="typed" digit={5} variant="given" /></Labeled>
        <Labeled label="llevada"><CellPreview phase="recognized" digit={1} variant="carry" /></Labeled>
      </Row>
    ),
  },
  {
    title: 'DigitCell · revisión, casas y tamaños',
    width: 1120,
    render: () => (
      <Row>
        <Labeled label="correcta"><CellPreview phase="recognized" digit={6} status="correct" /></Labeled>
        <Labeled label="¡casi! (revisar)"><CellPreview phase="recognized" digit={3} status="wrong" seed={9} /></Labeled>
        <Labeled label="pista"><CellPreview phase="empty" status="hint" /></Labeled>
        <Labeled label="UM · C · D · U">
          <CellPreview phase="typed" digit={1} place="um" />
          <CellPreview phase="recognized" digit={9} place="c" />
          <CellPreview phase="recognized" digit={0} place="d" seed={4} />
          <CellPreview phase="empty" place="u" />
        </Labeled>
        <Labeled label="sm · md · lg · casillas grandes">
          <CellPreview phase="recognized" digit={2} size="sm" />
          <CellPreview phase="recognized" digit={2} size="md" />
          <CellPreview phase="recognized" digit={2} size="lg" />
          <CellPreview phase="recognized" digit={2} size="md" big />
        </Labeled>
      </Row>
    ),
  },
  {
    title: 'Suma en columna · CellGroup (unidades primero) · escribiendo',
    width: 640,
    render: () => (
      <Scripted answers={[{ digit: 2 }, { digit: 1 }, { digit: 3 }, { digit: 6 }]}>
        <ColumnAddDemo autoplay />
      </Scripted>
    ),
  },
  {
    title: 'Suma en columna · teclado (escribe, flechas, Tab, Enter)',
    width: 460,
    render: () => <ColumnAddDemo autoplay={false} />,
  },
  {
    title: 'NumberInput · 6 × 7 = 42 (reconocido)',
    width: 640,
    render: () => (
      <Scripted answers={[{ digit: 4 }, { digit: 2 }]}>
        <FactCard><NumberDemo text="42" label="demo 42" /></FactCard>
      </Scripted>
    ),
  },
  {
    title: 'NumberInput · escribiendo',
    width: 640,
    render: () => (
      <Scripted answers={[{ digit: 4 }, { digit: 2 }]}>
        <FactCard><NumberDemo text="42" partial={0.5} label="demo escribiendo" /></FactCard>
      </Scripted>
    ),
  },
  {
    title: 'NumberInput · teclado de números a la derecha (keypadPosition="right")',
    width: 900,
    render: () => (
      <Scripted answers={[{ digit: null }]}>
        <ForceKeypad>
          <FactCard><NumberInput value={null} onChange={() => {}} onSubmit={() => {}} maxDigits={2} keypadPosition="right" ariaLabel="demo teclado" /></FactCard>
        </ForceKeypad>
      </Scripted>
    ),
  },
  {
    title: 'NumberInput · teclado debajo (pregunta encima)',
    width: 640,
    render: () => (
      <Scripted answers={[{ digit: null }]}>
        <ForceKeypad>
          <KeypadBelowDemo />
        </ForceKeypad>
      </Scripted>
    ),
  },
  {
    title: 'Sin lápiz: un dedo intenta escribir (el lápiz ya se usó en este dispositivo)',
    width: 1120,
    render: () => (
      <Scripted answers={[{ digit: null }]} penSeen>
        <LostPencilDemo />
      </Scripted>
    ),
  },
  {
    title: 'Keypad',
    width: 760,
    render: () => (
      <Row gap={32}>
        <Keypad onDigit={() => {}} onDelete={() => {}} onSubmit={() => {}} />
        <Keypad layout="wide" onDigit={() => {}} onDelete={() => {}} onSubmit={() => {}} />
      </Row>
    ),
  },
  {
    title: 'Modelos de los números (orden de los trazos)',
    width: 1120,
    render: () => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <ModelDigit key={d} digit={d} height={128} />)}
      </div>
    ),
  },
  {
    title: 'TraceDigit · repasa el 4',
    width: 640,
    render: () => <TraceDigit digit={4} onDone={() => {}} />,
  },
  {
    title: 'TraceDigit · resultado (7)',
    width: 640,
    render: () => <TraceAutoplay digit={7} />,
  },
  {
    title: 'CalibrationFlow',
    width: 1120,
    height: 780,
    render: () => <CalibrationAutoplay />,
  },
  {
    title: 'CalibrationFlow · final',
    width: 1120,
    height: 560,
    render: () => <div style={{ height: 520, display: 'flex' }}><CalibrationDone companionName="Coco" species="cat" onDone={() => {}} /></div>,
  },
]

function CalibrationAutoplay() {
  const ref = useRef<HTMLDivElement>(null)
  useAfterMount(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-label="Escribe aquí el número 1"]')
    if (el) replayStrokes(el, handwrite(1, { x: 0, y: 0, w: el.clientWidth, h: el.clientHeight }, { fill: 0.7, seed: 12 }), { partial: 0.75 })
  }, 500)
  return <div ref={ref} style={{ height: 740, display: 'flex' }}><CalibrationFlow childId="gallery" companionName="Coco" onDone={() => {}} /></div>
}

function KeypadBelowDemo() {
  const [v, setV] = useState<number | null>(48)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-2xl)', color: 'var(--c-ink)' }}>6 × 8 = ?</span>
      <NumberInput value={v} onChange={setV} onSubmit={() => {}} maxDigits={2} ariaLabel="demo teclado debajo" />
    </div>
  )
}

/** A finger "writes" on a column-op cell and on a number pad while a pen is known: both point to the keypad. */
function LostPencilDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const [cells, setCells] = useState<(number | null)[]>([null, null])
  useAfterMount(() => {
    // after the other demos' synthetic pen strokes (the hint never shows while the pen is in use)
    const finger = (label: string, digit: number) => {
      const el = surfaceOf(ref.current, label)
      if (el) replayStrokes(el, handwrite(digit, { x: 0, y: 0, w: el.clientWidth, h: el.clientHeight }, { pointerType: 'touch', fill: 0.7 }))
    }
    finger('sin lápiz unidades', 4)
    finger('sin lápiz número', 7)
  }, 5200)
  const set = (i: number) => (d: number | null) => setCells((c) => c.map((x, k) => (k === i ? d : x)))
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 90, padding: '64px 24px 12px' }}>
      <CellGroup order="reverse" keypadPosition="right">
        <div style={{ display: 'flex', gap: 12 }}>
          <DigitCell place="d" value={cells[0]} onChange={set(0)} ariaLabel="sin lápiz decenas" />
          <DigitCell place="u" value={cells[1]} onChange={set(1)} ariaLabel="sin lápiz unidades" />
        </div>
      </CellGroup>
      <NumberInput value={null} onChange={() => {}} onSubmit={() => {}} maxDigits={2} ariaLabel="sin lápiz número" />
    </div>
  )
}

/** Puts its subtree in keypad mode (as if the child chose "teclado de números" in settings). */
function ForceKeypad({ children }: { children: ReactNode }) {
  const { setPreferred } = useInputMode()
  useEffect(() => { setPreferred('keypad') }, [setPreferred])
  return <>{children}</>
}

export default entries
