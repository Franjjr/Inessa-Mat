/* Celebrations: themed confetti made of stars, sparkles and coins (canvas-confetti), crisp on retina screens.
   - small   quick burst of stars after a correct answer
   - big     rainbow burst + two side cannons (activity finished, new record)
   - stars   golden stars and sparkles (stars earned)
   - crystal radial shimmer in the world's colour, then a gentle glitter rain (crystal recovered)
   - chest   the biggest: gold fountain, cannons, fireworks and a final star shower (the Gran Cofre)
   Respects prefers-reduced-motion with a soft glow + twinkle (opacity only); 'small' is skipped entirely then.
   Skips when the tab is hidden, keeps a particle budget so rapid repeats can't flood slow tablets, and removes
   its canvas when idle (no lingering full-screen layer). */
import confetti from 'canvas-confetti'
import { brandPalette, crystalPalette, goldPalette, rainbowPalette, resolveColor } from './palettes'
import s from './fx.module.css'

export type CelebrationKind = 'small' | 'big' | 'crystal' | 'stars' | 'chest'

export interface CelebrateOptions {
  colors?: string[]
  /** Normalised viewport coordinates (0..1), like canvas-confetti. */
  origin?: { x: number; y: number }
}

type Burst = { delay: number; opts: confetti.Options }

const MAX_LIVE_PARTICLES = 650
const MAX_DPR = 2

let cannon: confetti.CreateTypes | null = null
let canvas: HTMLCanvasElement | null = null
let scale = 1
let pendingFires = 0
let removeTimer: ReturnType<typeof setTimeout> | undefined
const timers = new Set<ReturnType<typeof setTimeout>>()
const live: { count: number; until: number }[] = []
let sparkleShape: confetti.Shape | null | undefined

/** 4-point sparkle ✦ as a canvas-confetti path shape (precomputed matrix: no expensive path probing). */
function sparkle(): confetti.Shape | null {
  if (sparkleShape !== undefined) return sparkleShape
  sparkleShape = typeof Path2D === 'function' && typeof DOMMatrix === 'function'
    ? ({ type: 'path', path: 'M0 -6 C0.9 -1.6 1.6 -0.9 6 0 C1.6 0.9 0.9 1.6 0 6 C-0.9 1.6 -1.6 0.9 -6 0 C-1.6 -0.9 -0.9 -1.6 0 -6 Z', matrix: [1, 0, 0, 1, 0, 0] } as unknown as confetti.Shape)
    : null
  return sparkleShape
}

function starShapes(withSparkle: boolean): confetti.Shape[] {
  const sp = withSparkle ? sparkle() : null
  return sp ? ['star', 'star', sp] : ['star']
}

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function viewport(): { w: number; h: number } {
  const w = window.innerWidth || document.documentElement.clientWidth || 1024
  const h = window.innerHeight || document.documentElement.clientHeight || 768
  return { w, h }
}

function disposeCanvas(): void {
  clearTimeout(removeTimer)
  try { cannon?.reset() } catch { /* ignore */ }
  cannon = null
  canvas?.remove()
  canvas = null
}

function ensureCannon(): confetti.CreateTypes | null {
  if (typeof document === 'undefined' || !document.body) return null
  const dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1))
  const { w, h } = viewport()
  const W = Math.round(w * dpr)
  const H = Math.round(h * dpr)
  if (cannon && canvas && canvas.isConnected && canvas.width === W && canvas.height === H && scale === dpr) {
    clearTimeout(removeTimer)
    return cannon
  }
  disposeCanvas()
  const c = document.createElement('canvas')
  c.className = s.canvas
  c.setAttribute('aria-hidden', 'true')
  c.width = W
  c.height = H
  document.body.appendChild(c)
  canvas = c
  scale = dpr
  try {
    cannon = confetti.create(c, { resize: false, useWorker: false, disableForReducedMotion: false })
  } catch {
    cannon = null
  }
  return cannon
}

