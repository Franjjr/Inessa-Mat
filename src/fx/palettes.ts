/* Celebration palettes derived from the design tokens (src/styles/tokens.css), resolved at runtime so the
   confetti always matches the app. canvas-confetti only understands hex, so everything is normalised to #rrggbb.
   Literal hex values below are only fallbacks for when the tokens are not available (tests, SSR). */

const FALLBACK: Record<string, string> = {
  '--c-primary': '#7c3aed', '--c-magic': '#c026d3', '--c-gold': '#f59e0b', '--c-success': '#16a34a',
  '--pv-u': '#3b82f6', '--pv-d': '#ec4899', '--pv-c': '#22c55e', '--pv-um': '#f59e0b',
  '--w1': '#15803d', '--w2': '#2563eb', '--w3': '#dc2626', '--w4': '#0e7490',
  '--w5': '#7c3aed', '--w6': '#c026d3', '--w7': '#ea580c', '--w8': '#a16207',
}

const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

function toHex2(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`
}

function cssVar(name: string): string {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return ''
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  } catch {
    return ''
  }
}

let probe: CanvasRenderingContext2D | null | undefined

/** Browser colour parser for named/hsl colours (skipped under jsdom, which has no canvas). */
function viaCanvas(color: string): string | null {
  if (typeof document === 'undefined') return null
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return null
  if (probe === undefined) {
    try { probe = document.createElement('canvas').getContext('2d') } catch { probe = null }
  }
  if (!probe) return null
  probe.fillStyle = '#000000'
  probe.fillStyle = color
  const out = String(probe.fillStyle)
  if (HEX_RE.test(out)) return out.toLowerCase()
  return parseRgb(out)
}

function parseRgb(s: string): string | null {
  const m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  return m ? rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])) : null
}

/** Normalise '#abc', '#aabbcc', 'rgb()', 'var(--w2)', '--w2' or a named colour to '#rrggbb'. */
export function resolveColor(input: string, depth = 0): string | null {
  const c = (input || '').trim()
  if (!c || depth > 4) return null
  const v = c.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/)
  if (v || c.startsWith('--')) {
    const name = v ? v[1] : c
    const val = cssVar(name)
    return (val && resolveColor(val, depth + 1)) || (v?.[2] ? resolveColor(v[2], depth + 1) : null) || FALLBACK[name] || null
  }
  if (HEX_RE.test(c)) {
    let h = c.slice(1)
    if (h.length <= 4) h = [...h.slice(0, 3)].map((x) => x + x).join('')
    return `#${h.slice(0, 6).toLowerCase()}`
  }
  return parseRgb(c) ?? viaCanvas(c)
}

function rgb(hex: string): [number, number, number] {
  const h = hex.slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Mix two hex colours (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a)
  const [r2, g2, b2] = rgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t)
export const darken = (hex: string, t: number) => mix(hex, '#000000', t)

function token(name: string): string {
  return resolveColor(`var(${name})`) ?? FALLBACK[name]
}

/** Everyday sparkle: the brand's purple, magenta, gold and place-value colours, softened. */
export function brandPalette(): string[] {
  const gold = token('--c-gold')
  return [
    lighten(token('--c-primary'), 0.25), lighten(token('--c-magic'), 0.2), gold, lighten(token('--pv-u'), 0.15),
    lighten(token('--pv-c'), 0.1), lighten(token('--pv-d'), 0.15), lighten(gold, 0.45),
  ]
}

/** Lumi's pastel rainbow mane (7 colours). */
export function rainbowPalette(): string[] {
  return ['--w3', '--w7', '--c-gold', '--w1', '--w2', '--w5', '--w6'].map((n) => lighten(token(n), 0.32))
}

export function goldPalette(): string[] {
  const gold = token('--c-gold')
  return [gold, lighten(gold, 0.3), lighten(gold, 0.55), lighten(gold, 0.82), darken(gold, 0.08)]
}

/** A crystal's shimmer: the world colour, its tints, near-white glints and a touch of gold. */
export function crystalPalette(colors?: string[]): string[] {
  const resolved = (colors ?? []).map((c) => resolveColor(c)).filter((c): c is string => !!c)
  if (resolved.length === 0) return [...rainbowPalette(), '#ffffff']
  const base = resolved[0]
  return [...resolved, lighten(base, 0.3), lighten(base, 0.55), lighten(base, 0.82), lighten(token('--c-gold'), 0.5)]
}
