/* Dev-only "recogniser lab": write a digit with pen/finger/mouse and see what the model sees and thinks.
   Used from src/ink/ml/ml.gallery.tsx (/dev/gallery?only=src/ink/ml). Not part of the child UI. */
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { InkPoint, InkStroke } from '@/types'
import { Button } from '@/ui'
import { createRecognizer, type NumeriaRecognition, type NumeriaRecognizer, type PersonalSample } from './recognizer'
import s from './RecognizerLab.module.css'

const PAD_W = 300
const PAD_H = 340

const shared: NumeriaRecognizer = createRecognizer()
function useSharedRecognizer() {
  const [ready, setReady] = useState(shared.ready)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    shared.load().then(
      () => alive && setReady(true),
      (e: unknown) => alive && setError(String(e)),
    )
    return () => {
      alive = false
    }
  }, [])
  return { rec: shared, ready, error }
}

const REASON: Record<NumeriaRecognition['reason'], string> = {
  ok: '¡Lo tengo!',
  empty: 'Escribe una cifra',
  tiny: 'Muy pequeñito',
  scribble: 'Parece un garabato',
  unsure: 'No estoy seguro',
  'not-ready': 'Cargando el modelo…',
}

function Preview28({ image, size = 112 }: { image: Float32Array | null; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const data = ctx.createImageData(28, 28)
    for (let i = 0; i < 784; i++) {
      const v = image ? image[i] : 0
      // ink colour on paper: lerp paper (#fff) -> ink (#2e1a47)
      data.data[i * 4] = Math.round(255 + (46 - 255) * v)
      data.data[i * 4 + 1] = Math.round(255 + (26 - 255) * v)
      data.data[i * 4 + 2] = Math.round(255 + (71 - 255) * v)
      data.data[i * 4 + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
  }, [image])
  return <canvas ref={ref} width={28} height={28} className={s.preview} style={{ width: size, height: size }} aria-label="Imagen 28×28 que ve el modelo" />
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: InkStroke[], dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, PAD_W, PAD_H)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 9
  ctx.strokeStyle = getComputedStyle(ctx.canvas).color || '#2e1a47'
  for (const st of strokes) {
    const p = st.points
    if (!p.length) continue
    ctx.beginPath()
    ctx.moveTo(p[0].x, p[0].y)
    if (p.length === 1) ctx.lineTo(p[0].x + 0.01, p[0].y)
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y)
    ctx.stroke()
  }
}

export interface RecognizerLabProps {
  /** Pre-filled strokes (gallery screenshots). */
  initialStrokes?: InkStroke[]
  initialZone?: { width: number; height: number }
}

