/* Adult gate PIN, stored on this device only as a salted, iterated SHA-256 hash in the meta table.
   It keeps children out of adult screens; it is not an account password. */
import { DataError } from './errors'
import { META, deleteMeta, getMeta, setMeta } from './meta'
import { fromBase64, sha256, toBase64, toHex } from './sha256'
import { randomBytes } from './util'

interface PinRecord {
  v: 1
  salt: string // base64, 16 bytes
  hash: string // hex
  iterations: number
  createdAt: string
}

const ITERATIONS = 1024

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function hasAdultPin(): Promise<boolean> {
  const rec = await getMeta<PinRecord>(META.adultPin)
  return Boolean(rec?.hash)
}

/** 4–8 digits. */
export async function setAdultPin(pin: string): Promise<void> {
  const p = String(pin ?? '').trim()
  if (!/^\d{4,8}$/.test(p)) throw new DataError('invalid', 'El PIN debe tener entre 4 y 8 números.')
  const salt = randomBytes(16)
  const rec: PinRecord = { v: 1, salt: toBase64(salt), hash: await derive(p, salt, ITERATIONS), iterations: ITERATIONS, createdAt: new Date().toISOString() }
  await setMeta(META.adultPin, rec)
}

/** false when no PIN is set (check hasAdultPin first to offer creating one). */
export async function verifyAdultPin(pin: string): Promise<boolean> {
  const rec = await getMeta<PinRecord>(META.adultPin)
  if (!rec?.hash) return false
  const p = String(pin ?? '').trim()
  if (!/^\d{1,8}$/.test(p)) return false
  const hash = await derive(p, fromBase64(rec.salt), rec.iterations || ITERATIONS)
  return timingSafeEqual(hash, rec.hash)
}

/** Remove the PIN (e.g. after the adult re-authenticated with their account password). */
export async function clearAdultPin(): Promise<void> {
  await deleteMeta(META.adultPin)
}
