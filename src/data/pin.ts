/* Adult gate PIN: a salted hash kept in the meta table of this device. When the adult is signed in, the same record is
   also kept on the account, so every device of that account asks for the PIN made once. Without an account the PIN
   stays on the device.
   Account copy: the record (PBKDF2 hash and salt, never the PIN) lives in the signed-in user's user_metadata under
   `adult_pin`, so it travels in the access token. That is deliberate for now (no migration). A clear is kept on the
   account as a tombstone `{ cleared: true, at }`, so a stale device cannot bring an old PIN back.
   Ownership: a record made while signed in is tagged with that user's id (`ownerId`) on this device. Only the owner's
   record is ever sent to that account; a record made while signed out, or under another account, stays on the device.
   It keeps children out of adult screens; it is not an account password, and anyone with the device and its site data
   can clear it.
   Formats:
   - v2 (current): PBKDF2-HMAC-SHA256 with 600 000 iterations via WebCrypto, 16-byte random salt.
   - v1 (legacy): salted, iterated SHA-256 written by hand (1 024 rounds). Still verified; rewritten as v2 on success. */
import { DataError } from './errors'
import { META, deleteMeta, getMeta, setMeta } from './meta'
import { fromBase64, sha256, toBase64, toHex } from './sha256'
import { getAuth } from './store'
import { getSupabase } from './supabase'
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

/** A PIN record as stored on this device. `ownerId` is absent when it was made while signed out. */
type LocalPin = PinRecord & { ownerId?: string }

/** A clear made on this device that the account may not have confirmed yet. */
interface LocalClear {
  cleared: true
  at: string
  ownerId?: string
}

/** What the account holds: a PIN record, a tombstone, or nothing. */
type Remote =
  | { kind: 'unreachable' }
  | { kind: 'empty' }
  | { kind: 'pin'; rec: PinRecord }
  | { kind: 'cleared'; at: string }

const LEGACY_ITERATIONS = 1024
/** OWASP (2023) minimum for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 600_000
/** Key of the PIN record in the signed-in user's auth metadata. */
const ACCOUNT_KEY = 'adult_pin'
const ACCOUNT_TIMEOUT_MS = 2500
let accountTimeoutMs = ACCOUNT_TIMEOUT_MS

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

// ------------------------------------------------------------------------------------------------ helpers

function isPinRecord(x: unknown): x is PinRecord {
  const r = x as Partial<PinRecord> | null | undefined
  return Boolean(r && (r.v === 1 || r.v === 2) && typeof r.hash === 'string' && typeof r.salt === 'string' && typeof r.iterations === 'number')
}

function isLocalClear(x: unknown): x is LocalClear {
  const c = x as Partial<LocalClear> | null | undefined
  return Boolean(c && c.cleared === true && typeof c.at === 'string')
}

function publicRecord(rec: LocalPin): PinRecord {
  const pub: LocalPin = { ...rec }
  delete pub.ownerId
  return pub
}

function sameRecord(a: PinRecord, b: PinRecord): boolean {
  return a.hash === b.hash && a.salt === b.salt
}

/** True only when both times parse and `a` is strictly later. Ties and unreadable dates leave the account in charge. */
function isLater(a: string, b: string): boolean {
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  return Number.isFinite(ta) && Number.isFinite(tb) && ta > tb
}

function parseRemote(v: unknown): Remote {
  if (isPinRecord(v)) return { kind: 'pin', rec: v }
  const t = v as { cleared?: unknown; at?: unknown } | null | undefined
  if (t && t.cleared === true && typeof t.at === 'string') return { kind: 'cleared', at: t.at }
  return { kind: 'empty' }
}

function signedInId(): string | null {
  const a = getAuth()
  return a.status === 'signed-in' && a.user ? a.user.id : null
}

function warn(what: string, e?: unknown): void {
  // Never the PIN, hash or salt: only the kind of failure.
  const kind = e && typeof e === 'object' && typeof (e as { status?: unknown }).status === 'number'
    ? `status ${(e as { status: number }).status}`
    : e instanceof Error ? e.name : 'no detail'
  console.warn(`[numeria/pin] ${what} (${kind})`)
}

/** Test hook: the account read/write timeout. `null` restores the default. */
export function __setAccountTimeoutForTests(ms: number | null): void {
  accountTimeoutMs = ms ?? ACCOUNT_TIMEOUT_MS
}

const TIMED_OUT = Symbol('timed-out')

/** The promise keeps running in the background; the caller just stops waiting for it. */
function withTimeout<T>(p: Promise<T>): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), accountTimeoutMs)
  })
  return Promise.race([p, late]).finally(() => clearTimeout(timer))
}

/** The account's copy as read during this session (per signed-in user). Refreshed by every successful read or write. */
let accountCache: { userId: string; remote: Remote } | null = null

async function fetchAccount(userId: string): Promise<Remote> {
  try {
    const sb = await getSupabase()
    if (!sb) return { kind: 'unreachable' }
    const { data, error } = await sb.auth.getUser()
    if (error || !data.user) {
      warn('could not read the account PIN', error)
      return { kind: 'unreachable' }
    }
    const remote = parseRemote(data.user.user_metadata?.[ACCOUNT_KEY])
    accountCache = { userId, remote }
    return remote
  } catch (e) {
    warn('could not read the account PIN', e)
    return { kind: 'unreachable' }
  }
}

/** Reads the account's copy, waiting at most the account timeout. On timeout, falls back to this session's copy. */
async function readAccount(userId: string): Promise<Remote> {
  const r = await withTimeout(fetchAccount(userId))
  if (r !== TIMED_OUT) return r
  warn('the account PIN read timed out; using this session copy')
  return accountCache?.userId === userId ? accountCache.remote : { kind: 'unreachable' }
}