function liveCount(now: number): number {
  for (let i = live.length - 1; i >= 0; i--) if (live[i].until <= now) live.splice(i, 1)
  return live.reduce((sum, e) => sum + e.count, 0)
}

function fire(opts: confetti.Options): void {
  if (typeof document !== 'undefined' && document.hidden) return
  const now = nowMs()
  const room = MAX_LIVE_PARTICLES - liveCount(now)
  const wanted = opts.particleCount ?? 50
  const count = Math.min(wanted, room)
  if (count < Math.min(6, wanted)) return
  const fn = ensureCannon()
  if (!fn) return
  const ticks = opts.ticks ?? 200
  live.push({ count, until: now + (ticks / 60) * 1000 + 300 })
  const scaled: confetti.Options = {
    ...opts,
    particleCount: count,
    scalar: (opts.scalar ?? 1) * scale,
    startVelocity: (opts.startVelocity ?? 45) * scale,
    gravity: (opts.gravity ?? 1) * scale,
    drift: (opts.drift ?? 0) * scale,
    disableForReducedMotion: false,
  }
  pendingFires += 1
  let p: Promise<unknown> | null = null
  try {
    p = fn(scaled)
  } catch {
    p = null
  }
  const done = () => {
    pendingFires = Math.max(0, pendingFires - 1)
    if (pendingFires === 0 && timers.size === 0) {
      clearTimeout(removeTimer)
      removeTimer = setTimeout(() => { if (pendingFires === 0 && timers.size === 0) disposeCanvas() }, 600)
    }
  }
  if (p && typeof p.then === 'function') p.then(done, done)
  else done()
}

function schedule(bursts: Burst[]): void {
  for (const b of bursts) {
    if (b.delay <= 0) {
      fire(b.opts)
      continue
    }
    const t = setTimeout(() => {
      timers.delete(t)
      fire(b.opts)
    }, b.delay)
    timers.add(t)
  }
}

const clampOrigin = (o: { x: number; y: number }) => ({ x: Math.min(1.2, Math.max(-0.2, o.x)), y: Math.min(1.2, Math.max(-0.2, o.y)) })

