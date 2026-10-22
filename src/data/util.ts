/* Small pure helpers: ids, timestamps, stable JSON. */
import type { ISODate } from '@/types'

/** RFC 4122 v4 UUID. crypto.randomUUID is missing on older iPadOS Safari and on plain-http LAN dev URLs. */
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      /* insecure context: fall through */
    }
  }
  const bytes = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes)
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n)
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes)
  else for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256)
  return bytes
}

export function nowIso(): ISODate {
  return new Date().toISOString()
}

/** A timestamp strictly greater than `prev` (and >= now): keeps last-writer-wins ordering per row even when
 *  two edits happen in the same millisecond or the clock jumped back. */
export function nextTimestamp(prev?: string | null): ISODate {
  const now = Date.now()
  const p = prev ? Date.parse(prev) : NaN
  return new Date(Number.isFinite(p) && p >= now ? p + 1 : now).toISOString()
}

/** Normalises any timestamp (e.g. Postgres '2026-01-01T10:00:00.123+00:00') to ISO-8601 UTC 'Z', or null. */
export function toIso(v: unknown): ISODate | null {
  if (v === null || v === undefined || v === '') return null
  const t = typeof v === 'number' ? v : Date.parse(String(v))
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

export function isAfter(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = a ? Date.parse(a) : -Infinity
  const tb = b ? Date.parse(b) : -Infinity
  return ta > tb
}

/** JSON with sorted object keys and undefined properties dropped: equal values → equal strings. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value))
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      const x = (v as Record<string, unknown>)[k]
      if (x !== undefined) out[k] = sortKeys(x)
    }
    return out
  }
  return v
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

/** YYYY-MM-DD in the device's local time zone. */
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