/** Best effort: false when the server did not take the write. The local copy stays, and the next account load retries. */
async function writeAccount(userId: string, value: Exclude<Remote, { kind: 'unreachable' } | { kind: 'empty' }>): Promise<boolean> {
  const payload = value.kind === 'pin' ? publicRecord(value.rec as LocalPin) : { cleared: true, at: value.at }
  const ok = await withTimeout(
    (async () => {
      try {
        const sb = await getSupabase()
        if (!sb) return false
        const { error } = await sb.auth.updateUser({ data: { [ACCOUNT_KEY]: payload } })
        if (error) warn('could not save the account PIN', error)
        return !error
      } catch (e) {
        warn('could not save the account PIN', e)
        return false
      }
    })(),
  )
  const saved = ok === true
  if (saved) accountCache = { userId, remote: value }
  else if (ok === TIMED_OUT) warn('the account PIN save timed out; it will be retried on the next account load')
  return saved
}

async function readLocal(): Promise<LocalPin | LocalClear | undefined> {
  const raw = await getMeta<unknown>(META.adultPin)
  if (isLocalClear(raw)) return raw
  return isPinRecord(raw) ? (raw as LocalPin) : undefined
}

// ------------------------------------------------------------------------------------------------ resolution

/** Takes the account's PIN onto this device, tagged with the account. */
async function adopt(rec: PinRecord, ownerId: string): Promise<LocalPin> {
  const stored: LocalPin = { ...publicRecord(rec as LocalPin), ownerId }
  await setMeta(META.adultPin, stored)
  return stored
}

/** Makes this device and the signed-in account agree. Returns the record to use here (undefined: no PIN).
    - Signed out, or the account cannot be reached now: this device's record is used as it is.
    - A record of this account on this device: the newer of the two wins (the account's on a tie or unreadable dates).
      A newer local record, or a clear made here, is sent to the account.
    - A record made while signed out or under another account: never sent. The account's PIN is adopted if it has one;
      otherwise the device keeps its own record and the account stays empty. */
async function resolveAdultPin(): Promise<LocalPin | undefined> {
  const local = await readLocal()
  const owner = signedInId()
  const localPin = isPinRecord(local) ? (local as LocalPin) : undefined
  if (!owner) return localPin

  const remote = await readAccount(owner)
  if (remote.kind === 'unreachable') return localPin

  const mine = local !== undefined && local.ownerId === owner
  if (!mine) {
    if (remote.kind === 'pin') return adopt(remote.rec, owner)
    return localPin
  }

  if (!local) {
    if (remote.kind === 'pin') return adopt(remote.rec, owner)
    return undefined
  }

  const localAt = isLocalClear(local) ? local.at : localPin!.createdAt
  const remoteAt = remote.kind === 'pin' ? remote.rec.createdAt : remote.kind === 'cleared' ? remote.at : null
  if (remoteAt === null || isLater(localAt, remoteAt)) {
    if (isLocalClear(local)) {
      if (await writeAccount(owner, { kind: 'cleared', at: local.at })) await deleteMeta(META.adultPin)
      return undefined
    }
    await writeAccount(owner, { kind: 'pin', rec: localPin! })
    return localPin
  }

  if (remote.kind === 'pin') {
    if (localPin && sameRecord(localPin, remote.rec)) return localPin
    return adopt(remote.rec, owner)
  }
  await deleteMeta(META.adultPin)
  return undefined
}

/** Called when the account is loaded (sign-in or start-up): sends unsaved local changes and takes the account's PIN. */
export async function reconcileAdultPin(): Promise<void> {
  try {
    await resolveAdultPin()
  } catch (e) {
    warn('the PIN check after sign-in failed', e)
  }
}

export async function hasAdultPin(): Promise<boolean> {
  return Boolean(await resolveAdultPin())
}

/** 4–8 digits. */
export async function setAdultPin(pin: string): Promise<void> {
  const p = String(pin ?? '').trim()
  if (!/^\d{4,8}$/.test(p)) throw new DataError('invalid', 'El PIN debe tener entre 4 y 8 números.')
  const rec = await buildRecord(p)
  const owner = signedInId()
  await setMeta(META.adultPin, owner ? { ...rec, ownerId: owner } : rec)
  if (owner) await writeAccount(owner, { kind: 'pin', rec })
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
    // Upgrade to v2 on the first correct PIN, keeping the record's owner. Best effort: without WebCrypto the legacy record stays.
    await upgradeLegacy(p, rec.ownerId).catch(() => undefined)
  }
  return ok
}

async function upgradeLegacy(pin: string, ownerId: string | undefined): Promise<void> {
  const rec = await buildRecord(pin)
  await setMeta(META.adultPin, ownerId ? { ...rec, ownerId } : rec)
  if (ownerId && ownerId === signedInId()) await writeAccount(ownerId, { kind: 'pin', rec })
}

/** Remove the PIN (e.g. after the adult re-authenticated with their account password). On an account, the clear is
    kept as a tombstone so no other device brings the old PIN back. */
export async function clearAdultPin(): Promise<void> {
  const owner = signedInId()
  const local = await readLocal()
  if (!owner || (local && local.ownerId !== owner)) {
    await deleteMeta(META.adultPin)
    return
  }
  const at = new Date().toISOString()
  const marker: LocalClear = { cleared: true, at, ownerId: owner }
  await setMeta(META.adultPin, marker)
  if (await writeAccount(owner, { kind: 'cleared', at })) await deleteMeta(META.adultPin)
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