/** The burst recipes (exported for tests). Values are in CSS pixels; fire() scales them for the device. */
export function recipe(kind: CelebrationKind, opts: CelebrateOptions = {}, rng: () => number = Math.random): Burst[] {
  const o = clampOrigin(opts.origin ?? { x: 0.5, y: kind === 'small' ? 0.55 : 0.6 })
  const custom = (opts.colors ?? []).map((c) => resolveColor(c)).filter((c): c is string => !!c)
  switch (kind) {
    case 'small': {
      const colors = custom.length ? custom : brandPalette()
      return [
        { delay: 0, opts: { origin: o, particleCount: 22, spread: 70, startVelocity: 30, decay: 0.9, gravity: 0.9, ticks: 110, scalar: 0.95, shapes: ['star', 'circle'], colors } },
        { delay: 0, opts: { origin: o, particleCount: 8, spread: 360, startVelocity: 14, decay: 0.9, gravity: 0.5, ticks: 80, scalar: 0.7, shapes: starShapes(true), colors: goldPalette() } },
      ]
    }
    case 'big': {
      const colors = custom.length ? custom : [...rainbowPalette(), ...brandPalette().slice(0, 3)]
      const base = { ticks: 220, decay: 0.91, colors }
      return [
        { delay: 0, opts: { ...base, origin: o, particleCount: 80, spread: 100, startVelocity: 46, scalar: 1.1, shapes: ['star', 'circle', 'square'] } },
        { delay: 150, opts: { ...base, origin: { x: 0, y: 0.92 }, angle: 60, particleCount: 55, spread: 55, startVelocity: 62, scalar: 1, shapes: ['star', 'circle'] } },
        { delay: 150, opts: { ...base, origin: { x: 1, y: 0.92 }, angle: 120, particleCount: 55, spread: 55, startVelocity: 62, scalar: 1, shapes: ['star', 'circle'] } },
        { delay: 380, opts: { ...base, origin: o, particleCount: 24, spread: 360, startVelocity: 20, gravity: 0.6, scalar: 0.8, shapes: starShapes(true), colors: goldPalette() } },
      ]
    }
    case 'stars': {
      const colors = custom.length ? custom : goldPalette()
      return [
        { delay: 0, opts: { origin: o, particleCount: 34, spread: 120, startVelocity: 38, decay: 0.92, gravity: 0.65, ticks: 200, scalar: 1.5, shapes: ['star'], colors } },
        { delay: 180, opts: { origin: o, particleCount: 26, spread: 360, startVelocity: 18, decay: 0.92, gravity: 0.4, ticks: 160, scalar: 0.9, shapes: starShapes(true), colors: [...colors, '#ffffff'] } },
      ]
    }
    case 'crystal': {
      const colors = crystalPalette(custom.length ? custom : opts.colors)
      const shimmer = starShapes(true)
      const rain: Burst[] = [0, 1, 2].map((i) => ({
        delay: 650 + i * 260,
        opts: { origin: { x: 0.2 + rng() * 0.6, y: -0.05 }, angle: 270, particleCount: 14, spread: 70, startVelocity: 8, decay: 0.94, gravity: 0.35, drift: rng() - 0.5, ticks: 260, scalar: 0.8, shapes: shimmer, colors },
      }))
      return [
        { delay: 0, opts: { origin: o, particleCount: 70, spread: 360, startVelocity: 28, decay: 0.92, gravity: 0.35, ticks: 230, scalar: 1.15, shapes: shimmer, colors } },
        { delay: 220, opts: { origin: o, particleCount: 40, spread: 360, startVelocity: 16, decay: 0.92, gravity: 0.3, ticks: 200, scalar: 0.85, shapes: shimmer, colors } },
        ...rain,
      ]
    }
    case 'chest': {
      const gold = goldPalette()
      const rainbow = rainbowPalette()
      const colors = custom.length ? custom : rainbow
      const fireworks: Burst[] = [450, 800, 1150, 1500].map((delay, i) => ({
        delay,
        opts: { origin: { x: 0.2 + rng() * 0.6, y: 0.15 + rng() * 0.3 }, particleCount: 45, spread: 360, startVelocity: 26, decay: 0.91, gravity: 0.7, ticks: 190, scalar: 1, shapes: starShapes(true), colors: i % 2 ? gold : colors },
      }))
      return [
        { delay: 0, opts: { origin: o, particleCount: 120, spread: 110, startVelocity: 56, decay: 0.91, gravity: 1, ticks: 240, scalar: 1.25, shapes: ['circle', 'star', 'circle'], colors: gold } },
        { delay: 150, opts: { origin: { x: 0, y: 0.92 }, angle: 60, particleCount: 80, spread: 60, startVelocity: 66, decay: 0.91, ticks: 240, scalar: 1.1, shapes: ['star', 'circle', 'square'], colors } },
        { delay: 150, opts: { origin: { x: 1, y: 0.92 }, angle: 120, particleCount: 80, spread: 60, startVelocity: 66, decay: 0.91, ticks: 240, scalar: 1.1, shapes: ['star', 'circle', 'square'], colors } },
        ...fireworks,
        { delay: 1900, opts: { origin: { x: 0.1, y: -0.05 }, angle: 300, particleCount: 60, spread: 70, startVelocity: 30, decay: 0.92, gravity: 0.7, ticks: 260, scalar: 1.3, shapes: ['star'], colors: gold } },
        { delay: 1900, opts: { origin: { x: 0.9, y: -0.05 }, angle: 240, particleCount: 60, spread: 70, startVelocity: 30, decay: 0.92, gravity: 0.7, ticks: 260, scalar: 1.3, shapes: ['star'], colors: gold } },
      ]
    }
  }
}

// ---- Reduced motion: glow + twinkle --------------------------------------------------------------------

