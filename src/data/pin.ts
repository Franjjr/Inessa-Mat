/* Adult gate PIN: a salted hash, kept in the meta table of this device. When the adult is signed in, the same record
   is also kept in the account's user metadata (key `adult_pin`), so every device of that account asks for the same
   PIN. Without an account the PIN stays on the device. It keeps children out of adult screens; it is not an account
   password, and anyone with the device and its site data can clear it.
   Formats:
   - v2 (current): PBKDF2-HMAC-SHA256 with 600 000 iterations via WebCrypto, 16-byte random salt.
   - v1 (legacy): salted, iterated SHA-256 written by hand (1 024 rounds). Still verified; rewritten as v2 on success. */
import { DataError } from './errors'
import { META, deleteMeta, getMeta, setMeta } from './meta'
import { fromBase64, sha256, toBase64, toHex } from './sha256'
import { getSupabase } from './supabase'
import { getAuth } from './store'
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

/** Key of the PIN record in the signed-in user's auth metadata. */
const ACCOUNT_KEY = 'adult_pin'

function isPinRecord(x: unknown): x is PinRecord {
  const r = x as Partial<PinRecord> | null | undefined
  return Boolean(r && (r.v === 1 || r.v === 2) && typeof r.hash === 'string' && typeof r.salt === 'string' && typeof r.iterations === 'number')
}

async function buildRecord(pin: string): Promise<PinRecordV2> {
  const salt = randomBytes(16)
  return {
    v: 2,
    kdf: 'pbkdf2-sha256',
    salt: toBase64(salt),
    hash: await derivePbkdf2(pin, salt, PBKDF2_ITERATIONS),
    iterations: PBKDF2_ITERATIONS,
    createdAt: new Date().toISOString(),
  }
}

/** undefined: the account cannot be read now (no account, offline, server error). null: the account has no PIN. */
async function readAccountRecord(): Promise<PinRecord | null | undefined> {
  const a = getAuth()
  if (a.status !== 'signed-in' || !a.user) return undefined
  try {
    const sb = await getSupabase()
    if (!sb) return undefined
    const { data, error } = await sb.auth.getUser()
    if (error || !data.user) return undefined
    const rec: unknown = data.user.user_metadata?.[ACCOUNT_KEY]
    return isPinRecord(rec) ? rec : null
  } catch {
    return undefined
  }
}

/** Best effort: false when there is no account or the server did not take the write. The local copy stays either way. */
async function writeAccountRecord(rec: PinRecord | null): Promise<boolean> {
  const a = getAuth()
  if (a.status !== 'signed-in' || !a.user) return false
  try {
    const sb = await getSupabase()
    if (!sb) return false
    const { error } = await sb.auth.updateUser({ data: { [ACCOUNT_KEY]: rec } })
    return !error
  } catch {
    return false
  }
}

async function readLocalRecord(): Promise<PinRecord | undefined> {
  const rec = await getMeta<unknown>(META.adultPin)
  return isPinRecord(rec) ? rec : undefined
}

function sameRecord(a: PinRecord, b: PinRecord): boolean {
  return a.hash === b.hash && a.salt === b.salt
}

/** True only when both creation times parse and a is the later one. */
function isNewer(a: PinRecord, b: PinRecord): boolean {
  const ta = Date.parse(a.createdAt)
  const tb = Date.parse(b.createdAt)
  return Number.isFinite(ta) && Number.isFinite(tb) && ta > tb
}

/** The record this device should use. With an account: a PIN made on another device is copied here; when both
    sides hold different PINs, the newer one wins (the account's on a tie) and is written to both. */
async function resolveAdultPin(): Promise<PinRecord | undefined> {
  const local = await readLocalRecord()
  const remote = await readAccountRecord()
  if (remote === undefined) return local
  if (remote === null) {
    if (local) await writeAccountRecord(local)
    return local
  }
  if (local && sameRecord(local, remote)) return local
  if (local && isNewer(local, remote)) {
    await writeAccountRecord(local)
    return local
  }
  await setMeta(META.adultPin, remote)
  return remote
}

/** Stores a new record here and, when signed in, on the account. */
async function storeRecord(rec: PinRecordV2): Promise<void> {
  await setMeta(META.adultPin, rec)
  await writeAccountRecord(rec)
}

/** Called when the account is loaded (sign-in or start-up): pushes a PIN that could not be saved to the account before. */
export async function reconcileAdultPin(): Promise<void> {
  await resolveAdultPin()
}

export async function hasAdultPin(): Promise<boolean> {
  return Boolean(await resolveAdultPin())
}

/** 4–8 digits. */
export async function setAdultPin(pin: string): Promise<void> {
  const p = String(pin ?? '').trim()
  if (!/^\d{4,8}$/.test(p)) throw new DataError('invalid', 'El PIN debe tener entre 4 y 8 números.')
  await storeRecord(await buildRecord(p))
}

/** false when no PIN is set (check hasAdultPin first to offer creating one). */
export async function verifyAdultPin(pin: string): Promise<boolean> {
  const rec = await resolveAdultPin()
  if (!rec) return false
  const p = String(pin ?? '').trim()
  if (!/^\d{1,8}$/.test(p)) return false
  const salt = fromBase64(rec.salt)
  if (rec.v === 2) {
    return timingSafeEqual(await derivePbkdf2(p, salt, rec.iterations), rec.hash)
  }
  const ok = timingSafeEqual(await deriveLegacy(p, salt, rec.iterations || LEGACY_ITERATIONS), rec.hash)
  if (ok) {
    // Upgrade to v2 on the first correct PIN. Best effort: without WebCrypto the legacy record stays.
    await storeRecord(await buildRecord(p)).catch(() => undefined)
  }
  return ok
}

/** Remove the PIN (e.g. after the adult re-authenticated with their account password). */
export async function clearAdultPin(): Promise<void> {
  await deleteMeta(META.adultPin)
  await writeAccountRecord(null)
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
