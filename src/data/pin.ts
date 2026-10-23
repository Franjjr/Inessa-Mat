/* Adult gate PIN, stored on this device only as a salted hash in the meta table. It keeps children out of adult
   screens; it is not an account password, and anyone with the device and its site data can clear it.
   Formats:
   - v2 (current): PBKDF2-HMAC-SHA256 with 600 000 iterations via WebCrypto, 16-byte random salt.
   - v1 (legacy): salted, iterated SHA-256 written by hand (1 024 rounds). Still verified; rewritten as v2 on success. */
import { DataError } from './errors'
import { META, deleteMeta, getMeta, setMeta } from './meta'
import { fromBase64, sha256, toBase64, toHex } from './sha256'
import { randomBytes } from './util'

interface PinRecordV1 {
  v: 1
  salt: string // base64, 16 bytes
  hash: string // hex
  iterations: number
  createdAt: string
}

interface PinRecordV2 {
  v: 2
  kdf: 'pbkdf2-sha256'
  salt: string // base64, 16 bytes
  hash: string // hex, 32 bytes
  iterations: number
  createdAt: string
}

type PinRecord = PinRecordV1 | PinRecordV2

const LEGACY_ITERATIONS = 1024
/** OWASP (2023) minimum for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 600_000

/** Failed-attempt counter and lock, mirrored from localStorage into IndexedDB so that clearing only one of them
    does not reset the limit. */
export interface AdultGateLock {
  failures: number
  lockedUntil: number
}

async function deriveLegacy(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const enc = new TextEncoder()
  let block = new Uint8Array([...salt, ...enc.encode(pin)])
  for (let i = 0; i < iterations; i++) {
    const digest = await sha256(block)
    block = new Uint8Array(digest.length + salt.length)
    block.set(digest)
    block.set(salt, digest.length)
  }
  return toHex(block.subarray(0, 32))
}

async function derivePbkdf2(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle
  if (!subtle) throw new DataError('unknown', 'Este navegador no puede guardar el PIN de forma segura. Abre la app con HTTPS.')
  const key = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  // Copy the salt into a fresh buffer: BufferSource typing rejects views over shared or resizable memory.
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations }, key, 256)
  return toHex(new Uint8Array(bits))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function writePin(pin: string): Promise<void> {
  const salt = randomBytes(16)
  const rec: PinRecordV2 = {
    v: 2,
    kdf: 'pbkdf2-sha256',
    salt: toBase64(salt),
    hash: await derivePbkdf2(pin, salt, PBKDF2_ITERATIONS),
    iterations: PBKDF2_ITERATIONS,
    createdAt: new Date().toISOString(),
  }
  await setMeta(META.adultPin, rec)
}

export async function hasAdultPin(): Promise<boolean> {
  const rec = await getMeta<PinRecord>(META.adultPin)
  return Boolean(rec?.hash)
}

/** 4–8 digits. */
export async function setAdultPin(pin: string): Promise<void> {
  const p = String(pin ?? '').trim()
  if (!/^\d{4,8}$/.test(p)) throw new DataError('invalid', 'El PIN debe tener entre 4 y 8 números.')
  await writePin(p)
}

/** false when no PIN is set (check hasAdultPin first to offer creating one). */
export async function verifyAdultPin(pin: string): Promise<boolean> {
  const rec = await getMeta<PinRecord>(META.adultPin)
  if (!rec?.hash) return false
  const p = String(pin ?? '').trim()
  if (!/^\d{1,8}$/.test(p)) return false
  const salt = fromBase64(rec.salt)
  if (rec.v === 2) {
    return timingSafeEqual(await derivePbkdf2(p, salt, rec.iterations), rec.hash)
  }
  const ok = timingSafeEqual(await deriveLegacy(p, salt, rec.iterations || LEGACY_ITERATIONS), rec.hash)
  if (ok) {
    // Upgrade to v2 on the first correct PIN. Best effort: without WebCrypto the legacy record stays.
    await writePin(p).catch(() => undefined)
  }
  return ok
}

/** Remove the PIN (e.g. after the adult re-authenticated with their account password). */
export async function clearAdultPin(): Promise<void> {
  await deleteMeta(META.adultPin)
}

/** The gate's failure counter and lock, as last saved in IndexedDB (null when none). */
export async function readAdultGateLock(): Promise<AdultGateLock | null> {
  return (await getMeta<AdultGateLock>(META.adultGateLock)) ?? null
}

/** Saves the gate's failure counter and lock; a cleared state removes the row. */
export async function writeAdultGateLock(state: AdultGateLock): Promise<void> {
  if (state.failures === 0 && state.lockedUntil === 0) await deleteMeta(META.adultGateLock)
  else await setMeta(META.adultGateLock, state)
}