const STAR_SVG = (fill: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="M12 1.6l2.9 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.2l-6.3 3.6 1.6-7.1L1.9 8.9l7.2-.7z"/></svg>`

const GENTLE: Record<Exclude<CelebrationKind, 'small'>, { dur: number; stars: number; size: string }> = {
  big: { dur: 1300, stars: 6, size: 'min(70vmin, 620px)' },
  stars: { dur: 1300, stars: 7, size: 'min(60vmin, 520px)' },
  crystal: { dur: 1600, stars: 8, size: 'min(75vmin, 680px)' },
  chest: { dur: 2000, stars: 12, size: 'min(95vmin, 880px)' },
}

function withAlpha(hex: string, a: number): string {
  const h = hex.slice(1)
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`
}

function gentle(kind: CelebrationKind, opts: CelebrateOptions): void {
  if (kind === 'small' || typeof document === 'undefined' || !document.body) return
  const cfg = GENTLE[kind]
  const o = clampOrigin(opts.origin ?? { x: 0.5, y: 0.5 })
  const custom = (opts.colors ?? []).map((c) => resolveColor(c)).filter((c): c is string => !!c)
  const palette = kind === 'crystal' ? crystalPalette(custom.length ? custom : opts.colors) : kind === 'stars' || kind === 'chest' ? goldPalette() : custom.length ? custom : rainbowPalette()
  const root = document.createElement('div')
  root.className = s.gentle
  root.setAttribute('aria-hidden', 'true')
  root.dataset.fx = kind
  root.style.setProperty('--fx-x', `${o.x * 100}%`)
  root.style.setProperty('--fx-y', `${o.y * 100}%`)
  root.style.setProperty('--fx-dur', `${cfg.dur}ms`)
  root.style.setProperty('--fx-size', cfg.size)
  root.style.setProperty('--fx-c1', withAlpha('#ffffff', 0.5))
  root.style.setProperty('--fx-c2', withAlpha(palette[1] ?? palette[0], 0.42))
  root.style.setProperty('--fx-c3', withAlpha(palette[0], 0.16))
  const glow = document.createElement('div')
  glow.className = s.glow
  root.appendChild(glow)
  for (let i = 0; i < cfg.stars; i++) {
    const a = (i / cfg.stars) * Math.PI * 2 + 0.4
    const r = 70 + (i % 3) * 55
    const star = document.createElement('div')
    star.className = s.star
    star.style.setProperty('--dx', `${Math.round(Math.cos(a) * r * 1.3)}px`)
    star.style.setProperty('--dy', `${Math.round(Math.sin(a) * r)}px`)
    star.style.setProperty('--sz', `${18 + (i % 3) * 8}px`)
    star.style.setProperty('--delay', `${(i % 4) * 110}ms`)
    star.innerHTML = STAR_SVG(palette[i % palette.length])
    root.appendChild(star)
  }
  document.body.appendChild(root)
  const t = setTimeout(() => {
    timers.delete(t)
    root.remove()
  }, cfg.dur + 300)
  timers.add(t)
}

// ---- Public -----------------------------------------------------------------------------------------------

/** Fire a themed celebration (confetti/stars). Respects prefers-reduced-motion. */
export function celebrate(kind: CelebrationKind, opts?: { colors?: string[]; origin?: { x: number; y: number } }): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (document.hidden) return
  try {
    if (prefersReducedMotion()) gentle(kind, opts ?? {})
    else schedule(recipe(kind, opts ?? {}))
  } catch {
    /* celebrations are decoration: never break the screen that asked for one */
  }
}

/** Dev gallery: preview the reduced-motion version regardless of the OS setting. */
export function previewGentle(kind: CelebrationKind, opts?: CelebrateOptions): void {
  gentle(kind, opts ?? {})
}

/** Extra: stop every celebration immediately (e.g. when leaving a screen). */
export function stopCelebrations(): void {
  for (const t of timers) clearTimeout(t)
  timers.clear()
  live.length = 0
  pendingFires = 0
  disposeCanvas()
  if (typeof document !== 'undefined') document.querySelectorAll(`.${s.gentle}`).forEach((n) => n.remove())
}
