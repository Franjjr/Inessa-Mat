/* Colour helpers for the world art.
   - Art files use literal hex colours; `fogTint` maps any hex toward Borrón's drained grey (vividness 0..1).
   - `resolveHex` understands hex values and the design-token variables (var(--w1) …) that content passes as world
     colours, so UI art (crystals, node icons) can derive light/dark facets in JS. Unknown colours fall back to
     CSS color-mix() strings (see `derive`). */

export type Rgb = [number, number, number]

/** Hex values of the tokens in src/styles/tokens.css that are commonly passed as colours to the art. */
export const TOKEN_HEX: Readonly<Record<string, string>> = {
  '--w1': '#15803d', '--w1-soft': '#dcfce7',
  '--w2': '#2563eb', '--w2-soft': '#dbeafe',
  '--w3': '#dc2626', '--w3-soft': '#fee2e2',
  '--w4': '#0e7490', '--w4-soft': '#cffafe',
  '--w5': '#7c3aed', '--w5-soft': '#ede9fe',
  '--w6': '#c026d3', '--w6-soft': '#fae8ff',
  '--w7': '#ea580c', '--w7-soft': '#ffedd5',
  '--w8': '#a16207', '--w8-soft': '#fef9c3',
  '--c-primary': '#7c3aed', '--c-primary-strong': '#6d28d9', '--c-primary-soft': '#ede9fe',
  '--c-magic': '#c026d3', '--c-magic-soft': '#fae8ff',
  '--c-gold': '#f59e0b', '--c-gold-soft': '#fef3c7',
  '--c-success': '#16a34a', '--c-warn': '#ea580c', '--c-error': '#e11d48',
  '--c-ink': '#2e1a47', '--c-ink-soft': '#5b4a75', '--c-ink-mute': '#8b7aa8',
  '--pv-u': '#3b82f6', '--pv-d': '#ec4899', '--pv-c': '#22c55e', '--pv-um': '#f59e0b',
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function hexToRgb(hex: string): Rgb | null {
  const m = HEX_RE.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const clamp255 = (x: number) => Math.max(0, Math.min(255, Math.round(x)))

export function rgbToHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((x) => clamp255(x).toString(16).padStart(2, '0')).join('')
}

/** Linear sRGB mix: t = 0 → a, t = 1 → b. Non-hex inputs return `a` unchanged. */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  if (!x || !y) return a
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t])
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0)
  else if (max === G) h = (B - R) / d + 2
  else h = (R - G) / d + 4
  return [h / 6, s, l]
}

function hslToRgb([h, s, l]: [number, number, number]): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255]
}

const PLUM = '#4c1d95'

/** Outline colour: a darker, slightly richer shade of the fill, nudged toward Lumi's plum ink for cohesion. */
export function shade(hex: string, amount = 0.34): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [h, s, l] = rgbToHsl(rgb)
  const darker = rgbToHex(hslToRgb([h, Math.min(1, s * 1.08 + 0.04), l * (1 - amount)]))
  return mix(darker, PLUM, 0.16)
}

/** Lighter tint toward white (amount 0..1). */
export function light(hex: string, amount = 0.5): string {
  return mix(hex, '#ffffff', amount)
}

/** Relative luminance-ish grey value (0..255). */
function grey([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The colour `hex` would have under Borrón's fog. v = 1 → unchanged, v = 0 → soft cool grey, lifted. */
export function fogTint(hex: string, v: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  if (v >= 1) return rgbToHex(rgb)
  const y = grey(rgb) * 0.8 + 0.2 * 204
  const fog: Rgb = [y - 4, y - 2, y + 7]
  const t = Math.max(0, v)
  return rgbToHex([fog[0] + (rgb[0] - fog[0]) * t, fog[1] + (rgb[1] - fog[1]) * t, fog[2] + (rgb[2] - fog[2]) * t])
}

export type Tint = (hex: string) => string

const tintCache = new Map<number, Tint>()

/** Memoised tinter for a vividness value (quantised to 1/100 so the caches stay small). */
export function makeTint(vividness: number): Tint {
  const q = Math.round(Math.max(0, Math.min(1, vividness)) * 100)
  const hit = tintCache.get(q)
  if (hit) return hit
  const v = q / 100
  const memo = new Map<string, string>()
  const t: Tint = q === 100
    ? (hex) => hex
    : (hex) => {
        let out = memo.get(hex)
        if (out === undefined) {
          out = fogTint(hex, v)
          memo.set(hex, out)
        }
        return out
      }
  tintCache.set(q, t)
  return t
}

/** Hex for a hex colour or a known design-token var(); null when it cannot be resolved in JS. */
export function resolveHex(color?: string | null): string | null {
  if (!color) return null
  const c = color.trim()
  const rgb = hexToRgb(c)
  if (rgb) return rgbToHex(rgb)
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(c)
  if (m) return TOKEN_HEX[m[1]] ?? (m[2] ? resolveHex(m[2]) : null)
  return null
}

export interface DerivedColors {
  base: string
  /** Very light (≈ 80% white) */
  pale: string
  /** Light (≈ 45% white) */
  soft: string
  /** Darker outline shade */
  dark: string
  /** Deep shadow */
  deep: string
}

/** Facet colours from one base colour (hex, token var, or any CSS colour via color-mix). */
export function derive(color: string): DerivedColors {
  const hex = resolveHex(color)
  if (hex) {
    return { base: hex, pale: light(hex, 0.8), soft: light(hex, 0.45), dark: shade(hex, 0.3), deep: shade(hex, 0.5) }
  }
  const cm = (other: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, ${other})`
  return { base: color, pale: cm('white', 20), soft: cm('white', 55), dark: cm('#2e1065', 68), deep: cm('#2e1065', 45) }
}