export function RecognizerLab({ initialStrokes, initialZone }: RecognizerLabProps) {
  const { rec, ready, error } = useSharedRecognizer()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<InkStroke[]>(() => fitStrokes(initialStrokes ?? [], initialZone))
  const current = useRef<InkStroke | null>(null)
  const [samples, setSamples] = useState<PersonalSample[]>([])
  const [, force] = useState(0)

  // cheap (~2 ms) and renders only happen on stroke end / teaching, so no memo is needed
  const result: NumeriaRecognition | null = ready ? rec.recognize(strokes, { width: PAD_W, height: PAD_H }) : null

  const redraw = useCallback(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const all = current.current ? [...strokes, current.current] : strokes
    drawStrokes(ctx, all, c.width / PAD_W)
  }, [strokes])

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    c.width = PAD_W * dpr
    c.height = PAD_H * dpr
    redraw()
  }, [redraw])

  const pt = (e: React.PointerEvent): InkPoint => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * PAD_W) / r.width, y: ((e.clientY - r.top) * PAD_H) / r.height, t: e.timeStamp, p: e.pressure }
  }
  const onDown = (e: React.PointerEvent) => {
    canvas.current!.setPointerCapture(e.pointerId)
    current.current = { points: [pt(e)], pointerType: e.pointerType === 'pen' ? 'pen' : e.pointerType === 'touch' ? 'touch' : 'mouse' }
    force((n) => n + 1)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!current.current) return
    const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? []
    if (evs.length) {
      const r = canvas.current!.getBoundingClientRect()
      for (const ev of evs) current.current.points.push({ x: ((ev.clientX - r.left) * PAD_W) / r.width, y: ((ev.clientY - r.top) * PAD_H) / r.height, t: ev.timeStamp })
    } else current.current.points.push(pt(e))
    redraw()
  }
  const onUp = () => {
    if (!current.current) return
    const st = current.current
    current.current = null
    setStrokes((prev) => [...prev, st])
  }

  const teach = (digit: number) => {
    if (!result || !result.embedding.length) return
    const next = [...samples, { digit, embedding: result.embedding, image28: result.image28 }]
    setSamples(next)
    rec.setPersonalSamples(next)
  }
  const counts = ready ? rec.personalCounts() : Array(10).fill(0)

  const big = result?.digit ?? null
  return (
    <div className={s.lab}>
      <div className={s.padCol}>
        <div className={s.padWrap}>
          <canvas
            ref={canvas}
            className={s.pad}
            style={{ width: PAD_W, height: PAD_H }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label="Zona para escribir una cifra"
          />
          {!strokes.length && <span className={s.hint} aria-hidden>Escribe aquí</span>}
        </div>
        <Button variant="secondary" block onClick={() => setStrokes([])} disabled={!strokes.length}>Borrar</Button>
      </div>

      <div className={s.panel} aria-live="polite">
        {error && <p className={s.error}>No se ha podido cargar el modelo: {error}</p>}
        <div className={s.verdict}>
          <div className={clsx(s.bigDigit, big === null && s.bigUnknown)} data-testid="lab-digit">{big ?? '?'}</div>
          <div className={s.verdictText}>
            <strong>{result ? REASON[result.reason] : REASON['not-ready']}</strong>
            {result && result.digit !== null && <span className={s.conf}>{Math.round(result.confidence * 100)} % seguro</span>}
            {result && result.alternatives.length > 0 && (
              <div className={s.altRow}>
                <span className={s.altLabel}>¿Querías escribir…?</span>
                {result.alternatives.map((a) => (
                  <button key={a.digit} type="button" className={s.alt} onClick={() => teach(a.digit)} title={`Guardar como ${a.digit}`}>
                    <span className={s.altDigit}>{a.digit}</span>
                    <span className={s.altP}>{Math.round(a.p * 100)}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={s.row}>
          <figure className={s.fig}>
            <Preview28 image={result?.image28 ?? null} />
            <figcaption>Lo que ve el modelo (28×28)</figcaption>
          </figure>
          <div className={s.bars} role="list" aria-label="Probabilidad de cada cifra">
            {Array.from({ length: 10 }, (_, d) => {
              const p = result?.alternatives.length ? result.probs[d] : 0
              return (
                <div key={d} className={clsx(s.bar, d === big && s.barTop)} role="listitem">
                  <span className={s.barLabel}>{d}</span>
                  <span className={s.barTrack}><span className={s.barFill} style={{ width: `${p * 100}%` }} /></span>
                  <span className={s.barCount} title="Muestras personales">{counts[d] ? `★${counts[d]}` : ''}</span>
                </div>
              )
            })}
            <div className={clsx(s.bar, s.barReject)} role="listitem">
              <span className={s.barLabel}>✗</span>
              <span className={s.barTrack}><span className={s.barFill} style={{ width: `${(result?.rejectProb ?? 0) * 100}%` }} /></span>
              <span className={s.barCount} />
            </div>
          </div>
        </div>
        <p className={s.meta}>
          {result ? `${result.ms.toFixed(1).replace('.', ',')} ms · ` : ''}
          {rec.modelId ?? 'sin modelo'}
          {result && result.personalWeight > 0.01 ? ` · personalizado ${Math.round(result.personalWeight * 100)} %` : ''}
          {samples.length ? ` · ${samples.length} muestras` : ''}
        </p>
      </div>
    </div>
  )
}

/** Scale/centre fixture strokes into the lab pad so screenshots look natural. */
function fitStrokes(strokes: InkStroke[], zone?: { width: number; height: number }): InkStroke[] {
  if (!strokes.length) return []
  const zw = zone?.width ?? PAD_W
  const zh = zone?.height ?? PAD_H
  const k = Math.min(PAD_W / zw, PAD_H / zh)
  const ox = (PAD_W - zw * k) / 2
  const oy = (PAD_H - zh * k) / 2
  return strokes.map((st) => ({ ...st, points: st.points.map((p) => ({ ...p, x: p.x * k + ox, y: p.y * k + oy })) }))
}

/** Grid of fixture cases with what the model sees and answers (no interaction). */
export function RecognizerCases({ cases }: { cases: { name: string; expected: number | null; zone: { width: number; height: number }; strokes: InkStroke[] }[] }) {
  const { rec, ready } = useSharedRecognizer()
  return (
    <div className={s.cases}>
      {cases.map((c) => {
        const r = ready ? rec.recognize(c.strokes, c.zone) : null
        const ok = r && r.digit === c.expected
        return (
          <div key={c.name} className={clsx(s.case, r && (ok ? s.caseOk : s.caseBad))}>
            <Preview28 image={r?.image28 ?? null} size={56} />
            <span className={s.caseDigit}>{r ? (r.digit ?? '–') : '…'}</span>
            <span className={s.caseName}>{c.name}</span>
          </div>
        )
      })}
    </div>
  )
}

interface WriterFixture {
  zone: { width: number; height: number }
  oddDigit: number
  calibration: Record<string, InkStroke[][]>
  extraOdd: InkStroke[][]
  testOdd: InkStroke[][]
}

/** Before/after personalisation for a simulated child who writes a mirrored "3". */
export function PersonalizationDemo({ writer }: { writer: WriterFixture }) {
  const [state, setState] = useState<{ before: NumeriaRecognition[]; after: NumeriaRecognition[] } | null>(null)
  useEffect(() => {
    let alive = true
    const r = createRecognizer()
    r.load().then(() => {
      if (!alive) return
      const z = writer.zone
      const before = writer.testOdd.map((s) => r.recognize(s, z))
      const samples: PersonalSample[] = [
        ...Object.entries(writer.calibration).flatMap(([d, inks]) => inks.map((s) => ({ digit: Number(d), embedding: r.recognize(s, z).embedding }))),
        ...writer.extraOdd.map((s) => ({ digit: writer.oddDigit, embedding: r.recognize(s, z).embedding })),
      ]
      r.setPersonalSamples(samples)
      setState({ before, after: writer.testOdd.map((s) => r.recognize(s, z)) })
    })
    return () => {
      alive = false
    }
  }, [writer])
  const row = (label: string, list: NumeriaRecognition[] | undefined) => (
    <div className={s.demoRow}>
      <span className={s.demoLabel}>{label}</span>
      <div className={s.demoItems}>
        {(list ?? writer.testOdd.map(() => null)).map((r, i) => (
          <div key={i} className={clsx(s.case, r && (r.digit === writer.oddDigit ? s.caseOk : s.caseBad))}>
            <Preview28 image={r?.image28 ?? null} size={44} />
            <span className={s.caseDigit}>{r ? (r.digit ?? '–') : '…'}</span>
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <div className={s.demo}>
      <p className={s.demoIntro}>Si alguien escribe el 3 al revés (Ɛ), con 4 muestras de su letra el reconocedor aprende a leerlo.</p>
      {row('Sin muestras', state?.before)}
      {row('Con sus muestras', state?.after)}
    </div>
  )
}
